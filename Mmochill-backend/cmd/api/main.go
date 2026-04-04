package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/handlers"
	"github.com/QuangVuDuc006/mmochill-backend/internal/middleware"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/services"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
	"github.com/QuangVuDuc006/mmochill-backend/internal/ws"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	os.Setenv("GOGC", "50")           // GC thường xuyên hơn
	os.Setenv("GOMEMLIMIT", "380MiB") // Hard limit cho Render free tier
}

func main() {
	// Load .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Connect to Database
	database.ConnectDB()
	database.ConnectRedis()
	utils.InitWebAuthn()

	// Migration: Add is_vip column if not exists
	log.Println("Database: Running migrations...")
	database.Pool.Exec(context.Background(), "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;")
	log.Println("Database: Migrations finished.")

	// Đảm bảo tài khoản này luôn là Admin
	repository.EnsureUserIsAdmin("haidepzai2692006@gmail.com")

	// Initialize Router
	// Initializing components
	go ws.SupportHub.Run()
	ctx := context.Background()
	go services.StartLeaderboardCron(ctx)
	go services.StartNewsCron(ctx)
	
	// Khởi tạo danh sách sách kinh điển
	bookService := &services.BookService{}
	bookService.InitializeBooks(ctx)

	r := gin.Default()

	// CORS Middleware (Corrected for Credentials)
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes v1 (Spec: prompt-api.txt)
	v1 := r.Group("/api/v1")
	{
		// Health check (dùng để ping tránh cold start)
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
				"time":   time.Now().Unix(),
			})
		})

		v1.GET("/appearance", handlers.GetAppearance)

		auth := v1.Group("/auth")
		{
			auth.POST("/register", middleware.RateLimit(100, time.Minute), handlers.Register)
			auth.POST("/login", middleware.RateLimit(100, time.Minute), handlers.Login)
			auth.POST("/forgot-password", handlers.ForgotPassword)
			auth.POST("/reset-password", handlers.ResetPassword)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.GET("/me", middleware.AuthRequired(), handlers.GetProfile)
			auth.PATCH("/profile", middleware.AuthRequired(), handlers.UpdateProfile)
			auth.PATCH("/change-password", middleware.AuthRequired(), handlers.ChangePassword)
			auth.PATCH("/change-email", middleware.AuthRequired(), handlers.ChangeEmail)
			auth.POST("/avatar-upload", middleware.AuthRequired(), handlers.UploadAvatar)
			auth.GET("/referral", middleware.AuthRequired(), handlers.GetReferralStats)
			auth.PATCH("/settings/sound", middleware.AuthRequired(), handlers.UpdateSoundPreference)

			// WebAuthn routes
			auth.GET("/webauthn/register/begin", middleware.AuthRequired(), handlers.BeginRegistration)
			auth.POST("/webauthn/register/finish", middleware.AuthRequired(), handlers.FinishRegistration)
			auth.POST("/webauthn/login/begin", handlers.BeginLogin)
			auth.POST("/webauthn/login/finish", handlers.FinishLogin)
		}

		// Tasks (cần JWT)
		tasks := v1.Group("/tasks", middleware.AuthRequired())
		{
			tasks.GET("/", handlers.GetTasks)
			tasks.GET("/active", handlers.GetActiveTasks)
			tasks.GET("/:id", handlers.GetTaskDetail)
			tasks.POST("/:id/claim", middleware.RateLimit(20, time.Hour), handlers.ClaimTask)
		}

		// Callback (KHÔNG cần JWT - dùng bypass_token)
		v1.GET("/callback/bypass", handlers.BypassCallback)

		// Withdrawals (cần JWT)
		withdrawals := v1.Group("/withdrawals", middleware.AuthRequired())
		{
			withdrawals.POST("/", middleware.RateLimit(100, time.Hour), handlers.RequestWithdrawal)
		}

		// Bonus (cần JWT)
		bonus := v1.Group("/bonus", middleware.AuthRequired())
		{
			bonus.GET("/status", handlers.GetCheckInStatus)
			bonus.POST("/check-in", handlers.CheckIn)
			bonus.POST("/spin", handlers.LuckySpin)
		}

		notifications := v1.Group("/notifications", middleware.AuthRequired())
		{
			notifications.GET("/", handlers.GetNotifications)
			notifications.GET("/stream", handlers.StreamNotifications)
			notifications.GET("/:id", handlers.GetNotificationDetail)
			notifications.PATCH("/:id/read", handlers.MarkAsRead)
			notifications.PATCH("/read-all", handlers.MarkNotificationsAllRead)
		}

		// Support (cần JWT)
		support := v1.Group("/support", middleware.AuthRequired())
		{
			support.POST("/", handlers.CreateTicket)
			support.GET("/", handlers.GetUserTickets)
			support.GET("/:id", handlers.GetTicketDetail)
			support.POST("/:id/reply", handlers.ReplyTicket)
			support.GET("/ws", handlers.ServeSupportWS)
		}

		v1.GET("/search", middleware.AuthRequired(), handlers.GlobalSearch)
		v1.GET("/leaderboard/stream", middleware.AuthRequired(), handlers.StreamLeaderboard)

		// Community (Cần VIP hoặc Admin)
		community := v1.Group("/community", middleware.AuthRequired())
		{
			community.Use(func(c *gin.Context) {
				role, _ := c.Get("role")
				
				// Lấy full profile để check is_vip (vì JWT có thể chưa có is_vip)
				uid, _ := c.Get("user_id")
				user, err := repository.GetUserByID(uid.(string))
				
				// VIP được định nghĩa là có IsVIP = true HOẶC PeakBalance >= 2,000,000
				isVipMember := user.IsVIP || user.PeakBalance >= 2000000
				
				if err != nil || (role != "admin" && !isVipMember) {
					c.JSON(http.StatusForbidden, gin.H{
						"error": "Tính năng cộng đồng chỉ dành cho thành viên VIP!",
						"is_not_vip": true,
					})
					c.Abort()
					return
				}
				c.Next()
			})

			communityHandler := handlers.NewCommunityHandler()
			community.GET("/weather", communityHandler.GetWeather)
			community.GET("/news/vietnam", communityHandler.GetVietnamNews)
			community.GET("/news/content", communityHandler.GetNewsContent)
			community.GET("/books", communityHandler.GetAllBooks)
			community.GET("/books/:id/chapters/:chapter", communityHandler.GetBookChapter)
			community.GET("/comments", communityHandler.GetComments)
			community.POST("/comments", communityHandler.CreateComment)
		}


		// Admin (cần JWT + role=admin)
		admin := v1.Group("/admin", middleware.AuthRequired(), middleware.AdminRequired())
		{
			admin.GET("/stream", handlers.StreamAdmin)
			admin.GET("/stats", handlers.GetAdminStats)
			admin.GET("/alerts", handlers.GetAdminAlerts)
			admin.POST("/alerts/mark-read", handlers.MarkAdminAlertsAsRead)
			admin.POST("/notifications/global", handlers.AdminCreateGlobalNotification)
			admin.GET("/notifications", handlers.AdminGetSentNotifications)
			admin.DELETE("/notifications", handlers.AdminDeleteNotification)
			admin.POST("/notifications/bulk-delete", handlers.AdminBulkDeleteNotification)
			admin.GET("/users", handlers.GetUsers)
			admin.PUT("/users/:id/ban", handlers.BanUser)
			admin.GET("/withdrawals", handlers.GetAdminWithdrawals)
			admin.PUT("/withdrawals/:id/approve", handlers.ApproveWithdrawal)
			admin.PUT("/withdrawals/:id/reject", handlers.RejectWithdrawal)
			admin.GET("/audit-logs", handlers.GetAuditLogs)

			admin.GET("/tasks", handlers.GetTasks)
			admin.POST("/tasks", handlers.CreateTask)
			admin.PUT("/tasks/:id", handlers.UpdateTask)
			admin.PATCH("/tasks/:id/toggle", handlers.ToggleTaskActive)
			admin.DELETE("/tasks/:id", handlers.DeleteTask)
			admin.GET("/tasks/claims", handlers.GetAdminClaims)

			// Admin Support
			admin.GET("/support", handlers.AdminGetAllTickets)
			admin.GET("/support/:id", handlers.GetTicketDetail)    // Reuse user handler logic for detail
			admin.POST("/support/:id/reply", handlers.ReplyTicket) // Reuse user handler logic for reply (isAdmin=true handled inside)
			admin.PATCH("/support/:id/status", handlers.AdminUpdateTicketStatus)

			// Admin Appearance
			admin.PUT("/appearance", handlers.UpdateAppearance)

			// Admin Community
			communityHandler := handlers.NewCommunityHandler()
			admin.POST("/community/comments/bot", communityHandler.AdminCreateBotComment)
			admin.DELETE("/community/comments/:id", communityHandler.AdminDeleteComment)
		}

	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("MMOChill Backend starting on :%s...", port)
	r.Run(":" + port)
}
