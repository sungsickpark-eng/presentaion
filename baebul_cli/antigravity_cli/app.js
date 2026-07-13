// Weather codes mapping based on WMO standards
const weatherDescriptions = {
    0: { text: "맑음", icon: "sun", theme: "sunny" },
    1: { text: "대체로 맑음", icon: "cloud-sun", theme: "sunny" },
    2: { text: "구름 조금", icon: "cloud", theme: "sunny" },
    3: { text: "흐림", icon: "cloudy", theme: "rain" },
    45: { text: "안개", icon: "cloud-fog", theme: "wind" },
    48: { text: "착빙성 안개", icon: "cloud-fog", theme: "wind" },
    51: { text: "가벼운 이슬비", icon: "cloud-drizzle", theme: "rain" },
    53: { text: "이슬비", icon: "cloud-drizzle", theme: "rain" },
    55: { text: "강한 이슬비", icon: "cloud-drizzle", theme: "rain" },
    61: { text: "약한 비", icon: "cloud-rain", theme: "rain" },
    63: { text: "비", icon: "cloud-rain", theme: "rain" },
    65: { text: "강한 비", icon: "cloud-showers-gale", theme: "rain" },
    71: { text: "약한 눈", icon: "snowflake", theme: "snow" },
    73: { text: "눈", icon: "snowflake", theme: "snow" },
    75: { text: "강한 눈", icon: "snowflake", theme: "snow" },
    77: { text: "싸락눈", icon: "snowflake", theme: "snow" },
    80: { text: "소나기", icon: "cloud-rain", theme: "rain" },
    81: { text: "강한 소나기", icon: "cloud-showers", theme: "rain" },
    82: { text: "격렬한 소나기", icon: "cloud-lightning", theme: "rain" },
    85: { text: "약한 소나기성 눈", icon: "cloud-snow", theme: "snow" },
    86: { text: "강한 소나기성 눈", icon: "cloud-snow", theme: "snow" },
    95: { text: "뇌우", icon: "cloud-lightning", theme: "rain" },
    96: { text: "우박을 동반한 뇌우", icon: "cloud-lightning", theme: "rain" },
    99: { text: "강한 우박을 동반한 뇌우", icon: "cloud-lightning", theme: "rain" }
};

// Emergency guidelines content map
const emergencyGuidelines = {
    rain: {
        title: "호우 경보 대피 요령",
        items: [
            "침수 위험이 있는 지하공간(지하상가, 반지하 등)에서 즉시 대피하세요.",
            "하천 주변이나 산사태 위험 지역 근처에 접근하지 마세요.",
            "실내에서는 문과 창문을 닫고 기상 상황을 계속 확인하세요.",
            "가로등, 신호등, 고압전선 근처는 감전 위험이 있으니 피하세요."
        ]
    },
    heatwave: {
        title: "폭염 경보 대피 요령",
        items: [
            "가장 무더운 시간대(14:00~17:00)에는 야외 활동을 중단하고 휴식하세요.",
            "충분한 양의 물을 규칙적으로 섭취하고 염분을 보충하세요.",
            "외출 시에는 햇볕을 차단하는 모자나 양산, 자외선 차단제를 사용하세요.",
            "냉방 기기 사용 시 실내외 온도차를 5도 이하로 유지하여 냉방병을 예방하세요."
        ]
    },
    snow: {
        title: "대설 경보 행동 요령",
        items: [
            "자가용 이용을 자제하고 대중교통(지하철, 버스)을 적극 이용하세요.",
            "내 집 앞, 내 점포 앞 눈은 수시로 쓸어 빙판길 사고를 예방하세요.",
            "외출 시 미끄러짐 방지를 위해 운동화나 등산화를 착용하세요.",
            "비닐하우스 등 약한 가설물은 붕괴 사고에 대비해 수시로 눈을 치우세요."
        ]
    },
    wind: {
        title: "강풍 경보 행동 요령",
        items: [
            "창문은 쇠창살 등으로 견고하게 고정하고 테이프로 틈새를 메워주세요.",
            "노후 간판, 현수막 등 날아갈 위험이 있는 물건은 미리 고정하거나 제거하세요.",
            "낙하물의 위험이 있으므로 공사장 주변 및 고층 건물 아래 통행을 자제하세요.",
            "어린이와 노약자는 외출을 삼가고 실내에 머무르세요."
        ]
    },
    dust: {
        title: "황사/미세먼지 경보 요령",
        items: [
            "창문을 닫아 외부 미세먼지가 집안으로 들어오지 않도록 차단하세요.",
            "부득이하게 외출할 때는 반드시 보건용 마스크(KF94, KF80)를 착용하세요.",
            "외출 후 돌아오면 얼굴, 손발을 깨끗이 씻고 양치를 하세요.",
            "노다지 활동 후 눈이나 목이 아프면 즉시 충분한 물을 섭취하세요."
        ]
    }
};

