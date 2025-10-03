# SDR/GQRX Scenario - V1 Simplified Implementation Plan

## Overview

Create a realistic RF monitoring scenario where participants use **GQRX** (professional SDR software) to observe spectrum, while controlling IQ playback and jamming effects through a simple browser control panel. All visualization happens in GQRX - the browser is just for control.

## Concept Simplification

**What participants see:**
- **GQRX window:** Real-time waterfall, spectrum analyzer, audio (professional SDR tool)
- **Browser control panel:** Play/Stop buttons + 5 jamming type buttons
- **APEX inject system:** Automated scenario progression (optional manual control)

**Benefits of this approach:**
- ✅ Participants use professional RF tools (more realistic)
- ✅ No complex browser visualization (faster to build)
- ✅ GQRX handles all heavy lifting (waterfall, FFT, demodulation)
- ✅ You already have jamming code to integrate
- ✅ Much lower risk and development time

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Participant's Computer                         │
│                                                  │
│  ┌────────────────────────┐                    │
│  │  GQRX                  │                    │
│  │  ┌──────────────────┐  │                    │
│  │  │   Waterfall      │  │ ← Primary Display  │
│  │  │   Spectrum       │  │                    │
│  │  │   Audio          │  │                    │
│  │  └──────────────────┘  │                    │
│  │  Connected to:         │                    │
│  │  rtl_tcp://server:1234 │                    │
│  └────────────────────────┘                    │
│              ▲                                   │
│              │                                   │
│  ┌───────────┴────────────┐                    │
│  │  Browser Control Panel │                    │
│  │  [▶ Play]  [⏹ Stop]   │ ← Simple Controls  │
│  │  [Jam: CW] [Jam: Noise]│                    │
│  │  [Jam: Sweep] [Clear]  │                    │
│  └────────────────────────┘                    │
└─────────────────────────────────────────────────┘
                    │
                    │ MQTT Commands
                    ▼
┌─────────────────────────────────────────────────┐
│  APEX Server                                     │
│                                                  │
│  ┌────────────────────────────────────┐        │
│  │  SDR Service                       │        │
│  │  ├── IQ File Player                │        │
│  │  ├── Signal Mixer (your code)      │        │
│  │  └── RTL-TCP Server                │        │
│  │       └─→ Port 1234                │        │
│  └────────────────────────────────────┘        │
│                                                  │
│  ┌────────────────────────────────────┐        │
│  │  Orchestration                     │        │
│  │  └── MQTT Inject System            │        │
│  └────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

## What We're Building

### 1. Backend SDR Service (New)
**Directory:** `/sdr-service/`

**Components:**
- RTL-TCP server (streams to GQRX)
- IQ file player (reads .iq files)
- Signal mixer (integrates your jamming code)
- MQTT listener (receives inject commands)

### 2. Frontend Control Panel (New)
**Directory:** `/team-dashboard-sdr/`

**Strategy:** Copy existing `team-dashboard-satcom`, strip to basics

**Components:**
- Simple header
- Control button panel (7 buttons total)
- Connection status indicator
- Scenario instructions panel

### 3. Scenario Definition (New)
**File:** `/scenarios/sdr-rf-monitoring-scenario.json`

**Timeline with jamming injects**

---

## Implementation Steps

### Step 1: Backend SDR Service (8-10 hours)

#### 1.1 Create Service Structure

```bash
mkdir -p sdr-service/app
mkdir -p sdr-service/iq_files
```

**File:** `/sdr-service/requirements.txt`
```
numpy==1.26.4
asyncio
paho-mqtt==2.1.0
```

**File:** `/sdr-service/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app/

EXPOSE 1234

CMD ["python", "main.py"]
```

#### 1.2 IQ File Player

**File:** `/sdr-service/app/iq_player.py`

