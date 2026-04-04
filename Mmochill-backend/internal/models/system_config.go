package models

import "time"

type SystemConfig struct {
	ID                   int       `json:"id" db:"id"`
	SidebarBg            string    `json:"sidebar_bg" db:"sidebar_bg"`
	SidebarText          string    `json:"sidebar_text" db:"sidebar_text"`
	PageBg               string    `json:"page_bg" db:"page_bg"`
	PrimaryColor         string    `json:"primary_color" db:"primary_color"`
	ActiveEvent          string    `json:"active_event" db:"active_event"`
	EventMode            string    `json:"event_mode" db:"event_mode"`
	SoundClickUrl        string    `json:"sound_click_url" db:"sound_click_url"`
	SoundNotificationUrl string    `json:"sound_notification_url" db:"sound_notification_url"`
	SoundSuccessUrl      string    `json:"sound_success_url" db:"sound_success_url"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

type UpdateAppearanceRequest struct {
	SidebarBg            string `json:"sidebar_bg" binding:"required"`
	SidebarText          string `json:"sidebar_text" binding:"required"`
	PageBg               string `json:"page_bg" binding:"required"`
	PrimaryColor         string `json:"primary_color" binding:"required"`
	ActiveEvent          string `json:"active_event"`
	EventMode            string `json:"event_mode"`
	SoundClickUrl        string `json:"sound_click_url"`
	SoundNotificationUrl string `json:"sound_notification_url"`
	SoundSuccessUrl      string `json:"sound_success_url"`
}
