#!/bin/bash
set -e

echo "=========================================================="
echo "Starting Grafana OSS Installation on Amazon Linux 2023..."
echo "=========================================================="

# Install prerequisites
echo "[1/4] Installing dependencies..."
sudo dnf install -y curl dnf-plugins-core

# Add Grafana RPM repository
echo "[2/4] Adding Grafana RPM repository..."
cat << EOF | sudo tee /etc/yum.repos.d/grafana.repo
[grafana]
name=grafana
baseurl=https://rpm.grafana.com
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://rpm.grafana.com/gpg.key
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
EOF

# Install Grafana OSS
echo "[3/4] Installing Grafana OSS package..."
sudo dnf update -y
sudo dnf install -y grafana

# Enable and start Grafana service
echo "[4/4] Enabling and starting Grafana service..."
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Verify installation status
echo "Checking Grafana service status..."
sudo systemctl status grafana-server --no-pager || true
grafana-server -v || true

echo "=========================================================="
echo "Grafana installation completed successfully!"
echo "Access Grafana UI on port 3000 (Default login: admin / admin)."
echo "=========================================================="
