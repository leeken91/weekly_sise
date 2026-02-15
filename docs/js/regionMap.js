// 지역별 GeoJSON 지도 구현
// D3.js 없이 순수 SVG로 렌더링

// 전역 변수
let regionTimeSeriesData = null;
let currentRegionWeek = null;
let regionColorDensity = 0.8;
let currentRegionKey = 'seoul';
const regionGeoCache = {};
let regionAutoPlayInterval = null;

// 지역별 설정
const REGION_CONFIG = {
    seoul: {
        label: '서울',
        geoFile: 'data/geo/seoul.json',
        districtMapping: {
            'Gangdong-gu': 'Gangdong-gu',
            'Songpa-gu': 'Songpa-gu',
            'Gangnam-gu': 'Gangnam-gu',
            'Seocho-gu': 'Seocho-gu',
            'Gwanak-gu': 'Gwanak-gu',
            'Dongjak-gu': 'Dongjak-gu',
            'Yeongdeungpo-gu': 'Yeongdeungpo-gu',
            'Geumcheon-gu': 'Geumcheon-gu',
            'Guro-gu': 'Guro-gu',
            'Gangseo-gu': 'Gangseo-gu',
            'Yangcheon-gu': 'Yangcheon-gu',
            'Mapo-gu': 'Mapo-gu',
            'Seodaemun-gu': 'Seodaemun-gu',
            'Eunpyeong-gu': 'Eunpyeong-gu',
            'Nowon-gu': 'Nowon-gu',
            'Dobong-gu': 'Dobong-gu',
            'Gangbuk-gu': 'Gangbuk-gu',
            'Seongbuk-gu': 'Seongbuk-gu',
            'Jungnang-gu': 'Jungnang-gu',
            'Dongdaemun-gu': 'Dongdaemun-gu',
            'Gwangjin-gu': 'Gwangjin-gu',
            'Seongdong-gu': 'Seongdong-gu',
            'Yongsan-gu': 'Yongsan-gu',
            'Jung-gu': 'Jung-gu',
            'Jongno-gu': 'Jongno-gu'
        },
        districtKorean: {
            'Gangdong-gu': '강동구', 'Songpa-gu': '송파구', 'Gangnam-gu': '강남구',
            'Seocho-gu': '서초구', 'Gwanak-gu': '관악구', 'Dongjak-gu': '동작구',
            'Yeongdeungpo-gu': '영등포구', 'Geumcheon-gu': '금천구', 'Guro-gu': '구로구',
            'Gangseo-gu': '강서구', 'Yangcheon-gu': '양천구', 'Mapo-gu': '마포구',
            'Seodaemun-gu': '서대문구', 'Eunpyeong-gu': '은평구', 'Nowon-gu': '노원구',
            'Dobong-gu': '도봉구', 'Gangbuk-gu': '강북구', 'Seongbuk-gu': '성북구',
            'Jungnang-gu': '중랑구', 'Dongdaemun-gu': '동대문구', 'Gwangjin-gu': '광진구',
            'Seongdong-gu': '성동구', 'Yongsan-gu': '용산구', 'Jung-gu': '중구',
            'Jongno-gu': '종로구'
        }
    },
    busan: {
        label: '부산',
        geoFile: 'data/geo/busan.json',
        districtMapping: {
            'Jung-gu': 'Jung-gu.1',
            'Dong-gu': 'Dong-gu',
            'Seo-gu': 'Seo-gu',
            'Yeongdo-gu': 'Yeongdo-gu',
            'Busanjin-gu': 'Busanjin-gu',
            'Dongnae-gu': 'Dongnae-gu',
            'Nam-gu': 'Nam-gu',
            'Buk-gu': 'Buk-gu',
            'Haeundae-gu': 'Haeundae-gu',
            'Saha-gu': 'Saha-gu',
            'Geumjeong-gu': 'Geumjeong-gu',
            'Gangseo-gu': 'Gangseo-gu.1',
            'Yeonje-gu': 'Yeonje-gu',
            'Suyeong-gu': 'Suyeong-gu',
            'Sasang-gu': 'Sasang-gu',
            'Gijang-gun': 'Gijang-gun'
        },
        districtKorean: {
            'Jung-gu': '중구', 'Dong-gu': '동구', 'Seo-gu': '서구',
            'Yeongdo-gu': '영도구', 'Busanjin-gu': '부산진구', 'Dongnae-gu': '동래구',
            'Nam-gu': '남구', 'Buk-gu': '북구', 'Haeundae-gu': '해운대구',
            'Saha-gu': '사하구', 'Geumjeong-gu': '금정구', 'Gangseo-gu': '강서구',
            'Yeonje-gu': '연제구', 'Suyeong-gu': '수영구', 'Sasang-gu': '사상구',
            'Gijang-gun': '기장군'
        }
    },
    daegu: {
        label: '대구',
        geoFile: 'data/geo/daegu.json',
        districtMapping: {
            'Jung-gu': 'Jung-gu ',
            'Dong-gu': 'Dong-gu ',
            'Seo-gu': 'Seo-gu ',
            'Nam-gu': 'Nam-gu.1',
            'Buk-gu': 'Buk-gu ',
            'Suseong-gu': 'Suseong-gu ',
            'Dalseo-gu': 'Dalseo-gu ',
            'Dalseong-gun': 'Dalseong-gun '
        },
        districtKorean: {
            'Jung-gu': '중구', 'Dong-gu': '동구', 'Seo-gu': '서구',
            'Nam-gu': '남구', 'Buk-gu': '북구', 'Suseong-gu': '수성구',
            'Dalseo-gu': '달서구', 'Dalseong-gun': '달성군'
        }
    },
    incheon: {
        label: '인천',
        geoFile: 'data/geo/incheon.json',
        excludeDistricts: ['Ganghwa-gun', 'Ongjin-gun'],
        districtMapping: {
            'Jung-gu': 'Jung-gu.2',
            'Dong-gu': 'Dong-gu.1',
            'Nam-gu': 'Michuhol-gu',
            'Yeonsu-gu': 'Yeonsu-gu',
            'Namdong-gu': 'Namdong-gu',
            'Bupyeong-gu': 'Bupyeong-gu',
            'Gyeyang-gu': 'Gyeyang-gu',
            'Seo-gu': 'Seo-gu.1'
        },
        districtKorean: {
            'Jung-gu': '중구', 'Dong-gu': '동구', 'Nam-gu': '미추홀구',
            'Yeonsu-gu': '연수구', 'Namdong-gu': '남동구', 'Bupyeong-gu': '부평구',
            'Gyeyang-gu': '계양구', 'Seo-gu': '서구'
        }
    },
    gwangju: {
        label: '광주',
        geoFile: 'data/geo/gwangju.json',
        districtMapping: {
            'Dong-gu': 'Dong-gu.2',
            'Seo-gu': 'Seo-gu.2',
            'Nam-gu': 'Nam-gu.2',
            'Buk-gu': 'Buk-gu.1',
            'Gwangsan-gu': 'Gwangsan-gu'
        },
        districtKorean: {
            'Dong-gu': '동구', 'Seo-gu': '서구', 'Nam-gu': '남구',
            'Buk-gu': '북구', 'Gwangsan-gu': '광산구'
        }
    },
    daejeon: {
        label: '대전',
        geoFile: 'data/geo/daejeon.json',
        districtMapping: {
            'Dong-gu': 'Dong-gu.3',
            'Jung-gu': 'Jung-gu.3',
            'Seo-gu': 'Seo-gu.3',
            'Yuseong-gu': 'Yuseong-gu',
            'Daedeok-gu': 'Daedeok-gu'
        },
        districtKorean: {
            'Dong-gu': '동구', 'Jung-gu': '중구', 'Seo-gu': '서구',
            'Yuseong-gu': '유성구', 'Daedeok-gu': '대덕구'
        }
    },
    ulsan: {
        label: '울산',
        geoFile: 'data/geo/ulsan.json',
        districtMapping: {
            'Jung-gu': 'Jung-gu.4',
            'Nam-gu': 'Nam-gu.3',
            'Dong-gu': 'Dong-gu.4',
            'Buk-gu': 'Buk-gu.2',
            'Ulju-gun': 'Ulju-gun'
        },
        districtKorean: {
            'Jung-gu': '중구', 'Nam-gu': '남구', 'Dong-gu': '동구',
            'Buk-gu': '북구', 'Ulju-gun': '울주군'
        }
    },
    gyeonggi: {
        label: '경기',
        geoFile: 'data/geo/gyeonggi.json',
        // GeoJSON name_eng → time_series key
        // GeoJSON has sub-city districts (수원시장안구 = Suwonsijangangu)
        // time_series has both city-level (Suwon) and district-level (Jangan-gu, etc.)
        // For cities with sub-districts in GeoJSON, map to the sub-district time_series key
        districtMapping: {
            // 수원시
            'Suwonsijangangu': 'Jangan-gu',
            'Suwonsigwonseongu': 'Gwonseon-gu',
            'Suwonsipaldalgu': 'Paldal-gu',
            'Suwonsiyeongtonggu': 'Yeongtong-gu',
            // 성남시
            'Seongnamsisujeonggu': 'Sujeong-gu',
            'Seongnamsijungwongu': 'Jungwon-gu',
            'Seongnamsibundanggu': 'Bundang-gu',
            // Not in time_series but present in GeoJSON
            'Seongnamsisungsangu': 'Sungsan-gu',
            // 안양시
            'Anyangsimanangu': 'Manan-gu',
            'Anyangsidongangu': 'Dongan-gu',
            // 부천시
            'Bucheonsiwonmigu': 'Wonmi-gu',
            'Bucheonsisosagu': 'Sosa-gu',
            'Bucheonsiojeonggu': 'Ojeong-gu',
            // 고양시
            'Goyangsideogyanggu': 'Deogyang-gu',
            'Goyangsiilsandonggu': 'Ilsandong-gu',
            'Goyangsiilsanseogu': 'Ilsanseo-gu',
            // 안산시
            'Ansansisangnokgu': 'Sangrok-gu',
            'Ansansidanwongu': 'Danwon-gu',
            // 용인시
            'Yonginsicheoingu': 'Cheoin-gu',
            'Yonginsigiheunggu': 'Giheung-gu',
            'Yonginsisujigu': 'Suji-gu',
            // 독립 시/군
            'Uijeongbu-si': 'Uijeongbu',
            'Dongducheon-si': 'Dongducheon',
            'Pyeongtaek-si': 'Pyeongtaek',
            'Gwangmyeong-si': 'Gwangmyeong',
            'Guri-si': 'Guri',
            'Namyangju-si': 'Namyangju',
            'Osan-si': 'Osan',
            'Siheung-si': 'Siheung',
            'Gunpo-si': 'Gunpo',
            'Uiwang-si': 'Uiwang',
            'Hanam-si': 'Hanam',
            'Paju-si': 'Paju',
            'Icheon-si': 'Icheon',
            'Anseong-si': 'Anseong',
            'Gimpo-si': 'Gimpo',
            'Gwacheon-si': 'Gwacheon',
            'Gwangju': 'Gwangju.1',
            'Hwaseongsi': 'Hwaseong',
            'Hwaseongsimansegu': 'Manse-gu',
            'Hwaseongsihyohaenggu': 'Hyohaeng-gu',
            'Hwaseongsibyeongjeomgu': 'Byeongjeom-gu',
            'Hwaseongsidongtangu': 'Dongtan-gu',
            'Yangjusi': 'Yangju',
            'Pocheonsi': 'Pocheon',
            'Yeoju-si': 'Yeoju',
            // 군
            'Yeoncheon-gun': 'Yeoncheon',
            'Gapyeong-gun': 'Gapyeong',
            'Yangpyeong-gun': 'Yangpyeong'
        },
        districtKorean: {
            'Suwonsijangangu': '수원 장안구', 'Suwonsigwonseongu': '수원 권선구',
            'Suwonsipaldalgu': '수원 팔달구', 'Suwonsiyeongtonggu': '수원 영통구',
            'Seongnamsisujeonggu': '성남 수정구', 'Seongnamsijungwongu': '성남 중원구',
            'Seongnamsibundanggu': '성남 분당구', 'Seongnamsisungsangu': '성남 성산구',
            'Anyangsimanangu': '안양 만안구', 'Anyangsidongangu': '안양 동안구',
            'Bucheonsiwonmigu': '부천 원미구', 'Bucheonsisosagu': '부천 소사구',
            'Bucheonsiojeonggu': '부천 오정구',
            'Goyangsideogyanggu': '고양 덕양구', 'Goyangsiilsandonggu': '고양 일산동구',
            'Goyangsiilsanseogu': '고양 일산서구',
            'Ansansisangnokgu': '안산 상록구', 'Ansansidanwongu': '안산 단원구',
            'Yonginsicheoingu': '용인 처인구', 'Yonginsigiheunggu': '용인 기흥구',
            'Yonginsisujigu': '용인 수지구',
            'Uijeongbu-si': '의정부시', 'Dongducheon-si': '동두천시',
            'Pyeongtaek-si': '평택시', 'Gwangmyeong-si': '광명시',
            'Guri-si': '구리시', 'Namyangju-si': '남양주시',
            'Osan-si': '오산시', 'Siheung-si': '시흥시',
            'Gunpo-si': '군포시', 'Uiwang-si': '의왕시',
            'Hanam-si': '하남시', 'Paju-si': '파주시',
            'Icheon-si': '이천시', 'Anseong-si': '안성시',
            'Gimpo-si': '김포시', 'Gwacheon-si': '과천시',
            'Gwangju': '광주시', 'Hwaseongsi': '화성시',
            'Hwaseongsimansegu': '화성 만세구', 'Hwaseongsihyohaenggu': '화성 효행구',
            'Hwaseongsibyeongjeomgu': '화성 병점구', 'Hwaseongsidongtangu': '화성 동탄구',
            'Yangjusi': '양주시', 'Pocheonsi': '포천시',
            'Yeoju-si': '여주시',
            'Yeoncheon-gun': '연천군', 'Gapyeong-gun': '가평군',
            'Yangpyeong-gun': '양평군'
        }
    }
};

