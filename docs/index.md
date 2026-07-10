# Marvin CLI Documentation

Welcome to the official command-line interface for [Marvin CMS](https://github.com/jmashburn/Marvin). The Marvin CLI provides a powerful, flexible way to interact with your Marvin content from the terminal, scripts, and CI/CD pipelines.

## Features

- **📊 Table Output by Default** - Beautiful, human-readable tables in your terminal
- **🔄 Multiple Output Formats** - Choose from table, JSON, YAML, or CSV
- **🔍 Filter and Query** - Filter by entry type, collection, asset type, and more
- **🚀 Fast** - Direct HTTP calls to Marvin Publishing and Platform APIs
- **🔐 Flexible Authentication** - Site client tokens for publishing, user tokens for platform operations
- **👥 Complete API Coverage** - Access publishing, platform, and admin APIs
- **🤖 Automation Ready** - Perfect for scripts, CI/CD, and data pipelines

## Quick Start

```bash
# Install
npm install -g @inneropen/marvin-cli

# Configure
export MARVIN_API_URL=https://your-marvin-instance.com
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token

# Get published entries
marvin publish entries

# Export to JSON
marvin publish entries --json > entries.json
```

## Documentation Sections

### Getting Started

- [Installation](getting-started/installation.md) - Install and set up the CLI
- [Quick Start](getting-started/quickstart.md) - Get up and running in 5 minutes
- [Configuration](getting-started/configuration.md) - Configure credentials and environment

### Commands

- [Overview](commands/overview.md) - All available commands at a glance
- [Publishing API](commands/site.md) - Read-only publishing API commands
- [Platform API](commands/workspaces.md) - Workspace management commands
- [Admin API](commands/admin-users.md) - Administrative commands
- [Output Formats](commands/output-formats.md) - Table, JSON, YAML, CSV output

### Usage Guides

- [Filtering & Querying](guides/filtering.md) - Filter and query your content
- [Scripting & Automation](guides/scripting.md) - Use CLI in bash scripts
- [Data Pipelines](guides/pipelines.md) - Pipe output, process with jq
- [CI/CD Integration](guides/ci-cd.md) - Use in GitHub Actions, GitLab CI

### Examples

- [Common Tasks](examples/common-tasks.md) - Everyday use cases
- [Export & Import](examples/export-import.md) - Data export and import workflows
- [Reporting](examples/reporting.md) - Generate reports from your content
- [Automation Recipes](examples/automation.md) - Real-world automation examples

### Reference

- [Authentication](reference/authentication.md) - Site client tokens, user tokens, API keys
- [Error Handling](reference/error-handling.md) - Error codes and troubleshooting
- [Environment Variables](reference/environment-variables.md) - All available env vars
- [API Mapping](reference/api-mapping.md) - How commands map to API endpoints

## Why Use the CLI?

### For Development

Quickly inspect content, test queries, and verify publishing workflows during development.

```bash
# Check what's published
marvin publish entries --entry-type page

# Verify a collection
marvin publish collection featured
```

### For Automation

Build automated workflows for content reporting, backups, and data processing.

```bash
# Daily content report
marvin publish entries --json | jq '.[] | select(.status == "published") | .title'

# Export all assets
marvin publish assets --csv > assets-$(date +%Y%m%d).csv
```

### For CI/CD

Integrate content validation and deployment verification into your pipelines.

```bash
# Verify deployment
if marvin publish entry homepage --json > /dev/null 2>&1; then
  echo "✓ Homepage published"
else
  echo "✗ Homepage not found"
  exit 1
fi
```

## Getting Help

- **Command Help**: Run any command with `--help` for detailed usage
- **Issues**: [GitHub Issues](https://github.com/inneropen/marvin-cli/issues)
- **Contributing**: See our [Contributing Guide](contributing.md)

## Related Projects

- [Marvin CMS](https://github.com/jmashburn/Marvin) - The main CMS
- [Marvin SDK](https://github.com/inneropen/marvin-sdk) - TypeScript SDK for Astro/Next.js

## License

MIT - see [LICENSE](https://github.com/inneropen/marvin-cli/blob/main/LICENSE)
