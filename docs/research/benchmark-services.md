# Benchmark Services for AI Reflection Board

조사 기준일: 2026-06-07

이 문서는 AI 회고/트러블슈팅 보드 아이디어를 고도화하기 위해 참고할 만한 서비스와 벤치마킹 포인트를 정리합니다. 기준은 RAG, MCP, AI Agent 기능을 자연스럽게 제품 흐름에 붙일 수 있는지입니다.

## 1) 요약

AI 회고/트러블슈팅 보드는 다음 네 영역의 교차점에 있습니다.

- AI 저널: 사용자의 생각과 감정을 대화형으로 끌어내는 경험
- 개인 지식 관리: 과거 기록을 검색하고 현재 작업과 연결하는 경험
- 개발자 작업 메모리: GitHub, 코드, 문서, 대화 맥락을 회고 재료로 모으는 경험
- 트러블슈팅/포스트모템: 문제, 원인, 시도, 해결, 후속 조치를 구조화하는 경험

MVP에서는 아래 조합이 가장 설득력 있습니다.

1. Rosebud: AI 인터뷰어 UX
2. Reflect: 유사 기록 검색과 RAG UI
3. NotebookLM: source-grounded 답변과 근거 표시
4. EasyStandup: GitHub 활동 기반 회고 재료 수집
5. incident.io: 트러블슈팅/포스트모템 초안 구조

## 2) 서비스별 벤치마킹 포인트