// Application State
let currentCity = { name: "서울특별시", lat: 37.5665, lon: 126.9780 };
let weatherData = null;
let simulationMode = false;
let simulatedType = "clear";
let audioContext = null;

// Initialize Lucide Icons
function updateIcons() {
    lucide.createIcons();
}

// Format date in Korean format
function getFormattedDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date().toLocaleDateString('ko-KR', options);
}

// Synthesize alarm sound using Web Audio API
function playAlarmSound(type) {
    if (!document.getElementById("sound-toggle").checked) return;
    
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const now = audioContext.currentTime;
        
        if (type === 'danger') {
            // High-pitched warning alarm (double beep)
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(880, now);
            osc1.frequency.exponentialRampToValueAtTime(440, now + 0.15);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(885, now);
            
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
            
            // Second beep
            setTimeout(() => {
                const now2 = audioContext.currentTime;
                const osc3 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc3.type = 'sawtooth';
                osc3.frequency.setValueAtTime(880, now2);
                osc3.frequency.exponentialRampToValueAtTime(440, now2 + 0.15);
                gain2.gain.setValueAtTime(0.15, now2);
                gain2.gain.exponentialRampToValueAtTime(0.01, now2 + 0.3);
                osc3.connect(gain2);
                gain2.connect(audioContext.destination);
                osc3.start(now2);
                osc3.stop(now2 + 0.3);
            }, 350);
            
        } else if (type === 'warning') {
            // Softer warning alert
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now); // D5 note
            osc.frequency.linearRampToValueAtTime(659.25, now + 0.25); // E5 note
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        console.error("Audio playback error:", e);
    }
}

// TTS Text-To-Speech alert reading
function speakAlert(text) {
    if (!document.getElementById("tts-toggle").checked) return;
    
    if ('speechSynthesis' in window) {
        // Cancel ongoing speakings
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }
}

