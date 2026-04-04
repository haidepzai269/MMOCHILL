package repository

import (
	"context"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func GetAllTasks(ctx context.Context) ([]models.Task, error) {
	query := `
		SELECT id, title, description, reward, provider, original_url, min_time_seconds, max_completions, total_completed, is_active, expires_at, created_at, updated_at, type 
		FROM tasks 
		ORDER BY created_at DESC
	`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Reward, &t.Provider, &t.OriginalURL, 
			&t.MinTimeSeconds, &t.MaxCompletions, &t.TotalCompleted, &t.IsActive, &t.ExpiresAt, &t.CreatedAt, &t.UpdatedAt, &t.Type)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func GetActiveTasks(ctx context.Context) ([]models.Task, error) {
	query := `
		SELECT id, title, description, reward, provider, original_url, min_time_seconds, max_completions, total_completed, is_active, expires_at, created_at, updated_at, type 
		FROM tasks 
		WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
		ORDER BY created_at DESC
	`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Reward, &t.Provider, &t.OriginalURL, 
			&t.MinTimeSeconds, &t.MaxCompletions, &t.TotalCompleted, &t.IsActive, &t.ExpiresAt, &t.CreatedAt, &t.UpdatedAt, &t.Type)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func CreateTask(ctx context.Context, task models.Task) error {
	query := `
		INSERT INTO tasks (title, description, reward, provider, original_url, min_time_seconds, max_completions, expires_at, type) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := database.Pool.Exec(ctx, query, 
		task.Title, task.Description, task.Reward, task.Provider, task.OriginalURL, 
		task.MinTimeSeconds, task.MaxCompletions, task.ExpiresAt, task.Type)
	return err
}

func UpdateTask(ctx context.Context, id string, task models.Task) error {
	query := `
		UPDATE tasks 
		SET title=$1, description=$2, reward=$3, provider=$4, original_url=$5, min_time_seconds=$6, max_completions=$7, is_active=$8, expires_at=$9, type=$10, updated_at=NOW() 
		WHERE id=$11
	`
	_, err := database.Pool.Exec(ctx, query,
		task.Title, task.Description, task.Reward, task.Provider, task.OriginalURL, 
		task.MinTimeSeconds, task.MaxCompletions, task.IsActive, task.ExpiresAt, task.Type, id)
	return err
}

func ToggleTaskActive(ctx context.Context, id string, isActive bool) error {
	_, err := database.Pool.Exec(ctx, "UPDATE tasks SET is_active=$1, updated_at=NOW() WHERE id=$2", isActive, id)
	return err
}

func DeleteTask(ctx context.Context, id string) error {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Xóa các dữ liệu foreign key ràng buộc trong bảng user_task_claims trước
	_, err = tx.Exec(ctx, "DELETE FROM user_task_claims WHERE task_id=$1", id)
	if err != nil {
		return err
	}

	// Cuối cùng xóa bảng tasks
	_, err = tx.Exec(ctx, "DELETE FROM tasks WHERE id=$1", id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func GetTaskByID(ctx context.Context, id string) (*models.Task, error) {
	query := `
		SELECT id, title, description, reward, provider, original_url, min_time_seconds, max_completions, total_completed, is_active, expires_at, created_at, updated_at, type 
		FROM tasks 
		WHERE id = $1
	`
	var t models.Task
	err := database.Pool.QueryRow(ctx, query, id).Scan(&t.ID, &t.Title, &t.Description, &t.Reward, &t.Provider, &t.OriginalURL, 
		&t.MinTimeSeconds, &t.MaxCompletions, &t.TotalCompleted, &t.IsActive, &t.ExpiresAt, &t.CreatedAt, &t.UpdatedAt, &t.Type)
	
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func GetAvailableTasksForUser(ctx context.Context, userID string) ([]models.Task, error) {
	query := `
		WITH user_claims AS (
			SELECT task_id, 
				   COUNT(*) as all_time_claims,
				   SUM(CASE WHEN claimed_at::DATE = CURRENT_DATE THEN 1 ELSE 0 END) as today_claims
			FROM user_task_claims
			WHERE user_id = $1 AND status = 'completed'
			GROUP BY task_id
		)
		SELECT t.id, t.title, t.description, t.reward, t.provider, t.original_url, t.min_time_seconds, t.max_completions, t.total_completed, t.is_active, t.expires_at, t.created_at, t.updated_at, t.type,
			   COALESCE(c.today_claims, 0) as completions_today
		FROM tasks t
		LEFT JOIN user_claims c ON t.id = c.task_id
		WHERE t.is_active = true AND (t.expires_at IS NULL OR t.expires_at > NOW())
		  AND (
		      (t.provider IN ('taplayma', 'nhapma', 'traffic68') AND COALESCE(c.today_claims, 0) < 3)
		      OR
		      (t.provider NOT IN ('taplayma', 'nhapma', 'traffic68') AND COALESCE(c.all_time_claims, 0) < 1)
		  )
		ORDER BY t.created_at DESC
	`
	rows, err := database.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		var cmpToday *int
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Reward, &t.Provider, &t.OriginalURL, 
			&t.MinTimeSeconds, &t.MaxCompletions, &t.TotalCompleted, &t.IsActive, &t.ExpiresAt, &t.CreatedAt, &t.UpdatedAt, &t.Type, &cmpToday)
		
		if err != nil {
			return nil, err
		}
		
		if cmpToday != nil {
			t.CompletionsToday = int(*cmpToday)
		} else {
			t.CompletionsToday = 0
		}
		
		if t.Provider == "taplayma" || t.Provider == "nhapma" || t.Provider == "traffic68" {
			t.MaxCompletionsToday = 3
		} else {
			t.MaxCompletionsToday = 1
		}
		
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func IsTaskCompletedByUser(ctx context.Context, userID, taskID string) (bool, error) {
	query := `
		WITH task_info AS (
			SELECT provider FROM tasks WHERE id = $2
		),
		user_claims AS (
			SELECT 
				COUNT(*) as all_time_claims,
				SUM(CASE WHEN claimed_at::DATE = CURRENT_DATE THEN 1 ELSE 0 END) as today_claims
			FROM user_task_claims
			WHERE user_id = $1 AND task_id = $2 AND status = 'completed'
		)
		SELECT 
			CASE 
				WHEN (SELECT provider FROM task_info) IN ('taplayma', 'nhapma', 'traffic68') THEN 
					COALESCE((SELECT today_claims FROM user_claims), 0) >= 3
				ELSE 
					COALESCE((SELECT all_time_claims FROM user_claims), 0) >= 1
			END AS is_completed
	`
	var isCompleted bool
	err := database.Pool.QueryRow(ctx, query, userID, taskID).Scan(&isCompleted)
	return isCompleted, err
}
func SearchTasks(ctx context.Context, queryStr string) ([]models.Task, error) {
	query := `
		SELECT id, title, description, reward, provider, original_url, min_time_seconds, max_completions, total_completed, is_active, expires_at, created_at, updated_at, type 
		FROM tasks 
		WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
		  AND (title ILIKE $1 OR description ILIKE $1)
		ORDER BY created_at DESC
		LIMIT 10
	`
	rows, err := database.Pool.Query(ctx, query, "%"+queryStr+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Reward, &t.Provider, &t.OriginalURL, 
			&t.MinTimeSeconds, &t.MaxCompletions, &t.TotalCompleted, &t.IsActive, &t.ExpiresAt, &t.CreatedAt, &t.UpdatedAt, &t.Type)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}
