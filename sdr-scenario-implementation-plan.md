# SDR IQ Streaming Scenario Implementation Plan

## Overview
Create a software-defined radio (SDR) streaming scenario that plays pre-recorded IQ files and broadcasts them via RTL-TCP protocol (compatible with GQRX) while simultaneously displaying a real-time waterfall spectrum in the browser dashboard.

## Concept
Simulate a virtual RTL-SDR device that:
- Plays back recorded IQ samples from `.iq` or `.dat` files
- Streams samples via RTL-TCP on port 1234 (standard GQRX port)
- Computes FFT and streams spectrum data to browser via WebSocket
- Responds to inject commands for playback control
- Allows GQRX to connect as if to real hardware

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  IQ File (.iq / .dat)                                   │
│  Sample Rate: 1.024 MHz (adjustable)                    │
│  Format: Complex float32 (I/Q pairs)                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  SDR Streaming Service (Python)                         │
│  - Read IQ samples at correct rate                      │
│  - Loop file continuously                               │
│  - Broadcast via RTL-TCP (port 1234)                    │
│  - Compute FFT (1024 bins @ 10 Hz)                      │
│  - Send FFT via WebSocket (port 8002)                   │
│  - Handle inject commands (play/pause/tune)             │
└──────────┬─────────────────────────┬────────────────────┘
           │                         │
           ▼                         ▼
    ┌──────────────┐         ┌──────────────────┐
    │  GQRX        │         │  Browser         │
    │  External    │         │  Waterfall       │
    │  (Optional)  │         │  Dashboard       │
    └──────────────┘         └──────────────────┘
```

## Reference Sample Rates

**SatNOGS typically uses:**
- 48 kHz - Very light, good for narrowband
- 192 kHz - Medium, good demo balance
- 1.024 MHz - Standard SDR rate, good performance
- 2.4 MHz - High rate, may need optimization

**Recommendation for demo: 1.024 MHz**
- Common SDR rate
- Good balance of quality vs performance
- GQRX handles easily
- FFT processing manageable

---

## Design Philosophy: Build for Reusability

### Architecture Goal
Design this implementation to be **easily portable** to other RF/EW projects, not just locked into APEX. Follow a layered, modular approach that enables code reuse across different SDR applications.

### Layer 1: Reusable React Components (Frontend)

**Structure:** Create standalone, configurable components from day one

**Directory:** `/team-dashboard-satcom/src/components/sdr/`

**Components to build as self-contained modules:**

```typescript
// Stateless, prop-driven components
<WaterfallDisplay
  wsUrl="ws://localhost:8002"
  centerFreq={100000000}
  sampleRate={1024000}
  width={1024}
  height={512}
  colorMap="viridis"
/>

<SpectrumAnalyzer
  wsUrl="ws://localhost:8002"
  minDb={-100}
  maxDb={-20}
  showPeakHold={true}
/>

<FrequencyInput
  value={100000000}
  onChange={(freq) => handleTune(freq)}
  min={24000000}
  max={1766000000}
  step={1000}
/>

<SignalMeter
  powerDb={-45}
  noiseFloorDb={-90}
  showSNR={true}
/>
```

**Key Principles:**
- **No APEX dependencies** - Components don't import APEX-specific contexts
- **Configurable via props** - All behavior controlled by props
- **WebSocket URL as prop** - Don't hardcode connection details
- **Standalone styling** - Use inline styles or CSS modules, not global APEX theme (though can accept theme colors as props)
- **TypeScript interfaces** - Well-defined prop types for easy reuse

**Future extraction path:**
```bash
# When ready to extract (Phase 2)
npm create @apex/sdr-components
# Copy components, publish to npm registry
# Import back into APEX: npm install @apex/sdr-components
```

### Layer 2: Reusable Python SDR Library (Backend)

**Structure:** Build as a proper Python package from the start

**Directory:** `/sdr-service/sdr_streaming/` (package format)

```
/sdr-service/
├── sdr_streaming/              # Python package
│   ├── __init__.py
│   ├── core/
│   │   ├── iq_player.py       # Generic IQ file player
│   │   ├── iq_source.py       # Abstract IQ source interface
│   │   └── sample_buffer.py   # Circular buffer
│   ├── protocols/
│   │   ├── rtl_tcp.py         # RTL-TCP server
│   │   ├── soapy_sdr.py       # SoapySDR interface (future)
│   │   └── base_protocol.py   # Protocol interface
│   ├── processing/
│   │   ├── fft_processor.py   # FFT computation
│   │   ├── signal_mixer.py    # IQ signal mixing
│   │   └── demodulator.py     # AM/FM/SSB demod (future)
│   └── streaming/
│       ├── websocket_stream.py # WebSocket FFT streaming
│       └── stream_manager.py   # Multi-client manager
├── app/
│   └── main.py                # APEX-specific integration
├── setup.py                   # Package setup
└── requirements.txt
```

**Key Principles:**
- **Dependency injection** - IQ source is injected, not hardcoded
- **Abstract interfaces** - Protocol and source interfaces for swappable implementations
- **Configuration objects** - Use dataclasses/pydantic for config
- **No APEX coupling** - Library has no APEX/MQTT dependencies
- **Async-first** - All I/O operations use asyncio

**Example usage pattern:**
```python
from sdr_streaming import IQPlayer, RTLTCPServer, FFTProcessor

# Library is generic
player = IQPlayer(source="file://demo.iq", sample_rate=1024000)
rtl_tcp = RTLTCPServer(port=1234)
fft = FFTProcessor(fft_size=1024)

