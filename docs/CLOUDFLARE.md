# Cloudflare 배포

git에 푸시하면 자동으로 빌드·배포된다. **전부 무료고 카드 등록도 필요 없다.**

## 방식: Workers + 정적 에셋

Cloudflare가 신규 프로젝트를 **Workers로만** 만들도록 바꿨다.
대시보드 `Create application` 에 Pages 옵션이 더 이상 없다.
(예전 문서나 블로그의 "Pages → Connect to Git" 안내는 이제 안 맞는다)

우리 사이트는 서버에서 도는 코드가 없다. `npm run build` 가 만든 `dist/` 를
그대로 올리는 **정적 에셋 전용 Worker** 로 붙인다.

## 처음 연결하기

### 1. 계정

<https://dash.cloudflare.com/sign-up> 에서 가입. 이메일만 있으면 된다.

### 2. 프로젝트 생성

```
Workers & Pages → Create application → Continue with GitHub
```

1. GitHub 계정을 연결하고 `t555-art/Crush-Lab` 을 고른다
   - 비공개 저장소여도 된다 (GitHub Pages와 달리 유료 플랜이 필요 없다)
2. 빌드 설정을 아래처럼 넣는다

   | 항목 | 값 |
   | --- | --- |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |

   `Deploy command` 에 **`pages` 를 넣으면 안 된다.** 이건 Worker 프로젝트다.

3. Deploy

2~3분 뒤 `crush-lab.<계정>.workers.dev` 같은 주소가 나온다.

### 3. 주소를 코드에 반영

받은 주소를 `astro.config.mjs` 의 `site` 에 적는다.

```js
site: 'https://crush-lab.<계정>.workers.dev',
```

이 값으로 공유 링크와 카톡 썸네일 주소가 만들어진다. 틀리면 썸네일이 안 뜬다.

## 저장소에 이미 되어 있는 것

| 파일 | 역할 |
| --- | --- |
| `wrangler.toml` | 올릴 폴더가 `dist/` 라는 것 (`[assets]`) |
| `.node-version` | 빌더가 Node 22를 쓰도록 (Astro 요구사항) |

## 빌드가 실패하면

`Deployments` 탭 → 실패한 배포 클릭 → 로그를 펼쳐서 **마지막 에러 줄**을 본다.

| 로그에 보이는 것 | 원인 | 조치 |
| --- | --- | --- |
| `npm error engine` / `Unsupported engine` | 빌더 Node 버전이 낮음 | `.node-version` 이 저장소에 있는지 확인. 안 되면 환경변수 `NODE_VERSION=22.16.0` 추가 |
| `Missing entry-point to Worker script or to assets directory` | `dist/` 가 없음 | 빌드 명령이 `npm run build` 인지 확인 |
| `you have run 'wrangler deploy' on a Pages project` | 예전에 만든 Pages 프로젝트가 같은 이름으로 남아 있음 | 그 프로젝트를 지우고 다시 만들거나, `wrangler.toml` 의 `name` 을 바꾼다 |

환경변수 넣는 곳: `Settings → Variables and Secrets → Add`

설정을 고친 뒤에는 **재배포해야 반영된다.**
`Deployments` 탭 → 최신 배포 → `Retry deployment`

## 배포가 됐는지 확인

주소를 열어서 첫 화면만 보면 된다.

회색 바탕에 "Crush Lab" 이 뜨면 정상이다.
`/privacy` · `/terms` · `/sitemap-index.xml` 도 열리는지 보면 확실하다.

검사 내용이 아직 비어 있으므로 `/play` 에서는
"검사할 내용이 비어 있어" 가 뜬다. 이것도 정상이다.

## 방문 측정 켜기 (무료)

완주율을 재려면 필요하다. 쿠키를 안 쓰고 개인정보도 안 모은다.

1. Cloudflare 대시보드 → **Analytics & Logs → Web Analytics**
2. **Add a site** → 배포 주소 입력 → 토큰이 나온다
3. 그 토큰을 프로젝트 환경변수로 넣는다

```
Settings → Variables and Secrets → Add
  이름: PUBLIC_CF_BEACON_TOKEN
  값:   (받은 토큰)
```

4. 재배포하면 측정이 시작된다

토큰이 없으면 측정 스크립트 자체가 안 붙는다. 켜기 전까지는 아무것도 로드되지 않는다.

## 무료 한도

| 항목 | 한도 |
| --- | --- |
| 정적 에셋 요청 | 무제한 |
| Worker 요청 | 하루 100,000건 |
| 빌드 시간 | 월 3,000분 (우리 빌드는 2초) |

## 도메인은 나중에

지금 주소로 충분하다. 도메인을 사면 `Settings → Domains & Routes` 에서
추가하기만 하면 되고 사이트를 옮길 필요는 없다.
그때 `astro.config.mjs` 의 `site` 만 새 주소로 바꾼다.

## 나중에 AI 기능을 붙일 때

DM 분석 같은 기능은 API 키를 숨길 서버가 필요한데,
이미 Worker로 붙어 있어서 여기에 이어 만들면 된다.
**API 키는 반드시 `Settings → Variables and Secrets` 에 넣는다.**
저장소에 커밋하면 그대로 털린다.
