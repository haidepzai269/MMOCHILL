package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/google/uuid"
)

type BookService struct{}

var famousBooks = []models.Book{
	{Title: "Cha Giàu Cha Nghèo", Author: "Robert Kiyosaki", Category: "finance", Description: "Cuốn sách thay đổi tư duy về tài chính cá nhân.", SourceURL: "https://docsach24.co/doc-sach/cha-giau-cha-ngheo/"},
	{Title: "Nghĩ Giàu Và Làm Giàu", Author: "Napoleon Hill", Category: "finance", Description: "Cẩm nang thành công kinh điển mọi thời đại.", SourceURL: "https://docsach24.co/doc-sach/nghi-giau-lam-giau-158/"},
	{Title: "Bí Mật Tư Duy Triệu Phú", Author: "T. Harv Eker", Category: "finance", Description: "Thay đổi kế hoạch tài chính trong tâm thức.", SourceURL: "https://docsach24.co/doc-sach/bi-mat-tu-duy-trieu-phu/"},
	{Title: "Người Giàu Nhất Thành Babylon", Author: "George S. Clason", Category: "finance", Description: "Những nguyên lý tài chính từ thời cổ đại.", SourceURL: "https://docsach24.co/doc-sach/nguoi-giau-nhat-thanh-babylon/"},
	{Title: "Nhà Đầu Tư Thông Minh", Author: "Benjamin Graham", Category: "finance", Description: "Kinh thánh của đầu tư giá trị.", SourceURL: "https://docsach24.co/doc-sach/nha-dau-tu-thong-minh/"},
	{Title: "Trên Đỉnh Phố Wall", Author: "Peter Lynch", Category: "finance", Description: "Kinh nghiệm đầu tư từ huyền thoại quỹ Magellan.", SourceURL: "https://docsach24.co/doc-sach/tren-dinh-pho-wall/"},
	{Title: "Đắc Nhân Tâm", Author: "Dale Carnegie", Category: "finance", Description: "Nghệ thuật thu phục lòng người.", SourceURL: "https://docsach24.co/doc-sach/dac-nhan-tam-1/"},
	{Title: "Tư Duy Nhanh Và Chậm", Author: "Daniel Kahneman", Category: "finance", Description: "Khám phá hai hệ thống tư duy của con người.", SourceURL: "https://docsach24.co/doc-sach/tu-duy-nhanh-va-cham-2021-3617/"},
	{Title: "Từ Tốt Đến Vĩ Đại", Author: "Jim Collins", Category: "finance", Description: "Tại sao một số công ty đạt bước nhảy vọt.", SourceURL: "https://docsach24.co/doc-sach/tu-tot-den-vi-dai/"},
	{Title: "Chiến Tranh Tiền Tệ", Author: "Song Hongbing", Category: "finance", Description: "Bức tranh toàn cảnh về lịch sử tiền tệ thế giới.", SourceURL: "https://docsach24.co/doc-sach/chien-tranh-tien-te/"},
}

func (s *BookService) InitializeBooks(ctx context.Context) {
	log.Println("Book Service: Starting deep cleanup and re-initialization...")
	
	// Reset dữ liệu chương cũ (để cào mới theo cấu trúc chuẩn docsach24)
	database.Pool.Exec(ctx, "DELETE FROM public.book_chapters")
	log.Println("Book Service: Old chapter data cleared.")

	for _, b := range famousBooks {
		// Kiểm tra xem sách đã tồn tại trong DB chưa
		var currentURL string
		err := database.Pool.QueryRow(ctx, "SELECT source_url FROM public.books WHERE title = $1", b.Title).Scan(&currentURL)
		
		if err == nil {
			// Sách đã tồn tại, kiểm tra nếu URL cần cập nhật (từ .vn hoặc .vision sang docsach24)
			if !strings.Contains(currentURL, "docsach24.co") {
				database.Pool.Exec(ctx, "UPDATE public.books SET source_url = $1 WHERE title = $2", b.SourceURL, b.Title)
				log.Printf("Book Service: Updated source_url for '%s' to docsach24.co", b.Title)
			}
			continue
		}

		// Insert metadata sách mới
		err = database.Pool.QueryRow(ctx, `
			INSERT INTO public.books (title, author, description, thumbnail, category, source_url)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`, b.Title, b.Author, b.Description, b.Thumbnail, b.Category, b.SourceURL).Scan(&b.ID)

		if err != nil {
			log.Printf("Book Service: Failed to insert book '%s': %v", b.Title, err)
			continue
		}
		log.Printf("Book Service: Successfully initialized book '%s'", b.Title)
	}

	// Xoá Redis cache của các chương sách để kích hoạt cào mới
	if database.RedisClient != nil {
		keys, err := database.RedisClient.Keys(ctx, "book:chapter:*").Result()
		if err == nil && len(keys) > 0 {
			database.RedisClient.Del(ctx, keys...)
			log.Printf("Book Service: Cleared %d Redis chapter caches.", len(keys))
		}
	}
}

