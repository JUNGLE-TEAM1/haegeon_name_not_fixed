# Phase 0 Bootstrap Review

## 1. Phase 정보

- Phase: Phase 0. 프로젝트 기반 구성
- 관련 브랜치 / 이슈: `feature/bootstrap-app`
- 작성일: 2026-06-08
- 작성자: Codex

## 2. 이번 Phase에서 구현된 것

- React + TypeScript + Vite 프론트엔드 골격
- FastAPI 백엔드 앱 골격
- 환경변수 로딩과 `DATABASE_URL` 기반 SQLAlchemy engine 구성
- 공통 성공 응답 래퍼
- `/api/v1/health`, `/api/v1/health/db` health check API
- backend smoke test
- root `README.md`와 `.env.example`

## 3. 직접 실행 방법과 성공 기준

### 실행 전제

- Python 3.8 이상과 Node.js/npm이 설치되어 있어야 한다.
- DB 컨테이너 실행에는 Docker Desktop 또는 Docker daemon이 필요하다.
- `docker compose up -d db`는 repository root(`/Users/sisu/Projects/jungle/before_final_project`)에서 실행한다.
- backend 명령은 repository root 기준 `backend/`에서 실행한다.
- frontend 명령은 repository root 기준 `frontend/`에서 실행한다.
- `/api/v1/health/db` 성공 확인에는 `.env`의 `DATABASE_URL`이 가리키는 PostgreSQL 서버가 실행 중이어야 한다.
- PostgreSQL이 아직 준비되지 않아도 `/api/v1/health`, backend test, frontend build는 확인할 수 있다.

### Backend 설치

```bash
cd backend
python3 -m venv ../.venv
../.venv/bin/pip install -r requirements-dev.txt
```

성공 기준:

- dependency 설치가 에러 없이 끝난다.
- `../.venv/bin/python`과 `../.venv/bin/pytest`가 존재한다.

### Database 실행

```bash
cd /Users/sisu/Projects/jungle/before_final_project
docker compose up -d db
```

성공 기준:

- `dev-reflection-board-db` 컨테이너가 실행된다.
- `.env.example`의 `DATABASE_URL`과 같은 접속 정보로 PostgreSQL에 연결할 수 있다.
- pgvector를 나중에 사용할 수 있도록 `pgvector/pgvector:pg16` 이미지를 사용한다.

### Backend test

```bash
cd backend
../.venv/bin/pytest -q
```

성공 기준:

- 출력에 `3 passed`가 표시된다.
- `/api/v1/health` 성공 응답, `/api/v1/health/db` 성공/실패 wrapper 테스트가 모두 통과한다.

### Backend dev server

```bash
cd /Users/sisu/Projects/jungle/before_final_project
cd backend
../.venv/bin/uvicorn app.main:app --reload
```

다른 터미널에서 확인:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

성공 기준:

- uvicorn이 `http://127.0.0.1:8000`에서 실행된다.
- health check 응답이 아래와 같다.

```json
{"success":true,"data":{"status":"ok"}}
```

DB 연결 확인:

```bash
curl http://127.0.0.1:8000/api/v1/health/db
```

성공 기준:

- `docker compose up -d db`로 PostgreSQL이 실행 중이고 `DATABASE_URL`이 맞으면 `{"success":true,"data":{"database":"ok"}}`가 반환된다.
- PostgreSQL이 없거나 URL이 틀리면 `503`과 `DATABASE_UNAVAILABLE` 에러 wrapper가 반환된다. 이 경우는 DB 연결 실패를 올바르게 감지한 상태다.

### Frontend 설치와 build

```bash
cd frontend
npm install
npm run build
```

성공 기준:

- `npm install`이 dependency를 설치하고 취약점 fatal error 없이 끝난다.
- `npm run build`가 `tsc -b && vite build`를 실행하고 `✓ built`를 출력한다.
- `frontend/dist/`가 생성된다.

### Frontend dev server

```bash
cd frontend
npm run dev
```

성공 기준:

- Vite가 `http://127.0.0.1:5173/` 또는 사용 가능한 로컬 주소를 출력한다.
- 브라우저에서 접속하면 `Dev Reflection Board`와 `회고 작성 루프를 준비하고 있습니다.` 문구가 보인다.

