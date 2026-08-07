# Cloudflare 배포

git에 푸시하면 자동으로 빌드·배포된다. **전부 무료고 카드 등록도 필요 없다.**

## 지금 붙어 있는 방식

Cloudflare가 Pages와 Workers를 통합하면서 두 종류가 생겼는데,
이 프로젝트는 **Workers + 정적 에셋** 쪽으로 붙어 있다.

구별법: 배포 로그에 `wrangler deploy` 가 찍히면 Worker다.
주소도 `*.workers.dev` 로 나온다. (Pages였다면 `*.pages.dev`)

서버에서 도는 코드는 없다. `npm run build` 가 만든 `dist/` 를 그대로 올릴 뿐이다.

## 설정

### 저장소에 있는 것 (이미 되어 있음)

| 파일 | 역할 |
| --- | --- |
| `wrangler.toml` | 올릴 폴더가 `dist/` 라는 것 |
| `.node-version` | 빌더가 Node 22를 쓰도록 (Astro 요구사항) |

### 대시보드에서 넣어야 하는 것

**빌드 명령 하나뿐이다.**

```
Build command:  npm run build
```

위치:

```
Workers & Pages → crush-lab → Settings → Build → Edit
```

빌드 명령이 비어 있으면 `dist/` 가 안 만들어지고, 배포 단계에서
`Missing entry-point to Worker script or to assets directory` 가 뜬다.

**고친 뒤에는 재배포해야 반영된다.**
`Deployments` 탭 → 최신 배포 → `Retry deployment`

## 빌드가 실패하면

`Deployments` 탭 → 실패한 배포 클릭 → 로그를 펼쳐서 마지막 에러를 본다.

| 로그에 보이는 것 | 원인 | 고치는 법 |
| --- | --- | --- |
| `npm error engine` / `Unsupported engine` | 빌더 Node 버전이 낮음 | `.node-version` 이 저장소에 있는지 확인. 안 되면 환경변수 `NODE_VERSION=22.16.0` 추가 |
| `Missing entry-point ... or to assets directory` | `dist/` 가 없거나 못 찾음 | 빌드 명령이 `npm run build` 로 들어가 있는지 확인 |
| `Could not resolve ...` | 의존성 문제 | 로컬에서 `npm ci && npm run build` 로 재현되는지 확인 |

환경변수 넣는 곳: `Settings → Variables and Secrets → Add`

## 배포가 됐는지 확인

주소를 열어서 첫 화면만 보면 된다.

| 보이는 화면 | 뜻 |
| --- | --- |
| 회색 바탕에 "좋아하는 사람이 있는 하루를 따라가 볼래?" | v2. 정상 |
| 분홍 유리 느낌에 "Crush Lab" 큰 글씨 | v1. 빌드가 안 돌고 저장소 루트가 그대로 서빙된 것 |

`/type/FDOA/` 같은 주소가 열리는지도 확인하면 확실하다. 유형 페이지 16개가 있어야 정상이다.

## 주소를 코드에 반영

실제로 받은 주소를 `astro.config.mjs` 의 `site` 에 적는다.

```js
site: 'https://crush-lab.<계정>.workers.dev',
```

이 값으로 공유 링크와 카톡 썸네일 주소가 만들어진다. 틀리면 썸네일이 안 뜬다.

## 무료 한도

| 항목 | 한도 |
| --- | --- |
| 정적 에셋 요청 | 무제한 |
| Worker 요청 | 하루 100,000건 |
| 빌드 | 월 500회 (하루 16회) |

## 도메인은 나중에

지금 주소로 충분하다. 도메인을 사면 `Settings → Domains & Routes` 에서
추가하기만 하면 되고 사이트를 옮길 필요는 없다.
그때 `astro.config.mjs` 의 `site` 만 새 주소로 바꾼다.

## 나중에 AI 기능을 붙일 때

DM 분석 같은 기능은 API 키를 숨길 서버가 필요한데,
이미 Worker로 붙어 있어서 여기에 이어 만들면 된다.
**API 키는 반드시 `Settings → Variables and Secrets` 에 넣는다.**
저장소에 커밋하면 그대로 털린다.
