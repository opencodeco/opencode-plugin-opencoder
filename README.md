# opencode-plugin-opencoder

OpenCode plugin providing autonomous development agents for continuous codebase improvement.

## Overview

This plugin follows the [OpenCode plugin API](https://opencode.ai/docs/plugins/) and installs three agents that work together to create an infinite autonomous development loop:

| Agent | Purpose |
|-------|---------|
| `opencoder` | Main orchestrator - runs the continuous Plan-Build-Commit loop |
| `opencoder-planner` | Creates development plans with 3-7 prioritized tasks |
| `opencoder-builder` | Executes tasks with precision, runs tests, and verifies changes |

## Installation

Add the plugin to your `opencode.json` config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plugin-opencoder"]
}
```

Or install manually:

```bash
bun add opencode-plugin-opencoder
```

On install, the agents are automatically copied to `~/.config/opencode/agents/`.

## Usage

Start the autonomous development loop:

```bash
opencode @opencoder
```

The agent will:
1. Analyze your codebase and create a plan with 3-7 tasks
2. Execute each task, writing code and running tests
3. Commit changes after each task with conventional commit messages
4. Push all commits after the plan is complete
5. Repeat forever

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    INFINITE LOOP                            │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   PLANNER    │───>│   BUILDER    │───>│    COMMIT    │  │
│  │  (3-7 tasks) │    │  (per task)  │    │   & PUSH     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ^                                       │           │
│         └───────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Planner Agent

The planner analyzes your codebase and creates a prioritized list of tasks:

1. **Critical bugs** - Errors, crashes, security issues
2. **Missing tests** - Untested code paths
3. **Code quality** - Linting errors, type issues
4. **Documentation gaps** - Missing or outdated docs
5. **Performance issues** - Slow operations
6. **Feature gaps** - TODO comments, incomplete implementations
7. **Refactoring** - Duplicated code, complex functions

### Builder Agent

The builder executes each task:

1. Understands the task requirements
2. Makes code changes following project style
3. Runs tests and linter
4. Reports completion with a summary

### Orchestrator

The main orchestrator:

1. Invokes the planner to create a plan
2. For each task, invokes the builder
3. Commits changes after each task (conventional commits)
4. Pushes all commits after the plan completes
5. Starts the next cycle immediately

## Models

The agents use free models by default:

| Agent | Model |
|-------|-------|
| `opencoder` | `opencode/glm-4.7-free` |
| `opencoder-planner` | `opencode/glm-4.7-free` |
| `opencoder-builder` | `opencode/minimax-m2.1-free` |

You can customize models by editing the agent files in `~/.config/opencode/agents/`.

## Git Integration

The agents automatically:

- **Commit after each task** with conventional commit messages (`fix:`, `feat:`, `test:`, etc.)
- **Sign commits** with `--signoff` for DCO compliance
- **Push after each cycle** to keep your remote up to date

## Manual Installation

If the postinstall script doesn't run automatically:

```bash
node node_modules/opencode-plugin-opencoder/postinstall.mjs
```

Or copy the agents manually:

```bash
cp node_modules/opencode-plugin-opencoder/agents/*.md ~/.config/opencode/agents/
```

## Plugin API

This plugin exports:

```typescript
// Main plugin function (OpenCode plugin API)
import { OpenCoderPlugin } from "opencode-plugin-opencoder"
// or
import OpenCoderPlugin from "opencode-plugin-opencoder"

// Metadata exports (for introspection)
import { name, version, description, agents } from "opencode-plugin-opencoder"
```

The plugin currently provides a minimal hooks structure that can be extended in the future. Agent registration is handled via the postinstall script since the OpenCode plugin API does not yet support dynamic agent registration.

## Debugging

Enable debug logging to see plugin activity:

```bash
OPENCODER_DEBUG=1 opencode @opencoder
```

When enabled, the plugin logs:

| Event | Information Logged |
|-------|-------------------|
| `event` | Event type, property keys |
| `tool.execute.before` | Tool name, session ID, call ID, argument keys |
| `tool.execute.after` | Tool name, session ID, call ID, title, output length |

Log output format:

```
[2025-01-18T12:00:00.000Z] [opencoder] Event received {
  "directory": "/path/to/project",
  "type": "session.created",
  "properties": ["sessionID", "model"]
}
```

## Troubleshooting

If you encounter errors during installation, here are common error codes and their solutions:

| Error Code | Message | Solution |
|------------|---------|----------|
| `EACCES` | Permission denied | Check write permissions for `~/.config/opencode/agents/`. Run `chmod -R u+w ~/.config/opencode/` or use `sudo` if needed. |
| `EPERM` | Operation not permitted | The file may be locked or in use. Close any editors or applications using the agent files and try again. |
| `ENOSPC` | Disk full | Free up disk space and retry the installation. |
| `EROFS` | Read-only file system | The target directory is on a read-only filesystem. Remount with write permissions or choose a different config location. |
| `EAGAIN` | Resource temporarily unavailable | A transient error. The installer retries automatically, but if it persists, wait a moment and try again. |
| `EBUSY` | File is busy or locked | Another process is using the file. Close any applications that might have the agent files open. |
| `ENOENT` | Source file not found | The agent source files are missing from the package. Try reinstalling with `bun add opencode-plugin-opencoder`. |
| `EEXIST` | Target already exists | An agent file already exists. The installer should handle this, but you can manually remove files in `~/.config/opencode/agents/` if needed. |
| `EMFILE` / `ENFILE` | Too many open files | System file descriptor limit reached. Close some applications or increase your system's `ulimit`. |
| `EISDIR` | Expected file but found directory | A directory exists where an agent file should be. Remove the conflicting directory from `~/.config/opencode/agents/`. |

### Manual Recovery

If automatic installation fails, you can manually copy the agents:

```bash
# Create the agents directory
mkdir -p ~/.config/opencode/agents

# Copy agents from the installed package
cp node_modules/opencode-plugin-opencoder/agents/*.md ~/.config/opencode/agents/
```

### Verifying Installation

Check that agents were installed correctly:

```bash
ls -la ~/.config/opencode/agents/
# Should show: opencoder.md, opencoder-planner.md, opencoder-builder.md
```

## Development

```bash
# Install dependencies
bun install

# Run type checker
bun run typecheck

# Run tests
bun test

# Run linter
bun run lint

# Fix lint issues
bun run lint:fix
```

## License

MIT License - See [LICENSE](LICENSE) file.

## Links

- [OpenCode](https://opencode.ai)
- [OpenCode Plugins Documentation](https://opencode.ai/docs/plugins/)
