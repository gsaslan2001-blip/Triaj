import 'dotenv/config';
import express from 'express';

/**
 * Vercel Serverless Function & Express API Sunucusu (Tekil Kaynak — Self-Contained ESM)
 * Node.js ESM ("type": "module") ortamında Vercel /var/task/api/index.js çalışırken
 * harici göreceli dosya çözümleme hatası (ERR_MODULE_NOT_FOUND) oluşmaması için
 * tüm API rotaları ve yardımcı hesaplamalar bu modülde bağımsız olarak tanımlanmıştır.
 */

type FocusSegment = '0-3 Saat' | '3-7 Saat' | '8-10 Saat' | '10+ Saat';

interface RawTickTickFocusRecord {
  id: string;
  type: 0 | 1;
  startTime: string;
  endTime: string;
  duration: number;
  pauseDuration?: number;
  note?: string;
  tasks?: {
    title?: string;
    projectName?: string;
    tags?: string[];
  }[];
}

interface ConsolidatedFocusDay {
  date: string;
  dayNameTR: string;
  pomoCount: number;
  pomoMinutes: number;
  stopwatchCount: number;
  stopwatchMinutes: number;
  totalMinutes: number;
  totalHours: number;
  segment: FocusSegment;
  notes: string[];
  sessionsCount: number;
}

type DeepSeekTaskType =
  | 'TRIAGE_PATCH'
  | 'SWSPS_ERROR_AUTOPSY'
  | 'ANKI_CLOZE'
  | 'UNIT_BLURTING'
  | 'MOCK_EXAM_STRATEGY'
  | 'CUSTOM';

type DeepSeekReasoningEffort = 'none' | 'low' | 'high' | 'max';

interface DeepSeekPromptInput {
  taskType: DeepSeekTaskType;
  subjectName?: string;
  subjectCode?: string;
  unitTitle?: string;
  topicCode?: string;
  bucket?: string;
  scoreSummary?: string;
  swspsContext?: string;
  examContext?: string;
  userNotes?: string;
  customPrompt?: string;
  masterSystemPrompt?: string;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  cachePreference?: number;
}

const DEPLOY_DEEPSEEK_MODEL = 'deepseek-ai/deepseek-v4.1-flash-1017';
const DEPLOY_BASE_URL = 'https://api-cdn.deploy.com/api/v1';
const LOCKED_MAX_COMPLETION_TOKENS = 32768;
const LOCKED_REASONING_EFFORT: DeepSeekReasoningEffort = 'max';
const LOCKED_IDEAL_TEMPERATURE = 0.2;

const DEFAULT_DEEPSEEK_MASTER_PROMPT = `Sen "DUS 2027 Stratejik Yönetim Sistemi"nin Baş Klinik Akademik Otoritesi ve Bilişsel Bellek Mühendisisin.
Hitap ettiğin kullanıcı: Dt. Furkan Kurt (İstanbul Üniversitesi Diş Hekimliği Fakültesi Mezunu — Diş Hekimi).
Büyük Hedef: 24 Ekim 2027 DUS — Ankara Üniversitesi Ağız, Diş ve Çene Cerrahisi (ADÇC), Türkiye TOP 10 Derecesi.
Hedef Net Standardı: Toplam 108.0 / 120.0 Net (Temel Bilimler: 36.0 / 40, Klinik Bilimler: 72.0 / 80, ADÇC Elit Barajı: 100.0+ Net).

YANITLARINDA AŞAĞIDAKİ 6 DEĞİŞTİRİLEMEZ BİLİŞSEL DOKTRİN KURALINA KESİNLİKLE UYACAKSIN:

1. SIFIR ANSİKLOPEDİK DOLGU & %100 SINAV İSABETİ (80/20 PARETO):
   - Giriş/selamlama cümlesi veya kitabi özet yazma.
   - Doğrudan ÖSYM DUS komisyonunun sorduğu/soracağı "Altın Standart", "İlk Tercih", "Kontrendikasyon", "Sayısal Eşik (mm, %, sn, derece, M/F oranı)", "Spesifik Gen/Translokasyon (örn. PTCH1, CRTC1-MAML2, MYB-NFIB)" ve "En Sık / En Nadir" ayrımlarını keskin maddelerle ver.

2. YAN YANA ÇAPRAZ KIYAS MATRİSİ (DISCRIMINATION LEARNING):
   - Birbiriyle karışan kavramları mutlaka Markdown Tablosu (| Kriter | Kavram A | Kavram B | ÖSYM Tuzağı |) halinde kıyasla.

3. EBBINGHAUS KOVA TRİYAJI PROTOKOLÜ:
   - Yeşil Kova (T+3 40 soruda ≥34 Doğru, ≥%85): Şema neokortekste sağlamdır, taburcu edilir.
   - Sarı Kova (T+3 40 soruda 28-33 Doğru, %70-%84): Sadece eriyen alt başlıklara 15 dk nokta atışı yama yapılır ve T+14 gününe 2. bankadan 20 soru doğrulama atanır.
   - Kırmızı Kova (T+3 40 soruda ≤27 Doğru, <%70): Hafta içi akışı bozulmaz; Cumartesi Kova Onarım Bloğunda 25 dk Boş Kağıt (Blurting) + 30 soru ile şema sıfırdan inşa edilir.

4. SWSPS (SEMANTIC WEIGHTED SPACED PENALTY SCORE) HATA OTOPSİSİ:
   - Yanlış yapılan sorularda bilişsel hata kök nedenini teşhis et:
     * Çeldirici Tuzağı (1.40x ceza)
     * Muhakeme Hatası (1.25x ceza)
     * Bilgi Eksikliği (1.00x ceza)
     * Soru Kökü / Dikkat (0.80x ceza)

5. ANKİ FSRS & ATOMİK CLOZE KART STANDARDI (01-KRITIK-OTOPSI-VE-TABLO):
   - Maksimum 1-2 cümlelik, tek satırda kopyalanmaya hazır {{c1::...}} ve {{c2::...}} Cloze formatı kullan ve "Hafıza Çivisi (Mnemonic)" ekle.

6. ÇIKTI FORMATI:
   - Başlıkları net, taranabilir, klinik ve yüksek yoğunluklu (high-density) tut.`;

