/**
 * Shared path constants for agent installation/uninstallation scripts.
 *
 * This module provides the common directory paths used by postinstall.mjs
 * and preuninstall.mjs to locate agent files.
 */

import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Get the package root directory from a module's import.meta.url
 * @param {string} importMetaUrl - The import.meta.url of the calling module
 * @returns {string} The package root directory path
 */
export function getPackageRoot(importMetaUrl) {
	const __filename = fileURLToPath(importMetaUrl)
	const __dirname = dirname(__filename)
	// Both postinstall.mjs and preuninstall.mjs are in the package root
	return __dirname
}

/**
 * Get the source directory containing agent markdown files.
 * @param {string} packageRoot - The package root directory
 * @returns {string} Path to the agents source directory
 */
export function getAgentsSourceDir(packageRoot) {
	return join(packageRoot, "agents")
}

/**
 * The target directory where agents are installed.
 * Located at ~/.config/opencode/agents/
 */
export const AGENTS_TARGET_DIR = join(homedir(), ".config", "opencode", "agents")
