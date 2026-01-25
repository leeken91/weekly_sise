from pathlib import Path

# 프로젝트 루트 디렉토리
BASE_DIR = Path(__file__).resolve().parent

# Parser 설정
class ParserConfig:
    # 지원하는 파일 확장자
    ALLOWED_EXTENSIONS = {'.xlsx', '.xls'}

    # 시트 이름
    SUMMARY_SHEET = '요약'

    # 파싱 제한 (성능 최적화)
    MAX_ROWS_TO_PARSE = 200
    MAX_RANKING_ITEMS = 10

    # 증감률 범위 (이상치 필터링)
    MIN_RATE = -10.0
    MAX_RATE = 10.0

# 전체 설정
class Config:
    Parser = ParserConfig