// 색상 스케일 계산
function getRegionColor(value, density) {
    if (value === null || value === undefined) {
        return '#e0e0e0';
    }
    const maxAbs = 0.5 * (density || regionColorDensity);
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
function getRegionTextColor(backgroundColor) {
    const match = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#222';
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.6 ? '#ffffff' : '#222222';
}

// GeoJSON 좌표를 SVG 좌표로 변환
function projectRegionCoordinates(coordinates, uniformScale, latCorrection, offsetX, offsetY, bounds) {
    const [minLng, , , maxLat] = bounds;

    return coordinates.map(ring => {
        return ring.map(coord => {
            const x = (coord[0] - minLng) * latCorrection * uniformScale + offsetX;
            const y = (maxLat - coord[1]) * uniformScale + offsetY;
            return [x, y];
        });
    });
}

// 폴리곤의 중심점 계산
function getRegionPolygonCenter(coordinates) {
    const ring = coordinates[0];
    let signedArea = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < ring.length - 1; i++) {
        const x0 = ring[i][0];
        const y0 = ring[i][1];
        const x1 = ring[i + 1][0];
        const y1 = ring[i + 1][1];

        const a = x0 * y1 - x1 * y0;
        signedArea += a;
        cx += (x0 + x1) * a;
        cy += (y0 + y1) * a;
    }

    signedArea *= 0.5;
    if (Math.abs(signedArea) < 1e-10) {
        // Fallback: simple average
        let sx = 0, sy = 0;
        ring.forEach(c => { sx += c[0]; sy += c[1]; });
        return [sx / ring.length, sy / ring.length];
    }
    cx = cx / (6 * signedArea);
    cy = cy / (6 * signedArea);

    return [cx, cy];
}

