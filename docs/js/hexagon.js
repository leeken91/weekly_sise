// 육각형 한국 지도 구현
// 각 구/시를 육각형으로 표현하고 증감률을 색상으로 시각화

// 전역 변수
let allTimeSeriesData = null;
let currentSelectedWeek = null;
let autoPlayInterval = null;
let currentColorDensity = 0.8;

// 광역 단위 제외 목록
const excludedRegions = [
    'Total', 'Seoul Metropolitan Area', '5 Large Cities', 'Non-Metropolitan Area',
    'Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Ulsan',
    'Gyeonggi-do', 'Gangwon-do', 'Chungcheongbuk-do', 'Chungcheongnam-do ',
    'Jeollabuk-do', 'Jeollanam-do', 'Gyeongsangbuk-do', 'Gyeongsangnam-do',
    'Jeju-do '
];

// 하위 구가 있는 시 (상위 시는 제외, 구만 표시)
const citiesWithDistricts = [
    'Suwon', 'Seongnam', 'Goyang', 'Anyang', 'Bucheon', 'Ansan', 'Yongin', 'Hwaseong',
    'Cheongju', 'Cheonan', 'Jeonju', 'Pohang', 'Changwon'
];

// 육각형 타일 레이아웃 (상세 구/시 단위)
const hexagonLayout = {
    // row 3
    'Paju': { row: 3, col: 4 }, 'Yangju': { row: 3, col: 5 }, 'Dongducheon': { row: 3, col: 6 }, 'Uijeongbu': { row: 3, col: 7 },

    // row 4
    'Ilsanseo-gu': { row: 4, col: 4 }, 'Ilsandong-gu': { row: 4, col: 5 }, 'Deogyang-gu': { row: 4, col: 6 }, 'Eunpyeong-gu': { row: 4, col: 7 },
    'Gangbuk-gu': { row: 4, col: 8 }, 'Dobong-gu': { row: 4, col: 9 }, 'Nowon-gu': { row: 4, col: 10 }, 'Jungnang-gu': { row: 4, col: 11 },
    'Namyangju': { row: 4, col: 12 }, 'Chuncheon': { row: 4, col: 13 }, 'Gangneung': { row: 4, col: 14 },
    
    // row 5
    'Mapo-gu': { row: 5, col: 3 }, 'Seodaemun-gu': { row: 5, col: 4 }, 'Jongno-gu': { row: 5, col: 5 }, 'Jung-gu': { row: 5, col: 6 },
    'Yongsan-gu': { row: 5, col: 7 }, 'Seongbuk-gu': { row: 5, col: 8 }, 'Seongdong-gu': { row: 5, col: 9 }, 'Dongdaemun-gu': { row: 5, col: 10 },
    'Gwangjin-gu': { row: 5, col: 11 }, 'Guri': { row: 5, col: 12 }, 'Wonju': { row: 5, col: 13 },
    
    // row 6
    'Gimpo': { row: 6, col: 3 }, 'Gangseo-gu': { row: 6, col: 4 }, 'Yangcheon-gu': { row: 6, col: 5 }, 'Yeongdeungpo-gu': { row: 6, col: 6 },
    'Gwanak-gu': { row: 6, col: 7 }, 'Dongjak-gu': { row: 6, col: 8 }, 'Seocho-gu': { row: 6, col: 9 }, 'Gangnam-gu': { row: 6, col: 10 },
    'Songpa-gu': { row: 6, col: 11 }, 'Gangdong-gu': { row: 6, col: 12 }, 'Hanam': { row: 6, col: 13 },
    
    // row 7
    'Jung-gu.2': { row: 7, col: 2 }, 'Seo-gu.1': { row: 7, col: 3 }, 'Gyeyang-gu': { row: 7, col: 4 }, 'Bupyeong-gu': { row: 7, col: 5 },
    'Guro-gu': { row: 7, col: 6 }, 'Geumcheon-gu': { row: 7, col: 7 }, 'Gwangmyeong': { row: 7, col: 8 }, 'Gwacheon': { row: 7, col: 9 },
    'Bundang-gu': { row: 7, col: 10 }, 'Sujeong-gu': { row: 7, col: 11 }, 'Jungwon-gu': { row: 7, col: 12 }, 'Gwangju.1': { row: 7, col: 13 }, 'Icheon': { row: 7, col: 14 },
    
    // row 8
    'Michuhol-gu': { row: 8, col: 3 }, 'Yeonsu-gu': { row: 8, col: 4 }, 'Namdong-gu': { row: 8, col: 5 }, 'Ojeong': { row: 8, col: 6 },
    'Wonmi': { row: 8, col: 7 }, 'Sosa': { row: 8, col: 8 }, 'Manan-gu': { row: 8, col: 9 }, 'Dongan-gu': { row: 8, col: 10 },
    'Gunpo': { row: 8, col: 11 }, 'Uiwang': { row: 8, col: 12 }, 'Suji-gu': { row: 8, col: 13 },
    
    // row 9
    'Siheung': { row: 9, col: 5 }, 'Danwon-gu': { row: 9, col: 6 }, 'Sangrok-gu': { row: 9, col: 7 }, 'Jangan-gu': { row: 9, col: 8 },
    'Paldal-gu': { row: 9, col: 9 }, 'Yeongtong-gu': { row: 9, col: 10 }, 'Gwonseon-gu': { row: 9, col: 111 }, 'Giheung-gu': { row: 9, col: 12 },
    'Cheoin-gu': { row: 9, col: 13 },
    
    // row 10
    'Manse-gu': {row: 10, col: 7 }, 'Hyohaeng-gu': {row: 10, col: 8 }, 'Byeongjeom-gu': {row: 10, col: 9 }, 'Dongtan-gu': {row: 10, col: 10 },
    'Osan': { row: 10, col: 11 }, 'Pyeongtaek': { row: 10, col: 12 }, 'Anseong': { row: 10, col: 13 },

    // row 11
    'Seosan': { row: 11, col: 2 }, 'Dangjin': { row: 11, col: 3 }, 'Asan': { row: 11, col: 4 }, 'Seobuk-gu': { row: 11, col: 5 },
    'Dongnam-gu': { row: 11, col: 6 }, 'Sejong': { row: 11, col: 7 }, 'Heungdeok-gu': { row: 11, col: 8 }, 'Cheongwon-gu': { row: 11, col: 9 },
    'Seowon-gu': { row: 11, col: 10 }, 'Sangdang-gu': { row: 11, col: 11 }, 'Chungju': { row: 11, col: 12 }, 'Jecheon': { row: 11, col: 13 },
    
    // row 12
    'Gongju': { row: 12, col: 3 }, 'Gyeryong': { row: 12, col: 4 }, 'Yuseong-gu': { row: 12, col: 5 }, 'Seo-gu.3': { row: 12, col: 6 },
    'Jung-gu.3': { row: 12, col: 7 }, 'Dong-gu.3': { row: 12, col: 8 }, 'Daedeok-gu': { row: 12, col: 9 }, 'Gumi': { row: 12, col: 10 },
    'Gimcheon': { row: 12, col: 11 }, 'Andong': { row: 12, col: 12 }, 'Nam-gu.4': { row: 12, col: 13 }, 'Buk-gu .1': { row: 12, col: 14 },
    
    // row 13
    'Gunsan':  { row: 13, col: 3 }, 'Iksan-si': { row: 13, col: 4 }, 'Wansan-gu': { row: 13, col: 5 }, 'Deokjin-gu': { row: 13, col: 6 },
    'Buk-gu.1': { row: 13, col: 7 }, 'Seo-gu ': { row: 13, col: 8 }, 'Jung-gu ': { row: 13, col: 9 }, 'Buk-gu ': { row: 13, col: 10 },
    'Dong-gu ': { row: 13, col: 11 }, 'Gyeongsan': { row: 13, col: 12 }, 'Ulju-gun': { row: 13, col: 13 }, 'Buk-gu.2': { row: 13, col: 14 },
    
    // row 14
    'Mokpo' : { row: 14, col: 4 }, 'Suncheon': { row: 14, col: 5 }, 'Gwangsan-gu': { row: 14, col: 6 }, 'Dong-gu.2': { row: 14, col: 7 },
    'Dalseong-gun ': { row: 14, col: 8 }, 'Dalseo-gu ': { row: 14, col: 9 }, 'Nam-gu.1': { row: 14, col: 10 }, 'Suseong-gu ': { row: 14, col: 11 },
    'Jung-gu.4': { row: 14, col: 12 }, 'Nam-gu.3': { row: 14, col: 13 }, 'Dong-gu.4': { row: 14, col: 14 },
    
    // row 15
    'Yeosu': { row: 15, col: 3 }, 'Gwangyang': { row: 15, col: 4 }, 'Seo-gu.2': { row: 15, col: 5 }, 'Nam-gu.2': { row: 15, col: 6 },
    'Jinju': { row: 15, col: 7 }, 'Masan happo-gu': { row: 15, col: 8 }, 'Uichang-gu': { row: 15, col: 9 }, 'Sungsan-gu': { row: 15, col: 10 },
    'Gimhae': { row: 15, col: 11 }, 'Yangsan': { row: 15, col: 12 }, 'Buk-gu': { row: 15, col: 13 }, 'Gijang-gun': { row: 15, col: 14 },
    
    // row 16
    'Masan hoiwon-gu': { row: 16, col: 8 }, 'Jinhae-gu': { row: 16, col: 9 }, 'Gangseo-gu.1': { row: 16, col: 10 }, 'Dongnae-gu': { row: 16, col: 11 },
    'Yeonje-gu': { row: 16, col: 12 }, 'Geumjeong-gu': { row: 16, col: 13 }, 'Haeundae-gu': { row: 16, col: 14 },
    
    // row 17
    'Tongyeong': { row: 17, col: 7 }, 'Geoje': { row: 17, col: 8 }, 'Sasang-gu': { row: 17, col: 11 }, 'Busanjin-gu': { row: 17, col: 12 },
    'Nam-gu': { row: 17, col: 13 }, 'Suyeong-gu': { row: 17, col: 14 },
    
    // row 18
    'Saha-gu': { row: 18, col: 11 }, 'Seo-gu': { row: 18, col: 12 }, 'Jung-gu.1': { row: 18, col: 13 },
    
    // row 19
    'Dong-gu': { row: 19, col: 12 }, 'Yeongdo-gu': { row: 19, col: 13 },
    
    // row 21
    'Jeju/ Seogwipo': { row: 21, col: 4 }
};