| 서비스 | 서비스 성격 | 참고할 부분 | 우리 프로젝트에 적용할 방식 |
| --- | --- | --- | --- |
| [Rosebud](https://www.rosebud.app/) | AI 저널 / 회고 도우미 | 짧은 기록을 바탕으로 후속 질문을 던지고 사용자의 생각을 깊게 끌어내는 흐름 | 회고 인터뷰 화면에서 Agent가 상담가처럼 질문을 이어가는 UX의 1순위 레퍼런스로 삼는다. |
| [Mindsera](https://www.mindsera.com/) | AI 저널 / 사고 프레임워크 | 감정 분석, 반복 패턴 분석, 문제 해결/의사결정 템플릿 | 회고 질문을 단순 템플릿이 아니라 개발 의사결정 프레임워크로 확장한다. |
| [Day One](https://dayoneapp.com/features/) | 전통적 저널 앱 | 날짜별 아카이브, 태그, 검색, 사진/파일/위치 등 기록 보관 UX | AI 없는 기본 CRUD 화면의 기준으로 삼는다. 목록, 상세, 태그, 검색은 단순하고 안정적인 저널 UX로 만든다. |
| [Reflect](https://reflect.app/blog/ai-search) | 개인 노트 / AI 검색 | semantic search, similar notes, 검색 결과와 대화하기 | 회고 작성/상세 화면에 "관련 과거 회고" 패널을 두고, RAG 결과를 사용자가 직접 확인할 수 있게 한다. |
| [NotebookLM](https://support.google.com/notebooklm/answer/16164461) | 소스 기반 AI 노트 | 업로드한 source 안에서 답변하고, 답변에 근거 citation을 붙이는 방식 | RAG 답변에 근거 회고, 커밋, 외부 맥락을 함께 표시한다. AI가 왜 그런 질문을 했는지 추적 가능하게 만든다. |
| [Notion AI Q&A](https://www.notion.com/en-gb/help/guides/get-answers-about-content-faster-with-q-and-a) | 워크스페이스 Q&A | 문서/DB 전체에서 질문하고 요약하는 흐름 | "내 회고 보드에 질문하기" 기능의 장기 레퍼런스로 둔다. 예: 최근 2주 고민, FastAPI 트러블슈팅 요약. |
| [Pieces for Developers](https://pieces.app/features) | 개발자 장기 메모리 | IDE, 브라우저, 문서, 코드 등 작업 맥락을 장기 메모리로 저장하는 방향 | 장기적으로 개발자 작업 맥락 메모리 제품으로 확장할 때 참고한다. MVP에서는 GitHub 활동만 수집한다. |
| [EasyStandup](https://www.easystandup.com/) | GitHub 기반 스탠드업 자동화 | 커밋, PR, 리뷰를 바탕으로 daily standup 요약 생성 | MCP의 직접 레퍼런스. `get_today_github_activity` tool로 오늘 한 일을 가져와 Agent 질문의 재료로 쓴다. |
| [Geekbot](https://geekbot.com/) | 비동기 스탠드업 봇 | 정해진 질문을 주기적으로 던지고 응답을 모으는 구조 | 고정 질문 기반 인터뷰 세션의 초기 버전 참고. Agent 전 단계에서 쓰기 좋다. |
| [incident.io AI Platform](https://incident.io/ai-platform) | 장애 대응 / 포스트모템 자동화 | 사고 조사, 업데이트, 포스트모템 초안 생성 | 트러블슈팅 타입 기록의 템플릿과 Agent 초안 생성 구조에 참고한다. |

## 3) RAG 관점 레퍼런스

### Reflect

Reflect는 semantic search, similar notes, AI chat with notes가 이 프로젝트의 RAG 방향과 가장 가깝습니다. 중요한 점은 검색 결과를 단순히 LLM prompt 내부에 숨기지 않고, 사용자가 볼 수 있는 "관련 노트"로 보여준다는 것입니다.

적용 아이디어:

- 회고 작성 화면 오른쪽에 관련 과거 회고 top-k 패널을 둔다.
- 각 관련 회고에는 제목, 날짜, 타입, 태그, 유사도 또는 관련 이유를 표시한다.
- Agent가 질문할 때 어떤 과거 회고를 참고했는지 함께 보여준다.

### NotebookLM

NotebookLM은 source-grounded 답변과 citation UX가 핵심입니다. 이 프로젝트의 RAG도 "과거에 비슷한 고민이 있었다"라고만 말하면 신뢰도가 낮습니다. 어떤 회고, 어떤 커밋, 어떤 외부 맥락을 근거로 했는지 보여줘야 합니다.

적용 아이디어:

- AI 질문 옆에 "참고한 기록" 링크를 둔다.
- RAG 검색 결과가 부족하면 "관련 기록이 부족한 상태에서 생성된 질문"이라고 표시한다.
- 회고 초안의 참고 링크 섹션에 관련 과거 회고와 GitHub 활동을 남긴다.

## 4) MCP 관점 레퍼런스

### EasyStandup

EasyStandup은 GitHub 커밋, PR, 리뷰를 스탠드업 요약 재료로 사용하는 점이 직접적인 레퍼런스입니다. 이 프로젝트에서는 같은 데이터를 "오늘 회고 재료"로 바꾸면 자연스럽습니다.

적용 아이디어:

- `get_today_github_activity`: 오늘 커밋, PR, Issue, 리뷰를 가져온다.
- `summarize_github_activity`: 가져온 활동을 회고 질문용 bullet로 정리한다.
- `save_external_context`: 외부 활동 요약을 인터뷰 세션에 저장한다.

### GitHub MCP Server

[GitHub MCP Server](https://github.com/github/github-mcp-server)는 GitHub API를 MCP toolset으로 노출하는 공식 레퍼런스입니다. MVP에서 모든 기능을 따라 할 필요는 없지만, tool 이름, 입력 schema, 권한 분리, read-only tool 우선 설계는 참고할 가치가 있습니다.

적용 아이디어:

- MVP MCP tool은 read-only 중심으로 제한한다.
- GitHub token은 환경변수로 관리한다.
- tool 호출 결과는 원본 JSON 전체가 아니라 회고에 필요한 최소 필드만 저장한다.
- 사용자에게 어떤 외부 데이터를 가져왔는지 표시한다.

### MCP 공식 문서

[MCP Tools 사양](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)은 서버가 LLM이 호출할 수 있는 tools를 노출하는 구조와 JSON-RPC 오류 처리, 사용자 확인, 입력 검증 같은 보안 고려사항을 설명합니다.

적용 아이디어:

- MCP server는 JSON-RPC 요청/응답을 명시적으로 처리한다.
- tool 호출 실패는 Agent가 복구할 수 있는 에러 코드로 반환한다.
- 민감한 tool은 사용자 확인을 요구한다.
- MVP에서는 쓰기 기능보다 읽기 기능을 우선한다.

## 5) AI Agent 관점 레퍼런스

### Rosebud

Rosebud은 "사용자가 대충 써도 AI가 질문으로 생각을 끌어낸다"는 경험의 좋은 레퍼런스입니다. 이 프로젝트의 핵심도 AI가 대신 글을 써주는 것이 아니라, 회고할 재료를 더 잘 끌어내는 것입니다.

적용 아이디어:

- 첫 입력이 짧아도 바로 초안 생성하지 않고, 사건/감정/결정/결과 중 부족한 부분을 질문한다.
- 질문은 최대 5개로 제한한다.
- 사용자가 "그만 정리해줘"라고 하면 즉시 초안을 만든다.

### Mindsera

Mindsera는 감정, 사고 패턴, 문제 해결 템플릿을 저널에 적용하는 방향이 강합니다. 개발자 회고에서는 이를 기술 선택, 팀 의사결정, 문제 해결 방식으로 바꿔 적용할 수 있습니다.

적용 아이디어:

- 회고 타입별 질문 전략을 둔다.
- `daily`: 사건, 감정, 배운 점, 다음 액션
- `trouble`: 증상, 원인 후보, 시도, 해결, 예방책
- `decision`: 선택지, 기준, 선택 이유, 결과 추적
- `team_issue`: 상황, 내 역할, 상대 입장, 다음 커뮤니케이션

### incident.io

incident.io의 포스트모템 자동화 흐름은 트러블슈팅 기록에 적합합니다. 장애 대응 서비스처럼 무겁게 만들 필요는 없지만, 문제 해결 기록을 구조화하는 형식은 가져올 만합니다.

적용 아이디어:

- 트러블슈팅 초안 템플릿을 고정한다.
- `문제 상황 -> 에러 메시지/증상 -> 원인 후보 -> 시도한 방법 -> 최종 해결 -> 재발 방지` 순서를 유지한다.
- Agent는 누락된 섹션만 추가 질문한다.

## 6) MVP에 바로 반영할 기능 조합

가장 현실적인 MVP 조합:

| 축 | 구현 내용 | 데모 포인트 |
| --- | --- | --- |
| 기본 게시판 | 회고 글 CRUD, 댓글, 태그, 페이징, 검색 | 과제 필수 게시판 기능 충족 |
| RAG | 저장된 회고 embedding, 유사 기록 top-k 검색 | "예전에도 비슷한 고민이 있었어요" |
| MCP | GitHub 오늘 활동 조회 tool | "오늘 커밋을 보니 auth/db 작업을 했네요" |
| Agent | 최대 5개 질문 후 회고/트러블슈팅 초안 생성 | "부족한 정보를 판단해 질문하고 초안을 생성" |

추천 데모 시나리오:

1. 사용자가 로그인한다.
2. "오늘 FastAPI 구조를 어떻게 나눌지 고민했다"라고 입력한다.
3. MCP가 오늘 GitHub 활동을 가져온다.
4. RAG가 과거의 FastAPI/구조화 관련 회고를 찾는다.
5. Agent가 "router/service/repository 분리 고민인가요?"처럼 후속 질문을 던진다.
6. 사용자가 2~3개 답변을 한다.
7. Agent가 회고 초안을 생성한다.
8. 사용자가 수정 후 게시글로 저장한다.

## 7) 범위 조절 기준

MVP에 넣을 것:

- GitHub read-only MCP 연동
- 저장된 회고 기반 RAG
- 회고 타입별 Agent 질문 전략
- 근거 기록 표시

MVP에서 제외할 것:

- ChatGPT/Gemini 전체 기록 자동 연동
- IDE/터미널/브라우저 전체 활동 수집
- 복잡한 LangGraph 멀티 에이전트
- 감정 분석 대시보드
- 실시간 알림
- 자동 제재 또는 자동 운영 기능

## 8) 최종 판단

이 아이디어는 RAG, MCP, AI Agent를 붙이기에 충분히 적합합니다. 특히 세 기능이 각각 따로 존재하는 것이 아니라 하나의 흐름으로 연결됩니다.

- MCP는 오늘의 실제 작업 맥락을 가져온다.
- RAG는 과거의 기록과 현재 고민을 연결한다.
- Agent는 두 맥락을 바탕으로 질문하고 회고 초안을 만든다.

따라서 제품 방향은 "일반 AI 게시판"보다 "개발자 회고/트러블슈팅 보드"로 좁히는 것이 좋습니다. 발표에서도 과제 요구사항을 충족하면서 AI 기능의 필요성을 설득하기 쉽습니다.