// GeoJSON 바운딩 박스 계산 (MultiPolygon 지원)
function getRegionBounds(geoData) {
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    geoData.features.forEach(feature => {
        const geomType = feature.geometry.type;
        let polygons;
        if (geomType === 'MultiPolygon') {
            polygons = feature.geometry.coordinates;
        } else if (geomType === 'GeometryCollection') {
            polygons = [];
            feature.geometry.geometries.forEach(g => {
                if (g.type === 'Polygon') polygons.push(g.coordinates);
                else if (g.type === 'MultiPolygon') polygons.push(...g.coordinates);
            });
        } else {
            polygons = [feature.geometry.coordinates];
        }
        polygons.forEach(polygon => {
            polygon[0].forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                maxLng = Math.max(maxLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLat = Math.max(maxLat, coord[1]);
            });
        });
    });

    return [minLng, minLat, maxLng, maxLat];
}

// 지역 지도 생성 (MultiPolygon 지원)
function createRegionMap(containerId, geoData, data, type, config) {
    const container = document.getElementById(containerId);
    if (!container || !geoData) return;
    container.innerHTML = '';

    // 제외 지역 필터링
    const excludeSet = new Set(config.excludeDistricts || []);
    const filteredGeoData = excludeSet.size > 0
        ? { ...geoData, features: geoData.features.filter(f => !excludeSet.has(f.properties.name_eng)) }
        : geoData;

    const bounds = getRegionBounds(filteredGeoData);
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const geoWidth = maxLng - minLng;
    const geoHeight = maxLat - minLat;

    // 위도 보정: 한국 위도에서 경도 1도의 실제 거리는 위도 1도보다 짧음
    const centerLat = (minLat + maxLat) / 2;
    const latCorrection = Math.cos(centerLat * Math.PI / 180);
    const correctedGeoWidth = geoWidth * latCorrection;

    const viewBoxWidth = 500;
    const viewBoxHeight = 500;
    const padding = 25;
    const availableWidth = viewBoxWidth - padding * 2;
    const availableHeight = viewBoxHeight - padding * 2;

    const uniformScale = Math.min(availableWidth / correctedGeoWidth, availableHeight / geoHeight);

    const renderedWidth = correctedGeoWidth * uniformScale;
    const renderedHeight = geoHeight * uniformScale;

    const offsetX = (viewBoxWidth - renderedWidth) / 2;
    const offsetY = (viewBoxHeight - renderedHeight) / 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.backgroundColor = '#fafafa';

    // 텍스트 레이어를 나중에 추가하기 위한 배열
    const textElements = [];

    filteredGeoData.features.forEach(feature => {
        const districtName = feature.properties.name_eng;
        const koreanName = config.districtKorean[districtName] || feature.properties.name;
        const dataKey = config.districtMapping[districtName];
        const value = dataKey && data[dataKey] !== undefined ? data[dataKey] : null;
        const color = getRegionColor(value, regionColorDensity);

        const geomType = feature.geometry.type;
        let polygonsList;
        if (geomType === 'MultiPolygon') {
            polygonsList = feature.geometry.coordinates;
        } else if (geomType === 'GeometryCollection') {
            // GeometryCollection에서 Polygon/MultiPolygon만 추출
            polygonsList = [];
            feature.geometry.geometries.forEach(g => {
                if (g.type === 'Polygon') {
                    polygonsList.push(g.coordinates);
                } else if (g.type === 'MultiPolygon') {
                    polygonsList.push(...g.coordinates);
                }
            });
            if (polygonsList.length === 0) return;
        } else {
            polygonsList = [feature.geometry.coordinates];
        }

        // 가장 큰 폴리곤의 중심에 텍스트를 배치
        let largestArea = 0;
        let largestProjected = null;

        polygonsList.forEach(polygon => {
            const projectedCoords = projectRegionCoordinates(
                polygon, uniformScale, latCorrection, offsetX, offsetY, bounds
            );

            const pathData = projectedCoords[0].map((coord, i) => {
                return (i === 0 ? 'M' : 'L') + coord[0].toFixed(2) + ',' + coord[1].toFixed(2);
            }).join(' ') + ' Z';

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', color);
            path.setAttribute('stroke', '#666');
            path.setAttribute('stroke-width', '1');
            path.style.cursor = 'pointer';
            path.style.transition = 'all 0.2s ease';

            path.addEventListener('mouseenter', function() {
                this.setAttribute('stroke', '#000');
                this.setAttribute('stroke-width', '2');
                this.style.filter = 'brightness(0.95)';
            });
            path.addEventListener('mouseleave', function() {
                this.setAttribute('stroke', '#666');
                this.setAttribute('stroke-width', '1');
                this.style.filter = 'none';
            });

            const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            const displayValue = value !== null ? value.toFixed(2) + '%' : '데이터 없음';
            titleElement.textContent = `${koreanName}: ${displayValue}`;
            path.appendChild(titleElement);

            svg.appendChild(path);

            // 면적 계산 (가장 큰 폴리곤 찾기)
            const ring = projectedCoords[0];
            let area = 0;
            for (let i = 0; i < ring.length - 1; i++) {
                area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
            }
            area = Math.abs(area) / 2;
            if (area > largestArea) {
                largestArea = area;
                largestProjected = projectedCoords;
            }
        });

        // 텍스트는 가장 큰 폴리곤의 중심에 배치
        if (largestProjected) {
            const center = getRegionPolygonCenter(largestProjected);
            const textColor = getRegionTextColor(color);

            // 피쳐 수에 따라 폰트 크기 조절
            const featureCount = filteredGeoData.features.length;
            let fontSize = 9;
            if (featureCount > 30) fontSize = 7;
            else if (featureCount > 15) fontSize = 8;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', center[0]);
            text.setAttribute('y', center[1]);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', fontSize);
            text.setAttribute('font-weight', '600');
            text.setAttribute('fill', textColor);
            text.setAttribute('pointer-events', 'none');
            text.style.userSelect = 'none';
            text.textContent = koreanName;
            textElements.push(text);
        }
    });

    // 텍스트를 마지막에 추가 (폴리곤 위에 렌더링)
    textElements.forEach(t => svg.appendChild(t));

    container.appendChild(svg);
}

