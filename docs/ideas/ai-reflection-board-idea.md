# AI 회고/트러블슈팅 보드 아이디어 정리

## 1. 배경

나만무 전 2주 동안 개인별로 풀스택 CRUD 프로젝트를 만들고, 그 위에 AI 응용 기술인 RAG, MCP, AI Agent를 붙여보는 과제를 진행한다.

처음에는 일반적인 게시판을 생각할 수 있지만, 단순 게시판은 재미가 떨어지고 AI 기능을 억지로 붙이게 될 가능성이 있다. 그래서 실제로 내가 필요로 하고, 앞으로도 쓸 수 있으며, RAG/MCP/Agent가 자연스럽게 들어갈 수 있는 주제를 찾는 방향으로 논의했다.

논의 끝에 나온 방향은 다음과 같다.

> 개발자가 하루 동안 겪은 사건, 고민, 감정, 의사결정, 문제 해결 과정을 AI와 대화하듯 털어놓으면, AI Agent가 상담하듯 질문을 이어가며 맥락을 끌어내고, RAG로 과거 기록을 참고해 회고/트러블슈팅 기록을 대신 작성해주는 서비스.

---

## 2. 문제 정의

### 2.1 사용자가 겪는 문제

하루 동안 배운 것, 고민한 것, 느낀 점, 의사결정, 문제 해결 과정을 기록하고 싶지만 직접 쓰기는 어렵다.

구체적으로는 다음 문제가 있다.

- 빈 화면 앞에서 회고를 처음부터 쓰는 것이 막막하다.
- 그날 있었던 일을 정리하려면 시간이 오래 걸린다.
- 무엇을 써야 할지 모르겠다.
- 단순히 “오늘 한 일”만 적으면 깊이 있는 회고가 되지 않는다.
- 사건, 감정, 의사결정, 결과, 아쉬움, 다음 액션을 구조화하기 어렵다.
- ChatGPT나 Gemini에게 대필을 시키려면 매번 맥락 초안을 직접 만들어줘야 한다.
- 예전에 비슷한 고민을 했는지, 어떤 결론을 냈는지 기억하기 어렵다.
- 기술 문제 해결 과정도 지나고 나면 흐려져서 다시 활용하기 어렵다.

### 2.2 해결하고 싶은 핵심 문제

이 서비스가 해결하려는 핵심 문제는 다음이다.

> 회고를 쓰고 싶은데, 처음부터 정리하기가 너무 막막하다.

따라서 서비스는 단순한 게시판이나 일기장이 아니라, 사용자의 생각을 끌어내고 정리해주는 **회고 인터뷰어**가 되어야 한다.

---

## 3. 서비스 컨셉

## 3.1 한 줄 설명

> 개발자가 하루 동안의 커밋, 에러, 의사결정, 팀플 고민을 AI와 대화하듯 털어놓으면, AI Agent가 질문을 이어가며 맥락을 끌어내고, 과거 기록을 RAG로 연결해 개발 회고/트러블슈팅 로그를 자동 작성해주는 서비스.

## 3.2 서비스 이름 후보

아직 확정하지 않았다.

가능한 이름 후보:

- Dev Reflection Board
- Reflection Agent
- DevLog Agent
- TroubleLog
- RecallLog
- 회고봇
- 개발자 회고 보드
- AI 회고 인터뷰어

## 3.3 핵심 가치

이 서비스의 핵심 가치는 “AI가 대신 글을 써준다”가 아니다.

더 정확히는 다음이다.

1. 사용자가 대충 말해도 된다.
2. AI가 상담가처럼 질문을 이어가며 생각을 끌어낸다.
3. 과거 기록을 찾아서 지금 고민과 연결해준다.
4. 사용자의 답변을 바탕으로 회고문/트러블슈팅 로그를 대신 정리한다.
5. 기록이 쌓일수록 더 개인화된 질문과 회고가 가능해진다.

---

## 4. 벤치마킹할 수 있는 서비스

완전히 같은 서비스는 드물지만, 기능별로 참고할 수 있는 서비스가 있다.

