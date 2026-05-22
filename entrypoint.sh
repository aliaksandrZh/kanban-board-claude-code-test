#!/bin/bash
set -e

REPO_URL="https://github.com/aliaksandrZh/kanban-board-claude-code-test"
BRANCH="${BRANCH:-main}"
TARGET_DIR="/workspace"

# Clone repo into /workspace at container startup
if [ ! -d "$TARGET_DIR/.git" ]; then
    git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"
git fetch origin
git checkout "$BRANCH"

# Start Ollama via independent script
/usr/local/bin/start-ollama.sh

# Keep container alive with interactive bash
exec bash
