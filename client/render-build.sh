#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
npm install

echo "Building Next.js application with static export..."
npm run build

echo "Checking for output directories..."
if [ -d "out" ]; then
  echo "Static export 'out' directory found - copying to 'build'..."
  rm -rf build
  mkdir -p build
  cp -r out/* build/
  echo "Successfully copied static export to build directory."
else
  echo "Warning: 'out' directory not found. Creating build directory manually..."
  rm -rf build
  mkdir -p build
  echo "<html><body><h1>Build Error</h1><p>The build process did not complete as expected.</p></body></html>" > build/index.html
fi

echo "Listing content of current directory for debugging:"
ls -la

echo "Build process completed." 