### 4.1 Rosebud

AI 저널 서비스에 가깝다. 사용자가 짧게 기록하면 AI가 질문을 던지고, 감정과 생각을 정리하도록 도와준다.

참고할 점:

- 대화형 저널 UX
- AI가 후속 질문을 던지는 방식
- 감정과 생각을 끌어내는 인터뷰 흐름
- 기록이 쌓였을 때 개인화된 인사이트를 제공하는 방식

차별화 방향:

- Rosebud은 일반적인 자기이해/감정 저널에 가깝다.
- 이 서비스는 개발자 회고, 팀플 회고, 트러블슈팅, 의사결정 기록에 특화한다.

### 4.2 Mindsera

생각 패턴, 감정 패턴, 반복되는 고민을 분석하는 AI 저널 서비스로 볼 수 있다.

참고할 점:

- 반복되는 감정/생각 패턴 분석
- 개인 성장 관점의 인사이트 제공
- 과거 기록을 바탕으로 현재 상태를 해석하는 방식

차별화 방향:

- 개발자의 기술적 고민, 팀 프로젝트 의사결정, 문제 해결 패턴을 분석한다.

### 4.3 Day One

전통적인 저널 앱이다. 기록 목록, 날짜별 아카이브, 검색, 태그, 보관 UX를 참고할 수 있다.

참고할 점:

- 기록 목록 UI
- 날짜별 아카이브
- 태그/검색
- 기록을 다시 찾아보는 경험

차별화 방향:

- 단순 기록 저장이 아니라 AI 인터뷰와 자동 정리 기능을 핵심으로 둔다.

### 4.4 GitHub Standup/Commit Summary 도구

Git 커밋 기록을 바탕으로 daily standup이나 작업 요약을 만들어주는 도구들이 있다.

참고할 점:

- GitHub 커밋/PR/이슈 기반 오늘 한 일 자동 수집
- 작업 내용을 요약해 회고 재료로 사용하는 방식

차별화 방향:

- 단순 커밋 요약이 아니라, 사용자의 감정/의사결정/문제 해결 과정까지 인터뷰로 끌어낸다.

---

## 5. CRUD 프로젝트로서의 형태

이 프로젝트는 겉으로 보면 게시판이지만, 일반 게시판이 아니라 **회고/트러블슈팅 기록 보드**이다.

### 5.1 핵심 도메인

#### Reflection Entry

하나의 회고 글이다.

필드 예시:

- id
- user_id
- title
- type
  - daily
  - trouble
  - decision
  - learning
  - team_issue
- raw_memo
- ai_draft
- final_content
- emotion
- tags
- visibility
- created_at
- updated_at

#### Interview Session

AI가 사용자와 대화하면서 회고 재료를 모으는 세션이다.

필드 예시:

- id
- user_id
- status
  - in_progress
  - draft_generated
  - saved
  - cancelled
- current_step
- initial_input
- messages
- extracted_facts
- created_at
- updated_at

#### Comment

회고 글에 대한 댓글이다.

용도:

- 사용자의 추가 메모
- AI 피드백
- 다른 사용자의 리뷰

#### Tag

회고와 트러블슈팅 기록을 분류하는 태그이다.

예시:

- FastAPI
- React
- 팀플
- 리더십
- 트러블슈팅
- 의사결정
- 감정
- 회고
- DB
- 인증
- AI Agent

### 5.2 기본 게시판 요구사항 대응

과제의 기본 게시판 요구사항은 다음과 같이 연결할 수 있다.

| 과제 요구사항 | 이 서비스에서의 구현 |
| --- | --- |
| 회원가입 / 로그인 | 개인 회고 기록을 사용자별로 분리 |
| 게시물 CRUD | 회고/트러블슈팅/의사결정 기록 생성, 조회, 수정, 삭제 |
| 댓글 | 회고에 대한 추가 메모, 피드백, AI 코멘트 |
| 태그 | 기술/감정/주제/프로젝트별 분류 |
| 페이징 | 회고 목록 페이지네이션 |
| 검색 | 키워드, 태그, 타입 기반 검색 |

