// 전역 변수
let currentData = null;
let timeSeriesChart = null;
let tradeBarChart = null;
let jeonseBarChart = null;
let tradeFlowChart = null;
let jeonseFlowChart = null;
let multipleCharts = {};
let tradeTop10BarChart = null;
let jeonseTop10BarChart = null;
let tradeBottom10BarChart = null;
let jeonseBottom10BarChart = null;

// DOM 요소
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

// =============================================================================
// 업데이트 히스토리 데이터
// =============================================================================
const updateHistory = [
    {
        version: 'v0.3',
        date: '2026-01-25',
        title: '레이아웃 구조 개편 및 반응형 디자인',
        changes: [
            '전체 레이아웃 구조 개편: Header(고정) - Content(스크롤) - Footer(고정)',
            'Header에 제목, 업데이트 날짜, 탭 메뉴를 한 줄에 배치',
            '브라우저 스크롤 제거, Content 영역만 스크롤되도록 변경',
            '하위 Top 10 히트맵 테이블 색상을 파란색 계열로 변경',
            '태블릿/모바일 반응형 디자인 전면 개선'
        ]
    },
    {
        version: 'v0.2',
        date: '2026-01-25',
        title: '하위 Top 10 추가 및 버그 수정',
        changes: [
            '매매/전세 증감률 하위 Top 10 시각화 추가',
            '세종시 지도 표시 오류 수정 (excludedRegions에서 제거)',
            '제주 지역 지도 표시 오류 수정 (지역명 줄바꿈 처리)',
            '증감률 0% 지역이 "데이터 없음"으로 표시되던 오류 수정',
            '공지사항을 업데이트 히스토리 게시판 형태로 변경',
            'Footer 추가 (Data source 및 제작자 정보)',
            'Top 10 탭 제목 스타일 통일'
        ]
    },
    {
        version: 'v0.1',
        date: '2026-01-23',
        title: 'KB부동산 주간시계열 대시보드 최초 배포',
        changes: [
            '홈 탭: 대시보드 소개',
            '전국 흐름 탭: 전국/권역별 매매·전세 증감률 및 흐름 차트',
            '지역 흐름 탭: 상승/하락 Top 10, 주간 증감 바차트, 지역별 테이블',
            'Top 10 탭: 매매/전세 증감률 상위 Top 10 차트 및 히트맵',
            '수요 & 공급 탭: 매수우위지수, 전세수급지수 추세 차트',
            '지도 탭: 육각형 지도로 지역별 증감률 시각화 (날짜 선택, 자동 재생 기능)'
        ]
    }
];

// =============================================================================
// 탭 전환 기능
// =============================================================================
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // 모든 탭 버튼의 active 클래스 제거
            tabBtns.forEach(b => b.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            btn.classList.add('active');

            // 모든 탭 콘텐츠 숨기기
            tabContents.forEach(content => content.classList.remove('active'));
            // 선택한 탭 콘텐츠 표시
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // 지도 탭으로 전환 시 지도 재렌더링
            if (targetTab === 'map' && currentData) {
                setTimeout(() => {
                    initializeHexMap(currentData);
                }, 100);
            }
        });
    });
}

// =============================================================================
// JSON 데이터 자동 로드
// =============================================================================
async function loadData() {
    loading.style.display = 'block';
    hideError();

    try {
        console.log('데이터 로딩 시작...');
        const response = await fetch('data/latest.json');

        if (!response.ok) {
            throw new Error(`데이터 로드 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('데이터 로드 완료:', data);

        currentData = data;
        displayDashboard(data);

        loading.style.display = 'none';

        // 업데이트 날짜 표시
        const surveyDateElement = document.getElementById('surveyDate');
        if (surveyDateElement && data.survey_date) {
            surveyDateElement.textContent = data.survey_date;
        }

    } catch (error) {
        console.error('데이터 로드 오류:', error);
        loading.style.display = 'none';
        showError(`데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }
}

// =============================================================================
// 페이지 초기화
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('페이지 로드 완료');

    // 탭 초기화
    initializeTabs();

    // 공지사항 모달 초기화
    initializeNoticeModal();

    // 데이터 자동 로드
    loadData();
});

// 대시보드 표시
function displayDashboard(data) {
    console.log('=== Dashboard Data ===');
    console.log('Full data:', data);
    console.log('Time series length:', data.time_series ? data.time_series.length : 0);
    console.log('Time series sample:', data.time_series ? data.time_series.slice(0, 5) : []);

    // 전국 통계
    if (data.national) {
        // 매매 통계
        const tradeCurrent = data.national.trade?.current;
        const tradeChange = data.national.trade?.change;

        const tradeElement = document.getElementById('nationalTrade');
        const tradeChangeElement = document.getElementById('nationalTradeChange');

        if (tradeElement) {
            tradeElement.textContent = formatRate(tradeCurrent);
            tradeElement.className = 'stat-value ' + getRateClass(tradeCurrent);
        }

        if (tradeChangeElement) {
            tradeChangeElement.textContent = formatRate(tradeChange);
            tradeChangeElement.className = 'stat-change ' + getRateClass(tradeChange);
        }

        // 전세 통계
        const jeonseCurrent = data.national.jeonse?.current;
        const jeonseChange = data.national.jeonse?.change;

        const jeonseElement = document.getElementById('nationalJeonse');
        const jeonseChangeElement = document.getElementById('nationalJeonseChange');

        if (jeonseElement) {
            jeonseElement.textContent = formatRate(jeonseCurrent);
            jeonseElement.className = 'stat-value ' + getRateClass(jeonseCurrent);
        }

        if (jeonseChangeElement) {
            jeonseChangeElement.textContent = formatRate(jeonseChange);
            jeonseChangeElement.className = 'stat-change ' + getRateClass(jeonseChange);
        }
    }

    // 지역별 통계
    if (data.regional) {
        displayRegionalStats('capital', data.regional.capital);
        displayRegionalStats('metro', data.regional.metro);
        displayRegionalStats('other', data.regional.other);
    }

    // Top 10 순위
    if (data.rankings) {
        displayRankings('risingRank', data.rankings.rising, true);
        displayRankings('fallingRank', data.rankings.falling, false);
    }

    // 권역별 증감 흐름 라인 차트
    if (data.time_series && data.time_series.length > 0) {
        displayRegionalFlowCharts(data.time_series);
    }

    // 가로 막대 차트
    if (data.time_series && data.time_series.length > 0) {
        displayBarCharts(data.time_series);
    }

    // 히트맵 테이블
    if (data.time_series && data.time_series.length > 0) {
        displayHeatmapTable(data.time_series);
    }

    // Top 10 증감률 차트 및 히트맵
    if (data.time_series && data.time_series.length > 0) {
        displayTop10Charts(data.time_series);
    }

    // 육각형 지도
    if (data.time_series && data.time_series.length > 0) {
        displayHexagonMaps(data.time_series);
    }

    // 멀티플 차트 (수급지수)
    if (data.supply_index) {
        displayMultipleCharts(data.supply_index);
    }
}

