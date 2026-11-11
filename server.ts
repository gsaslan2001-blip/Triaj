import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  buildTickTickFocusSummary,
  RawTickTickFocusRecord,
  toTurkeyDateString
} from './src/utils/ticktick.ts';
import {
  buildDeepSeekPayload,
  parseDeepSeekResponse,
  DeepSeekPromptInput,
  DEPLOY_BASE_URL,
  DEPLOY_DEEPSEEK_MODEL
} from './src/utils/deepseek.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

let activeAccessToken =
  process.env.TICKTICK_ACCESS_TOKEN || 'f91fae7a-ee3d-4452-bbd7-42a1c1cea335';
let activeRefreshToken = process.env.TICKTICK_REFRESH_TOKEN || '';
const clientId = process.env.TICKTICK_CLIENT_ID || 'uA1j1GZtLknH5I89cI';
const clientSecret =
  process.env.TICKTICK_CLIENT_SECRET || 'gfZY577hM8TF2m6u72sKlITUaiKIBbdh';

// Deploy.com DeepSeek v4.1 Flash (1017) API Yapılandırması
const deployApiKey = process.env.DEPLOY_API_KEY || '8p68e3DgJyuHUdhKnrfrAg==';
const deployBaseUrl = (process.env.DEPLOY_BASE_URL || DEPLOY_BASE_URL).replace(/\/$/, '');
const deployModel = process.env.DEPLOY_MODEL || DEPLOY_DEEPSEEK_MODEL;

// 60 saniyelik bellek önbelleği (hızlı sekme geçişleri için)
let cachedRawRecords: RawTickTickFocusRecord[] | null = null;
let lastCacheTimestamp = 0;

function getRedirectUri(req: express.Request): string {
  if (typeof req.query.redirectUri === 'string' && req.query.redirectUri.startsWith('http')) {
    return req.query.redirectUri;
  }
  const appUrl =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/$/, '')
      : `${req.protocol}://${req.get('host')}`;
  return `${appUrl}/auth/callback`;
}

function formatTickTickDateParam(date: Date, isEndOfDay: boolean): string {
  const trDateStr = toTurkeyDateString(date.toISOString());
  const timePart = isEndOfDay ? '23:59:59' : '00:00:00';
  return `${trDateStr}T${timePart}+0300`;
}

async function fetchFocusChunk(
  fromStr: string,
  toStr: string,
  type: 0 | 1,
  token: string
): Promise<RawTickTickFocusRecord[]> {
  const url = `https://api.ticktick.com/open/v1/focus?from=${encodeURIComponent(
    fromStr
  )}&to=${encodeURIComponent(toStr)}&type=${type}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TickTick API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchAllTickTickFocusRecords(
  forceRefresh = false
): Promise<RawTickTickFocusRecord[]> {
  const nowMs = Date.now();
  if (!forceRefresh && cachedRawRecords && nowMs - lastCacheTimestamp < 60_000) {
    return cachedRawRecords;
  }

  const windows: { from: string; to: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 3; i++) {
    const end = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    windows.push({
      from: formatTickTickDateParam(start, false),
      to: formatTickTickDateParam(end, true)
    });
  }

  const requests: Promise<RawTickTickFocusRecord[]>[] = [];
  for (const w of windows) {
    requests.push(fetchFocusChunk(w.from, w.to, 0, activeAccessToken));
    requests.push(fetchFocusChunk(w.from, w.to, 1, activeAccessToken));
  }

  const results = await Promise.all(requests);
  const combined = results.flat();

  cachedRawRecords = combined;
  lastCacheTimestamp = Date.now();
  return combined;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. TickTick OAuth 2.0 Authorization URL Endpoint
  app.get('/api/auth/ticktick/url', (req, res) => {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'tasks:read tasks:write',
      state: 'dus_ticktick_oauth',
      redirect_uri: redirectUri,
      response_type: 'code'
    });

    const authUrl = `https://ticktick.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl, redirectUri });
  });

  // 2. TickTick OAuth 2.0 Callback Handler (Popup postMessage)
  const oauthCallbackHandler = async (req: express.Request, res: express.Response) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const redirectUri = getRedirectUri(req);

    if (code) {
      try {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const bodyParams = new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          scope: 'tasks:read tasks:write',
          redirect_uri: redirectUri
        });

        const tokenRes = await fetch('https://ticktick.com/oauth/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams.toString()
        });

        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as {
            access_token?: string;
            refresh_token?: string;
          };
          if (tokenData.access_token) {
            activeAccessToken = tokenData.access_token;
            cachedRawRecords = null;
          }
          if (tokenData.refresh_token) {
            activeRefreshToken = tokenData.refresh_token;
          }
        }
      } catch (err) {
        console.error('TickTick OAuth token exchange error:', err);
      }
    }

    res.send(`
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>TickTick Bağlantısı Başarılı</title>
        </head>
        <body style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'ticktick' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>TickTick kimlik doğrulaması tamamlandı. Bu pencere otomatik olarak kapanacaktır.</p>
        </body>
      </html>
    `);
  };

  app.get(['/auth/callback', '/auth/callback/'], oauthCallbackHandler);

  // 3. TickTick Focus & Pomodoro API Endpoint
  app.get('/api/ticktick/focus', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const requestedDate =
        typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
          ? req.query.date
          : undefined;

      const todayStr = toTurkeyDateString(new Date().toISOString());
      const records = await fetchAllTickTickFocusRecords(forceRefresh);
      const summary = buildTickTickFocusSummary(records, todayStr, requestedDate);

      res.json({
        ...summary,
        hasRefreshToken: Boolean(activeRefreshToken)
      });
    } catch (error) {
      console.error('TickTick Focus API Error:', error);
      res.status(502).json({
        connected: false,
        error: error instanceof Error ? error.message : 'TickTick verisi çekilemedi.'
      });
    }
  });

  // 4. Deploy.com DeepSeek v4.1 Flash (1017) API Durum & Tamamlama Rotaları
  app.get('/api/ai/status', (_req, res) => {
    res.json({
      configured: Boolean(deployApiKey),
      provider: 'deploy.com',
      baseUrl: deployBaseUrl,
      model: deployModel
    });
  });

  app.post('/api/ai/deepseek', async (req, res) => {
    try {
      const input = (req.body || {}) as DeepSeekPromptInput;
      const payload = buildDeepSeekPayload(input);
      payload.model = deployModel;

      const apiRes = await fetch(`${deployBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${deployApiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        throw new Error(`Deploy.com API HTTP ${apiRes.status}: ${errText}`);
      }

      const rawJson = (await apiRes.json()) as Record<string, unknown>;
      const parsed = parseDeepSeekResponse(rawJson);
      res.json(parsed);
    } catch (error) {
      console.error('Deploy.com DeepSeek API Error:', error);
      res.status(502).json({
        error:
          error instanceof Error
            ? error.message
            : 'DeepSeek v4.1 Flash yanıtı alınamadı.'
      });
    }
  });

  // 5. Vite Middleware (Dev) or Static Assets (Prod)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DUS 2027, TickTick & DeepSeek v4.1 Server running on http://localhost:${PORT}`);
  });
}

startServer();