---

## 6. AI 기능 설계

이 서비스에는 RAG, MCP, AI Agent가 모두 자연스럽게 들어갈 수 있다.

## 6.1 RAG 기능

### 6.1.1 RAG의 역할

이 서비스에서 RAG는 “과거의 나를 기억하는 장치”이다.

단순히 문서를 검색하는 것이 아니라, 사용자의 과거 회고/트러블슈팅/의사결정 기록을 현재 대화에 연결한다.

### 6.1.2 주요 기능

#### 1. 비슷한 과거 기록 찾기

사용자가 오늘 회고를 작성하면, 과거 기록 중 의미적으로 비슷한 글을 찾아준다.

예시:

사용자 입력:

> 팀원이 느려서 내가 그냥 처리할지, 기다려야 할지 고민했다.

RAG 검색 결과:

- Pintos 때 혼자 많이 구현해서 아쉬웠던 회고
- 리더 역할을 맡을지 고민했던 기록
- 팀원이 느린 상황에서 어떻게 해야 할지 고민했던 기록

AI 응답 예시:

> 예전에도 “내가 빨리 처리하는 것”과 “팀원이 성장하도록 기다리는 것” 사이에서 고민한 기록이 있습니다. 오늘 상황은 그때와 비슷했나요, 아니면 달랐나요?

#### 2. 개인화된 회고 질문 생성

일반적인 회고 질문은 너무 뻔하다.

일반 질문:

- 오늘 좋았던 점은?
- 아쉬웠던 점은?
- 내일 할 일은?

RAG 기반 개인화 질문:

- 지난번에도 “혼자 너무 많이 끌고 간 것”을 아쉬워했습니다. 오늘도 비슷한 상황이 있었나요?
- 예전에 “기술적 딥다이브를 목표로 삼겠다”고 했습니다. 오늘 한 일은 그 목표에 가까웠나요?
- 이전에는 팀 분위기보다 기술 성장 기회를 더 걱정했습니다. 오늘의 의사결정은 어느 쪽에 가까웠나요?

#### 3. 의사결정 결과 추적

Decision 타입의 기록을 저장해두고, 며칠 뒤 관련 회고에서 다시 꺼낸다.

예시:

과거 결정:

> 이번 프로젝트에서는 FastAPI를 쓰기로 결정했다. 이유는 빠르게 구현하고 AI 기능과 붙이기 쉽기 때문이다.

며칠 뒤 질문:

> 며칠 전 FastAPI를 선택했습니다. 지금까지 봤을 때 이 선택은 좋았나요? 구조화 부족이나 유지보수 문제는 있었나요?

#### 4. 반복 패턴 분석

기록이 쌓이면 특정 기간 동안 반복된 고민과 감정을 분석할 수 있다.

예시 질문:

> 최근 2주 동안 반복된 고민을 요약해줘.

가능한 결과:

- 기술 선택에서 자주 불안해함
- 팀 내 역할 결정에서 부담을 느낌
- 직접 구현하면서 성장하고 싶어함
- 회고를 쓰고 싶지만 정리 비용 때문에 미룸
- 문제 해결 과정은 잘하지만 기록화가 약함

### 6.1.3 RAG 구현 방향

MVP에서는 다음 흐름으로 구현한다.

1. 사용자가 회고 글을 저장한다.
2. 저장된 회고의 title, raw_memo, final_content, tags를 embedding한다.
3. pgvector 또는 ChromaDB에 저장한다.
4. 새 회고 작성 시 현재 입력을 embedding한다.
5. 유사 기록 top-k를 검색한다.
6. 검색된 기록을 LLM prompt에 context로 넣는다.
7. AI가 과거 기록을 참고해 질문 또는 회고 초안을 생성한다.

기술 선택 후보:

- PostgreSQL + pgvector
- ChromaDB
- LangChain
- LlamaIndex
- OpenAI Embedding 또는 다른 상용 embedding model

