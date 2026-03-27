package handlers

import (
	"log"
	"net/http"

	"github.com/QuangVuDuc006/mmochill-backend/internal/ws"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // In production, should check origin
	},
}

func ServeSupportWS(c *gin.Context) {
	ticketID := c.Query("ticket_id")
	userID := c.GetString("user_id")

	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ticket_id is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WS Upgrade Error: %v", err)
		return
	}

	client := &ws.Client{
		ID:       userID,
		TicketID: ticketID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
	}

	ws.SupportHub.Register <- client

	// Start reader and writer
	go writePump(client)
	go readPump(client)
}

func readPump(c *ws.Client) {
	defer func() {
		ws.SupportHub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WS Read Error: %v", err)
			}
			break
		}
		// Currently only server-to-client broadcast is used for chat updates
		// We could handle typing indicators or other events here
	}
}

func writePump(c *ws.Client) {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Send
		if !ok {
			c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		w, err := c.Conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		// Send queued messages
		n := len(c.Send)
		for i := 0; i < n; i++ {
			w.Write([]byte{'\n'})
			w.Write(<-c.Send)
		}

		if err := w.Close(); err != nil {
			return
		}
	}
}