// Update the alert UI panel based on severity and text
function updateAlertUI(status, title, desc, guidelineType = null) {
    const alertBanner = document.getElementById("alert-banner");
    const alertTitle = document.getElementById("alert-title");
    const alertDesc = document.getElementById("alert-desc");
    const alertActionBtn = document.getElementById("alert-action-btn");
    const guidelineCard = document.getElementById("guidelines-card");
    
    // Reset classes
    alertBanner.className = "alert-banner";
    
    // Set icons and classes
    let iconName = "check-circle-2";
    if (status === "safe") {
        alertBanner.classList.add("status-safe");
        iconName = "check-circle-2";
        alertActionBtn.classList.add("hidden");
        guidelineCard.classList.add("hidden");
        guidelineCard.classList.remove("warning-active");
    } else if (status === "warning") {
        alertBanner.classList.add("status-warn");
        iconName = "alert-circle";
        alertActionBtn.classList.remove("hidden");
        playAlarmSound('warning');
    } else if (status === "danger") {
        alertBanner.classList.add("status-danger");
        iconName = "alert-triangle";
        alertActionBtn.classList.remove("hidden");
        playAlarmSound('danger');
    }
    
    alertTitle.innerText = title;
    alertDesc.innerText = desc;
    
    // Replace content icon
    const alertIconContainer = alertBanner.querySelector(".alert-content i");
    if (alertIconContainer) {
        alertIconContainer.setAttribute("data-lucide", iconName);
    }
    
    // Load Guidelines if warning/danger is active
    if (guidelineType && emergencyGuidelines[guidelineType]) {
        const guide = emergencyGuidelines[guidelineType];
        document.getElementById("guideline-title").innerText = guide.title;
        
        const contentDiv = document.getElementById("guideline-content");
        contentDiv.innerHTML = guide.items.map(item => `
            <div class="guideline-item">
                <p>${item}</p>
            </div>
        `).join('');
        
        // Show panel
        guidelineCard.classList.remove("hidden");
        if (status === "danger") {
            guidelineCard.classList.add("warning-active");
        } else {
            guidelineCard.classList.remove("warning-active");
        }
        
        // Handle Action Button click to scroll to guidelines
        alertActionBtn.onclick = () => {
            guidelineCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        
        // Speak alert out loud
        speakAlert(`${title}. ${desc}`);
    } else {
        guidelineCard.classList.add("hidden");
    }
    
    updateIcons();
}

// Interpret real-time data to determine if weather conditions cross safety thresholds
function evaluateRealWeatherAlerts(temp, precipitation, windSpeed, code) {
    if (simulationMode) return; // Ignore real evaluations if simulating
    
    // 1. Heatwave (폭염)
    if (temp >= 33.0) {
        updateAlertUI("danger", "[⚠️ 폭염 경보] 폭염 재난 상황 발생", `현재 기온이 ${temp.toFixed(1)}°C로 매우 높습니다. 한낮 야외 활동을 삼가고 충분한 수분을 섭취하세요.`, "heatwave");
        document.body.className = "theme-heatwave";
        return;
    } else if (temp >= 31.0) {
        updateAlertUI("warning", "[⚠️ 폭염 주의보] 고온 기상 상황 발생", `현재 기온이 ${temp.toFixed(1)}°C입니다. 무더위 쉼터 등을 이용해 온열 질환을 예방하세요.`, "heatwave");
        document.body.className = "theme-heatwave";
        return;
    }
    
    // 2. Heavy Rain (호우)
    if (precipitation >= 10.0 || [65, 82, 95, 96, 99].includes(code)) {
        updateAlertUI("danger", "[⚠️ 호우 경보] 집중 호우 발생", `시간당 대량의 강수(${precipitation.toFixed(1)} mm)가 내리고 있습니다. 저지대 침수와 침수 우려 지역 통행에 각별히 유의하세요.`, "rain");
        document.body.className = "theme-rain";
        return;
    } else if (precipitation >= 3.0 || [63, 80, 81].includes(code)) {
        updateAlertUI("warning", "[⚠️ 호우 주의보] 강우 발생", `지속적인 비(${precipitation.toFixed(1)} mm)가 내리고 있습니다. 빗길 안전사고 및 차량 감속 운행을 지켜주세요.`, "rain");
        document.body.className = "theme-rain";
        return;
    }
    
    // 3. Heavy Snow (대설)
    if ([73, 75, 77, 86].includes(code)) {
        updateAlertUI("danger", "[⚠️ 대설 경보] 폭설 상황 발생", "큰 눈이 쏟아져 쌓이고 있습니다. 차량 운행 시 월동 장구를 필히 장착하시고 빙판길 보행에 유의하세요.", "snow");
        document.body.className = "theme-snow";
        return;
    } else if ([71, 85].includes(code)) {
        updateAlertUI("warning", "[⚠️ 대설 주의보] 강설 발생", "눈이 내리고 있습니다. 내 집 앞 눈 치우기에 동참해 주시고 안전거리 유지 운행해 주시기 바랍니다.", "snow");
        document.body.className = "theme-snow";
        return;
    }
    
    // 4. Strong Wind (강풍)
    if (windSpeed >= 14.0) {
        updateAlertUI("danger", "[⚠️ 강풍 경보] 돌풍성 강풍 발생", `현재 풍속이 ${windSpeed.toFixed(1)} m/s로 매우 강합니다. 건물 간판, 낙하위험 요소를 점검하고 통행을 조심하세요.`, "wind");
        document.body.className = "theme-wind";
        return;
    } else if (windSpeed >= 8.0) {
        updateAlertUI("warning", "[⚠️ 강풍 주의보] 강한 바람 주의", `현재 풍속은 ${windSpeed.toFixed(1)} m/s입니다. 실외 설치 물품을 고정하고 낙하 사고에 유의하세요.`, "wind");
        document.body.className = "theme-wind";
        return;
    }
    
    // 5. Cold Wave (한파)
    if (temp <= -12.0) {
        updateAlertUI("danger", "[⚠️ 한파 경보] 극한 한파 발생", `기온이 ${temp.toFixed(1)}°C로 매우 낮습니다. 노출 부위 보온을 철저히 하고 동파 방지에 주의해 주세요.`, "snow");
        document.body.className = "theme-snow";
        return;
    } else if (temp <= -5.0) {
        updateAlertUI("warning", "[⚠️ 한파 주의보] 동절기 한파 주의", `기온이 ${temp.toFixed(1)}°C입니다. 수도 계량기 동파를 대비하여 헌 옷 등으로 단열해주세요.`, "snow");
        document.body.className = "theme-snow";
        return;
    }
    
    // Default: Safe status
    updateAlertUI("safe", "현재 기상 특보가 없습니다", "오늘도 안전하고 건강한 하루 되세요.");
    
    // Dynamic background matching current weather
    const theme = (weatherDescriptions[code] || { theme: "sunny" }).theme;
    document.body.className = `theme-${theme}`;
}

// Fetch weather information from Open-Meteo
async function fetchWeather(lat, lon, cityName) {
    try {
        currentCity = { name: cityName, lat: lat, lon: lon };
        document.getElementById("location-name").innerText = cityName;
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("날씨 정보를 가져오는 도중 문제가 발생했습니다.");
        
        weatherData = await response.json();
        
        if (!simulationMode) {
            displayCurrentWeather(weatherData);
            displayForecast(weatherData);
        }
        
    } catch (error) {
        console.error("Fetch weather error:", error);
        alert(error.message);
    }
}

// Show current weather data on the card
function displayCurrentWeather(data) {
    const cur = data.current;
    const temp = cur.temperature_2m;
    const humidity = cur.relative_humidity_2m;
    const windSpeed = cur.wind_speed_10m;
    const precipitation = cur.precipitation;
    const code = cur.weather_code;
    const feelsLike = cur.apparent_temperature;
    
    const interpretation = weatherDescriptions[code] || { text: "맑음", icon: "sun" };
    
    document.getElementById("current-temp").innerText = temp.toFixed(1);
    document.getElementById("weather-badge").innerText = interpretation.text;
    document.getElementById("feels-like").innerText = `${feelsLike.toFixed(1)}°C`;
    document.getElementById("humidity").innerText = `${humidity}%`;
    document.getElementById("wind-speed").innerText = `${windSpeed.toFixed(1)} m/s`;
    document.getElementById("precipitation").innerText = `${precipitation.toFixed(1)} mm`;
    
    // Set Weather Icon
    const iconContainer = document.getElementById("weather-icon-container");
    iconContainer.innerHTML = `<i data-lucide="${interpretation.icon}" class="main-icon animated-icon"></i>`;
    
    // Evaluate Alerts
    evaluateRealWeatherAlerts(temp, precipitation, windSpeed, code);
    
    updateIcons();
}

// Show Forecast listings (hourly / daily)
function displayForecast(data) {
    // 1. Render hourly forecast (Next 8 slots)
    const hourlyList = document.getElementById("hourly-list");
    hourlyList.innerHTML = "";
    
    const nowHour = new Date().getHours();
    
    for (let i = 0; i < 8; i++) {
        const timeIndex = nowHour + i;
        if (timeIndex >= data.hourly.time.length) break;
        
        const timeStr = data.hourly.time[timeIndex];
        const time = new Date(timeStr);
        const displayTime = i === 0 ? "지금" : `${time.getHours()}시`;
        
        const temp = data.hourly.temperature_2m[timeIndex];
        const code = data.hourly.weather_code[timeIndex];
        const interpretation = weatherDescriptions[code] || { text: "맑음", icon: "sun" };
        
        const item = document.createElement("div");
        item.className = "hourly-item";
        item.innerHTML = `
            <span class="time">${displayTime}</span>
            <i data-lucide="${interpretation.icon}"></i>
            <span class="temp">${temp.toFixed(1)}°</span>
        `;
        hourlyList.appendChild(item);
    }
    
    // 2. Render daily forecast (5 days)
    const dailyList = document.getElementById("daily-list");
    dailyList.innerHTML = "";
    
    const weekdayName = ["일", "월", "화", "수", "목", "금", "토"];
    
    // Find min and max ranges for temperature bars
    const maxTemps = data.daily.temperature_2m_max.slice(0, 5);
    const minTemps = data.daily.temperature_2m_min.slice(0, 5);
    const absMin = Math.min(...minTemps);
    const absMax = Math.max(...maxTemps);
    const totalRange = absMax - absMin || 1;
    
    for (let i = 0; i < 5; i++) {
        const dateStr = data.daily.time[i];
        const date = new Date(dateStr);
        const dayLabel = i === 0 ? "오늘" : `${date.getMonth() + 1}/${date.getDate()}(${weekdayName[date.getDay()]})`;
        
        const code = data.daily.weather_code[i];
        const interpretation = weatherDescriptions[code] || { text: "맑음", icon: "sun" };
        
        const maxT = maxTemps[i];
        const minT = minTemps[i];
        
        // Calculate temp range bar dimensions
        const leftPercent = ((minT - absMin) / totalRange) * 100;
        const widthPercent = ((maxT - minT) / totalRange) * 100;
        
        const item = document.createElement("div");
        item.className = "daily-item";
        item.innerHTML = `
            <span class="day">${dayLabel}</span>
            <i data-lucide="${interpretation.icon}"></i>
            <div class="temp-bar-container">
                <div class="temp-bar">
                    <div class="temp-range-bar" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
                </div>
            </div>
            <div class="temp-range">
                <span class="min-temp">${minT.toFixed(0)}°</span>
                <span class="max-temp">${maxT.toFixed(0)}°</span>
            </div>
        `;
        dailyList.appendChild(item);
    }
    
    updateIcons();
}

// Simulator Trigger Action
function triggerSimulation(type) {
    simulationMode = (type !== "clear");
    simulatedType = type;
    
    // Update active simulator buttons
    document.querySelectorAll(".sim-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-type") === type) {
            btn.classList.add("active");
        }
    });
    
    if (type === "clear") {
        // Return to real weather
        if (weatherData) {
            displayCurrentWeather(weatherData);
            displayForecast(weatherData);
        } else {
            fetchWeather(currentCity.lat, currentCity.lon, currentCity.name);
        }
        return;
    }
    
    // Simulate Custom Weather Conditions
    let temp, badge, icon, humidity, windSpeed, precipitation, feelsLike;
    let alertTitle, alertDesc, alertSeverity;
    
    switch (type) {
        case "rain":
            temp = 18.5;
            badge = "집중 호우";
            icon = "cloud-lightning";
            humidity = 95;
            windSpeed = 6.2;
            precipitation = 34.0;
            feelsLike = 18.2;
            alertSeverity = "danger";
            alertTitle = "[🚨 호우 경보] 집중 호우에 따른 침수 경고";
            alertDesc = "시간당 30mm 이상의 매우 강한 비가 발생했습니다. 반지하 세대, 저지대 주민들께서는 침수 대비 및 대피 장소를 파악하세요.";
            document.body.className = "theme-rain";
            break;
            
        case "heatwave":
            temp = 36.2;
            badge = "폭염";
            icon = "thermometer-sun";
            humidity = 70;
            windSpeed = 1.1;
            precipitation = 0.0;
            feelsLike = 39.5;
            alertSeverity = "danger";
            alertTitle = "[🚨 폭염 경보] 야외 야근 및 활동 전면 중단 권고";
            alertDesc = "체감 온도가 39°C를 돌파하였습니다. 온열 질환 위험이 극도로 매우 높으니 외출을 삼가고 노약자의 안부를 챙기시기 바랍니다.";
            document.body.className = "theme-heatwave";
            break;
            
        case "snow":
            temp = -6.5;
            badge = "폭설";
            icon = "snowflake";
            humidity = 88;
            windSpeed = 5.4;
            precipitation = 8.5;
            feelsLike = -11.5;
            alertSeverity = "danger";
            alertTitle = "[🚨 대설 경보] 도로 결빙 및 교통 통제";
            alertDesc = "현재 영하권 기온 하에 폭설이 지속되고 있어 심한 도로 미끄러짐이 우려됩니다. 자가용 운행을 전면 자제하고 하차 시 보행 안전에 주의하세요.";
            document.body.className = "theme-snow";
            break;
            
        case "wind":
            temp = 12.0;
            badge = "태풍급 강풍";
            icon = "wind";
            humidity = 45;
            windSpeed = 18.5;
            precipitation = 0.0;
            feelsLike = 8.4;
            alertSeverity = "danger";
            alertTitle = "[🚨 강풍 경보] 비산물 안전 유의 및 보행 제한";
            alertDesc = "순간 풍속이 18 m/s를 초과해 낙하물과 비산물 피해가 우려됩니다. 간판 등의 시설물을 점검하고 공사장 인근이나 가로수길 통행을 피하십시오.";
            document.body.className = "theme-wind";
            break;
            
        case "dust":
            temp = 15.0;
            badge = "극심한 황사";
            icon = "alert-triangle";
            humidity = 30;
            windSpeed = 4.0;
            precipitation = 0.0;
            feelsLike = 14.8;
            alertSeverity = "warning";
            alertTitle = "[⚠️ 황사 경보] 황사 및 미세먼지(PM10) 위험";
            alertDesc = "몽골발 강한 황사가 한반도로 전량 도달하여 미세먼지 수치가 '매우 나쁨'을 넘고 있습니다. 외출 시 긴소매 의류와 보건용 마스크를 반드시 착용하세요.";
            document.body.className = "theme-dust";
            break;
    }
    
    // Update main panel interface
    document.getElementById("current-temp").innerText = temp.toFixed(1);
    document.getElementById("weather-badge").innerText = badge;
    document.getElementById("feels-like").innerText = `${feelsLike.toFixed(1)}°C`;
    document.getElementById("humidity").innerText = `${humidity}%`;
    document.getElementById("wind-speed").innerText = `${windSpeed.toFixed(1)} m/s`;
    document.getElementById("precipitation").innerText = `${precipitation.toFixed(1)} mm`;
    
    const iconContainer = document.getElementById("weather-icon-container");
    iconContainer.innerHTML = `<i data-lucide="${icon}" class="main-icon animated-icon"></i>`;
    
    // Render Alert Banner & Guidelines
    updateAlertUI(alertSeverity, alertTitle, alertDesc, type);
    
    // Update hourly forecast based on simulator type
    updateSimulatedHourlyForecast(type);
    
    updateIcons();
}

