#!/bin/bash

echo "=== SCIP v3 System Verification ==="
echo ""

# Check services
echo "1. Checking services status..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep scip
echo ""

# Check exercise status
echo "2. Checking exercise status..."
STATUS=$(curl -s http://localhost:8001/api/v1/exercises/current)
if echo "$STATUS" | jq -e '.active' | grep -q true; then
    SCENARIO=$(echo "$STATUS" | jq -r '.scenario_name')
    STATE=$(echo "$STATUS" | jq -r '.state')
    TIMER=$(echo "$STATUS" | jq -r '.timer.formatted')
    echo "✓ Exercise Active: $SCENARIO"
    echo "  State: $STATE"
    echo "  Timer: $TIMER"
    echo ""

    # Check team status
    echo "3. Team Status:"
    echo "$STATUS" | jq -r '.teams[] | "  \(.id): Delivered \(.delivered)/\(.total) injects (status: \(.status))"'
else
    echo "✗ No active exercise"
fi
echo ""

# Check MQTT connections
echo "4. MQTT WebSocket Connections:"
docker logs scip-mqtt 2>&1 | grep "New client connected" | tail -5 | while read line; do
    CLIENT=$(echo "$line" | grep -oE "mqttjs_[a-z0-9]+")
    echo "  ✓ $CLIENT connected"
done
echo ""

# Check recent messages
echo "5. Recent MQTT Activity:"
echo "  Timer updates:"
docker logs scip-mqtt 2>&1 | grep "timer.*bytes" | tail -1 | grep -oE "[0-9]+ bytes" | while read bytes; do
    echo "    ✓ Broadcasting timer ($bytes)"
done

echo "  Inject deliveries:"
docker logs scip-mqtt 2>&1 | grep "feed.*bytes" | tail -2 | while read line; do
    TEAM=$(echo "$line" | grep -oE "team/[^/]+/feed" | cut -d'/' -f2)
    BYTES=$(echo "$line" | grep -oE "[0-9]+ bytes")
    echo "    ✓ Delivered to $TEAM ($BYTES)"
done
echo ""

echo "6. Dashboard URLs:"
curl -s http://localhost:8001/api/v1/exercises/current 2>/dev/null | jq -e '.active' > /dev/null && \
    curl -s http://localhost:8001/api/v1/exercises/current | jq -r '.teams[] | "  \(.id): http://localhost:\(.port)"'

echo ""
echo "=== Verification Complete ==="