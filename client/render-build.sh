#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
npm install

echo "Building Next.js application..."
npm run build

echo "Build completed successfully" 