### 실패 시 먼저 볼 것

- backend import 실패: `backend/pytest.ini`의 `pythonpath = .` 설정을 확인한다.
- backend dependency 설치 실패: `backend/requirements.txt`의 PostgreSQL driver가 `pg8000`인지 확인한다.
- DB health 실패: `.env`의 `DATABASE_URL`과 PostgreSQL 실행 상태를 확인한다.
- frontend build 실패: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/src/vite-env.d.ts`를 확인한다.
- 포트 충돌: backend는 `--port 8001`, frontend는 `npm run dev -- --port 5174`처럼 다른 포트를 사용한다.

## 4. 핵심 사용자 흐름

```text
브라우저에서 frontend dev server 접속
-> React 앱 첫 화면 렌더링
```

```text
클라이언트 또는 curl
-> GET /api/v1/health
-> FastAPI router
-> success/data 응답
```

## 5. 핵심 요청 흐름

```text
GET /api/v1/health/db
-> health router
-> check_database_connection()
-> SQLAlchemy engine.connect()
-> SELECT 1
-> success/data 응답 또는 503
```

## 6. 반드시 읽어야 할 코드

| 파일 | 읽어야 하는 이유 |
| --- | --- |
| `backend/app/main.py` | FastAPI 앱 생성, CORS, API router 연결 위치 |
| `backend/app/api/v1/health.py` | phase 0의 핵심 health endpoint |
| `backend/app/core/config.py` | 환경변수 로딩 방식 |
| `backend/app/core/database.py` | DB engine, session, 연결 확인 흐름 |
| `frontend/src/App.tsx` | 프론트엔드 첫 화면 진입점 |

## 7. 가볍게 봐도 되는 코드

| 파일 | 이유 |
| --- | --- |
| `frontend/vite.config.ts` | Vite 기본 React 설정만 포함 |
| `frontend/src/styles.css` | phase 0 표시 화면 스타일 |
| `backend/app/core/responses.py` | 현재는 공통 성공/실패 wrapper만 포함 |

## 8. 데이터 저장 / 상태 변화

- 아직 테이블 생성이나 데이터 저장은 없다.
- `DATABASE_URL`이 가리키는 DB에 `SELECT 1`로 연결 가능 여부만 확인한다.

## 9. 실패 처리와 권한 처리

- 인증 실패: phase 1 범위로 남겨둔다.
- 권한 실패: phase 1 이후 사용자별 리소스에서 구현한다.
- 입력 검증 실패: phase 0 endpoint는 입력이 없다.
- 외부 연동 실패: 외부 API 연동은 없다.
- 기타: DB 연결 실패 시 `/api/v1/health/db`가 `503`을 반환한다.

## 10. 내가 설명할 수 있어야 하는 질문

- FastAPI 앱은 어디에서 생성되고 API router는 어디에서 붙는가?
- `DATABASE_URL`은 어디에서 읽히고 DB 연결 확인은 어떻게 수행되는가?
- 공통 성공 응답은 어떤 모양으로 반환되는가?
- 프론트엔드 dev server의 첫 진입 파일은 무엇인가?

## 11. 아직 모르는 것 / 다음에 확인할 것

- PostgreSQL 로컬 인스턴스와 마이그레이션 도구 선택은 phase 1/2에서 확정해야 한다.
- 인증 구현 전 비밀번호 해시와 JWT 라이브러리 선택이 필요하다.

## 12. 내가 직접 바꿔볼 작은 실험

- `.env`의 `DATABASE_URL`을 잘못된 값으로 바꾸고 `/api/v1/health/db`가 `503`을 반환하는지 확인한다.
- `BACKEND_CORS_ORIGINS`에 다른 origin을 추가하고 FastAPI CORS 설정을 확인한다.

## 13. 다음 작업에 주는 영향

- phase 1 인증 API는 `backend/app/api/v1` 아래에 router를 추가해 같은 `/api/v1` prefix를 사용하면 된다.
- DB model은 `backend/app/core/database.py`의 `Base`와 `SessionLocal`을 기반으로 추가한다.