# APEX-specific integration in main.py
mqtt_handler = InjectHandler(player, rtl_tcp)  # APEX-specific
```

### Layer 3: Configuration-Driven Architecture

**Instead of hardcoding scenario parameters, use configuration files:**

**File:** `/sdr-service/configs/demo-scenario.yaml`

```yaml
sdr_config:
  # IQ Source
  iq_source:
    type: file
    path: /iq_files/demo_recording.iq
    format: complex64
    loop: true

  # Radio parameters
  radio:
    sample_rate: 1024000
    center_freq: 100000000
    gain: 30

  # Streaming services
  services:
    rtl_tcp:
      enabled: true
      host: 0.0.0.0
      port: 1234

    websocket_fft:
      enabled: true
      host: 0.0.0.0
      port: 8002
      fft_size: 1024
      update_rate: 10

  # APEX integration (optional)
  apex:
    mqtt_host: mqtt
    mqtt_topic: apex/team/sdr-monitoring/injects
    enable_inject_control: true
```

**Benefits:**
- Same code handles different scenarios
- Easy A/B testing of parameters
- No code changes to add new IQ files
- Can disable APEX integration for standalone use

**Load config in main.py:**
```python
import yaml
from sdr_streaming import SDRStreamingServer

with open('config.yaml') as f:
    config = yaml.safe_load(f)

server = SDRStreamingServer(config)
server.start()
```

### Layer 4: Plugin Architecture (Future-Ready)

**Design signal processing as pluggable components:**

```python
# sdr_streaming/plugins/base_plugin.py
class SignalPlugin:
    """Base class for signal processing plugins"""
    def process(self, iq_samples: np.ndarray, params: dict) -> np.ndarray:
        raise NotImplementedError

# sdr_streaming/plugins/jamming.py
class NarrowbandJammer(SignalPlugin):
    def process(self, iq_samples, params):
        freq_offset = params.get('freq_offset', 0)
        power_db = params.get('power_db', -20)
        # Mix jamming signal
        return iq_samples + self.generate_jammer(freq_offset, power_db)

class NoiseJammer(SignalPlugin):
    def process(self, iq_samples, params):
        noise_level = params.get('noise_level', 0.5)
        return iq_samples + (np.random.randn(*iq_samples.shape) * noise_level)

# In main code
from sdr_streaming import PluginManager

plugin_mgr = PluginManager()
plugin_mgr.register(NarrowbandJammer())
plugin_mgr.register(NoiseJammer())

# Apply plugins dynamically
processed_samples = plugin_mgr.apply_all(raw_samples, plugin_params)
```

**Benefits:**
- Add jamming types without modifying core
- Enable/disable effects via config
- Third parties can contribute plugins
- Easy experimentation

### Implementation Strategy: Staged Approach

**Phase 1 (Current):** Build integrated in APEX
- Focus on getting it working
- Keep components modular but in APEX codebase
- Use good practices (stateless components, dependency injection)
- Document what's reusable

**Phase 2 (After proven):** Extract to packages
- Move React components to `@apex/sdr-components` NPM package
- Move Python code to `sdr-streaming` Python package
- Keep APEX integration as thin wrapper
- Import packages back into APEX

**Phase 3 (Future):** Open source release
- Publish `react-sdr-toolkit` (public NPM)
- Publish `sdr-streaming` (PyPI)
- Other RF/EW projects can use
- Community contributions

### Code Guidelines for Reusability

**React Components:**
```typescript
// ✅ GOOD: Configurable, standalone
interface WaterfallProps {
  wsUrl: string;
  centerFreq: number;
  sampleRate: number;
  onFrequencyClick?: (freq: number) => void;
  colorMap?: 'viridis' | 'plasma' | 'turbo';
}

export const WaterfallDisplay: React.FC<WaterfallProps> = ({ ... }) => {
  // No APEX imports
  // No global state
  // All behavior via props
};

// ❌ BAD: Coupled to APEX
import { useInjectContext } from '@/contexts/InjectContext';
export const WaterfallDisplay = () => {
  const { injects } = useInjectContext(); // APEX-specific
  // ...
};
```

**Python Backend:**
```python
# ✅ GOOD: Generic, injectable
class IQPlayer:
    def __init__(self, source: IQSource, sample_rate: int):
        self.source = source  # Abstract interface
        self.sample_rate = sample_rate

    async def get_samples(self, count: int) -> np.ndarray:
        return await self.source.read(count)

# ❌ BAD: Hardcoded, coupled
class IQPlayer:
    def __init__(self):
        self.file = open('/iq_files/demo.iq', 'rb')  # Hardcoded path
        self.mqtt = paho.mqtt.Client()  # APEX-specific
```

### File Organization

```
/sdr-service/
├── sdr_streaming/           # ← Pure library (reusable)
│   ├── core/
│   ├── protocols/
│   ├── processing/
│   └── streaming/
├── app/
│   ├── main.py             # ← APEX integration (specific)
│   └── inject_handler.py   # ← APEX-specific code
└── configs/
    └── scenarios/          # ← Scenario configs

/team-dashboard-satcom/
├── src/
│   ├── components/
│   │   └── sdr/           # ← Pure SDR components (reusable)
│   │       ├── WaterfallDisplay.tsx
│   │       ├── SpectrumAnalyzer.tsx
│   │       └── FrequencyInput.tsx
│   └── pages/
│       └── SDRMonitoringPage.tsx  # ← APEX integration (specific)
```

### Documentation Requirements

For each reusable component, include:

**JSDoc for React:**
```typescript
/**
 * Real-time waterfall spectrum display for SDR applications.
 *
 * @example
 * ```tsx
 * <WaterfallDisplay
 *   wsUrl="ws://localhost:8002"
 *   centerFreq={100000000}
 *   sampleRate={1024000}
 * />
 * ```
 *
 * @param wsUrl - WebSocket URL for FFT data stream
 * @param centerFreq - Center frequency in Hz
 * @param sampleRate - Sample rate in Hz
 */
