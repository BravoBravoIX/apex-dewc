# channel_effects.py

import numpy as np
import logging

class ChannelEffects:
    def __init__(self, config):
        self.config = config['channel_effects']
        self.logger = logging.getLogger('channel_sim')

    def apply_awgn(self, signal):
        """Apply Additive White Gaussian Noise to the signal."""
        if not self.config['awgn']['enabled']:
            return signal

        snr_db = self.config['awgn']['snr_db']
        self.logger.debug(f"Applying AWGN with SNR: {snr_db} dB")

        # Calculate signal power
        signal_power = np.mean(signal ** 2)
        
        # Calculate noise power from SNR
        snr_linear = 10 ** (snr_db / 10)
        noise_power = signal_power / snr_linear
        
        # Generate and add noise
        noise = np.random.normal(0, np.sqrt(noise_power), signal.shape).astype(np.float64)
        return signal + noise

    def apply_path_loss(self, signal):
        """Apply path loss to the signal."""
        if not self.config['path_loss']['enabled']:
            return signal

        config = self.config['path_loss']
        self.logger.debug("Applying path loss effect")

        frequency_hz = config['frequency_hz']
        distance_m = config['distance_m']
        c = 3e8  # Speed of light in m/s

        # Calculate free space path loss
        wavelength = c / frequency_hz
        path_loss = (4 * np.pi * distance_m / wavelength) ** 2
        attenuation = np.sqrt(1 / path_loss).astype(np.float64)

        return signal * attenuation

    def apply_atmospheric_effects(self, signal):
        """Apply atmospheric effects (rain fade, humidity)."""
        if not self.config['atmosphere']['enabled']:
            return signal

        config = self.config['atmosphere']
        self.logger.debug("Applying atmospheric effects")

        # Apply rain fade attenuation
        rain_fade_linear = 10 ** (-config['rain_fade_db'] / 20)
        return signal * rain_fade_linear

    def apply_doppler(self, signal, sample_rate):
        """Apply Doppler shift to the signal."""
        if not self.config['doppler']['enabled']:
            return signal

        config = self.config['doppler']
        shift_hz = config['shift_hz']
        self.logger.debug(f"Applying Doppler shift: {shift_hz} Hz")

        # Generate time vector
        t = np.arange(len(signal)) / sample_rate
        
        # Apply frequency shift
        shift_factor = np.exp(2j * np.pi * shift_hz * t).astype(np.float64)
        return signal * shift_factor

    def process_signal(self, signal, sample_rate=1.0):
        """Apply all enabled channel effects to the signal."""
        try:
            # Extract padding information from QPSK signal
            padding_info = signal[0]
            modulated_signal = signal[1:]

            # Apply channel effects
            processed_signal = modulated_signal
            processed_signal = self.apply_path_loss(processed_signal)
            processed_signal = self.apply_awgn(processed_signal)
            processed_signal = self.apply_atmospheric_effects(processed_signal)
            processed_signal = self.apply_doppler(processed_signal, sample_rate)

            # Reconstruct signal with padding information
            return np.concatenate(([padding_info], processed_signal))

        except Exception as e:
            self.logger.error(f"Error processing signal: {str(e)}")
            raise
