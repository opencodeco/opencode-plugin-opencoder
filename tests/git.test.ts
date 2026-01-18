/**
 * Tests for git.ts module
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { execSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { generateCommitMessage, hasChanges } from "../src/git.ts"

const TEST_DIR = "/tmp/opencoder-test-git"

describe("git", () => {
	describe("hasChanges", () => {
		beforeEach(() => {
			// Create a test directory with git repo
			if (existsSync(TEST_DIR)) {
				rmSync(TEST_DIR, { recursive: true })
			}
			mkdirSync(TEST_DIR, { recursive: true })
			execSync("git init", { cwd: TEST_DIR })
			execSync('git config user.email "test@test.com"', { cwd: TEST_DIR })
			execSync('git config user.name "Test User"', { cwd: TEST_DIR })
		})

		afterEach(() => {
			if (existsSync(TEST_DIR)) {
				rmSync(TEST_DIR, { recursive: true })
			}
		})

		test("returns false for clean repo", () => {
			// Create initial commit so repo is not empty
			writeFileSync(join(TEST_DIR, "README.md"), "# Test")
			execSync("git add . && git commit -m 'Initial commit'", { cwd: TEST_DIR })

			expect(hasChanges(TEST_DIR)).toBe(false)
		})

		test("returns true for untracked files", () => {
			// Create initial commit
			writeFileSync(join(TEST_DIR, "README.md"), "# Test")
			execSync("git add . && git commit -m 'Initial commit'", { cwd: TEST_DIR })

			// Add untracked file
			writeFileSync(join(TEST_DIR, "new-file.txt"), "new content")

			expect(hasChanges(TEST_DIR)).toBe(true)
		})

		test("returns true for modified files", () => {
			// Create initial commit
			writeFileSync(join(TEST_DIR, "README.md"), "# Test")
			execSync("git add . && git commit -m 'Initial commit'", { cwd: TEST_DIR })

			// Modify file
			writeFileSync(join(TEST_DIR, "README.md"), "# Modified")

			expect(hasChanges(TEST_DIR)).toBe(true)
		})

		test("returns true for staged files", () => {
			// Create initial commit
			writeFileSync(join(TEST_DIR, "README.md"), "# Test")
			execSync("git add . && git commit -m 'Initial commit'", { cwd: TEST_DIR })

			// Stage a change
			writeFileSync(join(TEST_DIR, "README.md"), "# Staged")
			execSync("git add README.md", { cwd: TEST_DIR })

			expect(hasChanges(TEST_DIR)).toBe(true)
		})

		test("returns false for non-git directory", () => {
			const nonGitDir = "/tmp/opencoder-test-non-git"
			if (existsSync(nonGitDir)) {
				rmSync(nonGitDir, { recursive: true })
			}
			mkdirSync(nonGitDir, { recursive: true })

			expect(hasChanges(nonGitDir)).toBe(false)

			rmSync(nonGitDir, { recursive: true })
		})

		test("returns false for non-existent directory", () => {
			expect(hasChanges("/tmp/does-not-exist-xyz")).toBe(false)
		})
	})

	describe("generateCommitMessage", () => {
		test("generates fix prefix for bug-related tasks", () => {
			expect(generateCommitMessage("fix the login bug")).toBe("fix: fix the login bug")
			expect(generateCommitMessage("Fix null pointer exception")).toBe(
				"fix: Fix null pointer exception",
			)
			expect(generateCommitMessage("Resolve the timeout issue")).toBe(
				"fix: Resolve the timeout issue",
			)
			expect(generateCommitMessage("Address bug in parser")).toBe("fix: Address bug in parser")
			expect(generateCommitMessage("Issue with authentication")).toBe(
				"fix: Issue with authentication",
			)
		})

		test("generates feat prefix for feature-related tasks", () => {
			expect(generateCommitMessage("Add new login feature")).toBe("feat: Add new login feature")
			expect(generateCommitMessage("Implement user dashboard")).toBe(
				"feat: Implement user dashboard",
			)
			expect(generateCommitMessage("new API endpoint for users")).toBe(
				"feat: new API endpoint for users",
			)
			// Note: If description already has prefix, it will be doubled
			expect(generateCommitMessage("dark mode support")).toBe("feat: dark mode support")
		})

		test("generates test prefix for test-related tasks", () => {
			expect(generateCommitMessage("Add unit tests for parser")).toBe(
				"test: Add unit tests for parser",
			)
			expect(generateCommitMessage("Write spec for login component")).toBe(
				"test: Write spec for login component",
			)
			expect(generateCommitMessage("Improve test coverage")).toBe("test: Improve test coverage")
		})

		test("generates docs prefix for documentation tasks", () => {
			expect(generateCommitMessage("Update README with instructions")).toBe(
				"docs: Update README with instructions",
			)
			expect(generateCommitMessage("Add documentation for API")).toBe(
				"docs: Add documentation for API",
			)
			expect(generateCommitMessage("Add code comments")).toBe("docs: Add code comments")
		})

		test("generates refactor prefix for refactoring tasks", () => {
			expect(generateCommitMessage("Refactor the auth module")).toBe(
				"refactor: Refactor the auth module",
			)
			expect(generateCommitMessage("Rewrite parser for clarity")).toBe(
				"refactor: Rewrite parser for clarity",
			)
			expect(generateCommitMessage("Restructure project layout")).toBe(
				"refactor: Restructure project layout",
			)
			expect(generateCommitMessage("Improve code organization")).toBe(
				"refactor: Improve code organization",
			)
		})

		test("defaults to feat for unrecognized patterns", () => {
			expect(generateCommitMessage("Update dependencies")).toBe("feat: Update dependencies")
			expect(generateCommitMessage("Some random task")).toBe("feat: Some random task")
		})

		test("is case insensitive", () => {
			expect(generateCommitMessage("FIX THE BUG")).toBe("fix: FIX THE BUG")
			expect(generateCommitMessage("ADD NEW FEATURE")).toBe("feat: ADD NEW FEATURE")
			expect(generateCommitMessage("REFACTOR CODE")).toBe("refactor: REFACTOR CODE")
		})
	})
})
