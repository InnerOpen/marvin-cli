# Contributing to Marvin CLI

Thank you for your interest in contributing to the Marvin CLI! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Marvin instance for testing
- Git

### Find Something to Work On

- Check the [issues page](https://github.com/inneropen/marvin-cli/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Or propose a new feature by opening an issue first

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/marvin-cli.git
cd marvin-cli
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
# Copy example environment
cp .env.example .env

# Edit with your Marvin instance details
nano .env
```

Example `.env`:

```env
MARVIN_API_URL=http://localhost:8000
MARVIN_WORKSPACE_SLUG=test-workspace
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_test_token
```

### 4. Build the CLI

```bash
npm run build
```

### 5. Link for Development

```bash
npm link
```

Now you can run `marvin` from anywhere and it will use your local development version.

### 6. Verify Setup

```bash
marvin --version
marvin publish site
```

## Making Changes

### Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes

### Code Style

We follow standard TypeScript conventions:

- Use TypeScript for all new code
- Run ESLint: `npm run lint`
- Format with Prettier (if configured)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Project Structure

```
marvin-cli/
├── src/
│   ├── commands/        # Command implementations
│   │   ├── publish/     # Publishing API commands
│   │   ├── platform/    # Platform API commands
│   │   └── admin/       # Admin API commands
│   ├── config/          # Configuration handling
│   ├── shared/          # Shared utilities
│   ├── output.ts        # Output formatting
│   └── index.ts         # CLI entry point
├── docs/                # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

### Adding a New Command

1. **Create command file** in appropriate directory:

```typescript
// src/commands/publish/example.ts
import { Command } from "commander";
import { getPublishClient } from "../../shared/client.js";
import { formatOutput } from "../../output.js";

export function registerExampleCommands(program: Command) {
  program
    .command("example")
    .description("Example command description")
    .option("--limit <number>", "Limit results", "20")
    .action(async (options) => {
      const client = getPublishClient();
      const data = await client.fetchExample();
      formatOutput(data, options);
    });
}
```

2. **Register in parent command**:

```typescript
// src/commands/publish/index.ts
import { registerExampleCommands } from "./example.js";

export function createPublishCommand(): Command {
  const publish = new Command("publish");
  
  registerExampleCommands(publish);
  // ... other commands
  
  return publish;
}
```

3. **Add tests** (when test suite exists):

```typescript
// tests/commands/example.test.ts
describe("example command", () => {
  it("should fetch example data", async () => {
    // Test implementation
  });
});
```

### Development Workflow

```bash
# Make changes
code src/commands/publish/example.ts

# Build
npm run build

# Test manually
marvin publish example

# Or use watch mode
npm run dev

# In another terminal
marvin publish example
```

## Testing

### Manual Testing

```bash
# Test your changes
marvin publish entries
marvin publish entry homepage --json
marvin --api-url https://staging.example.com publish site

# Test error handling
marvin publish entry nonexistent
marvin --api-url http://invalid publish site

# Test different output formats
marvin publish entries --json
marvin publish entries --yaml
marvin publish entries --csv
```

### Automated Tests

```bash
# Run tests (when available)
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```

### Test Checklist

- [ ] Command works with default options
- [ ] All flags work as expected
- [ ] JSON output is valid
- [ ] YAML output is valid
- [ ] CSV output is valid
- [ ] Error handling works
- [ ] Help text is clear
- [ ] Examples in help are correct

## Submitting Changes

### 1. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add export command for bulk data export"

# Bug fix
git commit -m "fix: handle null values in CSV output"

# Documentation
git commit -m "docs: add examples for filtering entries"

# Refactor
git commit -m "refactor: extract output formatting to shared module"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 2. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to the [main repository](https://github.com/inneropen/marvin-cli)
2. Click "Pull Requests" → "New Pull Request"
3. Click "compare across forks"
4. Select your fork and branch
5. Fill out the PR template

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How was this tested?

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

### PR Review Process

1. **Automated checks** run on your PR
2. **Maintainer reviews** code
3. **Feedback** may be provided
4. **Make updates** if requested
5. **PR is merged** when approved

## Documentation

### Updating Documentation

When adding or changing features, update the documentation:

```bash
# Documentation files
docs/
├── getting-started/
├── commands/
├── guides/
├── examples/
└── reference/
```

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features (if applicable)
- Cross-reference related docs
- Test all examples

### Building Documentation

```bash
# Install dependencies
pip install -r requirements.txt

# Serve locally
mkdocs serve

# Build
mkdocs build

# View at http://localhost:8000
```

### Documentation Checklist

When adding a new command:

- [ ] Add command reference doc
- [ ] Update commands overview
- [ ] Add usage examples
- [ ] Update quickstart if relevant
- [ ] Add to README if major feature

## Release Process

Releases are automated using semantic-release.

### Version Numbers

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backwards compatible)
- **Patch** (0.0.1): Bug fixes

### Release Steps

1. **Merge PR** to `main` branch
2. **semantic-release** runs automatically
3. **Version bumped** based on commit messages
4. **Changelog** generated
5. **npm package** published
6. **GitHub release** created

### What Triggers Releases

Based on commit messages:

- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `feat!:` or `BREAKING CHANGE:` → Major version bump

## Getting Help

- **Discord**: [Join our Discord](https://discord.gg/marvin) (if available)
- **Issues**: [GitHub Issues](https://github.com/inneropen/marvin-cli/issues)
- **Email**: contact@inneropen.com

## Additional Resources

- [Main Marvin Repository](https://github.com/jmashburn/Marvin)
- [Marvin SDK](https://github.com/inneropen/marvin-sdk)
- [Publishing API Docs](https://github.com/jmashburn/Marvin/blob/main/docs/api/publishing.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
