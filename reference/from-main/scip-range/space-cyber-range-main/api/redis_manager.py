import json
import time
from typing import Dict, List, Optional, Any

class RedisManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.SCENARIO_TTL = 86400  # 24 hours for active scenario data

    # Active Scenario Management
    async def set_active_scenario(self, scenario_id: str, scenario_data: Dict) -> bool:
        """Activate a scenario"""
        try:
            # Store base scenario data
            base_key = f"active_scenario:{scenario_id}:base"
            status_key = f"active_scenario:{scenario_id}:status"
            instances_key = f"active_scenario:{scenario_id}:instances"

            # Set initial state
            pipeline = self.redis.pipeline()
            pipeline.set(base_key, json.dumps(scenario_data), ex=self.SCENARIO_TTL)
            pipeline.set(status_key, json.dumps({
                "active": True,
                "status": "Initializing",
                "start_time": time.time(),
                "instance_count": 0
            }), ex=self.SCENARIO_TTL)
            pipeline.delete(instances_key)  # Clear any old instances
            pipeline.execute()

            return True
        except Exception as e:
            print(f"Error setting active scenario: {e}")
            return False

    async def get_active_scenario(self) -> Optional[Dict]:
        """Get current active scenario details"""
        try:
            # Scan for any active scenario
            for key in self.redis.scan_iter("active_scenario:*:status"):
                scenario_id = key.split(":")[1]
                status = json.loads(self.redis.get(key) or "{}")
                
                if status.get("active"):
                    base_data = json.loads(self.redis.get(f"active_scenario:{scenario_id}:base") or "{}")
                    instances = self.redis.smembers(f"active_scenario:{scenario_id}:instances") or set()
                    
                    return {
                        "scenario_id": scenario_id,
                        "base_data": base_data,
                        "status": status,
                        "instance_count": len(instances)
                    }
            return None
        except Exception as e:
            print(f"Error getting active scenario: {e}")
            return None

    async def update_scenario_status(self, scenario_id: str, status_update: Dict) -> bool:
        """Update status for the active scenario"""
        try:
            status_key = f"active_scenario:{scenario_id}:status"
            current_status = json.loads(self.redis.get(status_key) or "{}")
            
            # Update status while preserving other fields
            updated_status = {
                **current_status,
                **status_update,
                "last_updated": time.time()
            }
            
            self.redis.set(status_key, json.dumps(updated_status), ex=self.SCENARIO_TTL)
            return True
        except Exception as e:
            print(f"Error updating scenario status: {e}")
            return False

    async def deactivate_scenario(self, scenario_id: str) -> bool:
        """Deactivate a scenario"""
        try:
            status_key = f"active_scenario:{scenario_id}:status"
            current_status = json.loads(self.redis.get(status_key) or "{}")
            
            # Update status to inactive
            current_status.update({
                "active": False,
                "status": "Deactivated",
                "end_time": time.time(),
                "last_updated": time.time()
            })
            
            self.redis.set(status_key, json.dumps(current_status), ex=self.SCENARIO_TTL)
            return True
        except Exception as e:
            print(f"Error deactivating scenario: {e}")
            return False

    # Instance Management
    async def register_instance(self, scenario_id: str, instance_id: str, instance_data: Dict) -> bool:
        """Register a new instance for an active scenario"""
        try:
            instance_key = f"active_scenario:{scenario_id}:instance:{instance_id}"
            instances_key = f"active_scenario:{scenario_id}:instances"

            pipeline = self.redis.pipeline()
            pipeline.set(instance_key, json.dumps({
                **instance_data,
                "start_time": time.time(),
                "status": "initializing",
                "last_updated": time.time()
            }), ex=self.SCENARIO_TTL)
            pipeline.sadd(instances_key, instance_id)
            pipeline.execute()

            # Update instance count in scenario status
            await self._update_instance_count(scenario_id)
            return True
        except Exception as e:
            print(f"Error registering instance: {e}")
            return False

    async def update_instance_status(self, scenario_id: str, instance_id: str, 
                                   status_update: Dict) -> bool:
        """Update status for a specific instance"""
        try:
            instance_key = f"active_scenario:{scenario_id}:instance:{instance_id}"
            current_data = json.loads(self.redis.get(instance_key) or "{}")
            
            # Update with new status while preserving other data
            updated_data = {
                **current_data,
                **status_update,
                "last_updated": time.time()
            }
            self.redis.set(instance_key, json.dumps(updated_data), ex=self.SCENARIO_TTL)
            
            return True
        except Exception as e:
            print(f"Error updating instance status: {e}")
            return False

    async def get_instance_status(self, scenario_id: str, instance_id: str) -> Optional[Dict]:
        """Get status for a specific instance"""
        try:
            instance_key = f"active_scenario:{scenario_id}:instance:{instance_id}"
            data = self.redis.get(instance_key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Error getting instance status: {e}")
            return None

    async def get_all_instances(self, scenario_id: str) -> List[Dict]:
        """Get all instances for an active scenario"""
        try:
            instances_key = f"active_scenario:{scenario_id}:instances"
            instance_ids = self.redis.smembers(instances_key)
            
            instances = []
            for instance_id in instance_ids:
                status = await self.get_instance_status(scenario_id, instance_id)
                if status:
                    instances.append({
                        "instance_id": instance_id,
                        **status
                    })
            
            return instances
        except Exception as e:
            print(f"Error getting all instances: {e}")
            return []

    # Progress Tracking
    async def update_progress(self, scenario_id: str, instance_id: str, 
                            stage_id: str, progress_data: Dict) -> bool:
        """Update progress for a specific stage in an instance"""
        try:
            progress_key = f"active_scenario:{scenario_id}:instance:{instance_id}:progress"
            current_progress = json.loads(self.redis.get(progress_key) or "{}")
            
            # Update specific stage progress
            current_progress[stage_id] = {
                **progress_data,
                "last_updated": time.time()
            }
            
            self.redis.set(progress_key, json.dumps(current_progress), ex=self.SCENARIO_TTL)
            return True
        except Exception as e:
            print(f"Error updating progress: {e}")
            return False

    async def get_progress(self, scenario_id: str, instance_id: str) -> Dict:
        """Get progress for all stages in an instance"""
        try:
            progress_key = f"active_scenario:{scenario_id}:instance:{instance_id}:progress"
            data = self.redis.get(progress_key)
            return json.loads(data) if data else {}
        except Exception as e:
            print(f"Error getting progress: {e}")
            return {}

    # Helper Methods
    async def _update_instance_count(self, scenario_id: str) -> bool:
        """Update the instance count in scenario status"""
        try:
            instances_key = f"active_scenario:{scenario_id}:instances"
            status_key = f"active_scenario:{scenario_id}:status"
            
            instance_count = len(self.redis.smembers(instances_key))
            current_status = json.loads(self.redis.get(status_key) or "{}")
            
            current_status["instance_count"] = instance_count
            self.redis.set(status_key, json.dumps(current_status), ex=self.SCENARIO_TTL)
            return True
        except Exception as e:
            print(f"Error updating instance count: {e}")
            return False
