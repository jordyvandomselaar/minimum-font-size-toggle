import { FontSizeSettings } from './types';

const DEFAULT_LARGE = 18;
const DEFAULT_BLOCKLIST: string[] = [];

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

  chrome.storage.sync.get({ blocklist: DEFAULT_BLOCKLIST }, (items) => {
    chrome.storage.sync.set({
      minimumFontSize: fontNum,
      blocklist: items.blocklist
    }, () => {
      showStatus('Settings saved successfully!');
    });
  });
}

function resetToDefaults(): void {
  syncInputs(DEFAULT_LARGE.toString());
  showStatus('Settings reset to defaults. Click Save to apply.');
}

function restoreOptions(): void {
  chrome.storage.sync.get({
    minimumFontSize: DEFAULT_LARGE,
    blocklist: DEFAULT_BLOCKLIST
  }, (items) => {
    const settings = items as FontSizeSettings;
    syncInputs(settings.minimumFontSize.toString());
    renderBlocklist(settings.blocklist);
  });
}

function renderBlocklist(blocklist: string[]): void {
  const listElement = document.getElementById('blocklistList');
  if (!listElement) return;

  if (blocklist.length === 0) {
    listElement.innerHTML = '<div class="mfst-blocklist__empty">No blocked sites</div>';
    return;
  }

  listElement.innerHTML = blocklist.map((pattern, index) => `
    <div class="mfst-blocklist__item">
      <span>${pattern}</span>
      <button class="mfst-btn mfst-btn--remove" data-index="${index}">Remove</button>
    </div>
  `).join('');

  // Add event listeners to remove buttons
  listElement.querySelectorAll('.mfst-btn--remove').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).dataset.index!);
      removeFromBlocklist(index);
    });
  });
}

function addToBlocklist(): void {
  const input = document.getElementById('blocklistInput') as HTMLInputElement;
  const pattern = input.value.trim();
  
  if (!pattern) {
    showStatus('Please enter a website pattern.', false);
    return;
  }

  chrome.storage.sync.get({ blocklist: DEFAULT_BLOCKLIST }, (items) => {
    const blocklist = [...items.blocklist];
    
    if (blocklist.includes(pattern)) {
      showStatus('This pattern is already in the blocklist.', false);
      return;
    }
    
    blocklist.push(pattern);
    
    chrome.storage.sync.set({ blocklist }, () => {
      input.value = '';
      renderBlocklist(blocklist);
      showStatus('Pattern added to blocklist!');
    });
  });
}

function removeFromBlocklist(index: number): void {
  chrome.storage.sync.get({ blocklist: DEFAULT_BLOCKLIST }, (items) => {
    const blocklist = [...items.blocklist];
    blocklist.splice(index, 1);
    
    chrome.storage.sync.set({ blocklist }, () => {
      renderBlocklist(blocklist);
      showStatus('Pattern removed from blocklist!');
    });
  });
}

function setupEventListeners(): void {
  const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
  const fontRangeInput = document.getElementById('fontRange') as HTMLInputElement;
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');
  const addBlocklistButton = document.getElementById('addToBlocklist');
  const blocklistInput = document.getElementById('blocklistInput') as HTMLInputElement;

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

  if (addBlocklistButton) {
    addBlocklistButton.addEventListener('click', addToBlocklist);
  }

  if (blocklistInput) {
    blocklistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addToBlocklist();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  setupEventListeners();
});