2주 MVP에서는 PostgreSQL을 이미 쓰기 때문에 pgvector를 쓰면 구조가 깔끔하다. 다만 설정이 부담되면 ChromaDB로 빠르게 시작할 수 있다.

---

## 6.2 MCP 기능

### 6.2.1 MCP의 역할

이 서비스에서 MCP는 “외부 시스템에서 오늘 한 일의 재료를 가져오는 도구”이다.

회고를 쓰려면 오늘 실제로 무엇을 했는지 기억해야 한다. 하지만 사용자가 직접 모든 것을 떠올리기 어렵다. MCP는 GitHub, 파일, 외부 AI 대화 기록 등에서 오늘의 활동 데이터를 가져와 회고의 재료로 제공한다.

### 6.2.2 가능한 MCP 연동

#### 1. GitHub 연동

가장 현실적이고 과제용으로 적합하다.

가져올 수 있는 정보:

- 오늘 커밋 목록
- 오늘 생성/수정한 PR
- 오늘 참여한 Issue
- 커밋 메시지
- 변경 파일 목록

사용 예시:

> 오늘 GitHub 기록을 보니 `auth`, `db schema`, `reflection agent` 관련 커밋이 있었어요. 이 중에서 가장 고민이 컸던 작업은 뭐였나요?

#### 2. ChatGPT/Gemini 대화 기록 연동

기술적으로 아이디어는 좋지만, 기존 ChatGPT/Gemini 전체 대화 기록을 외부 서비스가 MCP로 자동 조회하는 것은 현실적으로 어렵다.

대신 가능한 방향은 다음이다.

- 사용자가 ChatGPT export 파일을 업로드한다.
- 사용자가 Gemini 대화를 수동으로 붙여넣거나 export/import한다.
- 앞으로의 대화는 이 서비스 안에서 하도록 유도한다.
- ChatGPT가 내 서비스의 MCP tool을 호출해 현재 대화의 요약을 저장하는 구조를 장기 아이디어로 둔다.

#### 3. 로컬 파일 또는 Markdown 기록 연동

사용자가 작성한 TIL, 회의록, 에러 로그 파일을 가져와 회고 재료로 쓸 수 있다.

MVP에서는 GitHub 연동 하나만 구현해도 충분하다.

### 6.2.3 MCP 구현 방향

과제에서 MCP는 MCP Server 구현, JSON-RPC 기반 요청/응답, 외부 서비스 연동, API Key/권한 관리 전략을 요구한다.

MVP에서는 다음 tool을 구현한다.

- `get_today_github_activity`
  - 오늘 커밋/PR/Issue 정보를 가져온다.
- `save_external_context`
  - 외부에서 가져온 맥락을 회고 세션에 저장한다.
- `search_external_context`
  - 저장된 외부 맥락을 검색한다.

GitHub token은 환경변수로 관리한다.

---

## 6.3 AI Agent 기능

### 6.3.1 Agent의 역할

이 서비스의 중심은 AI Agent이다.

Agent는 단순히 사용자의 입력을 요약하는 역할이 아니다. 사용자의 첫 입력을 보고, 무엇이 부족한지 판단한 뒤, 적절한 질문을 이어가고, 필요한 경우 RAG/MCP 도구를 호출한 뒤, 최종 회고 초안을 생성한다.

### 6.3.2 Agent 흐름

기본 흐름:

```text
START
→ COLLECT_EVENT
→ COLLECT_EMOTION
→ COLLECT_DECISION
→ COLLECT_RESULT
→ RETRIEVE_RELATED_MEMORY
→ GENERATE_FOLLOWUP_QUESTION
→ GENERATE_DRAFT
→ SAVE_ENTRY
```

### 6.3.3 Agent가 판단해야 하는 것

Agent는 사용자 답변을 보고 다음을 판단한다.

