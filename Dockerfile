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

# Install Ollama (This will now succeed with zstd present!)
RUN curl -fsSL https://ollama.com/install.sh | sh

# Install Claude Code using the native installation script
RUN curl -fsSL https://claude.ai/install.sh | bash

# Ensure Claude Code path is available system-wide for all users
ENV PATH="/root/.local/bin:/root/.claude/bin:/home/developer/.local/bin:$PATH"
ENV PATH="$HOME/.local/bin:$PATH"

ENV ANTHROPIC_AUTH_TOKEN=ollama
ENV ANTHROPIC_API_KEY=
ENV ANTHROPIC_BASE_URL=http://localhost:11434

# Create workspace directory for runtime clone
RUN mkdir -p /root/workspace

# Copy scripts
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY start-ollama.sh /usr/local/bin/start-ollama.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/start-ollama.sh \
    && sed -i 's/\r$//' /usr/local/bin/entrypoint.sh /usr/local/bin/start-ollama.sh

# Run entrypoint at container startup
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