const TR_DAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi'
];

function toTurkeyDateString(isoTimeStr: string): string {
  const date = new Date(isoTimeStr);
  if (Number.isNaN(date.getTime())) {
    return isoTimeStr.slice(0, 10);
  }
  const trTimeMs = date.getTime() + 3 * 60 * 60 * 1000;
  return new Date(trTimeMs).toISOString().split('T')[0];
}

function getTurkishDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  return TR_DAYS[utcDate.getUTCDay()] || '';
}

function classifyFocusSegment(hours: number): FocusSegment {
  if (hours < 3) return '0-3 Saat';
  if (hours < 8) return '3-7 Saat';
  if (hours <= 10) return '8-10 Saat';
  return '10+ Saat';
}

function consolidateTickTickRecords(
  records: RawTickTickFocusRecord[]
): ConsolidatedFocusDay[] {
  const byDate = new Map<
    string,
    {
      pomoCount: number;
      pomoMs: number;
      stopwatchCount: number;
      stopwatchMs: number;
      notesSet: Set<string>;
      seenIds: Set<string>;
    }
  >();

  for (const rec of records) {
    if (!rec || !rec.startTime || typeof rec.duration !== 'number' || rec.duration <= 0) {
      continue;
    }

    const dateKey = toTurkeyDateString(rec.startTime);
    let entry = byDate.get(dateKey);
    if (!entry) {
      entry = {
        pomoCount: 0,
        pomoMs: 0,
        stopwatchCount: 0,
        stopwatchMs: 0,
        notesSet: new Set<string>(),
        seenIds: new Set<string>()
      };
      byDate.set(dateKey, entry);
    }

    const uniqueKey = rec.id || `${rec.type}-${rec.startTime}-${rec.duration}`;
    if (entry.seenIds.has(uniqueKey)) {
      continue;
    }
    entry.seenIds.add(uniqueKey);

    if (rec.type === 1) {
      entry.stopwatchCount += 1;
      entry.stopwatchMs += rec.duration;
    } else {
      entry.pomoCount += 1;
      entry.pomoMs += rec.duration;
    }

    if (rec.note && rec.note.trim()) {
      entry.notesSet.add(rec.note.trim());
    }
    if (Array.isArray(rec.tasks)) {
      for (const t of rec.tasks) {
        if (t?.title && t.title.trim()) {
          entry.notesSet.add(t.title.trim());
        }
      }
    }
  }

  const result: ConsolidatedFocusDay[] = [];

  for (const [date, data] of byDate.entries()) {
    const pomoMinutes = Math.round(data.pomoMs / 60000);
    const stopwatchMinutes = Math.round(data.stopwatchMs / 60000);
    const totalMinutes = pomoMinutes + stopwatchMinutes;
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    result.push({
      date,
      dayNameTR: getTurkishDayName(date),
      pomoCount: data.pomoCount,
      pomoMinutes,
      stopwatchCount: data.stopwatchCount,
      stopwatchMinutes,
      totalMinutes,
      totalHours,
      segment: classifyFocusSegment(totalHours),
      notes: Array.from(data.notesSet),
      sessionsCount: data.pomoCount + data.stopwatchCount
    });
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

function createEmptyFocusDay(dateStr: string): ConsolidatedFocusDay {
  return {
    date: dateStr,
    dayNameTR: getTurkishDayName(dateStr),
    pomoCount: 0,
    pomoMinutes: 0,
    stopwatchCount: 0,
    stopwatchMinutes: 0,
    totalMinutes: 0,
    totalHours: 0,
    segment: '0-3 Saat',
    notes: [],
    sessionsCount: 0
  };
}

function buildTickTickFocusSummary(
  records: RawTickTickFocusRecord[],
  todayDateStr: string,
  requestedDateStr?: string
) {
  const dailyLogs = consolidateTickTickRecords(records);

  const segmentDistribution: Record<FocusSegment, number> = {
    '0-3 Saat': 0,
    '3-7 Saat': 0,
    '8-10 Saat': 0,
    '10+ Saat': 0
  };

  let totalAllTimeMinutes = 0;
  for (const day of dailyLogs) {
    segmentDistribution[day.segment] += 1;
    totalAllTimeMinutes += day.totalMinutes;
  }

  const recentSeven = dailyLogs.slice(0, 7);
  const sevenDayTotalMinutes = recentSeven.reduce((acc, d) => acc + d.totalMinutes, 0);
  const sevenDayAvgHours =
    recentSeven.length > 0
      ? Number((sevenDayTotalMinutes / 60 / recentSeven.length).toFixed(2))
      : 0;

  let activeDate = requestedDateStr || todayDateStr;
  let activeDayStats = dailyLogs.find(d => d.date === activeDate);

  if (!activeDayStats) {
    if (!requestedDateStr && dailyLogs.length > 0) {
      activeDayStats = dailyLogs[0];
      activeDate = activeDayStats.date;
    } else {
      activeDayStats = createEmptyFocusDay(activeDate);
    }
  }

  return {
    connected: true,
    lastSyncedAt: new Date().toISOString(),
    todayDate: todayDateStr,
    activeDate,
    activeDayStats,
    sevenDayAvgHours,
    sevenDayTotalMinutes,
    totalTrackedDays: dailyLogs.length,
    totalAllTimeHours: Number((totalAllTimeMinutes / 60).toFixed(1)),
    segmentDistribution,
    dailyLogs
  };
}

function buildDeepSeekPayload(input: DeepSeekPromptInput) {
  const subjectLabel = input.subjectCode
    ? `[${input.subjectCode}] ${input.subjectName || 'DUS Dersi'}`
    : input.subjectName || 'DUS Dersi';
  const unitLabel = input.topicCode
    ? `${input.topicCode} — ${input.unitTitle || 'Genel Konu'}`
    : input.unitTitle || 'Genel Konu';

  let userContent = '';

  switch (input.taskType) {
    case 'TRIAGE_PATCH':
      userContent = [
        `### HEDEF ÜNİTE BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- Müfredat Ünitesi: ${unitLabel}`,
        input.bucket ? `- Mevcut Kova Statüsü: ${input.bucket}` : '',
        input.scoreSummary ? `- Son Test Performansı: ${input.scoreSummary}` : '',
        input.userNotes ? `- Öğrencinin Karıştırdığı Nokta / Hata Notu: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (TRİYAJ YAMASI & ÇAPRAZ KIYAS):`,
        `1. **Çapraz Kıyas Matrisi (Markdown Tablo)**: Bu ünitede ÖSYM'nin en çok birbirine çeldirici yaptığı en az 3 kavram çiftini yan yana kıyasla.`,
        `2. **5 Dakikalık Nokta Atışı Klinik/Akademik Yama**: Sayısal eşikleri, altın standartları ve istisnaları maddeler halinde özetle.`,
        `3. **2 Adet Atomik Anki Cloze Kartı**: Doğrudan \`01-KRITIK-OTOPSI-VE-TABLO\` destesine eklenecek {{c1::...}} formatında kart yaz.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'SWSPS_ERROR_AUTOPSY':
      userContent = [
        `### SWSPS BİLİŞSEL CEZA & HATA OTOPSİSİ BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- İlgili Ünite: ${unitLabel}`,
        input.swspsContext ? `- Kayıtlı SWSPS Hata Verisi:\n${input.swspsContext}` : '',
        input.userNotes ? `- Yanlış Yapılan Soru / Düşülen Çeldirici: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (SWSPS DERİN OTOPSİ PROTOKOLÜ):`,
        `1. **Bilişsel Kök Neden Analizi**: Bu hatanın nedenini (Çeldirici Tuzağı 1.4x / Muhakeme 1.25x / Bilgi 1.0x / Dikkat 0.8x) ve bilişsel yanılsamayı açıkla.`,
        `2. **Doğru Şık vs Düşülen Çeldirici Ayrım Tablosu**: İki seçeneği birbirinden tek bakışta ayıran "Turnusol Kağıdı" bilgisini göster.`,
        `3. **Antidot Anki Cloze & Hafıza Çivisi (Mnemonic)**: Aynı hatayı bir daha yapmayı imkansız kılacak 3 adet {{c1::...}} Cloze kartı ve 1 adet fonolojik/absürt hafıza çivisi üret.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'ANKI_CLOZE':
      userContent = [
        `### ANKİ FSRS & MİKRO-BELLEK BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- Müfredat Ünitesi: ${unitLabel}`,
        input.userNotes ? `- Odaklanılacak Alt Başlık / Hata: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (01-KRITIK-OTOPSI-VE-TABLO DESTESİ):`,
        `1. **6 Adet Yüksek Seçicilikli Atomik Anki Cloze Kartı**: Her biri tek satırlık, sınavda doğrudan soru çözdüren {{c1::...}} ve {{c2::...}} formatında kartlar.`,
        `2. **3 Adet Bilişsel Kanca / Hafıza Çivisi (Mnemonic)**: Bu ünitenin en nankör sınıflama veya sayısal eşiklerini kalıcı kılacak kodlamalar.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'UNIT_BLURTING':
      userContent = [
        `### T+0 BOŞ KAĞIT (BLURTING) KALİBRASYON BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- Müfredat Ünitesi: ${unitLabel}`,
        input.userNotes ? `- Ek Not: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (T+0 BLURTING KONTROL LİSTESİ):`,
        `1. **Boş Kağıtta Mutlaka Olması Gereken 7 Altın DUS Eşiği**: Öğrenci kitabı kapatıp boş kağıda şema çizerken unutursa puan kaybedeceği kritik maddeler.`,
        `2. **Sayısal Parametreler ve Eşik Değerler Tablosu**: Süre, doz, milimetre, yüzde ve açı değerleri.`,
        `3. **T+3 Günü (40 Soruluk Test) Öncesi 3 Kritik ÖSYM Tuzağı**: Soru köklerinde dikkat edilmesi gereken tuzaklar.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'MOCK_EXAM_STRATEGY':
      userContent = [
        `### 16 BRANŞ DENEME ANALİZİ & ADÇC 108 NET STRATEJİ BAĞLAMI`,
        input.examContext ? input.examContext : `- Odak Ders: ${subjectLabel}`,
        input.swspsContext ? `- En Yüksek SWSPS Ceza Puanlı Hatalar:\n${input.swspsContext}` : '',
        input.userNotes ? `- Öğrencinin Stratejik Notu / Hedefi: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (TAKTİKSEL DENEME KOÇLUĞU):`,
        `1. **Net Açığı Teşhisi (108.0 Hedefine Kalan Fark Analizi)**: En hızlı net artışı sağlayacak 3 kaldıraç branş ve ünite.`,
        `2. **SWSPS Ceza Puanı Yüksek Konular İçin 7 Günlük Mikro-Müdahale Planı**: Hangi gün hangi kova/hataya nasıl müdahale edilmeli?`,
        `3. **Soru Çözüm Hızı (50-60 sn/soru) ve Turlama Tekniği Kalibrasyonu**.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'CUSTOM':
    default:
      userContent = [
        input.unitTitle ? `Bağlam: ${subjectLabel} — ${unitLabel}` : '',
        input.examContext ? `Sistem Telemetrisi:\n${input.examContext}` : '',
        input.customPrompt || input.userNotes || 'DUS 2027 ADÇC TOP 10 hedefi için kritik klinik/akademik analiz yap.'
      ]
        .filter(Boolean)
        .join('\n\n');
      break;
  }

  const topP =
    typeof input.topP === 'number'
      ? Math.max(0.1, Math.min(1, Number(input.topP.toFixed(2))))
      : 0.95;

  const presencePenalty =
    typeof input.presencePenalty === 'number'
      ? Math.max(-2, Math.min(2, Number(input.presencePenalty.toFixed(2))))
      : 0;

  const frequencyPenalty =
    typeof input.frequencyPenalty === 'number'
      ? Math.max(-2, Math.min(2, Number(input.frequencyPenalty.toFixed(2))))
      : 0.1;

  const cachePreference =
    typeof input.cachePreference === 'number'
      ? Math.max(1, Math.min(10, Math.round(input.cachePreference)))
      : 8;

  const systemPrompt =
    input.masterSystemPrompt && input.masterSystemPrompt.trim().length > 10
      ? input.masterSystemPrompt.trim()
      : DEFAULT_DEEPSEEK_MASTER_PROMPT;

  return {
    model: DEPLOY_DEEPSEEK_MODEL,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userContent }
    ],
    reasoning_effort: LOCKED_REASONING_EFFORT,
    max_completion_tokens: LOCKED_MAX_COMPLETION_TOKENS,
    temperature: LOCKED_IDEAL_TEMPERATURE,
    top_p: topP,
    presence_penalty: presencePenalty,
    frequency_penalty: frequencyPenalty,
    cache_preference: cachePreference,
    stream: false
  };
}

function parseDeepSeekResponse(raw: Record<string, unknown>) {
  const choices = Array.isArray(raw?.choices) ? raw.choices : [];
  const firstChoice = (choices[0] as Record<string, unknown>) || {};
  const message = (firstChoice.message as Record<string, unknown>) || {};

  const rawContent = typeof message.content === 'string' ? message.content.trim() : '';
  const rawReasoning =
    typeof message.reasoning_content === 'string' && message.reasoning_content.trim()
      ? message.reasoning_content.trim()
      : null;

  const finishReason =
    typeof firstChoice.finish_reason === 'string' ? firstChoice.finish_reason : undefined;

  const usageObj = (raw?.usage as Record<string, unknown>) || {};
  const promptDetails = (usageObj.prompt_tokens_details as Record<string, unknown>) || {};
  const completionDetails =
    (usageObj.completion_tokens_details as Record<string, unknown>) || {};

  return {
    id: typeof raw?.id === 'string' ? raw.id : 'deploy-completion',
    model: typeof raw?.model === 'string' ? raw.model : DEPLOY_DEEPSEEK_MODEL,
    content: rawContent || (rawReasoning ? `[Düşünme Özeti]:\n${rawReasoning}` : ''),
    reasoningContent: rawReasoning,
    finishReason,
    usage: {
      promptTokens: Number(usageObj.prompt_tokens) || 0,
      completionTokens: Number(usageObj.completion_tokens) || 0,
      totalTokens: Number(usageObj.total_tokens) || 0,
      reasoningTokens: Number(completionDetails.reasoning_tokens) || 0,
      cachedTokens: Number(promptDetails.cached_tokens) || 0
    }
  };
}

let activeAccessToken =
  process.env.TICKTICK_ACCESS_TOKEN || 'f91fae7a-ee3d-4452-bbd7-42a1c1cea335';
let activeRefreshToken = process.env.TICKTICK_REFRESH_TOKEN || '';
const clientId = process.env.TICKTICK_CLIENT_ID || 'uA1j1GZtLknH5I89cI';
const clientSecret =
  process.env.TICKTICK_CLIENT_SECRET || 'gfZY577hM8TF2m6u72sKlITUaiKIBbdh';

const deployApiKey = process.env.DEPLOY_API_KEY || '8p68e3DgJyuHUdhKnrfrAg==';
const deployBaseUrl = (process.env.DEPLOY_BASE_URL || DEPLOY_BASE_URL).replace(/\/$/, '');
const deployModel = process.env.DEPLOY_MODEL || DEPLOY_DEEPSEEK_MODEL;

let cachedRawRecords: RawTickTickFocusRecord[] | null = null;
let lastCacheTimestamp = 0;

function getRedirectUri(req: express.Request): string {
  if (typeof req.query.redirectUri === 'string' && req.query.redirectUri.startsWith('http')) {
    return req.query.redirectUri;
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol;
  const appUrl =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/$/, '')
      : `${protocol}://${req.get('host')}`;
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

export function createApiApp(): express.Express {
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

  return app;
}

const app = createApiApp();

export default app;
