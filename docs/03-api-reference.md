# 03. API Reference

이 문서는 프론트엔드와 백엔드가 같이 보는 API 계약 문서입니다.
`docs/01-product-planning.md`와 `docs/02-architecture.md`를 기준으로 MVP에 필요한 API만 먼저 정의합니다.

## 1) 공통 규칙

- Base Path: `/api/v1`
- Content-Type: `application/json`
- 시간 포맷: ISO-8601 문자열
- 키 네이밍: `snake_case`
- 인증 방식: JWT Bearer
- 인증 헤더: `Authorization: Bearer <access_token>`
- 응답 포맷: `success/data/error` 래퍼 사용

공통 성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "c9a8b2b0-2d3a-4e4d-9d35-3ccfb2e8a123"
  }
}
```

공통 실패 응답 예시:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "요청 값을 확인해주세요."
  }
}
```

페이지네이션 응답은 아래 구조를 사용합니다.

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "total_pages": 0
  }
}
```

## 2) 상태 코드 규칙

| Status | 의미 |
| --- | --- |
| `200` | 조회/수정/처리 성공 |
| `201` | 생성 성공 |
| `204` | 삭제 성공 |
| `400` | 입력 오류 |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `404` | 리소스 없음 |
| `409` | 비즈니스 충돌 |
| `422` | FastAPI 요청 검증 실패 |
| `500` | 서버 내부 오류 |
| `502` | LLM, GitHub, MCP 등 외부 연동 실패 |

공통 에러 코드:

| Code | 의미 |
| --- | --- |
| `INVALID_INPUT` | 요청 값이 잘못됨 |
| `UNAUTHORIZED` | 인증 토큰이 없거나 유효하지 않음 |
| `FORBIDDEN` | 해당 리소스에 접근 권한이 없음 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `CONFLICT` | 중복 가입, 상태 충돌 등 비즈니스 충돌 |
| `AGENT_LIMIT_REACHED` | 인터뷰 질문 최대 횟수 초과 |
| `LLM_FAILED` | LLM 호출 실패 |
| `RAG_UNAVAILABLE` | RAG 검색 실패 또는 fallback 필요 |
| `EXTERNAL_SERVICE_FAILED` | GitHub, MCP 등 외부 서비스 실패 |

## 3) 엔드포인트 목록

### Auth

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | No | 회원가입 |
| `POST` | `/auth/login` | No | 로그인 |
| `GET` | `/auth/me` | Yes | 내 사용자 정보 조회 |

### Reflection Entries

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `GET` | `/entries` | Yes | 회고/트러블슈팅 글 목록 조회 |
| `POST` | `/entries` | Yes | 수동 글 생성 |
| `GET` | `/entries/{entry_id}` | Yes | 글 상세 조회 |
| `PATCH` | `/entries/{entry_id}` | Yes | 글 수정 |
| `DELETE` | `/entries/{entry_id}` | Yes | 글 삭제 |

### Comments

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `GET` | `/entries/{entry_id}/comments` | Yes | 댓글 목록 조회 |
| `POST` | `/entries/{entry_id}/comments` | Yes | 댓글 생성 |
| `PATCH` | `/comments/{comment_id}` | Yes | 댓글 수정 |
| `DELETE` | `/comments/{comment_id}` | Yes | 댓글 삭제 |

### Tags

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `GET` | `/tags` | Yes | 내 글에 사용된 태그 목록 조회 |

MVP에서는 별도 태그 생성 API를 제공하지 않습니다. 글 생성/수정 요청의 `tag_names` 배열을 통해 서버가 태그를 upsert합니다.

### Interviews / Agent

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `POST` | `/interviews` | Yes | 인터뷰 세션 생성 및 첫 질문 반환 |
| `GET` | `/interviews/{interview_id}` | Yes | 인터뷰 세션과 메시지 조회 |
| `POST` | `/interviews/{interview_id}/messages` | Yes | 사용자 답변 저장 및 다음 질문 또는 초안 가능 상태 반환 |
| `POST` | `/interviews/{interview_id}/generate-draft` | Yes | 누적 대화를 바탕으로 AI 초안 생성 |
| `POST` | `/interviews/{interview_id}/save-entry` | Yes | 생성된 초안 또는 사용자 수정본을 글로 저장 |

### RAG

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `POST` | `/rag/search` | Yes | 저장된 글에서 관련 기록 검색 |

MVP의 RAG 검색 대상은 최종 저장된 `ReflectionEntry`입니다. 검색 필드는 `title`, `final_content`, `tags`를 우선합니다.

### External Context / MCP

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `POST` | `/external/github/today` | Yes | GitHub MCP tool로 오늘 활동 조회 및 저장 |
| `GET` | `/external-contexts` | Yes | 저장된 외부 맥락 목록 조회 |
| `GET` | `/external-contexts/{context_id}` | Yes | 저장된 외부 맥락 상세 조회 |

## 4) 공통 데이터 타입

### ReflectionEntry

```json
{
  "id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
  "title": "인증 API 구현 회고",
  "type": "daily",
  "ai_draft": "AI가 생성한 초안",
  "final_content": "사용자가 검토 후 저장한 최종 글",
  "status": "published",
  "tags": ["FastAPI", "auth"],
  "created_at": "2026-06-08T10:00:00+09:00",
  "updated_at": "2026-06-08T10:00:00+09:00"
}
```

`type` 값:

- `daily`
- `trouble`
- `decision`
- `team_issue`
- `learning`

### InterviewMessage

```json
{
  "id": "b4a7a790-39fa-4715-8596-3c28a6a53122",
  "role": "assistant",
  "message_type": "question",
  "sequence": 2,
  "content": "그 판단을 할 때 가장 중요하게 본 기준은 무엇이었나요?",
  "metadata": {
    "agent_state": "ASK_QUESTION",
    "question_strategy": "decision_criteria"
  },
  "created_at": "2026-06-08T10:01:00+09:00"
}
```

`role` 값:

- `user`
- `assistant`
- `system`
- `tool`

`message_type` 값:

- `initial_input`
- `question`
- `answer`
- `tool_result`
- `draft`
- `note`

## 5) 핵심 API 상세

### `POST /auth/signup`

Request:

```json
{
  "email": "user@example.com",
  "password": "password1234",
  "name": "sisu"
}
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "id": "7df77548-b85d-4a3c-9716-347f005c14d5",
    "email": "user@example.com",
    "name": "sisu",
    "created_at": "2026-06-08T10:00:00+09:00"
  }
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "access_token": "<jwt_access_token>",
    "token_type": "bearer",
    "user": {
      "id": "7df77548-b85d-4a3c-9716-347f005c14d5",
      "email": "user@example.com",
      "name": "sisu"
    }
  }
}
```

### `GET /auth/me`

Success `200`:

```json
{
  "success": true,
  "data": {
    "id": "7df77548-b85d-4a3c-9716-347f005c14d5",
    "email": "user@example.com",
    "name": "sisu",
    "created_at": "2026-06-08T10:00:00+09:00"
  }
}
```

### `GET /entries`

Query:

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `page` | integer | No | 기본값 `1` |
| `limit` | integer | No | 기본값 `10`, 최대값은 구현 시 제한 |
| `q` | string | No | 제목/본문/태그 검색어 |
| `type` | string | No | `daily`, `trouble`, `decision`, `team_issue`, `learning` |
| `tag` | string | No | 태그명 필터 |
| `sort` | string | No | MVP 기본값 `created_at_desc` |

Success `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
        "title": "인증 API 구현 회고",
        "type": "daily",
        "status": "published",
        "tags": ["FastAPI", "auth"],
        "created_at": "2026-06-08T10:00:00+09:00",
        "updated_at": "2026-06-08T10:00:00+09:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

