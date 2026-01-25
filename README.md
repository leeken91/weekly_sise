# KB 부동산 주간 시계열 대시보드

매주 업데이트되는 KB 부동산 주간 시계열 데이터를 시각화하는 대시보드입니다.

## 📊 기능

- **전국 흐름**: 전국/권역별 매매·전세 증감률 및 흐름 차트
- **지역 흐름**: 지역별 Top 10 랭킹 및 증감률 테이블
- **TOP 10**: 증감률 상위/하위 지역 차트
- **수요 & 공급**: 매수우위지수 및 전세수급지수 추세
- **지도**: 육각형 지도로 보는 지역별 증감률
- **공지사항**: 업데이트 내역 및 공지

## 🚀 배포 방법

### 1. GitHub 리포지토리 생성

1. GitHub에서 새 리포지토리 생성
2. 로컬 프로젝트 연결:
   ```bash
   cd /Users/kendrick/Desktop/workspace/apt_web
   git init
   git add .
   git commit -m "Initial commit: KB 부동산 대시보드"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 2. GitHub Pages 활성화

1. 리포지토리 → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **main** / Folder: **/docs**
4. Save 클릭
5. 약 1~2분 후 `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME` 에서 접속 가능

### 3. 주간 데이터 업데이트 방법

매주 금요일 저녁에 다음 단계를 진행하세요:

1. **kbland.kr에서 엑셀 파일 다운로드**

2. **GitHub 웹사이트에서 업로드**:
   - 리포지토리 → `data` 폴더로 이동
   - `latest.xlsx` 파일을 새 파일로 교체 (드래그앤드롭 또는 Upload files)
   - Commit changes 클릭

3. **자동 변환 및 배포**:
   - GitHub Actions가 자동으로 실행됩니다
   - Actions 탭에서 진행 상황 확인 가능
   - 약 1~2분 후 웹사이트 자동 업데이트 완료

## 📁 프로젝트 구조

```
apt_web/
├── .github/
│   └── workflows/
│       └── update-data.yml      # GitHub Actions 자동화 설정
│
├── data/
│   └── latest.xlsx              # 업로드할 엑셀 파일
│
├── scripts/
│   └── excel_to_json.py         # 엑셀 → JSON 변환 스크립트
│
├── docs/                        # GitHub Pages 배포 폴더
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   └── hexagon.js
│   └── data/
│       └── latest.json          # 자동 생성된 JSON
│
├── parser.py                    # 엑셀 파서 (기존)
├── config.py                    # 설정 파일
└── README.md
```

## 🛠 로컬 테스트

웹사이트를 로컬에서 테스트하려면:

```bash
# Python 내장 웹서버 실행
cd docs
python3 -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## 📝 수동으로 JSON 생성

로컬에서 JSON을 직접 생성하려면:

```bash
python3 scripts/excel_to_json.py
```

생성된 JSON 파일: `docs/data/latest.json`

## 🔧 기술 스택

- **Frontend**: HTML, CSS, JavaScript
- **Charts**: Chart.js
- **Hosting**: GitHub Pages (무료)
- **Automation**: GitHub Actions
- **Data Processing**: Python (pandas, openpyxl)

## 📌 주의사항

- 엑셀 파일명은 반드시 `latest.xlsx`로 업로드하세요
- GitHub Actions가 자동으로 JSON 변환을 수행합니다
- 웹사이트는 정적 사이트이므로 별도 서버 비용이 들지 않습니다

## 📧 문의

문제가 발생하면 GitHub Issues를 통해 문의해주세요.