```

**Docstrings for Python:**
```python
"""
RTL-TCP protocol server for SDR streaming.

Compatible with GQRX and other RTL-TCP clients. Streams IQ samples
over TCP and handles client tuning commands.

Example:
    >>> server = RTLTCPServer(port=1234, sample_rate=1024000)
    >>> await server.start(iq_source)

Args:
    port: TCP port to listen on (default: 1234)
    sample_rate: Sample rate in Hz
    initial_freq: Initial center frequency in Hz
"""
```

### Success Metrics

This implementation is reusable if:
- ✅ Components work without APEX imports
- ✅ Can swap IQ sources with <10 lines of code
- ✅ Config changes don't require code changes
- ✅ Someone can copy `/sdr_streaming/` to new project and use it
- ✅ React components can render in Storybook standalone
- ✅ Python library passes tests without APEX dependencies

---

## Phase 1: SDR Streaming Service

### 1.1 Create New Service Directory

**Following the reusable package structure:**

```
/sdr-service/
├── sdr_streaming/           # Reusable Python package
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── iq_player.py       # Generic IQ file player
│   │   ├── iq_source.py       # Abstract IQ source interface
│   │   └── sample_buffer.py   # Circular buffer (future)
│   ├── protocols/
│   │   ├── __init__.py
│   │   ├── rtl_tcp.py         # RTL-TCP server
│   │   └── base_protocol.py   # Protocol interface
│   ├── processing/
│   │   ├── __init__.py
│   │   └── fft_processor.py   # FFT computation
│   └── streaming/
│       ├── __init__.py
│       └── websocket_stream.py # WebSocket FFT streaming
├── app/
│   ├── main.py                # APEX-specific integration
│   └── inject_handler.py      # MQTT inject command handler
├── configs/
│   └── demo-scenario.yaml     # Configuration file
├── iq_files/                  # Sample IQ recordings
│   └── demo_recording.iq
├── requirements.txt
├── setup.py                   # Package setup for pip install
├── Dockerfile
└── README.md
```

**Note:** We're organizing as a proper Python package from the start, even though we'll keep it in the APEX monorepo for now. This makes future extraction trivial.

### 1.2 Requirements
**File:** `/sdr-service/requirements.txt`
```
fastapi==0.118.0
uvicorn==0.37.0
numpy==1.26.4
scipy==1.11.4
websockets==12.0
paho-mqtt==2.1.0
pyyaml==6.0.1
asyncio
```

**Note:** PyYAML added for configuration file support (Layer 3 architecture)

### 1.3 IQ File Player
**File:** `/sdr-service/sdr_streaming/core/iq_player.py`

**Purpose:** Read IQ samples from file and stream at correct rate (reusable component)

**Key Features:**
```python
class IQPlayer:
    def __init__(self, file_path, sample_rate=1024000):
        self.file_path = file_path
        self.sample_rate = sample_rate
        self.running = False
        self.paused = False
        self.position = 0

    def load_file(self):
        """Load IQ file as complex float32 numpy array"""
        # Support .iq (complex64) and .dat (uint8 pairs)
        if self.file_path.endswith('.iq'):
            samples = np.fromfile(self.file_path, dtype=np.complex64)
        elif self.file_path.endswith('.dat'):
            raw = np.fromfile(self.file_path, dtype=np.uint8)
            # Convert uint8 I/Q pairs to complex float
            i = (raw[0::2].astype(np.float32) - 127.5) / 127.5
            q = (raw[1::2].astype(np.float32) - 127.5) / 127.5
            samples = i + 1j * q
        return samples

    async def stream_samples(self, chunk_size=16384):
        """Yield chunks of samples at correct timing"""
        samples = self.load_file()
        total_samples = len(samples)

        # Calculate sleep time for real-time playback
        chunk_duration = chunk_size / self.sample_rate

        while self.running:
            if not self.paused:
                # Get chunk
                end_pos = min(self.position + chunk_size, total_samples)
                chunk = samples[self.position:end_pos]

                # Loop if needed
                if end_pos >= total_samples:
                    self.position = 0
                else:
                    self.position = end_pos

                yield chunk

                # Sleep to maintain real-time rate
                await asyncio.sleep(chunk_duration)
            else:
                await asyncio.sleep(0.1)
```

### 1.4 RTL-TCP Server
**File:** `/sdr-service/sdr_streaming/protocols/rtl_tcp.py`

**Purpose:** Implement RTL-TCP protocol for GQRX compatibility (reusable component)

**Protocol Details:**
- Port: 1234 (standard)
- Initial handshake: Send 12-byte header with tuner info
- Data format: Continuous stream of uint8 I/Q pairs
- Commands: Client can send tuning/gain commands (4 bytes each)

**Implementation:**
```python
import asyncio
import struct
import numpy as np

