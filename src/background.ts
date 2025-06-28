import { FontSizeSettings, FontSizeDetails } from './types';

const DEFAULT_LARGE = 18;
const DEFAULT_FONT_SIZE = 0; // 0 means browser default

let isLargeFontActive = false;

function toggleSize(currentSize: number, targetSize: number): void {
  if (isLargeFontActive || currentSize >= targetSize) {
    // Switch back to default (0 = browser default)
    chrome.fontSettings.setMinimumFontSize({ pixelSize: DEFAULT_FONT_SIZE });
    isLargeFontActive = false;
  } else {
    // Apply the large font size
    chrome.fontSettings.setMinimumFontSize({ pixelSize: targetSize });
    isLargeFontActive = true;
  }
}

function getSizes(callback: (result: FontSizeSettings) => void): void {
  chrome.storage.sync.get({
    minimumFontSize: DEFAULT_LARGE
  }, (items) => callback(items as FontSizeSettings));
}

chrome.action.onClicked.addListener(() => {
  chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
    getSizes((results: FontSizeSettings) => {
      toggleSize(
        details.pixelSize,
        parseFloat(results.minimumFontSize.toString())
      );
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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFontSize') {
    chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
      toggleSize(details.pixelSize, message.size);
    });
  } else if (message.action === 'setFontSize') {
    chrome.fontSettings.setMinimumFontSize({ pixelSize: message.size });
  }
});