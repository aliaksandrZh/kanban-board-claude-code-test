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

# Create developer user before installing user-scoped tools
RUN useradd -m -s /bin/bash developer

# Install Ollama (system-wide daemon)
RUN curl -fsSL https://ollama.com/install.sh | sh

# Ensure Ollama data directory is writable by developer
RUN mkdir -p /home/developer/.ollama && chown -R developer:developer /home/developer/.ollama

# Install Claude Code as developer so it lands in /home/developer/.local/bin
USER developer
WORKDIR /home/developer/workspace
RUN curl -fsSL https://claude.ai/install.sh | bash

# Ensure Claude Code path is available for developer user
ENV PATH="/home/developer/.local/bin:/home/developer/.claude/bin:$PATH"

ENV ANTHROPIC_AUTH_TOKEN=ollama
ENV ANTHROPIC_API_KEY=
ENV ANTHROPIC_BASE_URL=http://localhost:11434

# Create workspace directory for runtime clone
RUN mkdir -p /home/developer/workspace

# Switch back to root for copying scripts into system paths
USER root

# Copy scripts
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY claude-entrypoint.sh /usr/local/bin/claude-entrypoint.sh
COPY start-ollama.sh /usr/local/bin/start-ollama.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/claude-entrypoint.sh /usr/local/bin/start-ollama.sh \
    && sed -i 's/\r$//' /usr/local/bin/entrypoint.sh /usr/local/bin/claude-entrypoint.sh /usr/local/bin/start-ollama.sh

# Run entrypoint at container startup as developer
USER developer
ENTRYPOINT ["/usr/local/bin/claude-entrypoint.sh"]
