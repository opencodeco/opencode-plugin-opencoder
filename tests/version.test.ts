/**
 * Tests for version module
 */

import { describe, expect, test } from "bun:test"
import { formatVersionInfo, getVersionInfo } from "../src/version.ts"

describe("version module", () => {
	describe("getVersionInfo", () => {
		test("returns VersionInfo object with all required fields", () => {
			const info = getVersionInfo()

			expect(info).toBeDefined()
			expect(info.opencoder).toBeDefined()
			expect(info.bun).toBeDefined()
			expect(info.sdk).toBeDefined()
			expect(info.node).toBeDefined()
		})

		test("opencoder version is a string", () => {
			const info = getVersionInfo()
			expect(typeof info.opencoder).toBe("string")
			expect(info.opencoder.length).toBeGreaterThan(0)
		})

		test("bun version is a string", () => {
			const info = getVersionInfo()
			expect(typeof info.bun).toBe("string")
			expect(info.bun.length).toBeGreaterThan(0)
		})

		test("sdk version is a string", () => {
			const info = getVersionInfo()
			expect(typeof info.sdk).toBe("string")
			expect(info.sdk.length).toBeGreaterThan(0)
		})

		test("node version is a string", () => {
			const info = getVersionInfo()
			expect(typeof info.node).toBe("string")
			expect(info.node.length).toBeGreaterThan(0)
		})
	})

	describe("formatVersionInfo", () => {
		test("formats version info as multi-line string", () => {
			const info = {
				opencoder: "1.0.0",
				bun: "1.0.0",
				sdk: "1.1.25",
				node: "20.10.0",
			}

			const formatted = formatVersionInfo(info)

			expect(formatted).toContain("OpenCoder 1.0.0")
			expect(formatted).toContain("Bun 1.0.0")
			expect(formatted).toContain("OpenCode SDK 1.1.25")
			expect(formatted).toContain("Node.js 20.10.0")
		})

		test("formats with newlines between lines", () => {
			const info = {
				opencoder: "1.0.0",
				bun: "1.0.0",
				sdk: "1.1.25",
				node: "20.10.0",
			}

			const formatted = formatVersionInfo(info)
			const lines = formatted.split("\n")

			expect(lines.length).toBe(4)
		})

		test("includes compatibility reference for Node.js", () => {
			const info = {
				opencoder: "1.0.0",
				bun: "1.0.0",
				sdk: "1.1.25",
				node: "20.10.0",
			}

			const formatted = formatVersionInfo(info)

			expect(formatted).toContain("compatibility reference")
		})
	})
})