// 육각형 그리기 함수
function createHexagon(x, y, size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        points.push(`${px},${py}`);
    }
    return points.join(' ');
}

// 행, 열 좌표를 실제 x, y 좌표로 변환
function hexToPixel(row, col, hexSize) {
    const hexWidth = hexSize * Math.sqrt(3);
    const hexHeight = hexSize * 2;
    const x = col * hexWidth + (row % 2) * (hexWidth / 2);
    const y = row * hexHeight * 0.75;
    return { x, y };
}

// 색상 스케일 계산 (밀도 파라미터 추가)
function getColor(value, density = 0.8) {
    if (value === null || value === undefined) {
        return '#e0e0e0';
    }
    const maxAbs = 0.5 * density;
    const normalized = Math.max(-1, Math.min(1, value / maxAbs));
    if (normalized > 0) {
        const intensity = Math.floor(255 * (1 - normalized));
        return `rgb(255, ${intensity}, ${intensity})`;
    } else {
        const intensity = Math.floor(255 * (1 + normalized));
        return `rgb(${intensity}, ${intensity}, 255)`;
    }
}

// 배경색의 밝기를 계산하여 텍스트 색상 결정
function getTextColor(backgroundColor) {
    const match = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#222';
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.6 ? '#ffffff' : '#222222';
}

