# socket_vm.py

import socket
import yaml
import time
import logging
import os
import threading
from process_iq import IQProcessor

class SocketVM:
    def __init__(self):
        self.load_config()
        self.setup_logging()
        self.setup_directories()
        self.setup_networking()
        self.iq_processor = IQProcessor()
        
    def load_config(self):
        with open('/var/app/config.yaml', 'r') as f:
            self.config = yaml.safe_load(f)
            
        self.local_vm = self.config['local_vm']
        self.local_ip = self.config['ips'][self.local_vm]
        self.send_port = self.config['ports'][f"{self.local_vm}_send"]
        self.receive_port = self.config['ports'][f"{self.local_vm}_receive"]
        
        # Determine routing based on local VM
        if self.local_vm == 'vm_b':  # We are the channel simulator
            self.vm_a_ip = self.config['ips']['vm_a']
            self.vm_c_ip = self.config['ips']['vm_c']
            self.vm_a_port = self.config['ports']['vm_a_receive']
            self.vm_c_port = self.config['ports']['vm_c_receive']

    def setup_logging(self):
        log_path = self.config['logging']['file']
        logging.basicConfig(
            filename=log_path,
            level=getattr(logging, self.config['logging']['level']),
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('channel_sim')

    def setup_directories(self):
        os.makedirs('/var/app/incoming', exist_ok=True)
        os.makedirs('/var/app/outgoing', exist_ok=True)
        os.makedirs('/var/app/sent', exist_ok=True)

    def setup_networking(self):
        self.receive_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.receive_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.receive_socket.bind((self.local_ip, self.receive_port))
        self.receive_socket.listen(5)

    def route_file(self, filename, source_ip):
        """Determine destination for file based on source."""
        if source_ip == self.vm_a_ip:
            return self.vm_c_ip, self.vm_c_port
        elif source_ip == self.vm_c_ip:
            return self.vm_a_ip, self.vm_a_port
        else:
            raise ValueError(f"Unknown source IP: {source_ip}")

    def send_file(self, filepath, dest_ip, dest_port):
        """Send a file to the destination VM."""
        try:
            send_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            send_socket.settimeout(5)
            send_socket.connect((dest_ip, dest_port))

            with open(filepath, 'rb') as f:
                content = f.read()
            
            filename = os.path.basename(filepath)
            send_socket.sendall(f"FILE:{filename}:".encode('utf-8') + content)
            send_socket.close()
            
            self.logger.info(f"Sent file {filename} to {dest_ip}:{dest_port}")
            return True

        except Exception as e:
            self.logger.error(f"Error sending file: {str(e)}")
            return False

    def process_and_forward(self, filename, source_ip):
        """Process a file through the channel simulator and forward it."""
        try:
            # Process the file
            input_path = os.path.join('/var/app/incoming', filename)
            output_path = os.path.join('/var/app/outgoing', filename)
            
            if self.iq_processor.process_file(input_path, output_path):
                # Get destination
                dest_ip, dest_port = self.route_file(filename, source_ip)
                
                # Send processed file
                if self.send_file(output_path, dest_ip, dest_port):
                    # Cleanup
                    os.remove(input_path)
                    os.remove(output_path)
                    self.logger.info(f"Successfully processed and forwarded {filename}")
                    return True
            
            return False

        except Exception as e:
            self.logger.error(f"Error in process_and_forward: {str(e)}")
            return False

    def receive_data(self):
        """Handle incoming connections and file transfers."""
        while True:
            try:
                connection, addr = self.receive_socket.accept()
                data = b''
                
                while True:
                    packet = connection.recv(4096)
                    if not packet:
                        break
                    data += packet

                if data.startswith(b"FILE:"):
                    # Parse file data
                    header_end = data.find(b':', 5)
                    filename = data[5:header_end].decode('utf-8')
                    content = data[header_end+1:]
                    
                    # Save received file
                    filepath = os.path.join('/var/app/incoming', filename)
                    with open(filepath, 'wb') as f:
                        f.write(content)
                    
                    self.logger.info(f"Received file: {filename} from {addr}")
                    
                    # Process and forward
                    self.process_and_forward(filename, addr[0])

                connection.close()

            except Exception as e:
                self.logger.error(f"Error in receive_data: {str(e)}")

    def run(self):
        """Start the socket VM service."""
        self.logger.info(f"Starting channel simulator service on {self.local_ip}")
        receive_thread = threading.Thread(target=self.receive_data)
        receive_thread.daemon = True
        receive_thread.start()
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.logger.info("Service stopping...")
        finally:
            self.receive_socket.close()

def main():
    socket_vm = SocketVM()
    socket_vm.run()

if __name__ == "__main__":
    main()
