import asyncio
import json
import os
import time
import paho.mqtt.client as mqtt
import docker
from redis_manager import RedisManager


class ExerciseExecutor:
    """
    Manages exercise execution with timer, state management, and inject delivery.
    """

    def __init__(self, scenario_name: str):
        """
        Initialize the exercise executor.

        Args:
            scenario_name: Name of the scenario to execute
        """
        self.scenario_name = scenario_name
        self.scenario_data = None
        self.timelines = {}
        self.is_running = False

        # State management
        self.state = "NOT_STARTED"  # NOT_STARTED, RUNNING, PAUSED, STOPPED
        self.start_time = None
        self.pause_time = None
        self.elapsed_at_pause = 0

        # External services
        self.redis_manager = RedisManager()
        self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.docker_client = docker.from_env()

        # Container management
        self.team_containers = []
        self.service_containers = []
        self.dashboard_urls = {}

        print(f"Executor for {scenario_name} initialized with Redis support.")

    def _connect_mqtt(self):
        try:
            self.mqtt_client.connect("mqtt", 1883, 60)
            self.mqtt_client.loop_start()
            print(f"MQTT client connected. Client ID: {self.mqtt_client._client_id}")
            # Test publish
            test_result = self.mqtt_client.publish("/test", "connected", qos=1)
            print(f"Test publish result: {test_result.rc}")
        except Exception as e:
            print(f"MQTT connection error: {e}")

    def load_scenario(self):
        """Loads the scenario and its associated timelines."""
        scenario_path = os.path.join("/scenarios", f"{self.scenario_name}.json")
        print(f"Loading scenario from: {scenario_path}")
        with open(scenario_path, 'r') as f:
            self.scenario_data = json.load(f)
        print("Scenario loaded successfully.")

        # Load timelines for each team
        for team in self.scenario_data.get('teams', []):
            timeline_file = team.get('timeline_file')
            if timeline_file:
                timeline_path = os.path.join("/scenarios", timeline_file)
                print(f"Loading timeline for team {team['id']} from {timeline_path}")
                with open(timeline_path, 'r') as f:
                    self.timelines[team['id']] = json.load(f)

    def _deploy_team_dashboards(self):
        for i, team in enumerate(self.scenario_data.get('teams', [])):
            team_id = team['id']

            # Get dashboard image from team config, fallback to scenario level, then default
            dashboard_image = team.get('dashboard_image',
                                       self.scenario_data.get('dashboard_image', 'team-dashboard:latest'))

            # Get port from team config, fallback to base_port + index
            port = team.get('dashboard_port', 3100 + i)

            print(f"Using dashboard image: {dashboard_image} on port {port}")
            container_name = f"team-dashboard-{self.scenario_name}-{team_id}"

            environment = {
                'VITE_TEAM_ID': team_id,
                'VITE_MQTT_TOPIC': f"/exercise/{self.scenario_name}/team/{team_id}/feed"
                # VITE_BROKER_URL not needed - dashboard will use dynamic URL
            }

            print(f"Deploying {container_name} on port {port}")

            # Check if container with this name already exists and remove it
            try:
                existing_container = self.docker_client.containers.get(container_name)
                print(f"Found existing container {container_name}. Stopping and removing...")
                existing_container.stop()
                existing_container.remove()
            except docker.errors.NotFound:
                pass # Container does not exist, safe to proceed

            try:
                container = self.docker_client.containers.run(
                    dashboard_image,
                    name=container_name,
                    detach=True,
                    environment=environment,
                    ports={'80/tcp': port},
                    network='scip-v3_scip-network'
                )
                self.team_containers.append(container)
                # Include configuration in URL query parameters
                self.dashboard_urls[team_id] = f"http://localhost:{port}/?team={team_id}&exercise={self.scenario_name}"

                # Debugging: Print container status and logs
                container.reload()
                print(f"Container {container.name} status: {container.status}")
                print(f"Container {container.name} logs:\n{container.logs().decode('utf-8')}")
            except docker.errors.APIError as e:
                print(f"Error running container {container_name}: {e}")
                import traceback
                traceback.print_exc()
                raise # Re-raise to propagate the error

    def _deploy_sdr_service(self):
        """Deploy SDR service if scenario requires it."""
        # Check if scenario has iq_file configured
        iq_file = self.scenario_data.get('iq_file')
        if not iq_file:
            print("No IQ file configured, skipping SDR service deployment")
            return

        container_name = f"sdr-service-{self.scenario_name}"

        # Convert /iq_library/file.iq to absolute host path
        if iq_file.startswith('/iq_library/'):
            iq_filename = iq_file[13:]  # Remove /iq_library/ prefix
            iq_file_host_path = f"/scenarios/iq_library/{iq_filename}"
        else:
            iq_file_host_path = iq_file

        print(f"Deploying SDR service with IQ file: {iq_file}")

        # Check if container exists and remove it
        try:
            existing_container = self.docker_client.containers.get(container_name)
            print(f"Found existing SDR service {container_name}. Stopping and removing...")
            existing_container.stop()
            existing_container.remove()
        except docker.errors.NotFound:
            pass

        try:
            container = self.docker_client.containers.run(
                'scip-v3-sdr-service:latest',
                name=container_name,
                detach=True,
                environment={
                    'IQ_FILE_PATH': '/iq_files/current.iq',
                    'SAMPLE_RATE': '1024000'
                },
                ports={'1234/tcp': 1234},
                volumes={
                    iq_file_host_path: {
                        'bind': '/iq_files/current.iq',
                        'mode': 'ro'
                    }
                },
                network='scip-v3_scip-network'
            )
            self.service_containers.append(container)
            print(f"SDR service deployed: {container.name}")

            container.reload()
            print(f"SDR service status: {container.status}")

        except docker.errors.APIError as e:
            print(f"Error deploying SDR service: {e}")
            import traceback
            traceback.print_exc()

    async def start(self):
        """
        Starts the exercise execution with state tracking.

        Returns:
            Dict with status, scenario name, and dashboard URLs
        """
        # Clean any existing Redis data for this scenario first
        await self.redis_manager.cleanup_exercise(self.scenario_name)

        self._connect_mqtt()
        self.load_scenario()
        self._deploy_team_dashboards()
        self._deploy_sdr_service()

        # Don't start the timer immediately - wait for explicit start command
        self.state = "NOT_STARTED"
        self.is_running = False

        # Update Redis state
        await self.redis_manager.set_exercise_state(self.scenario_name, "NOT_STARTED")

        print(f"Exercise deployed for scenario: {self.scenario_name} - waiting for start command")

        return {
            "status": "Exercise deployed",
            "scenario": self.scenario_name,
            "dashboard_urls": self.dashboard_urls
        }

    async def begin(self):
        """
        Actually starts the exercise timer and inject delivery.

        Returns:
            Dict with begin status
        """
        if self.state == "NOT_STARTED":
            self.state = "RUNNING"
            self.start_time = time.time()
            self.is_running = True

            # Update Redis state
            await self.redis_manager.set_exercise_state(self.scenario_name, "RUNNING")

            # Start the main exercise loop
            print(f"Creating task for run() method")
            task = asyncio.create_task(self.run())
            print(f"Task created: {task}")

            # Publish start command via MQTT
            start_msg = {"command": "start", "timestamp": self.start_time}
            self.mqtt_client.publish(
                f"/exercise/{self.scenario_name}/control",
                json.dumps(start_msg),
                qos=1
            )

            print(f"Exercise {self.scenario_name} started")
            return {"status": "Exercise started"}

        return {"status": "Exercise already started", "error": "Cannot start - not in NOT_STARTED state"}

    async def pause(self):
        """
        Pause the exercise, maintaining timer state.

        Returns:
            Dict with pause status
        """
        if self.state == "RUNNING":
            self.state = "PAUSED"
            self.pause_time = time.time()
            self.elapsed_at_pause += (self.pause_time - self.start_time)

            # Update Redis state
            await self.redis_manager.set_exercise_state(self.scenario_name, "PAUSED")

            # Publish pause command via MQTT
            pause_msg = {"command": "pause", "timestamp": self.pause_time}
            self.mqtt_client.publish(
                f"/exercise/{self.scenario_name}/control",
                json.dumps(pause_msg),
                qos=1
            )

            print(f"Exercise {self.scenario_name} paused at {self.elapsed_at_pause:.1f} seconds")
            return {"status": "Exercise paused", "elapsed": self.elapsed_at_pause}

        return {"status": "Exercise not running", "error": "Cannot pause - not in RUNNING state"}

    async def resume(self):
        """
        Resume the exercise from paused state.

        Returns:
            Dict with resume status
        """
        if self.state == "PAUSED":
            self.state = "RUNNING"
            self.start_time = time.time()

            # Update Redis state
            await self.redis_manager.set_exercise_state(self.scenario_name, "RUNNING")

            # Publish resume command via MQTT
            resume_msg = {"command": "resume", "timestamp": self.start_time}
            self.mqtt_client.publish(
                f"/exercise/{self.scenario_name}/control",
                json.dumps(resume_msg),
                qos=1
            )

            print(f"Exercise {self.scenario_name} resumed")
            return {"status": "Exercise resumed"}

        return {"status": "Exercise not paused", "error": "Cannot resume - not in PAUSED state"}

    async def run(self):
        """
        The main exercise loop with timer broadcasting and inject tracking.
        """
        published_injects = set()
        last_elapsed = -1  # Track last elapsed second to update only on change
        print(f"Starting run loop for {self.scenario_name}, is_running={self.is_running}")

        while self.is_running:
            if self.state == "RUNNING":
                # Calculate elapsed time considering pauses
                now = time.time()
                current_elapsed = self.elapsed_at_pause + (now - self.start_time)
                elapsed_seconds = int(current_elapsed)

                # Debug every second change
                if elapsed_seconds != last_elapsed:
                    print(f"DEBUG: now={now:.3f}, start={self.start_time:.3f}, diff={now-self.start_time:.3f}, elapsed_at_pause={self.elapsed_at_pause}, current_elapsed={current_elapsed:.3f}, elapsed_seconds={elapsed_seconds}")

                # Only update timer if the second has changed
                if elapsed_seconds != last_elapsed:
                    last_elapsed = elapsed_seconds

                    # Format timer for display
                    minutes = elapsed_seconds // 60
                    seconds = elapsed_seconds % 60
                    formatted_timer = f"T+{minutes:02d}:{seconds:02d}"

                    # Debug: log time calculation
                    print(f"Timer update: elapsed={elapsed_seconds}, current_elapsed={current_elapsed:.2f}, start_time={self.start_time:.2f}, now={time.time():.2f}, elapsed_at_pause={self.elapsed_at_pause}")

                    # Publish timer update via MQTT
                    timer_topic = f"/exercise/{self.scenario_name}/timer"
                    timer_payload = {
                        "elapsed": elapsed_seconds,
                        "formatted": formatted_timer,
                        "timestamp": time.time()
                    }
                    result = self.mqtt_client.publish(timer_topic, json.dumps(timer_payload), qos=0)
                    if elapsed_seconds % 10 == 0:  # Log every 10 seconds
                        print(f"Published timer to {timer_topic}: {formatted_timer}, result={result.rc}")

                    # Update timer in Redis
                    await self.redis_manager.update_timer(self.scenario_name, elapsed_seconds)
                else:
                    # Format timer for inject checking even if not publishing
                    minutes = elapsed_seconds // 60
                    seconds = elapsed_seconds % 60
                    formatted_timer = f"T+{minutes:02d}:{seconds:02d}"

                # Check and publish injects for all teams
                for team_id, timeline in self.timelines.items():
                    for inject in timeline.get('injects', []):
                        inject_id = inject.get('id')
                        inject_time = inject.get('time')

                        # Check if it's time to publish this inject
                        if inject_time == elapsed_seconds and inject_id not in published_injects:
                            topic = f"/exercise/{self.scenario_name}/team/{team_id}/feed"

                            # Add metadata to inject (including media and action if present)
                            inject_with_metadata = {
                                **inject,
                                "delivered_at": elapsed_seconds,
                                "team_id": team_id,
                                "exercise_id": self.scenario_name,
                                "media": inject.get("media", []),  # Include media array if present
                                "action": inject.get("action", None)  # Include action if present
                            }
                            payload = json.dumps(inject_with_metadata)

                            print(f"Publishing inject {inject_id} to team {team_id} at {formatted_timer}")
                            self.mqtt_client.publish(topic, payload, qos=1)
                            published_injects.add(inject_id)

                            # Record delivery in Redis
                            await self.redis_manager.record_inject_delivery(
                                self.scenario_name, team_id, inject_id, "delivered"
                            )

                # Debug output every 5 seconds
                if elapsed_seconds % 5 == 0:
                    print(f"Exercise timer: {formatted_timer}, State: {self.state}")

            elif self.state == "PAUSED":
                # While paused, just maintain state but don't advance timer
                await asyncio.sleep(0.1)
                continue

            # Sleep for 100ms to check timer more frequently
            await asyncio.sleep(0.1)

    async def stop(self):
        """
        Stops the exercise execution and cleans up resources.

        Returns:
            Dict with stop status
        """
        self.is_running = False
        self.state = "STOPPED"

        # Update Redis state
        await self.redis_manager.set_exercise_state(self.scenario_name, "STOPPED")

        # Publish stop command via MQTT
        stop_msg = {"command": "stop", "timestamp": time.time()}
        self.mqtt_client.publish(
            f"/exercise/{self.scenario_name}/control",
            json.dumps(stop_msg),
            qos=1
        )

        # Disconnect MQTT
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()

        print(f"Stopping exercise for scenario: {self.scenario_name}")

        # Stop and remove team containers
        for container in self.team_containers:
            try:
                print(f"Stopping and removing container {container.name}")
                container.stop()
                container.remove()
            except Exception as e:
                print(f"Error stopping container {container.name}: {e}")

        # Stop and remove service containers
        for container in self.service_containers:
            try:
                print(f"Stopping and removing service container {container.name}")
                container.stop()
                container.remove()
            except Exception as e:
                print(f"Error stopping service container {container.name}: {e}")

        # Clean up Redis keys to prevent stale data in next exercise
        await self.redis_manager.cleanup_exercise(self.scenario_name)

        return {"status": "Exercise stopped", "scenario": self.scenario_name}
