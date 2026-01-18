/**
 * Shared path constants for agent installation/uninstallation scripts.
 *
 * This module provides the common directory paths used by postinstall.mjs
 * and preuninstall.mjs to locate agent files.
 */

import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Minimum character count for valid agent files */
export const MIN_CONTENT_LENGTH = 100

/** Keywords that should appear in valid agent files (case-insensitive) */
export const REQUIRED_KEYWORDS = ["agent", "task"]

/** Required fields in YAML frontmatter */
export const REQUIRED_FRONTMATTER_FIELDS = ["version", "requires"]

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
		case "EPERM":
			return "Operation not permitted. The file may be in use or locked"
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

/**
 * Parses YAML frontmatter from markdown content.
 *
 * Expects frontmatter to be delimited by --- at the start of the file.
 *
 * @param {string} content - The file content to parse
 * @returns {{ found: boolean, fields: Record<string, string>, endIndex: number }} Parse result
 */
export function parseFrontmatter(content) {
	// Frontmatter must start at the beginning of the file
	if (!content.startsWith("---")) {
		return { found: false, fields: {}, endIndex: 0 }
	}

	// Find the closing ---
	const endMatch = content.indexOf("\n---", 3)
	if (endMatch === -1) {
		return { found: false, fields: {}, endIndex: 0 }
	}

	// Extract frontmatter content (between the --- delimiters)
	const frontmatterContent = content.slice(4, endMatch)
	const fields = {}

	// Parse simple key: value pairs
	for (const line of frontmatterContent.split("\n")) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith("#")) continue

		const colonIndex = trimmed.indexOf(":")
		if (colonIndex === -1) continue

		const key = trimmed.slice(0, colonIndex).trim()
		let value = trimmed.slice(colonIndex + 1).trim()

		// Remove surrounding quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}

		fields[key] = value
	}

	// endIndex points to the character after the closing ---\n
	const endIndex = endMatch + 4

	return { found: true, fields, endIndex }
}

/**
 * Validates that agent content has a valid structure.
 *
 * Checks that the content:
 * 1. Has YAML frontmatter with required fields (version, requires)
 * 2. Starts with a markdown header (# ) after frontmatter
 * 3. Contains at least MIN_CONTENT_LENGTH characters
 * 4. Contains at least one of the expected keywords
 *
 * @param {string} content - The agent file content to validate
 * @returns {{ valid: boolean, error?: string }} Validation result with optional error message
 */
export function validateAgentContent(content) {
	// Check minimum length
	if (content.length < MIN_CONTENT_LENGTH) {
		return {
			valid: false,
			error: `File too short: ${content.length} characters (minimum ${MIN_CONTENT_LENGTH})`,
		}
	}

	// Check for YAML frontmatter
	const frontmatter = parseFrontmatter(content)
	if (!frontmatter.found) {
		return {
			valid: false,
			error: "File missing YAML frontmatter (must start with ---)",
		}
	}

	// Check for required frontmatter fields
	const missingFields = REQUIRED_FRONTMATTER_FIELDS.filter((field) => !frontmatter.fields[field])
	if (missingFields.length > 0) {
		return {
			valid: false,
			error: `Frontmatter missing required fields: ${missingFields.join(", ")}`,
		}
	}

	// Get content after frontmatter
	const contentAfterFrontmatter = content.slice(frontmatter.endIndex).trimStart()

	// Check for markdown header after frontmatter
	if (!contentAfterFrontmatter.startsWith("# ")) {
		return {
			valid: false,
			error: "File does not have a markdown header (# ) after frontmatter",
		}
	}

	// Check for required keywords (case-insensitive)
	const lowerContent = content.toLowerCase()
	const hasKeyword = REQUIRED_KEYWORDS.some((keyword) => lowerContent.includes(keyword))
	if (!hasKeyword) {
		return {
			valid: false,
			error: `File missing required keywords: ${REQUIRED_KEYWORDS.join(", ")}`,
		}
	}

	return { valid: true }
}
