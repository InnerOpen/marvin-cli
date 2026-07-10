# CI/CD Integration

Integrate the Marvin CLI into your CI/CD pipelines for automated testing, deployment, and content validation.

## Overview

The Marvin CLI works seamlessly in CI/CD environments:

- **Automated content verification** - Validate published content
- **Deployment checks** - Ensure content is ready before deploying
- **Content testing** - Test content structure and data
- **Scheduled exports** - Automate backups and reports

## GitHub Actions

### Basic Workflow

```yaml
# .github/workflows/marvin-check.yml
name: Verify Marvin Content

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  verify-content:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Marvin CLI
        run: npm install -g @inneropen/marvin-cli
      
      - name: Verify Marvin connection
        env:
          MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
          MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}
          MARVIN_WORKSPACE_SLUG: ${{ secrets.MARVIN_WORKSPACE_SLUG }}
        run: marvin publish site
      
      - name: Check published entries
        env:
          MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
          MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}
          MARVIN_WORKSPACE_SLUG: ${{ secrets.MARVIN_WORKSPACE_SLUG }}
        run: |
          COUNT=$(marvin publish entries --json | jq 'length')
          echo "Found $COUNT published entries"
          if [ $COUNT -eq 0 ]; then
            echo "ERROR: No published entries found"
            exit 1
          fi
```

### Content Validation

```yaml
# .github/workflows/validate-content.yml
name: Validate Content

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm install -g @inneropen/marvin-cli
          npm install -g jq
      
      - name: Validate required pages exist
        env:
          MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
          MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}
          MARVIN_WORKSPACE_SLUG: ${{ secrets.MARVIN_WORKSPACE_SLUG }}
        run: |
          # Check required pages
          REQUIRED_PAGES=("homepage" "about" "contact")
          
          for page in "${REQUIRED_PAGES[@]}"; do
            if marvin publish entry "$page" --json >/dev/null 2>&1; then
              echo "✓ $page exists"
            else
              echo "✗ $page is missing"
              exit 1
            fi
          done
      
      - name: Validate all entries have required fields
        env:
          MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
          MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}
          MARVIN_WORKSPACE_SLUG: ${{ secrets.MARVIN_WORKSPACE_SLUG }}
        run: |
          # Check for entries missing descriptions
          MISSING=$(marvin publish entries --json | \
            jq '[.[] | select(.description == null or .description == "")] | length')
          
          if [ "$MISSING" -gt 0 ]; then
            echo "WARNING: $MISSING entries missing descriptions"
            marvin publish entries --json | \
              jq -r '.[] | select(.description == null or .description == "") | 
                     "  - \(.title) (\(.slug))"'
          else
            echo "✓ All entries have descriptions"
          fi
```

### Deploy with Content Check

```yaml
# .github/workflows/deploy.yml
name: Deploy Site

on:
  push:
    branches: [main]

jobs:
  verify-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Marvin CLI
        run: npm install -g @inneropen/marvin-cli
      
      - name: Fetch content from Marvin
        env:
          MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
          MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}
          MARVIN_WORKSPACE_SLUG: ${{ secrets.MARVIN_WORKSPACE_SLUG }}
        run: |
          mkdir -p src/data
          
          echo "Fetching site config..."
          marvin publish site --json > src/data/site.json
          
          echo "Fetching entries..."
          marvin publish entries --json > src/data/entries.json
          
          echo "Fetching collections..."
          marvin publish collections --json > src/data/collections.json
          
          # Verify we got data
          ENTRY_COUNT=$(jq 'length' src/data/entries.json)
          echo "Fetched $ENTRY_COUNT entries"
          
          if [ $ENTRY_COUNT -eq 0 ]; then
            echo "ERROR: No entries fetched"
            exit 1
          fi
      
      - name: Build site
        run: npm run build
      
      - name: Deploy to production
        run: npm run deploy
```

### Content Backup

