#!/bin/bash
set -e

REPO_URL="git@github.com:aliaksandrZh/kanban-board-claude-code-test.git"
BRANCH="${BRANCH:-main}"
TARGET_DIR="/home/developer/workspace"

GIT_USER_EMAIL="${GIT_USER_EMAIL:-test-ollama-claude@example.com}"
GIT_USER_NAME="${GIT_USER_NAME:-Your Name}"

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
# /usr/local/bin/start-ollama.sh

# Clone repo into /workspace at container startup
# if [ ! -d "$TARGET_DIR/.git" ]; then
#     git clone "$REPO_URL" "$TARGET_DIR"
# fi

# cd "$TARGET_DIR"
# git fetch origin
# git checkout "$BRANCH"

# # Override with local config
# git config user.email "$GIT_USER_EMAIL"
# git config user.name "$GIT_USER_NAME"

# Ensure Playwright Chromium binary is discoverable and configure MCP
# npx playwright install chromium || true
# CHROMIUM_BIN=$(find /opt/playwright-browsers -name chrome -type f 2>/dev/null | head -1)

# cat > .mcp.json << EOF
# {
#   "mcpServers": {
#     "playwright": {
#       "type": "stdio",
#       "command": "npx",
#       "args": ["-y", "@playwright/mcp@latest", "--headless"],
#       "env": {
#         "PLAYWRIGHT_BROWSERS_PATH": "/opt/playwright-browsers",
#         "PLAYWRIGHT_MCP_EXECUTABLE_PATH": "$CHROMIUM_BIN"
#       }
#     }
#   }
# }
# EOF

# Keep container alive with interactive bash
exec bash
