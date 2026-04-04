package repository

import (
	"context"
	"fmt"
	"log"

	"time"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CommunityRepository struct {
	pool *pgxpool.Pool
}

type NewsItem struct {
	ID          string    `json:"id"`
	Source      string    `json:"source"`
	Category    string    `json:"category"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	URL         string    `json:"url"`
	Thumbnail   string    `json:"thumbnail"`
	PublishedAt time.Time `json:"published_at"`
}

type CachedNews struct {
	URL     string   `json:"url"`
	Title   string   `json:"title"`
	Content []string `json:"content"`
	Images  []string `json:"images"`
}



func NewCommunityRepository() *CommunityRepository {
	return &CommunityRepository{pool: database.Pool}
}

func (r *CommunityRepository) CreateComment(ctx context.Context, comment *models.SiteComment) error {
	query := `
		INSERT INTO public.site_comments (user_id, username, avatar_url, content, is_bot, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(ctx, query,
		comment.UserID,
		comment.Username,
		comment.AvatarURL,
		comment.Content,
		comment.IsBot,
	).Scan(&comment.ID, &comment.CreatedAt)

	if err != nil {
		log.Printf("Repository error creating comment: %v", err)
		return err
	}
	return nil
}

func (r *CommunityRepository) GetComments(ctx context.Context, limit int, offset int) ([]models.SiteComment, error) {
	query := `
		SELECT id, user_id, username, avatar_url, content, is_bot, created_at
		FROM public.site_comments
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.SiteComment
	for rows.Next() {
		var c models.SiteComment
		err := rows.Scan(
			&c.ID,
			&c.UserID,
			&c.Username,
			&c.AvatarURL,
			&c.Content,
			&c.IsBot,
			&c.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, nil
}

func (r *CommunityRepository) DeleteComment(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM public.site_comments WHERE id = $1`
	commandTag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("comment not found")
	}
	return nil
}

func (r *CommunityRepository) GetDailyNews(ctx context.Context, category string, limit int) ([]NewsItem, error) {
	query := `
		SELECT id, source, category, title, description, url, thumbnail, published_at
		FROM public.daily_news
		WHERE category = $1
		ORDER BY published_at DESC
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, category, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var news []NewsItem
	for rows.Next() {
		var n NewsItem
		err := rows.Scan(&n.ID, &n.Source, &n.Category, &n.Title, &n.Description, &n.URL, &n.Thumbnail, &n.PublishedAt)
		if err != nil {
			continue
		}
		news = append(news, n)
	}
	return news, nil
}

func (r *CommunityRepository) GetCachedNews(ctx context.Context, url string) (*CachedNews, error) {
	var cn CachedNews
	err := r.pool.QueryRow(ctx, "SELECT url, title, content, images FROM public.news_cache WHERE url = $1", url).
		Scan(&cn.URL, &cn.Title, &cn.Content, &cn.Images)
	if err != nil {
		return nil, err
	}
	return &cn, nil
}

func (r *CommunityRepository) SaveNewsCache(ctx context.Context, data *CachedNews) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO public.news_cache (url, title, content, images)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (url) DO UPDATE SET title = $2, content = $3, images = $4
	`, data.URL, data.Title, data.Content, data.Images)
	return err
}

func (r *CommunityRepository) DeleteDailyNewsByURL(ctx context.Context, url string) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM public.daily_news WHERE url = $1", url)
	return err
}

