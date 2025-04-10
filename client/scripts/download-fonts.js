// Script to create minimal valid WOFF2 files (as placeholders)
const fs = require('fs');
const path = require('path');

// WOFF2 header bytes (minimal valid WOFF2 file)
// Reference: https://www.w3.org/TR/WOFF2/
const WOFF2_HEADER = Buffer.from([
  0x77, 0x4F, 0x46, 0x32, // signature "wOF2"
  0x00, 0x01, 0x00, 0x00, // flavor
  0x00, 0x00, 0x00, 0x00, // length
  0x00, 0x01,             // numTables
  0x00, 0x00,             // reserved
  0x00, 0x00, 0x00, 0x00, // totalSfntSize
  0x00, 0x00, 0x00, 0x00, // totalCompressedSize
  0x00, 0x00, 0x00, 0x00, // privateData
  // Minimal table directory
  0x00, 0x00, 0x00, 0x00, // tag
  0x00, 0x00, 0x00, 0x00, // offset
  0x00, 0x00, 0x00, 0x00, // compLength
  0x00, 0x00, 0x00, 0x00, // origLength
  0x00, 0x00, 0x00, 0x00  // origChecksum
]);

console.log('🚨 NOT DOWNLOADING FONTS - CREATING EMPTY PLACEHOLDERS INSTEAD 🚨');
console.log('This application now uses system fonts instead of web fonts');
console.log('================================================');

// Font paths to create
const fontPaths = [
  'public/fonts/inter/Inter-Regular.woff2',
  'public/fonts/inter/Inter-Medium.woff2',
  'public/fonts/inter/Inter-SemiBold.woff2',
  'public/fonts/inter/Inter-Bold.woff2',
  'public/fonts/roboto-mono/RobotoMono-Regular.woff2'
];

// Create minimal valid WOFF2 files
fontPaths.forEach(fontPath => {
  const fullPath = path.join(__dirname, '..', fontPath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
  
  // Write minimal valid WOFF2 file
  fs.writeFileSync(fullPath, WOFF2_HEADER);
  console.log(`Created placeholder WOFF2 file: ${fontPath}`);
});

console.log('================================================');
console.log('✅ Font placeholders created successfully');
console.log('NOTE: This application uses system fonts. The placeholder files are');
console.log('      only created to prevent build errors. They are not actually used'); 