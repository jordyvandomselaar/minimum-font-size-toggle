# Minimum Font Size Toggle

A Chrome extension that allows you to quickly toggle font sizes and manage site-specific font preferences with advanced blocklist functionality.

## Features

### 🔤 Font Size Management
- **Single Click Toggle**: Click the extension icon to toggle between your configured font size and browser default
- **Live Preview**: Drag the slider in the floating panel to see font changes in real-time
- **Configurable Size**: Set your preferred font size (6px - 72px) via the options page or floating panel
- **Persistent Settings**: Font preferences are saved and synced across devices

### 🎛️ Floating Control Panel
- **Right-Click Access**: Right-click anywhere → "Adjust Font Size" to open the floating panel
- **Live Font Slider**: Drag to instantly preview font size changes on the current page
- **Draggable Interface**: Move the panel anywhere on the screen by dragging the header
- **Current Site Status**: Shows if the current site is blocked or enabled for font changes
- **Quick Blocklist Toggle**: Add or remove the current site from the blocklist with one click

### 🚫 Site Blocklist System
- **Fuzzy Matching**: Add domain patterns like `google.com` or `docs.google.com` to block specific sites
- **Automatic Font Reset**: Font size automatically resets to browser default on blocked sites
- **Smart Restoration**: Font size automatically restores when navigating away from blocked sites
- **Flicker Prevention**: Advanced CSS injection eliminates visual flicker when loading blocked/unblocked pages
- **Flexible Patterns**: Supports partial URL matching (e.g., `stackoverflow` blocks all Stack Overflow sites)

### ⚡ Performance Optimizations
- **Zero-Flicker Loading**: Pages load with correct font size from the start
- **Early Detection**: Content script runs at `document_start` for fastest response
- **CSS Pre-injection**: Temporary CSS ensures correct display before browser font settings apply
- **State Tracking**: Remembers font state across browser sessions and tab switches
- **Efficient Monitoring**: Only applies changes when necessary

### 🎨 Modern Interface (BEM CSS)
- **Clean Design**: Modern, responsive interface with clear visual feedback
- **BEM Methodology**: Well-structured CSS classes (`mfst-*`) for maintainability
- **Intuitive Controls**: Slider, number input, and range controls for precise font sizing
- **Status Indicators**: Color-coded feedback for blocklist status and operations
- **Accessibility**: Keyboard navigation support and clear visual hierarchy

## Installation

1. Download or clone this repository
2. Run `bun install` to install dependencies
3. Run `bun run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder

## Usage

### Basic Font Toggling
1. Click the extension icon in the toolbar to toggle font size
2. The font will switch between your configured size and browser default

### Live Preview Mode
1. Right-click on any page and select "Adjust Font Size"
2. Use the slider or number input to adjust font size in real-time
3. Click "Save" to make the setting permanent

### Managing the Blocklist

#### Quick Add/Remove
1. Open the floating panel on any site
2. Click "Add to Blocklist" to disable font changes for the current site
3. Click "Remove from Blocklist" to re-enable font changes

#### Full Management
1. Open the floating panel and click "Manage Blocklist"
2. Or go to the extension's options page
3. Add website patterns in the text field (e.g., `example.com`, `docs.google`)
4. Use the remove buttons to delete patterns from the list

### Options Page
- Access via the "Manage Blocklist" button or Chrome's extension options
- Configure your preferred font size with live preview
- Manage the complete blocklist with add/remove functionality
- See real-time preview of how text will look at different sizes

## How It Works

### Font Size Application
The extension uses Chrome's `fontSettings` API to set the minimum font size across all websites. This ensures:
- Consistent application across all sites
- Integration with browser's built-in font rendering
- Compatibility with existing website styles

### Blocklist System
- **Pattern Matching**: Uses case-insensitive substring matching for flexible site blocking
- **Automatic Detection**: Monitors tab changes and navigation to apply/remove font settings
- **State Persistence**: Remembers blocklist state and font preferences across sessions

### Flicker Prevention
- **Early Injection**: Content script runs at `document_start` for immediate response
- **CSS Pre-loading**: Temporary CSS rules ensure correct font display before browser settings apply
- **Smart Cleanup**: Removes temporary CSS once proper font settings take effect

## Permissions

The extension requires the following permissions:
- `fontSettings`: To modify browser font size settings
- `storage`: To save user preferences and blocklist
- `contextMenus`: For right-click menu access
- `activeTab`: To interact with the current page
- `tabs`: To monitor navigation and tab changes

## Technical Details

### Architecture
- **Background Script**: Handles font settings, tab monitoring, and state management
- **Content Script**: Provides floating panel UI and immediate flicker prevention
- **Options Page**: Full-featured settings and blocklist management interface

### Browser Compatibility
- Chrome/Chromium browsers with Manifest V3 support
- Uses modern APIs: `chrome.fontSettings`, `chrome.storage.sync`, `chrome.tabs`

### Build System
- **Bun**: Fast JavaScript runtime and package manager
- **TypeScript**: Type-safe development with modern ES features
- **Modular Architecture**: Separate modules for content, background, and options

## File Structure

```
├── src/
│   ├── background.ts       # Background service worker
│   ├── content.ts          # Content script with floating panel
│   ├── options.ts          # Options page functionality
│   ├── types.ts            # TypeScript type definitions
│   └── static/
│       └── options.html    # Options page HTML
├── dist/                   # Built extension files
├── manifest.json           # Extension manifest
├── package.json           # Dependencies and build scripts
└── README.md              # This file
```

## Development

### Setup
```bash
bun install
```

### Build
```bash
bun run build        # Full build
bun run build:ts     # TypeScript only
bun run dev          # Watch mode
```

### Type Checking
```bash
bun run type-check
```

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Font Changes Not Applying
- Check if the site is in your blocklist
- Verify the extension has proper permissions
- Try refreshing the page

### Floating Panel Not Appearing
- Ensure you're right-clicking and selecting "Adjust Font Size"
- Check that the extension is enabled
- Try reloading the extension

### Settings Not Saving
- Verify Chrome sync is enabled for extension data
- Check browser storage permissions
- Try clearing extension data and reconfiguring

## Version History

### v1.0.0
- Initial release with font toggling
- Basic options page
- Simple blocklist functionality

### v1.1.0
- Added floating control panel
- Live preview with real-time slider
- Enhanced blocklist management
- Flicker prevention system
- BEM CSS architecture
- Performance optimizations