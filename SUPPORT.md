# Support and Getting Help

Thank you for using OpenCoder! This document explains how to get help, report issues, and find resources.

## Table of Contents

- [Quick Links](#quick-links)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Reporting Issues](#reporting-issues)
- [Asking Questions](#asking-questions)
- [Contributing Ideas](#contributing-ideas)
- [Getting Community Help](#getting-community-help)
- [Security Issues](#security-issues)

## Quick Links

| Need | Resource | Link |
|------|----------|------|
| Getting Started | README | [README.md](README.md) |
| Installation Help | CONTRIBUTING | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Usage Examples | Examples | [examples/](examples/) |
| API Reference | Code Documentation | [docs/](docs/) |
| Coverage Reports | Coverage Guide | [docs/COVERAGE.md](docs/COVERAGE.md) |
| Project Direction | Governance | [GOVERNANCE.md](GOVERNANCE.md) |
| Community Rules | Code of Conduct | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

## Documentation

### Finding Documentation

1. **README.md** - Project overview and quick start
2. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development setup and guidelines
3. **[examples/](examples/)** - Real-world configuration examples
4. **[docs/COVERAGE.md](docs/COVERAGE.md)** - Test coverage guide
5. **[GOVERNANCE.md](GOVERNANCE.md)** - Project decision-making

### Reading the Source Code

The codebase includes detailed comments:

```bash
# Look at a specific module
cat src/config.ts | grep -A 5 "^/\*\*"

# Find function documentation
grep -r "function.*(" src/ | head -20

# Understand types and interfaces
cat src/types.ts
```

## Troubleshooting

### Common Issues

#### Issue: "Model not found" error

**Cause**: Provider or model ID is incorrect

**Solution**:
1. Check the model format: `provider/model`
2. Verify the provider supports the model
3. Check your API credentials
4. See `examples/01-basic.md` for valid models

```bash
# Correct format
opencoder -m anthropic/claude-sonnet-4

# Incorrect formats (don't use)
opencoder -m claude-sonnet-4  # Missing provider
opencoder -m "anthropic claude-sonnet-4"  # Wrong separator
```

#### Issue: "Configuration not found" error

**Cause**: Missing config file or environment variables

**Solution**:
1. Check `.opencode/opencoder/config.json` exists
2. Verify environment variables are set (`OPENCODER_PLAN_MODEL`, etc.)
3. Pass options on command line
4. See [CONTRIBUTING.md](CONTRIBUTING.md#configuration) for details

```bash
# Set via environment
export OPENCODER_PLAN_MODEL=anthropic/claude-sonnet-4
opencoder

# Or pass on command line
opencoder -m anthropic/claude-sonnet-4
```

#### Issue: Tests are failing

**Cause**: Environment, dependencies, or test setup

**Solution**:
1. Ensure Bun is installed: `bun --version`
2. Reinstall dependencies: `rm bun.lockb && bun install`
3. Run tests again: `bun test`
4. Check test output for specific failures
5. See [CONTRIBUTING.md#testing](CONTRIBUTING.md#testing) for details

```bash
# Run tests with details
bun test --verbose

# Run a specific test file
bun test tests/config.test.ts

# Run tests matching a pattern
bun test tests/config.test.ts --grep "parseModel"
```

#### Issue: Build fails

**Cause**: Missing dependencies or compilation errors

**Solution**:
1. Check Bun version: `bun --version` (must be 1.0+)
2. Reinstall: `bun install`
3. Clean and rebuild: `make clean && bun run build`
4. Check for TypeScript errors: `bunx tsc --noEmit`

```bash
# Build with verbose output
bun run build 2>&1 | head -50

# Clean everything and rebuild
make clean
bun install
bun run build
```

### Getting More Details

Enable verbose logging:

```bash
# Run with verbose output
opencoder -v -m anthropic/claude-sonnet-4

# Check logs in .opencode/opencoder/
ls -la .opencode/opencoder/
cat .opencode/opencoder/state.json | jq .
```

## Reporting Issues

### Before You Report

1. **Check documentation** - See if issue is covered in docs
2. **Search existing issues** - Your problem may already be reported
3. **Try latest version** - Update to latest and test
4. **Check examples** - See if example works as expected

### How to Report

1. **Go to GitHub Issues**: https://github.com/anomalyco/opencoder/issues
2. **Click "New Issue"**
3. **Choose issue type**:
   - **Bug Report** - Something isn't working
   - **Feature Request** - Suggest a new feature
   - **Documentation** - Found a problem in docs
   - **Question** - Need help with something

### Writing a Good Bug Report

Include:

1. **Title** - Clear, concise description of the problem
2. **Environment** - OS, Bun version, Node.js version
3. **Steps to Reproduce**
   ```
   1. Run command: opencoder -m anthropic/claude-sonnet-4
   2. Wait for...
   3. See error...
   ```
4. **Expected Behavior** - What should happen
5. **Actual Behavior** - What actually happened
6. **Error Message** - Full error message if applicable
7. **Logs** - Relevant output from `.opencode/opencoder/`
8. **Additional Context** - Any other relevant info

### Good Bug Report Example

```markdown
## Bug: Coverage report generation fails on macOS

**Environment**
- OS: macOS 13.6 (Apple Silicon)
- Bun version: 1.0.24
- Node.js version: 20.10.0

**Steps to Reproduce**
1. Run `npm run test:coverage:report`
2. Wait for tests to complete
3. Check `coverage/lcov.info`

**Expected Behavior**
LCOV report should be generated without errors

**Actual Behavior**
Error: "Cannot read property 'lines' of undefined"

**Error Message**
```
error: Cannot read property 'lines' of undefined
    at Object.generateReport (/path/to/coverage.ts:123:45)
```

**Logs**
[Paste output from tests]

**Additional Context**
Only happens on macOS, works fine on Linux
```

## Asking Questions

### Where to Ask

1. **GitHub Discussions** - For general questions
2. **GitHub Issues** - For bug reports
3. **GitHub Q&A** - For specific questions

### How to Ask

1. **Search first** - Check if question was already answered
2. **Be clear** - Explain what you're trying to do
3. **Provide context** - Include command, error, expected behavior
4. **Share relevant details**:
   - Your environment
   - What you've tried
   - Error messages
   - Minimal reproduction

### Good Question Example

> "I'm trying to run OpenCoder with Claude Opus for planning and Sonnet for building. I have the models set up correctly, but I keep getting an authentication error. Here's what I'm running:
>
> ```bash
> opencoder -P anthropic/claude-opus-4 -B anthropic/claude-sonnet-4
> ```
>
> The error is:
> ```
> Error: Invalid API key for provider 'anthropic'
> ```
>
> I've set `OPENAI_API_KEY` (should I use `ANTHROPIC_API_KEY` instead?)
>
> Environment:
> - macOS 13.6
> - Bun 1.0.24
> - OpenCoder 1.0.0"

## Contributing Ideas

### Suggesting Features

1. **Check if already discussed** - Search issues and discussions
2. **Open a discussion** - Start community conversation
3. **Provide context**:
   - Why you need this feature
   - How you'd use it
   - Alternative approaches considered

### Improving Documentation

1. **Identify the gap** - What's missing or unclear?
2. **Check existing docs** - Where should it go?
3. **Open an issue** - Suggest the improvement
4. **Or submit a PR** - Fix it yourself! See [CONTRIBUTING.md](CONTRIBUTING.md)

### Reporting Documentation Issues

Found a mistake or typo?

1. **Open an issue** - Report what's wrong
2. **Or submit a PR** - Fix it directly
3. **Be specific** - Include file path and line number

## Getting Community Help

### Discussion Channels

- **GitHub Discussions** - General questions and discussions
- **GitHub Issues** - Bug reports and feature requests
- **README examples** - See [examples/](examples/) for common use cases

### Tips for Getting Help

1. **Be respectful** - Everyone is volunteering their time
2. **Provide details** - Help others help you
3. **Try suggestions** - Give feedback on proposed solutions
4. **Share solutions** - Help others with similar problems
5. **Say thanks** - Acknowledge help you receive

## Security Issues

### Reporting Security Vulnerabilities

**Please do NOT report security issues in public!**

Instead, please email the maintainers directly with:

1. **Description** - What is the vulnerability?
2. **Severity** - How serious is it?
3. **Affected versions** - Which versions have the issue?
4. **Fix** - Do you have a suggested fix?

Maintainers will:
1. Confirm the vulnerability
2. Develop a fix
3. Create a security release
4. Credit you in release notes (if you want)

## Response Times

We aim to respond to all inquiries:

| Type | Target Response |
|------|-----------------|
| Security Issue | 24 hours |
| Bug Report | 3-5 days |
| Feature Request | 1-2 weeks |
| Question | 3-7 days |
| Documentation Issue | 1-2 weeks |

Please note: We're volunteers, so actual times may vary.

## Frequently Asked Questions

### Q: How long until my issue is fixed?

**A**: It depends on:
- Severity (security > bugs > features)
- Complexity (quick fixes > major refactoring)
- Availability (maintainers are volunteers)

Security issues are prioritized and fixed quickly. Other issues may take longer.

### Q: Can I get a feature implemented?

**A**: Consider:
1. **Submit an issue** - Explain your use case
2. **Contribute it yourself** - See [CONTRIBUTING.md](CONTRIBUTING.md)
3. **Offer to fund it** - Maintainers may prioritize sponsored work
4. **Fork the project** - If you need it urgently

### Q: How do I know if my issue was resolved?

**A**: Check:
1. **Issue status** - Look for "Closed" label
2. **Release notes** - Mentioned in release with version
3. **Latest version** - Test with `npm run build`

## Getting Started with Contributions

Ready to contribute? Start here:

1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)** - Learn the process
2. **Check [good first issue](https://github.com/anomalyco/opencoder/labels/good%20first%20issue)** - Find something to work on
3. **Setup development** - Follow the setup guide
4. **Ask questions** - No shame in asking for help!
5. **Submit your PR** - We're excited to review it

## Additional Resources

- **[Project README](README.md)** - Overview and quick start
- **[CONTRIBUTING Guide](CONTRIBUTING.md)** - Development and contribution details
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards
- **[Governance](GOVERNANCE.md)** - How decisions are made
- **[Examples](examples/)** - Real-world usage examples
- **[Coverage Guide](docs/COVERAGE.md)** - Test coverage information

## Still Need Help?

If you can't find what you're looking for:

1. **Check documentation** - Comprehensive guides are available
2. **Search issues** - Your problem may already be discussed
3. **Open a discussion** - Ask the community
4. **Open an issue** - If it's a bug or you need feature
5. **Contact maintainers** - For other concerns

We're here to help! Don't hesitate to reach out.

---

**Last Updated**: January 2026
**Version**: 1.0
