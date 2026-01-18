//! Input validation and sanitization for opencoder.
//!
//! Provides validation and sanitization functions for user-provided
//! paths, hints, model names, and idea content to prevent security
//! issues and ensure data integrity.

const std = @import("std");
const Allocator = std.mem.Allocator;

pub const ValidationError = error{
    InvalidPath,
    PathTraversal,
    PathTooLong,
    InvalidCharacter,
    ContentTooLong,
    InvalidModelName,
};

const MAX_PATH_LENGTH = 4096;
const MAX_HINT_LENGTH = 2048;
const MAX_IDEA_LENGTH = 8192;
const MAX_MODEL_NAME_LENGTH = 256;

fn isValidPathChar(c: u8) bool {
    return switch (c) {
        'a'...'z', 'A'...'Z', '0'...'9', '-', '_', '.', '/', '\\' => true,
        else => false,
    };
}

fn containsControlCharacter(str: []const u8) bool {
    for (str) |c| {
        if (c < 32 and c != '\n' and c != '\r' and c != '\t') {
            return true;
        }
    }
    return false;
}

pub fn validateAndSanitizePath(path: []const u8, allocator: Allocator) ![]const u8 {
    if (path.len == 0) {
        return ValidationError.InvalidPath;
    }

    if (path.len > MAX_PATH_LENGTH) {
        return ValidationError.PathTooLong;
    }

    if (std.mem.indexOf(u8, path, "..") != null) {
        return ValidationError.PathTraversal;
    }

    for (path) |c| {
        if (!isValidPathChar(c)) {
            return ValidationError.InvalidCharacter;
        }
    }

    return allocator.dupe(u8, path);
}

pub fn sanitizePathInput(path: []const u8) []const u8 {
    var result: [MAX_PATH_LENGTH]u8 = undefined;
    var j: usize = 0;

    for (path) |c| {
        if (j >= MAX_PATH_LENGTH - 1) break;
        if (isValidPathChar(c)) {
            result[j] = c;
            j += 1;
        }
    }

    return result[0..j];
}

pub fn validateAndSanitizeHint(hint: []const u8, allocator: Allocator) ![]const u8 {
    if (hint.len > MAX_HINT_LENGTH) {
        return ValidationError.ContentTooLong;
    }

    if (containsControlCharacter(hint)) {
        return ValidationError.InvalidCharacter;
    }

    var result = std.ArrayListUnmanaged(u8){};
    errdefer result.deinit(allocator);

    for (hint) |c| {
        switch (c) {
            '\n', '\r', '\t' => {
                try result.append(allocator, ' ');
            },
            else => {
                if (c >= 32) {
                    try result.append(allocator, c);
                }
            },
        }
    }

    return result.toOwnedSlice(allocator);
}

pub fn sanitizeHintInput(hint: []const u8, allocator: Allocator) ![]const u8 {
    if (hint.len > MAX_HINT_LENGTH) {
        return ValidationError.ContentTooLong;
    }

    var result = std.ArrayListUnmanaged(u8){};
    errdefer result.deinit(allocator);

    for (hint) |c| {
        switch (c) {
            '\n', '\r', '\t' => {
                try result.append(allocator, ' ');
            },
            else => {
                if (c >= 32) {
                    try result.append(allocator, c);
                }
            },
        }
    }

    return result.toOwnedSlice(allocator);
}

pub fn validateModelName(name: []const u8) !void {
    if (name.len == 0 or name.len > MAX_MODEL_NAME_LENGTH) {
        return ValidationError.InvalidModelName;
    }

    for (name) |c| {
        if (!isValidModelNameChar(c)) {
            return ValidationError.InvalidCharacter;
        }
    }
}

fn isValidModelNameChar(c: u8) bool {
    return switch (c) {
        'a'...'z', 'A'...'Z', '0'...'9', '-', '_', '.', '/', ':', '@' => true,
        else => false,
    };
}

pub fn validateAndSanitizeIdeaContent(content: []const u8, allocator: Allocator) ![]const u8 {
    if (content.len > MAX_IDEA_LENGTH) {
        return ValidationError.ContentTooLong;
    }

    if (containsControlCharacter(content)) {
        return ValidationError.InvalidCharacter;
    }

    var result = std.ArrayListUnmanaged(u8){};
    errdefer result.deinit(allocator);

    for (content) |c| {
        switch (c) {
            '\n', '\r', '\t' => {
                try result.append(allocator, ' ');
            },
            else => {
                if (c >= 32) {
                    try result.append(allocator, c);
                }
            },
        }
    }

    return result.toOwnedSlice(allocator);
}

pub fn sanitizeStringInput(str: []const u8, max_len: usize, allocator: Allocator) ![]const u8 {
    if (str.len > max_len) {
        return ValidationError.ContentTooLong;
    }

    var result = std.ArrayListUnmanaged(u8){};
    errdefer result.deinit(allocator);

    for (str) |c| {
        if (c >= 32) {
            try result.append(allocator, c);
        } else switch (c) {
            '\n', '\r', '\t' => try result.append(allocator, ' '),
            else => {},
        }
    }

    return result.toOwnedSlice(allocator);
}