func (s *BookService) GetOrCrawlChapter(ctx context.Context, bookID uuid.UUID, chapterIndex int) (*models.BookChapter, error) {
	// 1. Kiểm tra Redis
	redisKey := fmt.Sprintf("book:chapter:%s:%d", bookID.String(), chapterIndex)
	if database.RedisClient != nil {
		val, err := database.RedisClient.Get(ctx, redisKey).Result()
		if err == nil {
			var cached models.BookChapter
			if jsonErr := json.Unmarshal([]byte(val), &cached); jsonErr == nil {
				return &cached, nil
			}
		}
	}

	// 2. Kiểm tra DB
	var chapter models.BookChapter
	err := database.Pool.QueryRow(ctx, `
		SELECT id, book_id, chapter_index, title, content, created_at
		FROM public.book_chapters
		WHERE book_id = $1 AND chapter_index = $2
	`, bookID, chapterIndex).Scan(&chapter.ID, &chapter.BookID, &chapter.ChapterIndex, &chapter.Title, &chapter.Content, &chapter.CreatedAt)

	if err == nil {
		// Cache vào Redis nếu chưa có
		s.cacheChapterToRedis(ctx, &chapter)
		return &chapter, nil
	}

	// 3. Nếu không có trong DB thì thực hiện crawl (Lazy load)
	return s.crawlChapter(ctx, bookID, chapterIndex)
}

