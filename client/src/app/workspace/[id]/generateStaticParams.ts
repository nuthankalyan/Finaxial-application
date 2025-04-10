// This file is necessary if using static export with Next.js and dynamic routes
// Will only be used if output: 'export' is set in next.config.js

export async function generateStaticParams() {
  // For a user-based app, we typically don't pre-generate any paths for dynamic routes
  // We instead let the client handle the data fetching
  // Return an empty array to satisfy the Next.js static export requirement
  return [];
} 