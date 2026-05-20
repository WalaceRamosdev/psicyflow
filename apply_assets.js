const fs = require('fs');
const path = require('path');

const srcIcon = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\9c8ea180-9372-4573-9ba5-8863a5d25e4a\\psychflow_app_icon_1779130762798.png";
const destDir = path.join(__dirname, 'assets');

const destIcon = path.join(destDir, 'icon.png');
const destAdaptive = path.join(destDir, 'adaptive-icon.png');

try {
  // Ensure assets directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy icon
  fs.copyFileSync(srcIcon, destIcon);
  console.log("Successfully updated assets/icon.png! 🎉");

  // Copy adaptive-icon
  fs.copyFileSync(srcIcon, destAdaptive);
  console.log("Successfully updated assets/adaptive-icon.png! 🎉");

  console.log("\nApp icons updated successfully! The next APK build will package these premium graphics.");
} catch (error) {
  console.error("Failed to copy assets:", error.message);
}
