package services

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/mmcdole/gofeed"
)

type NewsArticle struct {
	Source      string
	Category    string
	Title       string
	Description string
	URL         string
	Thumbnail   string
	PublishedAt time.Time
}

var categories = map[string][]string{
	"finance": {
		"https://vnexpress.net/rss/kinh-doanh.rss",
		"https://tuoitre.vn/rss/kinh-doanh.rss",
		"https://dantri.com.vn/rss/kinh-doanh.rss",
		"https://vnexpress.net/rss/the-gioi.rss",
		"https://tuoitre.vn/rss/the-gioi.rss",
		"https://dantri.com.vn/rss/the-gioi.rss",
	},
}

func StartNewsCron(ctx context.Context) {
	// Chạy lần đầu ngay khi start server
	go FetchAndRefreshNews(ctx)

	for {
		now := time.Now()
		// Chuyển sang giờ Việt Nam (GMT+7)
		loc, _ := time.LoadLocation("Asia/Ho_Chi_Minh")
		nowVN := now.In(loc)

		// Tính toán thời gian cho đến 7:00 AM VN ngày mai
		nextRun := time.Date(nowVN.Year(), nowVN.Month(), nowVN.Day(), 7, 0, 0, 0, loc)
		if nowVN.After(nextRun) {
			nextRun = nextRun.Add(24 * time.Hour)
		}

		diff := nextRun.Sub(nowVN)
		log.Printf("News Cron: Next refresh in %v (at 07:00 AM VN)", diff)

		timer := time.NewTimer(diff)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
			FetchAndRefreshNews(ctx)
		}
	}
}

