/**
 * Tests for config module
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { loadConfig, parseModel } from "../src/config.ts"

const TEST_DIR = "/tmp/opencoder-test-config"

describe("parseModel", () => {
	test("parses simple provider/model format", () => {
		const result = parseModel("anthropic/claude-sonnet-4")
		expect(result.providerID).toBe("anthropic")
		expect(result.modelID).toBe("claude-sonnet-4")
	})

	test("parses model with multiple slashes", () => {
		const result = parseModel("openai/gpt-4/turbo")
		expect(result.providerID).toBe("openai")
		expect(result.modelID).toBe("gpt-4/turbo")
	})

	test("handles empty string", () => {
		const result = parseModel("")
		expect(result.providerID).toBe("")
		expect(result.modelID).toBe("")
	})

	test("handles string without slash", () => {
		const result = parseModel("claude")
		expect(result.providerID).toBe("claude")
		expect(result.modelID).toBe("")
	})

	test("handles provider-only with trailing slash", () => {
		const result = parseModel("anthropic/")
		expect(result.providerID).toBe("anthropic")
		expect(result.modelID).toBe("")
	})
})

describe("loadConfig", () => {
	beforeEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true })
		}
		mkdirSync(TEST_DIR, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true })
		}
		// Clean up environment variables
		delete process.env.OPENCODER_PLAN_MODEL
		delete process.env.OPENCODER_BUILD_MODEL
		delete process.env.OPENCODER_VERBOSE
		delete process.env.OPENCODER_MAX_RETRIES
		delete process.env.OPENCODER_PROJECT_DIR
	})

	test("throws error when no model is provided", async () => {
		expect(loadConfig({ project: TEST_DIR })).rejects.toThrow("Missing plan model")
	})

	test("throws error when only plan model is provided", async () => {
		expect(
			loadConfig({ project: TEST_DIR, planModel: "anthropic/claude-sonnet-4" }),
		).rejects.toThrow("Missing build model")
	})

	test("throws error for invalid model format", async () => {
		expect(loadConfig({ project: TEST_DIR, model: "invalid-model" })).rejects.toThrow(
			"Invalid plan model format",
		)
	})

	test("throws error for non-existent project directory", async () => {
		expect(
			loadConfig({ project: "/nonexistent/path", model: "anthropic/claude-sonnet-4" }),
		).rejects.toThrow("Project directory does not exist")
	})

	test("loads config with model from CLI option", async () => {
		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.planModel).toBe("anthropic/claude-sonnet-4")
		expect(config.buildModel).toBe("anthropic/claude-sonnet-4")
		expect(config.projectDir).toBe(TEST_DIR)
	})

	test("uses separate plan and build models", async () => {
		const config = await loadConfig({
			project: TEST_DIR,
			planModel: "anthropic/claude-opus-4",
			buildModel: "anthropic/claude-sonnet-4",
		})

		expect(config.planModel).toBe("anthropic/claude-opus-4")
		expect(config.buildModel).toBe("anthropic/claude-sonnet-4")
	})

	test("sets default values", async () => {
		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.verbose).toBe(false)
		expect(config.maxRetries).toBe(3)
		expect(config.backoffBase).toBe(10)
		expect(config.logRetention).toBe(30)
		expect(config.taskPauseSeconds).toBe(2)
		expect(config.autoCommit).toBe(true)
		expect(config.autoPush).toBe(true)
		expect(config.commitSignoff).toBe(false)
	})

	test("includes user hint when provided", async () => {
		const config = await loadConfig(
			{ project: TEST_DIR, model: "anthropic/claude-sonnet-4" },
			"focus on tests",
		)

		expect(config.userHint).toBe("focus on tests")
	})

	test("loads config from config.json file", async () => {
		// Create config directory and file
		const configDir = join(TEST_DIR, ".opencode", "opencoder")
		mkdirSync(configDir, { recursive: true })

		await Bun.write(
			join(configDir, "config.json"),
			JSON.stringify({
				planModel: "anthropic/claude-opus-4",
				buildModel: "anthropic/claude-sonnet-4",
				verbose: true,
				maxRetries: 5,
			}),
		)

		const config = await loadConfig({ project: TEST_DIR })

		expect(config.planModel).toBe("anthropic/claude-opus-4")
		expect(config.buildModel).toBe("anthropic/claude-sonnet-4")
		expect(config.verbose).toBe(true)
		expect(config.maxRetries).toBe(5)
	})

	test("CLI options override config file", async () => {
		// Create config file
		const configDir = join(TEST_DIR, ".opencode", "opencoder")
		mkdirSync(configDir, { recursive: true })

		await Bun.write(
			join(configDir, "config.json"),
			JSON.stringify({
				planModel: "anthropic/claude-opus-4",
				buildModel: "anthropic/claude-sonnet-4",
				verbose: false,
			}),
		)

		const config = await loadConfig({
			project: TEST_DIR,
			model: "openai/gpt-4",
			verbose: true,
		})

		// CLI should override file
		expect(config.planModel).toBe("openai/gpt-4")
		expect(config.buildModel).toBe("openai/gpt-4")
		expect(config.verbose).toBe(true)
	})

	test("handles invalid config.json gracefully", async () => {
		// Create invalid JSON file
		const configDir = join(TEST_DIR, ".opencode", "opencoder")
		mkdirSync(configDir, { recursive: true })

		await Bun.write(join(configDir, "config.json"), "not valid json {")

		// Should not throw, but use CLI/defaults instead
		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.planModel).toBe("anthropic/claude-sonnet-4")
	})

	test("config file can set partial options", async () => {
		// Create config with only some options
		const configDir = join(TEST_DIR, ".opencode", "opencoder")
		mkdirSync(configDir, { recursive: true })

		await Bun.write(
			join(configDir, "config.json"),
			JSON.stringify({
				maxRetries: 10,
				taskPauseSeconds: 5,
			}),
		)

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		// File values should be used
		expect(config.maxRetries).toBe(10)
		expect(config.taskPauseSeconds).toBe(5)
		// Defaults should still apply for unset values
		expect(config.backoffBase).toBe(10)
		expect(config.logRetention).toBe(30)
	})

	test("loads git config options from config.json", async () => {
		const configDir = join(TEST_DIR, ".opencode", "opencoder")
		mkdirSync(configDir, { recursive: true })

		await Bun.write(
			join(configDir, "config.json"),
			JSON.stringify({
				planModel: "anthropic/claude-opus-4",
				buildModel: "anthropic/claude-sonnet-4",
				autoCommit: false,
				autoPush: false,
				commitSignoff: true,
			}),
		)

		const config = await loadConfig({ project: TEST_DIR })

		expect(config.autoCommit).toBe(false)
		expect(config.autoPush).toBe(false)
		expect(config.commitSignoff).toBe(true)
	})
})

describe("loadConfig with environment variables", () => {
	beforeEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true })
		}
		mkdirSync(TEST_DIR, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true })
		}
		// Clean up all environment variables
		delete process.env.OPENCODER_PLAN_MODEL
		delete process.env.OPENCODER_BUILD_MODEL
		delete process.env.OPENCODER_VERBOSE
		delete process.env.OPENCODER_MAX_RETRIES
		delete process.env.OPENCODER_BACKOFF_BASE
		delete process.env.OPENCODER_LOG_RETENTION
		delete process.env.OPENCODER_TASK_PAUSE_SECONDS
		delete process.env.OPENCODER_PROJECT_DIR
		delete process.env.OPENCODER_AUTO_COMMIT
		delete process.env.OPENCODER_AUTO_PUSH
		delete process.env.OPENCODER_COMMIT_SIGNOFF
	})

	test("loads models from environment variables", async () => {
		process.env.OPENCODER_PLAN_MODEL = "anthropic/claude-opus-4"
		process.env.OPENCODER_BUILD_MODEL = "anthropic/claude-sonnet-4"

		const config = await loadConfig({ project: TEST_DIR })

		expect(config.planModel).toBe("anthropic/claude-opus-4")
		expect(config.buildModel).toBe("anthropic/claude-sonnet-4")
	})

	test("loads verbose from environment variable (true)", async () => {
		process.env.OPENCODER_VERBOSE = "true"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.verbose).toBe(true)
	})

	test("loads verbose from environment variable (1)", async () => {
		process.env.OPENCODER_VERBOSE = "1"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.verbose).toBe(true)
	})

	test("verbose is false for other values", async () => {
		process.env.OPENCODER_VERBOSE = "false"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.verbose).toBe(false)
	})

	test("loads maxRetries from environment variable", async () => {
		process.env.OPENCODER_MAX_RETRIES = "7"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.maxRetries).toBe(7)
	})

	test("loads backoffBase from environment variable", async () => {
		process.env.OPENCODER_BACKOFF_BASE = "20"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.backoffBase).toBe(20)
	})

	test("loads logRetention from environment variable", async () => {
		process.env.OPENCODER_LOG_RETENTION = "60"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.logRetention).toBe(60)
	})

	test("loads taskPauseSeconds from environment variable", async () => {
		process.env.OPENCODER_TASK_PAUSE_SECONDS = "5"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.taskPauseSeconds).toBe(5)
	})

	test("ignores invalid numeric values", async () => {
		process.env.OPENCODER_MAX_RETRIES = "not-a-number"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		// Should use default value
		expect(config.maxRetries).toBe(3)
	})

	test("environment variables override config file", async () => {
		// Create config file
		const configDir = join(TEST_DIR, ".opencode", "opencoder")
		mkdirSync(configDir, { recursive: true })

		await Bun.write(
			join(configDir, "config.json"),
			JSON.stringify({
				planModel: "anthropic/claude-opus-4",
				buildModel: "anthropic/claude-sonnet-4",
				maxRetries: 5,
			}),
		)

		// Set env var to override
		process.env.OPENCODER_MAX_RETRIES = "10"

		const config = await loadConfig({ project: TEST_DIR })

		// Env var should override file
		expect(config.maxRetries).toBe(10)
		// File values should still be used for others
		expect(config.planModel).toBe("anthropic/claude-opus-4")
	})

	test("CLI options override environment variables", async () => {
		process.env.OPENCODER_PLAN_MODEL = "anthropic/claude-opus-4"
		process.env.OPENCODER_BUILD_MODEL = "anthropic/claude-opus-4"
		process.env.OPENCODER_VERBOSE = "true"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "openai/gpt-4",
			verbose: false,
		})

		// CLI should override env
		expect(config.planModel).toBe("openai/gpt-4")
		expect(config.buildModel).toBe("openai/gpt-4")
		expect(config.verbose).toBe(false)
	})

	test("loads all environment variables together", async () => {
		process.env.OPENCODER_PLAN_MODEL = "anthropic/claude-opus-4"
		process.env.OPENCODER_BUILD_MODEL = "anthropic/claude-sonnet-4"
		process.env.OPENCODER_VERBOSE = "true"
		process.env.OPENCODER_MAX_RETRIES = "5"
		process.env.OPENCODER_BACKOFF_BASE = "15"
		process.env.OPENCODER_LOG_RETENTION = "45"
		process.env.OPENCODER_TASK_PAUSE_SECONDS = "3"

		const config = await loadConfig({ project: TEST_DIR })

		expect(config.planModel).toBe("anthropic/claude-opus-4")
		expect(config.buildModel).toBe("anthropic/claude-sonnet-4")
		expect(config.verbose).toBe(true)
		expect(config.maxRetries).toBe(5)
		expect(config.backoffBase).toBe(15)
		expect(config.logRetention).toBe(45)
		expect(config.taskPauseSeconds).toBe(3)
	})

	test("loads autoCommit from environment variable", async () => {
		process.env.OPENCODER_AUTO_COMMIT = "false"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.autoCommit).toBe(false)
	})

	test("loads autoPush from environment variable", async () => {
		process.env.OPENCODER_AUTO_PUSH = "false"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.autoPush).toBe(false)
	})

	test("loads commitSignoff from environment variable", async () => {
		process.env.OPENCODER_COMMIT_SIGNOFF = "true"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.commitSignoff).toBe(true)
	})

	test("commitSignoff accepts 1 as true", async () => {
		process.env.OPENCODER_COMMIT_SIGNOFF = "1"

		const config = await loadConfig({
			project: TEST_DIR,
			model: "anthropic/claude-sonnet-4",
		})

		expect(config.commitSignoff).toBe(true)
	})
})
