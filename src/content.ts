import { FontSizeSettings } from './types';

const DEFAULT_SMALL = 10;
const DEFAULT_LARGE = 18;

let panelElement: HTMLElement | null = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createFloatingPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'font-size-panel';
  panel.innerHTML = `
    <div class="mfst-panel__header">
      <span class="mfst-panel__title">Font Size Adjuster</span>
      <button class="mfst-panel__close-btn" id="closeFontPanel">×</button>
    </div>
    <div class="mfst-panel__content">
      <div class="mfst-setting">
        <label class="mfst-setting__label">Small Font Size</label>
        <div class="mfst-setting__input-container">
          <input type="number" id="smallSize" min="6" max="72" step="1">
          <span>px</span>
          <input type="range" id="smallRange" min="6" max="72" step="1">
        </div>
        <div class="mfst-setting__current-size" id="smallPreview">Current: 10px</div>
      </div>
      
      <div class="mfst-setting">
        <label class="mfst-setting__label">Large Font Size</label>
        <div class="mfst-setting__input-container">
          <input type="number" id="largeSize" min="6" max="72" step="1">
          <span>px</span>
          <input type="range" id="largeRange" min="6" max="72" step="1">
        </div>
        <div class="mfst-setting__current-size" id="largePreview">Current: 18px</div>
      </div>
      
      <div class="mfst-panel__button-container">
        <button id="applyNow" class="mfst-btn mfst-btn--apply">Apply Now</button>
        <button id="saveSettings" class="mfst-btn mfst-btn--save">Save</button>
        <button id="resetDefaults" class="mfst-btn mfst-btn--reset">Reset</button>
      </div>
      
      <div id="panelStatus" class="mfst-status"></div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #font-size-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 90vh;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 9000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1rem;
      line-height: 1.4;
      color: #333;
      border: 1px solid #ddd;
    }
    
    #font-size-panel * {
      box-sizing: border-box;
    }
    
    #font-size-panel .mfst-panel__header {
      background: #007acc;
      color: white;
      padding: 12px 16px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    }
    
    #font-size-panel .mfst-panel__title {
      font-weight: 600;
      font-size: 14px;
    }
    
    #font-size-panel .mfst-panel__close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #font-size-panel .mfst-panel__close-btn:hover {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }
    
    #font-size-panel .mfst-panel__content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    #font-size-panel .mfst-setting__label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #555;
      font-size: 12px;
    }
    
    #font-size-panel .mfst-setting__input-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    
    #font-size-panel input[type="number"] {
      width: 60px;
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 12px;
      text-align: center;
    }
    
    #font-size-panel input[type="range"] {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      outline: none;
      -webkit-appearance: none;
    }
    
    #font-size-panel input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #007acc;
      cursor: pointer;
    }
    
    #font-size-panel .mfst-setting__current-size {
      font-size: 0.8rem;
      color: #666;
      margin-top: 2px;
    }
    
    #font-size-panel .mfst-panel__button-container {
      display: flex;
      gap: 6px;
      margin-top: 16px;
      visibility: visible;
      opacity: 1;
      width: 100%;
    }
    
    #font-size-panel .mfst-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      display: block;
      visibility: visible;
      opacity: 1;
    }
    
    #font-size-panel .mfst-btn--apply {
      background: #28a745;
      color: white;
      flex: 1;
    }
    
    #font-size-panel .mfst-btn--apply:hover {
      background: #218838;
    }
    
    #font-size-panel .mfst-btn--save {
      background: #007acc;
      color: white;
      flex: 1;
    }
    
    #font-size-panel .mfst-btn--save:hover {
      background: #005a9e;
    }
    
    #font-size-panel .mfst-btn--reset {
      background: #f0f0f0;
      color: #333;
      flex: 0.7;
    }
    
    #font-size-panel .mfst-btn--reset:hover {
      background: #e0e0e0;
    }
    
    #font-size-panel .mfst-status {
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 10px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    #font-size-panel .mfst-status.mfst-status--success {
      background: #d4edda;
      color: #155724;
      opacity: 1;
    }
    
    #font-size-panel .mfst-status.mfst-status--error {
      background: #f8d7da;
      color: #721c24;
      opacity: 1;
    }
  `;

  document.head.appendChild(style);
  return panel;
}

function showStatus(message: string, isSuccess: boolean = true): void {
  const status = document.getElementById('panelStatus');
  if (status) {
    status.textContent = message;
    status.className = `mfst-status ${isSuccess ? 'mfst-status--success' : 'mfst-status--error'}`;
    
    setTimeout(() => {
      status.className = 'mfst-status';
    }, 2000);
  }
}