```python
import numpy as np
import asyncio

class IQPlayer:
    def __init__(self, file_path, sample_rate=1024000):
        self.file_path = file_path
        self.sample_rate = sample_rate
        self.running = False
        self.paused = False
        self.position = 0
        self.samples = None

    def load_file(self):
        """Load IQ file as complex float32 numpy array"""
        print(f"Loading IQ file: {self.file_path}")

        # Support .iq (complex64) format
        self.samples = np.fromfile(self.file_path, dtype=np.complex64)

        print(f"Loaded {len(self.samples)} samples ({len(self.samples)/self.sample_rate:.1f} seconds)")
        return self.samples

    async def get_chunk(self, chunk_size=16384):
        """Get next chunk of samples"""
        if not self.running or self.paused:
            await asyncio.sleep(0.1)
            return None

        if self.samples is None:
            self.load_file()

        # Get chunk
        end_pos = min(self.position + chunk_size, len(self.samples))
        chunk = self.samples[self.position:end_pos]

        # Loop if reached end
        if end_pos >= len(self.samples):
            self.position = 0
        else:
            self.position = end_pos

        # Real-time pacing
        await asyncio.sleep(chunk_size / self.sample_rate)

        return chunk

    def play(self):
        """Start playback"""
        self.running = True
        self.paused = False
        print("▶ Playback started")

    def pause(self):
        """Pause playback"""
        self.paused = True
        print("⏸ Playback paused")

    def stop(self):
        """Stop playback"""
        self.running = False
        self.position = 0
        print("⏹ Playback stopped")
```

#### 1.3 Signal Mixer (Integrate Your Jamming Code)

**File:** `/sdr-service/app/signal_mixer.py`

```python
import numpy as np

class SignalMixer:
    def __init__(self):
        self.jamming_type = None
        self.jamming_power = 0.0

    def set_jamming(self, jamming_type, power_db=-30):
        """Enable jamming with specified type and power"""
        self.jamming_type = jamming_type
        # Convert dB to linear amplitude
        self.jamming_power = 10 ** (power_db / 20)
        print(f"🔴 Jamming enabled: {jamming_type} @ {power_db} dB")

    def clear_jamming(self):
        """Disable jamming"""
        self.jamming_type = None
        self.jamming_power = 0.0
        print("✅ Jamming cleared")

    def mix_signals(self, clean_iq):
        """Mix jamming signal into clean IQ samples"""
        if self.jamming_type is None or len(clean_iq) == 0:
            return clean_iq

        # Generate jamming signal based on type
        jamming_iq = self._generate_jamming(len(clean_iq), self.jamming_type)

        # Mix with appropriate power level
        mixed = clean_iq + (jamming_iq * self.jamming_power)

        return mixed

    def _generate_jamming(self, num_samples, jamming_type):
        """
        Generate jamming signal
        INTEGRATE YOUR EXISTING JAMMING CODE HERE
        """

        if jamming_type == "cw":
            # Continuous Wave (pure tone at offset frequency)
            t = np.arange(num_samples) / 1024000  # Sample rate
            freq_offset = 50000  # 50 kHz offset
            jamming = 0.5 * np.exp(2j * np.pi * freq_offset * t)

        elif jamming_type == "noise":
            # Wideband noise jamming
            i = np.random.randn(num_samples) * 0.5
            q = np.random.randn(num_samples) * 0.5
            jamming = i + 1j * q

        elif jamming_type == "sweep":
            # Frequency sweep jammer
            t = np.arange(num_samples) / 1024000
            sweep_rate = 1000000  # 1 MHz/sec sweep
            freq = 0 + sweep_rate * t
            jamming = 0.5 * np.exp(2j * np.pi * freq * t)

        elif jamming_type == "pulse":
            # Pulsed jamming (on/off pattern)
            pulse_pattern = np.zeros(num_samples, dtype=np.complex64)
            pulse_width = 1024  # samples
            pulse_period = 4096  # samples
            for i in range(0, num_samples, pulse_period):
                pulse_pattern[i:i+pulse_width] = 0.7
            jamming = pulse_pattern * np.exp(2j * np.pi * 0.1 * np.arange(num_samples))

        elif jamming_type == "chirp":
            # Chirp jammer (linear frequency modulation)
            t = np.arange(num_samples) / 1024000
            chirp_rate = 500000  # Hz/sec
            phase = 2 * np.pi * (0.5 * chirp_rate * t**2)
            jamming = 0.5 * np.exp(1j * phase)

        else:
            # No jamming
            jamming = np.zeros(num_samples, dtype=np.complex64)

        return jamming
```

