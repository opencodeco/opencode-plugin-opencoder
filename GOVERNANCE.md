# Project Governance

## Overview

This document outlines how decisions are made in the OpenCoder project and how the community can participate in shaping its future.

## Project Leadership

### Maintainers

The OpenCoder project is maintained by a small team dedicated to its quality and vision. Maintainers are responsible for:

- **Reviewing pull requests** - Ensuring code quality and alignment with project goals
- **Managing issues** - Triaging, discussing, and prioritizing work
- **Making release decisions** - Determining when features are ready to ship
- **Setting direction** - Guiding the project's long-term vision
- **Community management** - Fostering a healthy, inclusive community

Current maintainers can be found in the [CONTRIBUTING.md](CONTRIBUTING.md).

### Becoming a Maintainer

Contributors who consistently demonstrate:

- High-quality contributions
- Strong understanding of the codebase
- Commitment to community values
- Excellent communication skills

...may be invited to join the maintainer team. This is not based on quantity of contributions but on quality and judgment.

## Decision-Making Process

### Types of Decisions

**1. Small Changes (Bug Fixes, Documentation)**
- Require: One maintainer review and approval
- Process: Standard pull request review
- Timeline: Can be merged quickly

**2. Medium Changes (New Features, Significant Refactoring)**
- Require: Two maintainer reviews and approval
- Process: Standard pull request review with discussion
- Timeline: 3-5 day discussion period
- Community input welcome but not required

**3. Major Changes (API Changes, Breaking Changes, New Direction)**
- Require: RFC (Request For Comments) issue
- Process: Community discussion, consensus building
- Timeline: 1-2 week discussion period
- Community input strongly encouraged
- Requires majority maintainer approval

**4. Project Direction (Long-term Goals, Major Features)**
- Require: RFC issue and community discussion
- Process: Open discussion with all stakeholders
- Timeline: 2-4 week discussion period
- Community input critical
- Requires consensus among maintainers

### RFC (Request For Comments) Process

Major decisions follow an RFC process:

1. **Create Issue** - Open an issue with `[RFC]` prefix describing the proposal
2. **Discussion** - Community comments and feedback (1-2 weeks)
3. **Revision** - Proposer updates based on feedback
4. **Decision** - Maintainers make final decision
5. **Implementation** - Approved proposals are implemented

RFC topics might include:

- Major architectural changes
- Breaking changes to APIs
- New commands or significant features
- Project scope changes

## Issue and PR Management

### Issue Categories

Issues are labeled to help organize work:

- **bug** - Something isn't working
- **enhancement** - New feature or improvement request
- **documentation** - Documentation updates
- **good first issue** - Good for newcomers
- **help wanted** - Extra attention needed
- **discussion** - Community discussion topics
- **question** - Questions about usage

### PR Review Guidelines

When submitting a pull request:

1. **Describe your changes clearly** - Link to related issues
2. **Follow coding standards** - Run `bun test` and `bunx biome check`
3. **Add tests** - Maintain or improve coverage
4. **Write commit messages** - Follow Conventional Commits
5. **Be patient** - Reviews take time

Maintainers will:

1. **Review promptly** - Aim for response within 3 days
2. **Provide constructive feedback** - Explain reasoning
3. **Request changes clearly** - Be specific about what needs adjusting
4. **Merge thoughtfully** - Ensure quality and consistency

## Release Management

### Version Strategy

OpenCoder follows [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Release Process

1. **Planning** - Decide what goes into release
2. **Development** - Implement features and fixes
3. **Testing** - Comprehensive testing on multiple platforms
4. **Release Candidate** - Tag and test pre-release
5. **Release** - Publish to all platforms
6. **Announcement** - Document changes in release notes

### Support Timeline

- **Latest version** - Full support
- **Previous major version** - Bug fixes and critical issues
- **Older versions** - Security fixes only
- **End of life** - No support

## Community Participation

### How to Get Involved

1. **Report bugs** - Open an issue with reproduction steps
2. **Suggest features** - Start a discussion or RFC issue
3. **Contribute code** - Submit a pull request
4. **Improve documentation** - Help others understand the project
5. **Help others** - Answer questions in discussions
6. **Share feedback** - Tell us what you think

### Recognition

We recognize contributions in multiple ways:

- **Contributor list** - Listed in README and releases
- **Commit history** - Your commits are preserved in git
- **Maintainer status** - Top contributors may become maintainers
- **Community mention** - Highlighted in release notes

## Conflict Resolution

### Disagreements

Disagreements are normal and healthy. When they occur:

1. **Discuss respectfully** - Focus on ideas, not people
2. **Listen actively** - Try to understand other perspectives
3. **Find common ground** - Look for compromise
4. **Involve maintainers** - If needed, escalate for guidance
5. **Respect decisions** - Once decided, move forward

### Code Review Conflicts

If there's disagreement during code review:

1. **Explain reasoning** - Both sides articulate their position
2. **Consider tradeoffs** - Discuss pros and cons
3. **Seek maintainer input** - Ask for guidance if stuck
4. **Document decisions** - Record the rationale

### Escalation

If conflicts can't be resolved:

1. Contact the project maintainers
2. Describe the situation clearly
3. Request guidance from leadership
4. Respect the final decision

## Amendment Process

This governance document may be updated as the project evolves:

1. **Propose change** - Open an issue or discussion
2. **Community feedback** - Get input from contributors
3. **Maintainer approval** - Requires consensus
4. **Update document** - Apply approved changes
5. **Announce change** - Notify the community

## Values and Principles

The OpenCoder project is guided by:

### Technical Excellence
- Code quality matters
- Testing is essential
- Documentation is important
- Performance is considered

### Community First
- Contributors are valued
- Diverse perspectives are welcome
- Respectful communication is expected
- Everyone's time is respected

### Transparency
- Decisions are explained
- Processes are documented
- Community input is considered
- Outcomes are communicated

### Sustainability
- Projects should be maintainable
- Dependencies are managed carefully
- Breaking changes are minimized
- Long-term viability is prioritized

## Questions?

If you have questions about governance, project direction, or how decisions are made:

1. **Check this document** - May answer your question
2. **Open an issue** - Tag with `[governance]` or `[question]`
3. **Start a discussion** - For broader topics
4. **Contact maintainers** - For confidential matters

We're here to help and want to make sure you feel heard.

---

**Last Updated**: January 2026
**Version**: 1.0
