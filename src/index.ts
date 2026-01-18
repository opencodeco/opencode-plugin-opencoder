#!/usr/bin/env bun
/**
 * Opencoder - Autonomous development loop powered by OpenCode
 *
 * Entry point for the CLI application.
 */

import { parseArgs } from "./cli.ts"
import { loadConfig } from "./config.ts"
import { runLoop } from "./loop.ts"

async function main(): Promise<void> {
	try {
		// Parse CLI arguments
		const { options, hint } = parseArgs()

		// Load configuration (merges file, env, and CLI)
		const config = await loadConfig(options, hint)

		// Run the main loop
		await runLoop(config)
	} catch (err) {
		if (err instanceof Error) {
			console.error(`Error: ${err.message}`)

			// Show stack trace in verbose mode
			if (process.env.OPENCODER_VERBOSE === "true") {
				console.error(err.stack)
			}
		} else {
			console.error(`Error: ${err}`)
		}

		process.exit(1)
	}
}

// Run main
main()
