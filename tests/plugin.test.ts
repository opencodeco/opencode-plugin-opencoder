import { describe, expect, it } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { OpenCoderPlugin } from "../src/plugin"

describe("OpenCoderPlugin", () => {
	it("should be an async function", () => {
		expect(OpenCoderPlugin).toBeInstanceOf(Function)
	})

	it("should return a hooks object when called", async () => {
		// Create a mock context (minimal implementation for testing)
		const mockContext = {
			project: {},
			client: {},
			$: () => {},
			directory: "/tmp",
			worktree: "/tmp",
			serverUrl: new URL("http://localhost:3000"),
		} as unknown as PluginInput

		const result = await OpenCoderPlugin(mockContext)

		expect(result).toBeDefined()
		expect(typeof result).toBe("object")
	})

	it("should return an empty hooks object (minimal implementation)", async () => {
		const mockContext = {
			project: {},
			client: {},
			$: () => {},
			directory: "/tmp",
			worktree: "/tmp",
			serverUrl: new URL("http://localhost:3000"),
		} as unknown as PluginInput

		const result = await OpenCoderPlugin(mockContext)

		expect(Object.keys(result)).toHaveLength(0)
	})
})
