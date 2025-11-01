// 農產品交易資料分析系統 V3.0.0
// 發布日期：2025/10/26
// 開發團隊：VNAos

// 版本資訊
const VERSION = 'V3.0.0';
const RELEASE_DATE = '2025/10/26';
console.log(`農產品交易分析系統 ${VERSION} - ${RELEASE_DATE}`);

// API 端點
const API_BASE_URL = 'https://bvc-api.creeperdev.me';

// DOM 元素
const searchInput = document.getElementById('searchInput');
const marketSelect = document.getElementById('marketSelect');
const cropSelect = document.getElementById('cropSelect');
const chartArea = document.getElementById('chartArea');
const resultArea = document.getElementById('resultArea');
const loadingIndicator = document.getElementById('loadingIndicator');
const dataUpdateTime = document.getElementById('dataUpdateTime');
const dataTableBody = document.getElementById('dataTableBody');
const refreshFab = document.getElementById('refreshFab');

// 分析按鈕
const showPriceTrendBtn = document.getElementById('showPriceTrend');
const showVolumeDistBtn = document.getElementById('showVolumeDist');
const showPriceDistBtn = document.getElementById('showPriceDist');
const showSeasonalBtn = document.getElementById('showSeasonal');
const showPricePredictionBtn = document.getElementById('showPricePrediction');

// 匯出按鈕
const exportExcelBtn = document.getElementById('exportExcel');
const exportCSVBtn = document.getElementById('exportCSV');

// 統計卡片
const avgPriceElement = document.getElementById('avgPrice');
const minPriceElement = document.getElementById('minPrice');
const maxPriceElement = document.getElementById('maxPrice');
const totalVolumeElement = document.getElementById('totalVolume');

// 通知彈窗相關元素
const notificationModal = document.getElementById('notificationModal');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const notificationTime = document.getElementById('notificationTime');
const notificationTimeText = document.getElementById('notificationTimeText');
const closeNotificationBtn = document.getElementById('closeNotification');

// 資料相關變數
let cropData = [];
let marketData = [];
let selectedMarket = '';
let selectedCrop = '';

// 民國年轉西元年函數
function convertROCToAD(rocDateStr) {
    if (!rocDateStr) return '';
    
    // 處理民國年格式 (例: 112/10/26 或 112-10-26)
    const parts = rocDateStr.split(/[\/\-]/);
    if (parts.length === 3) {
        const rocYear = parseInt(parts[0]);
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const adYear = rocYear + 1911;
        return `${adYear}-${month}-${day}`;
    }
    
    // 如果已經是西元年格式，直接返回
    return rocDateStr;
}

// 獲取通知資料
async function fetchNotification() {
    try {
        console.log('檢查系統通知...');
        const response = await fetch(`${API_BASE_URL}/notify`);
        
        if (!response.ok) {
            console.log('沒有系統通知或 API 不可用');
            return null;
        }
        
        const notification = await response.json();
        console.log('收到系統通知:', notification);
        
        // 檢查是否針對主要資料 API 的通知
        // 如果 targetAPIs 包含 "main"，或者沒有指定 targetAPIs，則顯示通知
        if (notification.targetAPIs && Array.isArray(notification.targetAPIs)) {
            const shouldShow = notification.targetAPIs.includes('main');
            if (!shouldShow) {
                console.log('通知不適用於主要資料 API');
                return null;
            }
        }
        
        // 檢查時間是否還在有效期內
        // 如果有設定 endTime，檢查是否已經過了
        if (notification.endTime) {
            const endTime = new Date(notification.endTime);
            const now = new Date();
            if (now > endTime) {
                console.log('通知已經過期');
                return null;
            }
        }
        
        // 如果有設定 startTime，提前通知使用者（現在就顯示，不用等到開始時間）
        if (notification.startTime) {
            const startTime = new Date(notification.startTime);
            const now = new Date();
            
            // 如果是維護通知，提前告知使用者
            if (now < startTime) {
                console.log('檢測到即將到來的維護通知，提前告知使用者');
                // 標記這是提前通知，在顯示時會特別處理
                notification.isUpcoming = true;
            }
        }
        
        return notification;
    } catch (error) {
        console.warn('獲取通知失敗:', error);
        return null;
    }
}

