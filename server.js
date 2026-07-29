// ROADSCOPE — ITS Open API CORS proxy
//
// The ITS(국가교통정보센터) Open API does not send CORS headers, so calling it
// directly from a browser will usually be blocked. This tiny server re-issues
// the request from Node (no CORS restriction server-to-server) and adds the
// header back on the way out, so your static frontend can call this instead.
//
// Local run:   npm install && npm start        (listens on PORT, default 8787)
// Then in index.html set:  const API_BASE = 'http://localhost:8787/its';
//
// Deployed (Render/Railway/Fly.io/etc.), set:
//   const API_BASE = 'https://<your-proxy-domain>/its';

const express = require('express');

const app = express();
const PORT = process.env.PORT || 8787;
const ITS_BASE = 'https://openapi.its.go.kr:9443';

// Only these path names are proxied — keeps this from becoming an open relay
const ALLOWED_PATHS = new Set(['cctvInfo', 'trafficInfo', 'eventInfo']);

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/its/:path', async (req, res) => {
  const path = req.params.path;
  if (!ALLOWED_PATHS.has(path)) {
    return res.status(400).json({ error: 'unsupported path: ' + path });
  }
  const qs = new URLSearchParams(req.query).toString();
  const targetUrl = `${ITS_BASE}/${path}?${qs}`;
  try {
    const upstream = await fetch(targetUrl);
    const text = await upstream.text();
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'upstream fetch failed', detail: String(err) });
  }
});

app.get('/', (req, res) => {
  res.send('ROADSCOPE ITS proxy is running. Use /its/cctvInfo, /its/trafficInfo, /its/eventInfo with the same query params you would send to ITS directly.');
});

app.listen(PORT, () => {
  console.log(`ROADSCOPE ITS proxy listening on port ${PORT}`);
});