- 사건이 충분히 설명되었는가?
- 감정이 드러났는가?
- 사용자가 어떤 선택을 했는가?
- 그 선택의 결과가 있었는가?
- 아쉬움 또는 좋았던 점이 있는가?
- 다음 액션이 있는가?
- 기술 문제라면 원인/시도/해결 과정이 정리되었는가?
- 과거 기록을 참고해야 하는가?
- GitHub 활동을 가져와야 하는가?
- 이제 회고 초안을 생성해도 되는가?

### 6.3.4 Agent 질문 예시

사용자 입력:

> 오늘 팀 회의에서 내가 말을 너무 많이 한 것 같아서 찝찝했어.

Agent 질문:

- 어떤 순간에 그렇게 느꼈나요?
- 그때 원래 기대했던 회의 모습은 뭐였나요?
- 말을 많이 한 게 실제로 문제였나요, 아니면 그렇게 보였을까 봐 걱정된 건가요?
- 그 선택이 결과적으로 팀에 도움이 됐나요, 아니면 아쉬움을 남겼나요?
- 다음 회의에서는 무엇을 다르게 해보고 싶나요?

사용자 입력:

> FastAPI 구조를 어떻게 나눠야 할지 모르겠어.

Agent 질문:

- 지금 고민하는 구조는 router/service/repository 분리와 관련된 건가요?
- 지금 프로젝트에서 변경 가능성이 큰 부분은 어디인가요?
- 너무 단순하게 짰을 때 걱정되는 점은 무엇인가요?
- 반대로 너무 복잡하게 나눴을 때 걱정되는 점은 무엇인가요?
- 예전에 구조화와 기술 부채를 고민했던 기록이 있는데, 그때의 결론을 다시 참고해볼까요?

### 6.3.5 초안 생성 형식

Agent는 인터뷰가 끝나면 다음 형식으로 회고 초안을 만든다.

```markdown
# 오늘의 회고

## 1. 오늘 있었던 일

## 2. 내가 느낀 감정

## 3. 내가 한 의사결정

## 4. 그 결과

## 5. 좋았던 점

## 6. 아쉬웠던 점

## 7. 배운 점

## 8. 다음 액션

## 9. 관련 태그
```

트러블슈팅 모드에서는 다음 형식을 사용한다.

```markdown
# 트러블슈팅 기록

## 1. 문제 상황

## 2. 에러 메시지 / 증상

## 3. 원인 후보

## 4. 시도한 방법

## 5. 최종 해결

## 6. 다시 발생하지 않게 하기 위한 방법

## 7. 참고 링크 / 관련 기록

## 8. 관련 태그
```

### 6.3.6 무한 루프 방지

Agent는 무한히 질문하면 안 된다.

MVP에서는 다음 제한을 둔다.

- 최대 질문 수: 5개
- 사용자가 “그만 정리해줘”라고 하면 즉시 초안 생성
- 같은 유형의 질문 반복 금지
- 충분한 정보가 없으면 “불완전한 초안”으로 표시
- tool 호출 최대 횟수 제한
- LLM 실패 시 기본 템플릿 기반 회고 생성

---

## 7. ChatGPT/Gemini 기록 연동에 대한 논의

### 7.1 문제의식

사용자는 이미 ChatGPT, Gemini 같은 상용 챗봇에게 많은 고민과 질문을 던지고 있다. 그 기록을 가져올 수 있다면, 그날 무엇을 고민했고 무엇을 배웠는지 훨씬 명확하게 알 수 있다.

### 7.2 현실적인 한계

외부 서비스가 ChatGPT/Gemini의 기존 전체 대화 기록을 MCP로 자동으로 가져오는 것은 어렵다.

MCP는 보통 다음 방향이다.

```text
ChatGPT → 내 서비스의 MCP tool 호출
```

이지,

```text
내 서비스 → ChatGPT 내부 대화 DB 조회
```

가 아니다.

### 7.3 가능한 설계

가능한 방향은 다음과 같다.

#### 1. Export/Import 방식

사용자가 ChatGPT export zip을 업로드한다.

서비스는 다음을 수행한다.

1. conversations.json 파싱
2. 날짜별/주제별 chunking
3. embedding 생성
4. vector DB 저장
5. 회고 Agent가 “오늘 ChatGPT에 물어본 것들”을 RAG로 참고