**Note:** Replace `_generate_jamming()` with your actual jamming code

#### 1.4 RTL-TCP Server

**File:** `/sdr-service/app/rtl_tcp.py`

```python
import asyncio
import struct
import numpy as np

class RTLTCPServer:
    def __init__(self, host='0.0.0.0', port=1234):
        self.host = host
        self.port = port
        self.clients = []

    def create_dongle_info(self):
        """RTL-TCP handshake: 12-byte header"""
        # Magic: "RTL0", Tuner: R820T (1), Gain stages: 29
        return struct.pack('>4sII', b'RTL0', 1, 29)

    async def handle_client(self, reader, writer):
        """Handle GQRX client connection"""
        addr = writer.get_extra_info('peername')
        print(f"✅ GQRX connected: {addr}")

        # Send dongle info
        writer.write(self.create_dongle_info())
        await writer.drain()

        self.clients.append(writer)

        try:
            # Keep connection alive, listen for commands
            while True:
                data = await reader.read(4)
                if not data:
                    break
                # Commands from GQRX (frequency tuning, etc.)
                # We ignore them for v1 simplicity
        except:
            pass
        finally:
            self.clients.remove(writer)
            writer.close()
            print(f"❌ GQRX disconnected: {addr}")

    async def broadcast_samples(self, iq_chunk):
        """Send IQ samples to all connected GQRX clients"""
        if not self.clients or iq_chunk is None:
            return

        # Convert complex64 to uint8 I/Q pairs (RTL-TCP format)
        i = ((iq_chunk.real * 127.5) + 127.5).astype(np.uint8)
        q = ((iq_chunk.imag * 127.5) + 127.5).astype(np.uint8)

        # Interleave
        iq_bytes = np.empty(len(iq_chunk) * 2, dtype=np.uint8)
        iq_bytes[0::2] = i
        iq_bytes[1::2] = q

        # Broadcast to all clients
        for client in self.clients[:]:
            try:
                client.write(iq_bytes.tobytes())
                await client.drain()
            except:
                self.clients.remove(client)

    async def start(self):
        """Start RTL-TCP server"""
        server = await asyncio.start_server(
            self.handle_client, self.host, self.port
        )

        print(f"📡 RTL-TCP server listening on {self.host}:{self.port}")
        print(f"🎯 Connect GQRX to: {self.host}:{self.port}")

        async with server:
            await server.serve_forever()
```

#### 1.5 MQTT Command Handler

**File:** `/sdr-service/app/mqtt_handler.py`

