# 🤝 Contributing to OpenClaw

Thank you for your interest in contributing to OpenClaw! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- pnpm (recommended) or npm
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openclaw.git
   cd openclaw
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/openclaw/openclaw.git
   ```

## 🛠️ Development Setup

### Install Dependencies

```bash
pnpm install
```

### Build the Project

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Start Development Server

```bash
pnpm dev
```

## 🔄 Making Changes

### Branch Strategy

- `main` - stable release branch
- `develop` - development branch
- `feature/*` - new features
- `bugfix/*` - bug fixes
- `hotfix/*` - critical fixes

### Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/your-bug-fix
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation
- `style` - formatting
- `refactor` - code refactoring
- `test` - adding tests
- `chore` - maintenance

Examples:
```
feat(channels): add WhatsApp channel support
fix(gateway): resolve connection timeout issue
docs(readme): update installation instructions
```

## 🔀 Pull Request Process

1. Update your branch with the latest changes from upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request on GitHub

4. Fill out the PR template completely

5. Wait for review and address any feedback

6. Once approved, your PR will be merged

## 📏 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use async/await over Promises

### Code Style

- Follow the existing code style
- Use ESLint and Prettier
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic

### File Organization

```
src/
├── channels/          # Channel implementations
├── providers/         # AI provider integrations
├── skills/           # Skill implementations
├── utils/            # Utility functions
└── types/            # TypeScript type definitions
```

## 🧪 Testing

### Test Structure

```
test/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── e2e/              # End-to-end tests
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run with coverage
pnpm test:coverage
```

## 📚 Documentation

### Code Documentation

- Use JSDoc for function documentation
- Add inline comments for complex logic
- Keep README files up to date

### API Documentation

- Document all public APIs
- Include usage examples
- Keep documentation in sync with code

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Node.js version: [e.g., 24.0.0]
- OpenClaw version: [e.g., 2026.3.14]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Any other context about the feature request.
```

## 📞 Getting Help

- [Discord Community](https://discord.gg/clawd)
- [GitHub Issues](https://github.com/openclaw/openclaw/issues)
- [Documentation](https://docs.openclaw.ai)

## 🙏 Thank You

Thank you for contributing to OpenClaw! Your contributions help make this project better for everyone.

---

<p align="center">
  Made with ❤️ by the OpenClaw community
</p>
