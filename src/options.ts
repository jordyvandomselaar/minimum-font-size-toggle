import { FontSizeSettings } from './types';

function saveOptions(): void {
  const smallSizeElement = document.getElementById('smallSize') as HTMLInputElement;
  const largeSizeElement = document.getElementById('largeSize') as HTMLInputElement;
  
  const smallSize = smallSizeElement.value;
  const largeSize = largeSizeElement.value;

  chrome.storage.sync.set({
    smallMinimumFontSize: smallSize,
    largeMinimumFontSize: largeSize
  }, () => {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    }
  });
}

function restoreOptions(): void {
  chrome.storage.sync.get({
    smallMinimumFontSize: 10,
    largeMinimumFontSize: 18
  }, (items) => {
    const settings = items as FontSizeSettings;
    const smallSizeElement = document.getElementById('smallSize') as HTMLInputElement;
    const largeSizeElement = document.getElementById('largeSize') as HTMLInputElement;
    
    if (smallSizeElement) {
      smallSizeElement.value = settings.smallMinimumFontSize.toString();
    }
    if (largeSizeElement) {
      largeSizeElement.value = settings.largeMinimumFontSize.toString();
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

const saveButton = document.getElementById('save');
if (saveButton) {
  saveButton.addEventListener('click', saveOptions);
}