### `POST /entries`

AI 인터뷰 없이 사용자가 직접 글을 생성할 때 사용합니다.
MVP에서는 생성 즉시 `published` 상태로 저장합니다.

Request:

```json
{
  "title": "인증 API 구현 회고",
  "type": "daily",
  "final_content": "오늘은 JWT 인증 흐름을 구현했다...",
  "tag_names": ["FastAPI", "auth"]
}
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
      "title": "인증 API 구현 회고",
      "type": "daily",
      "ai_draft": null,
      "final_content": "오늘은 JWT 인증 흐름을 구현했다...",
      "status": "published",
      "tags": ["FastAPI", "auth"],
      "created_at": "2026-06-08T10:00:00+09:00",
      "updated_at": "2026-06-08T10:00:00+09:00"
    }
  }
}
```

### `GET /entries/{entry_id}`

Success `200`:

```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
      "title": "인증 API 구현 회고",
      "type": "daily",
      "ai_draft": null,
      "final_content": "오늘은 JWT 인증 흐름을 구현했다...",
      "status": "published",
      "tags": ["FastAPI", "auth"],
      "created_at": "2026-06-08T10:00:00+09:00",
      "updated_at": "2026-06-08T10:00:00+09:00"
    }
  }
}
```

### `PATCH /entries/{entry_id}`