```python
import paho.mqtt.client as mqtt
import json

class MQTTHandler:
    def __init__(self, iq_player, signal_mixer):
        self.iq_player = iq_player
        self.signal_mixer = signal_mixer
        self.client = mqtt.Client()

    def on_connect(self, client, userdata, flags, rc):
        print(f"📨 Connected to MQTT broker")
        client.subscribe("apex/team/sdr-rf/injects")

    def on_message(self, client, userdata, msg):
        """Handle inject commands"""
        try:
            inject = json.loads(msg.payload.decode())

            if inject.get("type") == "trigger":
                command = inject["content"]["command"]
                params = inject["content"].get("parameters", {})

                # Playback controls
                if command == "play":
                    self.iq_player.play()

                elif command == "pause":
                    self.iq_player.pause()

                elif command == "stop":
                    self.iq_player.stop()

                # Jamming controls
                elif command == "jamming_cw":
                    self.signal_mixer.set_jamming("cw", params.get("power_db", -30))

                elif command == "jamming_noise":
                    self.signal_mixer.set_jamming("noise", params.get("power_db", -30))

                elif command == "jamming_sweep":
                    self.signal_mixer.set_jamming("sweep", params.get("power_db", -30))

                elif command == "jamming_pulse":
                    self.signal_mixer.set_jamming("pulse", params.get("power_db", -30))

                elif command == "jamming_chirp":
                    self.signal_mixer.set_jamming("chirp", params.get("power_db", -30))

                elif command == "jamming_clear":
                    self.signal_mixer.clear_jamming()

        except Exception as e:
            print(f"❌ Error handling inject: {e}")

    def start(self, mqtt_host='mqtt', mqtt_port=1883):
        """Start MQTT client"""
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(mqtt_host, mqtt_port)
        self.client.loop_start()
```

#### 1.6 Main Service

**File:** `/sdr-service/app/main.py`

```python
import asyncio
from iq_player import IQPlayer
from signal_mixer import SignalMixer
from rtl_tcp import RTLTCPServer
from mqtt_handler import MQTTHandler

async def stream_loop(iq_player, signal_mixer, rtl_tcp):
    """Main streaming loop"""
    while True:
        # Get chunk from player
        chunk = await iq_player.get_chunk()

        if chunk is not None:
            # Mix in jamming if active
            mixed_chunk = signal_mixer.mix_signals(chunk)

            # Broadcast to GQRX clients
            await rtl_tcp.broadcast_samples(mixed_chunk)

async def main():
    # Configuration
    IQ_FILE = "/iq_files/demo.iq"
    SAMPLE_RATE = 1024000

    print("=" * 60)
    print("SDR/GQRX Streaming Service")
    print("=" * 60)

    # Initialize components
    iq_player = IQPlayer(IQ_FILE, SAMPLE_RATE)
    signal_mixer = SignalMixer()
    rtl_tcp = RTLTCPServer()
    mqtt = MQTTHandler(iq_player, signal_mixer)

    # Start MQTT
    mqtt.start()

    # Auto-start playback
    iq_player.play()

    print("✅ Service ready")
    print("=" * 60)

    # Run server and streaming loop
    await asyncio.gather(
        rtl_tcp.start(),
        stream_loop(iq_player, signal_mixer, rtl_tcp)
    )

if __name__ == "__main__":
    asyncio.run(main())
```

---

### Step 2: Frontend Control Panel (2-3 hours)

#### 2.1 Copy Existing Dashboard

```bash
cp -r team-dashboard-satcom team-dashboard-sdr
cd team-dashboard-sdr
```

#### 2.2 Clean Up (Remove Complex Components)

```bash
# Remove complex SATCOM components
rm -rf src/components/spaceops
rm -rf src/components/ew-intel
rm -rf src/pages/SpaceOpsPage.tsx
rm -rf src/pages/EWIntelPage.tsx
```

#### 2.3 Create Simple Control Panel

**File:** `/team-dashboard-sdr/src/components/ControlPanel.tsx`

