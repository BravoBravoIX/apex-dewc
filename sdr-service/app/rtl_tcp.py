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
            if writer in self.clients:
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
                if client in self.clients:
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
