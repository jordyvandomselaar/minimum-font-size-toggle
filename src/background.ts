import { FontSizeSettings, FontSizeDetails } from './types';

const DEFAULT_LARGE = 18;
const DEFAULT_FONT_SIZE = 0; // 0 means browser default
const DEFAULT_BLOCKLIST: string[] = [];

let isLargeFontActive = false;
let lastKnownFontSize = DEFAULT_FONT_SIZE;
let wasResetForBlocklist = false;

function isUrlInBlocklist(url: string, blocklist: string[]): boolean {
  if (!url || !blocklist || blocklist.length === 0) return false;
  
  const urlToCheck = url.toLowerCase();
  return blocklist.some(pattern => {
    const patternLower = pattern.toLowerCase();
    return urlToCheck.includes(patternLower);
  });
}

function resetFontSize(): void {
  // Store current font size before resetting
  chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
    lastKnownFontSize = details.pixelSize;
    chrome.fontSettings.setMinimumFontSize({ pixelSize: DEFAULT_FONT_SIZE });
    isLargeFontActive = false;
    wasResetForBlocklist = true;
  });
}

function restoreFontSize(): void {
  if (wasResetForBlocklist && lastKnownFontSize > DEFAULT_FONT_SIZE) {
    getSizes((settings) => {
      // Restore to the configured font size if it was previously active
      chrome.fontSettings.setMinimumFontSize({ pixelSize: settings.minimumFontSize });
      isLargeFontActive = true;
      wasResetForBlocklist = false;
    });
  }
}

function checkAndUpdateFontForUrl(url: string): void {
  if (!url) return;
  
  getSizes((settings) => {
    const isBlocked = isUrlInBlocklist(url, settings.blocklist);
    
    if (isBlocked) {
      // Reset font size if on a blocked site
      if (!wasResetForBlocklist) {
        resetFontSize();
      }
    } else {
      // Restore font size if on a non-blocked site and was previously reset
      if (wasResetForBlocklist) {
        restoreFontSize();
      }
    }
  });
}

function toggleSize(currentSize: number, targetSize: number): void {
  if (isLargeFontActive || currentSize >= targetSize) {
    // Switch back to default (0 = browser default)
    chrome.fontSettings.setMinimumFontSize({ pixelSize: DEFAULT_FONT_SIZE });
    isLargeFontActive = false;
    wasResetForBlocklist = false; // This is a manual toggle, not a blocklist reset
  } else {
    // Apply the large font size
    chrome.fontSettings.setMinimumFontSize({ pixelSize: targetSize });
    isLargeFontActive = true;
    wasResetForBlocklist = false; // This is a manual toggle, not a blocklist reset
  }
}

function getSizes(callback: (result: FontSizeSettings) => void): void {
  chrome.storage.sync.get({
    minimumFontSize: DEFAULT_LARGE,
    blocklist: DEFAULT_BLOCKLIST
  }, (items) => callback(items as FontSizeSettings));
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url) return;
  
  chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
    getSizes((results: FontSizeSettings) => {
      // Check if the current tab's URL is in the blocklist
      if (!isUrlInBlocklist(tab.url!, results.blocklist)) {
        toggleSize(
          details.pixelSize,
          parseFloat(results.minimumFontSize.toString())
        );
      }
    });
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openFontPanel',
    title: 'Adjust Font Size',
    contexts: ['all']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openFontPanel' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleFontPanel' });
  }
});

// Monitor tab activation (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkAndUpdateFontForUrl(tab.url);
    }
  });
});

// Monitor tab updates (navigation within a tab)
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
  // Only check when the URL has changed and the page is complete
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndUpdateFontForUrl(tab.url);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFontSize') {
    chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
      toggleSize(details.pixelSize, message.size);
    });
  } else if (message.action === 'setFontSize') {
    // Check if the URL is in the blocklist before applying font changes
    getSizes((settings) => {
      if (!isUrlInBlocklist(message.url, settings.blocklist)) {
        chrome.fontSettings.setMinimumFontSize({ pixelSize: message.size });
        isLargeFontActive = message.size > DEFAULT_FONT_SIZE;
        wasResetForBlocklist = false; // This is a manual change, not a blocklist reset
      }
    });
  }
});