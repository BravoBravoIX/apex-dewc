from flask import Flask, render_template_string, request, redirect, url_for
import os, subprocess, tempfile, shutil, yaml

app = Flask(__name__)
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(PROJECT_DIR, 'static')
PROCESS_SCRIPT = os.path.join(PROJECT_DIR, 'process_file.py')
CONFIG_FILE = os.path.join(PROJECT_DIR, 'config.yaml')

def get_current_snr():
    try:
        with open(CONFIG_FILE, 'r') as f:
            config = yaml.safe_load(f)
        return config.get('channel_effects', {}).get('awgn', {}).get('snr_db', 7.5)
    except Exception:
        return 7.5

@app.route("/")
def index():
    current_snr = get_current_snr()
    error = request.args.get("error")
    processed_image = None
    if os.path.exists(os.path.join(STATIC_DIR, "image_test-output.jpg")):
        processed_image = "image_test-output.jpg"
    # The description explains the processing chain.
    processing_description = (
        "When an image is processed, the input file is split into a header and payload. "
        "The header and payload are protected using forward error correction (FEC) via Reed-Solomon codes, "
        "and then combined into a composite data structure. This composite is converted into a bitstream and "
        "modulated using Quadrature Phase Shift Keying (QPSK). The modulated signal is passed through a simulated "
        "channel where path loss and additive white Gaussian noise (AWGN) are applied based on the current SNR value. "
        "Finally, the signal is demodulated and decoded to reconstruct the processed image."
    )
    return render_template_string("""
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>RF Processing Simulator</title>
      <!-- Tailwind CSS from CDN -->
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <script>
        function updateSliderValue(val) {
          document.getElementById('snr_value').innerText = val;
          // Auto-update SNR via AJAX
          fetch("{{ url_for('update_snr') }}", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "snr=" + encodeURIComponent(val)
          }).then(response => {
            console.log("SNR updated");
          }).catch(err => {
            console.error("Error updating SNR:", err);
          });
        }
      </script>
    </head>
    <body class="bg-gray-900 text-gray-100">
      <div class="container mx-auto p-6">
        <h1 class="text-3xl font-bold mb-6 text-center">RF Processing Simulator</h1>

        {% if error %}
        <div class="bg-red-500 text-white p-4 rounded mb-4 text-center text-xl font-bold">
          SYNC LOST
        </div>
        {% endif %}

        <div class="mb-6">
          <label for="snr" class="block mb-2 text-lg">Set SNR (dB): <span id="snr_value">{{ current_snr }}</span></label>
          <input type="range" id="snr" name="snr" min="0" max="12" step="0.5" value="{{ current_snr }}" oninput="updateSliderValue(this.value)" class="w-full">
        </div>

        <div class="mb-6 text-center">
          <form action="{{ url_for('process_image') }}" method="post">
            <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Process Image</button>
          </form>
        </div>

        <div class="flex flex-col md:flex-row md:space-x-4">
          <div class="w-full md:w-1/2 mb-4 md:mb-0">
            <h2 class="text-2xl font-semibold mb-2">Original Image</h2>
            <img src="{{ url_for('static', filename='image_test.jpg') }}" alt="Original Image" class="rounded shadow">
          </div>
          {% if processed_image %}
          <div class="w-full md:w-1/2">
            <h2 class="text-2xl font-semibold mb-2">Processed Image</h2>
            <img src="{{ url_for('static', filename=processed_image) }}" alt="Processed Image" class="rounded shadow">
          </div>
          {% endif %}
        </div>

        <div class="mt-8 p-4 bg-gray-800 rounded shadow">
          <h2 class="text-2xl font-semibold mb-2">Processing Details</h2>
          <p class="text-sm leading-relaxed">
            {{ processing_description }}
          </p>
        </div>
      </div>
    </body>
    </html>
    """, current_snr=current_snr, processed_image=processed_image, error=error, processing_description=processing_description)

@app.route("/process", methods=["POST"])
def process_image():
    temp_dir = tempfile.mkdtemp()
    try:
        input_image = os.path.join(temp_dir, "image_test.jpg")
        shutil.copy(os.path.join(STATIC_DIR, "image_test.jpg"), input_image)
        result = subprocess.run(["python3", PROCESS_SCRIPT, input_image],
                                cwd=PROJECT_DIR, capture_output=True, text=True)
        if result.returncode != 0:
            print("Processing error:", result.stderr)  # Keep for debugging
            return redirect(url_for("index", error="sync_lost"))
        output_image = os.path.join(temp_dir, "image_test-output.jpg")
        if not os.path.exists(output_image):
            return redirect(url_for("index", error="sync_lost"))
        dest_image = os.path.join(STATIC_DIR, "image_test-output.jpg")
        shutil.copy(output_image, dest_image)
    finally:
        shutil.rmtree(temp_dir)
    return redirect(url_for("index"))

@app.route("/update_snr", methods=["POST"])
def update_snr():
    new_snr = request.form.get("snr")
    try:
        with open(CONFIG_FILE, "r") as f:
            config = yaml.safe_load(f)
    except Exception:
        config = {}
    if 'channel_effects' not in config:
        config['channel_effects'] = {}
    if 'awgn' not in config['channel_effects']:
        config['channel_effects']['awgn'] = {}
    config['channel_effects']['awgn']['snr_db'] = float(new_snr)
    with open(CONFIG_FILE, "w") as f:
        yaml.safe_dump(config, f)
    return "", 204

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
