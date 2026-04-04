package handlers

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/PuerkitoBio/goquery"
)

type CommunityHandler struct {
	repo        *repository.CommunityRepository
	bookService *services.BookService
}

func NewCommunityHandler() *CommunityHandler {
	return &CommunityHandler{
		repo:        repository.NewCommunityRepository(),
		bookService: &services.BookService{},
	}
}

func (h *CommunityHandler) GetWeather(c *gin.Context) {
	lat := c.DefaultQuery("lat", "21.0285")
	lon := c.DefaultQuery("lon", "105.8542")

	url := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current_weather=true", lat, lon)
	
	resp, err := http.Get(url)
	if err != nil {
		c.JSON(500, gin.H{"error": "Không thể lấy dữ liệu thời tiết"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		CurrentWeather struct {
			Temperature float64 `json:"temperature"`
			WeatherCode int     `json:"weathercode"`
		} `json:"current_weather"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(500, gin.H{"error": "Lỗi giải mã dữ liệu thời tiết"})
		return
	}

	weatherDesc := "Trời đẹp"
	switch result.CurrentWeather.WeatherCode {
	case 0: weatherDesc = "Trời trong xanh"
	case 1, 2, 3: weatherDesc = "Ít mây"
	case 45, 48: weatherDesc = "Sương mù"
	case 51, 53, 55: weatherDesc = "Mưa phùn"
	case 61, 63, 65: weatherDesc = "Mưa nhẹ"
	case 71, 73, 75: weatherDesc = "Tuyết"
	case 80, 81, 82: weatherDesc = "Mưa rào"
	case 95, 96, 99: weatherDesc = "Dông sét"
	}

	c.JSON(200, models.WeatherData{
		City:        "Hà Nội",
		Temperature: result.CurrentWeather.Temperature,
		Description: weatherDesc,
		Icon:        fmt.Sprintf("%d", result.CurrentWeather.WeatherCode),
	})
}

func (h *CommunityHandler) GetVietnamNews(c *gin.Context) {
	category := c.Query("category")
	if category == "" {
		category = "science" // Mặc định
	}

	// Ưu tiên đọc từ Redis
	if database.RedisClient != nil {
		redisKey := fmt.Sprintf("news:category:%s", category)
		val, err := database.RedisClient.Get(c.Request.Context(), redisKey).Result()
		if err == nil {
			var news []repository.NewsItem
			if jsonErr := json.Unmarshal([]byte(val), &news); jsonErr == nil {
				c.JSON(200, news)
				return
			}
		}
	}

	// Fallback: lấy từ Database
	news, err := h.repo.GetDailyNews(c.Request.Context(), category, 20)
	if err != nil {
		c.JSON(500, gin.H{"error": "Lỗi lấy tin tức từ database"})
		return
	}

	c.JSON(200, news)
}

func (h *CommunityHandler) GetAllBooks(c *gin.Context) {
	books, err := h.bookService.GetAllBooks(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": "Lỗi lấy danh sách sách"})
		return
	}
	c.JSON(200, books)
}

func (h *CommunityHandler) GetBookChapter(c *gin.Context) {
	bookIDStr := c.Param("id")
	chapterIndex, _ := strconv.Atoi(c.Param("chapter"))

	bookID, err := uuid.Parse(bookIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID sách không hợp lệ"})
		return
	}

	chapter, err := h.bookService.GetOrCrawlChapter(c.Request.Context(), bookID, chapterIndex)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Lỗi tải nội dung chương: %v", err)})
		return
	}

	c.JSON(200, chapter)
}

func (h *CommunityHandler) GetComments(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	comments, err := h.repo.GetComments(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": "Lỗi lấy bình luận"})
		return
	}
	c.JSON(200, comments)
}

func (h *CommunityHandler) CreateComment(c *gin.Context) {
	var input struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Nội dung bình luận là bắt buộc"})
		return
	}

	userIDStr := c.MustGet("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(401, gin.H{"error": "Token không hợp lệ"})
		return
	}

	user, err := repository.GetUserByID(userID.String())
	if err != nil {
		c.JSON(500, gin.H{"error": "Lỗi lấy thông tin người dùng"})
		return
	}

	comment := &models.SiteComment{
		UserID:    &userID,
		Username:  user.Username,
		AvatarURL: user.AvatarURL,
		Content:   input.Content,
		IsBot:     false,
	}

	if err := h.repo.CreateComment(c.Request.Context(), comment); err != nil {
		c.JSON(500, gin.H{"error": "Lỗi lưu bình luận"})
		return
	}

	c.JSON(201, comment)
}

func (h *CommunityHandler) AdminCreateBotComment(c *gin.Context) {
	var input struct {
		Username  string `json:"username" binding:"required"`
		AvatarURL string `json:"avatar_url"`
		Content   string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	comment := &models.SiteComment{
		UserID:    nil,
		Username:  input.Username,
		AvatarURL: input.AvatarURL,
		Content:   input.Content,
		IsBot:     true,
	}

	if err := h.repo.CreateComment(c.Request.Context(), comment); err != nil {
		c.JSON(500, gin.H{"error": "Lỗi lưu bình luận bot"})
		return
	}

	c.JSON(201, comment)
}

func (h *CommunityHandler) AdminDeleteComment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID không hợp lệ"})
		return
	}

	if err := h.repo.DeleteComment(c.Request.Context(), id); err != nil {
		c.JSON(500, gin.H{"error": "Lỗi khi xóa bình luận"})
		return
	}

	c.JSON(200, gin.H{"message": "Đã xóa bình luận thành công"})
}

func (h *CommunityHandler) GetNewsContent(c *gin.Context) {
	articleURL := c.Query("url")
	if articleURL == "" {
		c.JSON(400, gin.H{"error": "URL bài báo là bắt buộc"})
		return
	}

	urlHash := fmt.Sprintf("%x", md5.Sum([]byte(articleURL)))
	redisKey := fmt.Sprintf("news:article:%s", urlHash)

	// Bước 1: Kiểm tra Redis cache (nhanh nhất)
	if database.RedisClient != nil {
		val, err := database.RedisClient.Get(c.Request.Context(), redisKey).Result()
		if err == nil {
			var cached repository.CachedNews
			if jsonErr := json.Unmarshal([]byte(val), &cached); jsonErr == nil {
				c.JSON(200, cached)
				return
			}
		}
	}

	// Bước 2: Kiểm tra Postgres cache
	cached, err := h.repo.GetCachedNews(c.Request.Context(), articleURL)
	if err == nil && cached != nil {
		// Thấy trong DB cache → đưa lên Redis luôn (warm-up)
		if database.RedisClient != nil {
			if data, jsonErr := json.Marshal(cached); jsonErr == nil {
				database.RedisClient.Set(c.Request.Context(), redisKey, data, 24*time.Hour)
			}
		}
		c.JSON(200, cached)
		return
	}

	// Bước 3: Fallback — Scraping trực tiếp

	var userAgent string
	if strings.Contains(articleURL, "vnexpress") {
		userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	} else if strings.Contains(articleURL, "tuoitre") {
		userAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
	} else if strings.Contains(articleURL, "dantri") {
		userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
	} else if strings.Contains(articleURL, "bbc") {
		userAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", articleURL, nil)
	if userAgent != "" {
		req.Header.Set("User-Agent", userAgent)
	} else {
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(500, gin.H{"error": "Không thể truy cập bài báo"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		// TỰ ĐỘNG XÓA BÀI NẾU LỖI 404/403...
		h.repo.DeleteDailyNewsByURL(c.Request.Context(), articleURL)
		c.JSON(404, gin.H{"error": "Bài báo không còn tồn tại hoặc bị chặn. Đã gỡ khỏi danh sách."})
		return
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		c.JSON(500, gin.H{"error": "Lỗi phân tích nội dung HTML"})
		return
	}

	title := doc.Find("h1").First().Text()
	var content []string
	var images []string

	if strings.Contains(articleURL, "vnexpress.net") {
		doc.Find("article.fck_detail p.Normal").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if text != "" {
				content = append(content, text)
			}
		})
		doc.Find("article.fck_detail img").Each(func(i int, s *goquery.Selection) {
			if src, ok := s.Attr("data-src"); ok {
				images = append(images, src)
			} else if src, ok := s.Attr("src"); ok {
				images = append(images, src)
			}
		})
	} else if strings.Contains(articleURL, "tuoitre.vn") {
		doc.Find("div#main-detail-body p, div.fck p").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if text != "" {
				content = append(content, text)
			}
		})
		doc.Find("div#main-detail-body img, div.fck img").Each(func(i int, s *goquery.Selection) {
			if src, ok := s.Attr("src"); ok {
				images = append(images, src)
			}
		})
	} else if strings.Contains(articleURL, "dantri.com.vn") {
		doc.Find("div.singular-content p, div.fck_detail p").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if text != "" {
				content = append(content, text)
			}
		})
		doc.Find("div.singular-content img").Each(func(i int, s *goquery.Selection) {
			if src, ok := s.Attr("src"); ok {
				images = append(images, src)
			}
		})
	} else if strings.Contains(articleURL, "bbc.co.uk") || strings.Contains(articleURL, "bbc.com") {
		doc.Find("article div[data-component='text-block']").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if text != "" {
				content = append(content, text)
			}
		})
	} else {
		doc.Find("p").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if len(text) > 60 {
				content = append(content, text)
			}
		})
	}

	if len(content) == 0 {
		// TỰ ĐỘNG XÓA NẾU KHÔNG CÀO ĐƯỢC NỘI DUNG (READER MODE FAIL)
		h.repo.DeleteDailyNewsByURL(c.Request.Context(), articleURL)
		c.JSON(404, gin.H{"error": "Không tìm thấy nội dung bài báo. Đã gỡ khỏi danh sách."})
		return
	}

	result := &repository.CachedNews{
		URL:     articleURL,
		Title:   strings.TrimSpace(title),
		Content: content,
		Images:  images,
	}

	_ = h.repo.SaveNewsCache(c.Request.Context(), result)

	// LƯU VÀO REDIS LUÔN (Nếu có)
	if database.RedisClient != nil {
		urlHash := fmt.Sprintf("%x", md5.Sum([]byte(articleURL)))
		redisKey := fmt.Sprintf("news:article:%s", urlHash)
		if data, err := json.Marshal(result); err == nil {
			_ = database.RedisClient.Set(c.Request.Context(), redisKey, data, 24*time.Hour).Err()
		}
	}

	c.JSON(200, result)
}
