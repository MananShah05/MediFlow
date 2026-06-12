#!/bin/bash
# MediFLOW LocalStack S3 initialization script
# Creates the default bucket used by the file storage service

echo "Initializing MediFLOW S3 buckets..."

awslocal s3 mb s3://mediflow-files --region us-east-1

# Apply CORS configuration for local development
awslocal s3api put-bucket-cors --bucket mediflow-files --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

echo "MediFLOW S3 buckets initialized successfully."
