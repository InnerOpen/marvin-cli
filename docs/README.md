# Marvin CLI Documentation

Welcome to the Marvin CLI documentation!

## About This Documentation

This is the complete reference documentation for the Marvin CLI - the official command-line interface for Marvin CMS.

## Documentation Structure

### Getting Started

New to Marvin CLI? Start here:

- [Installation](getting-started/installation.md) - Install the CLI
- [Quick Start](getting-started/quickstart.md) - Get up and running in 5 minutes
- [Configuration](getting-started/configuration.md) - Configure credentials and environment

### Commands

Complete command reference:

- [Overview](commands/overview.md) - All available commands
- [Publishing API](commands/site.md) - Read-only publishing commands
- [Platform API](commands/workspaces.md) - Workspace management
- [Admin API](commands/admin-users.md) - System administration
- [Output Formats](commands/output-formats.md) - Table, JSON, YAML, CSV

### Usage Guides

Learn how to use the CLI effectively:

- [Filtering & Querying](guides/filtering.md) - Filter and query your content
- [Scripting & Automation](guides/scripting.md) - Use CLI in scripts
- [Data Pipelines](guides/pipelines.md) - Process data with pipes and jq
- [CI/CD Integration](guides/ci-cd.md) - Use in GitHub Actions, GitLab CI

### Examples

Real-world examples and recipes:

- [Common Tasks](examples/common-tasks.md) - Everyday use cases
- [Export & Import](examples/export-import.md) - Data workflows
- [Reporting](examples/reporting.md) - Generate reports
- [Automation](examples/automation.md) - Automation recipes

### Reference

Technical reference documentation:

- [Authentication](reference/authentication.md) - Authentication methods and security
- [Error Handling](reference/error-handling.md) - Error codes and troubleshooting
- [Environment Variables](reference/environment-variables.md) - Configuration reference
- [API Mapping](reference/api-mapping.md) - CLI to API endpoint mapping

## Quick Links

### Most Common Tasks

```bash
# Get published entries
marvin publish entries

# Export to JSON
marvin publish entries --json > entries.json

# Filter by type
marvin publish entries --entry-type page

# List collections
marvin publish collections

# Get assets
marvin publish assets --type image
```

### Getting Help

```bash
# General help
marvin --help

# Command help
marvin publish --help

# Specific command help
marvin publish entries --help
```

## Building This Documentation

This documentation is built with [MkDocs](https://www.mkdocs.org/) and [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Serve locally (with live reload)
mkdocs serve

# Build static site
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy
```

Or use npm scripts:

```bash
# Serve locally
npm run docs:serve

# Build
npm run docs:build

# Deploy
npm run docs:deploy
```

### Documentation Files

```
docs/
├── index.md                    # Homepage
├── getting-started/            # Getting started guides
│   ├── installation.md
│   ├── quickstart.md
│   └── configuration.md
├── commands/                   # Command reference
│   ├── overview.md
│   ├── site.md
│   ├── entries.md
│   └── ...
├── guides/                     # Usage guides
│   ├── filtering.md
│   ├── scripting.md
│   └── ...
├── examples/                   # Examples
│   ├── common-tasks.md
│   └── ...
├── reference/                  # Technical reference
│   ├── authentication.md
│   └── ...
└── contributing.md             # Contributing guide
```

## Contributing to Documentation

We welcome documentation contributions! See the [Contributing Guide](contributing.md) for details.

### Documentation Style Guide

- Use clear, concise language
- Include practical examples
- Test all code snippets
- Add cross-references
- Use admonitions for warnings/tips
- Keep examples copy-pastable

### Reporting Issues

Found a problem with the docs?

- [Open an issue](https://github.com/inneropen/marvin-cli/issues)
- Submit a pull request with fixes
- Suggest improvements

## Related Documentation

- [Marvin CMS Documentation](https://github.com/jmashburn/Marvin)
- [Marvin SDK Documentation](https://github.com/inneropen/marvin-sdk)
- [Publishing API Reference](https://github.com/jmashburn/Marvin/blob/main/docs/api/publishing.md)

## License

This documentation is licensed under the MIT License.

---

**Need help?** [Open an issue](https://github.com/inneropen/marvin-cli/issues) or reach out to the community.
