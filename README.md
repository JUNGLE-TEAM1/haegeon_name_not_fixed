# Dev Reflection Board

개발자가 짧은 작업 기록을 입력하면 질문, 답변, 초안, 검색 가능한 회고 기록으로 정리하는 AI 회고 보드 MVP입니다.

## 현재 구현 상태

- Phase 0: React + FastAPI 앱 골격, 환경변수 로딩, DB 연결 확인 API

## 로컬 실행

아래 명령은 repository root(`/Users/sisu/Projects/jungle/before_final_project`)에서 시작한다고 가정합니다.

### Database

Docker Desktop을 먼저 실행한 뒤 DB 컨테이너를 띄웁니다.

```bash
cd /Users/sisu/Projects/jungle/before_final_project
docker compose up -d db
```

기본 접속 정보는 `.env.example`의 `DATABASE_URL`과 맞춰져 있습니다.

### Backend

```bash
cd /Users/sisu/Projects/jungle/before_final_project
cd backend
python3 -m venv ../.venv
../.venv/bin/pip install -r requirements-dev.txt
../.venv/bin/uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

DB 연결 확인:

```bash
curl http://127.0.0.1:8000/api/v1/health/db
```

DB를 끄려면 `docker compose down`을 사용합니다. 저장된 데이터까지 지우려면 `docker compose down -v`를 사용합니다.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 테스트

```bash
cd backend
../.venv/bin/pytest -q
```