Request:

```json
{
  "title": "JWT 인증 API 구현 회고",
  "type": "daily",
  "final_content": "오늘은 JWT Bearer 인증 흐름을 구현했다...",
  "tag_names": ["FastAPI", "JWT", "auth"]
}
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
      "title": "JWT 인증 API 구현 회고",
      "type": "daily",
      "ai_draft": null,
      "final_content": "오늘은 JWT Bearer 인증 흐름을 구현했다...",
      "status": "published",
      "tags": ["FastAPI", "JWT", "auth"],
      "created_at": "2026-06-08T10:00:00+09:00",
      "updated_at": "2026-06-08T10:20:00+09:00"
    }
  }
}
```

### `DELETE /entries/{entry_id}`

Success `204`: 응답 본문 없음.

### `GET /entries/{entry_id}/comments`

Success `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "d8550ff5-6659-441b-9d50-2abcf4c9c012",
        "entry_id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
        "content": "추가로 테스트 케이스도 보강해야 한다.",
        "created_at": "2026-06-08T10:30:00+09:00",
        "updated_at": "2026-06-08T10:30:00+09:00"
      }
    ]
  }
}
```

### `POST /entries/{entry_id}/comments`

Request:

```json
{
  "content": "추가로 테스트 케이스도 보강해야 한다."
}
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "d8550ff5-6659-441b-9d50-2abcf4c9c012",
      "entry_id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
      "content": "추가로 테스트 케이스도 보강해야 한다.",
      "created_at": "2026-06-08T10:30:00+09:00",
      "updated_at": "2026-06-08T10:30:00+09:00"
    }
  }
}
```

### `PATCH /comments/{comment_id}`

Request:

```json
{
  "content": "테스트 케이스와 예외 응답도 보강해야 한다."
}
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "d8550ff5-6659-441b-9d50-2abcf4c9c012",
      "entry_id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
      "content": "테스트 케이스와 예외 응답도 보강해야 한다.",
      "created_at": "2026-06-08T10:30:00+09:00",
      "updated_at": "2026-06-08T10:35:00+09:00"
    }
  }
}
```

### `DELETE /comments/{comment_id}`

Success `204`: 응답 본문 없음.

### `GET /tags`

Success `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "2e2d08bb-3b37-4389-b777-3e7956e9e423",
        "name": "FastAPI",
        "entry_count": 3
      }
    ]
  }
}
```

### `POST /interviews`

인터뷰 세션을 만들고 첫 질문을 반환합니다.
사용자의 최초 입력 원본은 `InterviewMessage(role=user, message_type=initial_input, sequence=1)`로 저장합니다.

Request:

```json
{
  "initial_input": "오늘 인증 API를 구현하다가 토큰 만료 처리에서 많이 헷갈렸다.",
  "type": "daily",
  "max_questions": 3
}
```

Request fields:

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `initial_input` | string | Yes | 사용자의 첫 메모 |
| `type` | string | No | 없으면 Agent가 추천 또는 분류 |
| `max_questions` | integer | No | 기본값 `3`, 최대 `5` |

Success `201`:

```json
{
  "success": true,
  "data": {
    "interview": {
      "id": "669906a6-ff1f-4302-802f-3125913de750",
      "type": "daily",
      "status": "in_progress",
      "initial_input": "오늘 인증 API를 구현하다가 토큰 만료 처리에서 많이 헷갈렸다.",
      "question_count": 1,
      "max_questions": 3,
      "created_at": "2026-06-08T10:00:00+09:00",
      "updated_at": "2026-06-08T10:00:00+09:00"
    },
    "message": {
      "id": "b4a7a790-39fa-4715-8596-3c28a6a53122",
      "role": "assistant",
      "message_type": "question",
      "sequence": 2,
      "content": "토큰 만료 처리에서 어떤 선택지들이 있었고, 어느 지점이 가장 헷갈렸나요?",
      "metadata": {
        "agent_state": "ASK_QUESTION"
      },
      "created_at": "2026-06-08T10:00:05+09:00"
    }
  }
}
```

### `GET /interviews/{interview_id}`

