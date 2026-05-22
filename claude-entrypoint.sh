#!/bin/bash
set -e

# Validate required env vars before any expensive setup
if [ -z "${OLLAMA_MODEL:-}" ]; then
    echo "ERROR: OLLAMA_MODEL environment variable is not set" >&2
    exit 1
fi

if [ -z "${PROMPT:-}" ]; then
    echo "ERROR: PROMPT environment variable is not set" >&2
    exit 1
fi

REPO_URL="git@github.com:aliaksandrZh/kanban-board-claude-code-test.git"
BRANCH="${BRANCH:-main}"
TARGET_DIR="/home/developer/workspace"

GIT_USER_EMAIL="${GIT_USER_EMAIL:-test-ollama-claude@example.com}"
GIT_USER_NAME="${GIT_USER_NAME:-Your Name}"

OLLAMA_MODEL="${OLLAMA_MODEL}"
PROMPT="${PROMPT}"

# Set global config
git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

# Set up SSH keys for Git
mkdir -p /home/developer/.ssh
cp /home/developer/.ssh-host/id_ed25519 /home/developer/.ssh/id_ed25519
chmod 600 /home/developer/.ssh/id_ed25519
cp /home/developer/.ssh-host/id_ed25519.pub /home/developer/.ssh/id_ed25519.pub
chmod 644 /home/developer/.ssh/id_ed25519.pub

# Start ssh-agent and add key
eval "$(ssh-agent -s)"
ssh-add /home/developer/.ssh/id_ed25519

# Verify SSH connectivity to GitHub
SSH_OUTPUT=$(ssh -T -o StrictHostKeyChecking=accept-new git@github.com 2>&1) || true
if echo "$SSH_OUTPUT" | grep -q "successfully authenticated"; then
    echo "SSH authentication to GitHub verified"
else
    echo "ERROR: SSH authentication to GitHub failed: $SSH_OUTPUT" >&2
    exit 1
fi

# Start Ollama via independent script
/usr/local/bin/start-ollama.sh

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

# Run Claude Code with the specified model and prompt
echo "========================================"
echo "CLAUDE CODE STARTING"
echo "Model: $OLLAMA_MODEL"
echo "Prompt length: ${#PROMPT} characters"
echo "========================================"

EXIT_CODE=0
claude --model "$OLLAMA_MODEL" -p "$PROMPT" --dangerously-skip-permissions --output-format stream-json --verbose --include-partial-messages || EXIT_CODE=$?

echo "Claude Code exited with code $EXIT_CODE"

# Commit and push regardless of success or failure
cd "$TARGET_DIR"
git add -A || true
git commit -m "ai-dev-env: checkpoint after Claude exit" || true
git push origin "$BRANCH" || true

if [ $EXIT_CODE -ne 0 ]; then
    echo "ERROR: Claude Code exited with code $EXIT_CODE" >&2
fi

exit $EXIT_CODE
