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

        TODO: REPLACE THIS WITH YOUR ACTUAL JAMMING CODE

        This is a placeholder implementation with basic jamming types.
        Integrate your existing jamming code here.
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
