#!/bin/bash

# Cursor Security Agent - Secret Scanner

echo "--- Starting Secret Scan ---"

# Define patterns to search for

PATTERNS=(
"password ="
"secret ="
"api*key"
"AIza[0-9A-Za-z-*]{35}" # Google API Key
"cloud*api_key"
"-----BEGIN RSA PRIVATE KEY-----"
"xox[bapts]-" # Slack Tokens
"sk_live*[0-9a-zA-Z]{24}" # Stripe Live Key
)

for pattern in "${PATTERNS[@]}"; do
    echo "Checking for: $pattern"
    grep -rnE "$pattern" . --exclude-dir={.git,node_modules,dist,build,.cursor}
done

echo "--- Scan Complete ---"
