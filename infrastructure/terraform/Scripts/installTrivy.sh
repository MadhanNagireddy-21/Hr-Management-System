#!/bin/bash
set -e

echo "=========================================================="
echo "Starting Trivy Vulnerability Scanner Installation..."
echo "=========================================================="

# Update system and install required tools
echo "[1/3] Installing prerequisites..."
sudo dnf install -y curl dnf-plugins-core

# Add Aqua Security Trivy RPM repository
echo "[2/3] Adding Trivy repository and installing Trivy..."
cat << EOF | sudo tee /etc/yum.repos.d/trivy.repo
[trivy]
name=Trivy repository
baseurl=https://aquasecurity.github.io/trivy-repo/rpm/releases/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://aquasecurity.github.io/trivy-repo/rpm/public.key
EOF

# Try installing via dnf; if repository doesn't match basearch or fails on specific AL targets, fallback to official script
if ! sudo dnf install -y trivy; then
    echo "RPM repo installation failed or unsupported arch. Using official binary install script..."
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin
fi

# Verify Trivy installation
echo "[3/3] Verifying Trivy installation..."
trivy --version

echo "=========================================================="
echo "Trivy installation completed successfully!"
echo "=========================================================="
