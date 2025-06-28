import { FontSizeSettings } from './types';

const DEFAULT_SMALL = 10;
const DEFAULT_LARGE = 18;

function updatePreview(size: number, isSmall: boolean): void {
  const previewElement = document.getElementById(isSmall ? 'smallPreviewText' : 'largePreviewText');
  const currentSizeElement = document.getElementById(isSmall ? 'smallPreview' : 'largePreview');
  
  if (previewElement) {
    previewElement.style.fontSize = `${size}px`;
  }
  
  if (currentSizeElement) {
    currentSizeElement.textContent = `Current: ${size}px`;
  }
}

function syncInputs(value: string, isSmall: boolean): void {
  const numberInput = document.getElementById(isSmall ? 'smallSize' : 'largeSize') as HTMLInputElement;
  const rangeInput = document.getElementById(isSmall ? 'smallRange' : 'largeRange') as HTMLInputElement;
  
  if (numberInput && rangeInput) {
    numberInput.value = value;
    rangeInput.value = value;
    updatePreview(parseInt(value), isSmall);
  }
}

function validateInput(value: string): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= 6 && num <= 72;
}

function showStatus(message: string, isSuccess: boolean = true): void {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${isSuccess ? 'success' : 'error'}`;
    
    setTimeout(() => {
      status.className = 'status';
    }, 3000);
  }
}

function saveOptions(): void {
  const smallSizeElement = document.getElementById('smallSize') as HTMLInputElement;
  const largeSizeElement = document.getElementById('largeSize') as HTMLInputElement;
  
  const smallSize = smallSizeElement.value;
  const largeSize = largeSizeElement.value;

  if (!validateInput(smallSize) || !validateInput(largeSize)) {
    showStatus('Please enter valid font sizes between 6 and 72 pixels.', false);
    return;
  }

  const smallNum = parseInt(smallSize);
  const largeNum = parseInt(largeSize);

  if (smallNum >= largeNum) {
    showStatus('Small font size must be smaller than large font size.', false);
    return;
  }

  chrome.storage.sync.set({
    smallMinimumFontSize: smallNum,
    largeMinimumFontSize: largeNum
  }, () => {
    showStatus('Settings saved successfully!');
  });
}

function resetToDefaults(): void {
  syncInputs(DEFAULT_SMALL.toString(), true);
  syncInputs(DEFAULT_LARGE.toString(), false);
  showStatus('Settings reset to defaults. Click Save to apply.');
}

function restoreOptions(): void {
  chrome.storage.sync.get({
    smallMinimumFontSize: DEFAULT_SMALL,
    largeMinimumFontSize: DEFAULT_LARGE
  }, (items) => {
    const settings = items as FontSizeSettings;
    syncInputs(settings.smallMinimumFontSize.toString(), true);
    syncInputs(settings.largeMinimumFontSize.toString(), false);
  });
}

function setupEventListeners(): void {
  const smallSizeInput = document.getElementById('smallSize') as HTMLInputElement;
  const largeSizeInput = document.getElementById('largeSize') as HTMLInputElement;
  const smallRangeInput = document.getElementById('smallRange') as HTMLInputElement;
  const largeRangeInput = document.getElementById('largeRange') as HTMLInputElement;
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');

  if (smallSizeInput && smallRangeInput) {
    smallSizeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (validateInput(value)) {
        syncInputs(value, true);
      }
    });

    smallRangeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      syncInputs(value, true);
    });
  }

  if (largeSizeInput && largeRangeInput) {
    largeSizeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (validateInput(value)) {
        syncInputs(value, false);
      }
    });

    largeRangeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      syncInputs(value, false);
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetToDefaults);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  setupEventListeners();
});