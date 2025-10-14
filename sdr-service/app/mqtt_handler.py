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

                # IQ file switching
                elif command == "switch_iq":
                    file_path = params.get("file")
                    if file_path:
                        self.iq_player.switch_file(file_path)
                    else:
                        print("❌ No file path provided for switch_iq")

        except Exception as e:
            print(f"❌ Error handling inject: {e}")

    def start(self, mqtt_host='mqtt', mqtt_port=1883):
        """Start MQTT client"""
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(mqtt_host, mqtt_port)
        self.client.loop_start()
