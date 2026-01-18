/**
 * Tests for config module
 */

import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { parseModel } from "../src/config.ts"

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
