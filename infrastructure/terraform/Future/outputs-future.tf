output "jenkins_public_ip" {
  value       = aws_instance.jenkins.public_ip
  description = "Public IP address of the Jenkins CI server on EC2"
}

output "rds_endpoint" {
  value       = aws_db_instance.hr_db.endpoint
  description = "Connection endpoint for HRMS MySQL RDS instance"
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "URL of the backend Docker image ECR repository"
}

output "frontend_ecr_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "URL of the frontend Docker image ECR repository"
}
