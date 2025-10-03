#!/usr/bin/env python3

import os
import yaml
import numpy as np
import sys

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

def qpsk_modulate(data_bits, config):
    """
    QPSK modulate data bits into IQ samples.
    
    Args:
        data_bits: Input data as numpy array of bits
        config: Dictionary containing modulation parameters
    """
    sample_rate = config.get('sample_rate', 2000000)
    bit_rate = config.get('bit_rate', 1000000)
    carrier_freq = config.get('carrier_freq', 500000)

    # Verify Nyquist criterion
    if carrier_freq >= sample_rate / 2:
        raise ValueError(f"Carrier frequency ({carrier_freq} Hz) must be less than "
                       f"half the sample rate ({sample_rate/2} Hz)")

    # Calculate padding needed
    total_bits = len(data_bits)
    bits_needed_for_byte = (8 - (total_bits % 8)) % 8
    bits_needed_for_symbol = (2 - (total_bits % 2)) % 2
    padding_bits_needed = max(bits_needed_for_byte, bits_needed_for_symbol)

    # Pad data if needed
    if padding_bits_needed > 0:
        data_bits = np.append(data_bits, np.zeros(padding_bits_needed, dtype=np.uint8))

    # Store padding info
    padding_info = np.array([float(padding_bits_needed)], dtype=np.float64)

    # Calculate samples per symbol (2 bits per symbol in QPSK)
    samples_per_bit = sample_rate // bit_rate
    samples_per_symbol = samples_per_bit * 2

    # Map bits to QPSK symbols
    bit_pairs = data_bits.reshape(-1, 2)
    mapping = {
        (0, 0): (1, 1),    # 1+j
        (0, 1): (-1, 1),   # -1+j
        (1, 0): (-1, -1),  # -1-j
        (1, 1): (1, -1)    # 1-j
    }
    symbols = np.array([mapping[tuple(pair)] for pair in bit_pairs])

    # Generate time vector and carriers
    total_symbols = len(symbols)
    total_samples = total_symbols * samples_per_symbol
    t = np.arange(total_samples) / sample_rate
    carrier_cos = np.cos(2 * np.pi * carrier_freq * t)
    carrier_sin = np.sin(2 * np.pi * carrier_freq * t)

    # Create I and Q signals
    I = np.repeat(symbols[:, 0], samples_per_symbol)
    Q = np.repeat(symbols[:, 1], samples_per_symbol)

    # Combine I and Q with carriers
    modulated_signal = I * carrier_cos - Q * carrier_sin

    # Add padding information
    modulated_signal = np.concatenate((padding_info, modulated_signal))

    return modulated_signal

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 qpsk_modulate.py <input_file> <output_iq_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_iq_file = sys.argv[2]

    try:
        # Read input file
        with open(input_file, 'rb') as f:
            file_data = f.read()
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        sys.exit(1)

    try:
        # Convert to bits
        data_bits = np.unpackbits(np.frombuffer(file_data, dtype=np.uint8))
        
        # Load config and modulate
        config = load_config()
        modulated_signal = qpsk_modulate(data_bits, config)

        # Save modulated signal
        modulated_signal.tofile(output_iq_file)
        print(f"QPSK modulation complete. IQ samples saved to '{output_iq_file}'.")

    except Exception as e:
        print(f"Error during modulation: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
