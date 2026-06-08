# MCP Spike

## 목표

MCP가 무엇인지 내 말로 설명할 수 있게 된다.

## 내가 이해한 내용

MCP는 AI가 사용할 수 있는 외부 도구를 제공하는 방법이다.

MCP Server는 AI가 어떤 요청을 보낼 수 있는지 알 수 있도록 tool 목록, 설명, 입력 schema를 제공한다. 이 정보는 MCP Specification에 맞는 형식으로 정의되고, AI 모델이 도구 선택을 판단할 수 있도록 context에 전달된다.

AI는 사용자의 입력을 처리하는 도중 외부 요청을 통한 작업이 필요하다고 판단할 수 있다. 예를 들어 회고를 작성할 때 오늘 GitHub 커밋 기록이 필요하다고 판단할 수 있다.

AI가 MCP tool 호출을 요청하면, MCP Client/Host가 MCP Server로 요청을 전달한다. MCP Server는 해당 작업을 수행하고 결과를 다시 AI에게 반환한다.

## 더 정확한 표현

MCP Specification 자체가 그대로 AI context에 들어간다기보다는, MCP Specification에 맞춰 MCP Server가 제공하는 tool 정보가 AI에게 전달된다.

AI가 보게 되는 정보는 보통 다음과 같다.

- tool 이름
- tool 설명
- tool 입력 schema
- tool 결과 형식

AI는 이 정보를 바탕으로 “지금 어떤 tool을 호출해야 하는가”를 판단한다.

## 흐름

```text
1. MCP Server가 사용할 수 있는 tool 목록을 제공한다.
2. AI는 tool 이름, 설명, 입력 schema를 context로 받는다.
3. 사용자가 요청한다.
4. AI가 외부 도구 호출이 필요하다고 판단한다.
5. AI가 tool 호출 의도를 만든다.
6. MCP Client/Host가 MCP Server에 요청을 보낸다.
7. MCP Server가 실제 외부 API 또는 시스템을 호출한다.
8. MCP Server가 결과를 반환한다.
9. AI가 결과를 바탕으로 답변하거나 다음 작업을 수행한다.
```

## 우리 프로젝트에서의 적용

이 프로젝트에서는 MCP를 GitHub 커밋 기록을 가져오는 용도로 사용할 수 있다.

예시 tool:

```text
get_today_github_activity
```

역할:

- 특정 GitHub repository에서 오늘 커밋/PR/Issue 활동을 조회한다.
- 조회한 결과를 AI 회고 Agent에게 전달한다.
- Agent는 그 결과를 바탕으로 더 구체적인 회고 질문을 만든다.

예시:

```text
사용자:
오늘 인증 구조 때문에 고민했어.

AI:
오늘 실제로 어떤 작업을 했는지 GitHub 기록을 확인해야겠다.

MCP tool 호출:
get_today_github_activity

MCP Server:
GitHub API에서 오늘 커밋 기록을 조회한다.

AI:
오늘 auth_service와 auth_repository를 나눈 커밋이 있네요.
구조를 나누기로 한 이유는 테스트 때문이었나요, 유지보수 때문이었나요?
```

## 이번 Spike 결론

MCP는 AI가 외부 시스템을 직접 추측하지 않고, 정해진 tool을 통해 필요한 정보를 가져오게 만드는 연결 방식이다.

이 프로젝트에서는 GitHub 활동 조회용 MCP Server를 작게 구현하는 것이 적합하다. MVP에서는 read-only tool인 `get_today_github_activity`부터 시작하는 것이 안전하다.