class RTLTCPServer:
    def __init__(self, host='0.0.0.0', port=1234, sample_rate=1024000):
        self.host = host
        self.port = port
        self.sample_rate = sample_rate
        self.center_freq = 100000000  # 100 MHz default
        self.clients = []

    def create_dongle_info(self):
        """Create RTL-TCP initial info packet (12 bytes)"""
        # Magic: "RTL0"
        # Tuner type: 1 (R820T)
        # Gain count: 29
        return struct.pack('>4sII', b'RTL0', 1, 29)

    async def handle_client(self, reader, writer):
        """Handle individual GQRX client connection"""
        addr = writer.get_extra_info('peername')
        print(f"GQRX client connected: {addr}")

        # Send initial dongle info
        writer.write(self.create_dongle_info())
        await writer.drain()

        self.clients.append(writer)

        try:
            # Listen for commands from client
            while True:
                data = await reader.read(4)
                if not data:
                    break
                await self.handle_command(data)
        except:
            pass
        finally:
            self.clients.remove(writer)
            writer.close()
            print(f"GQRX client disconnected: {addr}")

    async def handle_command(self, cmd_bytes):
        """Handle RTL-TCP commands from GQRX"""
        if len(cmd_bytes) != 4:
            return

        cmd = cmd_bytes[0]
        value = struct.unpack('>I', cmd_bytes)[0] >> 8

        if cmd == 0x01:  # Set frequency
            self.center_freq = value
            print(f"Frequency set to: {value} Hz")
        elif cmd == 0x02:  # Set sample rate
            self.sample_rate = value
            print(f"Sample rate set to: {value}")
        elif cmd == 0x04:  # Set gain
            print(f"Gain set to: {value}")
        # Other commands: AGC, tuner gain mode, etc.

    async def broadcast_samples(self, iq_player):
        """Stream IQ samples to all connected clients"""
        async for chunk in iq_player.stream_samples():
            if not self.clients:
                continue

            # Convert complex64 to uint8 I/Q pairs
            i = ((chunk.real * 127.5) + 127.5).astype(np.uint8)
            q = ((chunk.imag * 127.5) + 127.5).astype(np.uint8)

            # Interleave I and Q
            iq_bytes = np.empty(len(chunk) * 2, dtype=np.uint8)
            iq_bytes[0::2] = i
            iq_bytes[1::2] = q

            # Send to all clients
            for client in self.clients[:]:
                try:
                    client.write(iq_bytes.tobytes())
                    await client.drain()
                except:
                    self.clients.remove(client)

    async def start(self, iq_player):
        """Start RTL-TCP server"""
        server = await asyncio.start_server(
            self.handle_client, self.host, self.port
        )

        print(f"RTL-TCP server listening on {self.host}:{self.port}")
        print(f"Connect GQRX to: {self.host}:{self.port}")

        # Start broadcasting
        await asyncio.gather(
            server.serve_forever(),
            self.broadcast_samples(iq_player)
        )
```

### 1.5 FFT Processor
**File:** `/sdr-service/sdr_streaming/processing/fft_processor.py` + `/sdr-service/sdr_streaming/streaming/websocket_stream.py`

**Purpose:** Compute FFT and stream to browser via WebSocket (reusable components)

**Implementation:**
```python
import numpy as np
from scipy import signal
import websockets
import json
import asyncio

class FFTProcessor:
    def __init__(self, fft_size=1024, update_rate=10):
        self.fft_size = fft_size
        self.update_rate = update_rate  # Hz
        self.update_interval = 1.0 / update_rate
        self.clients = set()

    async def register_client(self, websocket):
        """Register new WebSocket client"""
        self.clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    def compute_fft(self, samples):
        """Compute FFT and return power spectrum in dB"""
        # Apply window
        windowed = samples[:self.fft_size] * np.hanning(self.fft_size)

        # Compute FFT
        fft_result = np.fft.fft(windowed)

        # Shift zero frequency to center
        fft_shifted = np.fft.fftshift(fft_result)

        # Convert to power (dB)
        power = 20 * np.log10(np.abs(fft_shifted) + 1e-10)

        return power.tolist()

    async def stream_fft(self, iq_player, sample_rate, center_freq):
        """Continuously compute and broadcast FFT data"""
        async for chunk in iq_player.stream_samples(chunk_size=self.fft_size):
            if not self.clients:
                continue

            # Compute FFT
            power_db = self.compute_fft(chunk)

            # Prepare message
            message = {
                "type": "fft",
                "center_freq": center_freq,
                "sample_rate": sample_rate,
                "fft_size": self.fft_size,
                "power_db": power_db,
                "timestamp": asyncio.get_event_loop().time()
            }

            # Broadcast to all clients
            if self.clients:
                await asyncio.gather(
                    *[client.send(json.dumps(message)) for client in self.clients],
                    return_exceptions=True
                )

            # Rate limiting
            await asyncio.sleep(self.update_interval)

    async def start_websocket_server(self, host='0.0.0.0', port=8002):
        """Start WebSocket server for browser clients"""
        async with websockets.serve(self.register_client, host, port):
            print(f"WebSocket FFT server listening on ws://{host}:{port}")
            await asyncio.Future()  # Run forever
```

### 1.6 MQTT Inject Handler
**File:** `/sdr-service/app/inject_handler.py`

**Purpose:** Listen for APEX inject commands to control playback (APEX-specific integration)

**Inject Commands:**
```json
{
  "type": "trigger",
  "content": {
    "command": "sdr_play"
  }
}

{
  "type": "trigger",
  "content": {
    "command": "sdr_pause"
  }
}

{
  "type": "trigger",
  "content": {
    "command": "sdr_tune",
    "parameters": {
      "center_freq": 145000000
    }
  }
}
```

**Implementation:**
```python
import paho.mqtt.client as mqtt
import json

class InjectHandler:
    def __init__(self, iq_player, rtl_tcp_server):
        self.iq_player = iq_player
        self.rtl_tcp_server = rtl_tcp_server
        self.client = mqtt.Client()

    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker: {rc}")
        # Subscribe to team-specific topic
        client.subscribe("apex/team/sdr-monitoring/injects")

    def on_message(self, client, userdata, msg):
        """Handle inject messages"""
        try:
            inject = json.loads(msg.payload.decode())

            if inject.get("type") == "trigger":
                command = inject.get("content", {}).get("command")
                params = inject.get("content", {}).get("parameters", {})

                if command == "sdr_play":
                    self.iq_player.running = True
                    self.iq_player.paused = False
                    print("▶ SDR playback started")

                elif command == "sdr_pause":
                    self.iq_player.paused = True
                    print("⏸ SDR playback paused")

                elif command == "sdr_stop":
                    self.iq_player.running = False
                    self.iq_player.position = 0
                    print("⏹ SDR playback stopped")

                elif command == "sdr_tune":
                    freq = params.get("center_freq", 100000000)
                    self.rtl_tcp_server.center_freq = freq
                    print(f"📻 Tuned to: {freq} Hz")

        except Exception as e:
            print(f"Error handling inject: {e}")

    def start(self, mqtt_host='mqtt', mqtt_port=1883):
        """Start MQTT client"""
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(mqtt_host, mqtt_port)
        self.client.loop_start()
