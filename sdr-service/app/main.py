import asyncio
import os
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
    # Configuration from environment
    IQ_FILE = os.getenv('IQ_FILE_PATH', '/iq_files/demo.iq')
    SAMPLE_RATE = int(os.getenv('SAMPLE_RATE', '1024000'))

    print("=" * 60)
    print("SDR/GQRX Streaming Service")
    print("=" * 60)
    print(f"IQ File: {IQ_FILE}")
    print(f"Sample Rate: {SAMPLE_RATE} Hz")

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
