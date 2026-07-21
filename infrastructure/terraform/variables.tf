variable "aws_region" {
  description = "AWS region to deploy into (us-east-1 matches TiDB Cloud Serverless for ultra-low ~1.5ms DB latency)"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for tagging resources"
  type        = string
  default     = "hr-management-system"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "key_pair_name" {
  description = "Existing EC2 key pair name for SSH access to our application server"
  type        = string
}

variable "app_server_instance_type" {
  description = "EC2 instance type for Spring Boot + Nginx Docker host (t3.small is AWS Free Tier eligible with 2 vCPU and 1 GB RAM)"
  type        = string
  default     = "t3.small"
}

variable "db_url" {
  description = "JDBC connection string for TiDB Cloud Serverless MySQL or Neon DB (e.g. jdbc:mysql://xxx.root:pass@gateway01.prod.aws.tidbcloud.com:4000/hrms_db?sslMode=VERIFY_IDENTITY)"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Username for database connection"
  type        = string
  default     = "4PKPeVr7B33ht1a.root"
}

variable "db_password" {
  description = "Password for database connection"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_platform" {
  description = "Hibernate database platform dialect (org.hibernate.dialect.MySQLDialect for TiDB / org.hibernate.dialect.PostgreSQLDialect for Neon)"
  type        = string
  default     = "org.hibernate.dialect.MySQLDialect"
}

variable "jwt_secret" {
  description = "Secret key for JWT token encryption in Spring Boot backend"
  type        = string
  sensitive   = true
  default     = "hrms_super_secret_key_at_least_256_bits_long_for_hs256_algorithm_2024"
}

variable "domain_name" {
  description = "Optional root domain name for Route 53 DNS records (e.g., yourdomain.com). Leave empty to use direct IP/S3 URLs."
  type        = string
  default     = ""
}