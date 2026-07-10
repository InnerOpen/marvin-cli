# Forms

Manage workspace forms, view submissions, and interact with published forms via the Publishing API.

## Commands

### List Forms

```bash
marvin forms list
```

### Get Form

```bash
marvin forms get <id>
```

### Create Form

```bash
marvin forms create --json <json>
marvin forms create --file <path>
```

### Update Form

```bash
marvin forms update <id> --json <json>
marvin forms update <id> --file <path>
```

### Delete Form

```bash
marvin forms delete <id> --yes
```

### Get Form Submissions

```bash
marvin forms submissions <form-id>
```

### Get Published Form (Publishing API)

```bash
marvin forms get-published <slug>
```

### Submit to Published Form (Publishing API)

```bash
marvin forms submit <slug> --json <json>
marvin forms submit <slug> --file <path>
```

## Description

Forms allow you to collect structured data from users on your published site. Create contact forms, surveys, feedback forms, or custom data collection forms. View and manage submissions through the Platform API.

## Authentication

### Platform API Commands

Requires user authentication and active workspace:

```bash
marvin login
marvin workspace use <workspace>
```

### Publishing API Commands

Requires site client token:

```bash
marvin workspace token <site-token>
# or
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

## Options

### `marvin forms list`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

### `marvin forms get <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Form ID (required) |
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |
| `--output <format>` | Output format: table, json |

### `marvin forms create`

| Option | Description |
|--------|-------------|
| `--json <json>` | Form data as JSON string |
| `--file <path>` | Path to JSON file (use '-' for stdin) |

### `marvin forms update <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Form ID (required) |
| `--json <json>` | Form data as JSON string |
| `--file <path>` | Path to JSON file (use '-' for stdin) |

### `marvin forms delete <id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id>` | Form ID (required) | - |
| `--yes` | Skip confirmation prompt | Required |

### `marvin forms submissions <form-id>`

| Option | Description |
|--------|-------------|
| `<form-id>` | Form ID (required) |
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |
| `--output <format>` | Output format: table, json, yaml |

### `marvin forms get-published <slug>`

