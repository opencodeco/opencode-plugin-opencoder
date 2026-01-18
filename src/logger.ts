/**
 * Logging infrastructure with console and file output
 */

import { appendFileSync, existsSync, readdirSync, renameSync, statSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import type { Paths } from "./types.ts"

/** ANSI escape codes for terminal formatting */
const ANSI = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
	clearLine: "\r\x1b[K",
}

export class Logger {
	private paths: Paths
	private verbose: boolean
	private cycleLogFile?: string
	private logBuffer: string[] = []
	private readonly BUFFER_SIZE = 2048

	constructor(paths: Paths, verbose: boolean) {
		this.paths = paths
		this.verbose = verbose
	}

	/**
	 * Set the cycle-specific log file
	 */
	setCycleLog(cycle: number): void {
		const filename = `cycle_${String(cycle).padStart(3, "0")}.log`
		this.cycleLogFile = join(this.paths.cycleLogDir, filename)
	}

	/**
	 * Log to file only (silent)
	 */
	log(message: string): void {
		this.writeToBuffer(this.formatForFile(message))
	}

	/**
	 * Log to console and file
	 */
	say(message: string): void {
		console.log(message)
		this.writeToBuffer(this.formatForFile(message))
	}

	/**
	 * Log with color formatting to console and file
	 */
	info(message: string): void {
		console.log(`${ANSI.blue}${message}${ANSI.reset}`)
		this.writeToBuffer(this.formatForFile(message))
	}

	/**
	 * Log success message
	 */
	success(message: string): void {
		console.log(`${ANSI.green}${message}${ANSI.reset}`)
		this.writeToBuffer(this.formatForFile(message))
	}

	/**
	 * Log warning message
	 */
	warn(message: string): void {
		console.log(`${ANSI.yellow}[WARN] ${message}${ANSI.reset}`)
		this.writeToBuffer(this.formatForFile(`[WARN] ${message}`))
	}

	/**
	 * Overwrite current line (for status updates)
	 */
	status(message: string): void {
		process.stdout.write(`${ANSI.clearLine}${message}`)
		this.writeToBuffer(this.formatForFile(message))
	}

	/**
	 * Log error to console, file, and alerts
	 */
	logError(message: string): void {
		const formatted = `[ERROR] ${message}`
		console.error(`${ANSI.red}${formatted}${ANSI.reset}`)
		this.writeToBuffer(this.formatForFile(formatted))
		this.writeToAlerts(formatted)
	}

	/**
	 * Log only if verbose mode enabled
	 */
	logVerbose(message: string): void {
		if (this.verbose) {
			console.log(`${ANSI.dim}[VERBOSE] ${message}${ANSI.reset}`)
		}
		this.writeToBuffer(this.formatForFile(`[VERBOSE] ${message}`))
	}

	/**
	 * Log a section header
	 */
	header(title: string, char = "="): void {
		const line = char.repeat(60)
		this.say(`\n${line}`)
		this.say(title)
		this.say(line)
	}

	/**
	 * Log a sub-section header
	 */
	subheader(title: string): void {
		const line = "-".repeat(60)
		this.say(`\n${line}`)
		this.say(title)
		this.say(line)
	}

	/**
	 * Stream text without newline (for real-time output)
	 */
	stream(text: string): void {
		process.stdout.write(text)
		this.writeToBuffer(text)
	}

	/**
	 * End a streamed line
	 */
	streamEnd(): void {
		console.log()
	}

	/**
	 * Log a tool call
	 */
	toolCall(name: string, input?: unknown): void {
		const inputStr = input ? `: ${JSON.stringify(input)}` : ""
		const truncated = inputStr.length > 100 ? `${inputStr.slice(0, 100)}...` : inputStr
		console.log(`${ANSI.cyan}[TOOL] ${name}${truncated}${ANSI.reset}`)
		this.writeToBuffer(this.formatForFile(`[TOOL] ${name}${inputStr}`))
	}

	/**
	 * Log a tool result
	 */
	toolResult(output: string): void {
		const truncated = output.length > 200 ? `${output.slice(0, 200)}...` : output
		console.log(`${ANSI.dim}[RESULT] ${truncated}${ANSI.reset}`)
		this.writeToBuffer(this.formatForFile(`[RESULT] ${output}`))
	}

	/**
	 * Log thinking/reasoning (only in verbose mode to console)
	 */
	thinking(text: string): void {
		if (this.verbose) {
			console.log(`${ANSI.dim}[THINKING] ${text}${ANSI.reset}`)
		}
		this.writeToBuffer(this.formatForFile(`[THINKING] ${text}`))
	}

	/**
	 * Log token usage
	 */
	tokens(input: number, output: number): void {
		const msg = `[TOKENS] in: ${input}, out: ${output}`
		if (this.verbose) {
			console.log(`${ANSI.dim}${msg}${ANSI.reset}`)
		}
		this.writeToBuffer(this.formatForFile(msg))
	}

	/**
	 * Format message for file output with timestamp
	 */
	private formatForFile(message: string): string {
		const now = new Date()
		const timestamp = now.toISOString().replace("T", " ").slice(0, 19)
		return `[${timestamp}] ${message}\n`
	}

	/**
	 * Write to log buffer
	 */
	private writeToBuffer(content: string): void {
		this.logBuffer.push(content)

		// Flush when buffer exceeds threshold
		const totalSize = this.logBuffer.reduce((acc, s) => acc + s.length, 0)
		if (totalSize >= this.BUFFER_SIZE) {
			this.flush()
		}
	}

	/**
	 * Flush log buffer to files
	 */
	flush(): void {
		if (this.logBuffer.length === 0) return

		const content = this.logBuffer.join("")
		this.logBuffer = []

		try {
			// Write to main log
			appendFileSync(this.paths.mainLog, content)

			// Write to cycle log if set
			if (this.cycleLogFile) {
				appendFileSync(this.cycleLogFile, content)
			}
		} catch (err) {
			// Fallback to console if file write fails
			console.error(`Failed to write to log file: ${err}`)
		}
	}

	/**
	 * Write to alerts file
	 */
	private writeToAlerts(message: string): void {
		try {
			const timestamp = new Date().toISOString()
			appendFileSync(this.paths.alertsFile, `[${timestamp}] ${message}\n`)
		} catch {
			// Ignore alert write failures
		}
	}

	/**
	 * Rotate the main log file
	 */
	rotate(): void {
		if (!existsSync(this.paths.mainLog)) return

		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
			const rotatedPath = `${this.paths.mainLog}.${timestamp}`
			renameSync(this.paths.mainLog, rotatedPath)
		} catch (err) {
			this.logError(`Failed to rotate log: ${err}`)
		}
	}

	/**
	 * Clean up old log files
	 */
	cleanup(days: number): number {
		const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000
		let deletedCount = 0

		// Cleanup old cycle logs
		if (existsSync(this.paths.cycleLogDir)) {
			for (const file of readdirSync(this.paths.cycleLogDir)) {
				const filePath = join(this.paths.cycleLogDir, file)
				try {
					const stats = statSync(filePath)
					if (stats.mtimeMs < cutoffMs) {
						unlinkSync(filePath)
						deletedCount++
					}
				} catch {
					// Ignore individual file errors
				}
			}
		}

		return deletedCount
	}
}
