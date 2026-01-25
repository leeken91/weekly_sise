#!/usr/bin/env python3
"""
KB 부동산 엑셀 → JSON 변환 스크립트
GitHub Actions에서 자동 실행됩니다.
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

# 기존 parser와 config 임포트
from parser import KBRealEstateParser
import pandas as pd
import numpy as np

# 경로 설정
BASE_DIR = Path(__file__).parent.parent
EXCEL_FILE = BASE_DIR / 'data' / 'latest.xlsx'
OUTPUT_JSON = BASE_DIR / 'docs' / 'data' / 'latest.json'


def clean_data_for_json(obj):
    """pandas NaT, NaN, Timestamp 등을 JSON 호환 형식으로 변환"""
    if isinstance(obj, dict):
        return {key: clean_data_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [clean_data_for_json(item) for item in obj]
    elif isinstance(obj, pd.Timestamp):
        if pd.isna(obj):
            return None
        return obj.strftime('%Y-%m-%d')
    elif isinstance(obj, (pd.NaT.__class__, type(pd.NaT))):
        return None
    elif pd.isna(obj):
        return None
    elif isinstance(obj, (np.integer, np.floating)):
        return obj.item()
    else:
        return obj


def convert_excel_to_json():
    """엑셀 파일을 JSON으로 변환"""

    print(f"\n{'='*80}")
    print(f"KB 부동산 엑셀 → JSON 변환 시작")
    print(f"{'='*80}")
    print(f"엑셀 파일: {EXCEL_FILE}")
    print(f"출력 파일: {OUTPUT_JSON}")

    if not EXCEL_FILE.exists():
        print(f"\n❌ 오류: 엑셀 파일을 찾을 수 없습니다: {EXCEL_FILE}")
        sys.exit(1)

    try:
        # 파서 초기화
        print(f"\n파서 초기화 중...")
        parser = KBRealEstateParser(EXCEL_FILE)

        # 모든 시트 파싱
        print(f"엑셀 파일 파싱 중...")
        parsed_data = parser.parse_all_sheets()

        # 통계 생성
        print(f"통계 생성 중...")
        stats = parser.get_statistics()

        # 요약 시트 데이터 추출
        summary = parsed_data.get('요약', {})

        # JavaScript가 기대하는 형식으로 데이터 변환
        response_data = {
            'success': True,
            'survey_date': summary.get('survey_date'),
            'national': summary.get('national_stats', {}),
            'regional': summary.get('regional_stats', {}),
            'rankings': {
                'rising': summary.get('trade', {}).get('top_rising', []),
                'falling': summary.get('trade', {}).get('top_falling', [])
            },
            'time_series': [],
            'supply_index': {
                'buyer_superiority': [],
                'jeonse_supply': []
            }
        }

        # 증감 시트 및 수급 시트에서 시계열 데이터 추출
        for sheet_name, sheet_data in parsed_data.items():
            if sheet_data and isinstance(sheet_data, dict) and 'recent_weeks' in sheet_data:

                if '매매증감' in sheet_name or '전세증감' in sheet_name:
                    # 증감 시트 처리
                    data_type = 'trade' if '매매' in sheet_name else 'jeonse'

                    for weekly_data in sheet_data['recent_weeks']:
                        if isinstance(weekly_data, dict) and 'date' in weekly_data:
                            week = weekly_data.get('date')
                            for region_info in weekly_data.get('regions', []):
                                response_data['time_series'].append({
                                    'region': region_info.get('name'),
                                    'week': week,
                                    'rate': region_info.get('value'),
                                    'type': data_type
                                })

                elif '매수매도' in sheet_name:
                    # 매수매도 시트 처리 (매수우위지수)
                    for weekly_data in sheet_data['recent_weeks']:
                        if isinstance(weekly_data, dict) and 'date' in weekly_data:
                            week = weekly_data.get('date')
                            for region_info in weekly_data.get('regions', []):
                                response_data['supply_index']['buyer_superiority'].append({
                                    'region': region_info.get('name'),
                                    'week': week,
                                    'value': region_info.get('value')
                                })

                elif '전세수급' in sheet_name:
                    # 전세수급 시트 처리 (전세수급지수)
                    for weekly_data in sheet_data['recent_weeks']:
                        if isinstance(weekly_data, dict) and 'date' in weekly_data:
                            week = weekly_data.get('date')
                            for region_info in weekly_data.get('regions', []):
                                response_data['supply_index']['jeonse_supply'].append({
                                    'region': region_info.get('name'),
                                    'week': week,
                                    'value': region_info.get('value')
                                })

        # NaT, NaN 등을 JSON 호환 형식으로 정리
        response_data = clean_data_for_json(response_data)

        # JSON 파일 저장
        OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(response_data, f, ensure_ascii=False, indent=2)

        # 결과 출력
        file_size = OUTPUT_JSON.stat().st_size
        print(f"\n{'='*80}")
        print(f"✅ 변환 완료!")
        print(f"{'='*80}")
        print(f"출력 파일: {OUTPUT_JSON}")
        print(f"파일 크기: {file_size / 1024:.1f} KB ({file_size / 1024 / 1024:.2f} MB)")
        print(f"업데이트 날짜: {response_data.get('survey_date', 'N/A')}")
        print(f"시계열 데이터: {len(response_data['time_series']):,}개")
        print(f"매수우위지수: {len(response_data['supply_index']['buyer_superiority']):,}개")
        print(f"전세수급지수: {len(response_data['supply_index']['jeonse_supply']):,}개")
        print(f"{'='*80}\n")

        return 0

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(convert_excel_to_json())