```

### 1.7 Main Service
**File:** `/sdr-service/app/main.py`

**Note:** This is the APEX integration layer - it imports from the reusable `sdr_streaming` package

```python
import asyncio
from sdr_streaming.core.iq_player import IQPlayer
from sdr_streaming.protocols.rtl_tcp import RTLTCPServer
from sdr_streaming.processing.fft_processor import FFTProcessor
from inject_handler import InjectHandler  # APEX-specific, stays in app/

async def main():
    # Configuration
    IQ_FILE = "/iq_files/demo_recording.iq"
    SAMPLE_RATE = 1024000  # 1.024 MHz
    CENTER_FREQ = 100000000  # 100 MHz

    # Initialize components
    iq_player = IQPlayer(IQ_FILE, SAMPLE_RATE)
    rtl_tcp = RTLTCPServer(sample_rate=SAMPLE_RATE)
    fft_proc = FFTProcessor(fft_size=1024, update_rate=10)
    inject_handler = InjectHandler(iq_player, rtl_tcp)

    # Start MQTT listener
    inject_handler.start()

    # Start IQ player
    iq_player.running = True

    print("=" * 60)
    print("SDR Streaming Service Started")
    print("=" * 60)
    print(f"IQ File: {IQ_FILE}")
    print(f"Sample Rate: {SAMPLE_RATE / 1e6} MHz")
    print(f"Center Frequency: {CENTER_FREQ / 1e6} MHz")
    print(f"RTL-TCP: 0.0.0.0:1234")
    print(f"WebSocket FFT: ws://0.0.0.0:8002")
    print("=" * 60)

    # Run all services concurrently
    await asyncio.gather(
        rtl_tcp.start(iq_player),
        fft_proc.start_websocket_server(),
        fft_proc.stream_fft(iq_player, SAMPLE_RATE, CENTER_FREQ)
    )

if __name__ == "__main__":
    asyncio.run(main())
```

### 1.8 Dockerfile
**File:** `/sdr-service/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ./app /app/

# Expose ports
EXPOSE 1234 8002

CMD ["python", "main.py"]
```

---

## Phase 2: Frontend SDR Dashboard

### 2.1 Create Waterfall Component
**File:** `/team-dashboard-satcom/src/components/sdr/WaterfallDisplay.tsx`

**Features:**
- HTML5 Canvas for waterfall
- Frequency axis labels
- Power scale (dB color map)
- Scrolling time axis
- Click to tune

**Canvas Strategy:**
- Width: 1024 pixels (one per FFT bin)
- Height: 512 pixels (time history)
- Each new FFT row pushes down previous rows
- Color map: Blue (low) → Green → Yellow → Red (high)

**Note:** Following Layer 1 reusability guidelines - component is stateless, configurable via props, no APEX dependencies

```typescript
import { useEffect, useRef, useState } from 'react';

/**
 * Real-time waterfall spectrum display for SDR applications.
 *
 * @param wsUrl - WebSocket URL for FFT data stream (e.g., 'ws://localhost:8002')
 * @param centerFreq - Center frequency in Hz
 * @param sampleRate - Sample rate in Hz
 * @param width - Canvas width in pixels (default: 1024)
 * @param height - Canvas height in pixels (default: 512)
 * @param minDb - Minimum power level in dB (default: -100)
 * @param maxDb - Maximum power level in dB (default: -20)
 * @param colorMap - Color mapping style (default: 'spectrum')
 */
interface WaterfallProps {
  wsUrl: string;  // ← WebSocket URL as prop (reusability!)
  centerFreq: number;
  sampleRate: number;
  width?: number;
  height?: number;
  minDb?: number;
  maxDb?: number;
  colorMap?: 'spectrum' | 'viridis' | 'plasma';
  onFrequencyClick?: (freq: number) => void;
}

