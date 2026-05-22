#!/bin/bash
set -e

REPO_URL="https://github.com/aliaksandrZh/kanban-board-claude-code-test"
BRANCH="${BRANCH:-main}"
TARGET_DIR="/root/workspace"

GIT_USER_EMAIL="${GIT_USER_EMAIL:-test-ollama-claude@example.com}"
GIT_USER_NAME="${GIT_USER_NAME:-Your Name}"

# Set global config
git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

# Clone repo into /workspace at container startup
if [ ! -d "$TARGET_DIR/.git" ]; then
    git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"
git fetch origin
git checkout "$BRANCH"

# Override with local config
git config user.email "$GIT_USER_EMAIL"
git config user.name "$GIT_USER_NAME"

# Start Ollama via independent script
/usr/local/bin/start-ollama.sh

# Keep container alive with interactive bash
exec bash