// 데이터 추출
function extractRegionDistrictDataForWeek(timeSeriesData, week, type, config) {
    if (!timeSeriesData || timeSeriesData.length === 0 || !week) return {};
    const data = {};
    const mappingValues = Object.values(config.districtMapping);

    timeSeriesData.forEach(item => {
        if (item.week === week && item.type === type) {
            const region = item.region.replace(/\n/g, ' ');
            if (mappingValues.includes(region)) {
                data[region] = parseFloat(item.rate);
            }
        }
    });

    return data;
}

// 지도 업데이트
function updateRegionMaps() {
    if (!regionTimeSeriesData || !currentRegionWeek) return;
    const config = REGION_CONFIG[currentRegionKey];
    const geoData = regionGeoCache[currentRegionKey];
    if (!config || !geoData) return;

    const tradeData = extractRegionDistrictDataForWeek(regionTimeSeriesData, currentRegionWeek, 'trade', config);
    createRegionMap('regionTradeMap', geoData, tradeData, 'trade', config);

    const jeonseData = extractRegionDistrictDataForWeek(regionTimeSeriesData, currentRegionWeek, 'jeonse', config);
    createRegionMap('regionJeonseMap', geoData, jeonseData, 'jeonse', config);

    const tradeDateEl = document.getElementById('regionTradeMapDate');
    const jeonseDateEl = document.getElementById('regionJeonseMapDate');
    if (tradeDateEl) tradeDateEl.textContent = `(${currentRegionWeek})`;
    if (jeonseDateEl) jeonseDateEl.textContent = `(${currentRegionWeek})`;
}

