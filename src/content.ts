
const DEFAULT_LARGE = 18;
const DEFAULT_BLOCKLIST: string[] = [];

let currentUrl = '';
let injectedStyle: HTMLStyleElement | null = null;

// Immediate CSS injection to prevent flicker
function injectImmediateFontCSS(isReset: boolean): void {
  // Remove any existing injected style
  if (injectedStyle) {
    injectedStyle.remove();
  }
  
  // Create and inject immediate CSS
  injectedStyle = document.createElement('style');
  injectedStyle.id = 'mfst-immediate-font';
  
  if (isReset) {
    // For blocked sites: force normal font sizing
    injectedStyle.textContent = `
      * {
        font-size: initial !important;
        font-size: revert !important;
      }
      body {
        font-size: 16px !important;
      }
    `;
  } else {
    // For non-blocked sites: ensure larger minimum font
    injectedStyle.textContent = `
      * {
        font-size: max(1.125em, 18px) !important;
      }
    `;
  }
  
  // Insert as early as possible
  if (document.head) {
    document.head.insertBefore(injectedStyle, document.head.firstChild);
  } else {
    // If head doesn't exist yet, inject into html or create head
    const head = document.createElement('head');
    head.appendChild(injectedStyle);
    if (document.documentElement) {
      document.documentElement.insertBefore(head, document.documentElement.firstChild);
    }
  }
}

// Remove injected CSS once proper font settings are applied
function removeImmediateFontCSS(): void {
  if (injectedStyle) {
    // Add a delay to ensure the browser font settings have taken effect
    setTimeout(() => {
      if (injectedStyle) {
        injectedStyle.remove();
        injectedStyle = null;
      }
    }, 100);
  }
}

// Immediate blocklist check to prevent flicker
function immediateBlocklistCheck(): void {
  chrome.storage.sync.get({
    blocklist: DEFAULT_BLOCKLIST,
    minimumFontSize: DEFAULT_LARGE
  }, (items) => {
    const isBlocked = isUrlInBlocklist(window.location.href, items.blocklist);
    
    if (isBlocked) {
      // Immediately inject CSS to force reset font
      injectImmediateFontCSS(true); // true = reset mode
      
      // Send immediate reset message for blocked pages
      chrome.runtime.sendMessage({
        action: 'immediateReset',
        url: window.location.href
      });
      
      // Remove CSS after browser font settings apply
      setTimeout(() => removeImmediateFontCSS(), 300);
    } else {
      // Check if we need to restore large font
      chrome.runtime.sendMessage({
        action: 'checkFontState',
        url: window.location.href
      }, (response) => {
        if (response && response.shouldRestore) {
          // Immediately inject CSS to show large font
          injectImmediateFontCSS(false); // false = large font mode
          
          // Send immediate restore message
          chrome.runtime.sendMessage({
            action: 'immediateRestore',
            url: window.location.href
          });
          
          // Remove CSS after browser font settings apply
          setTimeout(() => removeImmediateFontCSS(), 300);
        }
      });
    }
  });
}

// Run immediate check as soon as script loads
immediateBlocklistCheck();

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
        <label class="mfst-setting__label">Font Size</label>
        <div class="mfst-setting__input-container">
          <input type="number" id="fontSize" min="6" max="72" step="1">
          <span>px</span>
          <input type="range" id="fontRange" min="6" max="72" step="1">
        </div>
        <div class="mfst-setting__current-size" id="fontPreview">Current: 18px</div>
      </div>
      
      <div class="mfst-setting">
        <label class="mfst-setting__label">Site Blocklist</label>
        <div class="mfst-blocklist__current-site">
          <span id="currentSiteUrl">Current site: loading...</span>
          <button id="toggleBlocklist" class="mfst-btn mfst-btn--small mfst-btn--toggle-block">Add to Blocklist</button>
        </div>
        <div class="mfst-blocklist__status" id="blocklistStatus"></div>
      </div>
      
      <div class="mfst-panel__button-container">
        <button id="saveSettings" class="mfst-btn mfst-btn--save">Save</button>
        <button id="resetDefaults" class="mfst-btn mfst-btn--reset">Reset</button>
        <button id="manageBlocklist" class="mfst-btn mfst-btn--manage">Manage Blocklist</button>
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
    
    #font-size-panel .mfst-btn--manage {
      background: #6c757d;
      color: white;
      flex: 1;
      font-size: 10px;
    }
    
    #font-size-panel .mfst-btn--manage:hover {
      background: #5a6268;
    }
    
    #font-size-panel .mfst-btn--small {
      padding: 4px 8px;
      font-size: 10px;
      border-radius: 3px;
    }
    
    #font-size-panel .mfst-btn--toggle-block {
      background: #dc3545;
      color: white;
      margin-left: 8px;
    }
    
    #font-size-panel .mfst-btn--toggle-block:hover {
      background: #c82333;
    }
    
    #font-size-panel .mfst-btn--toggle-block.blocked {
      background: #28a745;
    }
    
    #font-size-panel .mfst-btn--toggle-block.blocked:hover {
      background: #218838;
    }
    
    #font-size-panel .mfst-blocklist__current-site {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
    }
    
    #font-size-panel .mfst-blocklist__status {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
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

