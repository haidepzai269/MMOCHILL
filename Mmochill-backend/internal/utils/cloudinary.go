package utils

import (
	"context"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadToCloudinary(fileHeader *multipart.FileHeader) (string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	ctx := context.Background()
	cld, err := cloudinary.NewFromURL(os.Getenv("CLOUDINARY_URL"))
	if err != nil {
		return "", err
	}

	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: "mmochill_avatars",
	})
	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}
