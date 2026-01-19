import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { agents } from "../src/metadata"
import { AGENT_NAMES, parseFrontmatter } from "../src/paths.mjs"

describe("postinstall.mjs", () => {
	const testDir = join(tmpdir(), `opencoder-test-${Date.now()}`)
	const agentsSourceDir = join(testDir, "agents")

	beforeEach(() => {
		// Create test directories
		mkdirSync(agentsSourceDir, { recursive: true })
		// Create mock agent files
		writeFileSync(join(agentsSourceDir, "test-agent.md"), "# Test Agent")
		writeFileSync(join(agentsSourceDir, "another-agent.md"), "# Another Agent")
	})

	afterEach(() => {
		// Clean up test directories
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true })
		}
	})

	it("should identify .md files in source directory", () => {
		const files = readdirSync(agentsSourceDir).filter((f) => f.endsWith(".md"))
		expect(files).toContain("test-agent.md")
		expect(files).toContain("another-agent.md")
		expect(files).toHaveLength(2)
	})

	it("should not include non-.md files", () => {
		writeFileSync(join(agentsSourceDir, "readme.txt"), "Not an agent")
		const files = readdirSync(agentsSourceDir).filter((f) => f.endsWith(".md"))
		expect(files).not.toContain("readme.txt")
		expect(files).toHaveLength(2)
	})
})

describe("agent files existence", () => {
	const agentsDir = join(import.meta.dir, "..", "agents")

	it("should have opencoder.md agent file", () => {
		expect(existsSync(join(agentsDir, "opencoder.md"))).toBe(true)
	})

	it("should have opencoder-planner.md agent file", () => {
		expect(existsSync(join(agentsDir, "opencoder-planner.md"))).toBe(true)
	})

	it("should have opencoder-builder.md agent file", () => {
		expect(existsSync(join(agentsDir, "opencoder-builder.md"))).toBe(true)
	})

	it("should have exactly 3 agent files", () => {
		const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"))
		expect(files).toHaveLength(3)
	})
})

describe("agent metadata consistency", () => {
	const agentsDir = join(import.meta.dir, "..", "agents")

	it("should have AGENT_NAMES match agents export from metadata", () => {
		expect(AGENT_NAMES).toEqual(agents)
	})

	it("should have agents export match actual files in agents/ directory", () => {
		const actualFiles = readdirSync(agentsDir)
			.filter((f) => f.endsWith(".md"))
			.map((f) => f.replace(/\.md$/, ""))
			.sort()
		const expectedAgents = [...agents].sort()
		expect(actualFiles).toEqual(expectedAgents)
	})

	it("should have AGENT_NAMES match actual files in agents/ directory", () => {
		const actualFiles = readdirSync(agentsDir)
			.filter((f) => f.endsWith(".md"))
			.map((f) => f.replace(/\.md$/, ""))
			.sort()
		const expectedAgents = [...AGENT_NAMES].sort()
		expect(actualFiles).toEqual(expectedAgents)
	})
})

describe("agent files YAML frontmatter", () => {
	const agentsDir = join(import.meta.dir, "..", "agents")
	const agentFiles = ["opencoder.md", "opencoder-planner.md", "opencoder-builder.md"]

	for (const agentFile of agentFiles) {
		describe(agentFile, () => {
			it("should have valid YAML frontmatter", () => {
				const content = readFileSync(join(agentsDir, agentFile), "utf-8")
				const result = parseFrontmatter(content)
				expect(result.found).toBe(true)
			})

			it("should have a version field", () => {
				const content = readFileSync(join(agentsDir, agentFile), "utf-8")
				const result = parseFrontmatter(content)
				expect(result.found).toBe(true)
				expect(result.fields.version).toBeDefined()
				expect(result.fields.version).toMatch(/^\d+\.\d+\.\d+$/)
			})

			it("should have a requires field", () => {
				const content = readFileSync(join(agentsDir, agentFile), "utf-8")
				const result = parseFrontmatter(content)
				expect(result.found).toBe(true)
				expect(result.fields.requires).toBeDefined()
				expect(result.fields.requires).toMatch(/^>=?\d+\.\d+\.\d+$/)
			})

			it("should have an updated field with valid date", () => {
				const content = readFileSync(join(agentsDir, agentFile), "utf-8")
				const result = parseFrontmatter(content)
				expect(result.found).toBe(true)
				expect(result.fields.updated).toBeDefined()
				expect(result.fields.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
			})
		})
	}
})
