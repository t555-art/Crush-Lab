# Crush Lab

하루를 따라가며 알아보는 연애 성향 검사.
아침에 눈 뜨는 순간부터 밤에 폰을 놓는 순간까지, 좋아하는 사람이 있는 하루를 지나가면서 답한다.

## 지금 상태

v2 뼈대를 새로 세운 단계다. 검사는 처음부터 끝까지 돌아가고, 결과 내용과 그림은 작업 중이다.

| | 상태 |
| --- | --- |
| 장면 7개 (07:10 → 23:10) | 동작 |
| 문항 35개 · 기본 질문 7개 | 동작 |
| 탭으로 넘기는 화면 | 동작 |
| 진행상황 저장 (새로고침해도 안 날아감) | 동작 |
| 유형 페이지 16개 · 공유 썸네일 | 자리만 (그림 필요) |
| 결과 화면 내용 | 작업 중 |
| 일러스트 | 자리표시자 (제미나이로 생성 예정) |

## 할 일

1. 결과 내용 개선
2. 질문 필터링 개선
3. 만화같은 유아이
4. 폰 유아이 ← v2에서 처리함 (세로 화면 기준으로 다시 짬)

## 시작하기

```bash
npm install
npm run dev      # http://localhost:4321
```

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버. 고치면 바로 반영된다 |
| `npm run build` | `dist/` 에 정적 HTML을 뽑는다 |
| `npm run preview` | 빌드 결과를 그대로 확인 |
| `npm run check:questions` | **문항 손봤으면 꼭 돌릴 것** (4,800조합 검사) |
| `npm run tag:where` | 문항의 자리 태그 재판정. 인자 없이 돌리면 검토용 출력만 |
| `npm run art` | 그림 자리표시자와 `docs/ART-MANIFEST.md` 재생성 |

## 어디를 고치면 되나

| 하고 싶은 것 | 고칠 파일 |
| --- | --- |
| 대사·지문 바꾸기 | `src/data/scenes.ts` |
| **장면에 나오는 문항 바꾸기** | `src/data/scenes.ts` 의 `accepts` / `stages` |
| 문항 내용 바꾸기 | `src/data/questions/*.json` |
| 문항 자리 태그 고치기 | `tools/tag-where.mjs` 의 `OVERRIDE` → `npm run tag:where -- --write` |
| 문항 뽑는 규칙 바꾸기 | `src/engine/select.ts` |
| 그림 넣기 | `public/art/` 에 같은 이름으로 덮어쓰기 |
| 색·글꼴 바꾸기 | `src/styles/app.css` 맨 위 토큰 |
| 채점 방식 | `src/engine/score.ts` — **가급적 건드리지 말 것** ([이유](docs/ARCHITECTURE.md)) |

## 문항이 장면에 배치되는 방식

장면마다 두 가지를 선언하고, **둘 다 맞는 문항만** 그 장면에 나온다.

| | 뜻 | 예 |
| --- | --- | --- |
| `accepts` | 어느 자리의 문항을 받을지 (시간·장소) | 급식실 → `['meal', 'any']` |
| `stages` | 어느 관계 단계를 다룰지 (문항의 `ch`) | 급식실 → `[4]` (썸) |

문항 쪽에는 `where` 가 붙어 있다. 대부분(321/364)은 `any` 라서 아무 장면에나 갈 수 있고,
구체적인 상황을 그리는 43개만 자리를 갖는다 (`meal`, `class`, `road`, `room`, `hall`, `phone`).

> **장면에 이상한 문항이 나오면** 문항을 고치기 전에 `scenes.ts` 의 `accepts`/`stages` 부터 본다.
> 대개 그쪽이 원인이고, 한 줄로 고쳐진다.

## 문서

- [구조 설명](docs/ARCHITECTURE.md) — 왜 이렇게 짰는지, 뭘 조심해야 하는지
- [일러스트 목록](docs/ART-MANIFEST.md) — 제미나이로 만들 그림과 프롬프트
- [Cloudflare 연결](docs/CLOUDFLARE.md) — 배포 설정 (권한 있는 사람이 한 번만)

## 디자인에 대해

지금 화면은 **무채색 뼈대**다. 미감이 아직 합의 전이라 일부러 색을 안 넣었다.
`src/styles/app.css` 맨 위 토큰만 바꾸면 전체가 따라오게 해뒀다.

## `index.html` 은 뭔가

v1 원본이다. GitHub Pages 데모(<https://t555-art.github.io/Crush-Lab/>)를 살려두려고 남겼다.
Cloudflare로 옮기고 나면 지워도 된다. 문항 데이터는 이미 `src/data/` 로 옮겨놨다.
