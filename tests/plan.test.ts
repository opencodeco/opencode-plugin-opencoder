/**
 * Tests for plan module
 */

import { describe, expect, test } from "bun:test"
import {
	getTasks,
	getUncompletedTasks,
	markTaskComplete,
	validatePlan,
	extractPlanFromResponse,
} from "../src/plan.ts"

const SAMPLE_PLAN = `# Plan: Test Plan
Created: 2024-01-01
Cycle: 1

## Context
This is a test plan.

## Tasks
- [ ] Task one: Do the first thing
- [ ] Task two: Do the second thing
- [x] Task three: Already done
- [ ] Task four: Final task

## Notes
Some notes here.
`

describe("plan", () => {
	describe("getTasks", () => {
		test("extracts all tasks from plan", () => {
			const tasks = getTasks(SAMPLE_PLAN)

			expect(tasks.length).toBe(4)
			expect(tasks[0]?.description).toBe("Task one: Do the first thing")
			expect(tasks[0]?.completed).toBe(false)
			expect(tasks[2]?.description).toBe("Task three: Already done")
			expect(tasks[2]?.completed).toBe(true)
		})

		test("returns empty array for plan without tasks", () => {
			const tasks = getTasks("# Plan\nNo tasks here")

			expect(tasks.length).toBe(0)
		})

		test("captures line numbers correctly", () => {
			const tasks = getTasks(SAMPLE_PLAN)

			expect(tasks[0]?.lineNumber).toBe(9)
			expect(tasks[3]?.lineNumber).toBe(12)
		})
	})

	describe("getUncompletedTasks", () => {
		test("returns only uncompleted tasks", () => {
			const tasks = getUncompletedTasks(SAMPLE_PLAN)

			expect(tasks.length).toBe(3)
			expect(tasks.every((t) => !t.completed)).toBe(true)
		})

		test("returns empty array when all tasks are complete", () => {
			const plan = `# Plan
- [x] Done one
- [X] Done two
`
			const tasks = getUncompletedTasks(plan)

			expect(tasks.length).toBe(0)
		})
	})

	describe("markTaskComplete", () => {
		test("marks uncompleted task as complete", () => {
			const updated = markTaskComplete(SAMPLE_PLAN, 9) // Line number of first task

			expect(updated).toContain("- [x] Task one: Do the first thing")
		})

		test("preserves already completed tasks", () => {
			const updated = markTaskComplete(SAMPLE_PLAN, 11) // Line of already completed task

			// Should still have the original [x]
			expect(updated).toContain("- [x] Task three: Already done")
		})

		test("handles invalid line number gracefully", () => {
			const updated = markTaskComplete(SAMPLE_PLAN, 999)

			expect(updated).toBe(SAMPLE_PLAN)
		})
	})

	describe("validatePlan", () => {
		test("valid plan with tasks", () => {
			const result = validatePlan(SAMPLE_PLAN)

			expect(result.valid).toBe(true)
			expect(result.error).toBeUndefined()
		})

		test("invalid empty plan", () => {
			const result = validatePlan("")

			expect(result.valid).toBe(false)
			expect(result.error).toBe("Plan is empty")
		})

		test("invalid plan without tasks", () => {
			const result = validatePlan("# Plan\nSome content without tasks")

			expect(result.valid).toBe(false)
			expect(result.error).toBe("Plan has no actionable tasks")
		})

		test("invalid plan with all tasks completed", () => {
			const result = validatePlan("# Plan\n- [x] Done task")

			expect(result.valid).toBe(false)
			expect(result.error).toBe("All tasks are already completed")
		})
	})

	describe("extractPlanFromResponse", () => {
		test("extracts plan from markdown code block", () => {
			const response = `Here's the plan:

\`\`\`markdown
# Plan: Test
- [ ] Task one
\`\`\`

Done!`

			const plan = extractPlanFromResponse(response)

			expect(plan).toBe("# Plan: Test\n- [ ] Task one")
		})

		test("extracts plan from code block without language", () => {
			const response = `\`\`\`
# Plan
- [ ] Task
\`\`\``

			const plan = extractPlanFromResponse(response)

			expect(plan).toBe("# Plan\n- [ ] Task")
		})

		test("returns trimmed response when no code block", () => {
			const response = "  # Plan\n- [ ] Task  "

			const plan = extractPlanFromResponse(response)

			expect(plan).toBe("# Plan\n- [ ] Task")
		})
	})
})
