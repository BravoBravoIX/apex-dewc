"""
Redis Manager for SCIP v3 Exercise State Management

This module provides centralized state management for exercises using Redis.
It handles exercise state, timers, inject delivery tracking, and team status.
"""

import json
import time
from typing import Dict, List, Optional
import redis
from redis.exceptions import RedisError


class RedisManager:
    """Manages exercise state and tracking in Redis."""

    def __init__(self, host: str = 'redis', port: int = 6379, db: int = 0):
        """
        Initialize Redis connection.

        Args:
            host: Redis server hostname (default: 'redis' for Docker)
            port: Redis server port (default: 6379)
            db: Redis database number (default: 0)
        """
        try:
            self.redis = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis.ping()
            print(f"Connected to Redis at {host}:{port}")
        except RedisError as e:
            print(f"Failed to connect to Redis: {e}")
            # Initialize with None to allow fallback behavior
            self.redis = None

        self.EXERCISE_TTL = 86400  # 24 hours

    def is_connected(self) -> bool:
        """Check if Redis connection is active."""
        if not self.redis:
            return False
        try:
            self.redis.ping()
            return True
        except:
            return False

    async def set_exercise_state(self, scenario_name: str, state: str) -> bool:
        """
        Store exercise state (NOT_STARTED, RUNNING, PAUSED, STOPPED).

        Args:
            scenario_name: Name of the scenario
            state: Current state of the exercise

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            key = f"exercise:{scenario_name}:state"
            self.redis.set(key, state, ex=self.EXERCISE_TTL)

            # Also store timestamp of state change
            timestamp_key = f"exercise:{scenario_name}:state_timestamp"
            self.redis.set(timestamp_key, time.time(), ex=self.EXERCISE_TTL)

            print(f"Set exercise state: {scenario_name} -> {state}")
            return True
        except RedisError as e:
            print(f"Error setting exercise state: {e}")
            return False

    async def get_exercise_state(self, scenario_name: str) -> Optional[str]:
        """
        Get current exercise state.

        Args:
            scenario_name: Name of the scenario

        Returns:
            State string or None if not found
        """
        if not self.redis:
            return None

        try:
            key = f"exercise:{scenario_name}:state"
            return self.redis.get(key)
        except RedisError as e:
            print(f"Error getting exercise state: {e}")
            return None

    async def update_timer(self, scenario_name: str, elapsed: float) -> bool:
        """
        Update exercise timer with elapsed seconds.

        Args:
            scenario_name: Name of the scenario
            elapsed: Elapsed time in seconds

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            key = f"exercise:{scenario_name}:timer"
            # Format timer as T+MM:SS
            minutes = int(elapsed // 60)
            seconds = int(elapsed % 60)
            formatted = f"T+{minutes:02d}:{seconds:02d}"

            timer_data = {
                "elapsed": elapsed,
                "formatted": formatted,
                "timestamp": time.time()
            }

            self.redis.set(key, json.dumps(timer_data), ex=self.EXERCISE_TTL)
            return True
        except RedisError as e:
            print(f"Error updating timer: {e}")
            return False

    async def get_timer(self, scenario_name: str) -> Dict:
        """
        Get current timer data.

        Args:
            scenario_name: Name of the scenario

        Returns:
            Timer data dict or default values
        """
        if not self.redis:
            return {"elapsed": 0, "formatted": "T+00:00"}

        try:
            key = f"exercise:{scenario_name}:timer"
            data = self.redis.get(key)
            if data:
                return json.loads(data)
            return {"elapsed": 0, "formatted": "T+00:00"}
        except (RedisError, json.JSONDecodeError) as e:
            print(f"Error getting timer: {e}")
            return {"elapsed": 0, "formatted": "T+00:00"}

    async def record_inject_delivery(self, scenario_name: str, team_id: str,
                                    inject_id: str, status: str = "delivered") -> bool:
        """
        Record that an inject was delivered to a team.

        Args:
            scenario_name: Name of the scenario
            team_id: Team identifier
            inject_id: Inject identifier
            status: Delivery status (default: "delivered")

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            # Add to set of delivered injects
            delivered_key = f"exercise:{scenario_name}:team:{team_id}:delivered"
            self.redis.sadd(delivered_key, inject_id)
            self.redis.expire(delivered_key, self.EXERCISE_TTL)

            # Increment delivery count
            count_key = f"exercise:{scenario_name}:team:{team_id}:count"
            new_count = self.redis.incr(count_key)
            self.redis.expire(count_key, self.EXERCISE_TTL)

            # Store delivery timestamp
            timestamp_key = f"exercise:{scenario_name}:inject:{inject_id}:delivered_at"
            self.redis.set(timestamp_key, time.time(), ex=self.EXERCISE_TTL)

            print(f"Recorded inject delivery: {inject_id} -> {team_id} (total: {new_count})")
            return True
        except RedisError as e:
            print(f"Error recording inject delivery: {e}")
            return False

    async def get_team_delivery_count(self, scenario_name: str, team_id: str) -> int:
        """
        Get number of injects delivered to a team.

        Args:
            scenario_name: Name of the scenario
            team_id: Team identifier

        Returns:
            Number of delivered injects
        """
        if not self.redis:
            return 0

        try:
            delivered_key = f"exercise:{scenario_name}:team:{team_id}:delivered"
            return self.redis.scard(delivered_key) or 0
        except RedisError as e:
            print(f"Error getting delivery count: {e}")
            return 0

    async def get_exercise_status(self, scenario_name: str, team_ids: Optional[List[str]] = None) -> Dict:
        """
        Get complete exercise status including timer and team progress.

        Args:
            scenario_name: Name of the scenario
            team_ids: List of team IDs to query (optional, defaults to ['blue', 'red'])

        Returns:
            Complete status dictionary
        """
        status = {
            "state": "NOT_STARTED",
            "timer": {"elapsed": 0, "formatted": "T+00:00"},
            "teams": []
        }

        if not self.redis:
            return status

        # Default to maritime teams if none provided
        if team_ids is None:
            team_ids = ['blue', 'red']

        try:
            # Get exercise state
            state = await self.get_exercise_state(scenario_name)
            if state:
                status["state"] = state

            # Get timer
            status["timer"] = await self.get_timer(scenario_name)

            # Get team statuses for actual teams in scenario
            for team_id in team_ids:
                delivered = await self.get_team_delivery_count(scenario_name, team_id)
                status["teams"].append({
                    "id": team_id,
                    "delivered": delivered,
                    "status": "connected"  # Will be enhanced to track actual MQTT status
                })

            return status
        except Exception as e:
            print(f"Error getting exercise status: {e}")
            return status

    async def cleanup_exercise(self, scenario_name: str) -> bool:
        """
        Clean up all Redis keys for an exercise.

        Args:
            scenario_name: Name of the scenario

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            # Find all keys related to this exercise
            pattern = f"exercise:{scenario_name}:*"
            keys = list(self.redis.scan_iter(pattern))

            if keys:
                deleted = self.redis.delete(*keys)
                print(f"Cleaned up {deleted} Redis keys for exercise {scenario_name}")

            return True
        except RedisError as e:
            print(f"Error cleaning up exercise: {e}")
            return False

    async def set_team_connection_status(self, scenario_name: str, team_id: str,
                                        connected: bool) -> bool:
        """
        Track team dashboard connection status.

        Args:
            scenario_name: Name of the scenario
            team_id: Team identifier
            connected: Connection status

        Returns:
            True if successful, False otherwise
        """
        if not self.redis:
            return False

        try:
            key = f"exercise:{scenario_name}:team:{team_id}:connected"
            self.redis.set(key, "1" if connected else "0", ex=self.EXERCISE_TTL)
            return True
        except RedisError as e:
            print(f"Error setting connection status: {e}")
            return False

    async def get_team_connection_status(self, scenario_name: str, team_id: str) -> bool:
        """
        Get team dashboard connection status.

        Args:
            scenario_name: Name of the scenario
            team_id: Team identifier

        Returns:
            True if connected, False otherwise
        """
        if not self.redis:
            return False

        try:
            key = f"exercise:{scenario_name}:team:{team_id}:connected"
            status = self.redis.get(key)
            return status == "1" if status else False
        except RedisError as e:
            print(f"Error getting connection status: {e}")
            return False