// 날짜 리스트 생성
function createRegionDateList(weeks) {
    const dateListContainer = document.getElementById('regionDateListContainer');
    if (!dateListContainer) return;
    dateListContainer.innerHTML = '';

    const sortedWeeks = [...weeks].sort().reverse();
    sortedWeeks.forEach(week => {
        const dateItem = document.createElement('div');
        dateItem.className = 'date-item';
        dateItem.textContent = week;
        dateItem.dataset.week = week;
        dateItem.addEventListener('click', function() {
            selectRegionWeek(week);
        });
        dateListContainer.appendChild(dateItem);
    });

    if (sortedWeeks.length > 0) {
        selectRegionWeek(sortedWeeks[0]);
    }
}

// 주차 선택
function selectRegionWeek(week) {
    currentRegionWeek = week;

    document.querySelectorAll('#regionDateListContainer .date-item').forEach(item => {
        if (item.dataset.week === week) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    const selectedDateDisplay = document.getElementById('regionSelectedDateDisplay');
    if (selectedDateDisplay) {
        selectedDateDisplay.textContent = week.replace(/-/g, '');
    }

    updateRegionMaps();
}

// 색상 밀도 조절
function updateRegionColorDensity(value) {
    regionColorDensity = parseFloat(value);
    const densityValue = document.getElementById('regionDensityValue');
    if (densityValue) {
        densityValue.textContent = value;
    }

    const maxValue = (0.8 * regionColorDensity).toFixed(1);
    const legendLabels = document.querySelector('#regionMapSection .legend-labels');
    if (legendLabels) {
        legendLabels.innerHTML = `
            <span>-${maxValue}%</span>
            <span>0%</span>
            <span>+${maxValue}%</span>
        `;
    }

    updateRegionMaps();
}

// GeoJSON 로드 (캐시 지원)
async function loadRegionGeoData(regionKey) {
    if (regionGeoCache[regionKey]) return regionGeoCache[regionKey];

    const config = REGION_CONFIG[regionKey];
    if (!config) return null;

    try {
        const response = await fetch(config.geoFile);
        if (!response.ok) throw new Error(`GeoJSON 로드 실패: ${response.status}`);
        const data = await response.json();
        regionGeoCache[regionKey] = data;
        console.log(`${config.label} GeoJSON 로드 완료: ${data.features.length}개 구/군/시`);
        return data;
    } catch (error) {
        console.error(`${config.label} GeoJSON 로드 오류:`, error);
        return null;
    }
}

// 지역에 해당하는 주차 목록 구하기
function getRegionWeeks(config) {
    const mappingValues = Object.values(config.districtMapping);
    const weeksWithData = regionTimeSeriesData.filter(item => {
        const region = item.region.replace(/\n/g, ' ');
        return mappingValues.includes(region);
    });
    return [...new Set(weeksWithData.map(item => item.week))].sort();
}

// 지역 선택
async function selectRegion(regionKey) {
    currentRegionKey = regionKey;
    const config = REGION_CONFIG[regionKey];
    if (!config) return;

    // 버튼 UI 업데이트
    document.querySelectorAll('.region-btn').forEach(btn => {
        if (btn.dataset.region === regionKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 제목 업데이트
    const title = document.getElementById('regionMapTitle');
    if (title) title.textContent = `${config.label} 지역 증감률 지도`;
    const tradeTitle = document.getElementById('regionTradeTitle');
    if (tradeTitle) tradeTitle.textContent = `${config.label} 매매 증감률`;
    const jeonseTitle = document.getElementById('regionJeonseTitle');
    if (jeonseTitle) jeonseTitle.textContent = `${config.label} 전세 증감률`;

    // GeoJSON 로드
    const geoData = await loadRegionGeoData(regionKey);
    if (!geoData) return;

    // 날짜 리스트 업데이트
    const weeks = getRegionWeeks(config);
    if (weeks.length === 0) {
        console.warn(`${config.label} 데이터가 없습니다.`);
        return;
    }
    createRegionDateList(weeks);
}

// 자동 모드 토글
function toggleRegionAutoPlay() {
    const toggle = document.getElementById('regionAutoPlayToggle');
    if (toggle && toggle.checked) {
        startRegionAutoPlay();
    } else {
        stopRegionAutoPlay();
    }
}

// 자동 모드 시작
function startRegionAutoPlay() {
    if (regionAutoPlayInterval) return;
    const config = REGION_CONFIG[currentRegionKey];
    if (!config) return;
    const weeks = getRegionWeeks(config);
    if (weeks.length === 0) return;

    let currentIndex = weeks.indexOf(currentRegionWeek);
    regionAutoPlayInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= weeks.length) {
            currentIndex = 0;
        }
        selectRegionWeek(weeks[currentIndex]);
    }, 1000);
}

// 자동 모드 정지
function stopRegionAutoPlay() {
    if (regionAutoPlayInterval) {
        clearInterval(regionAutoPlayInterval);
        regionAutoPlayInterval = null;
    }
}

// 초기화 (main.js에서 호출)
async function initializeRegionMaps(timeSeriesData) {
    console.log('지역별 GeoJSON 지도 초기화...');
    regionTimeSeriesData = timeSeriesData;

    // 지역 버튼 이벤트 바인딩
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            stopRegionAutoPlay();
            const toggle = document.getElementById('regionAutoPlayToggle');
            if (toggle) toggle.checked = false;
            selectRegion(this.dataset.region);
        });
    });

    // 자동 모드 토글 이벤트
    const autoPlayToggle = document.getElementById('regionAutoPlayToggle');
    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('change', toggleRegionAutoPlay);
    }

    // 색상 밀도 슬라이더 이벤트
    const colorDensitySlider = document.getElementById('regionColorDensitySlider');
    if (colorDensitySlider) {
        colorDensitySlider.addEventListener('input', function() {
            updateRegionColorDensity(this.value);
        });
    }

    // 기본 지역(서울) 로드
    await selectRegion('seoul');
}