// 지역별 통계 표시
function displayRegionalStats(region, stats) {
    if (!stats) return;

    // 매매 통계
    const tradeCurrent = stats.trade?.current;
    const tradeChange = stats.trade?.change;

    const tradeElement = document.getElementById(`${region}Trade`);
    const tradeChangeElement = document.getElementById(`${region}TradeChange`);

    if (tradeElement) {
        tradeElement.textContent = formatRate(tradeCurrent);
        tradeElement.className = 'regional-value ' + getRateClass(tradeCurrent);
    }

    if (tradeChangeElement) {
        tradeChangeElement.textContent = formatRate(tradeChange);
        tradeChangeElement.className = 'regional-change ' + getRateClass(tradeChange);
    }

    // 전세 통계
    const jeonseCurrent = stats.jeonse?.current;
    const jeonseChange = stats.jeonse?.change;

    const jeonseElement = document.getElementById(`${region}Jeonse`);
    const jeonseChangeElement = document.getElementById(`${region}JeonseChange`);

    if (jeonseElement) {
        jeonseElement.textContent = formatRate(jeonseCurrent);
        jeonseElement.className = 'regional-value ' + getRateClass(jeonseCurrent);
    }

    if (jeonseChangeElement) {
        jeonseChangeElement.textContent = formatRate(jeonseChange);
        jeonseChangeElement.className = 'regional-change ' + getRateClass(jeonseChange);
    }
}

