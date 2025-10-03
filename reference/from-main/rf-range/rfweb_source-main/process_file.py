#!/usr/bin/env python3
"""
process_file.py

A single-file application that processes a single input file through a complete
digital modulation/demodulation chain with FEC and a simple AWGN channel effect,
now including a path loss component.
It splits the file into a header (first 1024 bytes, padded if needed) and a payload,
protects the header with strong FEC (RSCodec(15)) and the payload in blocks with RSCodec(6)),
builds a composite structure (with markers "HDR1" and "PLD1"), converts it to a bitstream,
performs QPSK modulation, applies path loss and AWGN, then demodulates and FEC-decodes the composite data.
The recovered file is written to an output file named inputfile-output.ext.
Usage:
    python3 process_file.py inputfile.ext
"""

import os
import sys
import yaml
import numpy as np
import reedsolo  # pip install reedsolo
import struct
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("process_file")

# Global constant for header length
HEADER_LENGTH = 1024

# --- Utility Functions ---

def load_config(config_path="config.yaml"):
    """Load configuration parameters from config.yaml."""
    try:
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
        return config
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        sys.exit(1)

def fec_encode_blocks(data, block_size, nsym):
    """
    Splits data into blocks of block_size bytes (padding the last block if needed)
    and encodes each block with RS FEC using nsym parity bytes.
    Returns: (encoded_data, number_of_blocks)
    """
    blocks = [data[i:i+block_size] for i in range(0, len(data), block_size)]
    if len(blocks[-1]) < block_size:
        blocks[-1] = blocks[-1] + bytes(block_size - len(blocks[-1]))
    rsc = reedsolo.RSCodec(nsym)
    encoded_blocks = []
    for idx, block in enumerate(blocks):
        try:
            encoded_block = rsc.encode(block)
        except Exception as e:
            logger.error(f"FEC encoding error on block {idx}: {e}")
            sys.exit(1)
        encoded_blocks.append(encoded_block)
    return b"".join(encoded_blocks), len(blocks)

def build_composite(header, payload, nsym_header=15, nsym_payload=6, block_size=200):
    """
    Builds a composite FEC structure from a header and payload.
    - The header is protected using RSCodec(nsym_header).
    - The payload is split into blocks and protected with RSCodec(nsym_payload).

    Composite format:
      4 bytes: marker "HDR1"
      4 bytes: length of header_fec (unsigned int)
      header_fec (variable length)
      4 bytes: marker "PLD1"
      12 bytes: payload header (original payload length, block_size, number of blocks)
      payload_fec (rest)
    """
    try:
        rsc_header = reedsolo.RSCodec(nsym_header)
        header_fec = rsc_header.encode(header)
    except Exception as e:
        logger.error(f"Error encoding header with RSCodec({nsym_header}): {e}")
        sys.exit(1)

    if payload:
        payload_fec, num_blocks = fec_encode_blocks(payload, block_size, nsym_payload)
        payload_header = struct.pack('>III', len(payload), block_size, num_blocks)
    else:
        payload_fec = b""
        payload_header = b"\x00" * 12
    composite = b"HDR1" + struct.pack('>I', len(header_fec)) + header_fec
    composite += b"PLD1" + payload_header + payload_fec
    return composite

def bits_from_bytes(data_bytes):
    """Converts bytes to a numpy array of bits."""
    return np.unpackbits(np.frombuffer(data_bytes, dtype=np.uint8))

def bytes_from_bits(bit_array):
    """Converts a numpy array of bits back to bytes."""
    return np.packbits(bit_array).tobytes()

# --- QPSK Modulation/Demodulation Functions ---

