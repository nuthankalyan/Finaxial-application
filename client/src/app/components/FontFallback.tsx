'use client';

import { useEffect, useState } from 'react';

/**
 * FontFallback - A component that handles font loading failures
 * 
 * This component injects fallback font styles when Google Fonts fail to load,
 * ensuring the application remains usable with system fonts.
 */
export default function FontFallback() {
  const [fontsFailed, setFontsFailed] = useState(false);

  useEffect(() => {
    // Check if Google Fonts resources failed to load
    const checkFonts = setTimeout(() => {
      try {
        // Look for failed font requests in the performance entries
        const entries = performance.getEntriesByType('resource');
        const failedFonts = entries.some(entry => {
          // Use type guard to check if it's a resource timing entry
          const isResourceTiming = 'responseEnd' in entry;
          return (
            entry.name.includes('fonts.gstatic.com') && 
            isResourceTiming && 
            // Check if responseEnd exists and is 0
            (entry as PerformanceResourceTiming).responseEnd === 0 &&
            entry.duration === 0
          );
        });

        if (failedFonts) {
          console.warn('Google Fonts failed to load - applying fallback fonts');
          setFontsFailed(true);
        }
      } catch (error) {
        // If there's any error checking performance, default to using system fonts
        console.warn('Error checking font loading status, using fallback fonts', error);
        setFontsFailed(true);
      }
    }, 3000); // Check after 3 seconds

    return () => clearTimeout(checkFonts);
  }, []);

  if (!fontsFailed) return null;

  // If fonts failed, inject fallback CSS
  return (
    <style jsx global>{`
      :root {
        --font-inter: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        --font-roboto-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
      
      /* Apply fallback styles to components that use monospace fonts */
      pre, code, .code-block {
        font-family: var(--font-roboto-mono) !important;
      }
      
      /* Ensure body text uses the fallback sans-serif font */
      body, h1, h2, h3, h4, h5, h6, p, span, div, button {
        font-family: var(--font-inter) !important;
      }
    `}</style>
  );
} 