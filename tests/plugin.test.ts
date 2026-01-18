import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
import { OpenCoderPlugin } from "../src/plugin"

describe("OpenCoderPlugin", () => {
	// Create a mock context (minimal implementation for testing)
	const createMockContext = () =>
		({
			project: {},
			client: {},
			$: () => {},
			directory: "/tmp/test-project",
			worktree: "/tmp/test-project",
			serverUrl: new URL("http://localhost:3000"),
		}) as unknown as PluginInput

	it("should be an async function", () => {
		expect(OpenCoderPlugin).toBeInstanceOf(Function)
	})

	it("should return a hooks object when called", async () => {
		const result = await OpenCoderPlugin(createMockContext())

		expect(result).toBeDefined()
		expect(typeof result).toBe("object")
	})

	it("should return hooks object with lifecycle callbacks", async () => {
		const result = await OpenCoderPlugin(createMockContext())

		// Verify expected hooks are present
		expect(result.event).toBeDefined()
		expect(typeof result.event).toBe("function")
		expect(result["tool.execute.before"]).toBeDefined()
		expect(typeof result["tool.execute.before"]).toBe("function")
		expect(result["tool.execute.after"]).toBeDefined()
		expect(typeof result["tool.execute.after"]).toBe("function")
	})

	it("should have callable event hook", async () => {
		const result = await OpenCoderPlugin(createMockContext())

		// Event hook should be callable without throwing
		const mockEvent: Event = {
			type: "session.idle",
			properties: { sessionID: "test-123" },
		}
		await expect(result.event?.({ event: mockEvent })).resolves.toBeUndefined()
	})

	it("should have callable tool.execute.before hook", async () => {
		const result = await OpenCoderPlugin(createMockContext())

		const input = { tool: "bash", sessionID: "test-123", callID: "call-456" }
		const output = { args: { command: "ls" } }

		await expect(result["tool.execute.before"]?.(input, output)).resolves.toBeUndefined()
	})

	it("should have callable tool.execute.after hook", async () => {
		const result = await OpenCoderPlugin(createMockContext())

		const input = { tool: "bash", sessionID: "test-123", callID: "call-456" }
		const output = { title: "Command executed", output: "file1.txt\nfile2.txt", metadata: {} }

		await expect(result["tool.execute.after"]?.(input, output)).resolves.toBeUndefined()
	})
})

describe("OpenCoderPlugin debug logging", () => {
	const createMockContext = () =>
		({
			project: {},
			client: {},
			$: () => {},
			directory: "/tmp/test-project",
			worktree: "/tmp/test-project",
			serverUrl: new URL("http://localhost:3000"),
		}) as unknown as PluginInput

	let originalDebug: string | undefined
	let consoleLogSpy: ReturnType<typeof spyOn>
	let logCalls: unknown[][]

	beforeEach(() => {
		originalDebug = process.env.OPENCODER_DEBUG
		logCalls = []
		consoleLogSpy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
			logCalls.push(args)
		})
	})

	afterEach(() => {
		if (originalDebug === undefined) {
			delete process.env.OPENCODER_DEBUG
		} else {
			process.env.OPENCODER_DEBUG = originalDebug
		}
		consoleLogSpy.mockRestore()
	})

	it("should log event when OPENCODER_DEBUG=1", async () => {
		process.env.OPENCODER_DEBUG = "1"
		const result = await OpenCoderPlugin(createMockContext())

		const mockEvent: Event = {
			type: "session.idle",
			properties: { sessionID: "test-123" },
		}
		await result.event?.({ event: mockEvent })

		expect(logCalls.length).toBe(1)
		const [prefix, message, jsonStr] = logCalls[0] as [string, string, string]
		expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T.*\] \[opencoder\]$/)
		expect(message).toBe("Event received")
		const parsed = JSON.parse(jsonStr)
		expect(parsed.type).toBe("session.idle")
		expect(parsed.properties).toEqual(["sessionID"])
		expect(parsed.directory).toBe("/tmp/test-project")
	})

	it("should log tool.execute.before when OPENCODER_DEBUG=1", async () => {
		process.env.OPENCODER_DEBUG = "1"
		const result = await OpenCoderPlugin(createMockContext())

		const input = { tool: "bash", sessionID: "test-123", callID: "call-456" }
		const output = { args: { command: "ls", workdir: "/tmp" } }
		await result["tool.execute.before"]?.(input, output)

		expect(logCalls.length).toBe(1)
		const [prefix, message, jsonStr] = logCalls[0] as [string, string, string]
		expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T.*\] \[opencoder\]$/)
		expect(message).toBe("Tool executing")
		const parsed = JSON.parse(jsonStr)
		expect(parsed.tool).toBe("bash")
		expect(parsed.sessionID).toBe("test-123")
		expect(parsed.callID).toBe("call-456")
		expect(parsed.argsKeys).toEqual(["command", "workdir"])
		expect(parsed.directory).toBe("/tmp/test-project")
	})

	it("should log tool.execute.after when OPENCODER_DEBUG=1", async () => {
		process.env.OPENCODER_DEBUG = "1"
		const result = await OpenCoderPlugin(createMockContext())

		const input = { tool: "bash", sessionID: "test-123", callID: "call-456" }
		const output = { title: "Command executed", output: "file1.txt\nfile2.txt", metadata: {} }
		await result["tool.execute.after"]?.(input, output)

		expect(logCalls.length).toBe(1)
		const [prefix, message, jsonStr] = logCalls[0] as [string, string, string]
		expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T.*\] \[opencoder\]$/)
		expect(message).toBe("Tool completed")
		const parsed = JSON.parse(jsonStr)
		expect(parsed.tool).toBe("bash")
		expect(parsed.sessionID).toBe("test-123")
		expect(parsed.callID).toBe("call-456")
		expect(parsed.title).toBe("Command executed")
		expect(parsed.outputLength).toBe(19) // "file1.txt\nfile2.txt".length
		expect(parsed.directory).toBe("/tmp/test-project")
	})

	it("should handle tool.execute.after with undefined output", async () => {
		process.env.OPENCODER_DEBUG = "1"
		const result = await OpenCoderPlugin(createMockContext())

		const input = { tool: "bash", sessionID: "test-123", callID: "call-456" }
		// biome-ignore lint/suspicious/noExplicitAny: Testing edge case with undefined output
		const output = { title: "Command executed", output: undefined, metadata: {} } as any
		await result["tool.execute.after"]?.(input, output)

		expect(logCalls.length).toBe(1)
		const [, , jsonStr] = logCalls[0] as [string, string, string]
		const parsed = JSON.parse(jsonStr)
		expect(parsed.outputLength).toBe(0)
	})

	it("should not log when OPENCODER_DEBUG is not set", async () => {
		delete process.env.OPENCODER_DEBUG
		const result = await OpenCoderPlugin(createMockContext())

		const mockEvent: Event = {
			type: "session.idle",
			properties: { sessionID: "test-123" },
		}
		await result.event?.({ event: mockEvent })

		expect(logCalls.length).toBe(0)
	})

	it("should not log when OPENCODER_DEBUG is set to other values", async () => {
		process.env.OPENCODER_DEBUG = "true"
		const result = await OpenCoderPlugin(createMockContext())

		const mockEvent: Event = {
			type: "session.idle",
			properties: { sessionID: "test-123" },
		}
		await result.event?.({ event: mockEvent })

		expect(logCalls.length).toBe(0)
	})
})
