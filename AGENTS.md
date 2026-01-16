# AGENTS.md - Opencoder Development Guide

This file provides instructions for AI coding agents working in this repository.

## Project Overview

Opencoder is a native CLI application written in **Zig** that runs OpenCode CLI in a fully autonomous development loop. It creates plans and executes them continuously without stopping.

- **Language**: Zig (0.14.0+ required, 0.15.2 used in CI)
- **Dependencies**: Zig standard library only (no external dependencies)
- **Build System**: Zig build system (`build.zig`)

## Build Commands

### Using Make (Recommended)

```bash
make          # Build release version
make test     # Run all tests
make lint     # Format and check code
make clean    # Remove build artifacts
make install  # Install to /usr/local/bin (PREFIX configurable)
```

### Using Zig Directly

```bash
# Build debug version
zig build

# Build release version
zig build -Doptimize=ReleaseSafe

# Run the application
zig build run

# Run with arguments
zig build run -- --provider github --verbose
```

## Testing

```bash
# Run all tests
zig build test

# Run tests for a specific module
zig test src/config.zig
zig test src/cli.zig
zig test src/logger.zig
zig test src/fs.zig
zig test src/state.zig
zig test src/plan.zig
zig test src/executor.zig
zig test src/evaluator.zig
zig test src/loop.zig
```

**Note**: Zig does not support running individual tests by name. Tests are per-file.

## Linting and Formatting

```bash
# Check formatting (used in CI)
zig fmt --check src/

# Auto-format code
zig fmt src/

# Format a specific file
zig fmt src/config.zig
```

## Source Code Structure

```
src/
  main.zig        # Entry point, CLI orchestration
  cli.zig         # CLI argument parsing, help/usage text
  config.zig      # Configuration, provider presets, env vars
  state.zig       # Execution state persistence (JSON)
  fs.zig          # File system utilities
  logger.zig      # Logging infrastructure
  plan.zig        # Plan parsing, validation, markdown handling
  executor.zig    # OpenCode CLI process execution
  evaluator.zig   # Plan completion evaluation
  loop.zig        # Main autonomous execution loop
```

## Code Style Guidelines

### Imports

1. Standard library import always first: `const std = @import("std");`
2. Extract commonly used type aliases after std import
3. Internal module imports follow, grouped logically

```zig
const std = @import("std");
const Allocator = std.mem.Allocator;

const config = @import("config.zig");
const Logger = @import("logger.zig").Logger;
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | snake_case | `config.zig`, `fs.zig` |
| Types/Structs | PascalCase | `Logger`, `State`, `ExecutionResult` |
| Functions | camelCase | `runPlanning`, `markTaskComplete` |
| Constants | snake_case | `version`, `defaults` |
| Module variables | snake_case | `shutdown_requested` |

### Struct Patterns

```zig
pub const MyStruct = struct {
    field: Type,
    allocator: Allocator,

    /// Initialize - returns struct value
    pub fn init(allocator: Allocator) MyStruct {
        return MyStruct{
            .field = value,
            .allocator = allocator,
        };
    }

    /// Deinit - takes pointer for cleanup
    pub fn deinit(self: *MyStruct) void {
        // cleanup
    }

    /// Methods that mutate take pointer
    pub fn mutate(self: *MyStruct) void {
        self.field = new_value;
    }

    /// Read-only methods take value
    pub fn getValue(self: MyStruct) Type {
        return self.field;
    }
};
```

### Error Handling

- Define custom error sets as enums: `pub const ParseError = error{ InvalidArg, MissingValue };`
- Use `try` for error propagation
- Use `catch` with labeled blocks for explicit handling
- Use `errdefer` for cleanup on error paths

```zig
const result = fsutil.readFile(path, allocator) catch |err| {
    if (err == error.FileNotFound) {
        return null;
    }
    return err;
};
```

### Memory Management

- Functions accept `Allocator` parameter when allocation is needed
- Use `defer` for cleanup: `defer allocator.free(content);`
- Use `errdefer` for cleanup that should only run on error

```zig
pub fn process(allocator: Allocator) ![]u8 {
    const data = try allocator.alloc(u8, 1024);
    errdefer allocator.free(data);  // Only frees if error occurs

    // ... work with data ...

    return data;  // Caller owns memory
}
```

### Documentation

- File-level doc comments: `//!` at top of file
- Public API doc comments: `///` before declarations
- Inline comments: `//`

```zig
//! Module description goes here.
//! Additional context about the module.

/// Describe what this function does.
/// Explain parameters and return value.
pub fn myFunction() void {}
```

### Testing

Tests go at the bottom of each file, separated by a comment block:

```zig
// ============================================================================
// Tests
// ============================================================================

test "descriptive test name" {
    const allocator = std.testing.allocator;

    // Setup
    const result = try myFunction(allocator);
    defer allocator.free(result);

    // Assertions
    try std.testing.expectEqual(expected, result);
    try std.testing.expectEqualStrings("expected", actual);
    try std.testing.expect(condition);
    try std.testing.expectError(error.Expected, errorFn());
}
```

### String Handling

- Multi-line strings use `\\` syntax
- Buffer formatting with `std.fmt.bufPrint`
- Dynamic strings with `std.ArrayListUnmanaged(u8)`

```zig
// Fixed buffer formatting
var buf: [64]u8 = undefined;
const msg = std.fmt.bufPrint(&buf, "Value: {d}", .{value}) catch "fallback";

// Dynamic string building
var list = std.ArrayListUnmanaged(u8){};
defer list.deinit(allocator);
try list.appendSlice(allocator, "hello");
```

### Enum Patterns

Use `StaticStringMap` for string-to-enum conversion:

```zig
pub const Phase = enum {
    planning,
    execution,

    pub fn fromString(str: []const u8) ?Phase {
        const map = std.StaticStringMap(Phase).initComptime(.{
            .{ "planning", .planning },
            .{ "execution", .execution },
        });
        return map.get(str);
    }

    pub fn toString(self: Phase) []const u8 {
        return switch (self) {
            .planning => "planning",
            .execution => "execution",
        };
    }
};
```

## CI Pipeline

The GitHub Actions CI (`.github/workflows/ci.yml`) runs:
1. Build on Ubuntu and macOS
2. Run all unit tests
3. Check code formatting with `zig fmt --check src/`

Always ensure `zig fmt --check src/` passes before committing.
