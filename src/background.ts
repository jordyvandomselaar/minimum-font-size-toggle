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