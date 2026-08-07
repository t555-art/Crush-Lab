# Cloudflare Pages 연결하기

저장소 설정 권한이 있는 사람이 한 번만 하면 된다. 이후로는 git에 푸시할 때마다 자동 배포된다.
**전부 무료다. 카드 등록도 필요 없다.**

## 1. 계정 만들기

1. <https://dash.cloudflare.com/sign-up> 에서 가입 (이메일만 있으면 됨)
2. 로그인 후 왼쪽 메뉴에서 **Workers & Pages** 선택

## 2. 저장소 연결

1. **Create application** → **Pages** → **Connect to Git**
2. GitHub 계정 연결 → `t555-art/Crush-Lab` 선택
   - 비공개 저장소여도 된다. GitHub Pages와 달리 유료 플랜이 필요 없다.
3. 빌드 설정을 아래처럼 입력한다

   | 항목 | 값 |
   | --- | --- |
   | Framework preset | `Astro` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | (비워둠) |

4. **Save and Deploy**

2~3분 뒤 `crush-lab.pages.dev` 같은 주소가 나온다.
프로젝트 이름을 바꾸면 주소도 같이 바뀐다.

## 3. 주소를 코드에 반영

실제로 받은 주소를 `astro.config.mjs` 의 `site` 에 적는다.

```js
site: 'https://crush-lab.pages.dev',
```

이 값으로 공유 링크와 카톡 썸네일 주소가 만들어지기 때문에, 틀리면 썸네일이 안 뜬다.

## 4. 그 다음부터

`main` 에 푸시하면 자동으로 빌드·배포된다. 직접 올릴 일은 없다.
다른 브랜치에 푸시하면 미리보기 주소가 따로 생겨서, 배포 전에 확인할 수 있다.

## 무료 한도

| 항목 | 한도 | 우리 상황 |
| --- | --- | --- |
| 트래픽 | 무제한 | 걱정할 필요 없음 |
| 빌드 | 월 500회 | 하루 16회. 몰아서 푸시하면 넉넉함 |
| 빌드 시간 | 월 180분 | 우리 빌드는 2초. 사실상 안 닿음 |
| 파일 수 | 배포당 20,000개 | 지금 30개 남짓 |

## 도메인은 나중에

지금은 `*.pages.dev` 주소로 충분하다. 도메인을 사면
**Custom domains** 탭에서 추가하기만 하면 되고, 사이트를 옮길 필요는 없다.
그때 `astro.config.mjs` 의 `site` 만 새 주소로 바꾼다.

## 나중에 AI 기능을 붙일 때

DM 분석 같은 기능은 API 키를 숨길 중계 서버가 필요하다.
같은 Cloudflare 안에 **Workers**(하루 10만 요청 무료)와
**AI Gateway**(캐싱·요청 상한·로깅, 무료)가 있어서 여기서 이어서 만들면 된다.
키는 반드시 Cloudflare 대시보드의 환경변수에 넣는다 — 저장소에 커밋하면 그대로 털린다.
