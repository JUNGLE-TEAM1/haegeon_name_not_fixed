# Concept Learning Note

## 0. 핵심 한 문장

`config.py`는 `.env`나 환경변수에서 읽은 설정값을 `Settings` 객체에 담고, 앱에서 쓰기 좋은 형태로 가공해서 제공하는 파일이다.

## 1. 개념

- 주 개념: FastAPI 백엔드 설정 관리, 환경변수, `Settings`
- 같이 나온 개념: `os.getenv`, `.env`, `.env.example`, `load_dotenv`, `@lru_cache`, `@property`
- 별도 노트 후보: CORS, SQLAlchemy `create_engine`, 운영체제 환경변수

## 2. 이 개념을 만난 맥락

- Phase: Phase 0. 프로젝트 기반 구성
- 관련 기능: 백엔드 앱 이름 설정, PostgreSQL 연결 설정, CORS 허용 origin 설정
- 관련 endpoint: 직접 endpoint는 아니지만 `/api/v1/health/db`의 DB 연결 확인 흐름에 영향을 준다.
- 관련 파일:
  - `backend/app/core/config.py`
  - `backend/app/main.py`
  - `backend/app/core/database.py`
  - `.env.example`
  - `docs/reviews/phase-0-bootstrap-review.md`

## 3. 처음 헷갈렸던 점

`settings.database_url`에 `"DATABASE_URL"`이라는 문자열 자체가 들어가는지, 아니면 실제 DB 접속 문자열이 들어가는지 헷갈렸다.

또 `getenv`가 값을 찾는 "표"가 어디에 있는지, `.env`가 없는데도 왜 기본 DB URL로 연결을 시도하는지 궁금했다.

## 4. 이해가 막혔던 gap

- gap 유형: 코드 흐름이 안 보임
- 막혔던 지점: `os.getenv("DATABASE_URL", 기본값)`이 환경변수 이름과 실제 설정값을 어떻게 연결하는지

## 5. gap을 메운 설명

`os.getenv("DATABASE_URL", 기본값)`은 `"DATABASE_URL"`이라는 이름 자체를 반환하는 함수가 아니다.
현재 Python 프로세스의 환경변수 표에서 `DATABASE_URL`이라는 키의 값을 찾고, 있으면 그 값을 반환한다.
없으면 두 번째 인자인 기본 문자열을 반환한다.

`.env` 파일이 있으면 `load_dotenv()`가 그 파일의 값을 현재 Python 프로세스의 환경변수처럼 올려준다.
하지만 현재 프로젝트에는 실제 `.env`가 없고 `.env.example`만 있다.
그래서 현재는 환경변수도 따로 설정하지 않았다면 `config.py`에 적힌 기본 DB 접속 문자열을 사용한다.

## 6. 클릭한 순간

`DATABASE_URL`은 실제 값이 아니라 키 이름이고, `getenv`가 그 키로 value를 찾아 `settings.database_url`에 넣는다는 점을 이해했다.

또 `.env.example`은 Python이 실제로 읽는 설정 파일이 아니라, 개발자가 `.env`를 만들 때 참고하는 안내 파일이라는 점을 확인했다.

## 7. 내가 이해한 말

설정값, 환경변수를 저장해두고 접근할 수 있게 하는 클래스 `Settings`에 대해서 알아봤다.
이 객체는 프로젝트에서 `get_settings()`를 통해 딱 하나처럼 만들어서 사용한다.

`config.py`는 설정 값을 가공해서 담고 있는 파일이다.
`.env`를 GitHub 등에 올리지 않고 숨긴 상태로 프로그램을 개발하기 위해 환경변수 방식을 사용한다.

## 8. AI가 교정해준 부분

`Settings`가 `.env` 파일을 직접 읽는다고 이해할 수 있지만, 더 정확한 흐름은 `load_dotenv()`가 `.env` 값을 환경변수 표에 올리고 `os.getenv(...)`가 그 값을 읽는 것이다.

또 이것은 단순히 "wrapper로 민감한 정보를 숨긴다"기보다, 로컬 개발 DB, 테스트 DB, 배포 DB처럼 환경마다 달라지는 설정을 코드 변경 없이 바꾸기 위한 구조이기도 하다.

## 9. 프로젝트 안에서의 역할

`config.py`는 백엔드 전역 설정의 출발점이다.

