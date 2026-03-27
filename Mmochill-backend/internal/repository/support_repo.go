package repository

import (
	"context"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func CreateTicket(ctx context.Context, ticket *models.SupportTicket) error {
	query := `INSERT INTO support_tickets (user_id, subject, description, status, priority, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id, created_at, updated_at`
	err := database.Pool.QueryRow(ctx, query,
		ticket.UserID, ticket.Subject, ticket.Description, ticket.Status, ticket.Priority).
		Scan(&ticket.ID, &ticket.CreatedAt, &ticket.UpdatedAt)
	return err
}

func AddSupportMessage(ctx context.Context, msg *models.SupportMessage) error {
	query := `INSERT INTO support_messages (ticket_id, sender_id, is_admin, message, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, created_at`
	err := database.Pool.QueryRow(ctx, query,
		msg.TicketID, msg.SenderID, msg.IsAdmin, msg.Message).
		Scan(&msg.ID, &msg.CreatedAt)
	if err == nil {
		// Update ticket's updated_at
		database.Pool.Exec(ctx, "UPDATE support_tickets SET updated_at = NOW() WHERE id = $1", msg.TicketID)
	}
	return err
}

func GetTicketsByUserID(ctx context.Context, userID string) ([]models.SupportTicket, error) {
	query := `SELECT id, user_id, subject, description, status, priority, created_at, updated_at 
            FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC`
	rows, err := database.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickets []models.SupportTicket
	for rows.Next() {
		var t models.SupportTicket
		err := rows.Scan(&t.ID, &t.UserID, &t.Subject, &t.Description, &t.Status, &t.Priority, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		tickets = append(tickets, t)
	}
	return tickets, nil
}

func GetAllTickets(ctx context.Context, status string) ([]models.SupportTicket, error) {
	query := `SELECT t.id, t.user_id, u.email, t.subject, t.description, t.status, t.priority, t.created_at, t.updated_at 
            FROM support_tickets t
            JOIN users u ON t.user_id = u.id`

	var rows interface{}
	var err error
	if status != "" {
		query += " WHERE t.status = $1 ORDER BY t.updated_at DESC"
		rows, err = database.Pool.Query(ctx, query, status)
	} else {
		query += " ORDER BY t.updated_at DESC"
		rows, err = database.Pool.Query(ctx, query)
	}

	if err != nil {
		return nil, err
	}
	pgxRows := rows.(interface {
		Next() bool
		Scan(dest ...any) error
		Close()
	})
	defer pgxRows.Close()

	var tickets []models.SupportTicket
	for pgxRows.Next() {
		var t models.SupportTicket
		err := pgxRows.Scan(&t.ID, &t.UserID, &t.UserEmail, &t.Subject, &t.Description, &t.Status, &t.Priority, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		tickets = append(tickets, t)
	}
	return tickets, nil
}

func GetTicketDetail(ctx context.Context, ticketID string) (*models.SupportTicket, []models.SupportMessage, error) {
	// Get Ticket
	ticketQuery := `SELECT t.id, t.user_id, u.email, t.subject, t.description, t.status, t.priority, t.created_at, t.updated_at 
                   FROM support_tickets t
                   JOIN users u ON t.user_id = u.id
                   WHERE t.id = $1`
	ticket := &models.SupportTicket{}
	err := database.Pool.QueryRow(ctx, ticketQuery, ticketID).Scan(
		&ticket.ID, &ticket.UserID, &ticket.UserEmail, &ticket.Subject, &ticket.Description, &ticket.Status, &ticket.Priority, &ticket.CreatedAt, &ticket.UpdatedAt)
	if err != nil {
		return nil, nil, err
	}

	// Get Messages
	msgQuery := `SELECT id, ticket_id, sender_id, is_admin, message, created_at 
                FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC`
	rows, err := database.Pool.Query(ctx, msgQuery, ticketID)
	if err != nil {
		return ticket, nil, nil
	}
	defer rows.Close()

	var messages []models.SupportMessage
	for rows.Next() {
		var m models.SupportMessage
		err := rows.Scan(&m.ID, &m.TicketID, &m.SenderID, &m.IsAdmin, &m.Message, &m.CreatedAt)
		if err != nil {
			return ticket, nil, err
		}
		messages = append(messages, m)
	}

	return ticket, messages, nil
}

func UpdateTicketStatus(ctx context.Context, ticketID string, status models.TicketStatus) error {
	query := `UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := database.Pool.Exec(ctx, query, status, ticketID)
	return err
}
