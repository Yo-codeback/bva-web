/**
 * 佈局實驗功能
 * 可透過 config.js 中的 enableLayoutFeatures 控制是否啟用
 */

/**
 * 初始化佈局實驗功能
 */
function initLayoutFeatures() {
  // 新佈局切換
  const newLayoutToggle = document.getElementById('new-layout-toggle');
  if (newLayoutToggle) {
    // 從 localStorage 讀取狀態
    const savedLayoutState = localStorage.getItem('dev_new_layout_enabled') === 'true';
    newLayoutToggle.checked = savedLayoutState;
    if (savedLayoutState) {
      document.body.classList.add('new-layout-enabled');
      setTimeout(() => initSidebarToggle(), 100);
    }
    
    newLayoutToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('new-layout-enabled');
        localStorage.setItem('dev_new_layout_enabled', 'true');
        setTimeout(() => initSidebarToggle(), 100);
      } else {
        document.body.classList.remove('new-layout-enabled');
        localStorage.setItem('dev_new_layout_enabled', 'false');
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) sidebarToggle.style.display = 'none';
      }
      window.dispatchEvent(new Event('resize'));
    });
  }
  
  // 緊湊統計卡片切換
  const compactStatsToggle = document.getElementById('compact-stats-toggle');
  if (compactStatsToggle) {
    const savedCompactStats = localStorage.getItem('dev_compact_stats_enabled') === 'true';
    compactStatsToggle.checked = savedCompactStats;
    if (savedCompactStats) {
      document.body.classList.add('compact-stats-enabled');
    }
    
    compactStatsToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('compact-stats-enabled');
        localStorage.setItem('dev_compact_stats_enabled', 'true');
      } else {
        document.body.classList.remove('compact-stats-enabled');
        localStorage.setItem('dev_compact_stats_enabled', 'false');
      }
    });
  }
  
  // 圖表與表格並排切換
  const chartTableSideBySideToggle = document.getElementById('chart-table-side-by-side-toggle');
  if (chartTableSideBySideToggle) {
    const savedSideBySide = localStorage.getItem('dev_chart_table_side_by_side') === 'true';
    chartTableSideBySideToggle.checked = savedSideBySide;
    if (savedSideBySide) {
      document.body.classList.add('chart-table-side-by-side');
    }
    
    chartTableSideBySideToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('chart-table-side-by-side');
        localStorage.setItem('dev_chart_table_side_by_side', 'true');
      } else {
        document.body.classList.remove('chart-table-side-by-side');
        localStorage.setItem('dev_chart_table_side_by_side', 'false');
      }
    });
  }
}

/**
 * 初始化側邊欄收合功能
 */
function initSidebarToggle() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const controlSection = document.getElementById('controlSection');
  
  if (!sidebarToggle || !controlSection) return;
  
  // 顯示按鈕
  sidebarToggle.style.display = 'flex';
  
  // 從 localStorage 讀取收合狀態
  const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  if (isCollapsed) {
    controlSection.classList.add('collapsed');
  }
  
  // 更新圖示
  const icon = sidebarToggle.querySelector('.material-symbols-outlined');
  if (icon) {
    icon.textContent = isCollapsed ? 'menu_open' : 'menu';
  }
  
  // 綁定點擊事件（如果還沒綁定）
  if (!sidebarToggle.dataset.bound) {
    sidebarToggle.addEventListener('click', () => {
      controlSection.classList.toggle('collapsed');
      const isNowCollapsed = controlSection.classList.contains('collapsed');
      localStorage.setItem('sidebar_collapsed', isNowCollapsed.toString());
      
      // 更新圖示
      const icon = sidebarToggle.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = isNowCollapsed ? 'menu_open' : 'menu';
      }
      
      // 動態調整 main-content 的 grid-template-columns
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        if (isNowCollapsed) {
          mainContent.style.gridTemplateColumns = '60px 1fr';
        } else {
          mainContent.style.gridTemplateColumns = '350px 1fr';
        }
      }
    });
    sidebarToggle.dataset.bound = 'true';
  }
  
  // 初始化時也要設定 grid-template-columns
  const mainContent = document.querySelector('.main-content');
  if (mainContent && controlSection.classList.contains('collapsed')) {
    mainContent.style.gridTemplateColumns = '60px 1fr';
  }
}

// 匯出函數供外部使用
window.LayoutFeatures = {
  init: initLayoutFeatures,
  initSidebar: initSidebarToggle
};

