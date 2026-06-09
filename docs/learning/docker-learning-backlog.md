# Docker Learning Backlog

이 문서는 Docker를 한 번에 깊게 공부하기보다, Dev Reflection Board를 구현하면서 실제로 마주친 개념을 나중에 하나씩 다시 보기 위해 남기는 학습 백로그입니다.

## 1) Image -> Container -> Volume -> Port Mapping 흐름

### 상태

- 우선순위: Backlog
- 발견한 Phase: Phase 0. 프로젝트 기반 구성
- 발견한 맥락: PostgreSQL을 Docker Compose로 띄우고 `/api/v1/health/db` 연결을 확인하는 과정

### 현재 이해한 내용

Docker Compose는 `docker-compose.yml`에 정의된 서비스, 포트, 환경변수, 볼륨 설정을 읽어서 컨테이너를 일관되게 만들고 실행하는 도구다.

이 프로젝트에서는 PostgreSQL을 각자 로컬에 직접 설치하지 않고도, 어떤 개발자 머신에서든 같은 버전과 같은 접속 정보로 DB를 띄우기 위해 사용했다.

### 나중에 볼 질문

- `image`와 `container`는 정확히 무엇이 다른가?
- `pgvector/pgvector:pg16` 이미지는 어디에서 내려받고, 로컬에는 어떻게 저장되는가?
- 컨테이너를 삭제해도 image는 왜 남아 있는가?
- `ports: "5432:5432"`는 로컬 머신과 컨테이너 사이에서 어떤 연결을 만드는가?
- `volumes: postgres_data:/var/lib/postgresql/data`는 DB 데이터를 어디에 보관하는가?
- `docker compose down`과 `docker compose down -v`는 어떤 자원을 각각 삭제하는가?

### 프로젝트 코드 anchor

- `docker-compose.yml`
- `.env.example`
- `backend/app/core/database.py`
- `backend/app/api/v1/health.py`

### 다시 학습할 때 사용할 확인 흐름

```text
docker compose up -d db
-> pgvector/pgvector:pg16 image 준비
-> dev-reflection-board-db container 실행
-> localhost:5432와 container:5432 연결
-> postgres_data volume에 PostgreSQL 데이터 저장
-> FastAPI가 DATABASE_URL로 접속
-> GET /api/v1/health/db
-> SELECT 1
-> 200 OK
```

### 노트화 조건

이 항목을 다시 공부할 때는 한 번에 Docker 전체를 정리하지 않는다.
먼저 `image -> container -> volume -> port mapping` 흐름을 본인 말로 설명한 뒤, 필요하면 Concept Learning Note로 분리한다.