```yaml
# .github/workflows/backup.yml
name: Backup Content

on:
  schedule:
    # Daily at 3 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Marvin CLI
        run: npm install -g @inneropen/marvin-cli
      
      - name: Create backup
        env:
          MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
          MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}
          MARVIN_WORKSPACE_SLUG: ${{ secrets.MARVIN_WORKSPACE_SLUG }}
        run: |
          DATE=$(date +%Y%m%d)
          BACKUP_DIR="backups/$DATE"
          mkdir -p "$BACKUP_DIR"
          
          echo "Backing up entries..."
          marvin publish entries --json > "$BACKUP_DIR/entries.json"
          
          echo "Backing up collections..."
          marvin publish collections --json > "$BACKUP_DIR/collections.json"
          
          echo "Backing up resources..."
          marvin publish resources --json > "$BACKUP_DIR/resources.json"
          
          echo "Backing up assets..."
          marvin publish assets --json > "$BACKUP_DIR/assets.json"
          
          echo "Backing up site config..."
          marvin publish site --json > "$BACKUP_DIR/site.json"
          
          # Create manifest
          jq -n \
            --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --argjson entries "$(jq 'length' < "$BACKUP_DIR/entries.json")" \
            --argjson collections "$(jq 'length' < "$BACKUP_DIR/collections.json")" \
            --argjson assets "$(jq 'length' < "$BACKUP_DIR/assets.json")" \
            '{
              backupDate: $date,
              counts: {
                entries: $entries,
                collections: $collections,
                assets: $assets
              }
            }' > "$BACKUP_DIR/manifest.json"
          
          # Compress backup
          tar -czf "backup-$DATE.tar.gz" "$BACKUP_DIR"
          
          echo "Backup complete: backup-$DATE.tar.gz"
      
      - name: Upload backup artifact
        uses: actions/upload-artifact@v4
        with:
          name: marvin-backup-${{ github.run_number }}
          path: backup-*.tar.gz
          retention-days: 30
```

## GitLab CI

### Basic Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - verify
  - test
  - deploy

variables:
  MARVIN_API_URL: $MARVIN_API_URL
  MARVIN_SITE_CLIENT_TOKEN: $MARVIN_SITE_CLIENT_TOKEN
  MARVIN_WORKSPACE_SLUG: $MARVIN_WORKSPACE_SLUG

before_script:
  - npm install -g @inneropen/marvin-cli

verify:marvin:
  stage: verify
  script:
    - marvin publish site
    - COUNT=$(marvin publish entries --json | jq 'length')
    - echo "Found $COUNT entries"
    - |
      if [ $COUNT -eq 0 ]; then
        echo "ERROR: No published entries"
        exit 1
      fi

test:content:
  stage: test
  script:
    - marvin publish entries --json > entries.json
    - |
      # Validate all entries have titles
      MISSING=$(jq '[.[] | select(.title == null or .title == "")] | length' entries.json)
      if [ $MISSING -gt 0 ]; then
        echo "ERROR: $MISSING entries missing titles"
        exit 1
      fi
    - echo "✓ Content validation passed"

deploy:production:
  stage: deploy
  only:
    - main
  script:
    - mkdir -p public/data
    - marvin publish entries --json > public/data/entries.json
    - marvin publish collections --json > public/data/collections.json
    - marvin publish site --json > public/data/site.json
    - npm run build
    - npm run deploy
  artifacts:
    paths:
      - public
```

### Scheduled Content Check

```yaml
# .gitlab-ci.yml
verify:scheduled:
  stage: verify
  script:
    - marvin publish entries --json > entries.json
    - |
      # Generate report
      echo "Content Report - $(date)"
      echo "========================"
      echo "Total Entries: $(jq 'length' entries.json)"
      echo ""
      echo "By Type:"
      jq -r 'group_by(.entryType) | 
             .[] | "  \(.[0].entryType): \(length)"' entries.json
  only:
    - schedules
  artifacts:
    reports:
      junit: content-report.xml
```

## Jenkins

### Jenkinsfile

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        MARVIN_API_URL = credentials('marvin-api-url')
        MARVIN_SITE_CLIENT_TOKEN = credentials('marvin-site-token')
        MARVIN_WORKSPACE_SLUG = credentials('marvin-workspace')
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @inneropen/marvin-cli'
            }
        }
        
        stage('Verify Content') {
            steps {
                sh '''
                    marvin publish site
                    
                    COUNT=$(marvin publish entries --json | jq 'length')
                    echo "Found $COUNT entries"
                    
                    if [ $COUNT -eq 0 ]; then
                        echo "ERROR: No published entries"
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Fetch Content') {
            steps {
                sh '''
                    mkdir -p data
                    marvin publish entries --json > data/entries.json
                    marvin publish collections --json > data/collections.json
                    marvin publish site --json > data/site.json
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run deploy'
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'data/*.json', allowEmptyArchive: true
        }
        failure {
            emailext(
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Content verification or build failed. Check Jenkins for details.",
                to: "team@example.com"
            )
        }
    }
}
```

### Scheduled Backup Job

