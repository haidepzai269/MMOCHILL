package handlers

import (
	"net/http"

	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GetAppearance(c *gin.Context) {
	cfg, err := repository.GetSystemConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get appearance settings"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func UpdateAppearance(c *gin.Context) {
	var req models.UpdateAppearanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.UpdateSystemConfig(
		c.Request.Context(),
		req.SidebarBg,
		req.SidebarText,
		req.PageBg,
		req.PrimaryColor,
		req.ActiveEvent,
		req.EventMode,
		req.SoundClickUrl,
		req.SoundNotificationUrl,
		req.SoundSuccessUrl,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appearance settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appearance settings updated successfully"})
}
