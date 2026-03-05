#!/bin/bash

# Fix Expo update error
echo "🔧 Fixing Expo update error..."

# Clear Expo cache
echo "1. Clearing Expo cache..."
npx expo start -c

echo "✅ Done! Try starting the app again with: npm start"
