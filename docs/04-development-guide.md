# 04. Development Guide

이 문서는 구현 단계에 들어갈 때 채웁니다.

## 1) 브랜치 전략

권장 브랜치 타입:

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`

예시 브랜치 분리:

1. `feature/setup-app`
2. `feature/auth-signup`
3. `feature/auth-login`
4. `feature/resource-crud`
5. `feature/resource-query`
6. `feature/ui-pages`
7. `feature/deploy`
8. `docs/readme-demo-polish`

브랜치 분리 기준:

- API 단위
- 화면 단위
- 인프라 단위
- 테스트 단위
- 발표/문서 단위

## 2) 커밋 규칙

```text
<type>: <subject>
```

예시:

- `feat: add login endpoint`
- `fix: handle duplicate join request`
- `docs: update architecture notes`
- `test: add profile api integration tests`

## 3) Codex 기준 구현 순서

Codex에게 기능을 맡길 때는 아래 순서를 기본으로 잡는 것이 안전합니다.

1. 앱 기본 실행 구조
2. DB 연결/환경 설정
3. 인증 기초
4. 핵심 도메인 CRUD
5. 핵심 조회/행위 API
6. 프론트 연동
7. 예외 처리 보강
8. 테스트 보강
9. 배포 및 문서 정리
10. README 발표용 정리

이 순서는 `AGENTS.md`와 같이 유지하는 것을 권장합니다.

## 4) Codex 태스크 요청 방식

좋은 요청 예시:

- `docs/01-product-planning.md와 docs/03-api-reference.md를 읽고 signup API만 구현해줘. 테스트도 같이 추가해줘.`
- `docs/02-architecture.md 기준으로 repository layer만 먼저 만들어줘.`
- `AGENTS.md 규칙에 맞춰 feature branch 단위를 제안해줘.`
- `구현된 기능 기준으로 README를 발표 친화적으로 다듬어줘.`

피해야 할 요청 예시:

- `프로젝트 전체 다 만들어줘`
- `일단 알아서 필요한 거 다 수정해줘`
- `README만 보고 전체 구조를 추측해서 구현해줘`

## 5) 테스트 전략

- Unit Test: 서비스/유틸/도메인 규칙
- Integration Test: API + DB 연결
- Smoke Test: 배포 후 핵심 흐름 확인

최소 체크리스트:

- [ ] 핵심 성공 시나리오 테스트
- [ ] 인증 실패 시나리오 테스트
- [ ] 권한 실패 시나리오 테스트
- [ ] 중복/충돌 시나리오 테스트
- [ ] 주요 문서 동기화

## 6) PR 체크리스트

- [ ] 변경 목적이 명확하다
- [ ] 테스트를 추가했거나 기존 테스트가 통과한다
- [ ] README 또는 docs가 최신 상태다
- [ ] 리뷰어가 이해할 수 있게 변경 범위를 설명했다

## 7) 마일스톤 예시

### Milestone 1. 기반 구성

- 앱 실행
- DB 연결
- 기본 라우팅
- 테스트 골격

### Milestone 2. 핵심 기능

- 인증
- 핵심 도메인 CRUD
- 조회 API
- 화면 연동

### Milestone 3. 마감 준비

- 예외 처리 보강
- 문서 정리
- 배포 검증
- 데모 시나리오 정리
- README 발표 흐름 정리