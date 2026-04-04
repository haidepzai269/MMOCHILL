package main

import (
	"fmt"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
)

func main() {
	token := utils.GenerateBypassToken("clm_test", "user_test", "secret")
	fmt.Printf("Generated Token: %s\n", token)
}
