#!/usr/bin/env python3

import os
import sys
import time
import numpy as np
import psutil
import matplotlib.pyplot as plt
from channel_effects import ChannelEffects
import yaml
from pathlib import Path
import json

class PerformanceTester:
    def __init__(self):
        self.load_config()
        self.channel = ChannelEffects(self.config)
        self.results_dir = Path("performance_results")
        self.results_dir.mkdir(exist_ok=True)

    def load_config(self):
        with open('/var/app/config.yaml', 'r') as f:
            self.config = yaml.safe_load(f)

    def generate_test_signal(self, size_mb):
        """Generate test signal of specified size."""
        size_bytes = size_mb * 1024 * 1024
        num_samples = size_bytes // 8  # float64 = 8 bytes
        # Add padding byte for QPSK compatibility
        return np.concatenate(([0], np.random.randn(num_samples))).astype(np.float64)

    def measure_memory(self):
        """Get current memory usage."""
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # MB

    def test_file_sizes(self, sizes_mb=[1, 10, 50, 100]):
        """Test processing performance with different file sizes."""
        results = []
        
        for size_mb in sizes_mb:
            print(f"\nTesting {size_mb}MB file...")
            signal = self.generate_test_signal(size_mb)
            
            # Measure performance
            start_mem = self.measure_memory()
            start_time = time.time()
            
            processed = self.channel.process_signal(signal)
            
            end_time = time.time()
            end_mem = self.measure_memory()
            
            result = {
                'size_mb': size_mb,
                'processing_time': end_time - start_time,
                'memory_usage': end_mem - start_mem,
                'throughput': size_mb / (end_time - start_time)
            }
            results.append(result)
            print(f"Processed in {result['processing_time']:.2f}s")
            print(f"Memory usage: {result['memory_usage']:.2f}MB")
            print(f"Throughput: {result['throughput']:.2f}MB/s")

        return results

    def test_concurrent_load(self, num_signals=5, signal_size_mb=10):
        """Test processing multiple signals concurrently."""
        signals = [self.generate_test_signal(signal_size_mb) for _ in range(num_signals)]
        start_time = time.time()
        memory_usage = []
        
        for i, signal in enumerate(signals):
            print(f"\nProcessing signal {i+1}/{num_signals}")
            memory_before = self.measure_memory()
            self.channel.process_signal(signal)
            memory_after = self.measure_memory()
            memory_usage.append(memory_after - memory_before)
        
        total_time = time.time() - start_time
        
        return {
            'num_signals': num_signals,
            'signal_size_mb': signal_size_mb,
            'total_time': total_time,
            'avg_time_per_signal': total_time / num_signals,
            'peak_memory_usage': max(memory_usage),
            'avg_memory_usage': sum(memory_usage) / len(memory_usage)
        }

    def plot_results(self, size_results, concurrent_results):
        """Generate performance plots."""
        # File Size vs Processing Time
        plt.figure(figsize=(10, 5))
        sizes = [r['size_mb'] for r in size_results]
        times = [r['processing_time'] for r in size_results]
        plt.plot(sizes, times, 'b-o')
        plt.xlabel('File Size (MB)')
        plt.ylabel('Processing Time (s)')
        plt.title('Processing Time vs File Size')
        plt.grid(True)
        plt.savefig(self.results_dir / 'size_vs_time.png')
        plt.close()

        # Throughput Analysis
        plt.figure(figsize=(10, 5))
        throughput = [r['throughput'] for r in size_results]
        plt.plot(sizes, throughput, 'g-o')
        plt.xlabel('File Size (MB)')
        plt.ylabel('Throughput (MB/s)')
        plt.title('Processing Throughput vs File Size')
        plt.grid(True)
        plt.savefig(self.results_dir / 'throughput.png')
        plt.close()

        # Memory Usage
        plt.figure(figsize=(10, 5))
        memory = [r['memory_usage'] for r in size_results]
        plt.plot(sizes, memory, 'r-o')
        plt.xlabel('File Size (MB)')
        plt.ylabel('Memory Usage (MB)')
        plt.title('Memory Usage vs File Size')
        plt.grid(True)
        plt.savefig(self.results_dir / 'memory_usage.png')
        plt.close()

    def generate_report(self, size_results, concurrent_results):
        """Generate performance report."""
        report = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'system_info': {
                'cpu_count': psutil.cpu_count(),
                'memory_total': psutil.virtual_memory().total / (1024**3),  # GB
                'python_version': sys.version
            },
            'size_tests': size_results,
            'concurrent_tests': concurrent_results
        }

        # Save report
        with open(self.results_dir / 'performance_report.json', 'w') as f:
            json.dump(report, f, indent=2)

        # Generate HTML report
        html_content = f"""
        <html>
        <head>
            <title>Channel Simulator Performance Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .section {{ margin-bottom: 30px; }}
                .graph {{ margin: 20px 0; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>Performance Test Results</h1>
            <div class="section">
                <h2>System Information</h2>
                <p>CPU Cores: {report['system_info']['cpu_count']}</p>
                <p>Total Memory: {report['system_info']['memory_total']:.2f} GB</p>
                <p>Python Version: {report['system_info']['python_version']}</p>
            </div>
            
            <div class="section">
                <h2>File Size Tests</h2>
                <div class="graph">
                    <img src="size_vs_time.png" width="800">
                    <img src="throughput.png" width="800">
                    <img src="memory_usage.png" width="800">
                </div>
            </div>

            <div class="section">
                <h2>Concurrent Processing Test</h2>
                <p>Number of Signals: {concurrent_results['num_signals']}</p>
                <p>Signal Size: {concurrent_results['signal_size_mb']} MB</p>
                <p>Total Processing Time: {concurrent_results['total_time']:.2f}s</p>
                <p>Average Time per Signal: {concurrent_results['avg_time_per_signal']:.2f}s</p>
                <p>Peak Memory Usage: {concurrent_results['peak_memory_usage']:.2f} MB</p>
            </div>
        </body>
        </html>
        """

        with open(self.results_dir / 'performance_report.html', 'w') as f:
            f.write(html_content)

    def run_all_tests(self):
        """Run all performance tests."""
        print("Starting performance tests...")
        
        print("\nTesting different file sizes...")
        size_results = self.test_file_sizes()
        
        print("\nTesting concurrent processing...")
        concurrent_results = self.test_concurrent_load()
        
        print("\nGenerating plots and reports...")
        self.plot_results(size_results, concurrent_results)
        self.generate_report(size_results, concurrent_results)
        
        print(f"\nTest results saved to {self.results_dir}")
        print(f"View detailed report at {self.results_dir}/performance_report.html")

def main():
    tester = PerformanceTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