function updatePreview(size: number): void {
  const currentSizeElement = document.getElementById('fontPreview');
  if (currentSizeElement) {
    currentSizeElement.textContent = `Current: ${size}px`;
  }
}

function syncInputs(value: string, applyLive: boolean = false): void {
  const numberInput = document.getElementById('fontSize') as HTMLInputElement;
  const rangeInput = document.getElementById('fontRange') as HTMLInputElement;
  
  if (numberInput && rangeInput) {
    numberInput.value = value;
    rangeInput.value = value;
    updatePreview(parseInt(value));
    
    if (applyLive && validateInput(value)) {
      applyFontSizeLive(parseInt(value));
    }
  }
}

function validateInput(value: string): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= 6 && num <= 72;
}

function applyFontSizeLive(fontSize: number): void {
  chrome.runtime.sendMessage({
    action: 'setFontSize',
    size: fontSize,
    url: window.location.href
  });
}

function isUrlInBlocklist(url: string, blocklist: string[]): boolean {
  const urlToCheck = url.toLowerCase();
  return blocklist.some(pattern => {
    const patternLower = pattern.toLowerCase();
    return urlToCheck.includes(patternLower);
  });
}

function getCurrentSitePattern(): string {
  const url = new URL(window.location.href);
  return url.hostname;
}

function updateCurrentSiteDisplay(): void {
  currentUrl = getCurrentSitePattern();
  const currentSiteElement = document.getElementById('currentSiteUrl');
  if (currentSiteElement) {
    currentSiteElement.textContent = `Current site: ${currentUrl}`;
  }
}

function updateBlocklistButton(blocklist: string[]): void {
  const button = document.getElementById('toggleBlocklist') as HTMLButtonElement;
  const status = document.getElementById('blocklistStatus');
  
  if (button && status) {
    const isBlocked = isUrlInBlocklist(window.location.href, blocklist);
    
    if (isBlocked) {
      button.textContent = 'Remove from Blocklist';
      button.classList.add('blocked');
      status.textContent = 'Font changes disabled for this site';
      status.style.color = '#dc3545';
    } else {
      button.textContent = 'Add to Blocklist';
      button.classList.remove('blocked');
      status.textContent = 'Font changes enabled for this site';
      status.style.color = '#28a745';
    }
  }
}

function toggleCurrentSiteBlocklist(): void {
  chrome.storage.sync.get({
    blocklist: DEFAULT_BLOCKLIST
  }, (items) => {
    const blocklist = [...items.blocklist];
    const pattern = getCurrentSitePattern();
    const index = blocklist.indexOf(pattern);
    
    if (index > -1) {
      blocklist.splice(index, 1);
      showStatus('Site removed from blocklist');
    } else {
      blocklist.push(pattern);
      showStatus('Site added to blocklist');
    }
    
    chrome.storage.sync.set({ blocklist }, () => {
      updateBlocklistButton(blocklist);
    });
  });
}

function saveSettings(): void {
  const fontSizeElement = document.getElementById('fontSize') as HTMLInputElement;
  
  const fontSize = fontSizeElement.value;

  if (!validateInput(fontSize)) {
    showStatus('Invalid font size', false);
    return;
  }

  const fontNum = parseInt(fontSize);

  chrome.storage.sync.set({
    minimumFontSize: fontNum
  }, () => {
    showStatus('Saved!');
  });
}

function resetToDefaults(): void {
  syncInputs(DEFAULT_LARGE.toString(), true);
  showStatus('Reset to defaults');
}

function loadSettings(): void {
  chrome.storage.sync.get({
    minimumFontSize: DEFAULT_LARGE,
    blocklist: DEFAULT_BLOCKLIST
  }, (items) => {
    syncInputs(items.minimumFontSize.toString());
    updateBlocklistButton(items.blocklist);
  });
}

function setupPanelEventListeners(): void {
  const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
  const fontRangeInput = document.getElementById('fontRange') as HTMLInputElement;
  const saveButton = document.getElementById('saveSettings');
  const resetButton = document.getElementById('resetDefaults');
  const closeButton = document.getElementById('closeFontPanel');
  const toggleBlocklistButton = document.getElementById('toggleBlocklist');
  const manageBlocklistButton = document.getElementById('manageBlocklist');

  if (fontSizeInput && fontRangeInput) {
    fontSizeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (validateInput(value)) {
        syncInputs(value, true);
      }
    });

    fontRangeInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      syncInputs(value, true);
    });
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

  if (toggleBlocklistButton) {
    toggleBlocklistButton.addEventListener('click', toggleCurrentSiteBlocklist);
  }

  if (manageBlocklistButton) {
    manageBlocklistButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
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
  
  updateCurrentSiteDisplay();
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
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFontPanel') {
    togglePanel();
  }
});

// Also check on DOMContentLoaded for additional safety
document.addEventListener('DOMContentLoaded', () => {
  // Only run the background communication, not CSS injection again
  chrome.storage.sync.get({
    blocklist: DEFAULT_BLOCKLIST
  }, (items) => {
    const isBlocked = isUrlInBlocklist(window.location.href, items.blocklist);
    
    if (isBlocked) {
      chrome.runtime.sendMessage({
        action: 'immediateReset',
        url: window.location.href
      });
    } else {
      chrome.runtime.sendMessage({
        action: 'immediateRestore',
        url: window.location.href
      });
    }
  });
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