// 顯示通知彈窗
function showNotification(notification) {
    if (!notification) return;
    
    // 設定標題和訊息
    notificationTitle.textContent = notification.title || '系統通知';
    
    // 如果是提前通知，調整訊息顯示
    if (notification.isUpcoming) {
        const currentTime = new Date();
        const startTime = new Date(notification.startTime);
        const hoursUntilStart = Math.floor((startTime - currentTime) / (1000 * 60 * 60));
        const minutesUntilStart = Math.floor((startTime - currentTime) / (1000 * 60));
        
        let timeUntilMessage = '';
        if (hoursUntilStart > 0) {
            timeUntilMessage = `約 ${hoursUntilStart} 小時後開始`;
        } else if (minutesUntilStart > 0) {
            timeUntilMessage = `約 ${minutesUntilStart} 分鐘後開始`;
        } else {
            timeUntilMessage = '即將開始';
        }
        
        notificationMessage.textContent = `⚠️ 預告：${timeUntilMessage}\n\n${notification.message || ''}`;
    } else {
        notificationMessage.textContent = notification.message || '';
    }
    
    // 顯示時間範圍（如果有）
    if (notification.startTime && notification.endTime) {
        const startTime = new Date(notification.startTime).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const endTime = new Date(notification.endTime).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        notificationTimeText.textContent = `${startTime} ~ ${endTime}`;
        notificationTime.style.display = 'flex';
    } else {
        notificationTime.style.display = 'none';
    }
    
    // 顯示彈窗
    notificationModal.style.display = 'flex';
}

// 關閉通知彈窗
function closeNotification() {
    notificationModal.style.display = 'none';
}

// 初始化應用程式
async function initializeApp() {
    console.log('初始化應用程式...');
    
    // 顯示載入狀態
    showLoading(true);
    
    try {
        // 並行獲取市場資料和作物資料
        await Promise.all([
            fetchMarketData(),
            fetchCropData()
        ]);
        
        // 初始化 UI
        updateMarketList();
        updateCropList();
        updateLastUpdateTime();
        
        console.log('應用程式初始化完成');
        
        // 檢查並顯示通知
        const notification = await fetchNotification();
        if (notification) {
            // 延遲一下再顯示，讓主畫面先載入完成
            setTimeout(() => {
                showNotification(notification);
            }, 500);
        }
    } catch (error) {
        console.error('初始化失敗:', error);
        showError('應用程式初始化失敗，請重新整理頁面');
    } finally {
        showLoading(false);
    }
}

// 獲取市場資料
async function fetchMarketData() {
    try {
        console.log('獲取市場資料...');
        const response = await fetch(`${API_BASE_URL}/markets`);
        
        if (!response.ok) {
            // 如果沒有專門的市場 API，從作物資料中提取市場名稱
            console.log('使用備用方案：從作物資料提取市場名稱');
            return;
        }
        
        marketData = await response.json();
        console.log(`獲取到 ${marketData.length} 個市場`);
    } catch (error) {
        console.warn('獲取市場資料失敗，將從作物資料中提取:', error);
        // 這不是致命錯誤，市場列表會在獲取作物資料後更新
    }
}

