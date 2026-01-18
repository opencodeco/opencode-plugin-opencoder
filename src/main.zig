//! opencoder - Autonomous OpenCode Runner
//!
//! A native application that runs opencode CLI in a fully autonomous way,
//! creating plans and executing them continuously without stopping.
//!
//! Usage:
//!   opencoder --provider PROVIDER [OPTIONS] [HINT]
//!   opencoder -P MODEL -E MODEL [OPTIONS] [HINT]

const std = @import("std");

const cli = @import("cli.zig");
const config = @import("config.zig");
const state = @import("state.zig");
const fsutil = @import("fs.zig");
const Logger = @import("logger.zig").Logger;
const Executor = @import("executor.zig").Executor;
const loop = @import("loop.zig");

const stdout_file = std.fs.File{ .handle = std.posix.STDOUT_FILENO };
const stderr_file = std.fs.File{ .handle = std.posix.STDERR_FILENO };

pub fn main() !void {
    // Use general purpose allocator
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Parse command-line arguments
    const parse_result = cli.parse(allocator) catch |err| {
        cli.formatError(err, stderr_file);
        std.process.exit(1);
    };

    // Handle help/version
    switch (parse_result) {
        .help => {
            cli.printUsage(stdout_file);
            return;
        },
        .version => {
            cli.printVersion(stdout_file);
            return;
        },
        .run => |cfg| {
            try runOpencoder(cfg, allocator);
        },
    }
}

fn runOpencoder(cfg: config.Config, allocator: std.mem.Allocator) !void {
    // Print banner
    var banner_buf: [128]u8 = undefined;
    const banner = std.fmt.bufPrint(&banner_buf, "\nopencoder v{s} - Autonomous OpenCode Runner\n\n", .{config.version}) catch "opencoder\n";
    _ = stdout_file.write(banner) catch {};

    // Initialize directories
    _ = stdout_file.write("Initializing workspace...\n") catch {};
    var paths = fsutil.initDirectories(cfg.project_dir, allocator) catch |err| {
        _ = stderr_file.write("\nFailed to initialize workspace directories\n") catch {};
        _ = stderr_file.write("This is required for opencoder to function properly.\n\n") catch {};
        return err;
    };
    defer paths.deinit();

    // Initialize logger
    var log = Logger.init(paths.opencoder_dir, cfg.verbose, allocator, cfg.log_buffer_size) catch |err| {
        _ = stderr_file.write("\nError: Failed to initialize logging system\n") catch {};
        var err_buf: [128]u8 = undefined;
        const err_msg = std.fmt.bufPrint(&err_buf, "Reason: {s}\n", .{@errorName(err)}) catch "Unknown error\n";
        _ = stderr_file.write(err_msg) catch {};
        _ = stderr_file.write("\nPossible causes:\n") catch {};
        _ = stderr_file.write("  - Cannot create log files in .opencoder/logs/\n") catch {};
        _ = stderr_file.write("  - Insufficient disk space\n") catch {};
        _ = stderr_file.write("  - Permission issues\n") catch {};
        return err;
    };
    defer log.deinit();

    log.say("Workspace initialized");

    // Load or create state
    var st = blk: {
        if (try state.State.load(paths.state_file, allocator, cfg.max_file_size)) |loaded| {
            log.sayFmt("Resuming: Cycle {d}, Phase {s}", .{
                loaded.cycle,
                loaded.phase.toString(),
            });
            break :blk loaded;
        } else {
            log.say("Starting fresh (no previous state)");
            break :blk state.State.default();
        }
    };

    // Recalculate task counts if resuming with existing plan
    if (fsutil.fileExists(paths.current_plan)) {
        const plan_content = fsutil.readFile(paths.current_plan, allocator, cfg.max_file_size) catch null;
        if (plan_content) |content| {
            defer allocator.free(content);
            const plan_mod = @import("plan.zig");
            st.total_tasks = plan_mod.countTotalTasks(content);
            st.current_task_num = plan_mod.countCompletedTasks(content);
            log.logFmt("Recalculated: {d} completed of {d} total tasks", .{
                st.current_task_num,
                st.total_tasks,
            });
        }
    }

    // Setup signal handlers
    loop.setupSignalHandlers();

    // Initialize executor
    var executor = Executor.init(&cfg, &log, allocator);
    defer executor.deinit();

    // Run main loop
    var main_loop = loop.Loop.init(&cfg, &st, &paths, &log, &executor, allocator);
    main_loop.run() catch |err| {
        log.logError("");
        log.logErrorFmt("Main loop terminated with error: {s}", .{@errorName(err)});
        log.logError("");
        log.logError("Troubleshooting steps:");
        log.logError("  1. Check .opencoder/logs/main.log for detailed error messages");
        log.logError("  2. Verify opencode CLI is accessible: which opencode");
        log.logError("  3. Ensure API credentials are configured correctly");
        log.logError("  4. Check network connectivity");
        log.logError("  5. Review .opencoder/alerts.log for critical alerts");
        log.logError("");
        log.logError("State has been saved and can be resumed by running opencoder again");
    };

    // Save final state
    st.save(paths.state_file, allocator) catch |err| {
        log.logError("");
        log.logErrorFmt("Warning: Failed to save final state: {s}", .{@errorName(err)});
        log.logError("Progress may not be fully persisted for next run");
        log.logErrorFmt("State file: {s}", .{paths.state_file});
        log.logError("Check file permissions and disk space");
    };

    // Clean up state
    st.deinit(allocator);

    log.say("");
    log.say("Opencoder stopped");
}

// Re-export for tests
test {
    _ = @import("config.zig");
    _ = @import("cli.zig");
    _ = @import("logger.zig");
    _ = @import("fs.zig");
    _ = @import("state.zig");
    _ = @import("plan.zig");
    _ = @import("executor.zig");
    _ = @import("evaluator.zig");
    _ = @import("loop.zig");
    _ = @import("validate.zig");
}