| Option | Description |
|--------|-------------|
| `<slug>` | Form slug (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

### `marvin forms submit <slug>`

| Option | Description |
|--------|-------------|
| `<slug>` | Form slug (required) |
| `--json <json>` | Submission data as JSON string |
| `--file <path>` | Path to JSON file (use '-' for stdin) |

## Examples

### Basic Usage

List all forms:

```bash
marvin forms list
```

Output:

```
┌──────────────────────┬─────────────┬────────┬────────┬─────────────┬────────────┐
│ ID                   │ Slug        │ Name   │ Status │ Submissions │ Created    │
├──────────────────────┼─────────────┼────────┼────────┼─────────────┼────────────┤
│ 01234567-89ab-cdef   │ contact     │ Contact│ active │ 42          │ 2026-06-01 │
│ 89abcdef-0123-4567   │ feedback    │ Feedback│active │ 18          │ 2026-06-15 │
│ cdef0123-4567-89ab   │ newsletter  │ Subscribe│draft  │ 0           │ 2026-07-01 │
└──────────────────────┴─────────────┴────────┴────────┴─────────────┴────────────┘
```

Get a specific form:

```bash
marvin forms get 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌──────────────────┬────────────────────────────────────┐
│ Field            │ Value                              │
├──────────────────┼────────────────────────────────────┤
│ ID               │ 01234567-89ab-cdef-0123-456789abcdef│
│ Slug             │ contact                            │
│ Name             │ Contact Form                       │
│ Status           │ active                             │
│ Submissions      │ 42                                 │
│ Created          │ 2026-06-01T10:00:00Z               │
└──────────────────┴────────────────────────────────────┘
```

### Create Form

Create from JSON string:

```bash
marvin forms create --json '{
  "name": "Contact Form",
  "slug": "contact",
  "status": "active",
  "fields": [
    {
      "name": "name",
      "label": "Your Name",
      "type": "text",
      "required": true
    },
    {
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true
    },
    {
      "name": "message",
      "label": "Message",
      "type": "textarea",
      "required": true
    }
  ],
  "notifications": {
    "email": "admin@example.com",
    "subject": "New Contact Form Submission"
  }
}'
```

Create from file:

```bash
cat > contact-form.json <<EOF
{
  "name": "Newsletter Signup",
  "slug": "newsletter",
  "status": "active",
  "fields": [
    {
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "validations": {
        "email": true
      }
    },
    {
      "name": "frequency",
      "label": "Frequency",
      "type": "select",
      "required": true,
      "options": ["Daily", "Weekly", "Monthly"]
    }
  ]
}
EOF

marvin forms create --file contact-form.json
```

Create from stdin:

```bash
cat contact-form.json | marvin forms create --file -
```

Output:

```
✓ Created form: 01234567-89ab-cdef-0123-456789abcdef (contact)
```

### Update Form

```bash
marvin forms update 01234567-89ab-cdef-0123-4567 --json '{
  "status": "active",
  "notifications": {
    "email": "updated@example.com"
  }
}'
```

Output:

```
✓ Updated form: 01234567-89ab-cdef-0123-4567 (contact)
```

### Delete Form

```bash
marvin forms delete 01234567-89ab-cdef-0123-4567 --yes
```

Output:

```
✓ Deleted form: 01234567-89ab-cdef-0123-4567
```

### View Submissions

```bash
marvin forms submissions 01234567-89ab-cdef-0123-4567
```

Output:

```
┌──────────────────────┬────────┬─────────────────────┬──────────────┐
│ ID                   │ Status │ Submitted At        │ IP           │
├──────────────────────┼────────┼─────────────────────┼──────────────┤
│ abcd1234-5678-90ab   │ new    │ 2026-07-10 09:30:00 │ 192.168.1.1  │
│ ef012345-6789-abcd   │ read   │ 2026-07-09 14:20:00 │ 192.168.1.2  │
│ 12345678-90ab-cdef   │ new    │ 2026-07-08 11:15:00 │ 192.168.1.3  │
└──────────────────────┴────────┴─────────────────────┴──────────────┘
```

JSON output:

```bash
marvin forms submissions 01234567-89ab-cdef-0123-4567 --json
```

```json
[
  {
    "id": "abcd1234-5678-90ab-cdef-0123456789ab",
    "formId": "01234567-89ab-cdef-0123-456789abcdef",
    "status": "new",
    "submittedAt": "2026-07-10T09:30:00Z",
    "ipAddress": "192.168.1.1",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I'd like to learn more about your services."
    }
  }
]
```

### Publishing API

Get published form schema:

```bash
marvin forms get-published contact --json
```

```json
{
  "slug": "contact",
  "name": "Contact Form",
  "fields": [
    {
      "name": "name",
      "label": "Your Name",
      "type": "text",
      "required": true
    },
    {
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true
    }
  ]
}
```

Submit to published form:

```bash
marvin forms submit contact --json '{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Test submission"
}'
```

Output:

```
✓ Submitted to form: contact
```

## Form Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Form name |
| `slug` | string | URL-friendly identifier |
| `fields` | array | Form field definitions |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `status` | string | Form status (draft, active, archived) | `draft` |
| `description` | string | Form description | - |
| `notifications` | object | Email notification settings | - |
| `successMessage` | string | Message shown after submission | Default message |
| `redirectUrl` | string | URL to redirect after submission | - |

### Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `email` | Email address input |
| `number` | Numeric input |
| `tel` | Phone number input |
| `url` | URL input |
| `date` | Date picker |
| `select` | Dropdown selection |
| `radio` | Radio button group |
| `checkbox` | Checkbox |
| `file` | File upload |

## Use Cases

### Export Form Submissions

```bash
marvin forms submissions 01234567-89ab-cdef-0123-4567 --json > submissions.json
```

### Count Submissions

```bash
marvin forms submissions 01234567-89ab-cdef-0123-4567 --json | jq 'length'
```

Output:

```
42
```

### Find New Submissions

```bash
marvin forms submissions 01234567-89ab-cdef-0123-4567 --json | jq '.[] | select(.status == "new")'
```

### Test Form Submission

```bash
echo '{"name": "Test", "email": "test@example.com"}' | \
  marvin forms submit contact --file -
```

### List Active Forms

```bash
marvin forms list --json | jq '.[] | select(.status == "active")'
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Export all form submissions
FORMS=$(marvin forms list --json)

echo "$FORMS" | jq -c '.[]' | while read -r form; do
  ID=$(echo "$form" | jq -r '.id')
  SLUG=$(echo "$form" | jq -r '.slug')
  
  echo "Exporting submissions for: $SLUG"
  marvin forms submissions "$ID" --json > "submissions-${SLUG}.json"
done

echo "Export complete"
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all forms
const forms = JSON.parse(
  execSync('marvin forms list --json', { encoding: 'utf-8' })
);

console.log(`Total forms: ${forms.length}\n`);

// Get submission counts
forms.forEach(form => {
  const submissions = JSON.parse(
    execSync(`marvin forms submissions ${form.id} --json`, { 
      encoding: 'utf-8' 
    })
  );
  
  const newCount = submissions.filter(s => s.status === 'new').length;
  
  console.log(`${form.name} (${form.slug})`);
  console.log(`  Total: ${submissions.length}`);
  console.log(`  New: ${newCount}`);
  console.log('');
});
```

### Python

```python
import subprocess
import json
from datetime import datetime, timedelta

# Get all forms
result = subprocess.run(
    ['marvin', 'forms', 'list', '--json'],
    capture_output=True,
    text=True
)

forms = json.loads(result.stdout)

# Get submissions from last 24 hours
recent_cutoff = datetime.now() - timedelta(days=1)

for form in forms:
    result = subprocess.run(
        ['marvin', 'forms', 'submissions', form['id'], '--json'],
        capture_output=True,
        text=True
    )
    
    submissions = json.loads(result.stdout)
    
    recent = [
        s for s in submissions
        if datetime.fromisoformat(s['submittedAt'].replace('Z', '+00:00')) > recent_cutoff
    ]
    
    if recent:
        print(f"{form['name']}: {len(recent)} submissions in last 24h")
```

### Process Form Submissions

```javascript
// scripts/process-submissions.js
const { execSync } = require('child_process');
const fs = require('fs');

const FORM_ID = '01234567-89ab-cdef-0123-456789abcdef';

// Get all submissions
const submissions = JSON.parse(
  execSync(`marvin forms submissions ${FORM_ID} --json`, { 
    encoding: 'utf-8' 
  })
);

// Process new submissions
const newSubmissions = submissions.filter(s => s.status === 'new');

console.log(`Processing ${newSubmissions.length} new submissions...\n`);

newSubmissions.forEach(submission => {
  console.log(`Name: ${submission.data.name}`);
  console.log(`Email: ${submission.data.email}`);
  console.log(`Message: ${submission.data.message}`);
  console.log('---');
  
  // TODO: Send to CRM, email, etc.
});

// Export to CSV
const csv = [
  'Name,Email,Message,Submitted At',
  ...newSubmissions.map(s => 
    `"${s.data.name}","${s.data.email}","${s.data.message}","${s.submittedAt}"`
  )
].join('\n');

fs.writeFileSync('new-submissions.csv', csv);
console.log('\nExported to new-submissions.csv');
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

For Publishing API commands:

```bash
marvin workspace token <site-token>
```

### 404 Not Found

Form doesn't exist:

```bash
# List all forms to find valid IDs
marvin forms list --json | jq -r '.[].id'
```

### Invalid Form Data

When creating with invalid field configuration:

```bash
# Validate JSON first
echo '{"name": "test"}' | jq .

# Check required fields
marvin forms create --json '{
  "name": "Test Form",
  "slug": "test",
  "fields": [...]
}'
```

### Delete Without Confirmation

Must provide `--yes` flag:

```bash
marvin forms delete <form-id> --yes
```

## Related Commands

- [`marvin workspace use`](workspaces.md) - Set active workspace
- [`marvin event-log list`](event-log.md) - View form submission events
- [`marvin email-templates list`](email-templates.md) - Configure form notification emails

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/forms
GET /api/platform/workspaces/{workspace_id}/forms/{id}
POST /api/platform/workspaces/{workspace_id}/forms
PATCH /api/platform/workspaces/{workspace_id}/forms/{id}
DELETE /api/platform/workspaces/{workspace_id}/forms/{id}
GET /api/platform/workspaces/{workspace_id}/forms/{id}/submissions

GET /api/{workspace}/forms/{slug} (Publishing API)
POST /api/{workspace}/forms/{slug}/submit (Publishing API)
```

See [API Mapping](../reference/api-mapping.md) for more details.