```groovy
// Jenkinsfile.backup
pipeline {
    agent any
    
    triggers {
        cron('0 3 * * *') // Daily at 3 AM
    }
    
    environment {
        MARVIN_API_URL = credentials('marvin-api-url')
        MARVIN_SITE_CLIENT_TOKEN = credentials('marvin-site-token')
        MARVIN_WORKSPACE_SLUG = credentials('marvin-workspace')
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @inneropen/marvin-cli'
            }
        }
        
        stage('Backup Content') {
            steps {
                sh '''
                    DATE=$(date +%Y%m%d)
                    BACKUP_DIR="backups/$DATE"
                    mkdir -p "$BACKUP_DIR"
                    
                    echo "Backing up entries..."
                    marvin publish entries --json > "$BACKUP_DIR/entries.json"
                    
                    echo "Backing up collections..."
                    marvin publish collections --json > "$BACKUP_DIR/collections.json"
                    
                    echo "Backing up resources..."
                    marvin publish resources --json > "$BACKUP_DIR/resources.json"
                    
                    echo "Backing up assets..."
                    marvin publish assets --json > "$BACKUP_DIR/assets.json"
                    
                    tar -czf "backup-$DATE.tar.gz" "$BACKUP_DIR"
                    
                    # Keep only last 30 days
                    find backups/ -name "*.tar.gz" -mtime +30 -delete
                '''
            }
        }
    }
    
    post {
        success {
            archiveArtifacts artifacts: 'backup-*.tar.gz'
        }
    }
}
```

## CircleCI

### Configuration

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.1

jobs:
  verify-content:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install Marvin CLI
          command: npm install -g @inneropen/marvin-cli
      - run:
          name: Verify content
          command: |
            marvin publish site
            
            COUNT=$(marvin publish entries --json | jq 'length')
            echo "Found $COUNT entries"
            
            if [ $COUNT -eq 0 ]; then
              echo "ERROR: No published entries"
              exit 1
            fi
  
  fetch-and-build:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: |
            npm install -g @inneropen/marvin-cli
            npm ci
      - run:
          name: Fetch content from Marvin
          command: |
            mkdir -p src/data
            marvin publish entries --json > src/data/entries.json
            marvin publish collections --json > src/data/collections.json
            marvin publish site --json > src/data/site.json
      - run:
          name: Build site
          command: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist
  
  deploy:
    docker:
      - image: cimg/node:20.0
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Deploy to production
          command: npm run deploy

workflows:
  main:
    jobs:
      - verify-content:
          context: marvin-credentials
      - fetch-and-build:
          context: marvin-credentials
          requires:
            - verify-content
      - deploy:
          requires:
            - fetch-and-build
          filters:
            branches:
              only: main
  
  nightly:
    triggers:
      - schedule:
          cron: "0 3 * * *"
          filters:
            branches:
              only: main
    jobs:
      - verify-content:
          context: marvin-credentials
```

## Travis CI

### Configuration

```yaml
# .travis.yml
language: node_js
node_js:
  - '20'

env:
  global:
    - MARVIN_API_URL=$MARVIN_API_URL
    - MARVIN_SITE_CLIENT_TOKEN=$MARVIN_SITE_CLIENT_TOKEN
    - MARVIN_WORKSPACE_SLUG=$MARVIN_WORKSPACE_SLUG

install:
  - npm install -g @inneropen/marvin-cli
  - npm ci

script:
  - marvin publish site
  - marvin publish entries --json > entries.json
  - |
    COUNT=$(jq 'length' entries.json)
    echo "Found $COUNT entries"
    if [ $COUNT -eq 0 ]; then
      echo "ERROR: No published entries"
      exit 1
    fi
  - npm run build

deploy:
  provider: script
  script: npm run deploy
  on:
    branch: main

# Scheduled backup
cron:
  - if: type = cron
    script:
      - ./scripts/backup-content.sh
```

## Bitbucket Pipelines

### Configuration

```yaml
# bitbucket-pipelines.yml
image: node:20