// 육각형 지도 생성 (범례 제거)
function createHexagonMap(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    container.innerHTML = '';

    const hexSize = 65;
    const padding = 50;

    // 모든 육각형의 좌표를 계산하여 실제 영역 파악
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    Object.values(hexagonLayout).forEach(coords => {
        const { x, y } = hexToPixel(coords.row, coords.col, hexSize);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });

    // 육각형 크기를 고려한 실제 필요 영역
    const viewBoxX = minX - hexSize - padding;
    const viewBoxY = minY - hexSize - padding;
    const viewBoxWidth = (maxX - minX) + hexSize * 2 + padding * 2;
    const viewBoxHeight = (maxY - minY) + hexSize * 2 + padding * 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.backgroundColor = '#fafafa';

    Object.entries(hexagonLayout).forEach(([region, coords]) => {
        const { x, y } = hexToPixel(coords.row, coords.col, hexSize);
        const actualX = x;
        const actualY = y;
        const value = data[region] !== undefined ? data[region] : null;
        const color = getColor(value, currentColorDensity);

        const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hexagon.setAttribute('points', createHexagon(actualX, actualY, hexSize));
        hexagon.setAttribute('fill', color);
        hexagon.setAttribute('stroke', '#999');
        hexagon.setAttribute('stroke-width', '0.5');
        hexagon.style.cursor = 'pointer';

        hexagon.addEventListener('mouseenter', function() {
            this.setAttribute('stroke', '#000');
            this.setAttribute('stroke-width', '2');
        });
        hexagon.addEventListener('mouseleave', function() {
            this.setAttribute('stroke', '#999');
            this.setAttribute('stroke-width', '0.5');
        });

        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        const koreanName = regionNameMap[region] || region;
        const displayValue = value !== null ? value.toFixed(2) + '%' : '데이터 없음';
        titleElement.textContent = `${koreanName}: ${displayValue}`;
        hexagon.appendChild(titleElement);
        svg.appendChild(hexagon);

        const fullName = koreanName;
        const textColor = getTextColor(color);

        if (fullName.includes('[') && fullName.includes(']')) {
            const matches = fullName.match(/(\[[^\]]+\])\s*(.*)/);
            if (matches) {
                const prefix = matches[1];
                const localName = matches[2];
                const nameParts = localName.split(' ');

                if (nameParts.length > 1) {
                    const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text1.setAttribute('x', actualX);
                    text1.setAttribute('y', actualY - 20);
                    text1.setAttribute('text-anchor', 'middle');
                    text1.setAttribute('font-size', '16');
                    text1.setAttribute('fill', textColor);
                    text1.setAttribute('pointer-events', 'none');
                    text1.setAttribute('opacity', '0.8');
                    text1.style.userSelect = 'none';
                    text1.textContent = prefix;
                    svg.appendChild(text1);

                    const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text2.setAttribute('x', actualX);
                    text2.setAttribute('y', actualY);
                    text2.setAttribute('text-anchor', 'middle');
                    text2.setAttribute('font-size', '18');
                    text2.setAttribute('fill', textColor);
                    text2.setAttribute('pointer-events', 'none');
                    text2.style.userSelect = 'none';
                    text2.style.fontWeight = '600';
                    text2.textContent = nameParts[0];
                    svg.appendChild(text2);

                    const text3 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text3.setAttribute('x', actualX);
                    text3.setAttribute('y', actualY + 20);
                    text3.setAttribute('text-anchor', 'middle');
                    text3.setAttribute('font-size', '18');
                    text3.setAttribute('fill', textColor);
                    text3.setAttribute('pointer-events', 'none');
                    text3.style.userSelect = 'none';
                    text3.style.fontWeight = '600';
                    text3.textContent = nameParts[1];
                    svg.appendChild(text3);
                } else {
                    const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text1.setAttribute('x', actualX);
                    text1.setAttribute('y', actualY - 14);
                    text1.setAttribute('text-anchor', 'middle');
                    text1.setAttribute('font-size', '16');
                    text1.setAttribute('fill', textColor);
                    text1.setAttribute('pointer-events', 'none');
                    text1.setAttribute('opacity', '0.8');
                    text1.style.userSelect = 'none';
                    text1.textContent = prefix;
                    svg.appendChild(text1);

                    const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text2.setAttribute('x', actualX);
                    text2.setAttribute('y', actualY + 14);
                    text2.setAttribute('text-anchor', 'middle');
                    text2.setAttribute('font-size', '20');
                    text2.setAttribute('fill', textColor);
                    text2.setAttribute('pointer-events', 'none');
                    text2.style.userSelect = 'none';
                    text2.style.fontWeight = '600';
                    text2.textContent = localName;
                    svg.appendChild(text2);
                }
            }
        } else {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', actualX);
            text.setAttribute('y', actualY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', '22');
            text.setAttribute('fill', textColor);
            text.setAttribute('pointer-events', 'none');
            text.style.userSelect = 'none';
            text.style.fontWeight = '600';
            text.textContent = fullName;
            svg.appendChild(text);
        }
    });

    container.appendChild(svg);
}

