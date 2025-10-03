# process_iq.py

import os
import numpy as np
import logging
import yaml
from channel_effects import ChannelEffects

class IQProcessor:
    def __init__(self, config_path='/var/app/config.yaml'):
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Setup logging
        self.setup_logging()
        
        # Initialize channel effects
        self.channel = ChannelEffects(self.config)
        
        self.logger = logging.getLogger('channel_sim')

    def setup_logging(self):
        """Configure logging based on config settings."""
        log_config = self.config['logging']
        logging.basicConfig(
            filename=log_config['file'],
            level=getattr(logging, log_config['level']),
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

    def process_file(self, input_path, output_path):
        """Process an IQ file through the channel simulator."""
        try:
            self.logger.info(f"Processing file: {input_path}")
            
            # Read input signal
            signal = np.fromfile(input_path, dtype=np.float64)
            
            # Check file size
            file_size = os.path.getsize(input_path)
            max_size = self.config['processing']['max_file_size']
            if file_size > max_size:
                raise ValueError(f"File size {file_size} exceeds maximum {max_size}")

            # Process signal through channel effects
            processed_signal = self.channel.process_signal(signal)
            
            # Save processed signal
            processed_signal.astype(np.float64).tofile(output_path)
            
            self.logger.info(f"Processed file saved to: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error processing file {input_path}: {str(e)}")
            return False

    def process_directory(self, input_dir, output_dir):
        """Process all IQ files in a directory."""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(output_dir, exist_ok=True)
            
            # Get list of files to process
            files = [f for f in os.listdir(input_dir) if f.endswith('.iq')]
            
            for filename in files:
                input_path = os.path.join(input_dir, filename)
                output_path = os.path.join(output_dir, filename)
                self.process_file(input_path, output_path)

        except Exception as e:
            self.logger.error(f"Error processing directory {input_dir}: {str(e)}")
            raise

def main():
    processor = IQProcessor()
    processor.process_directory('/var/app/incoming', '/var/app/outgoing')

if __name__ == "__main__":
    main()
