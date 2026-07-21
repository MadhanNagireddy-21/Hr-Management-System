#!/bin/bash
set -e

PROMETHEUS_VERSION="2.53.0"

echo "=========================================================="
echo "Starting Prometheus v${PROMETHEUS_VERSION} Installation..."
echo "=========================================================="

# Install prerequisites
echo "[1/6] Installing dependencies (wget, tar)..."
sudo dnf install -y wget tar

# Create dedicated system user and directories for Prometheus
echo "[2/6] Creating 'prometheus' system user and directory structure..."
sudo useradd --no-create-home --shell /bin/false prometheus 2>/dev/null || true
sudo mkdir -p /etc/prometheus /var/lib/prometheus

# Download and unpack Prometheus binary release
echo "[3/6] Downloading Prometheus release bundle..."
cd /tmp
wget -q "https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
tar -xzf "prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
cd "prometheus-${PROMETHEUS_VERSION}.linux-amd64"

# Install binaries and default configuration
echo "[4/6] Installing binaries and configuration files..."
sudo cp prometheus promtool /usr/local/bin/
sudo cp -r consoles console_libraries /etc/prometheus/
sudo cp prometheus.yml /etc/prometheus/prometheus.yml

# Set ownership
sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus /usr/local/bin/prometheus /usr/local/bin/promtool

# Create Systemd service unit for Prometheus
echo "[5/6] Creating Prometheus systemd service unit..."
cat << EOF | sudo tee /etc/systemd/system/prometheus.service
[Unit]
Description=Prometheus Time Series Collection and Processing Server
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus/ \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.listen-address=0.0.0.0:9090 \
  --web.enable-lifecycle

Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "[6/6] Enabling and starting Prometheus service..."
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus

# Clean up temporary files
rm -rf /tmp/prometheus-*

# Verify status
echo "Checking Prometheus service status..."
sudo systemctl status prometheus --no-pager || true
prometheus --version || true

echo "=========================================================="
echo "Prometheus installation completed successfully!"
echo "Access Prometheus UI on port 9090."
echo "=========================================================="
