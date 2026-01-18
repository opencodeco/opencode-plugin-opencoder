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

import pkg from "../package.json"

/**
 * The plugin package name.
 * @example "opencode-plugin-opencoder"
 */
export const name = pkg.name

/**
 * The current plugin version following semver.
 * @example "0.1.0"
 */
export const version = pkg.version

/**
 * A brief description of the plugin's purpose.
 */
export const description = pkg.description

/**
 * List of agent identifiers installed by this plugin.
 * These agents are copied to ~/.config/opencode/agents/ on install.
 *
 * - `opencoder`: Main orchestrator running the Plan-Build-Commit loop
 * - `opencoder-planner`: Analyzes codebases and creates development plans
 * - `opencoder-builder`: Executes individual tasks with precision
 */
export const agents = ["opencoder", "opencoder-planner", "opencoder-builder"]