#### 2. 수동 저장 방식

사용자가 ChatGPT/Gemini 대화 내용을 복사해서 붙여넣는다.

서비스는 이를 외부 맥락으로 저장하고 RAG 인덱싱한다.

#### 3. ChatGPT가 내 MCP를 호출하는 방식

사용자가 ChatGPT에서 다음처럼 요청한다.

> 이 대화 내용을 내 회고 서비스에 저장해줘.

그러면 ChatGPT가 내 MCP tool을 호출하고, 현재 대화의 관련 맥락을 내 서비스에 전달한다.

예시 tool:

```json
{
  "tool": "save_reflection_context",
  "arguments": {
    "date": "2026-06-06",
    "source": "chatgpt",
    "summary": "FastAPI 구조화와 AI 회고 서비스 아이디어에 대해 논의함",
    "key_events": [],
    "emotions": [],
    "decisions": [],
    "learnings": []
  }
}
```

이 방식은 장기적으로 좋지만, MVP에서는 구현 제약이 있을 수 있다.

### 7.4 MVP 판단

2주 과제에서는 다음이 현실적이다.

- MCP는 GitHub 연동으로 확실하게 구현한다.
- ChatGPT/Gemini 기록은 수동 import 또는 장기 아이디어로 둔다.
- RAG는 내가 서비스 안에 저장한 회고 기록을 대상으로 먼저 구현한다.

---

## 8. 구현 단계

핵심은 처음부터 모든 AI 기능을 구현하려고 하지 않는 것이다.

먼저 **AI를 나중에 붙일 수 있는 CRUD**를 만든다.

## 8.1 1단계: AI 없는 CRUD

목표:

> 사용자가 하루 있었던 일을 짧게 입력하면, 서비스가 고정 질문을 던지고, 답변들을 모아 하나의 회고 글로 저장한다.

기능:

- 회원가입/로그인
- 회고 글 작성/조회/수정/삭제
- 회고 타입 선택
- 태그 추가
- 댓글 작성
- 목록 페이징
- 검색
- 고정 질문 기반 인터뷰 세션
- 인터뷰 답변을 최종 회고 글로 저장

이 단계에서는 AI 없이도 서비스의 본질을 구현한다.

## 8.2 2단계: LLM 초안 생성

목표:

> 인터뷰 답변을 바탕으로 LLM이 회고 초안을 작성한다.

기능:

- 사용자의 인터뷰 답변 수집
- LLM prompt 구성
- 회고 초안 생성
- 사용자가 초안 수정 후 저장

이 단계는 Agent라기보다 단순 LLM 호출이다.

## 8.3 3단계: RAG

목표:

> 새 회고를 작성할 때 비슷한 과거 회고를 찾아 질문과 초안에 반영한다.

기능:

- 저장된 회고 embedding
- vector DB 저장
- 현재 입력과 유사한 과거 기록 top-k 검색
- 관련 기록 목록 표시
- 관련 기록을 prompt context로 사용

처음에는 DB LIKE 검색이나 태그 검색으로 시작해도 된다. 이후 embedding 기반 검색으로 교체한다.

## 8.4 4단계: AI Agent

목표:

> AI가 사용자의 답변을 보고 다음 질문을 선택한다.

기능:

- Agent state 정의
- 현재 답변 분석
- 부족한 정보 판단
- 다음 질문 생성
- RAG 검색 tool 호출
- 초안 생성 tool 호출
- 저장 tool 호출
- 최대 질문 수 제한
- 예외 처리

## 8.5 5단계: MCP

목표:

> GitHub 같은 외부 시스템에서 오늘 한 일의 재료를 가져온다.

기능:

- MCP server 구현
- JSON-RPC 요청/응답 처리
- GitHub API 연동
- 오늘 커밋/PR/Issue 조회
- API Key/Token 환경변수 관리
- 가져온 데이터를 회고 세션에 첨부

---

## 9. 기술 스택 후보

