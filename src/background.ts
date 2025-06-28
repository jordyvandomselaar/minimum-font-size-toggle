import { FontSizeSettings, FontSizeDetails } from './types';

const DEFAULT_LARGE = 18;
const DEFAULT_FONT_SIZE = 0; // 0 means browser default
const DEFAULT_BLOCKLIST: string[] = [];

let isLargeFontActive = false;
let lastKnownFontSize = DEFAULT_FONT_SIZE;
let wasResetForBlocklist = false;

// Icon state management
function updateIcon(tabId?: number): void {
  const options: chrome.action.BadgeTextDetails = {
    text: isLargeFontActive ? 'ON' : 'OFF'
  };
  
  if (tabId) {
    options.tabId = tabId;
  }
  
  chrome.action.setBadgeText(options);
  
  const colorOptions: chrome.action.BadgeBackgroundColorDetails = {
    color: isLargeFontActive ? '#28a745' : '#6c757d'
  };
  
  if (tabId) {
    colorOptions.tabId = tabId;
  }
  
  chrome.action.setBadgeBackgroundColor(colorOptions);
  
  // Update title to reflect current state
  const titleOptions: chrome.action.TitleDetails = {
    title: `Font Size: ${isLargeFontActive ? 'Large' : 'Default'} (Click to toggle)`
  };
  
  if (tabId) {
    titleOptions.tabId = tabId;
  }
  
  chrome.action.setTitle(titleOptions);
}

function updateIconForBlockedSite(tabId?: number): void {
  const options: chrome.action.BadgeTextDetails = {
    text: '🚫'
  };
  
  if (tabId) {
    options.tabId = tabId;
  }
  
  chrome.action.setBadgeText(options);
  
  const colorOptions: chrome.action.BadgeBackgroundColorDetails = {
    color: '#dc3545'
  };
  
  if (tabId) {
    colorOptions.tabId = tabId;
  }
  
  chrome.action.setBadgeBackgroundColor(colorOptions);
  
  const titleOptions: chrome.action.TitleDetails = {
    title: 'Font changes disabled for this site (Click to open options)'
  };
  
  if (tabId) {
    titleOptions.tabId = tabId;
  }
  
  chrome.action.setTitle(titleOptions);
}

// Initialize font state on startup
chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
  isLargeFontActive = details.pixelSize > DEFAULT_FONT_SIZE;
  if (isLargeFontActive) {
    lastKnownFontSize = details.pixelSize;
  }
  updateIcon();
});

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
    updateIcon();
  });
}


function restoreFontSize(): void {
  if (wasResetForBlocklist && lastKnownFontSize > DEFAULT_FONT_SIZE) {
    getSizes((settings) => {
      // Restore to the configured font size if it was previously active
      chrome.fontSettings.setMinimumFontSize({ pixelSize: settings.minimumFontSize });
      isLargeFontActive = true;
      wasResetForBlocklist = false;
      updateIcon();
    });
  }
}

function checkAndUpdateFontForUrl(url: string, tabId?: number): void {
  if (!url) return;
  
  getSizes((settings) => {
    const isBlocked = isUrlInBlocklist(url, settings.blocklist);
    
    if (isBlocked) {
      // Reset font size if on a blocked site
      if (!wasResetForBlocklist) {
        resetFontSize();
      }
      updateIconForBlockedSite(tabId);
    } else {
      // Restore font size if on a non-blocked site and was previously reset
      if (wasResetForBlocklist) {
        restoreFontSize();
      }
      updateIcon(tabId);
    }
  });
}

function toggleSize(currentSize: number, targetSize: number, tabId?: number): void {
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
  updateIcon(tabId);
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
          parseFloat(results.minimumFontSize.toString()),
          tab.id
        );
      } else {
        // For blocked sites, open the options page
        chrome.runtime.openOptionsPage();
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
      checkAndUpdateFontForUrl(tab.url, activeInfo.tabId);
    }
  });
});

// Monitor tab updates (navigation within a tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check on both loading and complete to catch early and ensure final state
  if ((changeInfo.status === 'loading' || changeInfo.status === 'complete') && tab.url) {
    checkAndUpdateFontForUrl(tab.url, tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleFontSize') {
    chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
      const tabId = sender.tab?.id;
      toggleSize(details.pixelSize, message.size, tabId);
    });
  } else if (message.action === 'setFontSize') {
    // Check if the URL is in the blocklist before applying font changes
    getSizes((settings) => {
      if (!isUrlInBlocklist(message.url, settings.blocklist)) {
        chrome.fontSettings.setMinimumFontSize({ pixelSize: message.size });
        isLargeFontActive = message.size > DEFAULT_FONT_SIZE;
        wasResetForBlocklist = false; // This is a manual change, not a blocklist reset
        
        // Update icon for the specific tab that sent the message
        const tabId = sender.tab?.id;
        updateIcon(tabId);
      }
    });
  } else if (message.action === 'immediateReset') {
    // Immediate reset from content script for blocked pages
    getSizes((settings) => {
      if (isUrlInBlocklist(message.url, settings.blocklist)) {
        // Get current font size and reset immediately
        chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
          if (details.pixelSize > DEFAULT_FONT_SIZE) {
            lastKnownFontSize = details.pixelSize;
            chrome.fontSettings.setMinimumFontSize({ pixelSize: DEFAULT_FONT_SIZE });
            isLargeFontActive = false;
            wasResetForBlocklist = true;
          }
        });
      }
    });
  } else if (message.action === 'immediateRestore') {
    // Immediate restore from content script for non-blocked pages
    if (wasResetForBlocklist && lastKnownFontSize > DEFAULT_FONT_SIZE) {
      // Fast path: restore immediately if we know font was reset
      getSizes((settings) => {
        if (!isUrlInBlocklist(message.url, settings.blocklist)) {
          chrome.fontSettings.setMinimumFontSize({ pixelSize: settings.minimumFontSize });
          isLargeFontActive = true;
          wasResetForBlocklist = false;
          updateIcon();
        }
      });
    } else {
      // Slower path: check current state and apply if needed
      getSizes((settings) => {
        if (!isUrlInBlocklist(message.url, settings.blocklist)) {
          chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
            if (details.pixelSize < settings.minimumFontSize) {
              chrome.fontSettings.setMinimumFontSize({ pixelSize: settings.minimumFontSize });
              isLargeFontActive = true;
              updateIcon();
            }
          });
        }
      });
    }
  } else if (message.action === 'checkFontState') {
    // Check if font should be restored for non-blocked pages
    getSizes((settings) => {
      if (!isUrlInBlocklist(message.url, settings.blocklist)) {
        // Return whether font should be restored
        const shouldRestore = wasResetForBlocklist && lastKnownFontSize > DEFAULT_FONT_SIZE;
        sendResponse({ shouldRestore });
      } else {
        sendResponse({ shouldRestore: false });
      }
    });
    return true; // Indicates we will send a response asynchronously
  }
});