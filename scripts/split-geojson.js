#!/usr/bin/env node
// GeoJSON 전국 시군구 데이터를 지역별로 분리하는 스크립트
// Usage: node scripts/split-geojson.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_municipalities_geo_simple.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'data', 'geo');

// 행정구역 코드 prefix → 파일명 매핑
const REGION_PREFIX = {
    '11': 'seoul',
    '21': 'busan',
    '22': 'daegu',
    '23': 'incheon',
    '24': 'gwangju',
    '25': 'daejeon',
    '26': 'ulsan',
    '31': 'gyeonggi'
};

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetch(res.headers.location).then(resolve, reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    console.log('GeoJSON 다운로드 중...');
    const raw = await fetch(SOURCE_URL);
    const geojson = JSON.parse(raw);
    console.log(`총 ${geojson.features.length}개 시군구 로드됨`);

    // 출력 디렉토리 생성
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 지역별 분리
    for (const [prefix, filename] of Object.entries(REGION_PREFIX)) {
        const features = geojson.features.filter(f => {
            const code = String(f.properties.code);
            return code.startsWith(prefix);
        });

        const regionGeoJSON = {
            type: 'FeatureCollection',
            features: features
        };

        const outputPath = path.join(OUTPUT_DIR, `${filename}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(regionGeoJSON));
        console.log(`${filename}.json: ${features.length}개 구/군/시`);
    }

    console.log('\n완료! 파일 위치:', OUTPUT_DIR);
}

main().catch(err => {
    console.error('오류:', err);
    process.exit(1);
});
