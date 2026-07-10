# Error Handling

Guide to handling errors and troubleshooting issues with the Marvin CLI.

## Exit Codes

The CLI uses standard exit codes to indicate success or failure:

| Code | Category | Meaning |
|------|----------|---------|
| `0` | Success | Command completed successfully |
| `1` | General Error | Generic error (see error message) |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Authentication failed |
| `403` | Forbidden | Permission denied |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal server error |
| `503` | Service Unavailable | Server is down or overloaded |

### Using Exit Codes

```bash
# Check if command succeeded
if marvin publish entry homepage --json >/dev/null 2>&1; then
    echo "Entry exists"
    exit 0
else
    echo "Entry not found"
    exit 1
fi

# Capture exit code
marvin publish entries --json
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Failed with code: $EXIT_CODE"
    case $EXIT_CODE in
        401) echo "Authentication failed" ;;
        404) echo "Resource not found" ;;
        500) echo "Server error" ;;
        *) echo "Unknown error" ;;
    esac
    exit $EXIT_CODE
fi
```

## Common Errors

### Authentication Errors

#### 401 Unauthorized

**Symptom:**
```
Error: 401 Unauthorized
Authentication failed
```

**Causes:**
- Invalid site client token
- Expired user session
- Missing credentials

**Solutions:**

For Publishing API:
```bash
# Check token is set
echo $MARVIN_SITE_CLIENT_TOKEN

# Verify token format (should start with marvin_sk_)
# Generate new token in Marvin UI if needed
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_new_token
```

For Platform API:
```bash
# Log out and log back in
marvin auth logout
marvin auth login

# Verify authentication
marvin auth whoami
```

#### 403 Forbidden

**Symptom:**
```
Error: 403 Forbidden
Permission denied
```

**Causes:**
- Insufficient user permissions
- API client lacks required scope
- Workspace role too restrictive

**Solutions:**
```bash
# Check user role
marvin auth whoami --json | jq -r '.role'

# Contact workspace admin to:
# - Upgrade your role
# - Grant additional permissions
# - Add you to the workspace

# For API clients, update scopes in Marvin UI
```

### Connection Errors

#### Cannot Connect to API

**Symptom:**
```
Error: connect ECONNREFUSED
Cannot connect to Marvin API
```

**Causes:**
- Wrong API URL
- Server is down
- Network issue
- Firewall blocking connection

**Solutions:**
```bash
# Verify API URL
echo $MARVIN_API_URL

# Test connectivity
curl $MARVIN_API_URL/health

# Check server is running
# For local development:
cd /path/to/marvin
python -m uvicorn marvin.main:app --reload

# Check firewall/VPN settings
```

#### Timeout

**Symptom:**
```
Error: Request timeout
Operation took too long
```

**Causes:**
- Slow network
- Large dataset
- Server overloaded

**Solutions:**
```bash
# Increase timeout
export MARVIN_TIMEOUT=60000  # 60 seconds
marvin publish entries

# Or per command
marvin --timeout 60000 publish entries

# Limit results to reduce load
marvin publish entries --limit 100

# Check server performance
```

### Resource Errors

#### 404 Not Found

**Symptom:**
```
Error: 404 Not Found
Resource does not exist
```

**Causes:**
- Entry/collection/resource doesn't exist
- Wrong slug
- Wrong workspace
- Entry not published (for Publishing API)

**Solutions:**
```bash
# Verify workspace
echo $MARVIN_WORKSPACE_SLUG
marvin workspace list

# Check slug spelling
marvin publish entries --json | jq -r '.[].slug'

# For Publishing API, check entry is published
marvin platform entries --json | jq '.[] | select(.slug == "homepage")'

# Verify resource exists
marvin publish collections  # List all collections
marvin publish resources     # List all resources
```

### Configuration Errors

#### Missing Required Variable

**Symptom:**
```
Error: MARVIN_API_URL is required
Please set MARVIN_API_URL environment variable
```

**Causes:**
- Environment variable not set
- .env file missing or not loaded

**Solutions:**
```bash
# Check environment
env | grep MARVIN

# Set variables
export MARVIN_API_URL=https://api.example.com
export MARVIN_WORKSPACE_SLUG=my-workspace

# Create .env file
cat > .env << EOF
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=my-workspace
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token
EOF

# Verify .env exists
ls -la .env
```

#### Invalid Configuration

**Symptom:**
```
Error: Invalid API URL format
URL must include protocol (http:// or https://)
```

**Solutions:**
```bash
# Check URL format
echo $MARVIN_API_URL

# Correct format
export MARVIN_API_URL=https://api.example.com  # Good
# Not:
# export MARVIN_API_URL=api.example.com  # Missing protocol
# export MARVIN_API_URL=https://api.example.com/  # Trailing slash
```

### Data Errors

#### Invalid JSON

**Symptom:**
```
Error: Unexpected token in JSON at position 0
```

**Causes:**
- Server returned HTML instead of JSON
- Malformed JSON response
- Wrong endpoint

**Solutions:**
```bash
# Check API URL is correct
curl $MARVIN_API_URL/health

# Verify endpoint
# Use table output to see raw response
marvin publish entries

# Enable debug mode
export MARVIN_DEBUG=true
marvin publish entries --json
```

#### Empty Response

**Symptom:**
```
Error: No data returned
```

**Causes:**
- No published content
- Filters too restrictive
- Wrong workspace

**Solutions:**
```bash
# Check without filters
marvin publish entries

# Verify workspace has content
marvin --workspace correct-slug publish entries

# List available content
marvin publish collections
marvin publish assets
```

