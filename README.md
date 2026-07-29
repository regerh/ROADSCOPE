# ROADSCOPE 배포 가이드

이 폴더를 그대로 배포하면 ITS(국가교통정보센터) 인증키 신청에 필요한 "서비스 URL"을 얻을 수 있습니다.

```
roadscope-deploy/
├── index.html        ← 메인 서비스 (정적 파일 1개, 이것만 있으면 사이트는 뜸)
├── proxy/            ← CORS 우회가 필요할 때만 쓰는 선택 사항
│   ├── server.js
│   └── package.json
└── README.md
```

## 1단계 — 프론트엔드(index.html)만 먼저 배포하기

`index.html`은 완전한 단일 파일이라 정적 호스팅 어디에든 그대로 올라갑니다. 아래 중 가장 편한 곳 하나만 고르면 됩니다.

### Vercel (추천, 가장 빠름)
```
npm i -g vercel
cd roadscope-deploy
vercel --prod
```
배포가 끝나면 `https://프로젝트명.vercel.app` 같은 URL이 나옵니다. 이 주소가 ITS 신청서에 쓸 "서비스 URL"입니다.

### Netlify
1. https://app.netlify.com/drop 접속
2. `index.html`이 든 폴더를 그대로 드래그 앤 드롭
3. 몇 초 뒤 `https://랜덤이름.netlify.app` URL 발급됨 (Site settings에서 이름 변경 가능)

### GitHub Pages
1. 이 폴더를 깃허브 저장소로 push (`index.html`을 루트에 두거나 `docs/` 폴더에 배치)
2. 저장소 Settings → Pages → Source에서 브랜치/폴더 지정
3. `https://아이디.github.io/저장소명/` 로 접속 가능

어느 쪽이든 결과는 같습니다: **공인 URL 하나**가 생기고, ITS 인증키 신청서의 "활용 사이트 URL" 칸에 이 주소를 넣으면 됩니다.

## 2단계 — ITS 인증키 발급

1. https://www.its.go.kr 회원가입 및 로그인
2. 마이페이지 → 인증키 발급현황 → 인증키 신청
3. 서비스명/URL 입력란에 1단계에서 받은 배포 주소 입력
4. 승인 후 발급된 인증키를 사이트 우측 상단 ⚙ 설정에 붙여넣기

## 3단계 — CORS가 막히면 (proxy 배포)

ITS API가 브라우저 직접 호출에 CORS 헤더를 내려주지 않을 수 있습니다. `불러오기`를 눌렀는데 "CORS 정책으로 차단되었을 가능성" 오류가 뜨면 아래 프록시를 하나 띄우세요.

### Render.com에 배포 (무료 티어 가능)
1. Render 대시보드 → New → Web Service
2. 이 저장소를 연결하고 **Root Directory를 `proxy`로 지정**
3. Build Command: `npm install`, Start Command: `npm start`
4. 배포 완료 후 나오는 주소, 예: `https://roadscope-proxy.onrender.com`

### 로컬에서 먼저 테스트하고 싶다면
```
cd proxy
npm install
npm start
```
`http://localhost:8787`에서 프록시가 뜹니다.

### index.html에서 프록시를 쓰도록 전환
`index.html`을 열어 아래 한 줄만 바꾸면 이후 모든 API 호출(CCTV/소통정보/돌발정보)이 프록시를 거칩니다.

```js
// 변경 전
const API_BASE = 'https://openapi.its.go.kr:9443';
// 변경 후 (본인 프록시 주소로)
const API_BASE = 'https://roadscope-proxy.onrender.com/its';
```

그리고 다시 1단계 방식으로 `index.html`을 재배포하면 됩니다.

## 참고
- `index.html`은 사용자의 ITS 인증키를 브라우저 메모리에만 보관하고, 새로고침 시 사라집니다. 서버에 키를 저장하지 않습니다.
- 프록시는 `cctvInfo`, `trafficInfo`, `eventInfo` 세 경로만 중계하도록 제한되어 있어 오픈 릴레이로 악용되기 어렵습니다.
- 실시간 소통정보·돌발정보 API의 정확한 응답 필드명은 로그인 후 ITS 개발자센터에서 확인 가능합니다. 다른 필드명을 쓰는 경우 `index.html` 안 `normalizeTrafficItem` / `normalizeEventItem` 함수의 후보 배열만 수정하면 됩니다.