def qpsk_modulate(bit_array, mod_config):
    """
    Performs QPSK modulation on the given bit array.
    The first element of the output is reserved for padding info.
    """
    sample_rate = mod_config.get("sample_rate", 2000000)
    bit_rate = mod_config.get("bit_rate", 1000000)
    carrier_freq = mod_config.get("carrier_freq", 500000)
    total_bits = len(bit_array)
    bits_for_byte = (8 - (total_bits % 8)) % 8
    bits_for_symbol = (2 - (total_bits % 2)) % 2
    padding_bits = max(bits_for_byte, bits_for_symbol)
    if padding_bits > 0:
        bit_array = np.append(bit_array, np.zeros(padding_bits, dtype=np.uint8))
    pad_info = np.array([float(padding_bits)], dtype=np.float64)
    samples_per_bit = sample_rate // bit_rate
    samples_per_symbol = samples_per_bit * 2
    try:
        bit_pairs = bit_array.reshape(-1, 2)
    except Exception as e:
        logger.error(f"Error reshaping bit array: {e}")
        sys.exit(1)
    mapping = {
        (0, 0): (1, 1),
        (0, 1): (-1, 1),
        (1, 0): (-1, -1),
        (1, 1): (1, -1)
    }
    symbols = np.array([mapping.get(tuple(pair.tolist()), (1, 1)) for pair in bit_pairs])
    total_symbols = len(symbols)
    total_samples = total_symbols * samples_per_symbol
    t = np.arange(total_samples) / sample_rate
    carrier_cos = np.cos(2 * np.pi * carrier_freq * t)
    carrier_sin = np.sin(2 * np.pi * carrier_freq * t)
    I = np.repeat(symbols[:, 0], samples_per_symbol)
    Q = np.repeat(symbols[:, 1], samples_per_symbol)
    mod_signal = I * carrier_cos - Q * carrier_sin
    return np.concatenate((pad_info, mod_signal))

def apply_awgn(signal, channel_config):
    """
    Applies AWGN to the signal.
    Parameters are read from channel_config (snr_db, ramp_min, ramp_max).
    """
    snr_db = channel_config.get("awgn", {}).get("snr_db", 10.0)
    ramp_min = channel_config.get("awgn", {}).get("ramp_min", 1.0)
    ramp_max = channel_config.get("awgn", {}).get("ramp_max", 1.5)
    sig_power = np.mean(signal**2)
    noise_power = sig_power / (10 ** (snr_db / 10))
    noise_std = np.sqrt(noise_power)
    ramp = np.linspace(ramp_min, ramp_max, len(signal))
    noise = np.random.normal(0, noise_std, signal.shape) * ramp
    return signal + noise

def apply_path_loss(signal, channel_config):
    """
    Applies path loss to the signal based on the configuration parameters.
    Expected parameters in channel_config under "path_loss":
        - distance: distance between transmitter and receiver (default: 50 metres)
        - reference_distance: reference distance (default: 1 metre)
        - path_loss_exponent: exponent (default: 3)
        - pl0_db: reference path loss in dB at reference_distance (default: 0 dB)
    """
    path_loss_config = channel_config.get("path_loss", {})
    distance = path_loss_config.get("distance", 50)
    reference_distance = path_loss_config.get("reference_distance", 1)
    path_loss_exponent = path_loss_config.get("path_loss_exponent", 3)
    pl0_db = path_loss_config.get("pl0_db", 0)
    # Calculate path loss in dB using the log-distance model
    path_loss_db = pl0_db + 10 * path_loss_exponent * np.log10(distance / reference_distance)
    # Convert dB loss to a linear attenuation factor
    attenuation_factor = 10 ** (-path_loss_db / 20)
    logger.info(f"Applying path loss: {path_loss_db:.2f} dB attenuation, factor = {attenuation_factor:.4f}")
    return signal * attenuation_factor

def qpsk_demodulate(mod_signal, mod_config):
    """
    Performs QPSK demodulation on the modulated signal.
    Returns a numpy array of recovered bits.
    Assumes the first element of mod_signal is the padding info.
    """
    sample_rate = mod_config.get("sample_rate", 2000000)
    bit_rate = mod_config.get("bit_rate", 1000000)
    carrier_freq = mod_config.get("carrier_freq", 500000)
    pad_info = mod_signal[0]
    padding_bits = int(pad_info)
    mod_signal = mod_signal[1:]
    samples_per_bit = sample_rate // bit_rate
    samples_per_symbol = samples_per_bit * 2
    total_samples = len(mod_signal)
    num_symbols = total_samples // samples_per_symbol
    t = np.arange(total_samples) / sample_rate
    carrier_cos = np.cos(2 * np.pi * carrier_freq * t)
    carrier_sin = np.sin(2 * np.pi * carrier_freq * t)
    recovered_bits = []
    reverse_mapping = {
        (1, 1): (0, 0),
        (-1, 1): (0, 1),
        (-1, -1): (1, 0),
        (1, -1): (1, 1)
    }
    for i in range(num_symbols):
        start = i * samples_per_symbol
        end = (i + 1) * samples_per_symbol
        segment = mod_signal[start:end]
        I = np.sum(segment * carrier_cos[start:end]) / samples_per_symbol
        Q = -np.sum(segment * carrier_sin[start:end]) / samples_per_symbol
        I_sign = 1 if I > 0 else -1
        Q_sign = 1 if Q > 0 else -1
        recovered_bits.extend(reverse_mapping.get((I_sign, Q_sign), (0, 0)))
    recovered_bits = np.array(recovered_bits, dtype=np.uint8)
    if padding_bits > 0:
        recovered_bits = recovered_bits[:-padding_bits]
    return recovered_bits

