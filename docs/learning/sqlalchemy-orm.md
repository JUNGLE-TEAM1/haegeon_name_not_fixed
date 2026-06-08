# Concept Learning Note

## 0. 핵심 한 문장

SQLAlchemy는 Python 코드가 DB와 대화하도록 돕는 도구이며, ORM은 Python 객체의 변경을 SQL로 번역해 반복적인 CRUD 작업을 줄여준다.

## 1. 개념

- 주 개념: SQLAlchemy ORM
- 같이 나온 개념: Engine, Connection Pool, Session, Transaction, Base, Raw SQL
- 별도 노트 후보: SQLAlchemy Core vs ORM, Transaction, N+1 문제, Lazy/Eager Loading

## 2. 이 개념을 만난 맥락

- Phase: Phase 0. 프로젝트 기반 구성
- 관련 기능: DB 연결, health check, 이후 모델/CRUD 구현 기반
- 관련 endpoint: `/api/v1/health`
- 관련 파일: `backend/app/core/database.py`

## 3. 처음 헷갈렸던 점

SQLAlchemy가 무엇인지, `engine`, `SessionLocal`, `session`, `Base`가 각각 어떤 역할을 하는지 헷갈렸다.

## 4. 이해가 막혔던 gap

- gap 유형: 비슷한 개념과 차이를 모르겠음
- 막혔던 지점: Session이 connection인지, transaction인지, 요청 전체인지 구분이 어려웠다.

## 5. gap을 메운 설명

`engine`은 DB 연결 설정과 connection pool을 관리한다.
`SessionLocal`은 session을 만들어주는 공장이다.
`session`은 DB 작업을 하나로 묶고, 객체 변경을 추적하며, `commit()` 또는 `rollback()`으로 DB 반영 여부를 관리하는 작업 단위 객체다.

## 6. 클릭한 순간

`user.name = "sisu"`는 Python 객체만 바꾸고, `session.commit()`을 해야 DB에 UPDATE가 반영된다는 예시에서 Session의 역할이 분명해졌다.

## 7. 내가 이해한 말

SQLAlchemy Session은 "DB 관련 작업들을 하나로 묶어서 관리하기 위한 논리적 단위"이다.
커넥션 풀은 `engine`이 가지고 있고, `SessionLocal`이 만든 `session`이 DB 작업 중 connection을 빌려 쓰고 끝나면 반납한다.
ORM은 만들어둔 객체를 DB에 반영할 수 있게 해서 반복되는 CRUD boilerplate를 줄여준다.

## 8. AI가 교정해준 부분

`session.close()`를 안 하면 새 connection pool이 계속 생기는 것이 아니라, session이 빌린 connection이 pool로 반환되지 않아 connection pool 고갈이 발생할 수 있다고 교정했다.
`SessionLocal` 자체가 작업을 수행하는 것이 아니라, `SessionLocal()`이 만든 `session`이 실제 DB 작업 단위라고 정리했다.
`Base` 자체가 JPA의 `@Entity`와 완전히 같은 것은 아니고, `Base`를 상속한 클래스가 JPA의 `@Entity` 클래스처럼 ORM 관리 대상이 된다고 교정했다.

## 9. 프로젝트 안에서의 역할

이 프로젝트는 회고 글, 인터뷰 세션, 메시지, 태그, 댓글 등을 PostgreSQL에 저장해야 한다. SQLAlchemy는 FastAPI 백엔드와 DB 사이에서 연결, 세션 관리, 모델-테이블 매핑, SQL 실행을 담당하는 기반이다.

## 10. 프로젝트 코드에서 확인한 근거

| 파일 | 확인한 내용 |
| --- | --- |
| `backend/app/core/database.py` | `create_engine(...)`으로 DB engine 생성 |
| `backend/app/core/database.py` | `SessionLocal = sessionmaker(bind=engine, ...)`로 session 공장 생성 |
| `backend/app/core/database.py` | `session.close()`로 요청 후 session 정리 |
| `backend/app/core/database.py` | `Base = declarative_base()`로 ORM 모델의 공통 기반 생성 |
| `backend/app/core/database.py` | `connection.execute(text("SELECT 1"))`로 raw SQL에 가까운 health check 실행 |

## 11. 관련 문서에서 확인한 근거

| 문서 | 확인한 내용 |
| --- | --- |
| `docs/02-architecture.md` | PostgreSQL을 관계형 DB로 사용하고 User, ReflectionEntry, InterviewSession 등 핵심 엔티티를 정의함 |
| `docs/04-development-guide.md` | Phase 0에서 PostgreSQL 연결과 health check API를 완료 기준으로 둠 |

## 12. 핵심 코드 흐름

```text
FastAPI 요청
-> get_db()
-> session_scope()
-> session = SessionLocal()
-> repository/service에서 session으로 DB 작업
-> session.commit() 또는 rollback
-> session.close()
-> connection pool로 연결 반환
```

## 13. 오늘은 여기까지만 알면 되는 것

- SQLAlchemy는 DB toolkit이고, ORM 기능도 제공한다.
- ORM은 SQL을 몰라도 되게 하는 도구가 아니라, 객체 조작을 SQL로 번역하는 계층이다.
- SQLAlchemy를 잘 쓰려면 실제로 어떤 SQL이 나갈지 예상할 수 있어야 한다.
- 단순 CRUD에서는 ORM이 반복 작업을 줄여주지만, 복잡한 조회와 성능 문제에서는 SQL 이해가 필요하다.

## 14. 나중에 따로 볼 개념

- Transaction과 rollback
- SQLAlchemy Core vs ORM
- Lazy loading / eager loading
- N+1 문제
- Index와 query plan

## 15. 내가 다시 설명할 수 있어야 하는 질문

- `engine`, `SessionLocal`, `session`은 각각 어떤 역할을 하는가?
- `user.name = "sisu"`와 `session.commit()` 사이에는 어떤 차이가 있는가?
- ORM을 써도 SQL 공부가 필요한 이유는 무엇인가?

## 16. 직접 확인해볼 작은 실험

| 실험 | 상태 | 결과 |
| --- | --- | --- |
| 추천: SQLAlchemy 모델 하나를 만들고 `session.add(...)`, `commit()` 전후 DB 반영 차이를 확인하기 | `not_run` |  |
| 선택: `connection.execute(text("SELECT 1"))`와 ORM 조회 코드의 차이를 비교하기 | `not_run` |  |

## 17. 아직 남은 질문

- SQLAlchemy Core와 ORM은 정확히 어떻게 다른가?
- Session은 transaction을 언제 시작하고 언제 끝내는가?
- ORM 코드가 실제 어떤 SQL을 만드는지 어떻게 확인하는가?

## 18. 다음에 이 개념을 다시 써야 하는 순간

- `User`, `ReflectionEntry`, `InterviewSession` 모델을 만들 때
- 회원가입 API에서 `session.add(user)`와 `session.commit()`을 구현할 때
- CRUD repository를 만들고 DB 조회/수정 흐름을 작성할 때
