package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GetTasks(c *gin.Context) {
	tasks, err := repository.GetAllTasks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tasks)
}

func GetActiveTasks(c *gin.Context) {
	userID, _ := c.Get("user_id")
	ctx := c.Request.Context()

	uid := userID.(string)
	
	// Lấy global version của task list (mặc định là 1)
	version, _ := database.RedisClient.Get(ctx, "tasks:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	
	cacheKey := fmt.Sprintf("tasks:v1:user_available:%s:%s", uid, version)

	// Try Redis Cache
	val, err := database.RedisClient.Get(ctx, cacheKey).Result()
	if err == nil {
		var tasks []models.Task
		if json.Unmarshal([]byte(val), &tasks) == nil {
			c.JSON(http.StatusOK, tasks)
			return
		}
	}

	// Lấy danh sách nhiệm vụ CHƯA hoàn thành của User từ DB
	tasks, err := repository.GetAvailableTasksForUser(ctx, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save to Redis (TTL 10 mins)
	if tasksJSON, err := json.Marshal(tasks); err == nil {
		database.RedisClient.Set(ctx, cacheKey, tasksJSON, 10*time.Minute)
	}

	c.JSON(http.StatusOK, tasks)
}

func GetTaskDetail(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	ctx := c.Request.Context()

	// 1. Kiểm tra Redis Cache
	cacheKey := "task:v1:detail:" + id
	val, err := database.RedisClient.Get(ctx, cacheKey).Result()
	
	var task *models.Task
	if err == nil {
		// Cache hit
		json.Unmarshal([]byte(val), &task)
	} else {
		// Cache miss
		task, err = repository.GetTaskByID(ctx, id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		// Lưu vào Redis (TTL 24 giờ)
		taskJSON, _ := json.Marshal(task)
		database.RedisClient.Set(ctx, cacheKey, taskJSON, 24*time.Hour)
	}

	// 2. Kiểm tra xem User đã hoàn thành chưa (biến mất theo tài khoản)
	isCompleted, _ := repository.IsTaskCompletedByUser(ctx, userID.(string), id)
	if isCompleted {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Nhiệm vụ này đã được bạn hoàn thành.",
			"is_completed": true,
		})
		return
	}

	// 2.5 Tính toán số vòng đã chơi riêng cho user này (không cache trực tiếp vào global task)
	if task.Provider == "taplayma" || task.Provider == "nhapma" || task.Provider == "traffic68" {
		query := `
            SELECT SUM(CASE WHEN claimed_at::DATE = CURRENT_DATE THEN 1 ELSE 0 END)
            FROM user_task_claims
            WHERE user_id = $1 AND task_id = $2 AND status = 'completed'`
		var completionsToday *int
		database.Pool.QueryRow(ctx, query, userID.(string), id).Scan(&completionsToday)
		if completionsToday != nil {
			task.CompletionsToday = *completionsToday
		} else {
			task.CompletionsToday = 0
		}
		task.MaxCompletionsToday = 3
	} else {
		task.MaxCompletionsToday = 1
	}

	c.JSON(http.StatusOK, task)
}

func CreateTask(c *gin.Context) {
	ctx := c.Request.Context()
	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.CreateTask(ctx, task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create global notification for new task
	notificationTitle := "Nhiệm vụ mới"
	notificationMsg := fmt.Sprintf("Admin vừa thêm nhiệm vụ mới: %s. Tham gia ngay!", task.Title)
	_ = repository.CreateGlobalNotification(ctx, notificationTitle, notificationMsg, "info", "task")
	database.RedisClient.Publish(ctx, "notifications:global", "update")

	// Invalidate global task list by incrementing version
	database.RedisClient.Incr(ctx, "tasks:v1:global_version")
	// Invalidate admin stats cache
	database.RedisClient.Del(ctx, "admin:stats:v1")
	// Notify SSE
	database.RedisClient.Publish(ctx, "admin:stats", "update")
	database.RedisClient.Publish(ctx, "tasks:global", "update")

	c.JSON(http.StatusCreated, gin.H{"message": "Task created successfully"})
}

func UpdateTask(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()
	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.UpdateTask(ctx, id, task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Redis Cache for detail and global list
	database.RedisClient.Del(ctx, "task:v1:detail:"+id)
	database.RedisClient.Incr(ctx, "tasks:v1:global_version")
	// Notify SSE
	database.RedisClient.Publish(ctx, "tasks:global", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}

func ToggleTaskActive(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.ToggleTaskActive(ctx, id, req.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Redis Cache for detail and global list
	database.RedisClient.Del(ctx, "task:v1:detail:"+id)
	database.RedisClient.Incr(ctx, "tasks:v1:global_version")
	// Notify SSE
	database.RedisClient.Publish(ctx, "tasks:global", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Task status toggled successfully"})
}

func DeleteTask(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()
	if err := repository.DeleteTask(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Redis Cache for detail and global list
	database.RedisClient.Del(ctx, "task:v1:detail:"+id)
	database.RedisClient.Incr(ctx, "tasks:v1:global_version")
	// Invalidate admin stats cache
	database.RedisClient.Del(ctx, "admin:stats:v1")
	// Notify SSE
	database.RedisClient.Publish(ctx, "admin:stats", "update")
	database.RedisClient.Publish(ctx, "tasks:global", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
