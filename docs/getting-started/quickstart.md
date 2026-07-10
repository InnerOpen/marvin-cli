# Quick Start

Get up and running with the Marvin CLI in under 5 minutes.

## Step 1: Install

Install the CLI globally:

```bash
npm install -g @inneropen/marvin-cli
```

Verify installation:

```bash
marvin --version
```

## Step 2: Get Credentials

You need credentials to access your Marvin instance. The type depends on which APIs you want to use:

### For Publishing API (Read-Only)

Get a site client token from your Marvin instance:

1. Log into Marvin
2. Go to **Settings → Publishing → Site Clients**
3. Click **Create Site Client**
4. Copy the token (starts with `marvin_sk_`)

### For Platform API (Full Access)

Log in with your user credentials:

```bash
marvin auth login
```

Enter your email and password when prompted.

## Step 3: Configure Environment

Create a `.env` file in your project directory:

```bash
# For Publishing API
MARVIN_API_URL=https://your-marvin-instance.com
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token_here
MARVIN_WORKSPACE_SLUG=your-workspace-slug

# For Platform API (optional)
MARVIN_EMAIL=your@email.com
MARVIN_PASSWORD=your_password
```

!!! warning "Keep credentials secure"
    Never commit `.env` files to version control. Add `.env` to your `.gitignore`.

## Step 4: Test the Connection

Try fetching your workspace site configuration:

```bash
marvin publish site
```

Expected output:

```
┌──────────────┬─────────────────────────────┐
│ Field        │ Value                       │
├──────────────┼─────────────────────────────┤
│ Title        │ My Awesome Site             │
│ Tagline      │ Built with Marvin CMS       │
│ Description  │ A modern headless CMS       │
└──────────────┴─────────────────────────────┘
```

## Step 5: Explore Your Content

### List Published Entries

```bash
marvin publish entries
```

### Get a Single Entry

```bash
marvin publish entry homepage
```

### View Collections

```bash
marvin publish collections
```

### List Assets

```bash
marvin publish assets
```

## Step 6: Try Different Output Formats

### JSON Output

```bash
marvin publish entries --json
```

### Export to File

```bash
marvin publish entries --json > entries.json
```

### CSV for Spreadsheets

```bash
marvin publish assets --csv > assets.csv
```

### YAML Output

```bash
marvin publish collections --yaml
```

## Common First Tasks

### Check What's Published

```bash
# All published entries
marvin publish entries

# Filter by type
marvin publish entries --entry-type page

# Limit results
marvin publish entries --limit 10
```

### Explore Collections

```bash
# List all collections
marvin publish collections

# Get a specific collection
marvin publish collection featured

# List entries in a collection
marvin publish collection-entries featured
```

### Find Assets

```bash
# All assets
marvin publish assets

# Only images
marvin publish assets --type image

# Only videos
marvin publish assets --type video
```

### Inspect Resources

```bash
# All resources
marvin publish resources

# Get a specific resource
marvin publish resource kuroki-s022

# Find entries using a resource
marvin publish resource-entries kuroki-s022
```

## Using with Multiple Workspaces

Override the workspace for a single command:

```bash
marvin --workspace other-workspace publish entries
```

Or set a different default in your `.env`:

```env
MARVIN_WORKSPACE_SLUG=other-workspace
```

## Using with Different Environments

Override the API URL for different environments:

```bash
# Development
marvin --api-url http://localhost:8000 publish entries

# Staging
marvin --api-url https://staging.example.com publish entries

# Production
marvin --api-url https://api.example.com publish entries
```

## Quick Reference

### Global Options

```bash
marvin --help                    # Show help
marvin --version                 # Show version
marvin --api-url <url>           # Override API URL
marvin --workspace <slug>        # Override workspace
marvin --output <format>         # Set output format
marvin --json                    # JSON output
marvin --yaml                    # YAML output
marvin --csv                     # CSV output
```

### Publishing API Commands

```bash
marvin publish site              # Workspace site config
marvin publish entries           # List entries
marvin publish entry <slug>      # Get entry
marvin publish collections       # List collections
marvin publish collection <slug> # Get collection
marvin publish resources         # List resources
marvin publish resource <slug>   # Get resource
marvin publish assets            # List assets
```

### Platform API Commands

```bash
marvin auth login                # Log in
marvin auth logout               # Log out
marvin auth whoami               # Show current user
marvin workspace list            # List workspaces
marvin workspace info            # Current workspace info
marvin platform entries          # Platform entries API
```

## Next Steps

Now that you're familiar with the basics:

1. Learn about [filtering and querying](../guides/filtering.md)
2. Explore [scripting and automation](../guides/scripting.md)
3. Review all [available commands](../commands/overview.md)
4. Check out [examples](../examples/common-tasks.md)

## Troubleshooting

If you encounter issues:

### "Command not found: marvin"

Install globally or link the CLI:

```bash
npm install -g @inneropen/marvin-cli
```

### "MARVIN_API_URL is required"

Set environment variables:

```bash
export MARVIN_API_URL=https://your-marvin-instance.com
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or create a `.env` file.

### "401 Unauthorized"

Check your credentials:

- For Publishing API: Verify your site client token
- For Platform API: Run `marvin auth login`

### "404 Not Found"

Verify:

- API URL is correct
- Workspace slug exists
- Entry/collection/resource slug is correct

## Related

- [Installation Guide](installation.md)
- [Configuration Reference](configuration.md)
- [Commands Overview](../commands/overview.md)
- [Error Handling](../reference/error-handling.md)
