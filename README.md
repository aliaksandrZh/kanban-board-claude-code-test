# AI Benchmark Environment

Development workspace for testing and benchmarking AI-assisted coding workflows using Docker containers and Claude Code.

## Overview

This repository serves as a controlled environment for evaluating and iterating on AI-driven development patterns. It pairs containerized runtimes with local LLM infrastructure (Ollama) and Claude Code for hands-free, reproducible builds.

## Branch Strategy

This repository uses a multi-branch strategy to separate the container environment from the project source.

| Branch | Purpose |
|--------|---------|
| `main` | **Project source.** Contains the target application (PRD, source code, tests). |
| `docker-setup` | **Container definition.** Dockerfile, docker-compose, entrypoint scripts, and Ollama configuration. |


### Workflow

1. Clone the repository.
2. Switch to the `docker-setup` branch to build the container.
3. The container builds with Ubuntu 24.04, Node.js 22, pnpm, Ollama, and Claude Code pre-installed.
4. At startup, the container clones this repository into `/home/developer/workspace` and checks out the `main` branch (or `BRANCH` env override).
5. Work inside the container on the project source; Ollama and Claude Code are already available.

## Structure

```text
.
├── docs/
│   └── prd.md              # Product requirements under test
├── keys/
│   ├── git/                # SSH keys for Git operations
│   └── ollama/             # SSH keys for Ollama host
├── logs/                   # Runtime logs and unresolved blockers
├── .env                    # Ollama API credentials
├── prompt.md               # Active prompt context
└── README.md               # This file
```

> Note: Dockerfile and compose files live on the `docker-setup` branch, not `main`.

## Prerequisites

- Docker Engine
- Docker Compose

> Everything else (Claude Code, Ollama, Node.js, pnpm) is bundled inside the container.

## Setup

1. Clone the repository and switch to the `docker-setup` branch:
   ```bash
   git clone git@github.com:aliaksandrZh/kanban-board-claude-code-test.git
   cd kanban-board-claude-code-test
   git checkout docker-setup
   ```

2. Ensure `.env` is populated with valid credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your OLLAMA_API_KEY
   ```

3. Place required SSH keys under `keys/git/` and `keys/ollama/`.

4. Build and start the container:
   ```bash
   docker compose up --build -d
   ```

5. Attach to the running container:
   ```bash
   docker compose exec ai-dev-env bash
   ```

## Usage

Inside the container:

- The project source is mounted at `/home/developer/workspace` (cloned from `main` by default).
- Claude Code is available at `claude`.
- Ollama runs locally on port 11434.
- Use `docs/prd.md` as the target specification for benchmark runs.

Override the checked-out branch at container startup:
```bash
BRANCH=feature-x docker compose up --build -d
```

## Logs

Unresolved blockers or issues during benchmark runs are saved to `/logs`.

## Security Notes

- `.env` and `keys/` are excluded from version control.
- Rotate API keys and SSH credentials regularly.