```typescript
import { useState } from 'react';

interface ControlPanelProps {
  onCommand: (command: string, params?: any) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onCommand }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    onCommand('play');
    setIsPlaying(true);
  };

  const handleStop = () => {
    onCommand('stop');
    setIsPlaying(false);
  };

  const handleJamming = (type: string) => {
    onCommand(`jamming_${type}`, { power_db: -30 });
  };

  const handleClearJamming = () => {
    onCommand('jamming_clear');
  };

  return (
    <div className="space-y-6">
      {/* Playback Controls */}
      <div className="bg-surface p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Playback Control</h2>
        <div className="flex gap-4">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white font-bold text-lg"
          >
            ▶ Play
          </button>
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-white font-bold text-lg"
          >
            ⏹ Stop
          </button>
        </div>
      </div>

      {/* Jamming Controls */}
      <div className="bg-surface p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Jamming Effects</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleJamming('cw')}
            className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold"
          >
            CW Jamming
          </button>
          <button
            onClick={() => handleJamming('noise')}
            className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold"
          >
            Noise Jamming
          </button>
          <button
            onClick={() => handleJamming('sweep')}
            className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold"
          >
            Sweep Jamming
          </button>
          <button
            onClick={() => handleJamming('pulse')}
            className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold"
          >
            Pulse Jamming
          </button>
          <button
            onClick={() => handleJamming('chirp')}
            className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold"
          >
            Chirp Jamming
          </button>
          <button
            onClick={handleClearJamming}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
          >
            ✓ Clear Jamming
          </button>
        </div>
      </div>

      {/* GQRX Instructions */}
      <div className="bg-surface p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">GQRX Setup</h2>
        <div className="space-y-2 text-sm">
          <p className="text-text-secondary">
            1. Install GQRX: <code className="text-primary">brew install gqrx</code> (macOS) or <code className="text-primary">sudo apt install gqrx-sdr</code> (Linux)
          </p>
          <p className="text-text-secondary">
            2. Configure GQRX device string: <code className="text-primary bg-background px-2 py-1 rounded">rtl_tcp=localhost:1234</code>
          </p>
          <p className="text-text-secondary">
            3. Set sample rate: <code className="text-primary">1024000</code>
          </p>
          <p className="text-text-secondary">
            4. Click <strong>"Play"</strong> in GQRX to start receiving
          </p>
          <p className="text-text-secondary">
            5. Use the buttons above to control playback and trigger jamming effects
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
```

#### 2.4 Create Main Page

**File:** `/team-dashboard-sdr/src/pages/SDRMonitoringPage.tsx`

```typescript
import { useState } from 'react';
import ControlPanel from '../components/ControlPanel';
import Header from '../components/Header';
import Card from '../components/common/Card';

const SDRMonitoringPage = () => {
  const [mqttClient, setMqttClient] = useState<any>(null);

  const handleCommand = (command: string, params?: any) => {
    // Send command via MQTT
    const inject = {
      type: 'trigger',
      content: {
        command,
        parameters: params || {}
      }
    };

    // Use existing MQTT context (same pattern as other dashboards)
    if (mqttClient) {
      mqttClient.publish(
        'apex/team/sdr-rf/injects',
        JSON.stringify(inject)
      );
    }

    console.log('Command sent:', command, params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="SDR/RF Monitoring" team="RF Analysis Team" />

      <div className="container mx-auto p-6">
        <Card className="mb-6 p-4 bg-blue-900/20 border border-blue-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h2 className="text-lg font-bold text-blue-400">RF Spectrum Monitoring Exercise</h2>
              <p className="text-sm text-text-secondary">
                Use GQRX to monitor the RF spectrum. Control playback and jamming effects from this panel.
              </p>
            </div>
          </div>
        </Card>

        <ControlPanel onCommand={handleCommand} />
      </div>
    </div>
  );
};

export default SDRMonitoringPage;
```

#### 2.5 Update Router

**File:** `/team-dashboard-sdr/src/router.tsx`

```typescript
import SDRMonitoringPage from './pages/SDRMonitoringPage';

const Router = () => {
  return <SDRMonitoringPage />;
};

export default Router;
```

#### 2.6 Build Dashboard

**File:** `/team-dashboard-sdr/Dockerfile`

(Copy from team-dashboard-satcom, no changes needed)

---

### Step 3: Scenario Configuration (1-2 hours)

#### 3.1 Create Scenario Definition

**File:** `/scenarios/sdr-rf-monitoring-scenario.json`

