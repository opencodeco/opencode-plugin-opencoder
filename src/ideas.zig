//! Ideas queue management for opencoder.
//!
//! Handles reading, listing, and removing idea files from the
//! .opencoder/ideas/ directory. Ideas are user-defined markdown files
//! that opencoder prioritizes before generating its own plans.

const std = @import("std");
const fs = std.fs;
const Allocator = std.mem.Allocator;

const fsutil = @import("fs.zig");

/// An idea loaded from the ideas directory
pub const Idea = struct {
    path: []const u8,
    filename: []const u8,
    content: []const u8,

    /// Free allocated memory for idea fields
    pub fn deinit(self: *Idea, allocator: Allocator) void {
        allocator.free(self.path);
        allocator.free(self.filename);
        allocator.free(self.content);
    }

    /// Get a summary of the idea (first line or truncated to ~100 chars)
    pub fn getSummary(self: Idea, allocator: Allocator) ![]const u8 {
        const trimmed = std.mem.trim(u8, self.content, " \t\n\r");
        if (trimmed.len == 0) {
            return try allocator.dupe(u8, "(empty)");
        }

        // Find first newline
        if (std.mem.indexOf(u8, trimmed, "\n")) |newline_pos| {
            const first_line = trimmed[0..newline_pos];
            if (first_line.len <= 100) {
                return try allocator.dupe(u8, first_line);
            }
            // Truncate first line if too long
            return try std.fmt.allocPrint(allocator, "{s}...", .{first_line[0..97]});
        }

        // No newline, use full content or truncate
        if (trimmed.len <= 100) {
            return try allocator.dupe(u8, trimmed);
        }
        return try std.fmt.allocPrint(allocator, "{s}...", .{trimmed[0..97]});
    }
};

/// List of ideas for AI selection
pub const IdeaList = struct {
    ideas: []Idea,
    allocator: Allocator,

    /// Free all ideas and the list
    pub fn deinit(self: *IdeaList) void {
        for (self.ideas) |*idea| {
            idea.deinit(self.allocator);
        }
        self.allocator.free(self.ideas);
    }
};

/// Load all valid ideas from the ideas directory
/// Returns null if no valid ideas exist
/// Skips and deletes empty or unreadable idea files
pub fn loadAllIdeas(ideas_dir: []const u8, allocator: Allocator, max_size: usize) !?IdeaList {
    var dir = fs.cwd().openDir(ideas_dir, .{ .iterate = true }) catch |err| {
        if (err == error.FileNotFound) return null;
        return err;
    };
    defer dir.close();

    var ideas = std.ArrayListUnmanaged(Idea){};
    errdefer {
        for (ideas.items) |*idea| {
            idea.deinit(allocator);
        }
        ideas.deinit(allocator);
    }

    var iter = dir.iterate();
    while (try iter.next()) |entry| {
        if (entry.kind != .file) continue;
        if (!std.mem.endsWith(u8, entry.name, ".md")) continue;

        const full_path = try std.fs.path.join(allocator, &.{ ideas_dir, entry.name });
        errdefer allocator.free(full_path);

        // Try to read the file
        const content = fsutil.readFile(full_path, allocator, max_size) catch {
            // Skip unreadable files, but delete them
            allocator.free(full_path);
            removeIdea(ideas_dir, entry.name) catch {};
            continue;
        };

        // Skip empty files, delete them
        const trimmed = std.mem.trim(u8, content, " \t\n\r");
        if (trimmed.len == 0) {
            allocator.free(content);
            allocator.free(full_path);
            removeIdea(ideas_dir, entry.name) catch {};
            continue;
        }

        const filename = try allocator.dupe(u8, entry.name);
        errdefer allocator.free(filename);

        try ideas.append(allocator, Idea{
            .path = full_path,
            .filename = filename,
            .content = content,
        });
    }

    if (ideas.items.len == 0) {
        ideas.deinit(allocator);
        return null;
    }

    return IdeaList{
        .ideas = try ideas.toOwnedSlice(allocator),
        .allocator = allocator,
    };
}

/// Remove an idea file from the ideas directory
pub fn removeIdea(ideas_dir: []const u8, filename: []const u8) !void {
    var dir = try fs.cwd().openDir(ideas_dir, .{});
    defer dir.close();
    try dir.deleteFile(filename);
}

/// Remove an idea by its full path
pub fn removeIdeaByPath(path: []const u8) !void {
    try fs.cwd().deleteFile(path);
}

/// Format ideas for AI selection prompt
/// Returns a formatted string listing all ideas with their content
pub fn formatIdeasForSelection(ideas: []const Idea, allocator: Allocator) ![]const u8 {
    var result = std.ArrayListUnmanaged(u8){};
    errdefer result.deinit(allocator);

    for (ideas, 0..) |idea, i| {
        try result.writer(allocator).print("## Idea {d}: {s}\n\n", .{ i + 1, idea.filename });
        try result.appendSlice(allocator, idea.content);
        try result.appendSlice(allocator, "\n\n---\n\n");
    }

    return result.toOwnedSlice(allocator);
}

// ============================================================================
// Tests
// ============================================================================

test "Idea.getSummary returns first line" {
    const allocator = std.testing.allocator;

    const idea = Idea{
        .path = "/test/path.md",
        .filename = "test.md",
        .content = "First line of idea\nSecond line\nThird line",
    };

    const summary = try idea.getSummary(allocator);
    defer allocator.free(summary);

    try std.testing.expectEqualStrings("First line of idea", summary);
}