function updatePreview(size: number, isSmall: boolean): void {
  const currentSizeElement = document.getElementById(isSmall ? 'smallPreview' : 'largePreview');
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

function applyFontSize(): void {
  const smallSizeElement = document.getElementById('smallSize') as HTMLInputElement;
  const largeSizeElement = document.getElementById('largeSize') as HTMLInputElement;
  
  const smallSize = smallSizeElement.value;
  const largeSize = largeSizeElement.value;

  if (!validateInput(smallSize) || !validateInput(largeSize)) {
    showStatus('Invalid font sizes', false);
    return;
  }

  const smallNum = parseInt(smallSize);
  const largeNum = parseInt(largeSize);

  if (smallNum >= largeNum) {
    showStatus('Small must be < large', false);
    return;
  }

  chrome.runtime.sendMessage({
    action: 'applyFontSize',
    size: largeNum
  });
  
  showStatus('Applied!');
}

function saveSettings(): void {
  const smallSizeElement = document.getElementById('smallSize') as HTMLInputElement;
  const largeSizeElement = document.getElementById('largeSize') as HTMLInputElement;
  
  const smallSize = smallSizeElement.value;
  const largeSize = largeSizeElement.value;

  if (!validateInput(smallSize) || !validateInput(largeSize)) {
    showStatus('Invalid font sizes', false);
    return;
  }

  const smallNum = parseInt(smallSize);
  const largeNum = parseInt(largeSize);

  if (smallNum >= largeNum) {
    showStatus('Small must be < large', false);
    return;
  }

  chrome.storage.sync.set({
    smallMinimumFontSize: smallNum,
    largeMinimumFontSize: largeNum
  }, () => {
    showStatus('Saved!');
  });
}

function resetToDefaults(): void {
  syncInputs(DEFAULT_SMALL.toString(), true);
  syncInputs(DEFAULT_LARGE.toString(), false);
  showStatus('Reset to defaults');
}

function loadSettings(): void {
  chrome.storage.sync.get({
    smallMinimumFontSize: DEFAULT_SMALL,
    largeMinimumFontSize: DEFAULT_LARGE
  }, (items) => {
    const settings = items as FontSizeSettings;
    syncInputs(settings.smallMinimumFontSize.toString(), true);
    syncInputs(settings.largeMinimumFontSize.toString(), false);
  });
}

function setupPanelEventListeners(): void {
  const smallSizeInput = document.getElementById('smallSize') as HTMLInputElement;
  const largeSizeInput = document.getElementById('largeSize') as HTMLInputElement;
  const smallRangeInput = document.getElementById('smallRange') as HTMLInputElement;
  const largeRangeInput = document.getElementById('largeRange') as HTMLInputElement;
  const applyButton = document.getElementById('applyNow');
  const saveButton = document.getElementById('saveSettings');
  const resetButton = document.getElementById('resetDefaults');
  const closeButton = document.getElementById('closeFontPanel');

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

  if (applyButton) {
    applyButton.addEventListener('click', applyFontSize);
  }

  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetToDefaults);
  }

  if (closeButton) {
    closeButton.addEventListener('click', hidePanel);
  }

  // Make panel draggable
  const header = panelElement?.querySelector('.mfst-panel__header') as HTMLElement;
  if (header) {
    header.addEventListener('mousedown', startDrag);
  }

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}

function startDrag(e: MouseEvent): void {
  if (!panelElement) return;
  
  isDragging = true;
  const rect = panelElement.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  e.preventDefault();
}

function drag(e: MouseEvent): void {
  if (!isDragging || !panelElement) return;
  
  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;
  
  // Keep panel within viewport
  const maxX = window.innerWidth - panelElement.offsetWidth;
  const maxY = window.innerHeight - panelElement.offsetHeight;
  
  panelElement.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
  panelElement.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
  panelElement.style.right = 'auto';
}

function stopDrag(): void {
  isDragging = false;
}

function showPanel(): void {
  if (panelElement) {
    hidePanel();
  }
  
  panelElement = createFloatingPanel();
  document.body.appendChild(panelElement);
  
  // Ensure buttons are visible with a small delay
  setTimeout(() => {
    const buttons = panelElement?.querySelectorAll('button');
    if (buttons) {
      buttons.forEach(btn => {
        (btn as HTMLElement).style.display = 'block';
        (btn as HTMLElement).style.visibility = 'visible';
        (btn as HTMLElement).style.opacity = '1';
      });
    }
    
    const buttonContainer = panelElement?.querySelector('.mfst-panel__button-container') as HTMLElement;
    if (buttonContainer) {
      buttonContainer.style.display = 'flex';
      buttonContainer.style.visibility = 'visible';
      buttonContainer.style.opacity = '1';
    }
  }, 10);
  
  loadSettings();
  setupPanelEventListeners();
}

function hidePanel(): void {
  if (panelElement) {
    panelElement.remove();
    panelElement = null;
  }
}

function togglePanel(): void {
  if (panelElement) {
    hidePanel();
  } else {
    showPanel();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleFontPanel') {
    togglePanel();
  }
});

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  if (panelElement && !panelElement.contains(e.target as Node)) {
    hidePanel();
  }
});

// Close panel on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panelElement) {
    hidePanel();
  }
});