```json
{
  "id": "sdr-rf-monitoring-scenario",
  "name": "SDR/RF Spectrum Monitoring",
  "description": "Real-time RF spectrum monitoring using GQRX. Analyze signals and identify jamming patterns.",
  "version": "1.0.0",
  "duration_minutes": 30,
  "teams": [
    {
      "id": "sdr-rf",
      "name": "RF Analysis Team",
      "description": "Monitor RF spectrum and identify interference",
      "timeline_file": "timelines/timeline-sdr-rf.json",
      "dashboard_port": 3300,
      "dashboard_image": "team-dashboard-sdr:latest"
    }
  ]
}
```

#### 3.2 Create Timeline with Jamming Injects

**File:** `/scenarios/timelines/timeline-sdr-rf.json`

```json
{
  "id": "timeline-sdr-rf",
  "name": "RF Monitoring Timeline",
  "description": "Automated jamming scenario progression",
  "version": "1.0.0",
  "injects": [
    {
      "id": "inject-001",
      "time": 0,
      "type": "trigger",
      "content": {
        "command": "play"
      }
    },
    {
      "id": "inject-002",
      "time": 5,
      "type": "alert",
      "content": {
        "severity": "info",
        "title": "Monitoring Started",
        "message": "RF spectrum monitoring initiated. Observe clean signal in GQRX."
      }
    },
    {
      "id": "inject-003",
      "time": 15,
      "type": "trigger",
      "content": {
        "command": "jamming_cw",
        "parameters": {
          "power_db": -35
        }
      }
    },
    {
      "id": "inject-004",
      "time": 16,
      "type": "alert",
      "content": {
        "severity": "warning",
        "title": "CW Interference Detected",
        "message": "Continuous Wave jamming detected at +50 kHz offset. Observe tone in GQRX waterfall."
      }
    },
    {
      "id": "inject-005",
      "time": 30,
      "type": "trigger",
      "content": {
        "command": "jamming_clear"
      }
    },
    {
      "id": "inject-006",
      "time": 35,
      "type": "trigger",
      "content": {
        "command": "jamming_noise",
        "parameters": {
          "power_db": -30
        }
      }
    },
    {
      "id": "inject-007",
      "time": 36,
      "type": "alert",
      "content": {
        "severity": "warning",
        "title": "Noise Jamming Detected",
        "message": "Wideband noise jamming active. Signal-to-noise ratio degraded."
      }
    },
    {
      "id": "inject-008",
      "time": 50,
      "type": "trigger",
      "content": {
        "command": "jamming_clear"
      }
    },
    {
      "id": "inject-009",
      "time": 55,
      "type": "trigger",
      "content": {
        "command": "jamming_sweep",
        "parameters": {
          "power_db": -32
        }
      }
    },
    {
      "id": "inject-010",
      "time": 56,
      "type": "alert",
      "content": {
        "severity": "critical",
        "title": "Sweep Jamming Detected",
        "message": "Frequency sweep jammer active. Observe sweeping pattern in waterfall."
      }
    },
    {
      "id": "inject-011",
      "time": 75,
      "type": "trigger",
      "content": {
        "command": "jamming_clear"
      }
    },
    {
      "id": "inject-012",
      "time": 80,
      "type": "alert",
      "content": {
        "severity": "success",
        "title": "Exercise Complete",
        "message": "All jamming patterns demonstrated. Scenario complete."
      }
    },
    {
      "id": "inject-013",
      "time": 85,
      "type": "trigger",
      "content": {
        "command": "stop"
      }
    }
  ]
}
```

---

### Step 4: Docker Integration (1 hour)

#### 4.1 Add SDR Service to Docker Compose

**File:** `/docker-compose.yml`

```yaml
services:
  # ... existing services ...

  sdr-service:
    build: ./sdr-service
    container_name: scip-sdr-service
    ports:
      - "1234:1234"  # RTL-TCP for GQRX
    volumes:
      - ./sdr-service/iq_files:/iq_files
    networks:
      - scip-network
    depends_on:
      - mqtt

  team-dashboard-sdr:
    image: team-dashboard-sdr:latest
    build: ./team-dashboard-sdr
    deploy:
      replicas: 0  # Launched by orchestration
```