Success `200`:

```json
{
  "success": true,
  "data": {
    "interview": {
      "id": "669906a6-ff1f-4302-802f-3125913de750",
      "entry_id": null,
      "type": "daily",
      "status": "in_progress",
      "initial_input": "오늘 인증 API를 구현하다가 토큰 만료 처리에서 많이 헷갈렸다.",
      "question_count": 1,
      "max_questions": 3,
      "draft_content": null,
      "created_at": "2026-06-08T10:00:00+09:00",
      "updated_at": "2026-06-08T10:00:05+09:00"
    },
    "messages": [
      {
        "id": "6f33db10-5461-4d2b-b93b-c0201786a2be",
        "role": "user",
        "message_type": "initial_input",
        "sequence": 1,
        "content": "오늘 인증 API를 구현하다가 토큰 만료 처리에서 많이 헷갈렸다.",
        "metadata": {},
        "created_at": "2026-06-08T10:00:00+09:00"
      },
      {
        "id": "b4a7a790-39fa-4715-8596-3c28a6a53122",
        "role": "assistant",
        "message_type": "question",
        "sequence": 2,
        "content": "토큰 만료 처리에서 어떤 선택지들이 있었고, 어느 지점이 가장 헷갈렸나요?",
        "metadata": {
          "agent_state": "ASK_QUESTION"
        },
        "created_at": "2026-06-08T10:00:05+09:00"
      }
    ]
  }
}
```

### `POST /interviews/{interview_id}/messages`

사용자 답변을 저장한 뒤 Agent가 다음 질문을 만들거나 초안 생성 가능 상태를 반환합니다.
MVP는 무제한 챗봇이 아니라 제한된 인터뷰 세션입니다.

Request:

```json
{
  "content": "Access token을 짧게 두고 refresh token을 쓸지, 일단 access token만 둘지 고민했다."
}
```

Success `200` - 다음 질문이 있는 경우:

```json
{
  "success": true,
  "data": {
    "next_action": "ask_question",
    "interview": {
      "id": "669906a6-ff1f-4302-802f-3125913de750",
      "status": "in_progress",
      "question_count": 2,
      "max_questions": 3
    },
    "message": {
      "id": "40e393d1-51ee-4f8a-a131-c8581d62d21f",
      "role": "assistant",
      "message_type": "question",
      "sequence": 4,
      "content": "최종적으로 어떤 기준 때문에 한쪽 선택을 더 현실적이라고 판단했나요?",
      "metadata": {
        "agent_state": "ASK_QUESTION",
        "question_strategy": "decision_criteria"
      },
      "created_at": "2026-06-08T10:05:00+09:00"
    }
  }
}
```

Success `200` - 초안 생성이 가능한 경우:

```json
{
  "success": true,
  "data": {
    "next_action": "draft_ready",
    "interview": {
      "id": "669906a6-ff1f-4302-802f-3125913de750",
      "status": "in_progress",
      "question_count": 3,
      "max_questions": 3
    },
    "reason": "질문 최대 횟수에 도달했고, 초안 생성에 필요한 사건/판단/다음 행동 정보가 충분합니다."
  }
}
```

### `POST /interviews/{interview_id}/generate-draft`

누적된 인터뷰 메시지와 관련 기록 검색 결과를 바탕으로 초안을 생성합니다.
생성된 초안은 `InterviewSession.draft_content`에 저장하고, `InterviewMessage(message_type=draft)`에도 남깁니다.

Request:

```json
{
  "use_rag": true
}
```

Success `200`:

```json
{
  "success": true,
  "data": {
    "interview": {
      "id": "669906a6-ff1f-4302-802f-3125913de750",
      "status": "draft_generated"
    },
    "suggested_title": "JWT 인증 흐름을 구현하며 배운 점",
    "suggested_tags": ["FastAPI", "JWT", "auth"],
    "draft_content": "## 사건\n오늘은 인증 API를 구현하면서 토큰 만료 처리 방식을 고민했다...\n\n## 판단\n...",
    "related_entries": [
      {
        "entry_id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
        "title": "로그인 API 설계 회고",
        "relevance_score": 0.82,
        "reason": "JWT 인증 흐름과 토큰 처리 기준이 유사함"
      }
    ]
  }
}
```

### `POST /interviews/{interview_id}/save-entry`

