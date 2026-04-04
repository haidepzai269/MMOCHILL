package models

import (
	"time"

	"github.com/google/uuid"
)

type SiteComment struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    *uuid.UUID `json:"user_id" db:"user_id"` // NULL cho bot
	Username  string     `json:"username" db:"username"`
	AvatarURL string     `json:"avatar_url" db:"avatar_url"`
	Content   string     `json:"content" db:"content"`
	IsBot     bool       `json:"is_bot" db:"is_bot"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

type WeatherData struct {
	City        string  `json:"city"`
	Temperature float64 `json:"temperature"`
	Description string  `json:"description"`
	Icon        string  `json:"icon"`
}

type NewsItem struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	URL         string    `json:"url"`
	Source      string    `json:"source"`
	PublishedAt time.Time `json:"published_at"`
	Thumbnail   string    `json:"thumbnail"`
}

type Book struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Author      string    `json:"author" db:"author"`
	Description string    `json:"description" db:"description"`
	Thumbnail   string    `json:"thumbnail" db:"thumbnail"`
	Category    string    `json:"category" db:"category"`
	SourceURL   string    `json:"source_url" db:"source_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type BookChapter struct {
	ID           uuid.UUID `json:"id" db:"id"`
	BookID       uuid.UUID `json:"book_id" db:"book_id"`
	ChapterIndex int       `json:"chapter_index" db:"chapter_index"`
	Title        string    `json:"title" db:"title"`
	Content      string    `json:"content" db:"content"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}
