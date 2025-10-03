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
