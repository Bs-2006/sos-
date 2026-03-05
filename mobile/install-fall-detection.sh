#!/bin/bash

# Fall Detection Feature - Installation Script
# This script installs the required dependencies for the fall detection feature

echo "🚀 Installing Fall Detection Dependencies..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing expo-sensors..."
npm install

echo ""
echo "✅ Installation Complete!"
echo ""
echo "📱 Next Steps:"
echo "1. Run 'npm start' to start the development server"
echo "2. Open the app on a physical device (accelerometer required)"
echo "3. Navigate to Profile → Fall Detection"
echo "4. Add emergency contacts and enable fall detection"
echo "5. Test the feature using the 'Test Fall Detection' button"
echo ""
echo "📚 Documentation:"
echo "- Full Guide: FALL_DETECTION_GUIDE.md"
echo "- Quick Setup: FALL_DETECTION_SETUP.md"
echo "- Implementation: ../FALL_DETECTION_IMPLEMENTATION.md"
echo ""
echo "⚠️  Note: Fall detection requires a physical device with accelerometer"
echo ""
