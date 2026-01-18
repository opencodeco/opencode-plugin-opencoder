# Contributing to OpenCoder

Thank you for your interest in contributing to OpenCoder! This document provides guidelines and instructions for getting started with development, submitting changes, and maintaining code quality.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Code Review](#code-review)

## Getting Started

Before you start contributing, please:

1. **Read the README.md** - Understand what OpenCoder does and how it works
2. **Familiarize yourself with the project structure** - See the [Source Code Structure section](#source-code-structure) below
3. **Fork and clone the repository** - Create your own fork for development
4. **Check open issues** - Look for issues marked `good first issue` or areas you'd like to work on

## Development Setup

### Prerequisites

- **Bun 1.0+** - [Install Bun](https://bun.sh)
- **Node.js 18+** (for type checking compatibility)
- **Git** - For version control

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/opencoder.git
cd opencoder

# Install dependencies
bun install

# Verify setup (run tests)
bun test

# Build the project
bun run build
```

### Development Commands

```bash
# Run the CLI in development mode
bun run dev

# Run with arguments
bun run dev -- --model anthropic/claude-sonnet-4 -p ./test-project

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Run tests for a specific file
bun test tests/config.test.ts

# Watch mode (re-run tests on file changes)
bun test --watch

# Check code formatting and linting
bunx biome check src/ tests/

# Auto-fix formatting and linting issues
bunx biome check --write src/ tests/

# Format code
bunx biome format --write src/ tests/

# Build release executable
bun run build

# Clean build artifacts
make clean
```

## Source Code Structure

Understanding the codebase helps with making targeted contributions:

```
opencoder/
├── src/                      # Source code (TypeScript)
│   ├── index.ts             # Entry point and CLI setup
│   ├── cli.ts               # Command-line argument parsing
│   ├── config.ts            # Configuration loading and merging
│   ├── types.ts             # TypeScript interfaces and types
│   ├── state.ts             # State persistence (JSON)
│   ├── fs.ts                # File system utilities
│   ├── logger.ts            # Logging and output streaming
│   ├── plan.ts              # Plan parsing and validation
│   ├── ideas.ts             # Ideas queue management
│   ├── build.ts             # OpenCode SDK integration
│   ├── eval.ts              # Evaluation phase logic
│   ├── loop.ts              # Main autonomous loop
│   ├── metrics.ts           # Metrics tracking and reporting
│   └── git.ts               # Git operations
│
├── tests/                   # Test files (Bun test format)
│   ├── config.test.ts       # Config module tests
│   ├── state.test.ts        # State persistence tests
│   ├── plan.test.ts         # Plan parsing tests
│   ├── ideas.test.ts        # Ideas queue tests
│   ├── eval.test.ts         # Evaluation logic tests
│   ├── git.test.ts          # Git operations tests
│   └── ...                  # Other module tests
│
├── .github/workflows/       # GitHub Actions CI/CD
│   ├── ci.yml              # Build, test, lint, and coverage
│   └── release.yml         # Release automation
│
├── .opencode/              # Runtime and configuration directory
│   └── opencoder/
│       ├── config.json     # User configuration (optional)
│       ├── state.json      # Current state (auto-generated)
│       ├── metrics.json    # Metrics tracking (auto-generated)
│       ├── ideas/          # Queue for task ideas
│       ├── history/        # Completed plans archive
│       └── logs/           # Development logs
│
├── Makefile                # Build shortcuts
├── package.json            # Dependencies and scripts
├── biome.json              # Code formatter and linter config
├── README.md               # Project documentation
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # This file
└── LICENSE                 # MIT License
```

## Code Style Guide

### TypeScript Conventions

#### Imports

Follow this order for imports (enforced by Biome):

1. Node.js built-in imports (with `node:` prefix)
2. External package imports
3. Internal module imports (with `.ts` extension)

```typescript
// Good
import { existsSync } from "node:fs"
import { join } from "node:path"

import { createOpencode } from "@opencode-ai/sdk"
import { Command } from "commander"

import { parseModel } from "./config.ts"
import type { Config, BuildResult } from "./types.ts"

// Avoid: mixing import groups
import { parseModel } from "./config.ts"
import { existsSync } from "node:fs"
import { Command } from "commander"
```

#### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case or camelCase | `config.ts`, `fs.ts`, `state.ts` |
| Interfaces/Types | PascalCase | `Config`, `State`, `BuildResult` |
| Classes | PascalCase | `Logger`, `Builder`, `Metrics` |
| Functions | camelCase | `runPlan()`, `markTaskComplete()` |
| Constants | SCREAMING_SNAKE_CASE or camelCase | `DEFAULT_RETRY_COUNT`, `configFile` |
| Variables | camelCase | `currentTask`, `isComplete`, `shutdownRequested` |
| Private members | camelCase with `private` keyword | `private retryCount` |

#### Type Safety

- Prefer `interface` for object shapes
- Use `type` for unions, mapped types, and function signatures
- Avoid `any` - use `unknown` when truly unknown, otherwise be specific
- Use proper null checks instead of non-null assertions (`!`)

```typescript
// Good: Type-safe code
interface User {
  id: string
  name: string
  email?: string  // optional field
}

type Status = "pending" | "complete" | "error"

const user = users[0]
if (!user) return null

// Avoid: Using any or non-null assertions
const user: any = getUser()
const name = users[0]!  // bad - non-null assertion
```

#### Class Patterns

Follow this structure for class definitions:

```typescript
/**
 * Brief description of the class purpose
 */
export class MyClass {
  private field: string
  private logger: Logger

  constructor(config: Config, logger: Logger) {
    this.field = config.value
    this.logger = logger
  }

  /** Initialize async resources like API connections */
  async init(): Promise<void> {
    // async initialization
  }

  /** Clean up resources on shutdown */
  async shutdown(): Promise<void> {
    // cleanup
  }

  /** Public method with clear documentation */
  async doSomething(input: string): Promise<Result> {
    this.logger.logVerbose(`Processing: ${input}`)
    return this.processInternal(input)
  }

  /** Private helper method */
  private processInternal(input: string): Result {
    // internal logic
  }
}
```

#### Error Handling

- Use try/catch for async operations
- Throw descriptive Error objects with context
- Use optional chaining and nullish coalescing
- Log errors with appropriate context

```typescript
// Good: Descriptive error handling
try {
  const result = await someAsyncOperation()
  return result
} catch (err) {
  logger.logError(`Operation failed: ${err}`)
  throw new Error(`Failed to complete operation: ${err instanceof Error ? err.message : String(err)}`)
}

// Safe access patterns
const value = obj?.nested?.property ?? defaultValue
const item = array.at(0)
if (!item) return null
```

#### Documentation

Use JSDoc comments for public APIs and complex logic:

```typescript
/**
 * Parse model specification string into provider and model IDs.
 * @param modelSpec - Model specification string (format: "provider/model")
 * @returns Parsed model specification with provider and model IDs
 * @throws Error if model spec format is invalid
 */
export function parseModel(modelSpec: string): ModelSpec {
  const [provider, model] = modelSpec.split("/")
  if (!provider || !model) {
    throw new Error(`Invalid model spec format: ${modelSpec}. Expected "provider/model"`)
  }
  return { providerID: provider, modelID: model }
}

/**
 * Module-level documentation describing the purpose.
 * File: src/config.ts
 * Handles loading and merging configuration from multiple sources.
 */
```

### Formatting Rules

The project uses **Biome** for code formatting and linting. Key rules:

- **Line length**: 100 characters (soft limit)
- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Required at end of statements
- **Trailing commas**: In multi-line structures
- **Spaces**: Around operators and after keywords

```typescript
// Good: Formatted correctly
const config: Config = {
  planModel: "anthropic/claude-sonnet-4",
  buildModel: "anthropic/claude-sonnet-4",
  verbose: false,
}

if (config.verbose) {
  logger.log("Verbose mode enabled")
}

// Run Biome to auto-fix most issues
bunx biome check --write src/
```

## Testing

### Writing Tests

Tests use **Bun's test runner** with a structure similar to Jest:

```typescript
import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { myFunction } from "../src/module.ts"

describe("module", () => {
  let testData: any

  beforeEach(() => {
    // Setup before each test
    testData = { value: 42 }
  })

  afterEach(() => {
    // Cleanup after each test
    testData = null
  })

  describe("myFunction", () => {
    test("returns correct result", () => {
      const result = myFunction(testData.value)
      expect(result).toBe(expected)
    })

    test("handles error cases", () => {
      expect(() => myFunction(null)).toThrow()
    })

    test("works with async operations", async () => {
      const result = await myFunction(input)
      expect(result).toEqual(expectedResult)
    })
  })
})
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests for specific file
bun test tests/config.test.ts

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch

# Run only tests matching a pattern
bun test --test-name-pattern "should handle errors"
```

### Test Coverage Expectations

- **Target**: 75%+ line coverage
- **Critical paths**: 100% coverage for core logic
- **Current coverage**: 72%+ (see `make test-coverage`)
- **View report**: `bun test --coverage` generates a text report

New contributions should:
- Include tests for new functionality
- Maintain or improve existing coverage percentages
- Test both happy path and error cases
- Use descriptive test names

## Git Workflow

### Branch Naming

Use descriptive branch names with a prefix:

```bash
# Features and enhancements
git checkout -b feat/add-dark-mode

# Bug fixes
git checkout -b fix/login-timeout-issue

# Documentation
git checkout -b docs/add-api-examples

# Refactoring
git checkout -b refactor/simplify-config-loading

# Tests
git checkout -b test/add-coverage-for-metrics

# Chores
git checkout -b chore/update-dependencies
```

### Keep Your Fork Updated

```bash
# Add upstream remote
git remote add upstream https://github.com/opencodeco/opencoder.git

# Fetch latest changes
git fetch upstream

# Rebase your branch on main
git rebase upstream/main

# Force push (use with caution, only on your fork)
git push origin your-branch -f
```

## Commit Messages

OpenCoder follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (correlates with MINOR in SemVer)
- **fix**: A bug fix (correlates with PATCH in SemVer)
- **docs**: Documentation-only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Code changes that improve performance
- **test**: Adding or updating tests
- **build**: Changes to build system, dependencies, or scripts
- **chore**: Other changes that don't modify source or test files
- **ci**: Changes to CI/CD configuration

### Examples

```bash
# Simple feature
git commit -s -m "feat: add metrics dashboard endpoint"

# With scope
git commit -s -m "fix(auth): resolve token expiration issue"

# With body for more context
git commit -s -m "refactor: simplify state loading logic

- Remove nested conditionals
- Extract validation to separate function
- Improve error messages"

# Breaking change
git commit -s -m "feat!: change API response format

BREAKING CHANGE: responses now return array instead of object"
```

### Signoff (DCO)

All commits must be signed off with `-s` flag for Developer Certificate of Origin (DCO):

```bash
git commit -s -m "feat: add new feature"
```

This adds a `Signed-off-by: Your Name <your.email@example.com>` line to your commit message, certifying that you have the right to submit the work under the project's license.

## Pull Requests

### Before Creating a PR

1. **Check existing PRs** - Make sure no one else is working on the same thing
2. **Create an issue first** - For substantial changes, discuss the approach
3. **Run tests locally** - Ensure `bun test` passes
4. **Run linting** - Ensure `bunx biome check --write src/ tests/` passes
5. **Update CHANGELOG.md** - Document your changes (if applicable)

### Creating a PR

Use the Conventional Commits format for PR titles:

```
feat(scope): description
fix: description
docs: description
refactor: description
```

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Type
- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Tests

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Added/updated tests
- [ ] All tests pass locally
- [ ] Test coverage maintained or improved

## Checklist
- [ ] Followed code style guidelines
- [ ] Updated documentation (if needed)
- [ ] Commits are properly signed (`git commit -s`)
- [ ] CHANGELOG.md updated (if applicable)
```

### PR Labels

Apply appropriate labels to your PR for easier categorization:

- **bug** - Bug fix
- **enhancement** - New feature or improvement
- **documentation** - Documentation changes
- **good first issue** - Good for newcomers
- **help wanted** - Seeking contributions
- **refactor** - Code refactoring

## Code Review

### What to Expect

When you submit a PR:

1. **CI checks must pass** - All GitHub Actions workflows must succeed
2. **Code review** - A maintainer will review your code
3. **Requested changes** - You may be asked to make adjustments
4. **Approval** - Once approved, your PR can be merged

### Responding to Feedback

- Be respectful and professional
- Ask questions if feedback is unclear
- Push additional commits for requested changes (don't force push)
- Resolve conversations once addressed

### Reviewing Others' PRs

If you're reviewing others' code:

1. **Check functionality** - Does it do what the PR claims?
2. **Verify tests** - Are new features covered by tests?
3. **Review code style** - Does it follow project guidelines?
4. **Suggest improvements** - Be constructive and clear
5. **Approve when ready** - Use GitHub's approval feature

## Questions or Need Help?

- **Read AGENTS.md** - Additional technical guidelines for development
- **Check existing issues** - Your question might already be answered
- **Open a discussion** - Use GitHub Discussions for general questions
- **Report bugs** - Open an issue with a clear description and reproduction steps

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## License

By contributing to OpenCoder, you agree that your contributions will be licensed under its [MIT License](LICENSE).

---

Thank you for contributing to OpenCoder! Your help makes this project better for everyone. 🎉
