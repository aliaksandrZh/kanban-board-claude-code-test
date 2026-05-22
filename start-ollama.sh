#!/bin/bash
set -e

# Start Ollama daemon in background
ollama serve > /tmp/ollama.log 2>&1 &

# Wait for Ollama to be ready
for i in {1..30}; do
    if curl -s http://localhost:11434/ > /dev/null 2>&1; then
        echo "Ollama is ready"
        exit 0
    fi
    sleep 1
done

echo "ERROR: Ollama failed to start within 30 seconds" >&2
cat /tmp/ollama.log >&2
exit 1
