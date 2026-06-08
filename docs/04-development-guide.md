# 04. Development Guide

이 문서는 `Dev Reflection Board`를 구현할 때의 작업 운영 기준입니다.
구현 판단은 `docs/01-product-planning.md`, `docs/02-architecture.md`, `docs/03-api-reference.md` 순서로 확인합니다.

## 1) 개발 원칙

- MVP는 “짧은 입력 -> Agent 질문 -> 답변 저장 -> AI 초안 -> 사용자가 수정 -> 기록 저장 -> 검색” 루프를 먼저 완성한다.
- RAG, MCP, Agent는 각각 크게 만들지 않고 핵심 루프에 붙는 최소 기능부터 구현한다.
- 한 브랜치는 하나의 명확한 결과물만 다룬다.
- API 변경은 `docs/03-api-reference.md`를 같이 수정한다.
- 스키마/엔티티 변경은 `docs/02-architecture.md`를 같이 수정한다.
- MVP 범위 변경은 `docs/01-product-planning.md`를 먼저 수정한다.
- README는 발표용 요약 문서로 유지하고, 내부 의사결정 로그로 사용하지 않는다.

## 2) 브랜치 전략

`main`에는 직접 push하지 않고, 작은 기능 브랜치를 사용합니다.

권장 브랜치 타입:

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`

브랜치 예시:

| 브랜치 | 목표 |
| --- | --- |
| `feature/bootstrap-app` | React/FastAPI 기본 실행 구조 구성 |
| `feature/auth-api` | 회원가입, 로그인, JWT 인증 구현 |
| `feature/entry-crud-api` | 회고 글 CRUD, 태그 upsert, 페이징/검색 API 구현 |
| `feature/comment-crud-api` | 댓글 CRUD 구현 |
| `feature/interview-session-api` | 인터뷰 세션과 메시지 저장 API 구현 |
| `feature/agent-draft-flow` | Agent 질문 선택과 초안 생성 흐름 구현 |
| `feature/rag-entry-search` | 저장된 글 기반 관련 기록 검색 구현 |
| `feature/github-mcp-context` | GitHub MCP 활동 조회와 ExternalContext 저장 구현 |
| `feature/frontend-core-flow` | 로그인부터 기록 저장까지 핵심 화면 연결 |
| `docs/readme-demo-polish` | 발표용 README와 데모 시나리오 정리 |

브랜치가 커지면 API, UI, AI 연동을 분리합니다.
예를 들어 인터뷰 기능은 `interview-session-api`, `agent-draft-flow`, `frontend-interview-flow`로 나눌 수 있습니다.

## 3) GitHub Issue / Project 운영

작업은 GitHub Issue로 만들고 GitHub Project에서 상태를 관리합니다.

권장 상태:

- `Todo`: 아직 시작하지 않은 작업
- `In Progress`: 현재 작업 중인 작업
- `Blocked`: 외부 결정, 기술 조사, 의존 작업 때문에 막힌 작업
- `Review`: PR 또는 자체 검토 대기
- `Done`: 구현, 검증, 문서 반영이 끝난 작업

Issue 제목 형식:

```text
<type>: <작업 요약>
```

예시:

- `feat: JWT signup/login API 구현`
- `feat: interview session message API 구현`
- `spike: pgvector 기반 RAG 검색 가능성 확인`
- `docs: API reference를 구현 결과에 맞게 갱신`

Issue 본문에는 최소한 아래를 적습니다.

- 목표: 이 이슈가 끝나면 무엇이 달라지는가
- 범위: 포함할 것과 제외할 것
- 참고 문서: 관련 docs 경로
- 완료 조건: 구현/테스트/문서 기준
- 예상 크기: `S`, `M`, `L`, `XL`

크기 기준:

| 크기 | 기준 |
| --- | --- |
| `S` | 반나절 이하 |
| `M` | 하루 정도 |
| `L` | 2~3일 걸릴 수 있음 |
| `XL` | 너무 큼. 여러 이슈로 쪼개야 함 |

## 4) 커밋 규칙

기본 형식:

```text
<type>: <subject>
```

권장 타입:

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `test`: 테스트 추가/수정
- `chore`: 설정, 의존성, 빌드 작업
- `refactor`: 동작 변경 없는 구조 개선

예시:

- `feat: add signup and login endpoints`
- `feat: add interview message flow`
- `fix: prevent access to another user's entry`
- `docs: update api reference for rag search`
- `test: add entry api integration tests`

