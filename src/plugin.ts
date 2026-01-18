/**
 * OpenCoder Plugin - Main plugin function
 *
 * This module exports the plugin function that follows the OpenCode plugin API.
 * The plugin provides autonomous development agents for continuous codebase improvement.
 *
 * Note: Agents are installed via postinstall script since the plugin API
 * does not currently support dynamic agent registration.
 */

import type { Plugin } from "@opencode-ai/plugin"

/**
 * The OpenCoder plugin function.
 *
 * This plugin provides autonomous development agents:
 * - opencoder: Main orchestrator that runs the continuous Plan-Build-Commit loop
 * - opencoder-planner: Subagent that analyzes codebases and creates development plans
 * - opencoder-builder: Subagent that executes tasks with precision
 *
 * Usage:
 *   opencode @opencoder
 *
 * @param ctx - Plugin context provided by OpenCode
 * @returns Hooks object for event subscriptions (minimal for now)
 */
export const OpenCoderPlugin: Plugin = async (_ctx) => {
	// Return minimal hooks object
	// Can be extended with event handlers in the future
	return {}
}
