#!/bin/bash
set -e

# Start Ollama daemon in background
ollama serve > /var/log/ollama.log 2>&1 &
sleep 3
