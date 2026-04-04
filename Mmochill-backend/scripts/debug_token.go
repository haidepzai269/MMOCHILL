package main

import (
	"encoding/base64"
	"fmt"
)

func main() {
	// Split by .
	parts := 2
	_ = parts
    // Let's just try to decode the first part
    part1 := "Y2xtXzE3NzQ2OTE5NTMyODEzMjU0MDA6NzM4Y2YzZmYtMGYwZS00YmUxLTk4NjgtNzk5MTJhZDE5YzEwOjE3NzQ2OTE5NTMyODEzMjU0MDA"
    decoded, err := base64.RawURLEncoding.DecodeString(part1)
    if err != nil {
        fmt.Printf("Decode Error: %v\n", err)
    } else {
        fmt.Printf("Decoded: %s\n", string(decoded))
    }
}
