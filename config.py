from pathlib import Path

import os

# 프로젝트 루트 디렉토리
BASE_DIR = Path(__file__).resolve().parent # apt/config.py -> apt/

# Flask 설정
class FlaskConfig:
    # Flask 애플리케이션 설정
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    
    # 개발 모드
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    PORT = int(os.getenv('FLASK_PORT', 8080))

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

# LLM 설정
class LLMConfig:
    """LLM API 관련 설정"""

    # API 키 (환경변수에서 로드)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    
    # 기본 제공자
    DEFAULT_PROVIDER = os.getenv('LLM_PROVIDER', 'openai')
    
    # 모델 설정
    OPENAI_MODEL = 'gpt-4-turbo-preview'
    ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'
    
    # 토큰 및 온도 설정
    MAX_TOKENS = 2000
    TEMPERATURE = 0.7
    
    # 타임아웃 (초)
    REQUEST_TIMEOUT = 30

# 전체 설정을 하나의 객체로
class Config:
    """전체 설정 통합"""
    Flask = FlaskConfig
    Parser = ParserConfig
    LLM = LLMConfig
    
    @classmethod
    def init_app(cls):
        """애플리케이션 초기화 시 필요한 설정"""
        
        # 업로드 폴더 생성
        FlaskConfig.UPLOAD_FOLDER.mkdir(exist_ok=True)
        
        print("KB 부동산 분석기 설정 로드 완료")
        print(f"업로드 폴더: {FlaskConfig.UPLOAD_FOLDER}")
        print(f"서버 주소: http://{FlaskConfig.HOST}:{FlaskConfig.PORT}")
        print(f"LLM 제공자: {LLMConfig.DEFAULT_PROVIDER}")
        print(f"OpenAI API: {'✓ 설정됨' if LLMConfig.OPENAI_API_KEY else '미설정'}")
        print(f"Anthropic API: {'✓ 설정됨' if LLMConfig.ANTHROPIC_API_KEY else '미설정'}")