커밋은 너무 크게 묶지 않습니다.
다만 아직 구현 초반이라 파일 구조가 자주 바뀌는 경우에는 브랜치 단위 PR 설명에서 변경 이유를 명확히 남깁니다.

## 5) 구현 순서

MVP 구현은 아래 순서를 기본으로 진행합니다.

### Phase 0. 프로젝트 기반 구성

목표: 로컬에서 프론트엔드, 백엔드, DB를 실행할 수 있게 만든다.

- React + TypeScript 프로젝트 생성
- FastAPI 프로젝트 생성
- PostgreSQL 연결
- 환경변수 로딩
- 기본 health check API
- 공통 API 응답 래퍼 준비

완료 기준:

- 프론트엔드 dev server가 실행된다.
- FastAPI 서버가 실행된다.
- DB 연결 확인이 가능하다.
- README 또는 개발 문서에 실행 명령이 기록된다.

### Phase 1. 인증 기반

목표: 사용자별 기록을 분리할 수 있게 한다.

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- password hashing
- JWT 발급/검증
- 인증 dependency 또는 middleware

완료 기준:

- 회원가입과 로그인이 동작한다.
- 인증이 필요한 API에서 토큰 검증이 가능하다.
- 다른 사용자의 리소스 접근을 막을 기반이 생긴다.

### Phase 2. 게시판 기본 기능

목표: AI 기능 없이도 기록 CRUD가 되는 기본 게시판을 만든다.

- `ReflectionEntry` CRUD
- `Comment` CRUD
- `Tag` / `EntryTag`
- `tag_names` upsert
- 목록 페이징
- 제목/본문/태그 검색
- 사용자별 권한 검사

완료 기준:

- 글 작성, 목록, 상세, 수정, 삭제가 된다.
- 댓글 작성, 수정, 삭제가 된다.
- 태그 기반 조회가 된다.
- `docs/03-api-reference.md`와 응답 형식이 맞는다.

### Phase 3. 인터뷰 세션과 Agent 최소 흐름

목표: 사용자의 짧은 입력을 여러 턴 질문/답변으로 구조화한다.

- `InterviewSession` 생성
- `InterviewMessage` append-only 저장
- 유형 선택 또는 분류
- 유형별 질문 템플릿
- 직접 구현한 Agent 상태 머신
- 최대 질문 수 제한
- 초안 생성 가능 상태 반환

완료 기준:

- `POST /api/v1/interviews`가 첫 질문을 반환한다.
- `POST /api/v1/interviews/{id}/messages`가 답변을 저장하고 다음 질문 또는 `draft_ready`를 반환한다.
- 질문은 기본 3개, 최대 5개 제한을 지킨다.

### Phase 4. AI 초안 생성과 저장

목표: 누적 인터뷰를 사용자가 수정 가능한 글 초안으로 바꾼다.

- OpenAI API 연동
- 초안 생성 prompt 구성
- `InterviewSession.draft_content` 저장
- `InterviewMessage(message_type=draft)` 저장
- `POST /api/v1/interviews/{id}/save-entry`
- 저장 후 `ReflectionEntry` 생성

완료 기준:

- 사용자는 인터뷰 답변을 바탕으로 초안을 받을 수 있다.
- 사용자는 초안을 수정해 최종 글로 저장할 수 있다.
- 저장된 글은 기존 게시판 목록/상세에서 조회된다.

### Phase 5. RAG 관련 기록 검색

목표: 현재 회고와 관련 있는 과거 기록을 보여준다.

- `POST /api/v1/rag/search`
- 검색 대상은 `ReflectionEntry.title`, `final_content`, `tags`
- pgvector 우선 검토
- 구현 지연 시 키워드/태그 fallback
- 초안 생성 시 관련 기록을 참고 자료로 전달
- `MessageContextRef`에 참고 기록 저장

완료 기준:

