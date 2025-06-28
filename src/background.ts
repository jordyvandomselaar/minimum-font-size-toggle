import { FontSizeSettings, FontSizeDetails } from './types';

const DEFAULT_SMALL = 10;
const DEFAULT_LARGE = 18;

function toggleSize(currentSize: number, smallSize: number, largeSize: number): void {
  const newSize = currentSize <= smallSize ? largeSize : smallSize;
  chrome.fontSettings.setMinimumFontSize({ pixelSize: newSize });
}

function getSizes(callback: (result: FontSizeSettings) => void): void {
  chrome.storage.sync.get({
    smallMinimumFontSize: DEFAULT_SMALL,
    largeMinimumFontSize: DEFAULT_LARGE
  }, (items) => callback(items as FontSizeSettings));
}

chrome.action.onClicked.addListener(() => {
  chrome.fontSettings.getMinimumFontSize((details: FontSizeDetails) => {
    getSizes((results: FontSizeSettings) => {
      toggleSize(
        details.pixelSize,
        parseFloat(results.smallMinimumFontSize.toString()),
        parseFloat(results.largeMinimumFontSize.toString())
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
  if (message.action === 'applyFontSize') {
    chrome.fontSettings.setMinimumFontSize({ pixelSize: message.size });
  }
});