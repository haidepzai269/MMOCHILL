package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
	"github.com/QuangVuDuc006/mmochill-backend/internal/ws"
	"github.com/gin-gonic/gin"
)

// User Handlers

func CreateTicket(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		Subject     string                `json:"subject" binding:"required"`
		Description string                `json:"description" binding:"required"`
		Priority    models.TicketPriority `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Priority == "" {
		req.Priority = models.PriorityMedium
	}

	ticket := &models.SupportTicket{
		UserID:      userID,
		Subject:     req.Subject,
		Description: req.Description,
		Status:      models.StatusOpen,
		Priority:    req.Priority,
	}

	err := repository.CreateTicket(c.Request.Context(), ticket)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ticket"})
		return
	}

	// Notify Admin via Telegram & SSE
	go func() {
		msg := fmt.Sprintf("🎫 <b>New Support Ticket</b>\n\n<b>Subject:</b> %s\n<b>Priority:</b> %s\n<b>User ID:</b> %s\n\nCheck at: /admin/support",
			ticket.Subject, ticket.Priority, ticket.UserID)
		utils.SendTelegramNotification(msg)

		// Notify Admin Sidebar via Redis
		database.RedisClient.Publish(c.Request.Context(), "notifications:admin", "support_update")
	}()

	c.JSON(http.StatusCreated, ticket)
}

func GetUserTickets(c *gin.Context) {
	userID := c.GetString("user_id")
	tickets, err := repository.GetTicketsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tickets"})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func GetTicketDetail(c *gin.Context) {
	ticketID := c.Param("id")
	userID := c.GetString("user_id")
	userRole := c.GetString("role")

	ticket, messages, err := repository.GetTicketDetail(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	// Authorization check: Only owner or admin can view
	if userRole != "admin" && ticket.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ticket":   ticket,
		"messages": messages,
	})
}

func ReplyTicket(c *gin.Context) {
	ticketID := c.Param("id")
	userID := c.GetString("user_id")
	userRole := c.GetString("role")

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get ticket to check ownership/status
	ticket, _, err := repository.GetTicketDetail(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	isAdmin := userRole == "admin"
	if !isAdmin && ticket.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	msg := &models.SupportMessage{
		TicketID: ticketID,
		SenderID: userID,
		IsAdmin:  isAdmin,
		Message:  req.Message,
	}

	err = repository.AddSupportMessage(c.Request.Context(), msg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Notification logic
	if isAdmin {
		// Update status to pending (replied by admin)
		repository.UpdateTicketStatus(c.Request.Context(), ticketID, models.StatusPending)

		// Create in-app notification for user ONLY if they are not currently in the chat room
		if !ws.SupportHub.IsUserInRoom(ticketID, ticket.UserID) {
			repository.CreateNotification(
				c.Request.Context(),
				nil,
				ticket.UserID,
				"Phản hồi hỗ trợ mới",
				fmt.Sprintf("Admin đã phản hồi ticket: %s", ticket.Subject),
				"support",
				"system",
			)
			// Notify User SSE for the bell icon
			database.RedisClient.Publish(c.Request.Context(), "notifications:user:"+ticket.UserID, "update")
		}
	} else {
		// Update status back to open if user replies
		if ticket.Status != models.StatusOpen {
			repository.UpdateTicketStatus(c.Request.Context(), ticketID, models.StatusOpen)
		}
		// Notify Admin via Telegram & SSE
		go func() {
			teleMsg := fmt.Sprintf("💬 <b>New Reply on Ticket</b>\n\n<b>Subject:</b> %s\n<b>User:</b> %s\n<b>Message:</b> %s",
				ticket.Subject, ticket.UserEmail, msg.Message)
			utils.SendTelegramNotification(teleMsg)

			// Notify Admin Sidebar via Redis
			database.RedisClient.Publish(c.Request.Context(), "notifications:admin", "support_update")
		}()
	}

	// Broadcast via WebSocket
	if msgJSON, err := json.Marshal(msg); err == nil {
		ws.SupportHub.Broadcast <- ws.MessagePayload{
			TicketID: ticketID,
			Data:     msgJSON,
		}
	}

	c.JSON(http.StatusCreated, msg)
}

// Admin Handlers

func AdminGetAllTickets(c *gin.Context) {
	status := c.Query("status")
	tickets, err := repository.GetAllTickets(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tickets"})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func AdminUpdateTicketStatus(c *gin.Context) {
	ticketID := c.Param("id")
	var req struct {
		Status models.TicketStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.UpdateTicketStatus(c.Request.Context(), ticketID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}