func (s *BookService) crawlChapter(ctx context.Context, bookID uuid.UUID, chapterIndex int) (*models.BookChapter, error) {
	var sourceURL string
	err := database.Pool.QueryRow(ctx, "SELECT source_url FROM public.books WHERE id = $1", bookID).Scan(&sourceURL)
	if err != nil {
		return nil, err
	}

	// Xây dựng URL chương (Dựa trên cấu trúc của docsach24.co)
	// Cấu trúc: source_url + chuong-{n}.html
	chapterURL := sourceURL
	if !strings.HasSuffix(chapterURL, "/") {
		chapterURL += "/"
	}
	// Xử lý một số sách có slug ID cuối cùng, ta cần chèn chuong-{n} trước .html nếu cần
	// Tuy nhiên với docsach24, cách đơn giản nhất là:
	chapterURL += fmt.Sprintf("chuong-%d.html", chapterIndex)

	log.Printf("Book Service: Crawling chapter from %s", chapterURL)
	
	client := &http.Client{Timeout: 30 * time.Second}
	req, _ := http.NewRequest("GET", chapterURL, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://docsach24.co/")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	
	// Step 1: Thử cào bằng URL phỏng đoán (Dựa trên cấu trúc chuong-n.html)
	resp, err := client.Do(req)
	var finalDoc *goquery.Document

	if err == nil && resp.StatusCode == 200 {
		finalDoc, _ = goquery.NewDocumentFromReader(resp.Body)
		resp.Body.Close()
	} else {
		// Step 2: Nếu thất bại (404/Timeout), truy cập trang chủ của sách để tìm link chuẩn
		log.Printf("Book Service: Guessed URL failed, searching in index page: %s", sourceURL)
		respIndex, errIndex := client.Get(sourceURL)
		if errIndex != nil || respIndex.StatusCode != 200 {
			return nil, fmt.Errorf("failed to fetch book index: %v", errIndex)
		}
		defer respIndex.Body.Close()

		docIndex, _ := goquery.NewDocumentFromReader(respIndex.Body)
		
		// Tìm thẻ <a> có chuỗi "Chương [n]" hoặc tương đương
		var foundLink string
		searchPattern := fmt.Sprintf("Chương %d", chapterIndex)
		docIndex.Find("a").Each(func(i int, s *goquery.Selection) {
			if foundLink != "" { return }
			txt := strings.TrimSpace(s.Text())
			if strings.Contains(strings.ToLower(txt), strings.ToLower(searchPattern)) {
				href, exists := s.Attr("href")
				if exists {
					foundLink = href
				}
			}
		})

		if foundLink == "" {
			return nil, fmt.Errorf("chương %d không tìm thấy trên trang mục lục", chapterIndex)
		}

		// Xử lý link tương đối
		if !strings.HasPrefix(foundLink, "http") {
			foundLink = "https://docsach24.co" + foundLink
		}

		log.Printf("Book Service: Found alternative link: %s", foundLink)
		respFinal, errFinal := client.Get(foundLink)
		if errFinal != nil || respFinal.StatusCode != 200 {
			return nil, fmt.Errorf("failed to fetch alternative link: %v", errFinal)
		}
		defer respFinal.Body.Close()
		finalDoc, _ = goquery.NewDocumentFromReader(respFinal.Body)
	}

	chapterTitle := finalDoc.Find(".chapter-title").First().Text()
	if chapterTitle == "" {
		chapterTitle = finalDoc.Find("h2").First().Text()
	}
	if chapterTitle == "" {
		chapterTitle = fmt.Sprintf("Chương %d", chapterIndex)
	}

	// Ở docsach24.co, nội dung nằm trong .content-detail hoặc .content-story
	contentNode := finalDoc.Find(".content-detail").First()
	if contentNode.Length() == 0 {
		contentNode = finalDoc.Find(".content-story").First()
	}
	if contentNode.Length() == 0 {
		contentNode = finalDoc.Find(".reading-detail").First()
	}

	// Xóa các quảng cáo nếu có
	contentNode.Find("script, .adsense, .ads, .social-share, .fb-like").Remove()
	
	content := strings.TrimSpace(contentNode.Text())
	if content == "" {
		// Thử lấy TEXT thủ công nếu các selector class trên thất bại
		return nil, fmt.Errorf("empty content từ %s", chapterURL)
	}

	// Lưu vào DB
	chapter := &models.BookChapter{
		BookID:       bookID,
		ChapterIndex: chapterIndex,
		Title:        strings.TrimSpace(chapterTitle),
		Content:      content,
	}

	err = database.Pool.QueryRow(ctx, `
		INSERT INTO public.book_chapters (book_id, chapter_index, title, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, chapter.BookID, chapter.ChapterIndex, chapter.Title, chapter.Content).Scan(&chapter.ID, &chapter.CreatedAt)

	if err != nil {
		return nil, err
	}

	// Cache vào Redis (TTL 30 ngày)
	s.cacheChapterToRedis(ctx, chapter)

	return chapter, nil
}

func (s *BookService) cacheChapterToRedis(ctx context.Context, chapter *models.BookChapter) {
	if database.RedisClient == nil {
		return
	}
	redisKey := fmt.Sprintf("book:chapter:%s:%d", chapter.BookID.String(), chapter.ChapterIndex)
	data, _ := json.Marshal(chapter)
	database.RedisClient.Set(ctx, redisKey, data, 30*24*time.Hour)
}

func (s *BookService) GetAllBooks(ctx context.Context) ([]models.Book, error) {
	rows, err := database.Pool.Query(ctx, "SELECT id, title, author, description, thumbnail, category, source_url, created_at FROM public.books ORDER BY title ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []models.Book
	for rows.Next() {
		var b models.Book
		err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.Description, &b.Thumbnail, &b.Category, &b.SourceURL, &b.CreatedAt)
		if err != nil {
			continue
		}
		books = append(books, b)
	}
	return books, nil
}