definitions:
  scripts:
    - &install-marvin npm install -g @inneropen/marvin-cli
  
  steps:
    - step: &verify-content
        name: Verify Content
        script:
          - *install-marvin
          - marvin publish site
          - |
            COUNT=$(marvin publish entries --json | jq 'length')
            echo "Found $COUNT entries"
            if [ $COUNT -eq 0 ]; then
              echo "ERROR: No published entries"
              exit 1
            fi
    
    - step: &build
        name: Build Site
        script:
          - *install-marvin
          - npm ci
          - mkdir -p src/data
          - marvin publish entries --json > src/data/entries.json
          - marvin publish collections --json > src/data/collections.json
          - marvin publish site --json > src/data/site.json
          - npm run build
        artifacts:
          - dist/**
    
    - step: &deploy
        name: Deploy
        deployment: production
        script:
          - npm run deploy

pipelines:
  default:
    - step: *verify-content
  
  branches:
    main:
      - step: *verify-content
      - step: *build
      - step: *deploy
  
  custom:
    backup-content:
      - step:
          name: Backup Content
          script:
            - *install-marvin
            - ./scripts/backup-content.sh
```

## Docker Integration

### Dockerfile

```dockerfile
FROM node:20-alpine

# Install Marvin CLI
RUN npm install -g @inneropen/marvin-cli

# Set working directory
WORKDIR /app

# Copy application
COPY package*.json ./
RUN npm ci

COPY . .

# Environment variables (set at runtime)
ENV MARVIN_API_URL=""
ENV MARVIN_SITE_CLIENT_TOKEN=""
ENV MARVIN_WORKSPACE_SLUG=""

# Fetch content and build
CMD ["sh", "-c", "marvin publish entries --json > data/entries.json && npm run build"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  fetch-content:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./data:/app/data
    environment:
      MARVIN_API_URL: ${MARVIN_API_URL}
      MARVIN_SITE_CLIENT_TOKEN: ${MARVIN_SITE_CLIENT_TOKEN}
      MARVIN_WORKSPACE_SLUG: ${MARVIN_WORKSPACE_SLUG}
    command: >
      sh -c "
        npm install -g @inneropen/marvin-cli &&
        marvin publish entries --json > /app/data/entries.json &&
        marvin publish collections --json > /app/data/collections.json &&
        marvin publish site --json > /app/data/site.json
      "
  
  build-site:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
      - ./data:/app/src/data
    depends_on:
      - fetch-content
    command: sh -c "npm ci && npm run build"
```

## Best Practices

### Store Credentials Securely

```yaml
# GitHub Actions - Use secrets
env:
  MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
  MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_CLIENT_TOKEN }}

# GitLab CI - Use protected variables
variables:
  MARVIN_API_URL: $MARVIN_API_URL
  MARVIN_SITE_CLIENT_TOKEN: $MARVIN_SITE_CLIENT_TOKEN

# Jenkins - Use credentials plugin
environment {
  MARVIN_SITE_CLIENT_TOKEN = credentials('marvin-site-token')
}
```

### Cache Dependencies

```yaml
# GitHub Actions
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# GitLab CI
cache:
  paths:
    - node_modules/
    - .npm/
```

### Fail Fast

```bash
# Stop on first error
set -e
set -o pipefail

# Verify critical content exists before continuing
if ! marvin publish entry homepage --json >/dev/null 2>&1; then
  echo "ERROR: Homepage not found"
  exit 1
fi
```

### Add Timeouts

```yaml
# GitHub Actions
- name: Fetch content
  timeout-minutes: 5
  run: marvin publish entries --json > entries.json

# GitLab CI
verify:marvin:
  timeout: 5 minutes
  script:
    - marvin publish entries --json
```

### Validate Before Deploy

```bash
#!/bin/bash
# Pre-deployment validation

# Check content exists
COUNT=$(marvin publish entries --json | jq 'length')
if [ $COUNT -eq 0 ]; then
  echo "ERROR: No content to deploy"
  exit 1
fi

# Check required pages
REQUIRED=("homepage" "about" "contact")
for page in "${REQUIRED[@]}"; do
  if ! marvin publish entry "$page" --json >/dev/null 2>&1; then
    echo "ERROR: Required page '$page' missing"
    exit 1
  fi
done

echo "✓ Validation passed"
```

### Generate Deployment Reports

```yaml
- name: Generate deployment report
  run: |
    {
      echo "Deployment Report - $(date)"
      echo "=========================="
      echo ""
      echo "Entries: $(marvin publish entries --json | jq 'length')"
      echo "Collections: $(marvin publish collections --json | jq 'length')"
      echo "Assets: $(marvin publish assets --json | jq 'length')"
      echo ""
      echo "By Type:"
      marvin publish entries --json | \
        jq -r 'group_by(.entryType) | .[] | "  \(.[0].entryType): \(length)"'
    } > deployment-report.txt

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: deployment-report
    path: deployment-report.txt
```

## Troubleshooting

### Authentication Failures

```yaml
# Test authentication before main job
- name: Test Marvin connection
  run: |
    if ! marvin publish site >/dev/null 2>&1; then
      echo "ERROR: Cannot connect to Marvin"
      echo "Check MARVIN_API_URL and MARVIN_SITE_CLIENT_TOKEN"
      exit 1
    fi
```

### Rate Limiting

```bash
# Add delays between requests
marvin publish entries --json | jq -r '.[].slug' | while read -r slug; do
  marvin publish entry "$slug" --json > "entries/${slug}.json"
  sleep 0.1  # Small delay to avoid rate limiting
done
```

### Network Issues

```yaml
# Add retries
- name: Fetch content (with retry)
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 3
    max_attempts: 3
    command: marvin publish entries --json > entries.json
```

## Related

- [Scripting Guide](scripting.md)
- [Data Pipelines](pipelines.md)
- [Examples: Automation](../examples/automation.md)
- [Configuration](../getting-started/configuration.md)