func FetchAndRefreshNews(ctx context.Context) {
	log.Println("News Cron: Refreshing daily news...")

	// 1. CHUẨN BỊ FETCH DỮ LIỆU MỚI (KHÔNG XÓA DB NGAY)
	type CollectedArticle struct {
		Source      string
		Category    string
		Title       string
		Description string
		URL         string
		Thumbnail   string
		PublishedAt time.Time
		// Nội dung chi tiết đã cào (để tái sử dụng push Redis, tránh cào lại)
		FullTitle   string
		FullContent []string
		Images      []string
	}
	var allNewArticles []CollectedArticle

	fp := gofeed.NewParser()

	for category, urls := range categories {
		for _, url := range urls {
			feed, err := fp.ParseURL(url)
			if err != nil {
				log.Printf("News Cron: Failed to parse RSS %s: %v", url, err)
				continue
			}

			source := "Unknown"
			var userAgent string
			if strings.Contains(url, "vnexpress") {
				source = "VNExpress"
				userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
			} else if strings.Contains(url, "tuoitre") {
				source = "Tuổi Trẻ"
				userAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
			} else if strings.Contains(url, "dantri") {
				source = "Dân Trí"
				userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
			} else if strings.Contains(url, "bbc") {
				source = "BBC News"
				userAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
			}

			count := 0
			// Giới hạn duyệt tối đa 30 bài từ RSS để tìm đủ 10 bài "đọc được"
			for i, item := range feed.Items {
				if count >= 10 || i >= 30 {
					break
				}

				// Cào nội dung bài báo (vừa kiểm tra độ "đọc được" vừa lưu kết quả để tái sử dụng cho Redis)
				scrapedTitle, scrapedContent, scrapedImages, scrapeErr := ScrapeFullContent(item.Link, userAgent)
				if scrapeErr != nil || len(scrapedContent) == 0 {
					log.Printf("News Cron: Skipping unreadable article: %s", item.Link)
					continue
				}

				thumbnail := ""
				// ... (giữ nguyên logic lấy thumbnail)
				if len(item.Enclosures) > 0 {
					thumbnail = item.Enclosures[0].URL
				} else if item.Extensions["media"] != nil && item.Extensions["media"]["content"] != nil {
					thumbnail = item.Extensions["media"]["content"][0].Attrs["url"]
				} else if strings.Contains(item.Description, "<img") {
					doc, _ := goquery.NewDocumentFromReader(strings.NewReader(item.Description))
					src, ok := doc.Find("img").Attr("src")
					if ok {
						thumbnail = src
					}
				}

				description := item.Description
				if strings.Contains(description, "<") {
					doc, _ := goquery.NewDocumentFromReader(strings.NewReader(description))
					description = doc.Text()
				}

				pubAt := time.Now()
				if item.PublishedParsed != nil {
					pubAt = *item.PublishedParsed
				}

				allNewArticles = append(allNewArticles, CollectedArticle{
					Source:      source,
					Category:    category,
					Title:       item.Title,
					Description: description,
					URL:         item.Link,
					Thumbnail:   thumbnail,
					PublishedAt: pubAt,
					FullTitle:   scrapedTitle,
					FullContent: scrapedContent,
					Images:      scrapedImages,
				})
				count++
			}
			log.Printf("News Cron: Prepared %d items for %s - %s", count, source, category)
		}
	}

	// 2. CẬP NHẬT DATABASE TRONG MỘT GIAO DỊCH (TRANSACTION)
	if len(allNewArticles) > 0 {
		tx, err := database.Pool.Begin(ctx)
		if err != nil {
			log.Printf("News Cron: Failed to start transaction: %v", err)
			return
		}
		defer tx.Rollback(ctx)

		// Xóa sạch bài cũ trước khi chèn bài mới
		_, err = tx.Exec(ctx, "DELETE FROM daily_news")
		if err != nil {
			log.Printf("News Cron: Failed to clear old news in TX: %v", err)
			return
		}

		for _, art := range allNewArticles {
			_, err = tx.Exec(ctx, `
				INSERT INTO daily_news (source, category, title, description, url, thumbnail, published_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (url) DO NOTHING
			`, art.Source, art.Category, art.Title, art.Description, art.URL, art.Thumbnail, art.PublishedAt)
			if err != nil {
				log.Printf("News Cron: Failed to insert news in TX: %v", err)
			}
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("News Cron: Failed to commit transaction: %v", err)
		} else {
			log.Printf("News Cron: Successfully updated database with %d fresh articles.", len(allNewArticles))
			// 3. PUSH LÊN REDIS SAU KHI DB ĐÃ THÀNH CÔNG
			go func() {
				if database.RedisClient == nil {
					log.Println("News Cron: Redis chưa được khởi tạo, bỏ qua push cache.")
					return
				}
				// Tính toán TTL động cho tin tức (Đến 7:00 AM VN sáng mai)
				loc, _ := time.LoadLocation("Asia/Ho_Chi_Minh")
				now := time.Now().In(loc)
				next7AM := time.Date(now.Year(), now.Month(), now.Day(), 7, 0, 0, 0, loc)
				if now.After(next7AM) || now.Equal(next7AM) {
					next7AM = next7AM.Add(24 * time.Hour)
				}
				ttl := next7AM.Sub(now)
				log.Printf("News Cron: TTL for Redis set to %v", ttl)

				rdb := database.RedisClient
				rctx := context.Background()

				// Nhóm bài theo category để lưu danh sách
				type RedisNewsItem struct {
					Source      string    `json:"source"`
					Category    string    `json:"category"`
					Title       string    `json:"title"`
					Description string    `json:"description"`
					URL         string    `json:"url"`
					Thumbnail   string    `json:"thumbnail"`
					PublishedAt time.Time `json:"published_at"`
				}
				categoryMap := make(map[string][]RedisNewsItem)
				for _, art := range allNewArticles {
					categoryMap[art.Category] = append(categoryMap[art.Category], RedisNewsItem{
						Source:      art.Source,
						Category:    art.Category,
						Title:       art.Title,
						Description: art.Description,
						URL:         art.URL,
						Thumbnail:   art.Thumbnail,
						PublishedAt: art.PublishedAt,
					})
				}

				// Lưu danh sách từng category lên Redis
				for cat, items := range categoryMap {
					data, _ := json.Marshal(items)
					key := fmt.Sprintf("news:category:%s", cat)
					if err := rdb.Set(rctx, key, data, ttl).Err(); err != nil {
						log.Printf("News Cron: Redis SET category[%s] failed: %v", cat, err)
					} else {
						log.Printf("News Cron: Redis cached %d articles for category [%s]", len(items), cat)
					}
				}

				// Lưu nội dung chi tiết từng bài lên Redis
				type CachedContent struct {
					URL     string   `json:"url"`
					Title   string   `json:"title"`
					Content []string `json:"content"`
					Images  []string `json:"images"`
				}
				for _, art := range allNewArticles {
					if len(art.FullContent) == 0 {
						continue
					}
					payload := CachedContent{
						URL:     art.URL,
						Title:   art.FullTitle,
						Content: art.FullContent,
						Images:  art.Images,
					}
					data, _ := json.Marshal(payload)
					urlHash := fmt.Sprintf("%x", md5.Sum([]byte(art.URL)))
					key := fmt.Sprintf("news:article:%s", urlHash)
					if err := rdb.Set(rctx, key, data, ttl).Err(); err != nil {
						log.Printf("News Cron: Redis SET article failed for %s: %v", art.URL, err)
					}
				}
				log.Printf("News Cron: Pushed %d article contents to Redis.", len(allNewArticles))
			}()
		}
	} else {
		log.Println("News Cron: No articles fetched, database was NOT cleared.")
	}

	log.Println("News Cron: Refresh completed.")
}

func preCacheArticle(ctx context.Context, articleURL string) {
	// Logic cào bài chuyên sâu và lưu vào news_cache
	// Để tránh quá tải, chỉ cào vài bài tiêu biểu hoặc để người dùng click mới cào
	// Ở đây ta có thể gọi hàm cào bài báo từ repository hoặc handler
}

func ScrapeFullContent(articleURL, userAgent string) (string, []string, []string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", articleURL, nil)
	if userAgent != "" {
		req.Header.Set("User-Agent", userAgent)
	} else {
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", nil, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", nil, nil, http.ErrHandlerTimeout // Generic error
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", nil, nil, err
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

	return strings.TrimSpace(title), content, images, nil
}