## Error Recovery

### Retry Logic

```bash
#!/bin/bash

MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
    if marvin publish entries --json > entries.json; then
        echo "Success on attempt $i"
        exit 0
    else
        EXIT_CODE=$?
        echo "Attempt $i failed with code $EXIT_CODE"
        
        if [ $i -lt $MAX_RETRIES ]; then
            echo "Retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    fi
done

echo "Failed after $MAX_RETRIES attempts"
exit 1
```

### Exponential Backoff

```bash
#!/bin/bash

MAX_RETRIES=5
DELAY=1

for i in $(seq 1 $MAX_RETRIES); do
    if marvin publish entries --json; then
        exit 0
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo "Retry $i in ${DELAY}s..."
            sleep $DELAY
            DELAY=$((DELAY * 2))  # Exponential backoff
        fi
    fi
done

exit 1
```

### Graceful Degradation

```bash
#!/bin/bash

# Try to get entries, fall back to cached version
if marvin publish entries --json > entries.json 2>/dev/null; then
    echo "Fetched fresh data"
else
    echo "Using cached data"
    if [ ! -f entries-cache.json ]; then
        echo "Error: No cache available"
        exit 1
    fi
    cp entries-cache.json entries.json
fi

# Always cache successful fetches
if [ -f entries.json ]; then
    cp entries.json entries-cache.json
fi
```

## Debugging

### Enable Debug Mode

```bash
# Environment variable
export MARVIN_DEBUG=true
marvin publish entries

# Debug module (more detailed)
DEBUG=marvin:* marvin publish entries

# Specific modules
DEBUG=marvin:api,marvin:auth marvin publish entries
```

### Inspect Requests

```bash
# Enable debug and save output
MARVIN_DEBUG=true marvin publish entries 2>&1 | tee debug.log

# Review debug log
less debug.log
```

### Verbose Output

```bash
# Show full error stack trace
marvin publish entries --verbose 2>&1
```

### Check API Directly

```bash
# Test API endpoint
API_URL=$MARVIN_API_URL
WORKSPACE=$MARVIN_WORKSPACE_SLUG
TOKEN=$MARVIN_SITE_CLIENT_TOKEN

curl -H "Authorization: Bearer $TOKEN" \
     "$API_URL/api/$WORKSPACE/entries" | jq .
```

## Logging

### Log to File

```bash
# Log output
marvin publish entries > output.log 2>&1

# Log errors only
marvin publish entries 2> errors.log

# Log with timestamp
marvin publish entries 2>&1 | while read line; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') $line"
done >> marvin.log
```

### Structured Logging

```bash
#!/bin/bash

LOG_FILE="marvin.log"

log() {
    local level=$1
    shift
    echo "$(date -Iseconds) [$level] $*" >> "$LOG_FILE"
}

log INFO "Starting entry fetch"

if marvin publish entries --json > entries.json 2>/dev/null; then
    log INFO "Successfully fetched entries"
else
    log ERROR "Failed to fetch entries (exit code: $?)"
    exit 1
fi
```

## Error Reporting

### Capture Error Details

```bash
#!/bin/bash

COMMAND="marvin publish entries --json"
OUTPUT=$(mktemp)
ERRORS=$(mktemp)

# Run command and capture output/errors
$COMMAND > "$OUTPUT" 2> "$ERRORS"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    cat <<EOF
Command failed: $COMMAND
Exit code: $EXIT_CODE
Time: $(date)
Environment:
  API_URL: $MARVIN_API_URL
  WORKSPACE: $MARVIN_WORKSPACE_SLUG

Error output:
$(cat "$ERRORS")

Debug info:
$(marvin --version)
$(env | grep MARVIN)
EOF
fi

rm "$OUTPUT" "$ERRORS"
exit $EXIT_CODE
```

### Send Error Notifications

```bash
#!/bin/bash

if ! marvin publish entries --json >/dev/null 2>&1; then
    # Send email alert
    echo "Marvin CLI failed at $(date)" | \
        mail -s "Marvin CLI Error" admin@example.com
    
    # Or send Slack notification
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
         -H 'Content-Type: application/json' \
         -d '{
           "text": "Marvin CLI error in production",
           "attachments": [{
             "color": "danger",
             "fields": [{
               "title": "Environment",
               "value": "Production"
             }]
           }]
         }'
fi
```

## Best Practices

1. **Always check exit codes** in scripts
2. **Use timeout** for long-running commands
3. **Implement retry logic** for transient failures
4. **Log errors** with context
5. **Validate configuration** before running commands
6. **Cache successful responses** for fallback
7. **Monitor error rates** in production
8. **Set up alerting** for critical failures

## Error Reference Quick Look

| Error | Common Cause | Quick Fix |
|-------|-------------|-----------|
| 401 | Invalid token | `export MARVIN_SITE_CLIENT_TOKEN=new_token` |
| 403 | No permission | Contact admin for role upgrade |
| 404 | Not found | Check slug: `marvin publish entries \| grep slug` |
| 500 | Server error | Check server logs, retry later |
| ECONNREFUSED | Server down | Verify `$MARVIN_API_URL`, check server |
| Timeout | Slow response | Increase `MARVIN_TIMEOUT`, use `--limit` |
| Missing var | Not configured | Create `.env` file |
| Invalid JSON | Wrong endpoint | Check `$MARVIN_API_URL` |

## Related

- [Configuration Guide](../getting-started/configuration.md)
- [Environment Variables](environment-variables.md)
- [Troubleshooting](troubleshooting.md) (if exists)
- [Authentication Reference](authentication.md)
