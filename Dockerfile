FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install system dependencies (FIXED: Added zstd here)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    gnupg \
    openssh-client \
    procps \
    sudo \
    zstd \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and pnpm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

# Install Playwright MCP globally and pre-download Chromium for all users
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers
RUN npm install -g @playwright/mcp playwright \
    && npx playwright install --with-deps chromium \
    && chmod -R a+rX /opt/playwright-browsers

# Create developer user before installing user-scoped tools
RUN useradd -m -s /bin/bash developer \
    && chown -R developer:developer /opt/playwright-browsers

# Install Claude Code as developer so it lands in /home/developer/.local/bin
USER developer
WORKDIR /home/developer/workspace
RUN curl -fsSL https://claude.ai/install.sh | bash

# Ensure Claude Code path is available for developer user
ENV PATH="/home/developer/.local/bin:/home/developer/.claude/bin:$PATH"

ENV ANTHROPIC_AUTH_TOKEN=ollama
ENV ANTHROPIC_API_KEY=
ENV ANTHROPIC_BASE_URL=http://host.docker.internal:11434

# Create workspace directory for runtime clone
RUN mkdir -p /home/developer/workspace

# Switch back to root for copying scripts into system paths
USER root

# Copy scripts
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY claude-entrypoint.sh /usr/local/bin/claude-entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/claude-entrypoint.sh \
    && sed -i 's/\r$//' /usr/local/bin/entrypoint.sh /usr/local/bin/claude-entrypoint.sh

# Run entrypoint at container startup as developer
USER developer
ENTRYPOINT ["/usr/local/bin/claude-entrypoint.sh"]
