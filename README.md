# Crush Lab

하루를 따라가며 알아보는 연애 성향 검사.
아침에 눈 뜨는 순간부터 밤에 폰을 놓는 순간까지, 좋아하는 사람이 있는 하루를 지나가면서 답한다.

**<https://crush-lab.kangchiteacher123.workers.dev>**

main에 머지되면 Cloudflare가 자동으로 빌드·배포한다. 직접 올릴 일은 없다.

## 지금 상태

| | 상태 |
| --- | --- |
| 장면 7개 (07:10 → 23:10) | 동작 |
| 문항 35개 · 기본 질문 7개 | 동작 |
| 탭으로 넘기는 화면 | 동작 |
| 진행상황 저장 (새로고침해도 안 날아감) | 동작 |
| 유형 페이지 16개 | 동작 |
| 공유 썸네일 | SVG라 카톡에서 안 뜸 — PNG로 교체 필요 |
| 결과 화면 내용 | 작업 중 |
| 일러스트 | 자리표시자 (9월 생성 예정) |

## 다음에 할 일

전체 계획은 [로드맵](docs/ROADMAP.md)에 있다. 8월 목표만 추리면:

**친구 — 콘텐츠**
1. 하루 서사 구체화
2. 문항 필터링 (장면 맥락에 안 맞는 문항 골라내기)
3. 결과 내용 개선

**코드**
1. 공유 링크 + PNG 썸네일 ← 사람이 늘어나는 유일한 경로
2. 결과 화면 구조
3. 방문 측정 (완주율)
4. 문항 태그 구조
5. 개인정보 처리방침

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
| `npm run art` | 그림 자리표시자와 `docs/ART-MANIFEST.md` 재생성 |

## 어디를 고치면 되나

| 하고 싶은 것 | 고칠 파일 |
| --- | --- |
| 대사·지문 바꾸기 | `src/data/scenes.ts` |
| 문항 내용 바꾸기 | `src/data/questions/*.json` |
| 문항 뽑는 규칙 바꾸기 | `src/engine/select.ts` |
| 그림 넣기 | `public/art/` 에 같은 이름으로 덮어쓰기 |
| 색·글꼴 바꾸기 | `src/styles/app.css` 맨 위 토큰 |
| 배포 주소 바꾸기 | `astro.config.mjs` 의 `site` |
| 채점 방식 | `src/engine/score.ts` — **가급적 건드리지 말 것** ([이유](docs/ARCHITECTURE.md)) |

## 문서

- [로드맵](docs/ROADMAP.md) — 무엇을 어떤 순서로, 왜
- [구조 설명](docs/ARCHITECTURE.md) — 왜 이렇게 짰는지, 뭘 조심해야 하는지
- [일러스트 목록](docs/ART-MANIFEST.md) — 생성할 그림과 프롬프트
- [Cloudflare 배포](docs/CLOUDFLARE.md) — 설정과 문제 해결

## 디자인에 대해

지금 화면은 **무채색 뼈대**다. 미감이 아직 합의 전이라 일부러 색을 안 넣었다.
`src/styles/app.css` 맨 위 토큰만 바꾸면 전체가 따라오게 해뒀다.

## `.nojekyll` 은 왜 있나

GitHub Pages는 저장소를 Jekyll로 빌드하는데, Jekyll은 `---` 로 시작하는 파일을
YAML 설정으로 착각한다. Astro 파일이 전부 `---` 로 시작해서 빌드가 실패했다.
`.nojekyll` 이 있으면 그 처리를 건너뛴다.

v1 원본(`index.html`)은 지웠다. 사이트는 이제 Cloudflare에서만 돈다.
GitHub Pages는 꺼도 된다.
