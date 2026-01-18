/**
 * OpenCode Plugin: OpenCoder
 *
 * This plugin provides autonomous development agents for continuous codebase improvement.
 *
 * Agents installed:
 * - opencoder: Main orchestrator that runs the continuous Plan-Build-Commit loop
 * - opencoder-planner: Subagent that analyzes codebases and creates development plans
 * - opencoder-builder: Subagent that executes tasks with precision
 *
 * Usage:
 *   opencode @opencoder
 *
 * The agents are installed to ~/.config/opencode/agents/ via the postinstall script.
 */

// Metadata exports (backwards compatibility)
export { agents, description, name, version } from "./metadata"
// Main plugin export (OpenCode plugin API)
export { OpenCoderPlugin, OpenCoderPlugin as default } from "./plugin"
