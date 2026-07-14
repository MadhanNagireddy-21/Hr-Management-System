#!/bin/bash
set -e

echo "=========================================================="
echo "Starting eksctl (AWS EKS CLI) Installation..."
echo "=========================================================="

# Install dependencies
echo "[1/3] Installing dependencies (curl, tar)..."
sudo dnf install -y curl tar

# Download latest release of eksctl
echo "[2/3] Downloading latest eksctl binary for Linux amd64..."
ARCH=amd64
PLATFORM=$(uname -s)_$ARCH

cd /tmp
curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$PLATFORM.tar.gz"

# Optional: Download checksum and verify if desired
curl -sL "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_checksums.txt" -o eksctl_checksums.txt
sha256sum -c eksctl_checksums.txt --ignore-missing || true

# Extract and install binary
echo "[3/3] Extracting and installing eksctl to /usr/local/bin..."
tar -xzf eksctl_$PLATFORM.tar.gz -C /tmp && rm -f eksctl_$PLATFORM.tar.gz eksctl_checksums.txt
sudo mv /tmp/eksctl /usr/local/bin/
sudo chmod +x /usr/local/bin/eksctl

# Verify installation
echo "Verifying eksctl installation..."
eksctl version

echo "=========================================================="
echo "eksctl installation completed successfully!"
echo "=========================================================="