### 9.1 추천 스택

AI 기능이 중심이므로 FastAPI 기반이 가장 단순하다.

추천:

- Frontend: React + TypeScript
- Backend: FastAPI
- Database: PostgreSQL
- Vector DB: pgvector 또는 ChromaDB
- LLM: 상용 LLM API
- Agent: LangGraph 또는 직접 상태 머신 구현
- MCP: Python 기반 MCP server
- Auth: JWT 또는 Session
- Styling: Tailwind 또는 shadcn

### 9.2 FastAPI를 추천하는 이유

- Python 기반이라 AI/RAG/Agent 기능과 붙이기 쉽다.
- 2주 개인 과제에서 빠르게 구현하기 좋다.
- async API와 Pydantic을 통해 구조화가 가능하다.
- 팀 프로젝트 전 워밍업으로 적합하다.

### 9.3 NestJS를 선택할 수도 있는 경우

NestJS는 TypeScript 기반 백엔드 구조를 익히고 싶을 때 좋다.

장점:

- Controller/Service/Module 구조가 명확하다.
- Spring과 비슷한 구조를 경험할 수 있다.
- 프론트와 백엔드를 TypeScript로 통일할 수 있다.

단점:

- AI 기능은 Python 쪽이 자연스럽다.
- 2주 개인 과제에서는 NestJS + Python AI 서버 분리가 복잡할 수 있다.

따라서 이 아이디어의 MVP는 FastAPI 쪽이 더 적합하다.

---

## 10. 예상 화면

### 10.1 메인 화면

- 오늘 회고 시작하기 버튼
- 최근 회고 목록
- 최근 트러블슈팅 기록
- 태그별 필터
- 검색창

### 10.2 회고 인터뷰 화면

구성:

- 사용자 입력 영역
- AI 질문 영역
- 이전 답변 목록
- 관련 과거 기록 패널
- GitHub 오늘 활동 패널
- “이제 정리해줘” 버튼

### 10.3 회고 초안 화면

구성:

- AI가 생성한 회고 초안
- 사용자가 수정 가능한 에디터
- 추천 태그
- 관련 과거 기록
- 저장 버튼

### 10.4 회고 상세 화면

구성:

- 최종 회고문
- 원본 인터뷰 대화
- 관련 과거 회고
- 태그
- 댓글
- 수정/삭제 버튼

---

## 11. 데이터 모델 초안

```text
users
- id
- email
- password_hash
- name
- created_at

reflection_entries
- id
- user_id
- title
- type
- raw_memo
- ai_draft
- final_content
- emotion
- visibility
- created_at
- updated_at

interview_sessions
- id
- user_id
- status
- current_step
- initial_input
- created_at
- updated_at

interview_messages
- id
- session_id
- role
- content
- created_at

comments
- id
- entry_id
- user_id
- content
- created_at
- updated_at

tags
- id
- name

entry_tags
- entry_id
- tag_id

embeddings
- id
- entry_id
- chunk_text
- embedding_vector
- created_at

external_contexts
- id
- user_id
- source
- title
- content
- metadata
- created_at
```

---

## 12. API 초안

### 인증

```http
POST /auth/signup
POST /auth/login
POST /auth/logout
GET /auth/me
```

### 회고 글

```http
GET /entries
POST /entries
GET /entries/{entry_id}
PATCH /entries/{entry_id}
DELETE /entries/{entry_id}
```

### 댓글

```http
POST /entries/{entry_id}/comments
PATCH /comments/{comment_id}
DELETE /comments/{comment_id}
```

### 태그

```http
GET /tags
POST /entries/{entry_id}/tags
DELETE /entries/{entry_id}/tags/{tag_id}
```

### 인터뷰 세션

```http
POST /interviews
POST /interviews/{session_id}/messages
POST /interviews/{session_id}/generate-draft
POST /interviews/{session_id}/save-entry
```

### RAG

```http
GET /entries/{entry_id}/related
POST /rag/search
POST /rag/index-entry/{entry_id}
```

### Agent

