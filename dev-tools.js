// 開發者工具模組

let devToolsPanel = null;
let isDevToolsVisible = false;
let apiRequestLogs = [];
let consoleLogs = [];

/**
 * 建立開發者工具面板
 */
function createDevToolsPanel() {
  if (devToolsPanel) return;
  
  // 建立面板容器
  devToolsPanel = document.createElement('div');
  devToolsPanel.id = 'dev-tools-panel';
  devToolsPanel.innerHTML = `
    <div class="dev-tools-header">
      <h3>開發者工具</h3>
      <button id="dev-tools-toggle" class="dev-tools-toggle-btn">最小化</button>
      <button id="dev-tools-close" class="dev-tools-close-btn">×</button>
    </div>
    <div class="dev-tools-content" id="dev-tools-content">
      <div class="dev-tools-tabs">
        <button class="dev-tab active" data-tab="api">API 端點</button>
        <button class="dev-tab" data-tab="requests">請求記錄</button>
        <button class="dev-tab" data-tab="console">Console</button>
        <button class="dev-tab" data-tab="config">環境配置</button>
        <button class="dev-tab" data-tab="ios-components">iOS 元件實驗</button>
      </div>
      
      <div class="dev-tab-content active" id="tab-api">
        <div class="dev-section">
          <label>當前 API 端點：</label>
          <input type="text" id="api-endpoint-input" class="dev-input" />
          <button id="api-endpoint-apply" class="dev-btn">套用</button>
        </div>
        <div class="dev-section">
          <label>環境切換：</label>
          <select id="env-select" class="dev-select">
            <option value="dev">開發環境 (dev)</option>
            <option value="github">正式環境 (github)</option>
          </select>
          <button id="env-reload" class="dev-btn">重新載入</button>
        </div>
        <div class="dev-section">
          <label>佈局實驗功能：</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="new-layout-toggle" />
              <span>啟用新佈局（可收合側邊欄、統計卡片上移）</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="compact-stats-toggle" />
              <span>緊湊統計卡片（橫向排列）</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="chart-table-side-by-side-toggle" />
              <span>圖表與表格並排顯示（大螢幕）</span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="dev-tab-content" id="tab-requests">
        <div class="dev-section">
          <button id="clear-requests" class="dev-btn">清除記錄</button>
          <div id="requests-log" class="dev-log"></div>
        </div>
      </div>
      
      <div class="dev-tab-content" id="tab-console">
        <div class="dev-section">
          <button id="clear-console" class="dev-btn">清除 Console</button>
          <div id="console-log" class="dev-log"></div>
        </div>
      </div>
      
      <div class="dev-tab-content" id="tab-config">
        <div class="dev-section">
          <pre id="config-display" class="dev-code"></pre>
        </div>
      </div>
      
      <div class="dev-tab-content" id="tab-ios-components">
        <div class="dev-section">
          <label>iOS 元件樣式實驗系統</label>
          <p style="font-size: 12px; color: #666; margin: 8px 0;">選擇不同的 iOS 元件樣式並應用到頁面上</p>
        </div>
        
        <div class="dev-section">
          <label>按鈕樣式：</label>
          <select id="ios-button-style" class="dev-select">
            <option value="default">預設（iOS 標準）</option>
            <option value="filled">填充按鈕（Filled）</option>
            <option value="tinted">色調按鈕（Tinted）</option>
            <option value="bordered">邊框按鈕（Bordered）</option>
            <option value="plain">純文字按鈕（Plain）</option>
            <option value="prominent">突出按鈕（Prominent）</option>
          </select>
          <button id="apply-button-style" class="dev-btn">套用按鈕樣式</button>
        </div>
        
        <div class="dev-section">
          <label>輸入框樣式：</label>
          <select id="ios-input-style" class="dev-select">
            <option value="default">預設（iOS 標準）</option>
            <option value="rounded">圓角輸入框</option>
            <option value="square">方形輸入框</option>
            <option value="minimal">極簡輸入框</option>
          </select>
          <button id="apply-input-style" class="dev-btn">套用輸入框樣式</button>
        </div>
        
        <div class="dev-section">
          <label>卡片樣式：</label>
          <select id="ios-card-style" class="dev-select">
            <option value="default">預設（iOS 標準）</option>
            <option value="elevated">提升卡片</option>
            <option value="flat">扁平卡片</option>
            <option value="grouped">分組卡片</option>
          </select>
          <button id="apply-card-style" class="dev-btn">套用卡片樣式</button>
        </div>
        
        <div class="dev-section">
          <label>統計卡片樣式：</label>
          <select id="ios-stat-card-style" class="dev-select">
            <option value="default">預設（iOS 標準）</option>
            <option value="compact">緊湊樣式</option>
            <option value="large">大型樣式</option>
            <option value="minimal">極簡樣式</option>
          </select>
          <button id="apply-stat-card-style" class="dev-btn">套用統計卡片樣式</button>
        </div>
        
        <div class="dev-section">
          <label>預覽區域：</label>
          <div id="ios-component-preview" style="background: var(--ios-bg-secondary, #f2f2f7); padding: 16px; border-radius: 12px; margin-top: 8px;">
            <div style="margin-bottom: 16px;">
              <button class="ios-preview-btn" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 500;">預覽按鈕</button>
            </div>
            <div style="margin-bottom: 16px;">
              <input type="text" class="ios-preview-input" placeholder="預覽輸入框" style="width: 100%; padding: 12px; border: 1px solid #c7c7cc; border-radius: 8px; font-size: 15px; background: white;">
            </div>
            <div class="ios-preview-card" style="background: white; padding: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-size: 17px; font-weight: 600; margin-bottom: 8px;">預覽卡片</div>
              <div style="font-size: 15px; color: #666;">這是卡片內容的預覽</div>
            </div>
          </div>
        </div>
        
        <div class="dev-section">
          <button id="reset-ios-styles" class="dev-btn" style="background: #ff3b30;">重置所有樣式</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(devToolsPanel);
  
  // 綁定事件
  setupDevToolsEvents();
  
  // 初始化顯示
  updateConfigDisplay();
  updateAPIEndpointInput();
  
  // 攔截 console 輸出
  interceptConsole();
  
  // 攔截 fetch 請求
  interceptFetch();
  
  // 載入已儲存的 iOS 樣式
  setTimeout(() => {
    loadSavedIOSStyles();
  }, 100);
}

/**
 * 設定開發者工具事件
 */
function setupDevToolsEvents() {
  // 切換顯示/隱藏
  document.getElementById('dev-tools-toggle').addEventListener('click', () => {
    const content = document.getElementById('dev-tools-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  });
  
  // 關閉面板
  document.getElementById('dev-tools-close').addEventListener('click', () => {
    hideDevTools();
  });
  
  // 標籤切換
  document.querySelectorAll('.dev-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // API 端點套用
  document.getElementById('api-endpoint-apply').addEventListener('click', () => {
    const endpoint = document.getElementById('api-endpoint-input').value;
    if (endpoint && window.CURRENT_CONFIG) {
      window.CURRENT_CONFIG.apiBaseUrl = endpoint;
      updateConfigDisplay();
      showNotification('API 端點已更新，請重新載入頁面以套用變更');
    }
  });
  
  // 環境切換
  document.getElementById('env-reload').addEventListener('click', () => {
    const env = document.getElementById('env-select').value;
    localStorage.setItem('dev_env_override', env);
    showNotification('環境已切換，請重新載入頁面');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
  
  // 清除請求記錄
  document.getElementById('clear-requests').addEventListener('click', () => {
    apiRequestLogs = [];
    updateRequestsLog();
  });
  
  // 清除 Console
  document.getElementById('clear-console').addEventListener('click', () => {
    consoleLogs = [];
    updateConsoleLog();
  });
  
  // 初始化佈局功能（如果 layout-features.js 已載入）
  if (typeof window.LayoutFeatures !== 'undefined' && window.LayoutFeatures.init) {
    window.LayoutFeatures.init();
  }
  
  // 初始化 iOS 元件實驗功能
  initIOSComponentExperiments();
}

/**
 * 切換標籤
 */
function switchTab(tabName) {
  // 隱藏所有標籤內容
  document.querySelectorAll('.dev-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // 移除所有標籤的 active 狀態
  document.querySelectorAll('.dev-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 顯示選中的標籤
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // 更新對應的內容
  if (tabName === 'requests') {
    updateRequestsLog();
  } else if (tabName === 'console') {
    updateConsoleLog();
  } else if (tabName === 'config') {
    updateConfigDisplay();
  }
}

/**
 * 更新 API 端點輸入框
 */
function updateAPIEndpointInput() {
  if (window.CURRENT_CONFIG) {
    document.getElementById('api-endpoint-input').value = window.CURRENT_CONFIG.apiBaseUrl || '';
  }
  
  // 設定環境選擇器
  const envOverride = localStorage.getItem('dev_env_override');
  if (envOverride) {
    document.getElementById('env-select').value = envOverride;
  } else if (window.ENV) {
    document.getElementById('env-select').value = window.ENV;
  }
}

/**
 * 更新配置顯示
 */
function updateConfigDisplay() {
  const config = {
    ENV: window.ENV || 'unknown',
    apiBaseUrl: window.CURRENT_CONFIG?.apiBaseUrl || 'unknown',
    enableDevTools: window.CURRENT_CONFIG?.enableDevTools || false,
    showDebugInfo: window.CURRENT_CONFIG?.showDebugInfo || false
  };
  
  document.getElementById('config-display').textContent = JSON.stringify(config, null, 2);
}

/**
 * 更新請求記錄
 */
function updateRequestsLog() {
  const logContainer = document.getElementById('requests-log');
  
  if (apiRequestLogs.length === 0) {
    logContainer.innerHTML = '<div class="dev-empty">尚無請求記錄</div>';
    return;
  }
  
  logContainer.innerHTML = apiRequestLogs.map((log, index) => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `
      <div class="dev-log-item">
        <div class="dev-log-header">
          <span class="dev-log-method">${log.method}</span>
          <span class="dev-log-url">${log.url}</span>
          <span class="dev-log-time">${time}</span>
        </div>
        <div class="dev-log-details">
          <div><strong>狀態：</strong>${log.status} ${log.statusText}</div>
          <div><strong>回應時間：</strong>${log.duration}ms</div>
          ${log.response ? `<div><strong>回應：</strong><pre class="dev-code-small">${JSON.stringify(log.response, null, 2)}</pre></div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 更新 Console 記錄
 */
function updateConsoleLog() {
  const logContainer = document.getElementById('console-log');
  
  if (consoleLogs.length === 0) {
    logContainer.innerHTML = '<div class="dev-empty">尚無 Console 記錄</div>';
    return;
  }
  
  logContainer.innerHTML = consoleLogs.map(log => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `
      <div class="dev-log-item dev-log-${log.level}">
        <div class="dev-log-header">
          <span class="dev-log-level">[${log.level.toUpperCase()}]</span>
          <span class="dev-log-time">${time}</span>
        </div>
        <div class="dev-log-message">${escapeHtml(log.message)}</div>
      </div>
    `;
  }).join('');
}

/**
 * 攔截 console 輸出
 */
function interceptConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  
  console.log = function(...args) {
    consoleLogs.push({
      level: 'log',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
      timestamp: Date.now()
    });
    originalLog.apply(console, args);
    if (isDevToolsVisible) updateConsoleLog();
  };
  
  console.error = function(...args) {
    consoleLogs.push({
      level: 'error',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
      timestamp: Date.now()
    });
    originalError.apply(console, args);
    if (isDevToolsVisible) updateConsoleLog();
  };
  
  console.warn = function(...args) {
    consoleLogs.push({
      level: 'warn',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
      timestamp: Date.now()
    });
    originalWarn.apply(console, args);
    if (isDevToolsVisible) updateConsoleLog();
  };
  
  console.info = function(...args) {
    consoleLogs.push({
      level: 'info',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
      timestamp: Date.now()
    });
    originalInfo.apply(console, args);
    if (isDevToolsVisible) updateConsoleLog();
  };
}

/**
 * 攔截 fetch 請求
 */
function interceptFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    const startTime = Date.now();
    const url = args[0];
    const options = args[1] || {};
    const method = options.method || 'GET';
    
    return originalFetch.apply(window, args)
      .then(response => {
        const duration = Date.now() - startTime;
        
        // 複製回應以便讀取
        const clonedResponse = response.clone();
        
        // 記錄請求
        clonedResponse.json().then(data => {
          apiRequestLogs.unshift({
            method,
            url: typeof url === 'string' ? url : url.url || 'unknown',
            status: response.status,
            statusText: response.statusText,
            duration,
            response: data,
            timestamp: Date.now()
          });
          
          // 限制記錄數量
          if (apiRequestLogs.length > 50) {
            apiRequestLogs.pop();
          }
          
          if (isDevToolsVisible) updateRequestsLog();
        }).catch(() => {
          // 如果不是 JSON，記錄基本資訊
          apiRequestLogs.unshift({
            method,
            url: typeof url === 'string' ? url : url.url || 'unknown',
            status: response.status,
            statusText: response.statusText,
            duration,
            timestamp: Date.now()
          });
          
          if (apiRequestLogs.length > 50) {
            apiRequestLogs.pop();
          }
          
          if (isDevToolsVisible) updateRequestsLog();
        });
        
        return response;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        apiRequestLogs.unshift({
          method,
          url: typeof url === 'string' ? url : url.url || 'unknown',
          status: 'ERROR',
          statusText: error.message,
          duration,
          timestamp: Date.now()
        });
        
        if (isDevToolsVisible) updateRequestsLog();
        
        throw error;
      });
  };
}

/**
 * 顯示開發者工具
 */
function showDevTools() {
  if (!devToolsPanel) {
    createDevToolsPanel();
  }
  
  devToolsPanel.style.display = 'block';
  isDevToolsVisible = true;
}

/**
 * 隱藏開發者工具
 */
function hideDevTools() {
  if (devToolsPanel) {
    devToolsPanel.style.display = 'none';
    isDevToolsVisible = false;
  }
}

/**
 * 初始化 iOS 元件實驗功能
 */
function initIOSComponentExperiments() {
  // 按鈕樣式套用
  const applyButtonStyleBtn = document.getElementById('apply-button-style');
  if (applyButtonStyleBtn) {
    applyButtonStyleBtn.addEventListener('click', () => {
      const style = document.getElementById('ios-button-style').value;
      applyIOSButtonStyle(style);
      updateIOSComponentPreview();
    });
  }
  
  // 輸入框樣式套用
  const applyInputStyleBtn = document.getElementById('apply-input-style');
  if (applyInputStyleBtn) {
    applyInputStyleBtn.addEventListener('click', () => {
      const style = document.getElementById('ios-input-style').value;
      applyIOSInputStyle(style);
      updateIOSComponentPreview();
    });
  }
  
  // 卡片樣式套用
  const applyCardStyleBtn = document.getElementById('apply-card-style');
  if (applyCardStyleBtn) {
    applyCardStyleBtn.addEventListener('click', () => {
      const style = document.getElementById('ios-card-style').value;
      applyIOSCardStyle(style);
      updateIOSComponentPreview();
    });
  }
  
  // 統計卡片樣式套用
  const applyStatCardStyleBtn = document.getElementById('apply-stat-card-style');
  if (applyStatCardStyleBtn) {
    applyStatCardStyleBtn.addEventListener('click', () => {
      const style = document.getElementById('ios-stat-card-style').value;
      applyIOSStatCardStyle(style);
      updateIOSComponentPreview();
    });
  }
  
  // 重置樣式
  const resetStylesBtn = document.getElementById('reset-ios-styles');
  if (resetStylesBtn) {
    resetStylesBtn.addEventListener('click', () => {
      resetIOSStyles();
      updateIOSComponentPreview();
    });
  }
  
  // 初始化預覽
  updateIOSComponentPreview();
}

/**
 * 套用 iOS 按鈕樣式
 */
function applyIOSButtonStyle(style) {
  const buttons = document.querySelectorAll('.analysis-btn, .export-btn, .dev-btn, button:not(.dev-tab):not(.dev-tools-toggle-btn):not(.dev-tools-close-btn)');
  
  // 移除所有樣式類別
  buttons.forEach(btn => {
    btn.classList.remove('ios-btn-filled', 'ios-btn-tinted', 'ios-btn-bordered', 'ios-btn-plain', 'ios-btn-prominent');
  });
  
  if (style !== 'default') {
    buttons.forEach(btn => {
      btn.classList.add(`ios-btn-${style}`);
    });
  }
  
  localStorage.setItem('ios_button_style', style);
  showNotification(`已套用 iOS 按鈕樣式：${style}`);
}

/**
 * 套用 iOS 輸入框樣式
 */
function applyIOSInputStyle(style) {
  const inputs = document.querySelectorAll('.text-field input, .select-field select, input[type="text"], input[type="number"], select');
  
  inputs.forEach(input => {
    input.classList.remove('ios-input-rounded', 'ios-input-square', 'ios-input-minimal');
    if (style !== 'default') {
      input.classList.add(`ios-input-${style}`);
    }
  });
  
  localStorage.setItem('ios_input_style', style);
  showNotification(`已套用 iOS 輸入框樣式：${style}`);
}

/**
 * 套用 iOS 卡片樣式
 */
function applyIOSCardStyle(style) {
  const cards = document.querySelectorAll('.section-card, .stat-card');
  
  cards.forEach(card => {
    card.classList.remove('ios-card-elevated', 'ios-card-flat', 'ios-card-grouped');
    if (style !== 'default') {
      card.classList.add(`ios-card-${style}`);
    }
  });
  
  localStorage.setItem('ios_card_style', style);
  showNotification(`已套用 iOS 卡片樣式：${style}`);
}

/**
 * 套用 iOS 統計卡片樣式
 */
function applyIOSStatCardStyle(style) {
  const statCards = document.querySelectorAll('.stat-card');
  
  statCards.forEach(card => {
    card.classList.remove('ios-stat-compact', 'ios-stat-large', 'ios-stat-minimal');
    if (style !== 'default') {
      card.classList.add(`ios-stat-${style}`);
    }
  });
  
  localStorage.setItem('ios_stat_card_style', style);
  showNotification(`已套用 iOS 統計卡片樣式：${style}`);
}

/**
 * 重置所有 iOS 樣式
 */
function resetIOSStyles() {
  document.body.classList.remove('ios-components-experiment');
  
  // 移除所有樣式類別
  document.querySelectorAll('*').forEach(el => {
    el.classList.remove(
      'ios-btn-filled', 'ios-btn-tinted', 'ios-btn-bordered', 'ios-btn-plain', 'ios-btn-prominent',
      'ios-input-rounded', 'ios-input-square', 'ios-input-minimal',
      'ios-card-elevated', 'ios-card-flat', 'ios-card-grouped',
      'ios-stat-compact', 'ios-stat-large', 'ios-stat-minimal'
    );
  });
  
  // 重置選擇器
  document.getElementById('ios-button-style').value = 'default';
  document.getElementById('ios-input-style').value = 'default';
  document.getElementById('ios-card-style').value = 'default';
  document.getElementById('ios-stat-card-style').value = 'default';
  
  // 清除 localStorage
  localStorage.removeItem('ios_button_style');
  localStorage.removeItem('ios_input_style');
  localStorage.removeItem('ios_card_style');
  localStorage.removeItem('ios_stat_card_style');
  
  showNotification('已重置所有 iOS 樣式');
}

/**
 * 更新 iOS 元件預覽
 */
function updateIOSComponentPreview() {
  const preview = document.getElementById('ios-component-preview');
  if (!preview) return;
  
  const buttonStyle = document.getElementById('ios-button-style')?.value || 'default';
  const inputStyle = document.getElementById('ios-input-style')?.value || 'default';
  const cardStyle = document.getElementById('ios-card-style')?.value || 'default';
  
  // 更新預覽按鈕
  const previewBtn = preview.querySelector('.ios-preview-btn');
  if (previewBtn) {
    previewBtn.className = 'ios-preview-btn';
    if (buttonStyle !== 'default') {
      previewBtn.classList.add(`ios-btn-${buttonStyle}`);
    }
  }
  
  // 更新預覽輸入框
  const previewInput = preview.querySelector('.ios-preview-input');
  if (previewInput) {
    previewInput.className = 'ios-preview-input';
    if (inputStyle !== 'default') {
      previewInput.classList.add(`ios-input-${inputStyle}`);
    }
  }
  
  // 更新預覽卡片
  const previewCard = preview.querySelector('.ios-preview-card');
  if (previewCard) {
    previewCard.className = 'ios-preview-card';
    if (cardStyle !== 'default') {
      previewCard.classList.add(`ios-card-${cardStyle}`);
    }
  }
}

/**
 * 載入已儲存的 iOS 樣式
 */
function loadSavedIOSStyles() {
  const buttonStyle = localStorage.getItem('ios_button_style');
  const inputStyle = localStorage.getItem('ios_input_style');
  const cardStyle = localStorage.getItem('ios_card_style');
  const statCardStyle = localStorage.getItem('ios_stat_card_style');
  
  if (buttonStyle) {
    document.getElementById('ios-button-style').value = buttonStyle;
    applyIOSButtonStyle(buttonStyle);
  }
  
  if (inputStyle) {
    document.getElementById('ios-input-style').value = inputStyle;
    applyIOSInputStyle(inputStyle);
  }
  
  if (cardStyle) {
    document.getElementById('ios-card-style').value = cardStyle;
    applyIOSCardStyle(cardStyle);
  }
  
  if (statCardStyle) {
    document.getElementById('ios-stat-card-style').value = statCardStyle;
    applyIOSStatCardStyle(statCardStyle);
  }
}

/**
 * 切換開發者工具顯示狀態
 */
function toggleDevTools() {
  if (isDevToolsVisible) {
    hideDevTools();
  } else {
    showDevTools();
  }
}

/**
 * 顯示通知
 */
function showNotification(message) {
  // 使用現有的通知系統（如果有的話）
  if (window.showError) {
    window.showError(message);
  } else {
    alert(message);
  }
}

/**
 * HTML 轉義
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 快捷鍵支援（Ctrl+Shift+D）
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    toggleDevTools();
  }
});

// 如果環境配置啟用開發者工具，自動顯示
if (typeof CURRENT_CONFIG !== 'undefined' && CURRENT_CONFIG.enableDevTools) {
  // 等待 DOM 載入完成後自動顯示
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        createDevToolsPanel();
        showDevTools();
        // 初始化佈局功能
        if (typeof initLayoutFeatures === 'function') {
          initLayoutFeatures();
        }
      }, 1000);
    });
  } else {
    setTimeout(() => {
      createDevToolsPanel();
      showDevTools();
      // 初始化佈局功能
      if (typeof initLayoutFeatures === 'function') {
        initLayoutFeatures();
      }
    }, 1000);
  }
}

// 匯出函數
window.DevTools = {
  show: showDevTools,
  hide: hideDevTools,
  toggle: toggleDevTools
};