test "validateAndSanitizePath accepts valid paths" {
    const allocator = std.testing.allocator;

    const result = try validateAndSanitizePath("/tmp/project", allocator);
    defer allocator.free(result);

    try std.testing.expectEqualStrings("/tmp/project", result);
}

test "validateAndSanitizePath rejects empty path" {
    const allocator = std.testing.allocator;
    const result = validateAndSanitizePath("", allocator);
    try std.testing.expectError(ValidationError.InvalidPath, result);
}

test "validateAndSanitizePath rejects path traversal" {
    const allocator = std.testing.allocator;
    const result = validateAndSanitizePath("../etc/passwd", allocator);
    try std.testing.expectError(ValidationError.PathTraversal, result);

    const result2 = validateAndSanitizePath("foo/../../bar", allocator);
    try std.testing.expectError(ValidationError.PathTraversal, result2);
}

test "validateAndSanitizePath rejects invalid characters" {
    const allocator = std.testing.allocator;
    const result = validateAndSanitizePath("/tmp/project\x00file", allocator);
    try std.testing.expectError(ValidationError.InvalidCharacter, result);
}

test "validateAndSanitizePath rejects too long paths" {
    const allocator = std.testing.allocator;

    var long_path: [MAX_PATH_LENGTH + 1]u8 = undefined;
    @memset(&long_path, 'a');

    const result = validateAndSanitizePath(&long_path, allocator);
    try std.testing.expectError(ValidationError.PathTooLong, result);
}

test "sanitizePathInput filters invalid characters" {
    const result = sanitizePathInput("/tmp/project\x00bad\x01file");
    try std.testing.expectEqualStrings("/tmp/projectbadfile", result);
}

test "validateAndSanitizeHint sanitizes control characters" {
    const allocator = std.testing.allocator;

    const result = try validateAndSanitizeHint("hello\tworld\ntest\r", allocator);
    defer allocator.free(result);

    try std.testing.expectEqualStrings("hello world test ", result);
}

test "validateAndSanitizeHint rejects control characters" {
    const allocator = std.testing.allocator;
    const result = validateAndSanitizeHint("hello\x01world", allocator);
    try std.testing.expectError(ValidationError.InvalidCharacter, result);
}

test "validateAndSanitizeHint rejects too long hints" {
    const allocator = std.testing.allocator;

    var long_hint: [MAX_HINT_LENGTH + 1]u8 = undefined;
    @memset(&long_hint, 'a');

    const result = validateAndSanitizeHint(&long_hint, allocator);
    try std.testing.expectError(ValidationError.ContentTooLong, result);
}

test "validateModelName accepts valid model names" {
    try validateModelName("anthropic/claude-opus-4-5");
    try validateModelName("github-copilot/claude-sonnet-4.5");
    try validateModelName("provider/model-v1.2.3");
    try validateModelName("openai/gpt-4");
}

test "validateModelName rejects empty model names" {
    const result = validateModelName("");
    try std.testing.expectError(ValidationError.InvalidModelName, result);
}

test "validateModelName rejects too long model names" {
    var long_name: [MAX_MODEL_NAME_LENGTH + 1]u8 = undefined;
    @memset(&long_name, 'a');

    const result = validateModelName(&long_name);
    try std.testing.expectError(ValidationError.InvalidModelName, result);
}

test "validateModelName rejects invalid characters" {
    const result = validateModelName("model with spaces");
    try std.testing.expectError(ValidationError.InvalidCharacter, result);

    const result2 = validateModelName("model<script>");
    try std.testing.expectError(ValidationError.InvalidCharacter, result2);
}

test "validateAndSanitizeIdeaContent works correctly" {
    const allocator = std.testing.allocator;

    const content = "Idea with\nmultiple\tlines\rand content";
    const result = try validateAndSanitizeIdeaContent(content, allocator);
    defer allocator.free(result);

    try std.testing.expectEqualStrings("Idea with multiple lines and content", result);
}

test "validateAndSanitizeIdeaContent rejects control characters" {
    const allocator = std.testing.allocator;
    const result = validateAndSanitizeIdeaContent("idea\x1b[31mcolored", allocator);
    try std.testing.expectError(ValidationError.InvalidCharacter, result);
}

test "sanitizeStringInput sanitizes and limits input" {
    const allocator = std.testing.allocator;

    const result = try sanitizeStringInput("test\x01string\nwith\tcontrol", 100, allocator);
    defer allocator.free(result);

    try std.testing.expectEqualStrings("teststring with control", result);
}

test "sanitizeStringInput enforces max length" {
    const allocator = std.testing.allocator;

    var long_input: [50]u8 = undefined;
    @memset(&long_input, 'a');

    const result = sanitizeStringInput(&long_input, 40, allocator);
    try std.testing.expectError(ValidationError.ContentTooLong, result);
}
