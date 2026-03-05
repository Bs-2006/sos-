#!/bin/bash

echo "======================================"
echo "  LifeLink Android Build Script"
echo "======================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null
then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

echo "✅ EAS CLI is installed"
echo ""

# Check if logged in
echo "Checking Expo login status..."
eas whoami || {
    echo "❌ Not logged in to Expo"
    echo "Please run: eas login"
    exit 1
}

echo ""
echo "Select build type:"
echo "1) Preview (APK for testing) - Recommended"
echo "2) Production (APK for release)"
echo "3) Development (with dev tools)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting PREVIEW build..."
        echo "This will take 10-20 minutes"
        echo ""
        eas build --platform android --profile preview
        ;;
    2)
        echo ""
        echo "🚀 Starting PRODUCTION build..."
        echo "This will take 10-20 minutes"
        echo ""
        eas build --platform android --profile production
        ;;
    3)
        echo ""
        echo "🚀 Starting DEVELOPMENT build..."
        echo "This will take 10-20 minutes"
        echo ""
        eas build --platform android --profile development
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Build started!"
echo ""
echo "You can:"
echo "- Wait here for completion"
echo "- Check status: eas build:list"
echo "- View on web: https://expo.dev"
echo ""
