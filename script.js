// 全局变量
let watchID = null;
let currentSpeed = 0;
let isNavigating = false;
let favorites = [];

// 驾驶统计数据
let drivingStats = {
    totalDistance: 0,
    avgSpeed: 0,
    drivingTime: 0,
    maxSpeed: 0,
    startTime: null,
    lastPosition: null
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    
    // 尝试获取位置
    getCurrentLocation();
    
    // 绑定按钮事件
    document.querySelector('.start-btn').addEventListener('click', toggleNavigation);
    document.querySelector('.settings-btn').addEventListener('click', openSettings);
    
    // 初始化收藏地点
    initFavorites();
    
    // 初始化主题
    initTheme();
});

// 更新时间
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    document.querySelector('.time').textContent = timeStr;
}

// 获取当前位置
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('您的浏览器不支持地理定位');
        return;
    }

    // 单次定位
    navigator.geolocation.getCurrentPosition(
        position => updateLocation(position),
        error => handleLocationError(error)
    );
}

// 开始位置监听
function startWatchingLocation() {
    if (!navigator.geolocation) return;

    watchID = navigator.geolocation.watchPosition(
        position => {
            updateLocation(position);
            calculateSpeed(position);
        },
        error => handleLocationError(error),
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
}

// 停止位置监听
function stopWatchingLocation() {
    if (watchID) {
        navigator.geolocation.clearWatch(watchID);
        watchID = null;
    }
}

// 更新位置信息
function updateLocation(position) {
    const { latitude, longitude } = position.coords;
    const locationText = `当前位置: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
    document.querySelector('.location-text').textContent = locationText;
    document.querySelector('.lat').textContent = `纬度: ${latitude.toFixed(6)}`;
    document.querySelector('.lon').textContent = `经度: ${longitude.toFixed(6)}`;
}

// 处理定位错误
function handleLocationError(error) {
    const errorMessages = {
        1: '用户拒绝了地理定位请求',
        2: '无法获取位置信息',
        3: '定位请求超时'
    };
    showError(errorMessages[error.code] || '定位失败');
}

// 计算车速
function calculateSpeed(position) {
    const speed = position.coords.speed || 0;
    currentSpeed = Math.round(speed * 3.6); // 转换为 km/h
    updateSpeedDisplay();
    
    // 更新驾驶统计
    updateDrivingStats(position);
}

// 更新驾驶统计
function updateDrivingStats(position) {
    if (!drivingStats.startTime) return;
    
    // 计算距离
    if (drivingStats.lastPosition) {
        const distance = getDistanceFromLatLonInKm(
            drivingStats.lastPosition.lat,
            drivingStats.lastPosition.lon,
            position.coords.latitude,
            position.coords.longitude
        );
        drivingStats.totalDistance += distance;
    }
    
    drivingStats.lastPosition = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };
    
    // 计算驾驶时间
    const currentTime = new Date();
    drivingStats.drivingTime = (currentTime - drivingStats.startTime) / 3600000; // 转换为小时
    
    // 更新平均车速
    if (drivingStats.drivingTime > 0) {
        drivingStats.avgSpeed = drivingStats.totalDistance / drivingStats.drivingTime;
    }
    
    // 更新最大车速
    if (currentSpeed > drivingStats.maxSpeed) {
        drivingStats.maxSpeed = currentSpeed;
    }
    
    // 更新UI
    updateStatsUI();
}

// 计算两点之间的距离 (km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // 距离 (km)
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// 更新统计UI
function updateStatsUI() {
    document.getElementById('totalDistance').textContent = drivingStats.totalDistance.toFixed(1);
    document.getElementById('avgSpeed').textContent = Math.round(drivingStats.avgSpeed);
    document.getElementById('drivingTime').textContent = drivingStats.drivingTime.toFixed(1);
}

// 更新车速显示
function updateSpeedDisplay() {
    const speedElement = document.querySelector('.speed-value');
    speedElement.textContent = currentSpeed;
    
    // 根据车速改变颜色
    if (currentSpeed > 60) {
        speedElement.style.color = '#ff6b6b';
    } else if (currentSpeed > 30) {
        speedElement.style.color = '#ffd93d';
    } else {
        speedElement.style.color = '#6bcf7f';
    }
}

// 切换导航状态
function toggleNavigation() {
    const btn = document.querySelector('.start-btn');
    
    if (isNavigating) {
        stopNavigation();
        btn.textContent = '开始导航';
        btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
        startNavigation();
        btn.textContent = '停止导航';
        btn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
    }
    
    isNavigating = !isNavigating;
}

// 开始导航
function startNavigation() {
    startWatchingLocation();
    updateTrafficInfo();
    
    // 初始化驾驶统计
    drivingStats.startTime = new Date();
    drivingStats.lastPosition = null;
    
    showMessage('导航已开始');
}

// 停止导航
function stopNavigation() {
    stopWatchingLocation();
    currentSpeed = 0;
    updateSpeedDisplay();
    showMessage('导航已停止');
}

// 更新交通信息
function updateTrafficInfo() {
    // 模拟交通信息更新
    const trafficItems = document.querySelectorAll('.traffic-item');
    const statuses = ['畅通', '缓行', '拥堵'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    trafficItems[0].querySelector('.traffic-text').textContent = `前方路况: ${randomStatus}`;
    
    // 模拟预计到达时间
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + Math.random() * 3600000); // 0-1小时后
    trafficItems[1].querySelector('.traffic-text').textContent = `预计到达: ${arrivalTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
}

// 打开设置
function openSettings() {
    showMessage('设置功能开发中...');
}

// 显示消息
function showMessage(message) {
    // 创建临时消息提示
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        document.body.removeChild(msg);
    }, 2000);
}

