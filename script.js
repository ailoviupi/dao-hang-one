// 全局变量
let watchID = null;
let currentSpeed = 0;
let isNavigating = false;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    
    // 尝试获取位置
    getCurrentLocation();
    
    // 绑定按钮事件
    document.querySelector('.start-btn').addEventListener('click', toggleNavigation);
    document.querySelector('.settings-btn').addEventListener('click', openSettings);
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