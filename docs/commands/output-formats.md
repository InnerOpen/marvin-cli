# Output Formats

The Marvin CLI supports four output formats to suit different use cases: table, JSON, YAML, and CSV.

## Available Formats

| Format | Use Case | Flag |
|--------|----------|------|
| **Table** | Human-readable terminal output | Default |
| **JSON** | Machine-readable, scripting, APIs | `--json` or `--output json` |
| **YAML** | Human-readable, configuration files | `--yaml` or `--output yaml` |
| **CSV** | Spreadsheets, data analysis | `--csv` or `--output csv` |

## Table Format

Default format for human-readable output in the terminal.

### Usage

```bash
marvin publish entries
# Or explicitly
marvin publish entries --output table
```

### Example Output

```
┌────────────────┬──────────┬─────────┬───────────┬────────────┐
│ Title          │ Slug     │ Type    │ Status    │ Published  │
├────────────────┼──────────┼─────────┼───────────┼────────────┤
│ Homepage       │ home     │ page    │ published │ 2026-07-01 │
│ About Us       │ about    │ page    │ published │ 2026-07-02 │
│ Contact        │ contact  │ page    │ published │ 2026-07-03 │
└────────────────┴──────────┴─────────┴───────────┴────────────┘
```

### Features

- Automatic column sizing
- Unicode box-drawing characters
- Truncates long values to fit terminal width
- Color highlighting (when supported)

### Best For

- Quick inspection in terminal
- Development and debugging
- Manual verification

## JSON Format

Machine-readable format for scripting and automation.

### Usage

```bash
marvin publish entries --json
# Or
marvin publish entries --output json
```

### Example Output

```json
[
  {
    "slug": "home",
    "title": "Homepage",
    "entryType": "page",
    "status": "published",
    "publishedAt": "2026-07-01T00:00:00Z"
  },
  {
    "slug": "about",
    "title": "About Us",
    "entryType": "page",
    "status": "published",
    "publishedAt": "2026-07-02T00:00:00Z"
  }
]
```

### Features

- Valid JSON output
- Preserves data types (numbers, booleans, null)
- Nested objects and arrays
- ISO 8601 dates

### Best For

- Piping to `jq` for processing
- Saving to files for later use
- Parsing in scripts (Node.js, Python, etc.)
- API integrations

### Processing with jq

```bash
# Extract titles
marvin publish entries --json | jq -r '.[].title'

# Filter by entry type
marvin publish entries --json | jq '.[] | select(.entryType == "page")'

# Count entries
marvin publish entries --json | jq 'length'

# Get specific fields
marvin publish entries --json | jq '.[] | {title, slug}'
```

## YAML Format

Human-readable format, easier to read than JSON for complex data.

### Usage

```bash
marvin publish entries --yaml
# Or
marvin publish entries --output yaml
```

### Example Output

```yaml
- slug: home
  title: Homepage
  entryType: page
  status: published
  publishedAt: 2026-07-01T00:00:00Z
- slug: about
  title: About Us
  entryType: page
  status: published
  publishedAt: 2026-07-02T00:00:00Z
```

### Features

- Readable indentation
- No quotes needed for most strings
- Comments supported (when editing)
- Multiline strings

### Best For

- Configuration files
- Documentation
- Human review of structured data
- Version control diffs

### Processing with yq

```bash
# Extract titles
marvin publish entries --yaml | yq '.[] | .title'

# Filter entries
marvin publish entries --yaml | yq '.[] | select(.entryType == "page")'

# Convert to JSON
marvin publish entries --yaml | yq -o json
```

## CSV Format

Spreadsheet-compatible format for data analysis.

### Usage

```bash
marvin publish entries --csv
# Or
marvin publish entries --output csv
```

### Example Output

```csv
Title,Slug,Type,Status,Published
Homepage,home,page,published,2026-07-01
About Us,about,page,published,2026-07-02
Contact,contact,page,published,2026-07-03
```

### Features

- Standard CSV format (RFC 4180)
- Header row with column names
- Quoted fields when needed
- Escaped commas and quotes

### Best For

- Excel/Google Sheets import
- Data analysis with pandas/R
- Bulk operations
- Reporting

### Importing to Spreadsheets

