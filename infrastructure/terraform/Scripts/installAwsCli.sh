#!/bin/bash
set -e

echo "=========================================================="
echo "Starting AWS CLI v2 Installation on Linux x86_64..."
echo "=========================================================="

# Install dependencies
echo "[1/4] Installing dependencies (curl, unzip)..."
sudo dnf install -y curl unzip

# Download AWS CLI v2 bundle
echo "[2/4] Downloading AWS CLI v2 installer..."
cd /tmp
curl -sL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Unzip installer
echo "[3/4] Unpacking AWS CLI v2 bundle..."
unzip -q -o awscliv2.zip

# Run installer
echo "[4/4] Installing/Updating AWS CLI v2..."
sudo ./aws/install --update

# Clean up temporary installation files
rm -rf /tmp/aws /tmp/awscliv2.zip

# Verify installation
echo "Verifying AWS CLI installation..."
/usr/local/bin/aws --version || aws --version

echo "=========================================================="
echo "AWS CLI v2 installation completed successfully!"
echo "=========================================================="