AI 초안 또는 사용자가 수정한 최종 내용을 `ReflectionEntry`로 저장합니다.
저장 후 `InterviewSession.entry_id`를 연결하고, RAG 검색을 위해 entry indexing을 수행합니다.

Request:

```json
{
  "title": "JWT 인증 흐름을 구현하며 배운 점",
  "final_content": "오늘은 인증 API를 구현하면서 토큰 만료 처리 방식을 고민했다...",
  "tag_names": ["FastAPI", "JWT", "auth"]
}
```

Success `201`:

```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "40924d30-8627-4032-868f-0ec184561a8d",
      "title": "JWT 인증 흐름을 구현하며 배운 점",
      "type": "daily",
      "ai_draft": "## 사건\n오늘은 인증 API를 구현하면서 토큰 만료 처리 방식을 고민했다...\n\n## 판단\n...",
      "final_content": "오늘은 인증 API를 구현하면서 토큰 만료 처리 방식을 고민했다...",
      "status": "published",
      "tags": ["FastAPI", "JWT", "auth"],
      "created_at": "2026-06-08T10:30:00+09:00",
      "updated_at": "2026-06-08T10:30:00+09:00"
    },
    "interview": {
      "id": "669906a6-ff1f-4302-802f-3125913de750",
      "status": "saved",
      "entry_id": "40924d30-8627-4032-868f-0ec184561a8d"
    }
  }
}
```

### `POST /rag/search`

저장된 `ReflectionEntry` 중 현재 입력과 관련 있는 기록을 찾습니다.
MVP에서는 pgvector 기반 검색을 우선하되, 구현이 지연되면 키워드/태그 검색 fallback을 허용합니다.

Request:

```json
{
  "query": "JWT 토큰 만료 처리에서 access token과 refresh token 선택 기준",
  "limit": 5,
  "type": "daily",
  "tag_names": ["JWT", "auth"]
}
```

Request fields:

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `query` | string | Yes | 검색 기준 문장 |
| `limit` | integer | No | 기본값 `5` |
| `type` | string | No | 기록 유형 필터 |
| `tag_names` | string[] | No | 태그 필터 |

Success `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "entry_id": "e1f0a6ef-45c2-4f35-9a4f-2ff7adf9f100",
        "title": "로그인 API 설계 회고",
        "type": "decision",
        "snippet": "처음에는 access token만 사용하는 방식을 고려했지만...",
        "tags": ["JWT", "auth"],
        "relevance_score": 0.82,
        "search_mode": "vector"
      }
    ],
    "search_mode": "vector"
  }
}
```

### `POST /external/github/today`

백엔드가 MCP Server의 `get_today_github_activity` tool을 호출해 GitHub 활동을 가져오고 `ExternalContext`로 저장합니다.
GitHub token은 서버 환경변수로 관리하며, 클라이언트가 token을 직접 보내지 않습니다.

Request:

```json
{
  "owner": "sisu",
  "repo": "dev-reflection-board",
  "since": "2026-06-08T00:00:00+09:00",
  "until": "2026-06-08T23:59:59+09:00",
  "session_id": "669906a6-ff1f-4302-802f-3125913de750"
}
```

Request fields:

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `owner` | string | Yes | GitHub repository owner |
| `repo` | string | Yes | GitHub repository name |
| `since` | string | No | 조회 시작 시각. 없으면 서버의 오늘 00:00 기준 |
| `until` | string | No | 조회 종료 시각. 없으면 서버의 현재 시각 |
| `session_id` | string | No | 인터뷰 세션과 연결할 경우 전달 |

Success `200`:

```json
{
  "success": true,
  "data": {
    "external_context": {
      "id": "f4ea61cb-03dc-4a89-ac31-16d004dc8a2e",
      "source": "github",
      "title": "2026-06-08 GitHub activity",
      "content": "오늘 auth API 관련 커밋 2개와 docs 수정 커밋 1개가 있습니다.",
      "metadata": {
        "owner": "sisu",
        "repo": "dev-reflection-board",
        "since": "2026-06-08T00:00:00+09:00",
        "until": "2026-06-08T23:59:59+09:00",
        "commits": [
          {
            "sha": "abc123",
            "message": "feat: add auth signup api",
            "url": "https://github.com/sisu/dev-reflection-board/commit/abc123",
            "committed_at": "2026-06-08T09:30:00+09:00"
          }
        ],
        "pull_requests": [],
        "issues": []
      },
      "created_at": "2026-06-08T11:00:00+09:00"
    },
    "tool_call": {
      "id": "50ebff3f-48cc-4c2f-b7c7-68596ad10d7e",
      "tool_name": "get_today_github_activity",
      "status": "success"
    }
  }
}
```

