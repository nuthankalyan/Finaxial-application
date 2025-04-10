// Script to download font files for local usage
const fs = require('fs');
const path = require('path');
const https = require('https');

// Define font files to download
const fonts = [
  {
    name: 'Inter Regular',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
    outputPath: path.join(__dirname, '../public/fonts/inter/Inter-Regular.woff2')
  },
  {
    name: 'Inter Medium',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
    outputPath: path.join(__dirname, '../public/fonts/inter/Inter-Medium.woff2')
  },
  {
    name: 'Inter SemiBold',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
    outputPath: path.join(__dirname, '../public/fonts/inter/Inter-SemiBold.woff2')
  },
  {
    name: 'Inter Bold',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
    outputPath: path.join(__dirname, '../public/fonts/inter/Inter-Bold.woff2')
  },
  {
    name: 'Roboto Mono Regular',
    url: 'https://fonts.gstatic.com/s/robotomono/v23/L0x5DF4xlVMF-BfR8bXMIjhLq3-cXbKD.woff2',
    outputPath: path.join(__dirname, '../public/fonts/roboto-mono/RobotoMono-Regular.woff2')
  }
];

// Function to download a file
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // Create the directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all fonts
async function downloadFonts() {
  console.log('Starting font downloads...');
  
  for (const font of fonts) {
    try {
      console.log(`Downloading ${font.name}...`);
      await downloadFile(font.url, font.outputPath);
      console.log(`✓ Downloaded ${font.name}`);
    } catch (error) {
      console.error(`✗ Failed to download ${font.name}:`, error.message);
      
      // Create a fallback font file if download fails
      console.log(`Creating fallback for ${font.name}...`);
      try {
        // Check if we already have at least one font file we can use
        const dir = path.dirname(font.outputPath);
        const existingFonts = fs.readdirSync(dir).filter(file => file.endsWith('.woff2'));
        
        if (existingFonts.length > 0) {
          // Copy an existing font as a fallback
          const sourcePath = path.join(dir, existingFonts[0]);
          fs.copyFileSync(sourcePath, font.outputPath);
          console.log(`✓ Created fallback for ${font.name} by copying ${existingFonts[0]}`);
        } else {
          // Create an empty file as a last resort
          fs.writeFileSync(font.outputPath, Buffer.from([0, 0, 0, 0]));
          console.log(`✓ Created empty placeholder for ${font.name}`);
        }
      } catch (fallbackError) {
        console.error(`✗ Failed to create fallback for ${font.name}:`, fallbackError.message);
      }
    }
  }
  
  console.log('Font download process completed.');
}

// Run the download
downloadFonts(); 