// 특정 주차 데이터에서 각 지역의 매매/전세 증감률 추출
function extractRegionDataForWeek(timeSeriesData, week, type) {
    if (!timeSeriesData || timeSeriesData.length === 0 || !week) {
        return {};
    }
    const data = {};
    timeSeriesData.forEach(item => {
        if (item.week === week && item.type === type) {
            // 지역명 정규화: 줄바꿈을 공백으로 변환
            const region = item.region.replace(/\n/g, ' ');
            if (excludedRegions.includes(region)) return;
            if (citiesWithDistricts.includes(region)) return;
            if (hexagonLayout[region]) {
                data[region] = parseFloat(item.rate);
            }
        }
    });
    return data;
}

// 날짜 리스트 생성
function createDateList(weeks) {
    const dateListContainer = document.getElementById('dateListContainer');
    if (!dateListContainer) return;
    dateListContainer.innerHTML = '';
    const sortedWeeks = [...weeks].sort().reverse();
    sortedWeeks.forEach(week => {
        const dateItem = document.createElement('div');
        dateItem.className = 'date-item';
        dateItem.textContent = week;
        dateItem.dataset.week = week;
        dateItem.addEventListener('click', function() {
            selectWeek(week);
        });
        dateListContainer.appendChild(dateItem);
    });
    if (sortedWeeks.length > 0) {
        selectWeek(sortedWeeks[0]);
    }
}

