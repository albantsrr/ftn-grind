#!/bin/bash

# Script pour préparer une nouvelle release de FortiFlow
# Usage: ./scripts/prepare-release.sh <version>
# Example: ./scripts/prepare-release.sh 0.2.0

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: ./scripts/prepare-release.sh <version>"
    echo "   Example: ./scripts/prepare-release.sh 0.2.0"
    exit 1
fi

NEW_VERSION=$1
TAG_VERSION="v${NEW_VERSION}"

echo "🚀 Preparing release ${TAG_VERSION}"

# Vérifier qu'on est sur main/master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Warning: You are not on main/master branch (current: ${CURRENT_BRANCH})"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vérifier qu'il n'y a pas de changements non commités
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

echo "📝 Updating version numbers..."

# Use the centralized version sync script
node scripts/sync-version.js "${NEW_VERSION}"

if [ $? -ne 0 ]; then
    echo "❌ Version sync failed"
    exit 1
fi

# Update download page
sed -i "s/Version actuelle : <strong>v[^<]*<\\/strong>/Version actuelle : <strong>v${NEW_VERSION}<\\/strong>/" docs/index.html
sed -i "s/FortiFlow_[0-9.]*_x64_en-US.msi/FortiFlow_${NEW_VERSION}_x64_en-US.msi/" docs/index.html

echo "✅ Version numbers updated to ${NEW_VERSION}"

# Show changes
echo ""
echo "📋 Changes to be committed:"
git diff --stat

echo ""
echo "🔍 Detailed changes:"
git diff

echo ""
read -p "Commit these changes? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Run 'git restore .' to undo changes."
    exit 1
fi

# Commit changes
git add version.json frontend/src-tauri/tauri.conf.json frontend/src-tauri/Cargo.toml frontend/package.json docs/index.html
git commit -m "chore: bump version to ${TAG_VERSION}"

echo "✅ Changes committed"

# Create and push tag
echo ""
read -p "Create and push tag ${TAG_VERSION}? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag -a "${TAG_VERSION}" -m "Release ${TAG_VERSION}"
    echo "✅ Tag ${TAG_VERSION} created"

    echo ""
    read -p "Push to origin? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin "${CURRENT_BRANCH}"
        git push origin "${TAG_VERSION}"
        echo "✅ Pushed to origin"
        echo ""
        echo "🎉 Release preparation complete!"
        echo ""
        echo "📍 Next steps:"
        echo "   1. Monitor the build: https://github.com/<your-username>/ftn-grind/actions"
        echo "   2. Review the draft release: https://github.com/<your-username>/ftn-grind/releases"
        echo "   3. Publish the release when ready"
    else
        echo "ℹ️  Tag created locally. Push manually with:"
        echo "   git push origin ${CURRENT_BRANCH}"
        echo "   git push origin ${TAG_VERSION}"
    fi
else
    echo "ℹ️  Commit created. Create tag manually with:"
    echo "   git tag -a ${TAG_VERSION} -m 'Release ${TAG_VERSION}'"
    echo "   git push origin ${CURRENT_BRANCH}"
    echo "   git push origin ${TAG_VERSION}"
fi
