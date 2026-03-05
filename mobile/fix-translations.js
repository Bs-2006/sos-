#!/usr/bin/env node

/**
 * Translation Fix Helper Script
 * 
 * This script helps identify which screens need translation support
 * and provides guidance on how to fix them.
 */

const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

// Read all screen files
const screenFiles = fs.readdirSync(screensDir).filter(file => file.endsWith('.js'));

console.log('🔍 Analyzing screens for translation support...\n');

const results = {
  withTranslation: [],
  withoutTranslation: [],
};

screenFiles.forEach(file => {
  const filePath = path.join(screensDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasUseTranslation = content.includes('useTranslation');
  const hasTranslationImport = content.includes("from '../hooks/useTranslation'");
  
  if (hasUseTranslation && hasTranslationImport) {
    results.withTranslation.push(file);
  } else {
    results.withoutTranslation.push(file);
  }
});

console.log('✅ Screens WITH translation support:');
results.withTranslation.forEach(file => {
  console.log(`   - ${file}`);
});

console.log(`\n❌ Screens WITHOUT translation support (${results.withoutTranslation.length}):`);
results.withoutTranslation.forEach(file => {
  console.log(`   - ${file}`);
});

console.log(`\n📊 Summary:`);
console.log(`   Total screens: ${screenFiles.length}`);
console.log(`   With translations: ${results.withTranslation.length}`);
console.log(`   Without translations: ${results.withoutTranslation.length}`);
console.log(`   Coverage: ${Math.round((results.withTranslation.length / screenFiles.length) * 100)}%`);

console.log(`\n📝 To fix a screen:`);
console.log(`   1. Add import: import { useTranslation } from '../hooks/useTranslation';`);
console.log(`   2. Add hook: const { t } = useTranslation();`);
console.log(`   3. Replace text: <Text>{t('section.key')}</Text>`);

console.log(`\n💡 Run this script again after making changes to track progress.`);