외부 연동 실패 시에는 GitHub 맥락 없이 인터뷰를 계속 진행할 수 있어야 합니다.

### `GET /external-contexts`

Query:

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `page` | integer | No | 기본값 `1` |
| `limit` | integer | No | 기본값 `10` |
| `source` | string | No | MVP 값은 `github` |
| `session_id` | string | No | 특정 인터뷰 세션에 연결된 외부 맥락만 조회 |

Success `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "f4ea61cb-03dc-4a89-ac31-16d004dc8a2e",
        "source": "github",
        "title": "2026-06-08 GitHub activity",
        "created_at": "2026-06-08T11:00:00+09:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

### `GET /external-contexts/{context_id}`

Success `200`:

```json
{
  "success": true,
  "data": {
    "external_context": {
      "id": "f4ea61cb-03dc-4a89-ac31-16d004dc8a2e",
      "source": "github",
      "title": "2026-06-08 GitHub activity",
      "content": "오늘 auth API 관련 커밋 2개와 docs 수정 커밋 1개가 있습니다.",
      "metadata": {
        "owner": "sisu",
        "repo": "dev-reflection-board",
        "commits": []
      },
      "created_at": "2026-06-08T11:00:00+09:00"
    }
  }
}
```

## 6) 상태 전이 규칙

### InterviewSession

```text
in_progress
-> draft_generated
-> saved
```

또는:

```text
in_progress
-> cancelled
```

MVP API에서 `cancelled` 전환 endpoint는 필수로 두지 않습니다. 필요하면 Post-MVP에서 `POST /interviews/{interview_id}/cancel`을 추가합니다.

### ReflectionEntry

```text
published
-> archived
```

MVP에서는 사용자가 글을 저장하면 즉시 `published`로 생성합니다. 초안은 `InterviewSession.draft_content`에서 관리합니다.

## 7) 권한 규칙

- 모든 인증 필요 API는 현재 로그인한 사용자의 데이터만 조회/수정/삭제할 수 있습니다.
- 다른 사용자의 `entry_id`, `interview_id`, `comment_id`, `context_id`에 접근하면 `403` 또는 `404`를 반환합니다.
- 공개 게시판, 공유 링크, 다른 사용자 글 조회는 MVP 범위가 아닙니다.
- GitHub token, OpenAI API key, JWT secret은 서버 환경변수로 관리하고 API 응답에 포함하지 않습니다.

## 8) 구현 메모

- FastAPI의 기본 validation error는 프론트에서 일관되게 처리할 수 있도록 `success/data/error` 형식으로 변환하는 것을 권장합니다.
- `POST /interviews/{interview_id}/messages`는 사용자 답변 저장과 다음 Agent 액션 결정을 한 번에 처리합니다.
- Agent 질문은 기본 3개, 최대 5개로 제한합니다.
- 사용자가 초안을 원하면 질문 수가 남아 있어도 `POST /interviews/{interview_id}/generate-draft`를 호출할 수 있습니다.
- `POST /interviews/{interview_id}/save-entry` 이후에는 저장된 글을 RAG 검색 대상으로 indexing합니다.
- `POST /entries`와 `PATCH /entries/{entry_id}`도 저장 내용이 바뀌면 embedding을 생성하거나 갱신해야 합니다.
- RAG 결과를 AI가 참고한 경우 `MessageContextRef`에 참조 기록을 남깁니다.
- MCP 호출 결과는 `AgentToolCall`과 `ExternalContext`에 저장합니다.

## 9) 오픈 이슈

- [ ] OpenAI 모델명과 embedding 모델명을 구현 시점에 확정한다.
- [ ] `DELETE /entries/{entry_id}`를 hard delete로 할지 soft delete로 할지 확정한다.
- [ ] `DELETE /comments/{comment_id}`를 hard delete로 할지 soft delete로 할지 확정한다.
- [ ] GitHub MCP 응답에서 PR/Issue를 MVP에 어느 깊이까지 포함할지 확정한다.
- [ ] pgvector 적용이 늦어질 경우 키워드/태그 fallback의 정확한 검색 기준을 정한다.
- [ ] 배포 후 실제 API host와 CORS 허용 origin을 확정한다.