- 사용자는 현재 입력과 관련 있는 과거 기록을 볼 수 있다.
- AI가 참고한 기록이 UI 또는 응답에서 드러난다.
- vector 구현이 미완성인 경우 fallback 기준이 문서에 남아 있다.

### Phase 6. GitHub MCP 외부 맥락

목표: 오늘 실제 GitHub 활동을 회고 작성 맥락으로 가져온다.

- 커스텀 MCP Server 구현
- `get_today_github_activity` tool 구현
- GitHub API read-only 호출
- `POST /api/v1/external/github/today`
- `AgentToolCall` 저장
- `ExternalContext` 저장
- 세션 연결 시 tool result 메시지 저장

완료 기준:

- 특정 repository의 오늘 커밋 목록을 가져올 수 있다.
- 가져온 활동이 `ExternalContext`로 저장된다.
- MCP 실패 시에도 인터뷰 흐름이 중단되지 않는다.

### Phase 7. 프론트엔드 핵심 흐름

목표: 발표에서 end-to-end 데모가 가능한 화면을 만든다.

- 회원가입/로그인 화면
- 기록 목록/검색/태그 필터 화면
- 기록 상세/수정 화면
- 인터뷰 시작 화면
- 질문/답변 진행 화면
- 초안 확인/수정/저장 화면
- 관련 기록 및 GitHub 활동 표시

완료 기준:

- 사용자는 브라우저에서 로그인부터 기록 저장까지 진행할 수 있다.
- 데모용 핵심 흐름이 끊기지 않는다.
- 로딩, 실패, 빈 상태가 최소한으로 처리된다.

### Phase 8. 마감 정리

목표: 제출과 발표에 필요한 안정성을 확보한다.

- 예외 처리 정리
- 권한 검사 보강
- 테스트 보강
- 환경변수 예시 정리
- README 발표 흐름 정리
- 데모 시나리오 작성

완료 기준:

- 핵심 API와 화면의 smoke test가 완료된다.
- README만 보고 프로젝트 목적과 실행 방법을 이해할 수 있다.
- 알려진 한계와 Post-MVP 항목이 구분되어 있다.

## 6) Phase Review / 코드 리딩 루틴

각 Phase가 끝나면 바로 다음 구현으로 넘어가지 않고, 짧은 코드 리딩과 review report를 남깁니다.
목적은 모든 코드를 외우는 것이 아니라, 구현된 흐름의 책임 경계와 데이터 이동을 설명할 수 있게 되는 것입니다.

기본 원칙:

- 전체 파일을 처음부터 끝까지 정독하지 않는다.
- 해당 Phase의 핵심 요청 흐름을 따라간다.
- endpoint, service, repository, model/schema, external call 경계를 우선 읽는다.
- AI가 생성한 코드라도 핵심 경계는 직접 확인한다.
- boilerplate, import, 설정 파일은 흐름 이해에 필요한 만큼만 본다.
- 이해하지 못한 부분은 다음 Spike 또는 follow-up issue로 분리한다.

Phase별 우선 코드 리딩 대상:

| Phase | 많이 읽을 것 | 가볍게 볼 것 |
| --- | --- | --- |
| Phase 0. 기반 구성 | 앱 entrypoint, DB 연결, 환경변수 로딩, health check | 프레임워크 기본 boilerplate |
| Phase 1. 인증 | signup/login endpoint, password hashing, JWT 발급/검증, current user dependency | UI 세부 스타일, 자동 생성 설정 |
| Phase 2. 게시판 | Entry/Comment/Tag model, CRUD service, repository query, 권한 검사 | 반복적인 request/response schema |
| Phase 3. 인터뷰 | InterviewSession/Message 저장, sequence 처리, Agent 상태 전이, 질문 수 제한 | prompt 문구 세부 표현 |
| Phase 4. 초안 생성 | OpenAI 호출 경계, prompt 입력 구성, draft 저장, save-entry 흐름 | 모델별 튜닝 세부값 |
| Phase 5. RAG | 검색 대상 텍스트 구성, embedding 생성/저장, search query, fallback 기준 | embedding 수학 원리 |
| Phase 6. MCP | MCP server tool 정의, JSON-RPC 요청/응답, GitHub API 호출, ExternalContext 저장 | MCP specification 전체 |
| Phase 7. Frontend | 화면 -> API 호출 -> 상태 갱신 -> 에러 표시 흐름 | 디자인 세부값, 컴포넌트 미세 최적화 |
| Phase 8. 마감 | end-to-end demo flow, 실패 처리, README 실행/발표 흐름 | Post-MVP 확장 코드 |