// 순위 표시
function displayRankings(elementId, rankings, isRising) {
    const container = document.getElementById(elementId);
    if (!container || !rankings) return;

    container.innerHTML = '';

    rankings.forEach((item, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'ranking-item';

        const rate = parseFloat(item.rate) || 0;
        const rateClass = getRateClass(rate);

        rankItem.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span class="ranking-position">${index + 1}</span>
                <span class="ranking-region">${item.region}</span>
            </div>
            <span class="ranking-rate ${rateClass}">${formatRate(rate)}</span>
        `;

        container.appendChild(rankItem);
    });
}

// 시계열 차트 표시
function displayTimeSeriesChart(timeSeriesData) {
    const ctx = document.getElementById('timeSeriesChart');
    if (!ctx) return;

    // 기존 차트 제거
    if (timeSeriesChart) {
        timeSeriesChart.destroy();
    }

    // 데이터 준비
    const regions = [...new Set(timeSeriesData.map(item => item.region))];
    const weeks = [...new Set(timeSeriesData.map(item => item.week))].sort();

    const datasets = regions.slice(0, 10).map((region, index) => {
        const regionData = timeSeriesData.filter(item => item.region === region);
        const data = weeks.map(week => {
            const item = regionData.find(d => d.week === week);
            return item ? parseFloat(item.rate) : null;
        });

        return {
            label: region,
            data: data,
            borderColor: getChartColor(index),
            backgroundColor: getChartColor(index, 0.1),
            borderWidth: 2,
            tension: 0.3,
            fill: false
        };
    });

    // 차트 생성
    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatRate(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatRate(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// 유틸리티 함수
function formatRate(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';

    // 반올림 후 0.00이 되는지 확인
    const rounded = parseFloat(num.toFixed(2));
    if (rounded === 0) {
        return '0.00%';  // 기호 없이 표시
    }

    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
}

function getRateClass(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '';

    // 반올림 후 0.00이 되는지 확인
    const rounded = parseFloat(num.toFixed(2));
    if (rounded === 0) {
        return 'neutral';  // 중립 클래스
    }

    return num >= 0 ? 'positive' : 'negative';
}

function getChartColor(index, alpha = 1) {
    const colors = [
        `rgba(102, 126, 234, ${alpha})`,
        `rgba(237, 100, 166, ${alpha})`,
        `rgba(255, 159, 64, ${alpha})`,
        `rgba(75, 192, 192, ${alpha})`,
        `rgba(153, 102, 255, ${alpha})`,
        `rgba(255, 99, 132, ${alpha})`,
        `rgba(54, 162, 235, ${alpha})`,
        `rgba(255, 206, 86, ${alpha})`,
        `rgba(231, 233, 237, ${alpha})`,
        `rgba(72, 187, 120, ${alpha})`
    ];
    return colors[index % colors.length];
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

// 권역별 증감 흐름 라인 차트 표시
function displayRegionalFlowCharts(timeSeriesData) {
    console.log('=== Regional Flow Charts ===');
    console.log('Time series data length:', timeSeriesData.length);
    console.log('Sample data:', timeSeriesData.slice(0, 10));

    // 매매증감, 전세증감 시트 데이터 필터링
    const tradeSeriesData = timeSeriesData.filter(item => item.type === 'trade');
    const jeonseSeriesData = timeSeriesData.filter(item => item.type === 'jeonse');

    console.log('Trade data length:', tradeSeriesData.length);
    console.log('Jeonse data length:', jeonseSeriesData.length);

    // 주차별 데이터 정리
    const weeks = [...new Set(timeSeriesData.map(item => item.week))].sort();
    console.log('Weeks:', weeks);

    // 매매 데이터 준비
    const tradeData = {
        '전국': [],
        '수도권': [],
        '5개 광역시': [],
        '기타지방': []
    };

    // 전세 데이터 준비
    const jeonseData = {
        '전국': [],
        '수도권': [],
        '5개 광역시': [],
        '기타지방': []
    };

    weeks.forEach(week => {
        // 매매 데이터 처리
        const tradeWeekData = tradeSeriesData.filter(item => item.week === week);

        // 엑셀 파일에 이미 집계된 데이터 사용
        const tradeTotal = tradeWeekData.find(item => item.region === 'Total');
        const tradeCapital = tradeWeekData.find(item => item.region === 'Seoul Metropolitan Area');
        const tradeMetro = tradeWeekData.find(item => item.region === '5 Large Cities');
        const tradeOther = tradeWeekData.find(item => item.region === 'Non-Metropolitan Area');

        tradeData['전국'].push(tradeTotal ? parseFloat(tradeTotal.rate) : null);
        tradeData['수도권'].push(tradeCapital ? parseFloat(tradeCapital.rate) : null);
        tradeData['5개 광역시'].push(tradeMetro ? parseFloat(tradeMetro.rate) : null);
        tradeData['기타지방'].push(tradeOther ? parseFloat(tradeOther.rate) : null);

        // 전세 데이터 처리
        const jeonseWeekData = jeonseSeriesData.filter(item => item.week === week);

        // 엑셀 파일에 이미 집계된 데이터 사용
        const jeonseTotal = jeonseWeekData.find(item => item.region === 'Total');
        const jeonseCapital = jeonseWeekData.find(item => item.region === 'Seoul Metropolitan Area');
        const jeonseMetro = jeonseWeekData.find(item => item.region === '5 Large Cities');
        const jeonseOther = jeonseWeekData.find(item => item.region === 'Non-Metropolitan Area');

        jeonseData['전국'].push(jeonseTotal ? parseFloat(jeonseTotal.rate) : null);
        jeonseData['수도권'].push(jeonseCapital ? parseFloat(jeonseCapital.rate) : null);
        jeonseData['5개 광역시'].push(jeonseMetro ? parseFloat(jeonseMetro.rate) : null);
        jeonseData['기타지방'].push(jeonseOther ? parseFloat(jeonseOther.rate) : null);
    });

    // 매매 흐름 차트 생성
    displayFlowChart('tradeFlowChart', weeks, tradeData, '매매 증감률');

    // 전세 흐름 차트 생성
    displayFlowChart('jeonseFlowChart', weeks, jeonseData, '전세 증감률');
}

function displayFlowChart(canvasId, weeks, regionalData, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // 기존 차트 제거
    if (canvasId === 'tradeFlowChart' && tradeFlowChart) {
        tradeFlowChart.destroy();
    } else if (canvasId === 'jeonseFlowChart' && jeonseFlowChart) {
        jeonseFlowChart.destroy();
    }

    // 데이터셋 생성
    const datasets = [];
    const colors = {
        '전국': 'rgba(255, 99, 132, 1)',      // 빨강
        '수도권': 'rgba(255, 159, 64, 1)',    // 오렌지
        '5개 광역시': 'rgba(75, 192, 120, 1)',  // 초록
        '기타지방': 'rgba(54, 162, 235, 1)'    // 파랑
    };

    Object.keys(regionalData).forEach(region => {
        datasets.push({
            label: region,
            data: regionalData[region],
            borderColor: colors[region] || 'rgba(153, 102, 255, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: colors[region] || 'rgba(153, 102, 255, 1)'
        });
    });

    // 차트 생성
    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatRate(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatRate(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // 차트 인스턴스 저장
    if (canvasId === 'tradeFlowChart') {
        tradeFlowChart = newChart;
    } else if (canvasId === 'jeonseFlowChart') {
        jeonseFlowChart = newChart;
    }
}

// 영어 지역명 → 한글 매핑 (엑셀 파일에서 자동 생성, 순서 보존)
const regionNameMap = {
    'Total': '전국',
    'Seoul': '서울',
    'Gangbuk-gu': '[서울] 강북구',
    'Gwangjin-gu': '[서울] 광진구',
    'Nowon-gu': '[서울] 노원구',
    'Dobong-gu': '[서울] 도봉구',
    'Dongdaemun-gu': '[서울] 동대문구',
    'Mapo-gu': '[서울] 마포구',
    'Seodaemun-gu': '[서울] 서대문구',
    'Seongdong-gu': '[서울] 성동구',
    'Seongbuk-gu': '[서울] 성북구',
    'Yongsan-gu': '[서울] 용산구',
    'Eunpyeong-gu': '[서울] 은평구',
    'Jongno-gu': '[서울] 종로구',
    'Jung-gu': '[서울] 중구',
    'Jungnang-gu': '[서울] 중랑구',
    'Gangnam-gu': '[서울] 강남구',
    'Gangdong-gu': '[서울] 강동구',
    'Gangseo-gu': '[서울] 강서구',
    'Gwanak-gu': '[서울] 관악구',
    'Guro-gu': '[서울] 구로구',
    'Geumcheon-gu': '[서울] 금천구',
    'Dongjak-gu': '[서울] 동작구',
    'Seocho-gu': '[서울] 서초구',
    'Songpa-gu': '[서울] 송파구',
    'Yangcheon-gu': '[서울] 양천구',
    'Yeongdeungpo-gu': '[서울] 영등포구',
    'Busan': '부산',
    'Jung-gu.1': '[부산] 중구',
    'Seo-gu': '[부산] 서구',
    'Dong-gu': '[부산] 동구',
    'Yeongdo-gu': '[부산] 영도구',
    'Busanjin-gu': '[부산] 부산진구',
    'Dongnae-gu': '[부산] 동래구',
    'Nam-gu': '[부산] 남구',
    'Buk-gu': '[부산] 북구',
    'Haeundae-gu': '[부산] 해운대구',
    'Saha-gu': '[부산] 사하구',
    'Geumjeong-gu': '[부산] 금정구',
    'Yeonje-gu': '[부산] 연제구',
    'Suyeong-gu': '[부산] 수영구',
    'Sasang-gu': '[부산] 사상구',
    'Gijang-gun': '[부산] 기장군',
    'Gangseo-gu.1': '[부산] 강서구',
    'Daegu': '대구',
    'Jung-gu ': '[대구] 중구',
    'Dong-gu ': '[대구] 동구',
    'Seo-gu ': '[대구] 서구',
    'Nam-gu.1': '[대구] 남구',
    'Buk-gu ': '[대구] 북구',
    'Suseong-gu ': '[대구] 수성구',
    'Dalseo-gu ': '[대구] 달서구',
    'Dalseong-gun ': '[대구] 달성군',
    'Incheon': '인천',
    'Jung-gu.2': '[인천] 중구',
    'Dong-gu.1': '[인천] 동구',
    'Michuhol-gu': '[인천] 미추홀구',
    'Yeonsu-gu': '[인천] 연수구',
    'Namdong-gu': '[인천] 남동구',
    'Bupyeong-gu': '[인천] 부평구',
    'Gyeyang-gu': '[인천] 계양구',
    'Seo-gu.1': '[인천] 서구',
    'Gwangju': '광주',
    'Dong-gu.2': '[광주] 동구',
    'Seo-gu.2': '[광주] 서구',
    'Nam-gu.2': '[광주] 남구',
    'Buk-gu.1': '[광주] 북구',
    'Gwangsan-gu': '[광주] 광산구',
    'Daejeon': '대전',
    'Dong-gu.3': '[대전] 동구',
    'Jung-gu.3': '[대전] 중구',
    'Seo-gu.3': '[대전] 서구',
    'Yuseong-gu': '[대전] 유성구',
    'Daedeok-gu': '[대전] 대덕구',
    'Ulsan': '울산',
    'Jung-gu.4': '[울산] 중구',
    'Nam-gu.3': '[울산] 남구',
    'Dong-gu.4': '[울산] 동구',
    'Buk-gu.2': '[울산] 북구',
    'Ulju-gun': '[울산] 울주군',
    '5 Large Cities': '5개광역시',
    'Seoul Metropolitan Area': '수도권',
    'Sejong': '세종',
    'Gyeonggi-do': '경기',
    'Suwon': '[경기] 수원시',
    'Jangan-gu': '[경기] 수원시 장안구',
    'Gwonseon-gu': '[경기] 수원시 권선구',
    'Paldal-gu': '[경기] 수원시 팔달구',
    'Yeongtong-gu': '[경기] 수원시 영통구',
    'Seongnam': '[경기] 성남시',
    'Sujeong-gu': '[경기] 성남시 수정구',
    'Jungwon-gu': '[경기] 성남시 중원구',
    'Bundang-gu': '[경기] 성남시 분당구',
    'Goyang': '[경기] 고양시',
    'Deogyang-gu': '[경기] 고양시 덕양구',
    'Ilsandong-gu': '[경기] 고양시 일산동구',
    'Ilsanseo-gu': '[경기] 고양시 일산서구',
    'Anyang': '[경기] 안양시',
    'Manan-gu': '[경기] 안양시 만안구',
    'Dongan-gu': '[경기] 안양시 동안구',
    'Bucheon': '[경기] 부천시',
    'Wonmi': '[경기] 부천시 원미구',
    'Sosa': '[경기] 부천시 소사구',
    'Ojeong': '[경기] 부천시 오정구',
    'Uijeongbu': '[경기] 의정부시',
    'Gwangmyeong': '[경기] 광명시',
    'Pyeongtaek': '[경기] 평택시',
    'Ansan': '[경기] 안산시',
    'Danwon-gu': '[경기] 안산시 단원구',
    'Sangrok-gu': '[경기] 안산시 상록구',
    'Gwacheon': '[경기] 과천시',
    'Guri': '[경기] 구리시',
    'Namyangju': '[경기] 남양주시',
    'Yongin': '[경기] 용인시',
    'Cheoin-gu': '[경기] 용인시 처인구',
    'Giheung-gu': '[경기] 용인시 기흥구',
    'Suji-gu': '[경기] 용인시 수지구',
    'Siheung': '[경기] 시흥시',
    'Gunpo': '[경기] 군포시',
    'Uiwang': '[경기] 의왕시',
    'Hanam': '[경기] 하남시',
    'Osan': '[경기] 오산시',
    'Paju': '[경기] 파주시',
    'Icheon': '[경기] 이천시',
    'Anseong': '[경기] 안성시',
    'Gimpo': '[경기] 김포시',
    'Yangju': '[경기] 양주시',
    'Dongducheon': '[경기] 동두천시',
    'Gwangju.1': '[경기] 광주시',
    'Hwaseong': '[경기] 화성시',
    'Gangwon-do': '강원',
    'Chuncheon': '[강원] 춘천시',
    'Gangneung': '[강원] 강릉시',
    'Wonju': '[강원] 원주시',
    'Chungcheongbuk-do': '충북',
    'Cheongju': '[충북] 청주시',
    'Sangdang-gu': '[충북] 청주시 상당구',
    'Seowon-gu': '[충북] 청주시 서원구',
    'Cheongwon-gu': '[충북] 청주시 청원구',
    'Heungdeok-gu': '[충북] 청주시 흥덕구',
    'Chungju': '[충북] 충주시',
    'Jecheon': '[충북] 제천시',
    'Chungcheongnam-do ': '충남',
    'Cheonan': '[충남] 천안시',
    'Dongnam-gu': '[충남] 천안시 동남구',
    'Seobuk-gu': '[충남] 천안시 서북구',
    'Gongju': '[충남] 공주시',
    'Asan': '[충남] 아산시',
    'Nonsan': '[충남] 논산시',
    'Gyeryong': '[충남] 계룡시',
    'Dangjin': '[충남] 당진시',
    'Seosan': '[충남] 서산시',
    'Jeollabuk-do': '전북',
    'Jeonju': '[전북] 전주시',
    'Wansan-gu': '[전북] 전주시 완산구',
    'Deokjin-gu': '[전북] 전주시 덕진구',
    'Iksan-si': '[전북] 익산시',
    'Gunsan': '[전북] 군산시',
    'Jeollanam-do': '전남',
    'Mokpo': '[전남] 목포시',
    'Suncheon': '[전남] 순천시',
    'Gwangyang': '[전남] 광양시',
    'Yeosu': '[전남] 여수시',
    'Gyeongsangbuk-do': '경북',
    'Pohang': '[경북] 포항시',
    'Nam-gu.4': '[경북] 포항시 남구',
    'Buk-gu .1': '[경북] 포항시 북구',
    'Gumi': '[경북] 구미시',
    'Gyeongsan': '[경북] 경산시',
    'Andong': '[경북] 안동시',
    'Gimcheon': '[경북] 김천시',
    'Gyeongsangnam-do': '경남',
    'Changwon': '[경남] 창원시',
    'Masan happo-gu': '[경남] 창원시 마산합포구',
    'Masan hoiwon-gu': '[경남] 창원시 마산회원구',
    'Sungsan-gu': '[경남] 창원시 성산구',
    'Uichang-gu': '[경남] 창원시 의창구',
    'Jinhae-gu': '[경남] 창원시 진해구',
    'Yangsan': '[경남] 양산시',
    'Geoje': '[경남] 거제시',
    'Jinju': '[경남] 진주시',
    'Gimhae': '[경남] 김해시',
    'Tongyeong': '[경남] 통영시',
    'Jeju-do ': '제주도',
    'Jeju/ Seogwipo': '제주',
    'Non-Metropolitan Area': '기타지방'
,
    // 한글+영어 혼합 형식 (매수우위지수/전세수급지수에서 사용)
    '전국 Total': '전국',
    '수도권 Seoul Metropolitan Area': '수도권',
    '서울특별시 Seoul': '서울',
    '경기도  Gyeonggi-do': '경기',
    '인천광역시  Incheon': '인천',
    '5개광역시 5 Large Cities': '5개 광역시',
    '부산광역시  Busan': '부산',
    '대구광역시  Daegu': '대구',
    '광주광역시  Gwangju': '광주',
    '대전광역시  Daejeon': '대전',
    '울산광역시  Ulsan': '울산',
    '기타지방 Non Metropolitan Area': '기타지방',
    '세종특별자치시  Sejong': '세종',
    '강원특별자치도 Gangwon-do': '강원',
    '충청북도  ChungCheongbuk-do': '충북',
    '충청남도  ChungCheongnam-do': '충남',
    '전북특별자치도  Jeollabuk-do': '전북',
    '전라남도  Jeollanam-do': '전남',
    '경상북도  Gyeongsangbuk-do': '경북',
    '경상남도  Gyeongsangnam-do': '경남',
    '제주특별자치도 Jeju': '제주'
};

// 가로 막대 차트 표시 (이번주/지난주 비교)
function displayBarCharts(timeSeriesData) {
    // 최근 2주 데이터 추출
    const weeks = [...new Set(timeSeriesData.map(item => item.week))].sort();
    const latestWeek = weeks[weeks.length - 1];  // 이번주
    const previousWeek = weeks[weeks.length - 2]; // 지난주

    console.log('최근 2주:', latestWeek, previousWeek);

    // 표시할 지역 순서 정의 (영어 이름)
    const displayRegions = [
        'Total',
        'Seoul Metropolitan Area',
        'Seoul', 'Gyeonggi-do', 'Incheon',
        '5 Large Cities',
        'Busan', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan',
        'Non-Metropolitan Area',
        'Sejong', 'Gangwon-do', 'Chungcheongbuk-do', 'Chungcheongnam-do ',
        'Jeollabuk-do', 'Jeollanam-do', 'Gyeongsangbuk-do', 'Gyeongsangnam-do', 'Jeju/ Seogwipo'
    ];

    // 매매 데이터 준비
    const tradeData = prepareBarChartData(timeSeriesData, displayRegions, latestWeek, previousWeek, 'trade');

    // 전세 데이터 준비
    const jeonseData = prepareBarChartData(timeSeriesData, displayRegions, latestWeek, previousWeek, 'jeonse');

    // 매매 증감 차트
    displayBarChart('tradeBarChart', tradeData, '주간 매매증감', 'trade');

    // 전세 증감 차트
    displayBarChart('jeonseBarChart', jeonseData, '주간 전세증감', 'jeonse');
}

// 바 차트 데이터 준비 함수
function prepareBarChartData(timeSeriesData, displayRegions, latestWeek, previousWeek, dataType) {
    const labels = [];
    const currentWeekData = [];
    const previousWeekData = [];

    displayRegions.forEach(engName => {
        const korName = regionNameMap[engName] || engName;

        // 이번주 데이터
        const currentItem = timeSeriesData.find(item =>
            item.region === engName && item.week === latestWeek && item.type === dataType
        );

        // 지난주 데이터
        const previousItem = timeSeriesData.find(item =>
            item.region === engName && item.week === previousWeek && item.type === dataType
        );

        if (currentItem || previousItem) {
            labels.push(korName);
            currentWeekData.push(currentItem ? parseFloat(currentItem.rate) : 0);
            previousWeekData.push(previousItem ? parseFloat(previousItem.rate) : 0);
        }
    });

    return {
        labels: labels,
        currentWeek: currentWeekData,
        previousWeek: previousWeekData
    };
}

function displayBarChart(canvasId, chartData, title, chartType) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // 기존 차트 제거
    if (canvasId === 'tradeBarChart' && tradeBarChart) {
        tradeBarChart.destroy();
    } else if (canvasId === 'jeonseBarChart' && jeonseBarChart) {
        jeonseBarChart.destroy();
    }

    // 색상 설정 (매매=오렌지, 전세=초록)
    const colors = chartType === 'trade' ? {
        current: 'rgba(255, 140, 0, 0.8)',      // 진한 오렌지 (이번주)
        previous: 'rgba(255, 200, 124, 0.5)'    // 연한 오렌지 (지난주)
    } : {
        current: 'rgba(34, 139, 34, 0.8)',      // 진한 초록 (이번주)
        previous: 'rgba(144, 238, 144, 0.5)'    // 연한 초록 (지난주)
    };

    // 차트 생성
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: '이번주',
                    data: chartData.currentWeek,
                    backgroundColor: colors.current,
                    borderColor: colors.current,
                    borderWidth: 1
                },
                {
                    label: '지난주',
                    data: chartData.previousWeek,
                    backgroundColor: colors.previous,
                    borderColor: colors.previous,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatRate(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatRate(value);
                        },
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });

    if (canvasId === 'tradeBarChart') {
        tradeBarChart = newChart;
    } else if (canvasId === 'jeonseBarChart') {
        jeonseBarChart = newChart;
    }
}

// 히트맵 테이블 표시
function displayHeatmapTable(timeSeriesData) {
    const tbody = document.getElementById('heatmapTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // 최근 2주 데이터 추출
    const weeks = [...new Set(timeSeriesData.map(item => item.week))].sort();
    const latestWeek = weeks[weeks.length - 1];
    const previousWeek = weeks[weeks.length - 2];

    console.log('테이블 - 최근 2주:', latestWeek, previousWeek);

    // 표시할 지역 순서
    const displayRegions = [
        'Total',
        'Seoul Metropolitan Area',
        'Seoul', 'Gyeonggi-do', 'Incheon',
        '5 Large Cities',
        'Busan', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan',
        'Non-Metropolitan Area',
        'Sejong', 'Gangwon-do', 'Chungcheongbuk-do', 'Chungcheongnam-do ',
        'Jeollabuk-do', 'Jeollanam-do', 'Gyeongsangbuk-do', 'Gyeongsangnam-do', 'Jeju/ Seogwipo'
    ];

    // 지역 그룹 배경색 정의
    const regionGroups = {
        'Total': 'group-national',
        'Seoul Metropolitan Area': 'group-capital',
        '5 Large Cities': 'group-metro',
        'Non-Metropolitan Area': 'group-other'
    };

    displayRegions.forEach(engName => {
        const korName = regionNameMap[engName] || engName;

        // 매매 데이터
        const tradeCurrent = timeSeriesData.find(item =>
            item.region === engName && item.week === latestWeek && item.type === 'trade'
        );
        const tradePrevious = timeSeriesData.find(item =>
            item.region === engName && item.week === previousWeek && item.type === 'trade'
        );

        // 전세 데이터
        const jeonseCurrent = timeSeriesData.find(item =>
            item.region === engName && item.week === latestWeek && item.type === 'jeonse'
        );
        const jeonsePrevious = timeSeriesData.find(item =>
            item.region === engName && item.week === previousWeek && item.type === 'jeonse'
        );

        // 값 추출
        const tradeCurrentVal = tradeCurrent ? parseFloat(tradeCurrent.rate) : null;
        const tradePreviousVal = tradePrevious ? parseFloat(tradePrevious.rate) : null;
        const tradeChange = (tradeCurrentVal !== null && tradePreviousVal !== null)
            ? tradeCurrentVal - tradePreviousVal : null;

        const jeonseCurrentVal = jeonseCurrent ? parseFloat(jeonseCurrent.rate) : null;
        const jeonsePreviousVal = jeonsePrevious ? parseFloat(jeonsePrevious.rate) : null;
        const jeonseChange = (jeonseCurrentVal !== null && jeonsePreviousVal !== null)
            ? jeonseCurrentVal - jeonsePreviousVal : null;

        // 행 생성
        const row = document.createElement('tr');

        // 지역명에 그룹 배경색 클래스 추가
        const groupClass = regionGroups[engName] || '';

        row.innerHTML = `
            <td class="region-name ${groupClass}">${korName}</td>
            ${createValueCell(tradeCurrentVal, 'current')}
            ${createChangeCell(tradeChange)}
            ${createValueCell(tradePreviousVal, 'previous')}
            ${createValueCell(jeonseCurrentVal, 'current')}
            ${createChangeCell(jeonseChange)}
            ${createValueCell(jeonsePreviousVal, 'previous')}
        `;

        tbody.appendChild(row);
    });
}

// 값 셀 생성 (배경색 바 포함)
function createValueCell(value, type) {
    if (value === null) {
        return '<td class="value-cell">-</td>';
    }

    const absValue = Math.abs(value);
    const maxValue = 0.3; // 최대값 기준
    const percentage = Math.min((absValue / maxValue) * 100, 100);

    const colorClass = value >= 0 ? 'positive' : 'negative';
    const barStyle = `width: ${percentage}%; background-color: ${value >= 0 ? 'rgba(255, 182, 193, 0.6)' : 'rgba(173, 216, 230, 0.6)'}`;

    return `
        <td class="value-cell ${colorClass}">
            <div class="value-bar" style="${barStyle}"></div>
            <span class="value-text">${value.toFixed(2)}</span>
        </td>
    `;
}

// 변동폭 셀 생성 (텍스트만)
function createChangeCell(value) {
    if (value === null) {
        return '<td class="change-cell">-</td>';
    }

    // 반올림 후 0.00이 되는지 확인
    const rounded = parseFloat(value.toFixed(2));
    if (rounded === 0) {
        return '<td class="change-cell neutral-text">0.00</td>';  // 기호 없이 중립 색상
    }

    const colorClass = value > 0 ? 'positive-text' : 'negative-text';
    const sign = value > 0 ? '+' : '';

    return `
        <td class="change-cell ${colorClass}">${sign}${value.toFixed(2)}</td>
    `;
}

// 멀티플 차트 표시 (수급지수)
function displayMultipleCharts(supplyIndexData) {
    console.log('=== Supply Index Charts ===');
    console.log('Buyer superiority data:', supplyIndexData.buyer_superiority ? supplyIndexData.buyer_superiority.length : 0);
    console.log('Jeonse supply data:', supplyIndexData.jeonse_supply ? supplyIndexData.jeonse_supply.length : 0);

    if (!supplyIndexData.buyer_superiority || !supplyIndexData.jeonse_supply) {
        console.warn('Supply index data is missing');
        return;
    }

    // 차트 설정: 각 권역별로 매수우위지수와 전세수급지수 차트 생성
    const chartConfigs = [
        {
            id: 'capitalBuyerIndex',
            regions: ['전국 Total', '수도권 Seoul Metropolitan Area', '서울특별시 Seoul', '경기도  Gyeonggi-do', '인천광역시  Incheon'],
            dataSource: 'buyer_superiority',
            title: '수도권 매수우위지수',
            yAxisLabel: '매수우위지수'
        },
        {
            id: 'capitalJeonseSupplyIndex',
            regions: ['전국 Total', '수도권 Seoul Metropolitan Area', '서울특별시 Seoul', '경기도  Gyeonggi-do', '인천광역시  Incheon'],
            dataSource: 'jeonse_supply',
            title: '수도권 전세수급지수',
            yAxisLabel: '전세수급지수'
        },
        {
            id: 'metroBuyerIndex',
            regions: ['5개광역시 5 Large Cities', '부산광역시  Busan', '대구광역시  Daegu', '광주광역시  Gwangju', '대전광역시  Daejeon', '울산광역시  Ulsan'],
            dataSource: 'buyer_superiority',
            title: '광역시 매수우위지수',
            yAxisLabel: '매수우위지수'
        },
        {
            id: 'metroJeonseSupplyIndex',
            regions: ['5개광역시 5 Large Cities', '부산광역시  Busan', '대구광역시  Daegu', '광주광역시  Gwangju', '대전광역시  Daejeon', '울산광역시  Ulsan'],
            dataSource: 'jeonse_supply',
            title: '광역시 전세수급지수',
            yAxisLabel: '전세수급지수'
        },
        {
            id: 'other1BuyerIndex',
            regions: ['기타지방 Non Metropolitan Area', '세종특별자치시  Sejong', '강원특별자치도 Gangwon-do', '충청북도  ChungCheongbuk-do', '충청남도  ChungCheongnam-do'],
            dataSource: 'buyer_superiority',
            title: '기타지방1 매수우위지수',
            yAxisLabel: '매수우위지수'
        },
        {
            id: 'other1JeonseSupplyIndex',
            regions: ['기타지방 Non Metropolitan Area', '세종특별자치시  Sejong', '강원특별자치도 Gangwon-do', '충청북도  ChungCheongbuk-do', '충청남도  ChungCheongnam-do'],
            dataSource: 'jeonse_supply',
            title: '기타지방1 전세수급지수',
            yAxisLabel: '전세수급지수'
        },
        {
            id: 'other2BuyerIndex',
            regions: ['전북특별자치도  Jeollabuk-do', '전라남도  Jeollanam-do', '경상북도  Gyeongsangbuk-do', '경상남도  Gyeongsangnam-do', '제주특별자치도 Jeju'],
            dataSource: 'buyer_superiority',
            title: '기타지방2 매수우위지수',
            yAxisLabel: '매수우위지수'
        },
        {
            id: 'other2JeonseSupplyIndex',
            regions: ['전북특별자치도  Jeollabuk-do', '전라남도  Jeollanam-do', '경상북도  Gyeongsangbuk-do', '경상남도  Gyeongsangnam-do', '제주특별자치도 Jeju'],
            dataSource: 'jeonse_supply',
            title: '기타지방2 전세수급지수',
            yAxisLabel: '전세수급지수'
        }
    ];

    chartConfigs.forEach(config => {
        displaySupplyIndexChart(config, supplyIndexData);
    });
}

function displaySupplyIndexChart(config, supplyIndexData) {
    const ctx = document.getElementById(config.id);
    if (!ctx) {
        console.warn(`Canvas not found: ${config.id}`);
        return;
    }

    // 기존 차트 제거
    if (multipleCharts[config.id]) {
        multipleCharts[config.id].destroy();
    }

    // 데이터 소스 선택
    const dataArray = supplyIndexData[config.dataSource];
    if (!dataArray) {
        console.warn(`Data source not found: ${config.dataSource}`);
        return;
    }

    // 모든 주차 추출
    const weeks = [...new Set(dataArray.map(item => item.week))].sort();

    // 지역명 한글 매핑 (범례 표시용)
    const regionKoreanNames = {
        '전국 Total': '전국',
        '수도권 Seoul Metropolitan Area': '수도권',
        '서울특별시 Seoul': '서울',
        '경기도  Gyeonggi-do': '경기',
        '인천광역시  Incheon': '인천',
        '5개광역시 5 Large Cities': '5개광역시',
        '부산광역시  Busan': '부산',
        '대구광역시  Daegu': '대구',
        '광주광역시  Gwangju': '광주',
        '대전광역시  Daejeon': '대전',
        '울산광역시  Ulsan': '울산',
        '기타지방 Non Metropolitan Area': '기타지방',
        '세종특별자치시  Sejong': '세종',
        '강원특별자치도 Gangwon-do': '강원',
        '충청북도  ChungCheongbuk-do': '충북',
        '충청남도  ChungCheongnam-do': '충남',
        '전북특별자치도  Jeollabuk-do': '전북',
        '전라남도  Jeollanam-do': '전남',
        '경상북도  Gyeongsangbuk-do': '경북',
        '경상남도  Gyeongsangnam-do': '경남',
        '제주특별자치도 Jeju': '제주'
    };

    // 각 지역별로 데이터셋 생성
    const datasets = [];
    config.regions.forEach((regionName, index) => {
        // 해당 지역의 데이터 필터링
        const regionData = dataArray.filter(item => {
            return item.region && item.region.trim() === regionName.trim();
        });

        if (regionData.length === 0) {
            console.warn(`No data found for region: ${regionName}`);
            return;
        }

        // 주차별 값 매핑
        const values = weeks.map(week => {
            const item = regionData.find(d => d.week === week);
            return item ? parseFloat(item.value) : null;
        });

        // 범례에 표시할 한글명
        const koreanName = regionKoreanNames[regionName] || regionName;

        datasets.push({
            label: koreanName,
            data: values,
            borderColor: getChartColor(index),
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: getChartColor(index),
            fill: false
        });
    });

    if (datasets.length === 0) {
        console.warn(`No datasets created for chart: ${config.id}`);
        return;
    }

    console.log(`Chart ${config.id}: Created ${datasets.length} datasets with ${weeks.length} weeks`);

    // 실제 데이터의 최대값과 최소값 계산
    let maxDataValue = -Infinity;
    let minDataValue = Infinity;
    datasets.forEach(dataset => {
        dataset.data.forEach(value => {
            if (value !== null && !isNaN(value)) {
                if (value > maxDataValue) maxDataValue = value;
                if (value < minDataValue) minDataValue = value;
            }
        });
    });

    // 유효한 데이터가 없는 경우 기본값 설정
    if (maxDataValue === -Infinity) maxDataValue = 100;
    if (minDataValue === Infinity) minDataValue = 0;

    // y축 범위 결정
    let yAxisMax, yAxisMin;

    if (config.dataSource === 'jeonse_supply') {
        // 전세수급지수: 최소값과 최대값 모두 동적으로 조정
        const margin = Math.max(10, (maxDataValue - minDataValue) * 0.1);  // 범위의 10% 또는 최소 10
        yAxisMax = Math.ceil((maxDataValue + margin) / 10) * 10;  // 10 단위로 올림
        yAxisMin = Math.floor((minDataValue - margin) / 10) * 10;  // 10 단위로 내림
        yAxisMin = Math.max(0, yAxisMin);  // 최소값이 음수가 되지 않도록
    } else {
        // 매수우위지수: 최소값은 0, 최대값만 동적으로 조정
        yAxisMin = 0;
        if (maxDataValue <= 0) {
            yAxisMax = 100;  // 데이터가 없는 경우 기본값
        } else {
            const margin = Math.max(10, maxDataValue * 0.15);  // 최소 10 또는 15% 여유
            yAxisMax = Math.ceil((maxDataValue + margin) / 10) * 10;  // 10 단위로 올림
        }
    }

    console.log(`Chart ${config.id}: Data range = [${minDataValue.toFixed(2)}, ${maxDataValue.toFixed(2)}], Y-axis range = [${yAxisMin}, ${yAxisMax}]`);

    // 수평 참조선 설정
    const annotations = {};
    if (config.dataSource === 'buyer_superiority') {
        // 매수우위지수 차트
        if (config.id === 'capitalBuyerIndex') {
            // 수도권: 60, 40에 수평선
            annotations.line60 = {
                type: 'line',
                yMin: 60,
                yMax: 60,
                borderColor: 'rgba(255, 193, 7, 0.7)',  // 노란색/황금색 (60선)
                borderWidth: 1.5
            };
            annotations.line40 = {
                type: 'line',
                yMin: 40,
                yMax: 40,
                borderColor: 'rgba(33, 150, 243, 0.7)',  // 파란색 (40선)
                borderWidth: 1.5
            };
        } else {
            // 광역시, 기타지방1, 기타지방2: 60, 40, 20에 수평선
            annotations.line60 = {
                type: 'line',
                yMin: 60,
                yMax: 60,
                borderColor: 'rgba(255, 193, 7, 0.7)',  // 노란색/황금색 (60선)
                borderWidth: 1.5
            };
            annotations.line40 = {
                type: 'line',
                yMin: 40,
                yMax: 40,
                borderColor: 'rgba(33, 150, 243, 0.7)',  // 파란색 (40선)
                borderWidth: 1.5
            };
            annotations.line20 = {
                type: 'line',
                yMin: 20,
                yMax: 20,
                borderColor: 'rgba(156, 39, 176, 0.7)',  // 보라색 (20선)
                borderWidth: 1.5
            };
        }
    } else if (config.dataSource === 'jeonse_supply') {
        // 전세수급지수 차트: 150에 수평선
        annotations.line150 = {
            type: 'line',
            yMin: 150,
            yMax: 150,
            borderColor: 'rgba(244, 67, 54, 0.7)',  // 빨간색 (150선)
            borderWidth: 2
        };
    }

    // 차트 생성
    multipleCharts[config.id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 9
                        },
                        padding: 6,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: yAxisMin,
                    max: yAxisMax,
                    ticks: {
                        font: {
                            size: 9
                        },
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 8
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Top 10 증감률 차트 및 히트맵 표시
function displayTop10Charts(timeSeriesData) {
    console.log('=== Top 10 Charts ===');

    // 최근 주차 데이터 추출
    const weeks = [...new Set(timeSeriesData.map(item => item.week))].sort();
    const latestWeek = weeks[weeks.length - 1];

    // 최근 5-6주 선택 (최대 6주)
    const recentWeeks = weeks.slice(-6);

    console.log('Latest week:', latestWeek);
    console.log('Recent weeks for heatmap:', recentWeeks);

    // 매매 데이터 처리
    const tradeData = timeSeriesData.filter(item => item.type === 'trade' && item.week === latestWeek);
    const tradeTop10 = getTop10Regions(tradeData, recentWeeks, timeSeriesData, 'trade', false);
    const tradeBottom10 = getTop10Regions(tradeData, recentWeeks, timeSeriesData, 'trade', true);

    // 전세 데이터 처리
    const jeonseData = timeSeriesData.filter(item => item.type === 'jeonse' && item.week === latestWeek);
    const jeonseTop10 = getTop10Regions(jeonseData, recentWeeks, timeSeriesData, 'jeonse', false);
    const jeonseBottom10 = getTop10Regions(jeonseData, recentWeeks, timeSeriesData, 'jeonse', true);

    // 매매 상위 차트 생성
    displayTop10BarChart('tradeTop10BarChart', tradeTop10, '매매 증감률 상위', false);
    displayTop10Heatmap('tradeTop10HeatmapTable', tradeTop10, recentWeeks, false);

    // 전세 상위 차트 생성
    displayTop10BarChart('jeonseTop10BarChart', jeonseTop10, '전세 증감률 상위', false);
    displayTop10Heatmap('jeonseTop10HeatmapTable', jeonseTop10, recentWeeks, false);

    // 매매 하위 차트 생성
    displayTop10BarChart('tradeBottom10BarChart', tradeBottom10, '매매 증감률 하위', true);
    displayTop10Heatmap('tradeBottom10HeatmapTable', tradeBottom10, recentWeeks, true);

    // 전세 하위 차트 생성
    displayTop10BarChart('jeonseBottom10BarChart', jeonseBottom10, '전세 증감률 하위', true);
    displayTop10Heatmap('jeonseBottom10HeatmapTable', jeonseBottom10, recentWeeks, true);
}

// 상위/하위 10개 지역 추출 및 히트맵 데이터 준비
function getTop10Regions(latestWeekData, recentWeeks, allTimeSeriesData, dataType, ascending = false) {
    // 집계 지역 제외 (Total, Seoul Metropolitan Area, 5 Large Cities, Non-Metropolitan Area)
    const excludeRegions = ['Total', 'Seoul Metropolitan Area', '5 Large Cities', 'Non-Metropolitan Area'];

    // 개별 지역만 필터링
    const individualRegions = latestWeekData.filter(item => !excludeRegions.includes(item.region));

    // 증감률 기준 정렬 후 상위/하위 10개
    const top10 = individualRegions
        .sort((a, b) => ascending ? parseFloat(a.rate) - parseFloat(b.rate) : parseFloat(b.rate) - parseFloat(a.rate))
        .slice(0, 10);

    // 각 지역에 대해 최근 주차 데이터 추가
    const top10WithHistory = top10.map(region => {
        const weeklyData = {};
        recentWeeks.forEach(week => {
            const weekData = allTimeSeriesData.find(item =>
                item.region === region.region &&
                item.week === week &&
                item.type === dataType
            );
            weeklyData[week] = weekData ? parseFloat(weekData.rate) : null;
        });

        return {
            region: region.region,
            currentRate: parseFloat(region.rate),
            weeklyData: weeklyData
        };
    });

    console.log(`Top 10 ${dataType} regions:`, top10WithHistory);
    return top10WithHistory;
}

// Top 10 가로 막대 차트
function displayTop10BarChart(canvasId, top10Data, title, isBottom = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // 기존 차트 제거
    if (canvasId === 'tradeTop10BarChart' && tradeTop10BarChart) {
        tradeTop10BarChart.destroy();
    } else if (canvasId === 'jeonseTop10BarChart' && jeonseTop10BarChart) {
        jeonseTop10BarChart.destroy();
    } else if (canvasId === 'tradeBottom10BarChart' && tradeBottom10BarChart) {
        tradeBottom10BarChart.destroy();
    } else if (canvasId === 'jeonseBottom10BarChart' && jeonseBottom10BarChart) {
        jeonseBottom10BarChart.destroy();
    }

    // 지역명 한글 변환
    const labels = top10Data.map(item => regionNameMap[item.region] || item.region);
    const data = top10Data.map(item => item.currentRate);

    // 색상 설정 (상위: 빨강, 하위: 파랑)
    const bgColor = isBottom ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    const borderColor = isBottom ? 'rgba(59, 130, 246, 1)' : 'rgba(239, 68, 68, 1)';

    // 차트 생성
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatRate(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        },
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });

    // 차트 인스턴스 저장
    if (canvasId === 'tradeTop10BarChart') {
        tradeTop10BarChart = newChart;
    } else if (canvasId === 'jeonseTop10BarChart') {
        jeonseTop10BarChart = newChart;
    } else if (canvasId === 'tradeBottom10BarChart') {
        tradeBottom10BarChart = newChart;
    } else if (canvasId === 'jeonseBottom10BarChart') {
        jeonseBottom10BarChart = newChart;
    }
}

// Top 10 히트맵 테이블 생성
function displayTop10Heatmap(tableId, top10Data, weeks, isBottom = false) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.innerHTML = '';

    // 주차를 역순으로 정렬 (최신 날짜가 왼쪽에 오도록)
    const reversedWeeks = [...weeks].reverse();

    // 헤더 생성
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // 지역명 헤더
    const regionHeader = document.createElement('th');
    regionHeader.textContent = '지역명';
    regionHeader.className = 'top10-region-header';
    headerRow.appendChild(regionHeader);

    // 주차 헤더 (역순)
    reversedWeeks.forEach(week => {
        const th = document.createElement('th');
        th.textContent = week;
        th.className = 'top10-week-header';
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 데이터의 최소/최대값 계산 (색상 스케일용)
    let allValues = [];
    top10Data.forEach(region => {
        Object.values(region.weeklyData).forEach(val => {
            if (val !== null) allValues.push(val);
        });
    });
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    // 바디 생성
    const tbody = document.createElement('tbody');
    top10Data.forEach(region => {
        const row = document.createElement('tr');

        // 지역명
        const regionCell = document.createElement('td');
        regionCell.textContent = regionNameMap[region.region] || region.region;
        regionCell.className = 'top10-region-cell';
        row.appendChild(regionCell);

        // 주차별 데이터 (역순)
        reversedWeeks.forEach(week => {
            const cell = document.createElement('td');
            const value = region.weeklyData[week];

            if (value !== null) {
                cell.textContent = value.toFixed(2);
                cell.className = 'top10-value-cell';

                // 색상 계산
                const intensity = (value - minValue) / (maxValue - minValue);

                if (isBottom) {
                    // 하위 Top 10: 파란색 계열 (값이 낮을수록 진한 파란색)
                    const red = Math.floor(59 + (255 - 59) * intensity);
                    const green = Math.floor(130 + (255 - 130) * intensity);
                    const blue = 246;
                    cell.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${0.3 + (1 - intensity) * 0.5})`;
                } else {
                    // 상위 Top 10: 빨간색 계열 (값이 높을수록 진한 빨간색)
                    const red = 239;
                    const green = Math.floor(68 + (255 - 68) * (1 - intensity));
                    const blue = Math.floor(68 + (255 - 68) * (1 - intensity));
                    cell.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${0.3 + intensity * 0.5})`;
                }

                // 진한 배경에는 흰색 텍스트
                if ((isBottom && intensity < 0.4) || (!isBottom && intensity > 0.6)) {
                    cell.style.color = '#ffffff';
                }
            } else {
                cell.textContent = '-';
                cell.className = 'top10-value-cell';
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);
}

// =============================================================================
// 업데이트 히스토리 (공지사항) 기능
// =============================================================================

// 공지사항 리스트 렌더링
function renderNoticeList() {
    const noticeList = document.getElementById('noticeList');
    if (!noticeList) return;

    noticeList.innerHTML = '';

    updateHistory.forEach((item, index) => {
        const noticeItem = document.createElement('div');
        noticeItem.className = 'notice-item';
        noticeItem.dataset.index = index;

        noticeItem.innerHTML = `
            <span class="notice-item-version">${item.version}</span>
            <div class="notice-item-content">
                <div class="notice-item-title">${item.title}</div>
                <div class="notice-item-date">${item.date}</div>
            </div>
            <span class="notice-item-arrow">›</span>
        `;

        noticeItem.addEventListener('click', () => openNoticeModal(index));
        noticeList.appendChild(noticeItem);
    });
}

// 공지사항 모달 열기
function openNoticeModal(index) {
    const item = updateHistory[index];
    if (!item) return;

    const modal = document.getElementById('noticeModal');
    const modalVersion = document.getElementById('modalVersion');
    const modalDate = document.getElementById('modalDate');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalVersion.textContent = item.version;
    modalDate.textContent = item.date;
    modalTitle.textContent = item.title;

    // 변경사항 리스트 생성
    const ul = document.createElement('ul');
    item.changes.forEach(change => {
        const li = document.createElement('li');
        li.textContent = change;
        ul.appendChild(li);
    });
    modalBody.innerHTML = '';
    modalBody.appendChild(ul);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

// 공지사항 모달 닫기
function closeNoticeModal() {
    const modal = document.getElementById('noticeModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // 배경 스크롤 복원
}

// 공지사항 모달 이벤트 초기화
function initializeNoticeModal() {
    const modal = document.getElementById('noticeModal');
    const closeBtn = document.getElementById('modalClose');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeNoticeModal);
    }

    // 모달 배경 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeNoticeModal();
            }
        });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNoticeModal();
        }
    });

    // 공지사항 리스트 렌더링
    renderNoticeList();
}
