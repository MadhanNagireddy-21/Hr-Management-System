#!/bin/bash
set -e

echo "=========================================================="
echo "Starting HashiCorp Terraform Installation..."
echo "=========================================================="

# Install dependencies and yum/dnf plugins
echo "[1/3] Installing dnf-plugins-core..."
sudo dnf install -y dnf-plugins-core

# Add HashiCorp repository
echo "[2/3] Adding HashiCorp RPM repository..."
sudo dnf config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo

# Install Terraform
echo "[3/3] Installing Terraform package..."
sudo dnf install -y terraform

# Verify installation
echo "Verifying Terraform installation..."
terraform -v

echo "=========================================================="
echo "Terraform installation completed successfully!"
echo "=========================================================="
