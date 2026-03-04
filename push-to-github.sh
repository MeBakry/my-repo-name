#!/bin/bash
# Create GitHub repo and push — requires GITHUB_TOKEN (create at github.com/settings/tokens)
set -e
REPO_NAME="${1:-pharma}"
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: Set GITHUB_TOKEN first. Create one at: https://github.com/settings/tokens"
  echo "  export GITHUB_TOKEN=ghp_xxxx"
  exit 1
fi
USERNAME=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep '"login"' | sed 's/.*"login": "\(.*\)".*/\1/')
if [ -z "$USERNAME" ]; then
  echo "Error: Invalid GITHUB_TOKEN"
  exit 1
fi
echo "Creating repo $REPO_NAME for $USERNAME..."
curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Pharmacy Compounding Compliance Platform\"}"
echo ""
git remote remove origin 2>/dev/null || true
git remote add origin "https://${USERNAME}:${GITHUB_TOKEN}@github.com/${USERNAME}/${REPO_NAME}.git"
git push -u origin main
git remote set-url origin "https://github.com/${USERNAME}/${REPO_NAME}.git"
echo "Done: https://github.com/${USERNAME}/${REPO_NAME}"