// 獲取作物資料
async function fetchCropData() {
    try {
        console.log('獲取作物資料...');
        const response = await fetch(`${API_BASE_URL}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        cropData = await response.json();
        
        // 轉換民國年日期為西元年
        cropData = cropData.map(item => ({
            ...item,
            交易日期: convertROCToAD(item.交易日期)
        }));
        
        console.log(`獲取到 ${cropData.length} 筆作物資料`);
        
        // 如果沒有專門的市場資料，從作物資料中提取市場名稱
        if (marketData.length === 0) {
            extractMarketsFromCropData();
        }
        
    } catch (error) {
        console.error('獲取作物資料失敗:', error);
        throw error;
    }
}

// 從作物資料中提取市場名稱
function extractMarketsFromCropData() {
    const markets = [...new Set(cropData.map(item => item.市場名稱))].sort();
    marketData = markets.map(market => ({ name: market, id: market }));
    console.log(`從作物資料中提取到 ${marketData.length} 個市場`);
}

// 更新市場列表
function updateMarketList() {
    marketSelect.innerHTML = '<option value="">所有市場</option>';
    
    marketData.forEach(market => {
        const option = document.createElement('option');
        option.value = market.name || market.id || market;
        option.textContent = market.name || market.id || market;
        marketSelect.appendChild(option);
    });
    
    console.log('市場列表已更新');
}

// 更新作物列表
function updateCropList() {
    let filteredData = cropData;
    
    // 根據選擇的市場過濾資料
    if (selectedMarket) {
        filteredData = cropData.filter(item => item.市場名稱 === selectedMarket);
    }
    
    const crops = [...new Set(filteredData.map(item => item.作物名稱))].sort();
    
    cropSelect.innerHTML = '<option value="">請選擇作物</option>';
    crops.forEach(crop => {
        const option = document.createElement('option');
        option.value = crop;
        option.textContent = crop;
        cropSelect.appendChild(option);
    });
    
    console.log(`作物列表已更新，共 ${crops.length} 個作物`);
}

// 搜尋作物
function filterCrops() {
    const searchText = searchInput.value.toLowerCase();
    const options = cropSelect.options;
    
    for (let i = 1; i < options.length; i++) {
        const option = options[i];
        const cropName = option.value.toLowerCase();
        option.style.display = cropName.includes(searchText) ? '' : 'none';
    }
}

// 獲取特定作物的資料
function getCropData(cropName, marketName = '') {
    let filteredData = cropData.filter(item => item.作物名稱 === cropName);
    
    if (marketName) {
        filteredData = filteredData.filter(item => item.市場名稱 === marketName);
    }
    
    return filteredData;
}

// 顯示價格趨勢圖
function showPriceTrend() {
    if (!selectedCrop) {
        showError('請先選擇作物');
        return;
    }
    
    const data = getCropData(selectedCrop, selectedMarket);
    if (data.length === 0) {
        showError('沒有找到相關資料');
        return;
    }
    
    // 按日期排序
    data.sort((a, b) => new Date(a.交易日期) - new Date(b.交易日期));
    
    const dates = data.map(item => item.交易日期);
    const prices = data.map(item => Number(item.平均價));
    
    // 找出最高和最低價格及其日期
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const maxIdx = prices.indexOf(maxPrice);
    const minIdx = prices.indexOf(minPrice);
    
    const trace = {
        x: dates,
        y: prices,
        type: 'scatter',
        mode: 'lines+markers',
        name: '價格趨勢',
        line: { 
            color: '#6750A4', 
            width: 3,
            shape: 'spline'
        },
        marker: { 
            size: 8, 
            color: '#6750A4',
            line: { color: '#FFFFFF', width: 2 }
        },
        fill: 'tonexty',
        fillcolor: 'rgba(103, 80, 164, 0.1)'
    };
    
    const layout = {
        title: {
            text: `${selectedCrop} 價格趨勢分析`,
            font: { size: 24, color: '#1C1B1F', family: 'Roboto' },
            x: 0.05
        },
        xaxis: { 
            title: { 
                text: '交易日期',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' },
            gridcolor: '#E7E0EC',
            showgrid: true
        },
        yaxis: { 
            title: { 
                text: '價格 (元/公斤)',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' },
            gridcolor: '#E7E0EC',
            showgrid: true
        },
        plot_bgcolor: '#FEF7FF',
        paper_bgcolor: '#FEF7FF',
        margin: { t: 80, l: 80, r: 40, b: 80 },
        autosize: true,
        responsive: true,
        annotations: [
            {
                x: dates[maxIdx],
                y: maxPrice,
                text: `最高價: ${maxPrice}元`,
                showarrow: true,
                arrowhead: 2,
                arrowcolor: '#BA1A1A',
                font: { color: '#BA1A1A', size: 14 },
                bgcolor: '#FFDAD6',
                bordercolor: '#BA1A1A',
                borderwidth: 1
            },
            {
                x: dates[minIdx],
                y: minPrice,
                text: `最低價: ${minPrice}元`,
                showarrow: true,
                arrowhead: 2,
                arrowcolor: '#4CAF50',
                font: { color: '#4CAF50', size: 14 },
                bgcolor: '#E8F5E8',
                bordercolor: '#4CAF50',
                borderwidth: 1
            }
        ]
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };
    
    Plotly.newPlot(chartArea, [trace], layout, config);
    updateStatistics(data);
    updateDataTable(data);
    
    console.log('價格趨勢圖已更新');
}

// 顯示交易量分布
function showVolumeDistribution() {
    if (!selectedCrop) {
        showError('請先選擇作物');
        return;
    }
    
    const data = getCropData(selectedCrop, selectedMarket);
    if (data.length === 0) {
        showError('沒有找到相關資料');
        return;
    }
    
    // 按市場分組統計交易量
    const marketVolumes = {};
    data.forEach(item => {
        const market = item.市場名稱;
        if (!marketVolumes[market]) {
            marketVolumes[market] = 0;
        }
        marketVolumes[market] += Number(item.交易量) || 0;
    });
    
    const markets = Object.keys(marketVolumes);
    const volumes = Object.values(marketVolumes);
    
    const trace = {
        x: markets,
        y: volumes,
        type: 'bar',
        name: '交易量',
        marker: { 
            color: '#625B71',
            line: { color: '#1D192B', width: 1 }
        }
    };
    
    const layout = {
        title: {
            text: `${selectedCrop} 各市場交易量分布`,
            font: { size: 24, color: '#1C1B1F', family: 'Roboto' },
            x: 0.05
        },
        xaxis: { 
            title: { 
                text: '市場名稱',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 12, color: '#49454F' },
            tickangle: -45
        },
        yaxis: { 
            title: { 
                text: '交易量 (公斤)',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' }
        },
        plot_bgcolor: '#FEF7FF',
        paper_bgcolor: '#FEF7FF',
        margin: { t: 80, l: 80, r: 40, b: 100 },
        autosize: true,
        responsive: true
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };
    
    Plotly.newPlot(chartArea, [trace], layout, config);
    updateStatistics(data);
    updateDataTable(data);
    
    console.log('交易量分布圖已更新');
}

// 顯示價格分布
function showPriceDistribution() {
    if (!selectedCrop) {
        showError('請先選擇作物');
        return;
    }
    
    const data = getCropData(selectedCrop, selectedMarket);
    if (data.length === 0) {
        showError('沒有找到相關資料');
        return;
    }
    
    const prices = data.map(item => Number(item.平均價)).filter(price => !isNaN(price));
    
    const trace = {
        x: prices,
        type: 'histogram',
        name: '價格分布',
        marker: { 
            color: '#7D5260',
            line: { color: '#31111D', width: 1 }
        },
        opacity: 0.8
    };
    
    const layout = {
        title: {
            text: `${selectedCrop} 價格分布分析`,
            font: { size: 24, color: '#1C1B1F', family: 'Roboto' },
            x: 0.05
        },
        xaxis: { 
            title: { 
                text: '價格 (元/公斤)',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' }
        },
        yaxis: { 
            title: { 
                text: '頻次',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' }
        },
        plot_bgcolor: '#FEF7FF',
        paper_bgcolor: '#FEF7FF',
        margin: { t: 80, l: 80, r: 40, b: 80 },
        autosize: true,
        responsive: true
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };
    
    Plotly.newPlot(chartArea, [trace], layout, config);
    updateStatistics(data);
    updateDataTable(data);
    
    console.log('價格分布圖已更新');
}

// 顯示季節性分析
function showSeasonalAnalysis() {
    if (!selectedCrop) {
        showError('請先選擇作物');
        return;
    }
    
    const data = getCropData(selectedCrop, selectedMarket);
    if (data.length === 0) {
        showError('沒有找到相關資料');
        return;
    }
    
    // 按月份統計平均價格
    const monthlyData = {};
    for (let i = 1; i <= 12; i++) {
        monthlyData[i] = [];
    }
    
    data.forEach(item => {
        const date = new Date(item.交易日期);
        const month = date.getMonth() + 1;
        const price = Number(item.平均價);
        if (!isNaN(price)) {
            monthlyData[month].push(price);
        }
    });
    
    const months = [];
    const avgPrices = [];
    
    for (let i = 1; i <= 12; i++) {
        months.push(`${i}月`);
        const prices = monthlyData[i];
        if (prices.length > 0) {
            const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            avgPrices.push(avg);
        } else {
            avgPrices.push(null);
        }
    }
    
    const trace = {
        x: months,
        y: avgPrices,
        type: 'scatter',
        mode: 'lines+markers',
        name: '月均價',
        line: { 
            color: '#6750A4', 
            width: 4,
            shape: 'spline'
        },
        marker: { 
            size: 12, 
            color: '#6750A4',
            line: { color: '#FFFFFF', width: 2 }
        },
        fill: 'tonexty',
        fillcolor: 'rgba(103, 80, 164, 0.2)'
    };
    
    const layout = {
        title: {
            text: `${selectedCrop} 季節性價格分析`,
            font: { size: 24, color: '#1C1B1F', family: 'Roboto' },
            x: 0.05
        },
        xaxis: { 
            title: { 
                text: '月份',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' }
        },
        yaxis: { 
            title: { 
                text: '平均價格 (元/公斤)',
                font: { size: 16, color: '#49454F' }
            },
            tickfont: { size: 14, color: '#49454F' }
        },
        plot_bgcolor: '#FEF7FF',
        paper_bgcolor: '#FEF7FF',
        margin: { t: 80, l: 80, r: 40, b: 80 },
        autosize: true,
        responsive: true
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };
    
    Plotly.newPlot(chartArea, [trace], layout, config);
    updateStatistics(data);
    updateDataTable(data);
    
    console.log('季節性分析圖已更新');
}

// 顯示價格預測
function showPricePrediction() {
    if (!selectedCrop) {
        showError('請先選擇作物');
        return;
    }
    
    const data = getCropData(selectedCrop, selectedMarket);
    if (data.length === 0) {
        showError('沒有找到相關資料');
        return;
    }
    
    // 按日期排序
    data.sort((a, b) => new Date(a.交易日期) - new Date(b.交易日期));
    const prices = data.map(item => Number(item.平均價)).filter(price => !isNaN(price));
    
    if (prices.length < 7) {
        showError('資料不足，無法進行預測分析');
        return;
    }
    
    // 簡單移動平均預測
    const last7Days = prices.slice(-7);
    const movingAverage = last7Days.reduce((sum, price) => sum + price, 0) / last7Days.length;
    
    // 計算價格趨勢
    const recentPrices = prices.slice(-14);
    const firstHalf = recentPrices.slice(0, 7);
    const secondHalf = recentPrices.slice(7);
    
    const firstAvg = firstHalf.reduce((sum, price) => sum + price, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, price) => sum + price, 0) / secondHalf.length;
    const trend = secondAvg - firstAvg;
    
    // 生成未來7天的預測
    const today = new Date();
    const futureDates = [];
    const predictedPrices = [];
    
    for (let i = 1; i <= 7; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        futureDates.push(futureDate.toLocaleDateString('zh-TW'));
        
        // 簡單預測：移動平均 + 趨勢調整
        const predicted = movingAverage + (trend * i * 0.3);
        predictedPrices.push(Math.max(0, predicted));
    }
    
    // 顯示預測結果
    resultArea.style.display = 'block';
    const resultContent = resultArea.querySelector('.result-content');
    
    resultContent.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h4 style="color: var(--md-sys-color-primary); margin-bottom: 16px; font-size: 18px;">預測方法說明</h4>
            <p style="color: var(--md-sys-color-on-surface-variant); line-height: 1.6; margin-bottom: 12px;">
                基於最近7天的移動平均價格，結合14天的價格趨勢進行預測。
            </p>
            <div style="display: flex; gap: 24px; margin-bottom: 16px;">
                <div>
                    <span style="color: var(--md-sys-color-on-surface-variant);">7天移動平均：</span>
                    <strong style="color: var(--md-sys-color-primary);">${movingAverage.toFixed(2)} 元/公斤</strong>
                </div>
                <div>
                    <span style="color: var(--md-sys-color-on-surface-variant);">價格趨勢：</span>
                    <strong style="color: ${trend >= 0 ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'};">
                        ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} 元/公斤
                    </strong>
                </div>
            </div>
        </div>
        
        <div>
            <h4 style="color: var(--md-sys-color-primary); margin-bottom: 16px; font-size: 18px;">未來7天預測價格</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: var(--md-sys-color-surface); border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: var(--md-sys-color-surface-container-high);">
                            <th style="padding: 12px; text-align: left; color: var(--md-sys-color-on-surface); font-weight: 500;">日期</th>
                            <th style="padding: 12px; text-align: right; color: var(--md-sys-color-on-surface); font-weight: 500;">預測價格 (元/公斤)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${futureDates.map((date, index) => `
                            <tr style="border-top: 1px solid var(--md-sys-color-outline-variant);">
                                <td style="padding: 12px; color: var(--md-sys-color-on-surface);">${date}</td>
                                <td style="padding: 12px; text-align: right; color: var(--md-sys-color-on-surface); font-weight: 500;">
                                    ${predictedPrices[index].toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div style="margin-top: 16px; padding: 12px; background: var(--md-sys-color-warning-container); border-radius: 8px;">
            <p style="color: var(--md-sys-color-on-warning-container); font-size: 14px; margin: 0;">
                ⚠️ 此預測僅供參考，實際價格可能受天氣、政策、市場需求等多種因素影響。
            </p>
        </div>
    `;
    
    updateStatistics(data);
    updateDataTable(data);
    
    console.log('價格預測已完成');
}

// 更新統計資料
function updateStatistics(data) {
    if (!data || data.length === 0) {
        avgPriceElement.textContent = '--';
        minPriceElement.textContent = '--';
        maxPriceElement.textContent = '--';
        totalVolumeElement.textContent = '--';
        return;
    }
    
    const prices = data.map(item => Number(item.平均價)).filter(price => !isNaN(price));
    const volumes = data.map(item => Number(item.交易量)).filter(volume => !isNaN(volume));
    
    if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        avgPriceElement.textContent = avgPrice.toFixed(2);
        minPriceElement.textContent = minPrice.toFixed(2);
        maxPriceElement.textContent = maxPrice.toFixed(2);
    }
    
    if (volumes.length > 0) {
        const totalVolume = volumes.reduce((sum, volume) => sum + volume, 0);
        totalVolumeElement.textContent = totalVolume.toLocaleString();
    }
    
    console.log('統計資料已更新');
}

// 更新資料表格
function updateDataTable(data) {
    if (!data || data.length === 0) {
        dataTableBody.innerHTML = '<tr class="empty-row"><td colspan="4">沒有相關資料</td></tr>';
        return;
    }
    
    // 按日期降序排序
    data.sort((a, b) => new Date(b.交易日期) - new Date(a.交易日期));
    
    // 限制顯示最近50筆資料
    const displayData = data.slice(0, 50);
    
    dataTableBody.innerHTML = displayData.map(item => `
        <tr>
            <td>${item.交易日期}</td>
            <td>${item.市場名稱}</td>
            <td>${Number(item.平均價).toFixed(2)}</td>
            <td>${Number(item.交易量).toLocaleString()}</td>
        </tr>
    `).join('');
    
    console.log(`資料表格已更新，顯示 ${displayData.length} 筆資料`);
}

// 匯出資料
function exportData(format) {
    if (!selectedCrop) {
        showError('請先選擇作物');
        return;
    }
    
    const data = getCropData(selectedCrop, selectedMarket);
    if (data.length === 0) {
        showError('沒有資料可以匯出');
        return;
    }
    
    let content = '';
    let filename = `${selectedCrop}_${selectedMarket || '所有市場'}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
        content = convertToCSV(data);
        filename += '.csv';
    } else if (format === 'excel') {
        // 簡化版本，實際上還是 CSV 格式
        content = convertToCSV(data);
        filename += '.csv';
    }
    
    // 建立下載連結
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`資料已匯出：${filename}`);
}

// 轉換為 CSV 格式
function convertToCSV(data) {
    const headers = ['交易日期', '市場名稱', '作物名稱', '平均價', '交易量'];
    const rows = data.map(item => [
        item.交易日期,
        item.市場名稱,
        item.作物名稱,
        item.平均價,
        item.交易量
    ]);
    
    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

// 顯示載入狀態
function showLoading(show) {
    if (show) {
        loadingIndicator.style.display = 'flex';
        chartArea.querySelector('.empty-state').style.display = 'none';
    } else {
        loadingIndicator.style.display = 'none';
        if (!chartArea.querySelector('.plotly-graph-div')) {
            chartArea.querySelector('.empty-state').style.display = 'flex';
        }
    }
}

// 顯示錯誤訊息
function showError(message) {
    console.error(message);
    
    // 簡單的錯誤顯示，可以用更好的 UI 組件
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-size: 14px;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 更新最後更新時間
function updateLastUpdateTime() {
    const now = new Date();
    dataUpdateTime.textContent = now.toLocaleString('zh-TW');
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 搜尋功能
    searchInput.addEventListener('input', filterCrops);
    
    // 市場選擇
    marketSelect.addEventListener('change', (e) => {
        selectedMarket = e.target.value;
        updateCropList();
        console.log(`選擇市場：${selectedMarket || '所有市場'}`);
    });
    
    // 作物選擇
    cropSelect.addEventListener('change', (e) => {
        selectedCrop = e.target.value;
        if (selectedCrop) {
            console.log(`選擇作物：${selectedCrop}`);
            showPriceTrend(); // 預設顯示價格趨勢
        } else {
            // 清空顯示
            chartArea.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">show_chart</span>
                    <h3>開始分析</h3>
                    <p>請選擇作物以查看分析結果</p>
                </div>
            `;
            resultArea.style.display = 'none';
            updateStatistics([]);
            updateDataTable([]);
        }
    });
    
    // 分析按鈕
    showPriceTrendBtn.addEventListener('click', showPriceTrend);
    showVolumeDistBtn.addEventListener('click', showVolumeDistribution);
    showPriceDistBtn.addEventListener('click', showPriceDistribution);
    showSeasonalBtn.addEventListener('click', showSeasonalAnalysis);
    showPricePredictionBtn.addEventListener('click', showPricePrediction);
    
    // 匯出按鈕
    exportExcelBtn.addEventListener('click', () => exportData('excel'));
    exportCSVBtn.addEventListener('click', () => exportData('csv'));
    
    // 重新整理按鈕
    refreshFab.addEventListener('click', () => {
        initializeApp();
    });
    
    // 統計卡片點擊事件
    document.getElementById('avgPriceCard').addEventListener('click', showPriceTrend);
    document.getElementById('minPriceCard').addEventListener('click', () => {
        if (selectedCrop) {
            const data = getCropData(selectedCrop, selectedMarket);
            const prices = data.map(item => Number(item.平均價));
            const minPrice = Math.min(...prices);
            const minItem = data.find(item => Number(item.平均價) === minPrice);
            
            if (minItem) {
                showError(`最低價格：${minPrice}元/公斤\n日期：${minItem.交易日期}\n市場：${minItem.市場名稱}`);
            }
        }
    });
    document.getElementById('maxPriceCard').addEventListener('click', () => {
        if (selectedCrop) {
            const data = getCropData(selectedCrop, selectedMarket);
            const prices = data.map(item => Number(item.平均價));
            const maxPrice = Math.max(...prices);
            const maxItem = data.find(item => Number(item.平均價) === maxPrice);
            
            if (maxItem) {
                showError(`最高價格：${maxPrice}元/公斤\n日期：${maxItem.交易日期}\n市場：${maxItem.市場名稱}`);
            }
        }
    });
    document.getElementById('totalVolumeCard').addEventListener('click', showVolumeDistribution);
    
    // 關閉通知按鈕
    closeNotificationBtn.addEventListener('click', closeNotification);
    
    // 點擊背景關閉通知
    notificationModal.addEventListener('click', (e) => {
        if (e.target === notificationModal) {
            closeNotification();
        }
    });
    
    // 初始化應用程式
    initializeApp();
});

console.log('農產品交易分析系統已載入完成');
