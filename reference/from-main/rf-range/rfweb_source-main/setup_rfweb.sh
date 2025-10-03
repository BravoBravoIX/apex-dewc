#!/bin/bash
set -e

# Install required system packages
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y \
    python3-venv \
    python3-pip \
    python3-dev \
    build-essential

# Variables (adjust if needed)
PROJECT_DIR="/opt/rfweb"
STATIC_DIR="$PROJECT_DIR/static"
SOURCE_DIR="$(pwd)"  # Current directory is the source directory

echo "Creating project directory: $PROJECT_DIR"
sudo mkdir -p "$PROJECT_DIR"
sudo chown $USER:$USER "$PROJECT_DIR"

echo "Creating static directory: $STATIC_DIR"
mkdir -p "$STATIC_DIR"

# Create Python virtual environment
cd "$PROJECT_DIR"
python3 -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install Flask PyYAML numpy reedsolo

echo "Copying app.py..."
cp "$SOURCE_DIR/app.py" "$PROJECT_DIR/app.py"

echo "Copying process_file.py and config.yaml..."
cp "$SOURCE_DIR/process_file.py" "$PROJECT_DIR/process_file.py"
cp "$SOURCE_DIR/config.yaml" "$PROJECT_DIR/config.yaml"

echo "Copying image_test.jpg to static folder..."
cp "$SOURCE_DIR/image_test.jpg" "$STATIC_DIR/image_test.jpg"

echo "Setup complete."
echo "To run the server, do the following:"
echo "cd $PROJECT_DIR && source venv/bin/activate && python3 app.py"