Review report 저장 위치:

```text
docs/reviews/
├─ phase-0-bootstrap-review.md
├─ phase-1-auth-review.md
├─ phase-2-entry-crud-review.md
├─ phase-3-interview-agent-review.md
├─ phase-4-ai-draft-review.md
├─ phase-5-rag-review.md
├─ phase-6-mcp-review.md
├─ phase-7-frontend-flow-review.md
└─ phase-8-final-review.md
```

Report 작성 기준:

- 템플릿은 `docs/reviews/phase-review-template.md`를 사용한다.
- Phase 중 만난 개념을 AI와 공부할 때는 `docs/prompts/learning-loop-assistant-prompt.md`를 사용한다.
- report는 길게 쓰지 않는다. 다음 사람이 핵심 흐름을 따라갈 수 있을 정도면 충분하다.
- “AI가 요약한 설명”만 남기지 않는다. 실제 파일 경로와 내가 확인한 흐름을 적는다.
- 반드시 “내가 설명할 수 있어야 하는 질문”을 포함한다.
- Phase review가 끝나지 않은 상태에서 다음 Phase를 크게 진행하지 않는다.

## 7) Spike 운영 규칙

모르는 기술은 기능 구현 이슈가 아니라 Spike 이슈로 분리합니다.

Spike 예시:

- `spike: MCP server hello-world 실행`
- `spike: GitHub API를 MCP tool로 호출`
- `spike: pgvector로 ReflectionEntry 유사도 검색`
- `spike: OpenAI 초안 생성 prompt 비교`

Spike 완료 결과물:

- 실험한 것
- 성공/실패 결과
- 우리 프로젝트에 적용할 수 있는 방식
- 다음 구현 이슈
- 남은 리스크

Spike 결과는 필요하면 `docs/sprint/` 아래에 짧은 md 파일로 남깁니다.

## 8) PR 체크리스트

PR 또는 브랜치 마무리 전에 확인합니다.

- [ ] 이 브랜치의 목표가 하나로 설명된다.
- [ ] 관련 API가 `docs/03-api-reference.md`와 맞는다.
- [ ] 스키마나 엔티티가 바뀌었다면 `docs/02-architecture.md`를 갱신했다.
- [ ] MVP 범위나 정책이 바뀌었다면 `docs/01-product-planning.md`를 갱신했다.
- [ ] 인증/권한이 필요한 API에서 사용자 소유권을 확인한다.
- [ ] 성공 케이스와 주요 실패 케이스를 검증했다.
- [ ] 외부 API key, token, 개인 로그가 커밋되지 않았다.
- [ ] Phase가 끝나는 작업이라면 `docs/reviews/`에 review report를 남겼다.
- [ ] README 변경이 필요하면 발표용 관점으로 짧게 반영했다.

PR 설명에는 아래를 적습니다.

```markdown
## 변경 사항

## 검증

## 문서 반영

## 알려진 한계
```

## 9) 테스트와 검증 기준

구현 초반에는 모든 것을 완벽하게 자동화하려 하지 말고, 위험한 흐름부터 검증합니다.

우선순위:

1. Auth: 회원가입, 로그인, 토큰 검증, 권한 실패
2. Entry CRUD: 글 생성/조회/수정/삭제, 사용자별 접근 제한
3. Comment CRUD: 댓글 생성/수정/삭제, 사용자별 접근 제한
4. Interview: 세션 생성, 메시지 저장, 질문 수 제한
5. Draft: LLM 실패 처리, 초안 저장, 최종 글 저장
6. RAG: 검색 결과 반환, fallback 동작
7. MCP: GitHub 호출 성공/실패, ExternalContext 저장

검증 방식:

- Unit Test: pure function, 상태 머신, prompt 입력 구성, 검색 조건 조립
- Integration Test: FastAPI endpoint + DB
- Manual Smoke Test: 브라우저에서 로그인부터 기록 저장까지 확인
- External Smoke Test: OpenAI, GitHub, MCP 연동은 환경변수 있는 로컬에서 별도 확인

