package handlers

import (
	"net/http"
	"strings"

	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GlobalSearch(c *gin.Context) {
	query := strings.ToLower(strings.TrimSpace(c.Query("q")))
	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"tasks":   []interface{}{},
			"actions": []interface{}{},
		})
		return
	}

	ctx := c.Request.Context()

	// 1. Search Tasks
	tasks, err := repository.SearchTasks(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search tasks"})
		return
	}
	if tasks == nil {
		tasks = []models.Task{}
	}

	// 2. Client-side actions (Lối tắt nhanh)
	allActions := []gin.H{
		{"title": "Rút tiền", "url": "/wallet", "icon": "Wallet"},
		{"title": "Làm nhiệm vụ", "url": "/tasks", "icon": "Zap"},
		{"title": "Hồ sơ cá nhân", "url": "/profile", "icon": "UserCog"},
		{"title": "Hỗ trợ", "url": "/support", "icon": "LifeBuoy"},
		{"title": "Vòng quay may mắn", "url": "/bonus", "icon": "Dizzy"},
	}

	matchedActions := []gin.H{}
	for _, action := range allActions {
		title := strings.ToLower(action["title"].(string))
		if strings.Contains(title, query) {
			matchedActions = append(matchedActions, action)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks":   tasks,
		"actions": matchedActions,
	})
}