test "Idea.getSummary truncates long first line" {
    const allocator = std.testing.allocator;

    var long_line: [150]u8 = undefined;
    @memset(&long_line, 'a');

    const idea = Idea{
        .path = "/test/path.md",
        .filename = "test.md",
        .content = &long_line,
    };

    const summary = try idea.getSummary(allocator);
    defer allocator.free(summary);

    try std.testing.expect(summary.len == 100); // 97 chars + "..."
    try std.testing.expect(std.mem.endsWith(u8, summary, "..."));
}

test "Idea.getSummary handles empty content" {
    const allocator = std.testing.allocator;

    const idea = Idea{
        .path = "/test/path.md",
        .filename = "test.md",
        .content = "   \n\t  ",
    };

    const summary = try idea.getSummary(allocator);
    defer allocator.free(summary);

    try std.testing.expectEqualStrings("(empty)", summary);
}

test "loadAllIdeas returns null for nonexistent directory" {
    const allocator = std.testing.allocator;
    const result = try loadAllIdeas("/nonexistent/ideas", allocator, 1024 * 1024);
    try std.testing.expectEqual(@as(?IdeaList, null), result);
}

test "loadAllIdeas returns null for empty directory" {
    const allocator = std.testing.allocator;
    const test_dir = "/tmp/opencoder_test_ideas_empty";

    // Clean up and create empty directory
    fs.cwd().deleteTree(test_dir) catch {};
    try fs.cwd().makePath(test_dir);
    defer fs.cwd().deleteTree(test_dir) catch {};

    const result = try loadAllIdeas(test_dir, allocator, 1024 * 1024);
    try std.testing.expectEqual(@as(?IdeaList, null), result);
}

test "loadAllIdeas skips non-markdown files" {
    const allocator = std.testing.allocator;
    const test_dir = "/tmp/opencoder_test_ideas_skip";

    // Setup
    fs.cwd().deleteTree(test_dir) catch {};
    try fs.cwd().makePath(test_dir);
    defer fs.cwd().deleteTree(test_dir) catch {};

    // Create non-markdown file
    const txt_path = try std.fs.path.join(allocator, &.{ test_dir, "readme.txt" });
    defer allocator.free(txt_path);
    try fsutil.writeFile(txt_path, "This is not markdown");

    const result = try loadAllIdeas(test_dir, allocator, 1024 * 1024);
    try std.testing.expectEqual(@as(?IdeaList, null), result);
}

test "loadAllIdeas loads valid ideas" {
    const allocator = std.testing.allocator;
    const test_dir = "/tmp/opencoder_test_ideas_valid";

    // Setup
    fs.cwd().deleteTree(test_dir) catch {};
    try fs.cwd().makePath(test_dir);
    defer fs.cwd().deleteTree(test_dir) catch {};

    // Create valid idea files
    const idea1_path = try std.fs.path.join(allocator, &.{ test_dir, "idea1.md" });
    defer allocator.free(idea1_path);
    try fsutil.writeFile(idea1_path, "First idea content");

    const idea2_path = try std.fs.path.join(allocator, &.{ test_dir, "idea2.md" });
    defer allocator.free(idea2_path);
    try fsutil.writeFile(idea2_path, "Second idea content");

    const result = try loadAllIdeas(test_dir, allocator, 1024 * 1024);
    try std.testing.expect(result != null);

    var list = result.?;
    defer list.deinit();

    try std.testing.expectEqual(@as(usize, 2), list.ideas.len);
}

test "loadAllIdeas deletes empty idea files" {
    const allocator = std.testing.allocator;
    const test_dir = "/tmp/opencoder_test_ideas_empty_file";

    // Setup
    fs.cwd().deleteTree(test_dir) catch {};
    try fs.cwd().makePath(test_dir);
    defer fs.cwd().deleteTree(test_dir) catch {};

    // Create empty idea file
    const empty_path = try std.fs.path.join(allocator, &.{ test_dir, "empty.md" });
    defer allocator.free(empty_path);
    try fsutil.writeFile(empty_path, "   \n  ");

    // Should return null and delete the empty file
    const result = try loadAllIdeas(test_dir, allocator, 1024 * 1024);
    try std.testing.expectEqual(@as(?IdeaList, null), result);

    // Verify file was deleted
    try std.testing.expect(!fsutil.fileExists(empty_path));
}

test "formatIdeasForSelection formats correctly" {
    const allocator = std.testing.allocator;

    const ideas = [_]Idea{
        .{
            .path = "/test/idea1.md",
            .filename = "idea1.md",
            .content = "Content of idea 1",
        },
        .{
            .path = "/test/idea2.md",
            .filename = "idea2.md",
            .content = "Content of idea 2",
        },
    };

    const formatted = try formatIdeasForSelection(&ideas, allocator);
    defer allocator.free(formatted);

    try std.testing.expect(std.mem.indexOf(u8, formatted, "## Idea 1: idea1.md") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "## Idea 2: idea2.md") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "Content of idea 1") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "Content of idea 2") != null);
}

test "removeIdeaByPath deletes file" {
    const allocator = std.testing.allocator;
    const test_path = "/tmp/opencoder_test_remove_idea.md";

    // Create test file
    try fsutil.writeFile(test_path, "Test idea");
    try std.testing.expect(fsutil.fileExists(test_path));

    // Remove it
    try removeIdeaByPath(test_path);

    // Verify deletion
    try std.testing.expect(!fsutil.fileExists(test_path));

    _ = allocator;
}
