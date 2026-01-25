from config import ParserConfig

from datetime import datetime
from pathlib import Path

import pandas as pd
import logging

logger = logging.getLogger(__name__)

class KBRealEstateParser:
    """KB 부동산 엑셀 파일 파서"""

    def __init__(self, file_path):
        self.file_path = Path(file_path)
        self.data = {}
        
        if not self.file_path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        if self.file_path.suffix not in ParserConfig.ALLOWED_EXTENSIONS:
            raise ValueError(f"지원하지 않는 파일 형식입니다: {self.file_path.suffix}")
    
    def parse_all_sheets(self):
        """모든 시트 파싱"""

        try:
            xl_file = pd.ExcelFile(self.file_path)

            for sheet_name in xl_file.sheet_names:
                try:
                    logger.info(f"\n[parse_all_sheets] 시트 파싱 시작: {sheet_name}")
                    self.data[sheet_name] = self.parse_sheet(sheet_name)
                    logger.info(f"[parse_all_sheets] 시트 파싱 결과: {type(self.data[sheet_name])}")
                except Exception as e:
                    logger.error(f"!!! 시트 '{sheet_name}' 파싱 실패: {e}")
                    import traceback
                    logger.error(traceback.format_exc())
                    self.data[sheet_name] = None
            return self.data
        except Exception as e:
            raise RuntimeError(f"엑셀 파일 읽기 실패: {e}")
    
    def parse_sheet(self, sheet_name):
        """개별 시트 파싱"""

        logger.info(f"\n>>> parse_sheet 호출됨: {sheet_name}")

        if sheet_name == ParserConfig.SUMMARY_SHEET:
            logger.info(f"  -> 요약 시트로 처리")
            return self._parse_summary_sheet()
        elif '매매증감' in sheet_name or '전세증감' in sheet_name:
            logger.info(f"  -> 증감 시트로 처리: {'매매증감' in sheet_name}, {'전세증감' in sheet_name}")
            result = self._parse_change_sheet(sheet_name)
            logger.info(f"  -> 증감 시트 결과 타입: {type(result)}")
            return result
        elif '매수매도' in sheet_name or '전세수급' in sheet_name:
            logger.info(f"  -> 수급 시트로 처리: {'매수매도' in sheet_name}, {'전세수급' in sheet_name}")
            result = self._parse_supply_sheet(sheet_name)
            logger.info(f"  -> 수급 시트 결과 타입: {type(result)}")
            return result
        else:
            logger.info(f"  -> 일반 시트로 처리")
            return self._parse_generic_sheet(sheet_name)
    
    def _parse_summary_sheet(self):
        """요약 시트 파싱"""
        df = pd.read_excel(self.file_path, sheet_name=ParserConfig.SUMMARY_SHEET, header=None)

        # 매매증감/전세증감 시트에서 전국/지역 통계 추출
        national_stats, regional_stats = self._extract_stats_from_change_sheets()

        result = {
            'survey_date': self._extract_survey_date(df),
            'national_stats': national_stats,
            'regional_stats': regional_stats,
            'trade': {
                'top_rising': self._extract_ranking_data(df, '매매', '상승'),
                'top_falling': self._extract_ranking_data(df, '매매', '하락')
            },
            'jeonse': {
                'top_rising': self._extract_ranking_data(df, '전세', '상승'),
                'top_falling': self._extract_ranking_data(df, '전세', '하락')
            }
        }

        return result

    def _extract_stats_from_change_sheets(self):
        """증감 시트에서 전국/지역별 통계 추출 (현재주 + 전주대비 변동)"""
        try:
            # 매매증감 시트 읽기
            df_trade = pd.read_excel(self.file_path, sheet_name='1.매매증감', header=2)
            valid_trade = df_trade[df_trade['Classification'].notna()]
            latest_trade = valid_trade.iloc[-1] if len(valid_trade) > 0 else None
            prev_trade = valid_trade.iloc[-2] if len(valid_trade) > 1 else None

            # 전세증감 시트 읽기
            df_jeonse = pd.read_excel(self.file_path, sheet_name='2.전세증감', header=2)
            valid_jeonse = df_jeonse[df_jeonse['Classification'].notna()]
            latest_jeonse = valid_jeonse.iloc[-1] if len(valid_jeonse) > 0 else None
            prev_jeonse = valid_jeonse.iloc[-2] if len(valid_jeonse) > 1 else None

            # 광역시 목록
            metro_cities = ['Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Ulsan']

            # 광역시 평균 계산 (현재주)
            metro_trade = None
            metro_jeonse = None

            if latest_trade is not None:
                metro_values = [latest_trade[city] for city in metro_cities if city in latest_trade.index and pd.notna(latest_trade[city])]
                metro_trade = sum(metro_values) / len(metro_values) if metro_values else None

            if latest_jeonse is not None:
                metro_values = [latest_jeonse[city] for city in metro_cities if city in latest_jeonse.index and pd.notna(latest_jeonse[city])]
                metro_jeonse = sum(metro_values) / len(metro_values) if metro_values else None

            # 광역시 평균 계산 (전주)
            prev_metro_trade = None
            prev_metro_jeonse = None

            if prev_trade is not None:
                metro_values = [prev_trade[city] for city in metro_cities if city in prev_trade.index and pd.notna(prev_trade[city])]
                prev_metro_trade = sum(metro_values) / len(metro_values) if metro_values else None

            if prev_jeonse is not None:
                metro_values = [prev_jeonse[city] for city in metro_cities if city in prev_jeonse.index and pd.notna(prev_jeonse[city])]
                prev_metro_jeonse = sum(metro_values) / len(metro_values) if metro_values else None

            # 기타 지역 (전국 총계 사용)
            other_trade = latest_trade['Total'] if latest_trade is not None and pd.notna(latest_trade['Total']) else None
            other_jeonse = latest_jeonse['Total'] if latest_jeonse is not None and pd.notna(latest_jeonse['Total']) else None

            prev_other_trade = prev_trade['Total'] if prev_trade is not None and pd.notna(prev_trade['Total']) else None
            prev_other_jeonse = prev_jeonse['Total'] if prev_jeonse is not None and pd.notna(prev_jeonse['Total']) else None

            # 전국 통계 (현재값 + 전주대비 변동)
            national_stats = {
                'trade': {
                    'current': latest_trade['Total'] if latest_trade is not None else None,
                    'change': (latest_trade['Total'] - prev_trade['Total']) if (latest_trade is not None and prev_trade is not None) else None
                },
                'jeonse': {
                    'current': latest_jeonse['Total'] if latest_jeonse is not None else None,
                    'change': (latest_jeonse['Total'] - prev_jeonse['Total']) if (latest_jeonse is not None and prev_jeonse is not None) else None
                }
            }

            # 지역별 통계 (현재값 + 전주대비 변동)
            regional_stats = {
                'capital': {
                    'trade': {
                        'current': latest_trade['Seoul'] if latest_trade is not None else None,
                        'change': (latest_trade['Seoul'] - prev_trade['Seoul']) if (latest_trade is not None and prev_trade is not None) else None
                    },
                    'jeonse': {
                        'current': latest_jeonse['Seoul'] if latest_jeonse is not None else None,
                        'change': (latest_jeonse['Seoul'] - prev_jeonse['Seoul']) if (latest_jeonse is not None and prev_jeonse is not None) else None
                    }
                },
                'metro': {
                    'trade': {
                        'current': metro_trade,
                        'change': (metro_trade - prev_metro_trade) if (metro_trade is not None and prev_metro_trade is not None) else None
                    },
                    'jeonse': {
                        'current': metro_jeonse,
                        'change': (metro_jeonse - prev_metro_jeonse) if (metro_jeonse is not None and prev_metro_jeonse is not None) else None
                    }
                },
                'other': {
                    'trade': {
                        'current': other_trade,
                        'change': (other_trade - prev_other_trade) if (other_trade is not None and prev_other_trade is not None) else None
                    },
                    'jeonse': {
                        'current': other_jeonse,
                        'change': (other_jeonse - prev_other_jeonse) if (other_jeonse is not None and prev_other_jeonse is not None) else None
                    }
                }
            }

            return national_stats, regional_stats

        except Exception as e:
            logger.error(f"증감 시트 통계 추출 실패: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'trade': {'current': None, 'change': None},
                'jeonse': {'current': None, 'change': None}
            }, {
                'capital': {'trade': {'current': None, 'change': None}, 'jeonse': {'current': None, 'change': None}},
                'metro': {'trade': {'current': None, 'change': None}, 'jeonse': {'current': None, 'change': None}},
                'other': {'trade': {'current': None, 'change': None}, 'jeonse': {'current': None, 'change': None}}
            }
    
    def _extract_survey_date(self, df):
        """조사기준일 추출"""

        for idx in range(min(10, len(df))):
            for col in df.columns:
                cell_value = df.iloc[idx, col]

                # NaT가 아닌 datetime 값만 처리
                if pd.notna(cell_value) and isinstance(cell_value, (datetime, pd.Timestamp)):
                    try:
                        return pd.to_datetime(cell_value).strftime('%Y-%m-%d')
                    except:
                        pass

                if pd.notna(cell_value) and '조사기준일' in str(cell_value):
                    for next_col in range(col + 1, min(col + 5, len(df.columns))):
                        next_val = df.iloc[idx, next_col]
                        if pd.notna(next_val) and isinstance(next_val, (datetime, pd.Timestamp)):
                            try:
                                return pd.to_datetime(next_val).strftime('%Y-%m-%d')
                            except:
                                pass
        return datetime.now().strftime('%Y-%m-%d')


    def _extract_national_stats(self, df):
        """전국 통계 추출"""

        stats = {
            'trade': {'current': None, 'change': None},
            'jeonse': {'current': None, 'change': None}
        }
        
        for idx in range(min(15, len(df))):
            row_text = ' '.join([str(x) for x in df.iloc[idx].values if pd.notna(x)])
            
            if '전국' in row_text and '매매' in row_text:
                stats['trade']['current'] = self._find_rate_in_row(df.iloc[idx])
            
            if '전국' in row_text and '전세' in row_text:
                stats['jeonse']['current'] = self._find_rate_in_row(df.iloc[idx])
        return stats
    
    def _extract_regional_stats(self, df):
        """권역별 통계 추출"""
        stats = {
            'trade': {
                'capital': {'current': None},
                'metro': {'current': None},
                'other': {'current': None}
            },
            'jeonse': {
                'capital': {'current': None},
                'metro': {'current': None},
                'other': {'current': None}
            }
        }
        
        for idx in range(min(30, len(df))):
            row_text = ' '.join([str(x) for x in df.iloc[idx].values if pd.notna(x)])
            
            if '매매' in row_text or idx < 30:
                if '수도권' in row_text:
                    stats['trade']['capital']['current'] = self._find_rate_in_row(df.iloc[idx])
                elif '광역시' in row_text:
                    stats['trade']['metro']['current'] = self._find_rate_in_row(df.iloc[idx])
                elif '기타' in row_text:
                    stats['trade']['other']['current'] = self._find_rate_in_row(df.iloc[idx])
        return stats
    
    def _find_rate_in_row(self, row):
        """행에서 증감률 값 찾기"""

        for val in row.values:
            if isinstance(val, (int, float)):
                rate = float(val)
                if ParserConfig.MIN_RATE < rate < ParserConfig.MAX_RATE:
                    return rate
        return None

    def _extract_ranking_data(self, df, market_type, trend_type):
        """순위 데이터 추출"""

        rankings = []

        # 검색 키워드 설정
        search_keyword = f"{'금주' if '금주' else ''} {trend_type}률 상위"

        # 해당 섹션 찾기
        section_row = None
        col_start = 0
        col_end = len(df.columns)

        # 매매는 왼쪽, 전세는 오른쪽 컬럼 범위
        if market_type == '전세':
            col_start = 16

        for idx in range(len(df)):
            row_text = ' '.join([str(x) for x in df.iloc[idx, col_start:col_end].values if pd.notna(x)])
            if f'{trend_type}률 상위' in row_text:
                section_row = idx
                break

        if section_row is None:
            return rankings

        # 데이터 시작 행 (헤더 + 1줄 건너뛰기)
        start_row = section_row + 2

        # Top 10 추출
        for idx in range(start_row, min(start_row + 10, len(df))):
            # 매매: 열 3(지역), 열 4(비율)
            # 전세: 열 25(지역), 열 26(비율)
            region_col = 3 if market_type == '매매' else 25
            rate_col = 4 if market_type == '매매' else 26

            region = df.iloc[idx, region_col]
            rate = df.iloc[idx, rate_col]

            if pd.notna(region) and pd.notna(rate):
                try:
                    rate_val = float(rate)
                    rankings.append({
                        'rank': len(rankings) + 1,
                        'region': str(region).strip(),
                        'rate': rate_val
                    })
                except:
                    pass

            if len(rankings) >= ParserConfig.MAX_RANKING_ITEMS:
                break

        return rankings
    
    def _parse_change_sheet(self, sheet_name):
        """증감 시트 파싱 - 행에 날짜, 열에 지역"""

        try:
            df = pd.read_excel(self.file_path, sheet_name=sheet_name, header=2)

            logger.info(f"\n=== {sheet_name} 파싱 시작 ===")
            logger.info(f"Shape: {df.shape}")
            logger.info(f"컬럼 샘플 (처음 10개): {df.columns.tolist()[:10]}")

            # 첫 번째 컬럼(Classification)에서 날짜 행 찾기
            date_rows = []
            for idx in range(len(df)):
                date_val = df.iloc[idx, 0]
                if pd.notna(date_val) and isinstance(date_val, (datetime, pd.Timestamp)):
                    date_rows.append(idx)

            logger.info(f"발견된 날짜 행 개수: {len(date_rows)}")

            if not date_rows:
                logger.warning(f"경고: {sheet_name}에서 날짜 행을 찾을 수 없습니다!")
                return None

            # 최근 26주 데이터 추출 (약 6개월)
            recent_rows = date_rows[-26:] if len(date_rows) >= 26 else date_rows
            logger.info(f"최근 {len(recent_rows)}주 데이터 추출")

            recent_data = []
            for row_idx in recent_rows:
                date_val = df.iloc[row_idx, 0]
                try:
                    date_str = pd.to_datetime(date_val).strftime('%Y-%m-%d')
                except:
                    continue

                weekly_data = {
                    'date': date_str,
                    'regions': []
                }

                # 각 컬럼(지역)의 값 추출
                for col_idx, col_name in enumerate(df.columns[1:], start=1):
                    value = df.iloc[row_idx, col_idx]

                    if pd.notna(value) and isinstance(value, (int, float)):
                        weekly_data['regions'].append({
                            'name': str(col_name),
                            'value': float(value)
                        })

                if weekly_data['regions']:
                    recent_data.append(weekly_data)
                    logger.debug(f"  주차 {date_str}: {len(weekly_data['regions'])}개 지역 데이터")

            logger.info(f"{sheet_name} 파싱 완료: {len(recent_data)}주 데이터")
            return {'sheet_name': sheet_name, 'recent_weeks': recent_data}

        except Exception as e:
            logger.error(f"!!! {sheet_name} 파싱 중 에러 발생: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def _parse_supply_sheet(self, sheet_name):
        """매수매도/전세수급 시트 파싱 - 3컬럼 구조 (값1, 값2, 지수)"""

        try:
            df = pd.read_excel(self.file_path, sheet_name=sheet_name, header=None)

            logger.info(f"\n=== {sheet_name} 파싱 시작 ===")
            logger.info(f"Shape: {df.shape}")

            # Row 1에서 지역명 추출 (컬럼 1, 4, 7, 10, ... 매 3번째)
            regions = []
            region_cols = []
            for col_idx in range(1, len(df.columns), 3):
                region_name = df.iloc[1, col_idx]
                if pd.notna(region_name):
                    regions.append(str(region_name).strip())
                    # 지수는 각 지역의 3번째 컬럼 (col_idx + 2)
                    region_cols.append({
                        'name': str(region_name).strip(),
                        'index_col': col_idx + 2
                    })

            logger.info(f"발견된 지역 개수: {len(regions)}")
            logger.info(f"지역 목록: {regions[:5]}...")

            # Row 4부터 데이터 시작 (날짜 + 값들)
            date_rows = []
            for idx in range(4, len(df)):
                date_val = df.iloc[idx, 0]
                if pd.notna(date_val) and isinstance(date_val, (datetime, pd.Timestamp)):
                    date_rows.append(idx)

            logger.info(f"발견된 날짜 행 개수: {len(date_rows)}")

            if not date_rows:
                logger.warning(f"경고: {sheet_name}에서 날짜 행을 찾을 수 없습니다!")
                return None

            # 최근 26주 데이터 추출
            recent_rows = date_rows[-26:] if len(date_rows) >= 26 else date_rows
            logger.info(f"최근 {len(recent_rows)}주 데이터 추출")

            recent_data = []
            for row_idx in recent_rows:
                date_val = df.iloc[row_idx, 0]
                try:
                    date_str = pd.to_datetime(date_val).strftime('%Y-%m-%d')
                except:
                    continue

                weekly_data = {
                    'date': date_str,
                    'regions': []
                }

                # 각 지역의 지수 값 추출
                for region_info in region_cols:
                    value = df.iloc[row_idx, region_info['index_col']]

                    if pd.notna(value) and isinstance(value, (int, float)):
                        weekly_data['regions'].append({
                            'name': region_info['name'],
                            'value': float(value)
                        })

                if weekly_data['regions']:
                    recent_data.append(weekly_data)
                    logger.debug(f"  주차 {date_str}: {len(weekly_data['regions'])}개 지역 데이터")

            logger.info(f"{sheet_name} 파싱 완료: {len(recent_data)}주 데이터")
            return {'sheet_name': sheet_name, 'recent_weeks': recent_data}

        except Exception as e:
            logger.error(f"!!! {sheet_name} 파싱 중 에러 발생: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def _parse_generic_sheet(self, sheet_name):
        """일반 시트 파싱"""

        try:
            df = pd.read_excel(self.file_path, sheet_name=sheet_name, header=2, nrows=50)
            
            return {
                'sheet_name': sheet_name,
                'shape': df.shape,
                'columns': [str(col) for col in df.columns.tolist()[:10]],
                'preview': df.head(5).to_dict('records') if not df.empty else []
            }
        except:
            return None
    
    def get_statistics(self):
        """전체 통계 요약"""

        summary = self.data.get(ParserConfig.SUMMARY_SHEET)
        
        stats = {
            'total_sheets': len(self.data),
            'sheets': list(self.data.keys()),
            'survey_date': None,
            'national_stats': None,
            'regional_stats': None
        }
        
        if summary:
            stats['survey_date'] = summary.get('survey_date')
            stats['national_stats'] = summary.get('national_stats')
            stats['regional_stats'] = summary.get('regional_stats')
        return stats
