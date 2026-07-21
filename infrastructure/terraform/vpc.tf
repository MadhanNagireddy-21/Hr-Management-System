module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs = ["${var.aws_region}a", "${var.aws_region}b"]

  # Public subnets — for ALB (min 2 AZs required by AWS)
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]

  # Private subnets — for EKS worker nodes
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]

  # Isolated DB subnets — for RDS, no internet route at all
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24"]

  # --- Cost-saving setting: NAT Gateway disabled to save $32.85/month ---
  enable_nat_gateway = false
  single_nat_gateway = false
  # For enterprise EKS production later (when moved back from Future/), replace above with:
  # enable_nat_gateway     = true
  # single_nat_gateway     = false
  # one_nat_gateway_per_az = true

  create_database_subnet_group = true
  enable_dns_hostnames         = true
  enable_dns_support           = true

  # Note: When deploying EKS later from Future/, add back public_subnet_tags and private_subnet_tags with kubernetes.io/role/elb = "1"

  tags = {
    Project = var.project_name
  }
}