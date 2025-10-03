#!/usr/bin/env python3
"""Quick test of Redis Manager functionality"""

import asyncio
import sys
sys.path.insert(0, 'orchestration/app')

from redis_manager import RedisManager

async def test():
    rm = RedisManager(host='localhost')
    print(f'Connected: {rm.is_connected()}')

    # Test exercise state
    await rm.set_exercise_state('test-scenario', 'RUNNING')
    state = await rm.get_exercise_state('test-scenario')
    print(f'State: {state}')

    # Test timer
    await rm.update_timer('test-scenario', 65)
    timer = await rm.get_timer('test-scenario')
    print(f'Timer: {timer}')

    # Test inject delivery
    await rm.record_inject_delivery('test-scenario', 'blue', 'inject-001')
    count = await rm.get_team_delivery_count('test-scenario', 'blue')
    print(f'Blue team deliveries: {count}')

    # Test full status
    status = await rm.get_exercise_status('test-scenario')
    print(f'Full status: {status}')

    # Cleanup
    await rm.cleanup_exercise('test-scenario')
    print('Cleanup complete')

if __name__ == '__main__':
    asyncio.run(test())