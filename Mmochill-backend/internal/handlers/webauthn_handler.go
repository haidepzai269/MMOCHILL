package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/webauthn"
)

func BeginRegistration(c *gin.Context) {
	userID, _ := c.Get("user_id")
	user, err := repository.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Fetch existing credentials to pass to BeginRegistration
	creds, _ := repository.GetCredentialsByUserID(context.Background(), user.ID)
	user.Credentials = creds

	options, sessionData, err := utils.WebAuthn.BeginRegistration(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store session data in Redis
	sessionJSON, _ := json.Marshal(sessionData)
	database.RedisClient.Set(context.Background(), "webauthn_session:"+user.ID, sessionJSON, 5*time.Minute)

	c.JSON(http.StatusOK, options)
}

func FinishRegistration(c *gin.Context) {
	userID, _ := c.Get("user_id")
	user, err := repository.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Retrieve session data from Redis
	sessionJSON, err := database.RedisClient.Get(context.Background(), "webauthn_session:"+user.ID).Result()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Registration session expired or not found"})
		return
	}

	var sessionData webauthn.SessionData
	json.Unmarshal([]byte(sessionJSON), &sessionData)

	credential, err := utils.WebAuthn.FinishRegistration(user, sessionData, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Save the new credential to DB
	newCred := &models.UserCredential{
		ID:              credential.ID,
		UserID:          user.ID,
		PublicKey:       credential.PublicKey,
		AttestationType: credential.AttestationType,
		AAGUID:          credential.Authenticator.AAGUID,
		SignCount:       credential.Authenticator.SignCount,
		Transport:       make([]string, len(credential.Transport)),
	}
	for i, t := range credential.Transport {
		newCred.Transport[i] = string(t)
	}

	err = repository.SaveCredential(c.Request.Context(), newCred)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save credential: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration successful"})
}

func BeginLogin(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	user, err := repository.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Fetch credentials
	creds, _ := repository.GetCredentialsByUserID(context.Background(), user.ID)
	user.Credentials = creds

	if len(user.Credentials) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No credentials registered for this user"})
		return
	}

	options, sessionData, err := utils.WebAuthn.BeginLogin(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store session data in Redis (using email or a temporary ID since user not logged in yet)
	sessionJSON, _ := json.Marshal(sessionData)
	database.RedisClient.Set(context.Background(), "webauthn_login_session:"+email, sessionJSON, 5*time.Minute)

	c.JSON(http.StatusOK, options)
}

func FinishLogin(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	user, err := repository.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Fetch credentials
	creds, _ := repository.GetCredentialsByUserID(context.Background(), user.ID)
	user.Credentials = creds

	// Retrieve session data from Redis
	sessionJSON, err := database.RedisClient.Get(context.Background(), "webauthn_login_session:"+email).Result()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Login session expired or not found"})
		return
	}

	var sessionData webauthn.SessionData
	json.Unmarshal([]byte(sessionJSON), &sessionData)

	credential, err := utils.WebAuthn.FinishLogin(user, sessionData, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update sign count if necessary
	if credential.Authenticator.SignCount > 0 {
		_ = repository.UpdateCredentialSignCount(context.Background(), credential.ID, credential.Authenticator.SignCount)
	}

	// Login successful: Generate JWT
	tokenPair, err := generateTokens(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         *user,
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
	})
}
