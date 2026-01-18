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

/**
 * Returns a user-friendly error message based on the error code.
 *
 * Translates Node.js filesystem error codes into human-readable messages
 * that help users understand and resolve installation issues.
 *
 * @param {Error & {code?: string}} error - The error object from a failed fs operation
 * @param {string} file - The filename being processed
 * @param {string} targetPath - The target path for the file
 * @returns {string} A helpful error message describing the issue and potential solution
 *
 * @example
 * // Permission denied error
 * const err = Object.assign(new Error(), { code: 'EACCES' })
 * getErrorMessage(err, 'agent.md', '/home/user/.config/opencode/agents/agent.md')
 * // Returns: "Permission denied. Check write permissions for /home/user/.config/opencode/agents"
 *
 * @example
 * // File not found error
 * const err = Object.assign(new Error(), { code: 'ENOENT' })
 * getErrorMessage(err, 'missing.md', '/target/missing.md')
 * // Returns: "Source file not found: missing.md"
 */
export function getErrorMessage(error, file, targetPath) {
	const code = error.code
	switch (code) {
		case "EACCES":
			return `Permission denied. Check write permissions for ${dirname(targetPath)}`
		case "ENOSPC":
			return "Disk full. Free up space and try again"
		case "ENOENT":
			return `Source file not found: ${file}`
		case "EROFS":
			return "Read-only file system. Cannot write to target directory"
		case "EMFILE":
		case "ENFILE":
			return "Too many open files. Close some applications and try again"
		case "EEXIST":
			return `Target already exists: ${targetPath}`
		case "EISDIR":
			return `Expected a file but found a directory: ${targetPath}`
		default:
			return error.message || "Unknown error"
	}
}
