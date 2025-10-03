#!/usr/bin/env python3

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from channel_effects import ChannelEffects
import yaml
from pathlib import Path
import shutil
from datetime import datetime
import json

class ImageQualityTester:
    def __init__(self):
        self.setup_directories()
        self.load_config()
        self.channel = ChannelEffects(self.config)

    def setup_directories(self):
        """Create test directory structure."""
        self.test_dir = Path("test_results") / datetime.now().strftime("%Y%m%d_%H%M%S")
        self.dirs = {
            'original': self.test_dir / 'original',
            'awgn_only': self.test_dir / 'awgn_only',
            'path_loss_only': self.test_dir / 'path_loss_only',
            'combined_effects': self.test_dir / 'combined_effects'
        }
        
        for dir_path in self.dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)

    def load_config(self):
        """Load channel configuration."""
        with open('/var/app/config.yaml', 'r') as f:
            self.config = yaml.safe_load(f)

    def process_image(self, image_path, effect_type='combined'):
        """Process image with specified effect type."""
        # Read image as IQ data
        signal = np.fromfile(image_path, dtype=np.float64)
        
        # Apply effects based on type
        if effect_type == 'awgn':
            processed = self.channel.apply_awgn(signal.copy())
        elif effect_type == 'path_loss':
            processed = self.channel.apply_path_loss(signal.copy())
        else:  # combined
            processed = self.channel.process_signal(signal.copy())
            
        return processed

    def generate_report(self, results):
        """Generate HTML report with comparisons."""
        html_content = """
        <html>
        <head>
            <title>Channel Effects Comparison</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .image-set { margin-bottom: 40px; }
                .parameters { background: #f0f0f0; padding: 10px; }
            </style>
        </head>
        <body>
            <h1>Channel Effects Comparison Report</h1>
            <div class="parameters">
                <h2>Channel Parameters:</h2>
                <pre>{}</pre>
            </div>
        """.format(json.dumps(self.config['channel_effects'], indent=2))

        for image_name, image_results in results.items():
            html_content += f"""
            <div class="image-set">
                <h2>{image_name}</h2>
                <div class="images">
                    <img src="original/{image_name}" width="200">
                    <img src="awgn_only/{image_name}" width="200">
                    <img src="path_loss_only/{image_name}" width="200">
                    <img src="combined_effects/{image_name}" width="200">
                </div>
                <div class="metrics">
                    <p>AWGN SNR: {image_results['awgn_snr']:.2f} dB</p>
                    <p>Path Loss: {image_results['path_loss']:.2f} dB</p>
                </div>
            </div>
            """

        html_content += "</body></html>"
        
        with open(self.test_dir / 'report.html', 'w') as f:
            f.write(html_content)

    def process_sample_directory(self):
        """Process all images in samples directory."""
        samples_dir = Path("/var/app/samples")
        results = {}

        for image_path in samples_dir.glob("*.iq"):
            image_name = image_path.name
            print(f"Processing {image_name}...")

            # Copy original
            shutil.copy(image_path, self.dirs['original'] / image_name)

            # Process with different effects
            awgn_signal = self.process_image(image_path, 'awgn')
            path_loss_signal = self.process_image(image_path, 'path_loss')
            combined_signal = self.process_image(image_path, 'combined')

            # Save processed signals
            awgn_signal.tofile(self.dirs['awgn_only'] / image_name)
            path_loss_signal.tofile(self.dirs['path_loss_only'] / image_name)
            combined_signal.tofile(self.dirs['combined_effects'] / image_name)

            # Calculate metrics
            results[image_name] = {
                'awgn_snr': self.calculate_snr(awgn_signal),
                'path_loss': self.calculate_path_loss(path_loss_signal)
            }

        # Generate report
        self.generate_report(results)
        print(f"\nResults saved to {self.test_dir}")
        print(f"View report at {self.test_dir}/report.html")

    def calculate_snr(self, processed_signal):
        """Calculate SNR of processed signal."""
        # Skip padding byte
        signal = processed_signal[1:]
        noise = signal - np.mean(signal)
        return 10 * np.log10(np.mean(signal**2) / np.mean(noise**2))

    def calculate_path_loss(self, processed_signal):
        """Calculate path loss in dB."""
        # Skip padding byte
        return -20 * np.log10(np.mean(np.abs(processed_signal[1:])))

def main():
    tester = ImageQualityTester()
    tester.process_sample_directory()

if __name__ == "__main__":
    main()
