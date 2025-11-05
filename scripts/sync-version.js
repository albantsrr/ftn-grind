#!/usr/bin/env node

/**
 * Version Synchronization Script for FortiFlow
 *
 * This script ensures all version numbers across the project stay in sync.
 * It reads from version.json (single source of truth) and updates:
 * - frontend/package.json
 * - frontend/src-tauri/tauri.conf.json
 * - frontend/src-tauri/Cargo.toml
 *
 * Usage:
 *   node scripts/sync-version.js [new-version]
 *
 * Examples:
 *   node scripts/sync-version.js           # Just sync existing version
 *   node scripts/sync-version.js 1.1.0     # Update to new version and sync
 */

const fs = require('fs');
const path = require('path');

// File paths
const ROOT_DIR = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');
const PACKAGE_JSON = path.join(ROOT_DIR, 'frontend', 'package.json');
const TAURI_CONF = path.join(ROOT_DIR, 'frontend', 'src-tauri', 'tauri.conf.json');
const CARGO_TOML = path.join(ROOT_DIR, 'frontend', 'src-tauri', 'Cargo.toml');

/**
 * Read and parse version.json
 */
function readVersionFile() {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error reading version.json:', error.message);
    process.exit(1);
  }
}

/**
 * Write updated version.json
 */
function writeVersionFile(data) {
  try {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('✅ Updated version.json');
  } catch (error) {
    console.error('❌ Error writing version.json:', error.message);
    process.exit(1);
  }
}

/**
 * Update package.json version
 */
function updatePackageJson(version) {
  try {
    const content = fs.readFileSync(PACKAGE_JSON, 'utf8');
    const data = JSON.parse(content);
    data.version = version;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated frontend/package.json → ${version}`);
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    process.exit(1);
  }
}

/**
 * Update tauri.conf.json version
 */
function updateTauriConf(version) {
  try {
    const content = fs.readFileSync(TAURI_CONF, 'utf8');
    const data = JSON.parse(content);
    data.version = version;
    fs.writeFileSync(TAURI_CONF, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated src-tauri/tauri.conf.json → ${version}`);
  } catch (error) {
    console.error('❌ Error updating tauri.conf.json:', error.message);
    process.exit(1);
  }
}

/**
 * Update Cargo.toml version
 */
function updateCargoToml(version) {
  try {
    let content = fs.readFileSync(CARGO_TOML, 'utf8');

    // Replace version line (handles both with/without quotes)
    const versionRegex = /^version\s*=\s*["']?[\d.]+["']?/m;
    if (versionRegex.test(content)) {
      content = content.replace(versionRegex, `version = "${version}"`);
      fs.writeFileSync(CARGO_TOML, content, 'utf8');
      console.log(`✅ Updated src-tauri/Cargo.toml → ${version}`);
    } else {
      console.error('❌ Could not find version line in Cargo.toml');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error updating Cargo.toml:', error.message);
    process.exit(1);
  }
}

/**
 * Validate version format (semantic versioning)
 */
function isValidVersion(version) {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
  return semverRegex.test(version);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const newVersion = args[0];

  console.log('🔄 FortiFlow Version Synchronization\n');

  // Read current version data
  const versionData = readVersionFile();
  let targetVersion = versionData.version;

  // If new version provided, update version.json first
  if (newVersion) {
    if (!isValidVersion(newVersion)) {
      console.error(`❌ Invalid version format: ${newVersion}`);
      console.error('   Expected format: X.Y.Z or X.Y.Z-beta');
      process.exit(1);
    }

    console.log(`📝 Updating version: ${versionData.version} → ${newVersion}\n`);
    versionData.version = newVersion;
    targetVersion = newVersion;
    writeVersionFile(versionData);
  } else {
    console.log(`📌 Current version: ${targetVersion}\n`);
  }

  // Sync all files
  console.log('🔧 Synchronizing version across files...\n');
  updatePackageJson(targetVersion);
  updateTauriConf(targetVersion);
  updateCargoToml(targetVersion);

  console.log('\n✨ Version synchronization complete!');
  console.log(`   All files now use version: ${targetVersion}`);

  if (newVersion) {
    console.log('\n💡 Next steps:');
    console.log('   1. Review changes: git diff');
    console.log('   2. Commit: git add . && git commit -m "chore: bump version to ' + targetVersion + '"');
    console.log('   3. Tag: git tag v' + targetVersion);
    console.log('   4. Push: git push && git push --tags');
  }
}

// Run the script
main();
