data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "app_server_sg" {
  name        = "${var.project_name}-app-server-sg"
  description = "Security group for Spring Boot + Nginx Docker host (50-100 users setup)"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTPS API Access (SSL terminated by Nginx)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Access (Lets Encrypt verification & redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH Access for administration & deployments"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict to your office/VPN IP in high-security production
  }

  egress {
    description = "Allow all outbound traffic (pulling Docker images, connecting to Neon DB)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-app-server-sg"
    Project = var.project_name
  }
}

resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.app_server_instance_type # t3.micro (2 vCPU, 1 GB RAM - Free Tier eligible or $8.06/mo)
  subnet_id              = module.vpc.public_subnets[0]
  vpc_security_group_ids = [aws_security_group.app_server_sg.id]
  key_name               = var.key_pair_name

  user_data = templatefile("${path.module}/Scripts/app-server-setup.sh", {
    db_url      = var.db_url
    db_username = var.db_username
    db_password = var.db_password
    db_platform = var.db_platform
    jwt_secret  = var.jwt_secret
  })

  root_block_device {
    volume_size = 20 # 20 GB gp3 SSD ($1.60/month)
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-api-server"
    Project = var.project_name
  }
}

resource "aws_eip" "app_server_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project_name}-app-server-eip"
    Project = var.project_name
  }
}
