# Concept Learning Note

## 1. 개념

Vite, `npm run dev`, `npm run build`, `@vitejs/plugin-react`

## 2. 이 개념을 만난 맥락

- Phase: Phase 0. 프로젝트 기반 구성
- 관련 기능: React + TypeScript 프론트엔드 실행과 빌드
- 관련 endpoint: 없음. 프론트엔드 개발 도구 개념이다.
- 관련 파일:
  - `frontend/package.json`
  - `frontend/vite.config.ts`
  - `frontend/src/App.tsx`
  - `docs/reviews/phase-0-bootstrap-review.md`

## 3. 처음 헷갈렸던 점

Vite가 무엇인지, 왜 필요한지, Vite가 없다면 무엇이 불편한지 궁금했다.
또 `npm run dev`와 `npm run build`의 차이, 그리고 `vite.config.ts`의 `react()` 플러그인이 어떤 역할인지 헷갈렸다.

## 4. 내가 이해한 말

`npm run dev`는 개발할 때 최종 화면 결과를 편하게 확인할 수 있도록 도와주는 명령어다.
`npm run build`는 마지막에 배포하기 위한 파일을 만들 때 사용하는 명령어다.

`plugins: [react()]` 설정은 백엔드 API 주소를 등록하는 설정이 아니라, React 문법과 개발 기능을 Vite에 붙이는 설정에 가깝다.

## 5. AI가 교정해준 부분

처음에는 `npm run build`가 개발용 서버를 계속 띄우는 것에 가깝다고 답했지만, 실제로는 배포 가능한 `frontend/dist` 파일을 만드는 명령이다.

`npm run dev`는 개발 중 계속 켜두고 React 화면을 확인하는 서버이고, `npm run build`는 배포용 결과물을 한 번 생성하는 과정이다.

## 6. 프로젝트 안에서의 역할

현재 프로젝트에서 Vite는 Phase 0 프론트엔드 골격을 실행하고 빌드하기 위해 사용된다.

`frontend/src/App.tsx` 같은 React 코드는 TypeScript와 JSX 문법을 포함할 수 있다.
브라우저가 이 코드를 최종 형태로 실행하려면 개발 또는 빌드 과정에서 변환이 필요하다.
Vite는 이 변환을 개발 중에는 빠르게 처리하고, 배포 전에는 정적 파일로 만들어준다.

`@vitejs/plugin-react`는 Vite가 React 코드를 제대로 다룰 수 있게 해주는 추가 기능이다.
현재 `vite.config.ts`에는 React 플러그인만 설정되어 있고, API proxy 같은 백엔드 연결 설정은 아직 없다.

## 7. 프로젝트 코드에서 확인한 근거

| 파일 | 확인한 내용 |
| --- | --- |
| `frontend/package.json` | `dev`는 `vite --host 127.0.0.1`, `build`는 `tsc -b && vite build`, `preview`는 `vite preview --host 127.0.0.1`를 실행한다. |
| `frontend/vite.config.ts` | `@vitejs/plugin-react`의 `react()`를 Vite plugin으로 등록한다. |
| `frontend/src/App.tsx` | Phase 0 첫 화면을 React 컴포넌트로 렌더링한다. |
| `docs/reviews/phase-0-bootstrap-review.md` | Phase 0 구현 항목에 React + TypeScript + Vite 프론트엔드 골격이 포함되어 있다. |

## 8. 핵심 코드 흐름

```text
개발 중 화면 확인
-> cd frontend
-> npm run dev
-> vite --host 127.0.0.1
-> vite.config.ts 읽음
-> react() 플러그인 적용
-> 브라우저에서 React 화면 확인
```

```text
배포용 파일 생성
-> cd frontend
-> npm run build
-> tsc -b
-> vite build
-> frontend/dist 생성
```

## 9. 오늘은 여기까지만 알면 되는 것

- Vite는 React 앱을 개발하고 빌드하기 편하게 해주는 프론트엔드 도구다.
- `npm run dev`는 개발 서버를 띄워서 화면을 빠르게 확인하는 명령이다.
- `npm run build`는 배포 가능한 정적 파일을 만드는 명령이다.
- `react()` 플러그인은 Vite가 React 문법과 개발 기능을 처리하게 해준다.

## 10. 나중에 따로 볼 개념

- JSX가 브라우저에서 실행 가능한 JavaScript로 변환되는 과정
- TypeScript 빌드와 `tsc -b`
- Vite dev server와 Vite preview의 차이
- 백엔드 API 연결 시 Vite proxy 설정

## 11. 내가 다시 설명할 수 있어야 하는 질문

- `npm run dev`와 `npm run build`는 각각 언제 쓰는가?
- Vite가 없다면 React + TypeScript 개발에서 무엇이 불편해지는가?
- `plugins: [react()]`는 이 프로젝트에서 어떤 역할을 하는가?

## 12. 직접 확인해볼 작은 실험

- 추천: `cd frontend && npm run dev`를 실행한 뒤 `frontend/src/App.tsx`의 문구를 바꿔서 브라우저 화면이 빠르게 바뀌는지 확인한다.
- 선택: `cd frontend && npm run build`를 실행한 뒤 `frontend/dist/`가 생성되는지 확인한다.
- 선택: `frontend/vite.config.ts`에서 현재 설정이 React 플러그인만 포함한다는 점을 다시 확인한다.

## 13. 아직 남은 질문

- Vite가 내부적으로 JSX와 TypeScript를 어떤 도구로 변환하는지는 아직 자세히 보지 않았다.
- 실제 배포 단계에서 `frontend/dist`를 어디에 올릴지는 아직 다루지 않았다.

## 14. 다음 기록이나 구현에 주는 영향

다음 프론트엔드 Phase에서 화면, 폼, API 호출 코드를 추가할 때는 `npm run dev`로 브라우저에서 빠르게 확인하는 흐름을 사용하면 된다.
배포나 데모 준비 단계에서는 `npm run build`로 최종 정적 파일이 만들어지는지 확인해야 한다.
