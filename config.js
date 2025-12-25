// 環境配置 - 手動切換 env 值來改變環境
const ENV = 'github'; // 或 'github'

const ENV_CONFIG = {
  dev: {
    apiBaseUrl: 'http://hk-a.nothingh.com:40004', // 或開發環境 API
    enableDevTools: true,
    showDebugInfo: true,
    enableLayoutFeatures: true // 啟用佈局實驗功能
  },
  github: {
    apiBaseUrl: 'https://ecdb7429.nhnet.dev/',
    enableDevTools: false,
    showDebugInfo: false,
    enableLayoutFeatures: false // 正式環境也啟用佈局實驗功能
  }
};

// 匯出當前環境配置
const CURRENT_CONFIG = ENV_CONFIG[ENV] || ENV_CONFIG.github;

