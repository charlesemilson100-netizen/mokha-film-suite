/**
 * MOKHA FILM Suite — Auto Version Bumper
 * Runs before every build to increment the patch version
 * e.g. 1.0.0 → 1.0.1 → 1.0.2 etc.
 */

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Parse current version
const parts = pkg.version.split('.').map(Number);
parts[1] += 1; // bump minor version (2.0.0 → 2.1.0)
parts[2] = 0;  // reset patch to 0
const newVersion = parts.join('.');

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log(`\n✦ MOKHA FILM Suite — Version bumped: ${newVersion}\n`);
