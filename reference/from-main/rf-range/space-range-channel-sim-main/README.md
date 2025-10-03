# Space Range Channel Simulator

RF channel simulator for Space Cyber Range, simulating channel effects between satellite and ground station communications.

## Overview

This simulator acts as an intermediate node (VM B) between a satellite (VM A) and ground station (VM C), applying realistic channel effects to RF communications:
- AWGN (Additive White Gaussian Noise)
- Path Loss
- Atmospheric Effects
- Doppler Shift (optional)
- Multipath Effects (optional)

## Installation

```bash
# Clone repository
git clone https://github.com/your-org/space-range-channel-sim.git
cd space-range-channel-sim

# Run setup script
sudo ./setup/setup.sh
```

## Configuration

Edit `/var/app/config.yaml` to set:
- IP addresses for all VMs
- Channel effect parameters
- Logging preferences

Example configuration for AWGN:
```yaml
channel_effects:
  awgn:
    enabled: true
    snr_db: 20.0  # Adjust for more/less noise
```

## Usage

### Service Mode
```bash
# Start service
sudo systemctl start socket_vm.service

# Check status
sudo systemctl status socket_vm.service

# View logs
tail -f /var/app/logs/channel_sim.log
```

### Manual Testing
1. Place test files in `/var/app/incoming/`
2. Run processor manually:
```bash
cd /var/app/scripts
python3 process_iq.py
```
3. Check processed files in `/var/app/outgoing/`

## Directory Structure

```
/var/app/
├── incoming/    # Input files
├── outgoing/    # Processed files
├── sent/        # Archive of sent files
├── logs/        # Log files
├── scripts/     # Python scripts
└── config.yaml  # Configuration
```

## Testing

Run test scripts to verify channel effects:
```bash
cd tests
python3 test_channel_effects.py
```

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License

[Your License]
