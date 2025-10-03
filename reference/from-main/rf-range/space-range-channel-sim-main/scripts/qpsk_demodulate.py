#!/usr/bin/env python3

import os
import numpy as np
import sys
import yaml

# Default config path, can be overridden by environment variable
CONFIG_PATH = os.getenv('CONFIG_PATH', '/var/app/config.yaml')

def load_config():
    """Load configuration from yaml file."""
    try:
        with open(CONFIG_PATH, 'r') as config_file:
            config = yaml.safe_load(config_file)
        return config.get('modulation', {})
    except Exception as e:
        print(f"Error loading config: {str(e)}")
        sys.exit(1)

def qpsk_demodulate(modulated_signal, carrier_cos, carrier_sin, num_symbols, samples_per_symbol):
    """
    QPSK demodulate IQ samples back to bits.
    
    Args:
        modulated_signal: Input IQ samples
        carrier_cos: Cosine carrier signal
        carrier_sin: Sine carrier signal
        num_symbols: Number of QPSK symbols
        samples_per_symbol: Samples per symbol
    """
    demodulated_bits = []

    # Reverse mapping from (I_sign, Q_sign) to bits
    reverse_mapping = {
        (1, 1): (0, 0),    # 1+j
        (-1, 1): (0, 1),   # -1+j
        (-1, -1): (1, 0),  # -1-j
        (1, -1): (1, 1)    # 1-j
    }

    for i in range(num_symbols):
        start = i * samples_per_symbol
        end = (i + 1) * samples_per_symbol
        sample_slice = modulated_signal[start:end]

        # Extract I and Q components
        I = np.sum(sample_slice * carrier_cos[start:end])
        Q = -np.sum(sample_slice * carrier_sin[start:end])

        # Determine quadrant
        I_sign = 1 if I > 0 else -1
        Q_sign = 1 if Q > 0 else -1

        # Map to bits
        bits = reverse_mapping[(I_sign, Q_sign)]
        demodulated_bits.extend(bits)

    return np.array(demodulated_bits, dtype=np.uint8)

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 qpsk_demodulate.py <input_iq_file> <output_file>")
        sys.exit(1)

    input_iq_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        # Load configuration
        config = load_config()
        carrier_freq = config.get('carrier_freq', 500000)
        bit_rate = config.get('bit_rate', 1000000)
        sample_rate = config.get('sample_rate', 2000000)

        # Read modulated signal
        modulated_signal = np.fromfile(input_iq_file, dtype=np.float64)

        # Extract padding information
        padding_bits_needed = int(modulated_signal[0])
        modulated_signal = modulated_signal[1:]  # Remove padding info

        # Calculate parameters
        samples_per_bit = sample_rate // bit_rate
        samples_per_symbol = samples_per_bit * 2

        # Calculate total samples and symbols
        total_samples = len(modulated_signal)
        num_symbols = total_samples // samples_per_symbol
        total_samples = num_symbols * samples_per_symbol

        # Trim signal to match total_samples
        modulated_signal = modulated_signal[:total_samples]

        # Generate carrier signals
        t = np.arange(total_samples) / sample_rate
        carrier_cos = np.cos(2 * np.pi * carrier_freq * t)
        carrier_sin = np.sin(2 * np.pi * carrier_freq * t)

        # Demodulate
        demodulated_bits = qpsk_demodulate(modulated_signal, carrier_cos, carrier_sin, 
                                         num_symbols, samples_per_symbol)

        # Remove padding bits
        if padding_bits_needed > 0:
            demodulated_bits = demodulated_bits[:-padding_bits_needed]

        # Convert bits to bytes
        demodulated_bytes = np.packbits(demodulated_bits)

        # Save output file
        with open(output_file, 'wb') as f:
            f.write(demodulated_bytes)

        print(f"QPSK demodulation complete. Data saved to '{output_file}'.")

    except FileNotFoundError:
        print(f"Error: File '{input_iq_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error during demodulation: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
