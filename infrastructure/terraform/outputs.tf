output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "The ID of the VPC"
}

output "public_subnets" {
  value       = module.vpc.public_subnets
  description = "List of IDs of public subnets"
}

output "app_server_public_ip" {
  value       = aws_eip.app_server_eip.public_ip
  description = "Static Elastic IPv4 of the Spring Boot API server on EC2 t3a.small"
}

output "frontend_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "Global CloudFront CDN HTTPS URL for accessing the React HRMS Frontend"
}

output "frontend_s3_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "S3 bucket name where 'npm run build' React static files should be synced"
}
