# Font Strategy for Finaxial App

## System Fonts Approach

This application uses system fonts instead of web fonts to avoid issues with font loading and ensure maximum compatibility when deployed.

### Why System Fonts?

1. **Reliability**: System fonts are always available on the user's device
2. **Performance**: No external font downloads needed
3. **Compatibility**: Works in all environments, including restricted networks
4. **Consistency**: Modern system fonts are designed to be similar across platforms

### Font Stacks Used

#### Sans-serif (for body text, headings)
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
  Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
```

#### Monospace (for code, numbers)
```css
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 
  'Liberation Mono', 'Courier New', monospace;
```

### Placeholder Font Files

The `/public/fonts` directory contains placeholder `.woff2` files. These are minimal valid WOFF2 files that:

1. Allow the build process to complete without errors
2. Are not actually used in the application
3. Get replaced with system fonts via CSS

### How It Works

The application uses CSS classes and variables in `fonts.css` and `globals.css` to apply the system font stacks throughout the application.

To update the font strategy or add web fonts in the future:

1. Modify the `fonts.css` file
2. Update the `download-fonts.js` script to download actual font files
3. Update the `layout.tsx` to use the downloaded fonts

### Troubleshooting

If you see "Failed to load font file" errors, these are expected and do not affect functionality. The application is designed to fall back to system fonts automatically. 