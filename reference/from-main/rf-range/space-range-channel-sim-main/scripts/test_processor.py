#!/usr/bin/env python3

import os
import time
import yaml
import logging
import shutil
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from process_iq import IQProcessor
from datetime import datetime, timedelta
import threading

class TestFileHandler(FileSystemEventHandler):
    def __init__(self):
        # Load configuration
        with open('/var/app/config.yaml', 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Setup logging
        logging.basicConfig(
            filename=self.config['logging']['file'],
            level=getattr(logging, self.config['logging']['level']),
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('test_processor')
        
        # Initialize IQ processor
        self.processor = IQProcessor()
        
        # Paths
        self.working_dir = '/var/app/test_working'
        self.modulated_dir = os.path.join(self.working_dir, 'modulated')
        self.processed_dir = os.path.join(self.working_dir, 'processed')
        
        # Start cleanup thread
        self.start_cleanup_thread()

    def start_cleanup_thread(self):
        cleanup_thread = threading.Thread(target=self.periodic_cleanup, daemon=True)
        cleanup_thread.start()

    def periodic_cleanup(self):
        while True:
            try:
                self.cleanup_old_files()
                time.sleep(3600)  # Every hour
            except Exception as e:
                self.logger.error(f"Cleanup error: {str(e)}")

    def cleanup_old_files(self):
        cutoff_time = datetime.now() - timedelta(hours=24)
        directories = [
            '/var/app/test_incoming',
            '/var/app/test_outgoing',
            self.modulated_dir,
            self.processed_dir
        ]
        
        for directory in directories:
            try:
                for filename in os.listdir(directory):
                    filepath = os.path.join(directory, filename)
                    if os.path.getmtime(filepath) < cutoff_time.timestamp():
                        os.remove(filepath)
                        self.logger.info(f"Cleaned up: {filepath}")
            except Exception as e:
                self.logger.error(f"Cleanup error in {directory}: {str(e)}")

    def modulate_file(self, input_file, output_file):
        """QPSK modulate the input file"""
        try:
            cmd = [
                'python3',
                '/var/app/scripts/qpsk_modulate.py',
                input_file,
                output_file
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Modulation error: {str(e)}")
            return False

    def demodulate_file(self, input_file, output_file):
        """QPSK demodulate the file"""
        try:
            cmd = [
                'python3',
                '/var/app/scripts/qpsk_demodulate.py',
                input_file,
                output_file
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Demodulation error: {str(e)}")
            return False

    def process_image(self, input_path):
        """Process an image through modulation, channel effects, and demodulation"""
        try:
            filename = os.path.basename(input_path)
            basename = os.path.splitext(filename)[0]

            # Save original
            original_path = os.path.join('/var/app/originals', filename)
            shutil.copy2(input_path, original_path)

            # Modulation phase
            modulated_path = os.path.join(self.modulated_dir, f"{basename}.iq")
            if not self.modulate_file(input_path, modulated_path):
                raise Exception("Modulation failed")

            # Channel effects phase
            processed_path = os.path.join(self.processed_dir, f"{basename}.iq")
            if not self.processor.process_file(modulated_path, processed_path):
                raise Exception("Channel processing failed")

            # Demodulation phase
            output_path = os.path.join('/var/app/test_outgoing', filename)
            if not self.demodulate_file(processed_path, output_path):
                raise Exception("Demodulation failed")

            # Create status file
            status_path = os.path.join('/var/app/test_outgoing', f"{basename}.status")
            with open(status_path, 'w') as f:
                f.write(f"Processing completed: {datetime.now().isoformat()}\n")
                f.write(f"Original file: {filename}\n")
                f.write("Stages: Modulation -> Channel Effects -> Demodulation\n")

            # Cleanup intermediate files
            os.remove(modulated_path)
            os.remove(processed_path)

            self.logger.info(f"Successfully processed image: {filename}")
            return True

        except Exception as e:
            self.logger.error(f"Error processing image {input_path}: {str(e)}")
            return False

    def on_created(self, event):
        if event.is_directory:
            return

        if not event.src_path.lower().endswith(('.jpg', '.jpeg', '.png')):
            return

        try:
            self.logger.info(f"New image detected: {event.src_path}")
            time.sleep(0.5)  # Ensure file is fully written
            self.process_image(event.src_path)
            
            # Remove input file after processing
            try:
                os.remove(event.src_path)
            except Exception as e:
                self.logger.error(f"Error removing input file: {str(e)}")

        except Exception as e:
            self.logger.error(f"Error handling file {event.src_path}: {str(e)}")

def setup_test_environment():
    """Ensure all necessary directories exist"""
    directories = [
        '/var/app/test_incoming',
        '/var/app/test_outgoing',
        '/var/app/test_working/modulated',
        '/var/app/test_working/processed',
        '/var/app/originals',
        '/var/app/logs'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        os.chmod(directory, 0o755)

    # Create log file if needed
    log_file = '/var/app/logs/test_processor.log'
    if not os.path.exists(log_file):
        open(log_file, 'a').close()
    os.chmod(log_file, 0o644)

def main():
    try:
        setup_test_environment()
        event_handler = TestFileHandler()
        observer = Observer()
        observer.schedule(event_handler, '/var/app/test_incoming', recursive=False)
        observer.start()

        print("Test processor started - monitoring /var/app/test_incoming")
        print("Processed images will appear in /var/app/test_outgoing")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
            print("\nTest processor stopped")
        
        observer.join()

    except Exception as e:
        print(f"Error starting test processor: {str(e)}")
        logging.error(f"Error starting test processor: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