`main.py`는 `settings.app_name`으로 FastAPI 앱 제목을 정하고, `settings.cors_origins`로 프론트엔드 origin을 허용한다.
`database.py`는 `settings.database_url`을 SQLAlchemy `create_engine(...)`에 넘겨 PostgreSQL 연결을 만든다.

## 10. 현재 코드에서 실제로 확인한 흐름

```text
백엔드 시작
-> backend/app/core/config.py import
-> load_dotenv()
-> Settings.database_url = os.getenv("DATABASE_URL", 기본 DB URL)
-> get_settings()
-> backend/app/core/database.py
-> create_engine(settings.database_url)
```

```text
백엔드 앱 생성
-> backend/app/main.py create_app()
-> settings = get_settings()
-> FastAPI(title=settings.app_name)
-> CORSMiddleware allow_origins=settings.cors_origins
```

## 11. 앞으로 이 개념이 쓰일 예정 흐름

문서상 예정 흐름:

```text
배포 환경
-> 배포 서비스에 DATABASE_URL 등록
-> load_dotenv() 또는 운영체제 환경변수 표에서 값 조회
-> settings.database_url
-> 배포용 PostgreSQL 연결
```

```text
AI 기능 구현
-> OPENAI_API_KEY 같은 민감 설정 추가 예정
-> .env 또는 배포 환경변수에 저장
-> Settings를 통해 서비스 코드에서 사용
```

## 12. 프로젝트 코드에서 확인한 근거

| 파일 | 확인한 내용 |
| --- | --- |
| `backend/app/core/config.py` | `load_dotenv()`, `Settings`, `os.getenv("DATABASE_URL", 기본값)`, `@property cors_origins`, `@lru_cache get_settings()`가 정의되어 있다. |
| `backend/app/main.py` | `get_settings()`로 앱 이름과 CORS origin 설정을 가져온다. |
| `backend/app/core/database.py` | `settings.database_url`을 `create_engine(...)`에 넘겨 DB engine을 만든다. |
| `.env.example` | 필요한 환경변수 예시로 `DATABASE_URL`과 `BACKEND_CORS_ORIGINS`가 적혀 있다. |

## 13. 관련 문서에서 확인한 근거

| 문서 | 확인한 내용 |
| --- | --- |
| `docs/01-product-planning.md` | MVP 기술 목표에 FastAPI 백엔드와 PostgreSQL 사용이 포함되어 있다. |
| `docs/02-architecture.md` | Backend, Database, LLM/Embedding provider가 확정되어 있고 환경변수로 `DATABASE_URL`을 사용한다. |
| `docs/04-development-guide.md` | Phase 0에 PostgreSQL 연결과 환경변수 로딩이 포함되어 있다. |
| `docs/reviews/phase-0-bootstrap-review.md` | Phase 0에서 환경변수 로딩과 `DATABASE_URL` 기반 SQLAlchemy engine 구성을 확인했다. |

## 14. 핵심 코드 흐름

```text
.env 파일 또는 운영체제 환경변수
-> load_dotenv()
-> os.getenv("DATABASE_URL", 기본값)
-> Settings.database_url
-> get_settings()
-> create_engine(settings.database_url)
-> PostgreSQL 연결 시도
```

```text
BACKEND_CORS_ORIGINS 문자열
-> Settings.backend_cors_origins
-> @property cors_origins
-> 쉼표 기준 split + strip
-> List[str]
-> CORSMiddleware allow_origins
```

## 15. 오늘은 여기까지만 알면 되는 것

- `settings.database_url`에는 `"DATABASE_URL"`이라는 이름 문자열이 아니라 최종 DB 접속 문자열이 들어간다.
- `.env.example`은 참고용이고, 실제 값은 `.env`나 운영체제 환경변수에 둔다.
- `load_dotenv()`는 `.env`를 환경변수처럼 읽을 수 있게 올려준다.
- `@lru_cache`가 붙은 `get_settings()`는 `Settings` 객체를 한 번 만든 뒤 재사용하게 해준다.
- `@property`는 `cors_origins`처럼 계산된 값을 메서드가 아니라 필드처럼 읽게 해준다.

## 16. 나중에 따로 볼 개념

- SQLAlchemy `create_engine(...)`가 실제 DB 연결을 언제 만들고 어떻게 관리하는지
- CORS가 왜 필요하고 `allow_origins`가 브라우저 요청에 어떤 영향을 주는지
- 배포 환경에서 환경변수를 등록하는 방식
- `pydantic-settings`를 쓰는 FastAPI 설정 패턴과 현재 코드의 차이
