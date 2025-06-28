import { FontSizeSettings } from './types';

const DEFAULT_LARGE = 18;

function updatePreview(size: number): void {
  const previewElement = document.getElementById('fontPreviewText');
  const currentSizeElement = document.getElementById('fontPreview');
  
  if (previewElement) {
    previewElement.style.fontSize = `${size}px`;
  }
  
  if (currentSizeElement) {
    currentSizeElement.textContent = `Current: ${size}px`;
  }
}

function syncInputs(value: string): void {
  const numberInput = document.getElementById('fontSize') as HTMLInputElement;
  const rangeInput = document.getElementById('fontRange') as HTMLInputElement;
  
  if (numberInput && rangeInput) {
    numberInput.value = value;
    rangeInput.value = value;
    updatePreview(parseInt(value));
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
    status.className = `mfst-status ${isSuccess ? 'mfst-status--success' : 'mfst-status--error'}`;
    
    setTimeout(() => {
      status.className = 'mfst-status';
    }, 3000);
  }
}

function saveOptions(): void {
  const fontSizeElement = document.getElementById('fontSize') as HTMLInputElement;
  
  const fontSize = fontSizeElement.value;

  if (!validateInput(fontSize)) {
    showStatus('Please enter a valid font size between 6 and 72 pixels.', false);
    return;
  }

  const fontNum = parseInt(fontSize);

  chrome.storage.sync.set({
    minimumFontSize: fontNum
  }, () => {
    showStatus('Settings saved successfully!');
  });
}

function resetToDefaults(): void {
  syncInputs(DEFAULT_LARGE.toString());
  showStatus('Settings reset to defaults. Click Save to apply.');
}

function restoreOptions(): void {
  chrome.storage.sync.get({
    minimumFontSize: DEFAULT_LARGE
  }, (items) => {
    const settings = items as FontSizeSettings;
    syncInputs(settings.minimumFontSize.toString());
  });
}

function setupEventListeners(): void {
  const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
  const fontRangeInput = document.getElementById('fontRange') as HTMLInputElement;
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');

  if (fontSizeInput && fontRangeInput) {
    fontSizeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (validateInput(value)) {
        syncInputs(value);
      }
    });

    fontRangeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      syncInputs(value);
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