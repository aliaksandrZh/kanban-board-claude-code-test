#!/bin/bash
set -e

REPO_URL="git@github.com:aliaksandrZh/kanban-board-claude-code-test.git"
BRANCH="${BRANCH:-main}"
TARGET_DIR="/root/workspace"

GIT_USER_EMAIL="${GIT_USER_EMAIL:-test-ollama-claude@example.com}"
GIT_USER_NAME="${GIT_USER_NAME:-Your Name}"

# Set global config
git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

# Set up SSH keys for Git
mkdir -p /root/.ssh
cp /root/.ssh-host/id_ed25519 /root/.ssh/id_ed25519
chmod 600 /root/.ssh/id_ed25519
cp /root/.ssh-host/id_ed25519.pub /root/.ssh/id_ed25519.pub
chmod 644 /root/.ssh/id_ed25519.pub

# Start ssh-agent and add key
eval "$(ssh-agent -s)"
ssh-add /root/.ssh/id_ed25519

# Verify SSH connectivity to GitHub
SSH_OUTPUT=$(ssh -T -o StrictHostKeyChecking=accept-new git@github.com 2>&1) || true
if echo "$SSH_OUTPUT" | grep -q "successfully authenticated"; then
    echo "SSH authentication to GitHub verified"
else
    echo "ERROR: SSH authentication to GitHub failed: $SSH_OUTPUT" >&2
    exit 1
fi

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