```bash
# Export to file
marvin publish entries --csv > entries.csv

# Open in Excel (macOS)
open entries.csv

# Import to Google Sheets
# Upload the CSV file
```

### Processing with Tools

```bash
# Count rows (excluding header)
marvin publish entries --csv | tail -n +2 | wc -l

# Extract specific column
marvin publish entries --csv | cut -d',' -f1

# Sort by column
marvin publish entries --csv | sort -t',' -k3
```

## Format Selection

### Command-Line Flags

```bash
# Long form
marvin publish entries --output json
marvin publish entries --output yaml
marvin publish entries --output csv
marvin publish entries --output table

# Short form
marvin publish entries --json
marvin publish entries --yaml
marvin publish entries --csv
```

### Environment Variable

Set a default format:

```bash
export MARVIN_OUTPUT_FORMAT=json
marvin publish entries  # Uses JSON
```

### Override Order

1. Command-line flag (highest priority)
2. Environment variable
3. Default (table)

## Use Case Examples

### Development Workflow

```bash
# Quick check in terminal
marvin publish entries

# Detailed inspection
marvin publish entry homepage --json | jq .
```

### Data Export

```bash
# Export all entries to JSON
marvin publish entries --json > entries.json

# Export assets to CSV for tracking
marvin publish assets --csv > assets-$(date +%Y%m%d).csv

# Export site config to YAML
marvin publish site --yaml > site-config.yaml
```

### Scripting

```bash
# Count published pages
PAGE_COUNT=$(marvin publish entries --entry-type page --json | jq 'length')
echo "Published pages: $PAGE_COUNT"

# Check if entry exists
if marvin publish entry homepage --json >/dev/null 2>&1; then
  echo "Homepage is published"
fi

# Get all image assets
marvin publish assets --type image --json | jq -r '.[].url'
```

### Reporting

```bash
# Generate weekly report
echo "Content Report - Week $(date +%W)"
echo "================================"
echo "Total Entries: $(marvin publish entries --json | jq 'length')"
echo "Total Collections: $(marvin publish collections --json | jq 'length')"
echo "Total Assets: $(marvin publish assets --json | jq 'length')"

# Export to CSV for analysis
marvin publish entries --csv > report-$(date +%Y%m%d).csv
```

### CI/CD

```bash
# Verify deployment in GitHub Actions
- name: Verify Content Published
  run: |
    COUNT=$(marvin publish entries --json | jq 'length')
    if [ $COUNT -gt 0 ]; then
      echo "✓ Content published: $COUNT entries"
    else
      echo "✗ No content published"
      exit 1
    fi
```

## Formatting Tips

### JSON

```bash
# Pretty-print with jq
marvin publish entries --json | jq .

# Compact output
marvin publish entries --json | jq -c .

# Sort keys
marvin publish entries --json | jq -S .
```

### YAML

```bash
# Validate YAML
marvin publish entries --yaml | yamllint -

# Convert to JSON
marvin publish entries --yaml | yq -o json > entries.json
```

### CSV

```bash
# Add timestamps
marvin publish entries --csv | awk -v date="$(date +%Y-%m-%d)" 'NR==1{print $0",ExportDate"} NR>1{print $0","date}'

# Filter rows
marvin publish entries --csv | grep "published"
```

## Limitations

### Table Format

- May truncate long values
- Not suitable for machine parsing
- Layout depends on terminal width

### JSON Format

- More verbose than YAML
- Harder to read for humans
- No comments

### YAML Format

- Slower to parse than JSON
- Whitespace-sensitive
- Limited tool support vs JSON

### CSV Format

- Flattens nested data
- Limited data types (all strings)
- No standard for complex structures

## Best Practices

1. **Use table for terminal** - Quick checks and manual inspection
2. **Use JSON for scripts** - Reliable parsing, rich data types
3. **Use YAML for config** - Human-readable structured data
4. **Use CSV for analysis** - Import to spreadsheets and analysis tools

5. **Always validate** - Check output format before piping to files
6. **Handle errors** - Check exit codes in scripts
7. **Save to files** - Redirect output rather than copying from terminal
8. **Version exports** - Include dates in exported filenames

## Related

- [Scripting Guide](../guides/scripting.md)
- [Data Pipelines](../guides/pipelines.md)
- [Examples](../examples/common-tasks.md)