// 주차 선택
function selectWeek(week) {
    currentSelectedWeek = week;
    document.querySelectorAll('.date-item').forEach(item => {
        if (item.dataset.week === week) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    if (selectedDateDisplay) {
        selectedDateDisplay.textContent = week.replace(/-/g, '');
    }
    const tradeMapDate = document.getElementById('tradeMapDate');
    const jeonseMapDate = document.getElementById('jeonseMapDate');
    if (tradeMapDate) tradeMapDate.textContent = `(${week})`;
    if (jeonseMapDate) jeonseMapDate.textContent = `(${week})`;
    updateMaps();
}

// 지도 업데이트
function updateMaps() {
    if (!allTimeSeriesData || !currentSelectedWeek) return;
    const tradeData = extractRegionDataForWeek(allTimeSeriesData, currentSelectedWeek, 'trade');
    createHexagonMap('tradeHexMap', tradeData);
    const jeonseData = extractRegionDataForWeek(allTimeSeriesData, currentSelectedWeek, 'jeonse');
    createHexagonMap('jeonseHexMap', jeonseData);
}

// 자동 모드 토글
function toggleAutoPlay() {
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    if (autoPlayToggle && autoPlayToggle.checked) {
        startAutoPlay();
    } else {
        stopAutoPlay();
    }
}

// 자동 모드 시작
function startAutoPlay() {
    if (autoPlayInterval) return;
    const weeksWithMapData = allTimeSeriesData.filter(item => {
        const region = item.region.replace(/\n/g, ' ');
        return hexagonLayout[region] && !excludedRegions.includes(region) && !citiesWithDistricts.includes(region);
    });
    const weeks = [...new Set(weeksWithMapData.map(item => item.week))].sort();
    let currentIndex = weeks.indexOf(currentSelectedWeek);
    autoPlayInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= weeks.length) {
            currentIndex = 0;
        }
        selectWeek(weeks[currentIndex]);
    }, 1000);
}

// 자동 모드 정지
function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// 색상 밀도 조절
function updateColorDensity(value) {
    currentColorDensity = parseFloat(value);
    const densityValue = document.getElementById('densityValue');
    if (densityValue) {
        densityValue.textContent = value;
    }
    const maxValue = (0.8 * currentColorDensity).toFixed(1);
    const legendLabels = document.querySelector('.legend-labels');
    if (legendLabels) {
        legendLabels.innerHTML = `
            <span>-${maxValue}%</span>
            <span>0%</span>
            <span>+${maxValue}%</span>
        `;
    }
    updateMaps();
}

// 육각형 지도 초기화 (메인 함수)
function displayHexagonMaps(timeSeriesData) {
    console.log('Displaying hexagon maps with data:', timeSeriesData);
    allTimeSeriesData = timeSeriesData;
    // 지도에 표시 가능한 주차만 필터 (구 단위 데이터가 있는 주차)
    const weeksWithMapData = timeSeriesData.filter(item => {
        const region = item.region.replace(/\n/g, ' ');
        return hexagonLayout[region] && !excludedRegions.includes(region) && !citiesWithDistricts.includes(region);
    });
    const weeks = [...new Set(weeksWithMapData.map(item => item.week))].sort();
    console.log('Available weeks:', weeks);
    createDateList(weeks);
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('change', toggleAutoPlay);
    }
    const colorDensitySlider = document.getElementById('colorDensitySlider');
    if (colorDensitySlider) {
        colorDensitySlider.addEventListener('input', function() {
            updateColorDensity(this.value);
        });
    }
}
