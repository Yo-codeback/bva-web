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
      }, 1000);
    });
  } else {
    setTimeout(() => {
      createDevToolsPanel();
      showDevTools();
    }, 1000);
  }
}

// 匯出函數
window.DevTools = {
  show: showDevTools,
  hide: hideDevTools,
  toggle: toggleDevTools
};

