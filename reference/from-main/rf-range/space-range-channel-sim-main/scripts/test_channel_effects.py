#!/usr/bin/env python3

import os
import sys
import numpy as np
import pytest
from channel_effects import ChannelEffects
import yaml
import logging
from pathlib import Path

# Add parent directory to path for importing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def load_test_config():
    """Load config with test parameters."""
    base_config = {
        'channel_effects': {
            'awgn': {
                'enabled': True,
                'snr_db': 20.0
            },
            'path_loss': {
                'enabled': True,
                'model': 'free_space',
                'frequency_hz': 2.0e9,
                'distance_m': 7.0e5
            }
        }
    }
    return base_config

class TestChannelEffects:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test environment."""
        self.config = load_test_config()
        self.channel = ChannelEffects(self.config)
        
        # Create test signal
        self.sample_size = 1000
        self.test_signal = np.ones(self.sample_size, dtype=np.float64)
        
        # Add padding info for QPSK compatibility
        self.test_signal = np.concatenate(([0], self.test_signal))

    def test_awgn(self):
        """Test AWGN effect."""
        # Process signal
        processed = self.channel.apply_awgn(self.test_signal.copy())
        
        # Verify signal properties
        assert len(processed) == len(self.test_signal)
        assert np.mean(processed) != np.mean(self.test_signal)  # Should add noise
        
        # Verify SNR
        signal_power = np.mean(self.test_signal[1:] ** 2)  # Exclude padding
        noise = processed[1:] - self.test_signal[1:]
        noise_power = np.mean(noise ** 2)
        measured_snr = 10 * np.log10(signal_power / noise_power)
        expected_snr = self.config['channel_effects']['awgn']['snr_db']
        
        assert abs(measured_snr - expected_snr) < 1  # Within 1dB tolerance

    def test_path_loss(self):
        """Test path loss effect."""
        processed = self.channel.apply_path_loss(self.test_signal.copy())
        
        # Verify attenuation
        assert len(processed) == len(self.test_signal)
        assert np.mean(processed[1:]) < np.mean(self.test_signal[1:])  # Should attenuate
        
        # Verify padding preservation
        assert processed[0] == self.test_signal[0]

    def test_combined_effects(self):
        """Test all effects together."""
        processed = self.channel.process_signal(self.test_signal.copy())
        
        assert len(processed) == len(self.test_signal)
        assert processed[0] == self.test_signal[0]  # Padding preserved
        assert np.mean(processed[1:]) != np.mean(self.test_signal[1:])

if __name__ == "__main__":
y