const WaterfallDisplay: React.FC<WaterfallProps> = ({
  wsUrl,  // ← Required prop
  centerFreq,
  sampleRate,
  width = 1024,
  height = 512,
  minDb = -100,
  maxDb = -20,
  colorMap = 'spectrum',
  onFrequencyClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket using provided URL
    const websocket = new WebSocket(wsUrl);  // ← Use prop, not hardcoded

    websocket.onopen = () => {
      console.log('Connected to SDR FFT stream');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'fft') {
        drawFFT(data.power_db);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const powerToColor = (db: number): string => {
    // Normalize to 0-1 range
    const normalized = (db - minDb) / (maxDb - minDb);
    const clamped = Math.max(0, Math.min(1, normalized));

    // Color gradient: blue → cyan → green → yellow → red
    const hue = (1 - clamped) * 240; // 240=blue, 0=red
    const saturation = 100;
    const lightness = 30 + (clamped * 40);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const drawFFT = (powerDb: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Scroll existing image down by 1 pixel
    const imageData = ctx.getImageData(0, 0, width, height - 1);
    ctx.putImageData(imageData, 0, 1);

    // Draw new FFT line at top
    for (let i = 0; i < powerDb.length && i < width; i++) {
      ctx.fillStyle = powerToColor(powerDb[i]);
      ctx.fillRect(i, 0, 1, 1);
    }
  };

  const formatFreq = (freq: number): string => {
    if (freq >= 1e9) return `${(freq / 1e9).toFixed(3)} GHz`;
    if (freq >= 1e6) return `${(freq / 1e6).toFixed(3)} MHz`;
    if (freq >= 1e3) return `${(freq / 1e3).toFixed(3)} kHz`;
    return `${freq} Hz`;
  };

  return (
    <div className="flex flex-col">
      <div className="bg-surface p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-text-secondary text-sm">Center Frequency:</span>
            <span className="text-primary font-mono ml-2">{formatFreq(centerFreq)}</span>
          </div>
          <div>
            <span className="text-text-secondary text-sm">Bandwidth:</span>
            <span className="text-primary font-mono ml-2">{formatFreq(sampleRate)}</span>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={1024}
        height={512}
        className="bg-black"
      />
      <div className="bg-surface p-2 rounded-b-lg flex justify-between text-xs text-text-secondary">
        <span>{formatFreq(centerFreq - sampleRate / 2)}</span>
        <span>{formatFreq(centerFreq)}</span>
        <span>{formatFreq(centerFreq + sampleRate / 2)}</span>
      </div>
    </div>
  );
};

export default WaterfallDisplay;
```

### 2.2 Create Spectrum Display Component
**File:** `/team-dashboard-satcom/src/components/sdr/SpectrumDisplay.tsx`

**Features:**
- Real-time FFT line plot
- Frequency axis
- Power (dB) axis
- Peak hold
- Grid lines

```typescript
import { useEffect, useRef, useState } from 'react';

interface SpectrumProps {
  centerFreq: number;
  sampleRate: number;
}

const SpectrumDisplay: React.FC<SpectrumProps> = ({ centerFreq, sampleRate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFFT, setCurrentFFT] = useState<number[]>([]);
  const [peakHold, setPeakHold] = useState<number[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8002');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'fft') {
        setCurrentFFT(data.power_db);

        // Update peak hold
        setPeakHold(prev => {
          if (prev.length !== data.power_db.length) return data.power_db;
          return data.power_db.map((val: number, i: number) => Math.max(val, prev[i]));
        });
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (currentFFT.length === 0) return;
    drawSpectrum();
  }, [currentFFT]);

  const drawSpectrum = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const minDb = -100;
    const maxDb = -20;

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1a1f2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw spectrum
    const drawLine = (data: number[], color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();

      data.forEach((db, i) => {
        const x = (i / data.length) * canvas.width;
        const normalized = (db - minDb) / (maxDb - minDb);
        const y = canvas.height - (normalized * canvas.height);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    };

    // Draw peak hold (faint)
    if (peakHold.length > 0) {
      drawLine(peakHold, '#3b82f6', 1);
    }

    // Draw current (bright)
    drawLine(currentFFT, '#10b981', 2);
  };

  return (
    <div className="flex flex-col">
      <canvas ref={canvasRef} width={1024} height={300} className="bg-background rounded-lg" />
    </div>
  );
};

export default SpectrumDisplay;
```

### 2.3 Create Control Panel
**File:** `/team-dashboard-satcom/src/components/sdr/ControlPanel.tsx`

**Features:**
- Play/Pause/Stop buttons
- Frequency tuning input
- Connection status
- Sample rate display

```typescript
import { useState } from 'react';

interface ControlPanelProps {
  onCommand: (command: string, params?: any) => void;
  isConnected: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onCommand, isConnected }) => {
  const [centerFreq, setCenterFreq] = useState(100000000);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    onCommand('sdr_play');
    setIsPlaying(true);
  };

  const handlePause = () => {
    onCommand('sdr_pause');
    setIsPlaying(false);
  };

  const handleStop = () => {
    onCommand('sdr_stop');
    setIsPlaying(false);
  };

  const handleTune = () => {
    onCommand('sdr_tune', { center_freq: centerFreq });
  };

  return (
    <div className="bg-surface p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-text-secondary">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white font-semibold"
        >
          ▶ Play
        </button>
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded text-white font-semibold"
        >
          ⏸ Pause
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
        >
          ⏹ Stop
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={centerFreq}
          onChange={(e) => setCenterFreq(Number(e.target.value))}
          className="flex-1 px-3 py-2 bg-background border border-border rounded text-text-primary font-mono"
          placeholder="Frequency (Hz)"
        />
        <button
          onClick={handleTune}
          className="px-4 py-2 bg-primary hover:bg-primary-hover rounded text-white font-semibold"
        >
          Tune
        </button>
      </div>

      <div className="mt-4 text-xs text-text-secondary">
        <p>GQRX Connection: localhost:1234</p>
        <p>Sample Rate: 1.024 MHz</p>
      </div>
    </div>
  );
};

export default ControlPanel;
```

### 2.4 Create SDR Monitoring Page
**File:** `/team-dashboard-satcom/src/pages/SDRMonitoringPage.tsx`

**Note:** This is the APEX integration layer - it uses reusable SDR components and connects them to APEX-specific features (MQTT, InjectContext)

```typescript
import { useState, useEffect } from 'react';
import WaterfallDisplay from '../components/sdr/WaterfallDisplay';
import SpectrumDisplay from '../components/sdr/SpectrumDisplay';
import ControlPanel from '../components/sdr/ControlPanel';
import { useMQTT } from '../contexts/InjectContext';  // ← APEX-specific

const SDRMonitoringPage = () => {
  const [centerFreq, setCenterFreq] = useState(100000000);
  const [sampleRate] = useState(1024000);
  const [isConnected, setIsConnected] = useState(false);
  const mqtt = useMQTT();

  useEffect(() => {
    // Check WebSocket connection status
    const ws = new WebSocket('ws://localhost:8002');
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, []);

  const handleCommand = (command: string, params?: any) => {
    // Send command via MQTT inject system
    const inject = {
      type: 'trigger',
      content: {
        command,
        parameters: params
      }
    };

    // Publish to MQTT (this would use your existing MQTT client)
    mqtt.publish('apex/team/sdr-monitoring/injects', JSON.stringify(inject));

    // Update local state for tuning
    if (command === 'sdr_tune' && params?.center_freq) {
      setCenterFreq(params.center_freq);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SDR Spectrum Monitoring</h1>
        <div className="text-sm text-text-secondary">
          Virtual RTL-SDR • Real-time Playback
        </div>
      </div>

      <ControlPanel
        onCommand={handleCommand}
        isConnected={isConnected}
      />

      <div className="grid grid-cols-1 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Spectrum Analyzer</h2>
          <SpectrumDisplay
            wsUrl="ws://localhost:8002"  {/* ← Pass WebSocket URL as prop */}
            centerFreq={centerFreq}
            sampleRate={sampleRate}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Waterfall Display</h2>
          <WaterfallDisplay
            wsUrl="ws://localhost:8002"  {/* ← Pass WebSocket URL as prop */}
            centerFreq={centerFreq}
            sampleRate={sampleRate}
            width={1024}
            height={512}
          />
        </div>
      </div>

      <div className="bg-surface p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connection Info</h3>
        <div className="space-y-1 text-sm font-mono">
          <p>RTL-TCP: <span className="text-primary">localhost:1234</span></p>
          <p>WebSocket: <span className="text-primary">ws://localhost:8002</span></p>
          <p>GQRX Command: <span className="text-text-secondary">Set I/O Device to "RTL-SDR", Server: localhost:1234</span></p>
        </div>
      </div>
    </div>
  );
};

export default SDRMonitoringPage;
```

---

## Phase 3: APEX Integration

### 3.1 Add SDR Service to Docker Compose
**File:** `/docker-compose.yml`

```yaml
services:
  # ... existing services ...

  sdr-service:
    build: ./sdr-service
    container_name: scip-sdr-service
    ports:
      - "1234:1234"  # RTL-TCP for GQRX
      - "8002:8002"  # WebSocket for browser
    volumes:
      - ./sdr-service/iq_files:/iq_files
    networks:
      - scip-network
    depends_on:
      - mqtt
```

### 3.2 Create Sample Scenario
**File:** `/scenarios/sdr-monitoring-scenario.json`

```json
{
  "id": "sdr-monitoring-scenario",
  "name": "SDR Spectrum Monitoring",
  "description": "Real-time spectrum monitoring with IQ file playback. Compatible with GQRX external connection.",
  "version": "1.0.0",
  "duration_minutes": 30,
  "teams": [
    {
      "id": "sdr-monitoring",
      "name": "Spectrum Monitoring Team",
      "description": "Monitor RF spectrum and identify signals",
      "timeline_file": "timelines/timeline-sdr.json",
      "dashboard_port": 3200,
      "dashboard_image": "team-dashboard-satcom:latest"
    }
  ]
}
```

### 3.3 Create Timeline
**File:** `/scenarios/timelines/timeline-sdr.json`

```json
{
  "id": "timeline-sdr",
  "name": "SDR Monitoring Timeline",
  "description": "Playback control and frequency scanning",
  "version": "1.0.0",
  "injects": [
    {
      "id": "inject-sdr-001",
      "time": 0,
      "type": "trigger",
      "content": {
        "command": "sdr_play"
      }
    },
    {
      "id": "inject-sdr-002",
      "time": 10,
      "type": "alert",
      "content": {
        "severity": "info",
        "title": "Monitoring Started",
        "message": "IQ file playback initiated. Monitor spectrum for signals of interest."
      }
    },
    {
      "id": "inject-sdr-003",
      "time": 30,
      "type": "trigger",
      "content": {
        "command": "sdr_tune",
        "parameters": {
          "center_freq": 145000000
        }
      }
    },
    {
      "id": "inject-sdr-004",
      "time": 40,
      "type": "alert",
      "content": {
        "severity": "warning",
        "title": "Frequency Change",
        "message": "Tuned to 145 MHz (2m amateur band). Observe activity."
      }
    }
  ]
}
```

---

## Phase 4: Sample IQ File Preparation

### 4.1 Create Demo IQ File

**Option 1: Generate Synthetic Signal**
```python
# create_demo_iq.py
import numpy as np

# Parameters
sample_rate = 1024000  # 1.024 MHz
duration = 60  # 60 seconds
num_samples = sample_rate * duration

# Generate noise floor
noise = (np.random.randn(num_samples) + 1j * np.random.randn(num_samples)) * 0.1

# Add some signals
t = np.arange(num_samples) / sample_rate

# Signal 1: CW carrier at +100 kHz offset
signal1 = 0.3 * np.exp(2j * np.pi * 100000 * t)

# Signal 2: FM modulated at -150 kHz
fm_mod = 0.2 * np.sin(2 * np.pi * 1000 * t)  # 1 kHz modulation
signal2 = 0.25 * np.exp(2j * np.pi * (-150000 * t + fm_mod))

# Combine
iq_data = noise + signal1 + signal2

# Save as complex64
iq_data.astype(np.complex64).tofile('sdr-service/iq_files/demo_recording.iq')

print(f"Created {len(iq_data)} samples ({duration}s)")
print(f"File size: {iq_data.nbytes / 1024 / 1024:.1f} MB")
```

**Option 2: Use Real Recording**
- Record with `rtl_sdr` or `hackrf_transfer`
- Use URH (Universal Radio Hacker) to create IQ file
- Convert existing .wav SDR recordings to .iq format

### 4.2 IQ File Format Reference

**Complex64 (.iq):**
- Each sample: 8 bytes (4 bytes I, 4 bytes Q)
- Format: 32-bit float I, 32-bit float Q
- Range: -1.0 to +1.0

**Uint8 (.dat):**
- Each sample: 2 bytes (1 byte I, 1 byte Q)
- Format: uint8 I, uint8 Q
- Range: 0-255 (127 = center)

---

## Implementation Timeline

### Week 1: Backend Development
**Days 1-2:** IQ Player + RTL-TCP Server
- [ ] Set up sdr-service directory structure
- [ ] Implement IQ file loading (.iq and .dat support)
- [ ] Implement RTL-TCP protocol
- [ ] Test with GQRX connection
- [ ] Verify sample streaming

**Days 3-4:** FFT Processing + WebSocket
- [ ] Implement FFT computation
- [ ] Create WebSocket server
- [ ] Test FFT data streaming
- [ ] Optimize performance

**Day 5:** MQTT Integration
- [ ] Implement inject command handler
- [ ] Test play/pause/tune commands
- [ ] Integration testing

### Week 2: Frontend Development
**Days 1-2:** Waterfall Component
- [ ] Create canvas-based waterfall
- [ ] Implement color mapping
- [ ] Add frequency labels
- [ ] Test with live FFT stream

**Days 3-4:** Spectrum & Controls
- [ ] Create spectrum analyzer display
- [ ] Build control panel
- [ ] Implement command sending
- [ ] Add connection status

**Day 5:** Integration & Polish
- [ ] Create SDR monitoring page
- [ ] APEX scenario setup
- [ ] End-to-end testing
- [ ] Documentation

### Week 3: Testing & Refinement
**Days 1-2:** GQRX Testing
- [ ] Test external GQRX connection
- [ ] Verify frequency tuning
- [ ] Test multiple simultaneous connections
- [ ] Performance optimization

**Days 3-4:** Browser Testing
- [ ] Test waterfall performance
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] UI/UX improvements

**Day 5:** Demo Preparation
- [ ] Create compelling demo IQ file
- [ ] Write user documentation
- [ ] Prepare demo script
- [ ] Final testing

---

## Testing Checklist

### Backend Tests
- [ ] IQ file loads correctly
- [ ] Samples stream at correct rate
- [ ] RTL-TCP handshake works with GQRX
- [ ] GQRX can tune frequency
- [ ] FFT computation is accurate
- [ ] WebSocket broadcasts at 10 Hz
- [ ] MQTT commands control playback
- [ ] Service runs in Docker container

### Frontend Tests
- [ ] Waterfall displays correctly
- [ ] Colors represent power levels accurately
- [ ] Spectrum analyzer updates in real-time
- [ ] Control buttons send correct commands
- [ ] Frequency tuning works
- [ ] WebSocket reconnects on disconnect
- [ ] Canvas performance is smooth
- [ ] Responsive on different screen sizes

### Integration Tests
- [ ] GQRX connects successfully
- [ ] Browser and GQRX work simultaneously
- [ ] Inject commands control both streams
- [ ] Frequency changes reflect in both displays
- [ ] No audio/timing drift over time
- [ ] Service restarts cleanly

---

## Performance Optimization

### Backend
- Use numpy vectorization for FFT
- Downsampling for browser (send every Nth FFT)
- Circular buffer for IQ samples
- Async I/O for all network operations

### Frontend
- RequestAnimationFrame for smooth rendering
- OffscreenCanvas for background processing
- Throttle WebSocket message handling
- Lazy load components

---

## Future Enhancements

### Phase 5: Jamming Integration (Future)
**When ready to add jamming:**

1. **Jamming Signal Mixer**
```python
class SignalMixer:
    def mix_signals(self, base_iq, jamming_iq, power_db):
        """Mix jamming signal into base IQ at specified power"""
        power_ratio = 10 ** (power_db / 20)
        return base_iq + (jamming_iq * power_ratio)
```

2. **Jamming Inject Commands**
```json
{
  "type": "trigger",
  "content": {
    "command": "inject_jamming",
    "parameters": {
      "type": "narrowband_cw",
      "freq_offset": 50000,
      "power_db": -30,
      "duration_sec": 10
    }
  }
}
```

3. **Jamming Library**
- Pre-recorded jamming IQ files
- Real-time jamming signal generation
- Multiple jamming types (CW, noise, sweep)

### Phase 6: Advanced Features
- **Recording:** Save current reception to file
- **Demodulation:** AM/FM/SSB audio output
- **Signal detection:** Auto-detect and classify signals
- **Replay:** Seek to specific time in recording
- **Multi-channel:** Monitor multiple frequencies

---

## GQRX Setup Instructions

### For End Users

1. **Install GQRX**
   - macOS: `brew install gqrx`
   - Linux: `sudo apt install gqrx-sdr`
   - Windows: Download from gqrx.dk

2. **Configure GQRX**
   - Device: Select "RTL-SDR"
   - Device String: `rtl_tcp=localhost:1234`
   - Sample Rate: 1024000
   - Frequency: 100000000

3. **Connect**
   - Start APEX SDR scenario
   - Click "Play" in GQRX
   - Tune as desired

4. **What You'll See**
   - Real-time waterfall in GQRX
   - Simultaneous waterfall in browser
   - Both stay synchronized

---

## Success Criteria

✅ GQRX connects and displays spectrum
✅ Browser waterfall displays in real-time
✅ Inject commands control playback
✅ Multiple connections work simultaneously
✅ Performance is smooth (no lag/stutter)
✅ Service integrates with APEX scenarios
✅ Documentation is clear
✅ Demo is impressive

---

## Risk Assessment

**Technical Risks:**
- Performance at high sample rates → Mitigated by 1.024 MHz choice
- FFT computation overhead → Mitigated by numpy optimization
- WebSocket bandwidth → Mitigated by 10 Hz update rate
- Browser canvas performance → Mitigated by simple drawing

**Integration Risks:**
- Docker networking → Mapped ports should work
- MQTT message delivery → Existing system proven
- Concurrent streams → asyncio handles well

**Overall Risk: Medium-Low**
More complex than analytics but well-scoped and technically proven approach.

---

## Estimated Effort

**Backend:** 12-16 hours
**Frontend:** 10-14 hours
**Integration:** 4-6 hours
**Testing:** 6-8 hours

**Total: 32-44 hours** (4-6 working days)

---

## Conclusion

This implementation creates a unique, impressive SDR scenario that:
- Demonstrates real-world RF monitoring
- Works with professional tools (GQRX)
- Provides visual real-time feedback
- Integrates seamlessly with APEX
- Lays foundation for jamming scenarios

The technical approach is proven, the scope is manageable, and the "wow factor" is extremely high.
