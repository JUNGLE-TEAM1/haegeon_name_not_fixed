# Concept Learning Note

## 0. 핵심 한 문장

Docker Compose는 `docker-compose.yml`에 적힌 설정을 바탕으로 PostgreSQL 컨테이너를 같은 방식으로 실행하게 해주고, 이 프로젝트에서는 로컬에 DB를 직접 설치하지 않아도 `/api/v1/health/db` 연결 확인을 할 수 있게 해준다.

## 1. 개념

- 주 개념: Docker Compose로 PostgreSQL 실행하기
- 같이 나온 개념: Docker image, container, port mapping, volume, Docker daemon
- 별도 노트 후보: `image -> container -> volume -> port mapping` 전체 흐름

## 2. 이 개념을 만난 맥락

- Phase: Phase 0. 프로젝트 기반 구성
- 관련 기능: 백엔드 health check, DB 연결 확인
- 관련 endpoint: `GET /api/v1/health/db`
- 관련 파일:
  - `docker-compose.yml`
  - `.env.example`
  - `backend/app/core/database.py`
  - `backend/app/api/v1/health.py`
  - `docs/reviews/phase-0-bootstrap-review.md`

## 3. 처음 헷갈렸던 점

`docs/reviews/phase-0-bootstrap-review.md`에서 DB 연결 확인이 실패했는데, 실제로는 PostgreSQL을 띄우지 않은 상태였다.

그래서 이것이 코드 문제인지, DB를 따로 실행해야 하는 문제인지, Docker를 쓰면 무엇이 편해지는지 헷갈렸다.

또 `curl http://127.0.0.1:8000/api/v1/health/db`가 처음 실패했을 때는 FastAPI 서버가 켜지지 않았거나, 서버를 `frontend/` 위치에서 잘못 실행한 문제도 함께 있었다.

## 4. 이해가 막혔던 gap

- gap 유형: 코드 흐름이 안 보임
- 막혔던 지점: Docker 컨테이너 안의 PostgreSQL 서버와 로컬 FastAPI 서버가 어떻게 연결되는지

## 5. gap을 메운 설명

이 프로젝트에서 Docker는 백엔드나 프론트엔드를 전부 컨테이너화하기 위해 사용한 것이 아니다.
Phase 0에서는 PostgreSQL만 안정적으로 띄우기 위해 사용했다.

`docker compose up -d db`를 실행하면 `docker-compose.yml`의 `db` 서비스 설정을 읽고 PostgreSQL 컨테이너를 만든다.
이 컨테이너 안에서 PostgreSQL 서버가 실행된다.

백엔드는 `.env.example` 또는 기본 설정의 `DATABASE_URL`을 사용해 `localhost:5432`로 접속한다.
이때 `docker-compose.yml`의 `ports: "5432:5432"` 설정이 로컬 머신의 5432번 포트와 컨테이너 안 PostgreSQL의 5432번 포트를 연결한다.

그래서 FastAPI 입장에서는 로컬의 `localhost:5432`에 DB가 있는 것처럼 보이지만, 실제 PostgreSQL 서버는 Docker 컨테이너 안에서 실행된다.

## 6. 클릭한 순간

`ports: "5432:5432"`가 없으면 컨테이너 안 PostgreSQL은 실행 중이어도, 로컬 FastAPI 서버가 어디로 접속해야 할지 연결 통로를 갖지 못한다는 점을 이해했다.

또 `docker-compose.yml`은 Docker image 자체가 아니라, 어떤 image를 어떤 환경변수, 포트, 볼륨 설정으로 실행할지 적은 실행 설명서라는 점을 구분했다.

## 7. 내가 이해한 말

Docker Compose는 `docker-compose.yml`에 정의된 서비스, 포트, 환경변수, 볼륨 설정을 읽어서 컨테이너를 일관되게 만들고 실행하는 도구다.

이 프로젝트에서는 PostgreSQL을 각자 로컬에 직접 설치하지 않고도, 어떤 개발자 머신에서든 같은 버전과 같은 접속 정보로 DB를 띄우기 위해 사용했다.

그리고 `docker-compose.yml`은 실제 데이터를 저장하는 파일이 아니라 실행 설정을 담는 파일이다.
DB 실행 결과로 생긴 실제 데이터는 volume으로 지정한 저장공간에 보관한다.

## 8. AI가 교정해준 부분

처음에는 `docker-compose.yml`을 Docker image처럼 표현했지만, 더 정확히는 Compose 실행 설정 파일이다.

`image: pgvector/pgvector:pg16`이 실행 재료이고, 그 image를 바탕으로 실제 실행된 것이 `dev-reflection-board-db` container다.

또 `docker compose down`은 컨테이너와 네트워크를 내리지만 named volume은 남긴다.
반대로 `docker compose down -v`는 volume까지 삭제할 수 있으므로 PostgreSQL 데이터 초기화가 필요할 때만 조심해서 사용해야 한다.

## 9. 프로젝트 안에서의 역할

Docker Compose는 Phase 0에서 DB 연결 확인을 재현 가능하게 만든다.

팀원이 각자 PostgreSQL을 직접 설치하고 버전, 계정, DB 이름, 포트를 맞추는 대신 아래 명령 하나로 같은 DB 환경을 띄울 수 있다.

```bash
docker compose up -d db
```

이후 백엔드는 다음 접속 문자열 기준으로 DB에 연결한다.

```text
postgresql+pg8000://postgres:postgres@localhost:5432/dev_reflection_board
```

## 10. 현재 코드에서 실제로 확인한 흐름

```text
docker compose up -d db
-> docker-compose.yml의 db 서비스 읽기
-> pgvector/pgvector:pg16 image 준비
-> dev-reflection-board-db container 실행
-> 컨테이너 안에서 PostgreSQL 서버 실행
-> 로컬 localhost:5432와 컨테이너 5432 포트 연결
```

```text
FastAPI 서버 실행
-> backend/app/core/config.py에서 DATABASE_URL 설정
-> backend/app/core/database.py에서 SQLAlchemy engine 생성
-> GET /api/v1/health/db
-> check_database_connection()
-> engine.connect()
-> SELECT 1
-> 200 OK
```

실제로 확인한 결과:

```text
GET /api/v1/health HTTP/1.1 200 OK
GET /api/v1/health/db HTTP/1.1 200 OK
```

## 11. 앞으로 이 개념이 쓰일 예정 흐름

문서상 예정 흐름:

```text
Phase 1 이후 인증/게시글 기능 구현
-> User, ReflectionEntry 등 테이블 필요
-> 로컬 PostgreSQL 컨테이너 실행
-> migration 또는 schema 생성
-> FastAPI repository/service layer에서 DB I/O 수행
```

```text
RAG 또는 vector search 구현
-> PostgreSQL 기반 저장 구조 사용
-> pgvector 확장 검토
-> 현재 Compose image인 pgvector/pgvector:pg16 활용 가능
```

## 12. 다음에 다시 볼 질문

- `image`와 `container`는 정확히 무엇이 다른가?
- 컨테이너를 삭제해도 image는 왜 남아 있는가?
- `ports: "5432:5432"`에서 왼쪽과 오른쪽 숫자는 각각 누구의 포트인가?
- Docker volume은 실제로 어디에 저장되는가?
- `docker compose down`, `docker compose down -v`, `docker compose stop`은 어떻게 다른가?
- Docker daemon은 CLI 명령과 컨테이너 실행 사이에서 어떤 역할을 하는가?