#### 4.2 Build Images

```bash
# Build SDR service
docker-compose build sdr-service

# Build SDR dashboard
docker-compose build team-dashboard-sdr

# Start SDR service
docker-compose up -d sdr-service
```

---

### Step 5: Create Demo IQ File (1-2 hours)

**File:** `/sdr-service/create_demo_iq.py`

```python
import numpy as np

# Parameters
sample_rate = 1024000  # 1.024 MHz
duration = 120  # 2 minutes
num_samples = sample_rate * duration

print(f"Generating {duration}s IQ file...")

# Noise floor
noise = (np.random.randn(num_samples) + 1j * np.random.randn(num_samples)) * 0.05

# Add some signals
t = np.arange(num_samples) / sample_rate

# Signal 1: Strong carrier at +150 kHz
signal1 = 0.4 * np.exp(2j * np.pi * 150000 * t)

# Signal 2: AM modulated signal at -200 kHz
am_mod = 1 + 0.5 * np.sin(2 * np.pi * 1000 * t)  # 1 kHz audio
signal2 = 0.3 * am_mod * np.exp(2j * np.pi * (-200000) * t)

# Signal 3: Weak FM signal at +300 kHz
fm_mod = np.cumsum(0.01 * np.sin(2 * np.pi * 500 * t))
signal3 = 0.15 * np.exp(2j * np.pi * (300000 * t + fm_mod))

# Combine
iq_data = noise + signal1 + signal2 + signal3

# Save
output_file = 'iq_files/demo.iq'
iq_data.astype(np.complex64).tofile(output_file)

print(f"✓ Created: {output_file}")
print(f"  Samples: {len(iq_data):,}")
print(f"  Duration: {duration}s")
print(f"  Size: {iq_data.nbytes / 1024 / 1024:.1f} MB")
```

**Run:**
```bash
cd sdr-service
python create_demo_iq.py
```

---

## Testing Checklist

### Backend Testing
- [ ] SDR service starts without errors
- [ ] IQ file loads successfully
- [ ] RTL-TCP server listens on port 1234
- [ ] MQTT commands received and processed
- [ ] Signal mixer generates jamming signals
- [ ] Playback loops correctly

### GQRX Testing
- [ ] GQRX connects to rtl_tcp://localhost:1234
- [ ] Waterfall displays IQ samples
- [ ] Spectrum analyzer shows signals
- [ ] Jamming effects visible in real-time
- [ ] No audio/timing glitches

### Frontend Testing
- [ ] Dashboard loads in browser
- [ ] Play/Stop buttons send commands
- [ ] Jamming buttons trigger effects
- [ ] MQTT connection established
- [ ] Instructions display correctly

### Integration Testing
- [ ] Scenario deploys successfully
- [ ] Timeline injects trigger automatically
- [ ] Manual control buttons work alongside injects
- [ ] Multiple participants can connect (GQRX + browser)
- [ ] Exercise stops cleanly

---

## GQRX Setup Guide for Participants

### Installation

**macOS:**
```bash
brew install gqrx
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install gqrx-sdr
```

**Windows:**
Download from: https://gqrx.dk/download

### Configuration

1. **Launch GQRX**
2. **Configure I/O Device:**
   - Click: I/O Devices → Configure
   - Device string: `rtl_tcp=YOUR_SERVER_IP:1234`
   - Sample rate: `1024000`
   - Click: OK

3. **Start Reception:**
   - Click the "Play" button (▶) in GQRX
   - Waterfall should start displaying

4. **Optimize Display:**
   - Adjust FFT settings (right panel)
   - Set FFT size: 8192
   - Waterfall speed: Medium
   - Color scheme: Choose preferred

5. **Use Control Panel:**
   - Open browser to team dashboard
   - Use Play/Stop and Jamming buttons
   - Effects appear in GQRX in real-time

---

## Implementation Timeline

