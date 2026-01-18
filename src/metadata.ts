/**
 * Plugin metadata exports for opencode-plugin-opencoder
 *
 * These exports provide information about the plugin for introspection
 * and backwards compatibility with code that imports metadata directly.
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
