resource "aws_db_subnet_group" "hr_db" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = module.vpc.database_subnets

  tags = {
    Name    = "${var.project_name}-db-subnet-group"
    Project = var.project_name
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "hr-rds-sg"
  description = "Security group for HRMS MySQL database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "MySQL from Jenkins CI server"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.jenkins_sg.id]
  }

  ingress {
    description = "MySQL from internal VPC subnet (EKS workers later)"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-rds-sg"
    Project = var.project_name
  }
}

resource "aws_db_instance" "hr_db" {
  identifier             = "hr-db-server"
  engine                 = "mysql"
  engine_version         = "8.0"         # Using stable MySQL 8.0 (matches docker-compose.yml & application.properties)
  instance_class         = "db.t3.micro" # Free-tier / low-cost eligible
  allocated_storage      = 20
  db_name                = "hrms_db" # Matches MYSQL_DATABASE / application.properties
  username               = "admin"   # MySQL master username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.hr_db.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  multi_az               = false
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name    = "${var.project_name}-rds-database"
    Project = var.project_name
  }
}
