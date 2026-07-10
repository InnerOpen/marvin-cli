# Reporting Examples

Generate reports and analytics from your Marvin content using the CLI.

## Content Reports

### Basic Content Summary

```bash
#!/bin/bash
# Generate simple content summary

cat <<EOF
Content Summary Report
$(date +%Y-%m-%d)
======================

OVERVIEW
--------
Entries:     $(marvin publish entries --json | jq 'length')
Collections: $(marvin publish collections --json | jq 'length')
Assets:      $(marvin publish assets --json | jq 'length')
Resources:   $(marvin publish resources --json | jq 'length')
EOF
```

### Detailed Content Report

```bash
#!/bin/bash
# Comprehensive content report

ENTRIES=$(marvin publish entries --json)
TOTAL=$(echo "$ENTRIES" | jq 'length')

echo "Marvin Content Report"
echo "Generated: $(date)"
echo "======================================"
echo ""

echo "ENTRIES"
echo "-------"
echo "Total Entries: $TOTAL"
echo ""

echo "By Type:"
echo "$ENTRIES" | jq -r 'group_by(.entryType) | 
  .[] | "  \(.[0].entryType): \(length)"'

echo ""
echo "Latest 5 Publications:"
echo "$ENTRIES" | jq -r 'sort_by(.publishedAt) | reverse | .[0:5] | 
  .[] | "  - \(.title) (\(.publishedAt | split("T")[0]))"'
```

### Weekly Content Report

```bash
#!/bin/bash
# Weekly content activity report

WEEK_START=$(date -d 'last Monday' +%Y-%m-%d 2>/dev/null || date -v-Mon +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

NEW_ENTRIES=$(marvin publish entries --json | \
  jq --arg start "$WEEK_START" --arg end "$WEEK_END" \
     '[.[] | select(.publishedAt >= $start and .publishedAt <= $end)] | length')

echo "Weekly Content Report"
echo "Week of $WEEK_START"
echo "====================="
echo ""
echo "New Publications: $NEW_ENTRIES"
```

## Quality Reports

### Content Quality Audit

```bash
#!/bin/bash
# Audit content quality

ENTRIES=$(marvin publish entries --json)
TOTAL=$(echo "$ENTRIES" | jq 'length')

NO_DESCRIPTION=$(echo "$ENTRIES" | \
  jq '[.[] | select(.description == null or .description == "")] | length')

NO_SEO_TITLE=$(echo "$ENTRIES" | \
  jq '[.[] | select(.metadata.seoTitle == null)] | length')

QUALITY_SCORE=$(echo "scale=1; (($TOTAL - $NO_DESCRIPTION - $NO_SEO_TITLE) * 100) / $TOTAL" | bc)

echo "Content Quality Audit - $(date)"
echo "================================"
echo ""
echo "Total Entries: $TOTAL"
echo "Missing Descriptions: $NO_DESCRIPTION / $TOTAL"
echo "Missing SEO Title: $NO_SEO_TITLE / $TOTAL"
echo "Overall Quality Score: $QUALITY_SCORE%"
```

## Asset Reports

### Asset Inventory

```bash
#!/bin/bash
# Comprehensive asset inventory

ASSETS=$(marvin publish assets --json)
TOTAL=$(echo "$ASSETS" | jq 'length')
TOTAL_SIZE=$(echo "$ASSETS" | jq 'map(.size) | add')

echo "Asset Inventory Report"
echo "$(date)"
echo "======================"
echo ""
echo "Total Assets: $TOTAL"
echo "Total Storage: $(echo $TOTAL_SIZE | numfmt --to=iec-i --suffix=B)"
echo ""

echo "Assets by Type:"
echo "$ASSETS" | jq -r 'group_by(.mimeType | split("/")[0]) | 
  .[] | "  \(.[0].mimeType | split("/")[0]): \(length)"'

echo ""
echo "Top 10 Largest Assets:"
echo "$ASSETS" | jq -r 'sort_by(.size) | reverse | .[0:10] | 
  .[] | "  - \(.filename): \(.size / 1048576 | round)MB"'
```

## Related

- [Common Tasks](common-tasks.md)
- [Export/Import Examples](export-import.md)
- [Automation Examples](automation.md)
- [Data Pipelines Guide](../guides/pipelines.md)
- [Filtering Guide](../guides/filtering.md)
