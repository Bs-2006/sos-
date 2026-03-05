#!/usr/bin/env node

/**
 * Version Update Helper Script
 * Automatically updates version numbers in app.json and build.gradle
 */

const fs = require('fs');
const path = require('path');

// Get version type from command line (patch, minor, major)
const versionType = process.argv[2] || 'patch';

console.log('📱 LifeLink Version Updater\n');

// Read app.json
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Current version
const currentVersion = appJson.expo.version;
const currentVersionCode = appJson.expo.android.versionCode;
const currentVersionName = appJson.expo.android.versionName;

console.log('Current Version:');
console.log(`  Version: ${currentVersion}`);
console.log(`  Version Code: ${currentVersionCode}`);
console.log(`  Version Name: ${currentVersionName}\n`);

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newMajor = major;
let newMinor = minor;
let newPatch = patch;

switch (versionType) {
  case 'major':
    newMajor++;
    newMinor = 0;
    newPatch = 0;
    break;
  case 'minor':
    newMinor++;
    newPatch = 0;
    break;
  case 'patch':
  default:
    newPatch++;
    break;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
const newVersionCode = currentVersionCode + 1;
const newVersionName = `${newMajor}.${newMinor}`;

console.log('New Version:');
console.log(`  Version: ${newVersion}`);
console.log(`  Version Code: ${newVersionCode}`);
console.log(`  Version Name: ${newVersionName}\n`);

// Update app.json
appJson.expo.version = newVersion;
appJson.expo.android.versionCode = newVersionCode;
appJson.expo.android.versionName = newVersionName;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('✅ Updated app.json\n');

// Update build.gradle if it exists
const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Update versionCode
  buildGradle = buildGradle.replace(
    /versionCode\s+\d+/,
    `versionCode ${newVersionCode}`
  );
  
  // Update versionName
  buildGradle = buildGradle.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${newVersionName}"`
  );
  
  fs.writeFileSync(buildGradlePath, buildGradle);
  console.log('✅ Updated android/app/build.gradle\n');
} else {
  console.log('⚠️  android/app/build.gradle not found');
  console.log('   Run: npx expo prebuild --platform android\n');
}

console.log('📋 Summary:');
console.log(`  ${currentVersion} (code ${currentVersionCode}) → ${newVersion} (code ${newVersionCode})`);
console.log('\n🎯 Next Steps:');
console.log('  1. Review changes');
console.log('  2. Commit to git');
console.log('  3. Build: cd android && ./gradlew assembleRelease');
console.log('  4. Test APK on device\n');

console.log('💡 Usage:');
console.log('  node update-version.js patch  # 1.1.0 → 1.1.1');
console.log('  node update-version.js minor  # 1.1.0 → 1.2.0');
console.log('  node update-version.js major  # 1.1.0 → 2.0.0\n');
