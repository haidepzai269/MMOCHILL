package repository

import (
	"context"
	"fmt"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func GetSystemConfig(ctx context.Context) (*models.SystemConfig, error) {
	var cfg models.SystemConfig
	query := `SELECT id, sidebar_bg, sidebar_text, page_bg, primary_color, active_event, event_mode, 
	          sound_click_url, sound_notification_url, sound_success_url, updated_at 
	          FROM system_configs WHERE id = 1`
	
	err := database.Pool.QueryRow(ctx, query).Scan(
		&cfg.ID, &cfg.SidebarBg, &cfg.SidebarText, &cfg.PageBg, &cfg.PrimaryColor, &cfg.ActiveEvent, &cfg.EventMode,
		&cfg.SoundClickUrl, &cfg.SoundNotificationUrl, &cfg.SoundSuccessUrl, &cfg.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get system config: %w", err)
	}
	return &cfg, nil
}

func UpdateSystemConfig(ctx context.Context, sidebarBg, sidebarText, pageBg, primaryColor, activeEvent, eventMode, clickSound, noteSound, successSound string) error {
	query := `UPDATE system_configs 
	          SET sidebar_bg = $1, sidebar_text = $2, page_bg = $3, primary_color = $4, active_event = $5, event_mode = $6, 
	              sound_click_url = $7, sound_notification_url = $8, sound_success_url = $9, updated_at = NOW() 
	          WHERE id = 1`
	
	_, err := database.Pool.Exec(ctx, query, sidebarBg, sidebarText, pageBg, primaryColor, activeEvent, eventMode, clickSound, noteSound, successSound)
	if err != nil {
		return fmt.Errorf("failed to update system config: %w", err)
	}
	return nil
}
