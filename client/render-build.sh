#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
npm install

echo "Building Next.js application..."
npm run build

# Create a build directory if it doesn't exist
echo "Creating build directory (symlink to .next)..."
rm -rf build # Remove if exists
ln -sf .next build # Create symbolic link from build to .next
# Alternatively, copy the contents if symlinks don't work
# mkdir -p build
# cp -r .next/* build/

echo "Build completed successfully" 