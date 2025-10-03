#!/usr/bin/env python3
"""
Generate a demo IQ file with synthetic RF signals
"""
import numpy as np

# Configuration
SAMPLE_RATE = 1024000  # 1.024 MHz
DURATION = 10  # seconds
NUM_SAMPLES = SAMPLE_RATE * DURATION

print(f"Generating {DURATION}s demo IQ file...")
print(f"Sample rate: {SAMPLE_RATE} Hz")
print(f"Total samples: {NUM_SAMPLES}")

# Time vector
t = np.arange(NUM_SAMPLES) / SAMPLE_RATE

# Create composite signal with multiple tones
signal = np.zeros(NUM_SAMPLES, dtype=np.complex64)

# Add a few carrier tones at different frequencies
# Tone 1: Strong carrier at -100 kHz
signal += 0.3 * np.exp(2j * np.pi * -100000 * t)

# Tone 2: Medium carrier at 0 Hz (center)
signal += 0.2 * np.exp(2j * np.pi * 0 * t)

# Tone 3: Weak carrier at +150 kHz
signal += 0.15 * np.exp(2j * np.pi * 150000 * t)

# Tone 4: Very weak carrier at +250 kHz
signal += 0.1 * np.exp(2j * np.pi * 250000 * t)

# Add some background noise for realism
noise_i = np.random.randn(NUM_SAMPLES) * 0.05
noise_q = np.random.randn(NUM_SAMPLES) * 0.05
signal += noise_i + 1j * noise_q

# Normalize to prevent clipping
max_amplitude = np.max(np.abs(signal))
signal = signal / max_amplitude * 0.8

# Write to file (complex64 format)
output_file = "iq_files/demo.iq"
signal.tofile(output_file)

print(f"✅ Demo IQ file created: {output_file}")
print(f"   File size: {signal.nbytes / 1024 / 1024:.2f} MB")
print(f"   Contains 4 carrier tones at -100, 0, +150, +250 kHz")