// 显示错误
function showError(error) {
    showMessage(`错误: ${error}`);
}

// 收藏地点功能
function initFavorites() {
    // 从本地存储加载收藏地点
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    } else {
        // 默认收藏地点
        favorites = [
            { name: '家', lat: 39.9042, lon: 116.4074, icon: '🏠' },
            { name: '公司', lat: 31.2304, lon: 121.4737, icon: '🏢' }
        ];
        saveFavorites();
    }
    
    // 绑定添加收藏按钮事件
    document.getElementById('addFavoriteBtn').addEventListener('click', addFavorite);
    
    // 渲染收藏地点
    renderFavorites();
}

function renderFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    favoritesList.innerHTML = '';
    
    favorites.forEach((favorite, index) => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.dataset.lat = favorite.lat;
        item.dataset.lon = favorite.lon;
        item.innerHTML = `
            <span class="favorite-icon">${favorite.icon}</span>
            <span class="favorite-name">${favorite.name}</span>
            <button class="navigate-btn" onclick="navigateToFavorite(${index})">导航</button>
        `;
        favoritesList.appendChild(item);
    });
}

function navigateToFavorite(index) {
    const favorite = favorites[index];
    showMessage(`开始导航到: ${favorite.name}`);
    // 这里可以添加导航逻辑
}

function addFavorite() {
    const name = prompt('请输入地点名称:');
    if (!name) return;
    
    // 使用当前位置作为默认坐标
    navigator.geolocation.getCurrentPosition(
        position => {
            const newFavorite = {
                name: name,
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                icon: '📍'
            };
            
            favorites.push(newFavorite);
            saveFavorites();
            renderFavorites();
            showMessage(`已添加收藏地点: ${name}`);
        },
        error => {
            // 如果无法获取位置，使用默认坐标
            const newFavorite = {
                name: name,
                lat: 39.9042,
                lon: 116.4074,
                icon: '📍'
            };
            
            favorites.push(newFavorite);
            saveFavorites();
            renderFavorites();
            showMessage(`已添加收藏地点: ${name}`);
        }
    );
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 主题切换功能
function initTheme() {
    // 从本地存储加载主题
    const savedTheme = localStorage.getItem('theme') || 'default';
    setTheme(savedTheme);
    
    // 绑定主题按钮事件
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    // 移除所有主题类
    document.body.className = '';
    
    // 添加当前主题类
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    
    // 更新按钮状态
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    
    // 保存到本地存储
    localStorage.setItem('theme', theme);
    
    showMessage(`已切换到${theme}主题`);
}

// 页面隐藏时停止定位
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isNavigating) {
        stopWatchingLocation();
    } else if (!document.hidden && isNavigating) {
        startWatchingLocation();
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    stopWatchingLocation();
});