```http
POST /agent/next-question
POST /agent/generate-reflection
```

### MCP / 외부 맥락

```http
POST /external/github/today
GET /external-contexts
POST /external-contexts
```

---

## 13. MVP 범위

2주 안에 전부 구현하려고 하면 망할 수 있다. 따라서 범위를 강하게 줄인다.

### 반드시 구현

- 회원가입/로그인
- 회고 글 CRUD
- 댓글
- 태그
- 페이징
- 검색
- 고정 질문 기반 인터뷰 세션
- LLM 기반 회고 초안 생성
- 저장된 회고 기반 유사 기록 검색

### 가능하면 구현

- embedding 기반 RAG
- Agent가 다음 질문 선택
- GitHub MCP 연동
- SSE로 AI 처리 진행 상태 표시

### 나중으로 미룰 것

- ChatGPT/Gemini 전체 기록 자동 연동
- 복잡한 LangGraph Agent
- 완성도 높은 감정 분석
- 팀 단위 협업 기능
- 실시간 공동 편집
- 고급 통계 대시보드

---

## 14. 발표/README에서 강조할 포인트

### 14.1 프로젝트 개요

이 프로젝트는 개발자의 하루 회고와 트러블슈팅 기록을 돕는 AI 기반 회고 보드이다.

사용자는 하루 동안 있었던 사건, 감정, 고민, 의사결정을 짧게 입력한다. AI Agent는 상담가처럼 후속 질문을 던져 회고 재료를 모으고, RAG는 과거 기록에서 비슷한 경험을 찾아 현재 회고와 연결한다. MCP는 GitHub 같은 외부 시스템에서 오늘의 작업 맥락을 가져와 회고 작성의 부담을 줄인다.

### 14.2 기술적 챌린지

- 단순 CRUD가 아니라 회고 인터뷰 세션이라는 상태 흐름을 모델링한다.
- RAG를 사용해 과거 기록 기반 개인화 질문을 생성한다.
- Agent가 사건/감정/결정/결과 중 부족한 정보를 판단하고 다음 질문을 선택한다.
- MCP를 통해 외부 작업 맥락을 회고 재료로 가져온다.
- AI 응답 실패, 무한 질문, 불완전한 정보 수집 같은 예외를 처리한다.

### 14.3 데모 시나리오

1. 사용자가 로그인한다.
2. “오늘 팀 회의에서 내가 말을 너무 많이 한 것 같아 찝찝했다”라고 입력한다.
3. Agent가 사건, 감정, 의사결정, 결과를 묻는 질문을 이어간다.
4. RAG가 과거의 유사 회고를 찾아 오른쪽 패널에 보여준다.
5. 사용자가 “이제 정리해줘”를 누른다.
6. AI가 회고 초안을 생성한다.
7. 사용자가 수정 후 저장한다.
8. 저장된 회고가 게시글 목록에 나타난다.
9. GitHub MCP를 호출해 오늘 커밋 목록을 가져오고, 이를 회고 재료로 추가한다.

---

## 15. 최종 판단

이 아이디어는 과제 요구사항과 잘 맞는다.

- CRUD가 자연스럽다.
- RAG가 억지스럽지 않다.
- MCP가 외부 작업 맥락 수집으로 자연스럽다.
- AI Agent가 서비스의 핵심이다.
- 사용자가 실제로 필요를 느끼는 문제에서 출발했다.
- 나만무 5주 프로젝트에서도 회고/트러블슈팅 도구로 재사용할 수 있다.

최종적으로 이 프로젝트는 다음 문장으로 정리할 수 있다.

> 우리는 개발자가 회고와 트러블슈팅 기록을 꾸준히 남기기 어렵다는 문제를 해결하기 위해, AI가 상담하듯 질문하고 과거 기록과 외부 작업 맥락을 연결해 회고 초안을 작성해주는 개발자 회고 보드를 만든다. 이 과정에서 RAG 기반 유사 기록 검색, MCP 기반 GitHub 활동 수집, Agent 기반 회고 인터뷰 흐름을 구현한다.
