#!/usr/bin/env node

/**
 * Preuninstall script for opencode-plugin-opencoder
 *
 * Removes agent markdown files from ~/.config/opencode/agents/
 * This cleans up the agents when the plugin is uninstalled.
 */

import { existsSync, readdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"

import {
	AGENTS_TARGET_DIR,
	getAgentsSourceDir,
	getErrorMessage,
	getPackageRoot,
} from "./src/paths.mjs"

const packageRoot = getPackageRoot(import.meta.url)
const AGENTS_SOURCE_DIR = getAgentsSourceDir(packageRoot)

/** Check for --dry-run flag in command line arguments */
const DRY_RUN = process.argv.includes("--dry-run")

/**
 * Main entry point for the preuninstall script.
 *
 * Removes agent markdown files that were installed by this package
 * from the OpenCode configuration directory (~/.config/opencode/agents/).
 * Only removes files that match agents in the package's agents/ directory.
 *
 * The function handles missing directories and files gracefully,
 * continuing to remove remaining agents even if some fail.
 *
 * @returns {void}
 *
 * @throws {never} Does not throw - handles all errors internally
 *
 * Exit codes:
 * - 0: Always exits successfully, even if no agents were removed or
 *      some removals failed. This ensures npm uninstall completes.
 */
function main() {
	const prefix = DRY_RUN ? "[DRY-RUN] " : ""
	console.log(`${prefix}opencode-plugin-opencoder: Removing agents...`)

	// Check if target directory exists
	if (!existsSync(AGENTS_TARGET_DIR)) {
		console.log(`${prefix}  No agents directory found, nothing to remove`)
		return
	}

	// Get list of agents we installed (from source directory)
	if (!existsSync(AGENTS_SOURCE_DIR)) {
		console.log(`${prefix}  Source agents directory not found, skipping cleanup`)
		return
	}

	const agentFiles = readdirSync(AGENTS_SOURCE_DIR).filter((f) => f.endsWith(".md"))

	if (agentFiles.length === 0) {
		console.log(`${prefix}  No agent files to remove`)
		return
	}

	let removedCount = 0

	for (const file of agentFiles) {
		const targetPath = join(AGENTS_TARGET_DIR, file)

		if (existsSync(targetPath)) {
			try {
				if (DRY_RUN) {
					console.log(`${prefix}Would remove: ${targetPath}`)
					removedCount++
				} else {
					unlinkSync(targetPath)
					console.log(`  Removed: ${file}`)
					removedCount++
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err))
				const message = getErrorMessage(error, file, targetPath)
				console.error(`${prefix}  Warning: Could not remove ${file}: ${message}`)
			}
		}
	}

	if (removedCount > 0) {
		console.log(`\n${prefix}opencode-plugin-opencoder: Removed ${removedCount} agent(s)`)
	} else {
		console.log(`\n${prefix}opencode-plugin-opencoder: No agents were installed, nothing removed`)
	}
}

main()
