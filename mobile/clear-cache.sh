#!/bin/bash

echo "Clearing React Native / Expo cache..."

# Clear watchman
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping..."

# Clear metro bundler cache
rm -rf $TMPDIR/metro-* 2>/dev/null || echo "No metro cache found"
rm -rf $TMPDIR/react-* 2>/dev/null || echo "No react cache found"

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Clear expo cache
npx expo start --clear

echo "Cache cleared! You can now run: npx expo start"