// Generate dummy hourly list based on simulated type
function updateSimulatedHourlyForecast(type) {
    const hourlyList = document.getElementById("hourly-list");
    hourlyList.innerHTML = "";
    
    let tempSeed, iconName;
    switch (type) {
        case "rain": tempSeed = 18; iconName = "cloud-rain"; break;
        case "heatwave": tempSeed = 36; iconName = "sun"; break;
        case "snow": tempSeed = -6; iconName = "snowflake"; break;
        case "wind": tempSeed = 12; iconName = "wind"; break;
        case "dust": tempSeed = 15; iconName = "cloud"; break;
        default: tempSeed = 20; iconName = "sun";
    }
    
    const nowHour = new Date().getHours();
    for (let i = 0; i < 8; i++) {
        const displayTime = i === 0 ? "지금" : `${(nowHour + i) % 24}시`;
        const temp = tempSeed + (Math.sin(i / 2) * 1.5);
        
        const item = document.createElement("div");
        item.className = "hourly-item";
        item.innerHTML = `
            <span class="time">${displayTime}</span>
            <i data-lucide="${iconName}"></i>
            <span class="temp">${temp.toFixed(1)}°</span>
        `;
        hourlyList.appendChild(item);
    }
}

// Geocode location search
async function searchCity(query) {
    if (!query || query.length < 2) return;
    
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ko&format=json`);
        if (!response.ok) return;
        
        const data = await response.json();
        const resultsDiv = document.getElementById("search-results");
        resultsDiv.innerHTML = "";
        
        if (data.results && data.results.length > 0) {
            resultsDiv.classList.remove("hidden");
            
            data.results.forEach(city => {
                const cityName = city.admin1 ? `${city.name} (${city.admin1})` : city.name;
                const item = document.createElement("div");
                item.className = "search-item";
                item.innerText = `${cityName}, ${city.country}`;
                item.addEventListener("click", () => {
                    resultsDiv.classList.add("hidden");
                    document.getElementById("search-input").value = city.name;
                    
                    // Reset active states on quick selection buttons
                    document.querySelectorAll(".city-btn").forEach(btn => btn.classList.remove("active"));
                    
                    fetchWeather(city.latitude, city.longitude, city.name);
                });
                resultsDiv.appendChild(item);
            });
        } else {
            resultsDiv.classList.add("hidden");
        }
    } catch (e) {
        console.error("Geocoding fetch error:", e);
    }
}

// Event Listeners and initialization
document.addEventListener("DOMContentLoaded", () => {
    // Current date
    document.getElementById("current-date").innerText = getFormattedDate();
    
    // Fetch default city weather (Seoul)
    fetchWeather(currentCity.lat, currentCity.lon, currentCity.name);
    
    // Quick buttons click
    document.querySelectorAll(".city-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".city-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            const lat = parseFloat(e.currentTarget.getAttribute("data-lat"));
            const lon = parseFloat(e.currentTarget.getAttribute("data-lon"));
            const name = e.currentTarget.innerText;
            
            // Switch off simulator
            triggerSimulation("clear");
            
            fetchWeather(lat, lon, name);
        });
    });
    
    // Simulator buttons click
    document.querySelectorAll(".sim-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const type = e.currentTarget.getAttribute("data-type");
            
            // Initialize audio on first user click if needed
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            triggerSimulation(type);
        });
    });
    
    // Geolocation API fetch
    document.getElementById("geo-btn").addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                // Switch off simulator
                triggerSimulation("clear");
                fetchWeather(lat, lon, "내 위치");
                // Remove active classes
                document.querySelectorAll(".city-btn").forEach(b => b.classList.remove("active"));
            }, (error) => {
                alert("위치 정보를 가져올 수 없습니다. 권한 설정을 확인해주세요.");
            });
        } else {
            alert("이 브라우저에서는 GPS 위치 확인을 지원하지 않습니다.");
        }
    });
    
    // Geocode Search input handlers
    const searchInput = document.getElementById("search-input");
    let searchTimeout;
    
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                searchCity(query);
            }, 400);
        } else {
            document.getElementById("search-results").classList.add("hidden");
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
        const resultsDiv = document.getElementById("search-results");
        if (!e.target.closest(".search-container") && resultsDiv) {
            resultsDiv.classList.add("hidden");
        }
    });
    
    // Speech synthesis permission warm up on body click (to bypass browser audio lock)
    document.body.addEventListener("click", () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
});
