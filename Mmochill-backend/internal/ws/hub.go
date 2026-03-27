package ws

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// Client represents a single websocket connection
type Client struct {
	ID       string // User ID
	TicketID string // Current ticket being viewed
	Conn     *websocket.Conn
	Send     chan []byte
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients by TicketID
	Rooms map[string]map[*Client]bool

	// Register requests from clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client

	// Broadcast messages to a specific ticket room
	Broadcast chan MessagePayload

	mu sync.Mutex
}

type MessagePayload struct {
	TicketID string          `json:"ticket_id"`
	Data     json.RawMessage `json:"data"`
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan MessagePayload),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if h.Rooms[client.TicketID] == nil {
				h.Rooms[client.TicketID] = make(map[*Client]bool)
			}
			h.Rooms[client.TicketID][client] = true
			h.mu.Unlock()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Rooms[client.TicketID]; ok {
				if _, ok := h.Rooms[client.TicketID][client]; ok {
					delete(h.Rooms[client.TicketID], client)
					close(client.Send)
					if len(h.Rooms[client.TicketID]) == 0 {
						delete(h.Rooms, client.TicketID)
					}
				}
			}
			h.mu.Unlock()

		case payload := <-h.Broadcast:
			h.mu.Lock()
			if clients, ok := h.Rooms[payload.TicketID]; ok {
				for client := range clients {
					select {
					case client.Send <- payload.Data:
					default:
						close(client.Send)
						delete(h.Rooms[payload.TicketID], client)
						if len(h.Rooms[payload.TicketID]) == 0 {
							delete(h.Rooms, payload.TicketID)
						}
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) IsUserInRoom(ticketID string, userID string) bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	clients, ok := h.Rooms[ticketID]
	if !ok {
		return false
	}
	for client := range clients {
		if client.ID == userID {
			return true
		}
	}
	return false
}

// Global Hub instance
var SupportHub = NewHub()
