# 03. API Reference

이 문서는 프론트/백엔드가 같이 보는 계약 문서입니다.

## 1) 공통 규칙

- Base Path: `[예: /api/v1]`
- Content-Type: `application/json`
- 시간 포맷: `[예: ISO-8601]`
- 키 네이밍: `[예: snake_case / camelCase]`
- 인증 방식: `[예: JWT Bearer / Session / Cookie]`

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

## 2) 상태 코드 규칙

| Status | 의미 |
| --- | --- |
| `200` | 조회/수정 성공 |
| `201` | 생성 성공 |
| `204` | 삭제 성공 |
| `400` | 입력 오류 |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `404` | 리소스 없음 |
| `409` | 비즈니스 충돌 |

## 3) 엔드포인트 목록

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | No | 회원가입 |
| `POST` | `/auth/login` | No | 로그인 |
| `GET` | `/resource` | No | 목록 조회 |
| `POST` | `/resource` | Yes | 생성 |
| `GET` | `/resource/{id}` | No | 상세 조회 |
| `PATCH` | `/resource/{id}` | Yes | 수정 |
| `DELETE` | `/resource/{id}` | Yes | 삭제 |

## 4) 핵심 API 상세

### `POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```

Success:

```json
{
  "success": true,
  "data": {
    "access_token": "<token>"
  }
}
```

### `GET /resource`

Query:

- `page`
- `limit`
- `sort`
- `q`

Success:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "total_pages": 0
    }
  }
}
```

## 5) 오픈 이슈

- [ ] 인증 토큰 저장 방식 확정
- [ ] 검색/정렬/필터 쿼리 확정
- [ ] 에러 코드 네이밍 통일