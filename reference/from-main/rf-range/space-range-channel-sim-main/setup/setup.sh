#!/bin/bash

# Exit on error
set -e

echo "Space Range Channel Simulator Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get the current username (even if running with sudo)
SUDO_USER=$(logname || echo $SUDO_USERNAME)

echo "Installing system dependencies..."
apt-get update
apt-get install -y python3 python3-pip python3-venv python3-numpy

# Create directory structure
echo "Creating directory structure..."
mkdir -p /var/app/{logs,outgoing,incoming,sent,scripts,config,test_incoming,test_outgoing,samples}

# Create and activate virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv /var/app/venv
source /var/app/venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Copy scripts
echo "Installing application files..."
cp ./scripts/channel_effects.py /var/app/scripts/
cp ./scripts/process_iq.py /var/app/scripts/
cp ./scripts/socket_vm.py /var/app/scripts/

# Copy and update config
echo "Setting up configuration..."
cp ./config/config.yaml.template /var/app/config.yaml

# Copy systemd service file
echo "Installing systemd service..."
cp ./services/socket_vm.service /etc/systemd/system/
systemctl daemon-reload

# Set permissions
echo "Setting permissions..."
chown -R $SUDO_USER:$SUDO_USER /var/app
chmod 755 /var/app/scripts/*.py

# Create log file if it doesn't exist
touch /var/app/logs/channel_sim.log
chown $SUDO_USER:$SUDO_USER /var/app/logs/channel_sim.log

# Get instance IP
PRIVATE_IP=$(hostname -I | awk '{print $1}')

# Add these sections to setup.sh

# Install test processor service
echo "Installing test processor service..."
cp ./services/test_processor.service /etc/systemd/system/
chmod 644 /etc/systemd/system/test_processor.service
systemctl daemon-reload

# Create test directories
echo "Creating test directories..."
mkdir -p /var/app/{test_incoming,test_outgoing,samples}
chown -R $SUDO_USER:$SUDO_USER /var/app/test_incoming
chown -R $SUDO_USER:$SUDO_USER /var/app/test_outgoing
chown -R $SUDO_USER:$SUDO_USER /var/app/samples

# Create test processor log file
touch /var/app/logs/test_processor.log
chown $SUDO_USER:$SUDO_USER /var/app/logs/test_processor.log

# Add to the echo instructions at the end:
echo "6. For testing channel effects:"
echo "   - Drop IQ files in: /var/app/test_incoming"
echo "   - Get processed files from: /var/app/test_outgoing"
echo "   - Start test processor: sudo systemctl start test_processor.service"
echo "   - View test logs: tail -f /var/app/logs/test_processor.log"
echo ""

echo ""
echo "Installation complete!"
echo "====================="
echo ""
echo "Next steps:"
echo "1. Edit /var/app/config.yaml and set:"
echo "   - local_vm: vm_b"
echo "   - IP addresses for all VMs"
echo "   - Current private IP is: $PRIVATE_IP"
echo ""
echo "2. Start the service:"
echo "   sudo systemctl start socket_vm.service"
echo ""
echo "3. Enable service on boot:"
echo "   sudo systemctl enable socket_vm.service"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status socket_vm.service"
echo ""
echo "5. View logs:"
echo "   tail -f /var/app/logs/channel_sim.log"
echo ""

# Offer to edit config
read -p "Would you like to edit the config file now? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -n "$EDITOR" ]; then
        $EDITOR /var/app/config.yaml
    else
        nano /var/app/config.yaml
    fi
fi
