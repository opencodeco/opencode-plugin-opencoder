/**
 * Git operations helper module
 */

import { execSync } from "node:child_process"

import type { Logger } from "./logger.ts"

export function hasChanges(projectDir: string): boolean {
	try {
		const output = execSync("git status --porcelain", {
			cwd: projectDir,
			encoding: "utf-8",
		})
		return output.trim().length > 0
	} catch {
		return false
	}
}

export function generateCommitMessage(taskDescription: string): string {
	const lowerDesc = taskDescription.toLowerCase()

	// Check more specific patterns first before generic ones like "add"

	if (
		lowerDesc.includes("fix") ||
		lowerDesc.includes("bug") ||
		lowerDesc.includes("resolve") ||
		lowerDesc.includes("issue")
	) {
		return `fix: ${taskDescription}`
	}

	if (lowerDesc.includes("test") || lowerDesc.includes("spec") || lowerDesc.includes("coverage")) {
		return `test: ${taskDescription}`
	}

	if (
		lowerDesc.includes("docs") ||
		lowerDesc.includes("documentation") ||
		lowerDesc.includes("readme") ||
		lowerDesc.includes("comment")
	) {
		return `docs: ${taskDescription}`
	}

	if (
		lowerDesc.includes("refactor") ||
		lowerDesc.includes("rewrite") ||
		lowerDesc.includes("restructure") ||
		lowerDesc.includes("improve")
	) {
		return `refactor: ${taskDescription}`
	}

	// Generic feature patterns last
	if (
		lowerDesc.includes("feat") ||
		lowerDesc.includes("add") ||
		lowerDesc.includes("implement") ||
		lowerDesc.includes("new")
	) {
		return `feat: ${taskDescription}`
	}

	return `feat: ${taskDescription}`
}

export function commitChanges(
	projectDir: string,
	logger: Logger,
	message: string,
	signoff: boolean,
): void {
	try {
		const signoffFlag = signoff ? " -s" : ""
		execSync(`git add . && git commit${signoffFlag} -m "${message}"`, {
			cwd: projectDir,
			encoding: "utf-8",
		})
		logger.log(`Committed: ${message}`)
	} catch (err) {
		logger.logError(`Failed to commit changes: ${err}`)
	}
}

export function pushChanges(projectDir: string, logger: Logger): void {
	try {
		execSync("git push", {
			cwd: projectDir,
			encoding: "utf-8",
		})
		logger.log("Pushed changes to remote")
	} catch (err) {
		logger.logError(`Failed to push changes: ${err}`)
	}
}
