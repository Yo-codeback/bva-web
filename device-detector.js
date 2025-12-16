// 裝置檢測與 CSS 切換邏輯

/**
 * 檢測裝置類型
 * @returns {string} 'ios' | 'android' | 'other'
 */
function detectDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // iOS 檢測
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  // Android 檢測
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // 其他裝置
  return 'other';
}

/**
 * 載入對應的 CSS 檔案
 * @param {string} platform - 'ios' | 'android' | 'other'
 */
function loadPlatformCSS(platform) {
  // 移除現有的平台 CSS
  const existingLink = document.getElementById('platform-stylesheet');
  if (existingLink) {
    existingLink.remove();
  }
  
  // 建立新的 CSS 連結
  const link = document.createElement('link');
  link.id = 'platform-stylesheet';
  link.rel = 'stylesheet';
  
  switch(platform) {
    case 'ios':
      link.href = 'styles-ios.css';
      break;
    case 'android':
      link.href = 'styles-android.css';
      break;
    case 'other':
    default:
      link.href = 'styles-other.css';
      break;
  }
  
  // 插入到 head
  document.head.appendChild(link);
  
  // 儲存選擇到 localStorage
  localStorage.setItem('preferred_platform', platform);
  
  console.log(`已載入 ${platform} 樣式`);
}

/**
 * 從 URL 參數獲取平台
 * @returns {string|null} 'ios' | 'android' | 'other' | null
 */
function getPlatformFromURL() {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('platform');
  
  if (platform === 'ios' || platform === 'android' || platform === 'other') {
    return platform;
  }
  
  return null;
}

/**
 * 初始化平台檢測與 CSS 載入
 */
function initPlatformDetection() {
  // 優先使用 URL 參數
  let platform = getPlatformFromURL();
  
  // 如果沒有 URL 參數，檢查 localStorage
  if (!platform) {
    const savedPlatform = localStorage.getItem('preferred_platform');
    if (savedPlatform === 'ios' || savedPlatform === 'android' || savedPlatform === 'other') {
      platform = savedPlatform;
    }
  }
  
  // 如果還是沒有，自動檢測
  if (!platform) {
    platform = detectDevice();
  }
  
  // 載入對應的 CSS
  loadPlatformCSS(platform);
  
  return platform;
}

/**
 * 手動切換平台
 * @param {string} platform - 'ios' | 'android' | 'other'
 */
function switchPlatform(platform) {
  if (platform !== 'ios' && platform !== 'android' && platform !== 'other') {
    console.error('無效的平台類型:', platform);
    return;
  }
  
  loadPlatformCSS(platform);
  
  // 更新 URL（不移除其他參數）
  const url = new URL(window.location);
  url.searchParams.set('platform', platform);
  window.history.replaceState({}, '', url);
  
  // 觸發自訂事件，通知其他模組
  window.dispatchEvent(new CustomEvent('platformChanged', { detail: { platform } }));
}

// 在 DOM 載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlatformDetection);
} else {
  initPlatformDetection();
}

// 匯出函數供外部使用
window.DeviceDetector = {
  detectDevice,
  loadPlatformCSS,
  switchPlatform,
  getCurrentPlatform: () => {
    const link = document.getElementById('platform-stylesheet');
    if (!link) return null;
    const href = link.href;
    if (href.includes('styles-ios.css')) return 'ios';
    if (href.includes('styles-android.css')) return 'android';
    if (href.includes('styles-other.css')) return 'other';
    return null;
  }
};