현재 실행 명령:

```text
Database run: docker compose up -d db
Database stop: docker compose down
Backend install: cd backend && python3 -m venv ../.venv && ../.venv/bin/pip install -r requirements-dev.txt
Backend run: cd backend && ../.venv/bin/uvicorn app.main:app --reload
Backend test: cd backend && ../.venv/bin/pytest -q
Frontend install: cd frontend && npm install
Frontend run: cd frontend && npm run dev
Frontend build: cd frontend && npm run build
```

## 10) 환경변수 관리

예상 환경변수:

```text
DATABASE_URL=
JWT_SECRET=
OPENAI_API_KEY=
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
MCP_SERVER_URL=
```

규칙:

- 실제 `.env`는 커밋하지 않는다.
- `.env.example`에는 값 없이 키만 기록한다.
- API key와 token은 로그에 남기지 않는다.
- GitHub token은 read-only 권한부터 사용한다.
- OpenAI 응답과 사용자 입력은 개인 데이터로 취급한다.

## 11) Codex 작업 요청 방식

좋은 요청 예시:

- `docs/01-product-planning.md와 docs/03-api-reference.md를 읽고 signup/login API만 구현해줘. 테스트도 같이 추가해줘.`
- `docs/02-architecture.md 기준으로 InterviewSession과 InterviewMessage 모델만 만들어줘.`
- `docs/03-api-reference.md 기준으로 POST /api/v1/interviews API를 구현해줘.`
- `RAG 구현 전에 pgvector spike 결과를 docs/sprint에 정리해줘.`
- `Phase 1 구현이 끝났으니 docs/reviews/phase-review-template.md 기준으로 auth 코드 리딩 report를 작성해줘.`
- `docs/prompts/learning-loop-assistant-prompt.md 기준으로 FastAPI Depends 개념을 auth 코드 흐름과 연결해서 짧은 티키타카로 설명해줘.`
- `구현된 기능 기준으로 README를 발표 친화적으로 다듬어줘.`

피해야 할 요청 예시:

- `프로젝트 전체 다 만들어줘`
- `AI 기능 전부 알아서 붙여줘`
- `문서 무시하고 빠르게 구현해줘`
- `README만 보고 전체 구조를 추측해서 구현해줘`

Codex에게 맡길 때는 항상 다음 중 최소 하나를 명시합니다.

- 기준 문서
- 구현할 endpoint 또는 화면
- 포함할 테스트
- 변경하지 말아야 할 범위

## 12) Codex 대화 로그 훅

프로젝트 로컬 Codex hook은 `.codex/hooks.json`에 둡니다.

- `UserPromptSubmit`: 사용자가 Codex에 보낸 질문을 로그로 남긴다.
- `Stop`: Codex 턴이 끝날 때 응답 이벤트를 로그로 남긴다.
- 로그 위치: `.codex/conversation-logs/YYYY-MM-DD.jsonl`
- 로그에는 질문, 답변 이벤트 payload, 작업 디렉터리, 생성 시각을 JSONL로 저장한다.
- 로그는 개인 작업 맥락과 민감 정보가 섞일 수 있으므로 `.gitignore`에 포함하고 커밋하지 않는다.
- 새로 추가되거나 바뀐 hook은 Codex에서 `/hooks`로 검토하고 신뢰 처리한 뒤 실행한다.

## 13) Definition of Done

하나의 작업은 아래 조건을 만족해야 완료로 봅니다.

- 구현 대상이 명확한 하나의 흐름으로 동작한다.
- 관련 API, DB, UI 변경이 문서와 어긋나지 않는다.
- 필요한 테스트 또는 수동 검증을 수행했다.
- Phase 단위 작업이라면 핵심 코드 흐름을 읽고 review report를 남겼다.
- 실패 케이스와 권한 케이스를 최소한 확인했다.
- 외부 연동 실패 시 사용자 흐름이 완전히 끊기지 않는다.
- 알려진 한계가 PR 또는 문서에 남아 있다.
- README 갱신이 필요한 변경이면 발표 관점으로 반영했다.
