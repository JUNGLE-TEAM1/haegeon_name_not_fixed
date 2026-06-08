# Concept Learning Note

## 1. 개념

FastAPI `include_router`

## 2. 이 개념을 만난 맥락

- Phase: Phase 0. 프로젝트 기반 구성
- 관련 기능: health check API 연결
- 관련 endpoint:
  - `GET /api/v1/health`
  - `GET /api/v1/health/db`
- 관련 파일:
  - `backend/app/main.py`
  - `backend/app/api/v1/router.py`
  - `backend/app/api/v1/health.py`

## 3. 처음 헷갈렸던 점

`main.py`에 endpoint 함수가 직접 없는데도 `/api/v1/health/db` 같은 API가 어떻게 호출되는지 헷갈렸다.
또 `backend/app/api/v1/router.py`의 `api_router`도 `APIRouter`이고, `health.router`도 `APIRouter`라서 router 안에 router를 넣는 구조인지 궁금했다.

## 4. 프로젝트 안에서의 역할

현재 프로젝트에서 `include_router`는 기능별 endpoint 묶음을 더 큰 API 구조에 등록하는 역할을 한다.

`main.py`는 FastAPI 앱 생성, CORS, 공통 예외 처리, 전체 API prefix 등록을 담당한다.
실제 health endpoint 함수는 `health.py`에 있고, `router.py`가 이를 `/health` 아래에 묶고, `main.py`가 다시 `/api/v1` 아래에 등록한다.

이 구조 덕분에 나중에 `auth`, `entries`, `comments`, `interviews`, `rag` 같은 API가 늘어나도 `main.py`가 모든 endpoint를 직접 들고 있지 않아도 된다.

`tags=["health"]`는 URL을 바꾸는 값이 아니라, FastAPI 자동 API 문서에서 endpoint들을 `health` 그룹으로 보여주기 위한 값이다.

## 5. 핵심 코드 흐름

```text
backend/app/api/v1/health.py
@router.get("")
@router.get("/db")
-> health 관련 endpoint 정의

backend/app/api/v1/router.py
api_router.include_router(health.router, prefix="/health", tags=["health"])
-> health router 앞에 /health prefix 추가
-> API 문서에서는 health 그룹으로 표시

backend/app/main.py
app.include_router(api_router, prefix="/api/v1")
-> v1 API 전체 앞에 /api/v1 prefix 추가

최종 URL
GET /api/v1/health
GET /api/v1/health/db
```

## 6. 개념 설명

`APIRouter`는 endpoint들을 담는 묶음이다.
`@router.get(...)`, `@router.post(...)` 같은 데코레이터는 특정 HTTP 요청을 처리할 함수를 router에 등록한다.

`include_router`는 이미 만들어진 router 묶음을 다른 router나 FastAPI app에 붙인다.
이때 `prefix`를 주면 해당 router 안에 있는 모든 endpoint 앞에 URL 조각이 추가된다.

`tags`는 endpoint를 FastAPI 자동 문서에서 어떤 그룹으로 보여줄지 정한다.
예를 들어 `tags=["health"]`이면 `/docs` 화면에서 health 관련 API들이 같은 그룹으로 묶여 보인다.
`tags`는 문서 분류용 값이므로 실제 URL에는 영향을 주지 않는다.

현재 프로젝트에서는 `health.router`가 `api_router`에 포함되고, `api_router`가 FastAPI `app`에 포함된다.
따라서 URL은 여러 단계의 prefix가 합쳐져 만들어진다.

```text
@router.get("/db")
+ prefix="/health"
+ prefix="/api/v1"
= GET /api/v1/health/db
```

실용적으로는 "기능별 endpoint 파일을 만들고, 공통 URL 구조에 맞게 앱에 등록하는 도구"라고 이해하면 된다.

## 7. 내가 설명할 수 있어야 하는 질문

- `endpoint`, `router`, `include_router`, `prefix`는 각각 어떤 역할을 하는가?
- `GET /api/v1/health/db`는 어떤 파일들의 prefix와 route가 합쳐져 만들어지는가?
- 왜 모든 endpoint를 `main.py`에 직접 작성하지 않고 기능별 router로 나누는가?
- `prefix="/health"`와 `tags=["health"]` 중 실제 URL을 바꾸는 것은 무엇인가?
- `router.py`에서 `prefix="/health"`를 `prefix="/status"`로 바꾸면 DB health check URL은 어떻게 바뀌는가?
- 나중에 `auth.py`에 `@router.post("/login")`을 만들고 `prefix="/auth"`로 등록하면 최종 URL은 무엇인가?

## 8. 직접 확인해볼 작은 실험

- `backend/app/api/v1/router.py`에서 health router의 prefix를 `/status`로 바꿔보고 `GET /api/v1/status/db`가 되는지 확인한다.
- `backend/app/api/v1/health.py`에 `@router.get("/ping")`을 추가하고 최종 URL이 `GET /api/v1/health/ping`이 되는지 확인한다.
- FastAPI docs 화면에서 health endpoint가 어떤 경로로 노출되는지 확인한다.
- `tags=["health"]`를 `tags=["system"]`으로 바꿔보고 URL은 그대로이고 `/docs`의 그룹 이름만 바뀌는지 확인한다.

## 9. 아직 남은 질문

- FastAPI가 앱 시작 시점에 router에 등록된 route들을 내부적으로 어떻게 최종 route 목록으로 모으는지는 아직 자세히 보지 않았다.
- `tags=["health"]`가 OpenAPI 문서 화면에서 실제로 어떤 그룹 UI로 보이는지는 직접 확인해볼 수 있다.

## 10. 다음 기록이나 구현에 주는 영향

다음 Phase에서 인증 API를 만들 때 같은 패턴을 사용할 수 있다.

```text
backend/app/api/v1/auth.py
@router.post("/signup")
@router.post("/login")

backend/app/api/v1/router.py
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

최종 URL
POST /api/v1/auth/signup
POST /api/v1/auth/login
```

따라서 새 기능을 만들 때는 먼저 기능별 router 파일을 만들고, `backend/app/api/v1/router.py`에 include하는 흐름을 따르면 된다.
