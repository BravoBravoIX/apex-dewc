#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create a simple test image
width, height = 600, 400
image = Image.new('RGB', (width, height), '#1a1a2e')
draw = ImageDraw.Draw(image)

# Draw some text
try:
    # Try to use a monospace font
    font_large = ImageFont.truetype("/System/Library/Fonts/Monaco.dfont", 36)
    font_small = ImageFont.truetype("/System/Library/Fonts/Monaco.dfont", 20)
except:
    # Fallback to default font
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Add text
draw.text((width//2, height//3), "SCIP INJECT MEDIA", fill='#16c79a', anchor='mm', font=font_large)
draw.text((width//2, height//2), "Test Image for Exercise", fill='#f8f1f1', anchor='mm', font=font_small)

# Draw a border
draw.rectangle([50, 300, width-50, 380], outline='#16c79a', width=2)
draw.text((width//2, 340), "Priority System Alert", fill='#ff6b6b', anchor='mm', font=font_small)

# Save the image
output_path = '/Users/brettburford/Development/CyberOps/scip-v3/scenarios/media/library/test-alert.png'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
image.save(output_path)
print(f"Created test image: {output_path}")