def demodulate_composite(composite_bytes, nsym_payload=6):
    """
    Parses the composite FEC structure from composite_bytes.
    Structure:
      4 bytes: marker "HDR1"
      4 bytes: header_fec_length (unsigned int)
      header_fec (variable length), to be decoded with RSCodec(15)
      4 bytes: marker "PLD1"
      12 bytes: payload header (orig_payload_length, block_size, num_blocks)
      payload_fec (rest), block-by-block decoded with RSCodec(nsym_payload)
    Returns the recovered file (header + payload).
    """
    try:
        if composite_bytes[:4] != b"HDR1":
            raise ValueError("Missing HDR1 marker in composite data.")
        header_fec_length = struct.unpack(">I", composite_bytes[4:8])[0]
        header_fec = composite_bytes[8:8+header_fec_length]
        rsc_header = reedsolo.RSCodec(15)
        header = rsc_header.decode(header_fec)[0]
        pos = 8 + header_fec_length
        if composite_bytes[pos:pos+4] != b"PLD1":
            raise ValueError("Missing PLD1 marker in composite data.")
        pos += 4
        payload_header = composite_bytes[pos:pos+12]
        pos += 12
        orig_payload_length, block_size, num_blocks = struct.unpack(">III", payload_header)
        payload_fec = composite_bytes[pos:]
        block_length = block_size + nsym_payload
        rsc_payload = reedsolo.RSCodec(nsym_payload)
        payload_blocks = []
        for i in range(num_blocks):
            block = payload_fec[i*block_length:(i+1)*block_length]
            try:
                decoded_block = rsc_payload.decode(block)[0]
            except reedsolo.ReedSolomonError as e:
                logger.warning(f"Block {i} uncorrectable; using raw block data. Error: {e}")
                decoded_block = block[:block_size]
            payload_blocks.append(decoded_block)
        payload = b"".join(payload_blocks)
        payload = payload[:orig_payload_length]
        return header + payload
    except Exception as e:
        logger.error(f"Error decoding composite structure: {e}")
        raise

# --- Main Processing Chain ---

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 process_file.py inputfile")
        sys.exit(1)
    input_file = sys.argv[1]
    base, ext = os.path.splitext(input_file)
    output_file = f"{base}-output{ext}"

    config = load_config("config.yaml")
    mod_config = config.get("modulation", {})
    channel_config = config.get("channel_effects", {})

    try:
        with open(input_file, "rb") as f:
            file_data = f.read()
    except Exception as e:
        logger.error(f"Error reading input file: {e}")
        sys.exit(1)

    # Split file into header and payload.
    if len(file_data) < HEADER_LENGTH:
        header = file_data.ljust(HEADER_LENGTH, b'\x00')
        payload = b""
    else:
        header = file_data[:HEADER_LENGTH]
        payload = file_data[HEADER_LENGTH:]

    composite_bytes = build_composite(header, payload, nsym_header=15, nsym_payload=6, block_size=200)
    bits = bits_from_bytes(composite_bytes)

    mod_signal = qpsk_modulate(bits, mod_config)

    # --- Channel Effects ---
    # First, apply path loss to simulate realistic propagation
    mod_signal_pathloss = apply_path_loss(mod_signal, channel_config)
    # Next, apply AWGN channel effect.
    mod_signal_noisy = apply_awgn(mod_signal_pathloss, channel_config)

    recovered_bits = qpsk_demodulate(mod_signal_noisy, mod_config)

    composite_recovered = bytes_from_bits(recovered_bits)

    try:
        recovered_file = demodulate_composite(composite_recovered, nsym_payload=6)
    except Exception as e:
        logger.error(f"Failed to decode composite structure: {e}")
        sys.exit(1)

    try:
        with open(output_file, "wb") as f:
            f.write(recovered_file)
        print(f"Processing complete. Output written to {output_file}")
    except Exception as e:
        logger.error(f"Error writing output file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
