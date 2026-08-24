// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    // 페이지가 늘어나면 자동으로 sitemap.xml 에 들어간다.
    // 개발용 화면(/art)은 뺀다.
    sitemap({ filter: page => !page.includes('/art') }),
  ],

  /**
   * 배포 주소. 공유 링크·OG 태그·canonical이 이 값을 기준으로 절대경로를 만든다.
   * 틀리면 카톡 썸네일이 안 뜨고 검색 색인도 엉뚱한 데를 가리킨다.
   * 도메인을 사면 여기만 바꾸면 된다.
   */
  site: 'https://crush-lab.kangchiteacher123.workers.dev',

  /** 전부 정적 HTML로 뽑는다. 서버가 필요 없어서 무료 호스팅에 그대로 올라간다 */
  output: 'static',

  build: {
    // /type/FDOA/ 처럼 확장자 없는 주소로 뽑는다.
    // 공유 링크에 .html 이 붙지 않아야 보기 좋고, Cloudflare Pages가 그대로 서빙한다.
    format: 'directory',
  },

  devToolbar: { enabled: false },
});