### Day 1: Backend (6-8 hours)
- [x] Create SDR service structure
- [x] Implement IQ player
- [x] Implement RTL-TCP server
- [x] Basic testing with GQRX

### Day 2: Signal Mixing (4-6 hours)
- [x] Integrate your jamming code
- [x] Implement signal mixer
- [x] Add MQTT command handler
- [x] Test jamming effects in GQRX

### Day 3: Frontend (3-4 hours)
- [x] Copy and clean dashboard
- [x] Create control panel
- [x] Wire up MQTT commands
- [x] Test browser controls

### Day 4: Integration (2-3 hours)
- [x] Create scenario definition
- [x] Create timeline
- [x] Docker configuration
- [x] End-to-end testing

### Day 5: IQ File & Polish (2-3 hours)
- [x] Generate realistic demo IQ file
- [x] Test with real jamming scenarios
- [x] Documentation
- [x] Final testing

**Total: 17-24 hours (3-5 days)**

---

## Advantages of V1 Simplified Approach

### What We Gain
✅ **Faster development** - 60% less work than full browser visualization
✅ **Professional tools** - Participants use real SDR software (GQRX)
✅ **Better visualization** - GQRX waterfall is superior to browser canvas
✅ **Lower risk** - Proven technology, simpler architecture
✅ **Your code reuse** - Directly integrate existing jamming implementations
✅ **Realistic training** - Matches real-world RF analysis workflow

### What We Sacrifice
❌ Web-only access - Participants must install GQRX
❌ All-in-one dashboard - Requires two windows (GQRX + browser)

### For Most Users
The tradeoff is **worth it** - professional RF analysts already use GQRX, and the installation is simple. The realism and quality far outweigh the minor inconvenience.

---

## Future Enhancements (V2+)

### Phase 2: Recording & Replay
- Record exercise sessions
- Replay for after-action review
- Export to .iq files

### Phase 3: Multiple Frequencies
- Support frequency hopping
- Multi-channel monitoring
- Band scanning

### Phase 4: Demodulation
- Add audio output
- AM/FM/SSB demod
- Send audio to browser

### Phase 5: Advanced Jamming
- Real-time jamming parameter control
- Multiple simultaneous jammers
- Adaptive jamming patterns

---

## Risk Assessment

**Technical Risks: Very Low**
- RTL-TCP is proven, well-documented protocol
- GQRX is stable, widely used
- Jamming code already exists
- No complex browser visualization

**User Experience Risks: Low**
- GQRX installation is straightforward
- Most defense RF professionals already have it
- Two-window workflow is acceptable

**Integration Risks: Very Low**
- Uses existing MQTT inject system
- Same patterns as other scenarios
- Docker isolation prevents interference

**Overall Risk: 5%**

---

## Success Criteria

✅ GQRX connects and displays spectrum
✅ Play/Stop controls work from browser
✅ Jamming effects visible in real-time
✅ Timeline injects execute automatically
✅ No lag or audio glitches
✅ Multiple participants can connect
✅ Clean startup and shutdown

---

## Comparison: V1 Simplified vs Full Browser Visualization

| Feature | V1 Simplified | Full Browser |
|---------|---------------|--------------|
| Development Time | 15-20 hours | 32-44 hours |
| Risk Level | Very Low (5%) | Medium (20%) |
| Visualization Quality | Excellent (GQRX) | Good (Canvas) |
| User Setup | Install GQRX | Browser only |
| Realism | High (pro tools) | Medium |
| Maintenance | Low | Medium |
| **Recommendation** | ✅ **Start here** | Future enhancement |

---

## Conclusion

The V1 simplified approach gets you a **working, realistic RF monitoring scenario in 3-5 days** with minimal risk. Participants get professional-quality visualization in GQRX, you integrate your existing jamming code, and the browser provides simple control.

**Start with V1, add browser visualization later if needed.**

Most importantly: This approach **does not touch any existing scenarios or code** - it's completely isolated and safe to develop.
