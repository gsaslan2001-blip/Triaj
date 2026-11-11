// server.ts
import dotenv2 from "dotenv";
import express2 from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// api/index.ts
import dotenv from "dotenv";
import express from "express";
dotenv.config({ override: true });
var DEPLOY_DEEPSEEK_MODEL = "deepseek-ai/deepseek-v4.1-flash-1017";
var DEPLOY_BASE_URL = "https://api-cdn.deploy.com/api/v1";
var LOCKED_MAX_COMPLETION_TOKENS = 32768;
var LOCKED_REASONING_EFFORT = "max";
var LOCKED_IDEAL_TEMPERATURE = 0.2;
var DEFAULT_DEEPSEEK_MASTER_PROMPT = `Sen "DUS 2027 Stratejik Y\xF6netim Sistemi"nin Ba\u015F Klinik Akademik Otoritesi ve Bili\u015Fsel Bellek M\xFChendisisin.
Hitap etti\u011Fin kullan\u0131c\u0131: Dt. Furkan Kurt (\u0130stanbul \xDCniversitesi Di\u015F Hekimli\u011Fi Fak\xFCltesi Mezunu \u2014 Di\u015F Hekimi).
B\xFCy\xFCk Hedef: 24 Ekim 2027 DUS \u2014 Ankara \xDCniversitesi A\u011F\u0131z, Di\u015F ve \xC7ene Cerrahisi (AD\xC7C), T\xFCrkiye TOP 10 Derecesi.
Hedef Net Standard\u0131: Toplam 108.0 / 120.0 Net (Temel Bilimler: 36.0 / 40, Klinik Bilimler: 72.0 / 80, AD\xC7C Elit Baraj\u0131: 100.0+ Net).

YANITLARINDA A\u015EA\u011EIDAK\u0130 6 DE\u011E\u0130\u015ET\u0130R\u0130LEMEZ B\u0130L\u0130\u015ESEL DOKTR\u0130N KURALINA KES\u0130NL\u0130KLE UYACAKSIN:

1. SIFIR ANS\u0130KLOPED\u0130K DOLGU & %100 SINAV \u0130SABET\u0130 (80/20 PARETO):
   - Giri\u015F/selamlama c\xFCmlesi veya kitabi \xF6zet yazma.
   - Do\u011Frudan \xD6SYM DUS komisyonunun sordu\u011Fu/soraca\u011F\u0131 "Alt\u0131n Standart", "\u0130lk Tercih", "Kontrendikasyon", "Say\u0131sal E\u015Fik (mm, %, sn, derece, M/F oran\u0131)", "Spesifik Gen/Translokasyon (\xF6rn. PTCH1, CRTC1-MAML2, MYB-NFIB)" ve "En S\u0131k / En Nadir" ayr\u0131mlar\u0131n\u0131 keskin maddelerle ver.

2. YAN YANA \xC7APRAZ KIYAS MATR\u0130S\u0130 (DISCRIMINATION LEARNING):
   - Birbiriyle kar\u0131\u015Fan kavramlar\u0131 mutlaka Markdown Tablosu (| Kriter | Kavram A | Kavram B | \xD6SYM Tuza\u011F\u0131 |) halinde k\u0131yasla.

3. EBBINGHAUS KOVA TR\u0130YAJI PROTOKOL\xDC:
   - Ye\u015Fil Kova (T+3 40 soruda \u226534 Do\u011Fru, \u2265%85): \u015Eema neokortekste sa\u011Flamd\u0131r, taburcu edilir.
   - Sar\u0131 Kova (T+3 40 soruda 28-33 Do\u011Fru, %70-%84): Sadece eriyen alt ba\u015Fl\u0131klara 15 dk nokta at\u0131\u015F\u0131 yama yap\u0131l\u0131r ve T+14 g\xFCn\xFCne 2. bankadan 20 soru do\u011Frulama atan\u0131r.
   - K\u0131rm\u0131z\u0131 Kova (T+3 40 soruda \u226427 Do\u011Fru, <%70): Hafta i\xE7i ak\u0131\u015F\u0131 bozulmaz; Cumartesi Kova Onar\u0131m Blo\u011Funda 25 dk Bo\u015F Ka\u011F\u0131t (Blurting) + 30 soru ile \u015Fema s\u0131f\u0131rdan in\u015Fa edilir.

4. SWSPS (SEMANTIC WEIGHTED SPACED PENALTY SCORE) HATA OTOPS\u0130S\u0130:
   - Yanl\u0131\u015F yap\u0131lan sorularda bili\u015Fsel hata k\xF6k nedenini te\u015Fhis et:
     * \xC7eldirici Tuza\u011F\u0131 (1.40x ceza)
     * Muhakeme Hatas\u0131 (1.25x ceza)
     * Bilgi Eksikli\u011Fi (1.00x ceza)
     * Soru K\xF6k\xFC / Dikkat (0.80x ceza)

5. ANK\u0130 FSRS & ATOM\u0130K CLOZE KART STANDARDI (01-KRITIK-OTOPSI-VE-TABLO):
   - Maksimum 1-2 c\xFCmlelik, tek sat\u0131rda kopyalanmaya haz\u0131r {{c1::...}} ve {{c2::...}} Cloze format\u0131 kullan ve "Haf\u0131za \xC7ivisi (Mnemonic)" ekle.

6. \xC7IKTI FORMATI:
   - Ba\u015Fl\u0131klar\u0131 net, taranabilir, klinik ve y\xFCksek yo\u011Funluklu (high-density) tut.`;
var TR_DAYS = [
  "Pazar",
  "Pazartesi",
  "Sal\u0131",
  "\xC7ar\u015Famba",
  "Per\u015Fembe",
  "Cuma",
  "Cumartesi"
];
function toTurkeyDateString(isoTimeStr) {
  const date = new Date(isoTimeStr);
  if (Number.isNaN(date.getTime())) {
    return isoTimeStr.slice(0, 10);
  }
  const trTimeMs = date.getTime() + 3 * 60 * 60 * 1e3;
  return new Date(trTimeMs).toISOString().split("T")[0];
}
function getTurkishDayName(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  return TR_DAYS[utcDate.getUTCDay()] || "";
}
function classifyFocusSegment(hours) {
  if (hours < 3) return "0-3 Saat";
  if (hours < 8) return "3-7 Saat";
  if (hours <= 10) return "8-10 Saat";
  return "10+ Saat";
}
function consolidateTickTickRecords(records) {
  const byDate = /* @__PURE__ */ new Map();
  for (const rec of records) {
    if (!rec || !rec.startTime || typeof rec.duration !== "number" || rec.duration <= 0) {
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
        notesSet: /* @__PURE__ */ new Set(),
        seenIds: /* @__PURE__ */ new Set()
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
  const result = [];
  for (const [date, data] of byDate.entries()) {
    const pomoMinutes = Math.round(data.pomoMs / 6e4);
    const stopwatchMinutes = Math.round(data.stopwatchMs / 6e4);
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
function createEmptyFocusDay(dateStr) {
  return {
    date: dateStr,
    dayNameTR: getTurkishDayName(dateStr),
    pomoCount: 0,
    pomoMinutes: 0,
    stopwatchCount: 0,
    stopwatchMinutes: 0,
    totalMinutes: 0,
    totalHours: 0,
    segment: "0-3 Saat",
    notes: [],
    sessionsCount: 0
  };
}
function buildTickTickFocusSummary(records, todayDateStr, requestedDateStr) {
  const dailyLogs = consolidateTickTickRecords(records);
  const segmentDistribution = {
    "0-3 Saat": 0,
    "3-7 Saat": 0,
    "8-10 Saat": 0,
    "10+ Saat": 0
  };
  let totalAllTimeMinutes = 0;
  for (const day of dailyLogs) {
    segmentDistribution[day.segment] += 1;
    totalAllTimeMinutes += day.totalMinutes;
  }
  const recentSeven = dailyLogs.slice(0, 7);
  const sevenDayTotalMinutes = recentSeven.reduce((acc, d) => acc + d.totalMinutes, 0);
  const sevenDayAvgHours = recentSeven.length > 0 ? Number((sevenDayTotalMinutes / 60 / recentSeven.length).toFixed(2)) : 0;
  let activeDate = requestedDateStr || todayDateStr;
  let activeDayStats = dailyLogs.find((d) => d.date === activeDate);
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
    lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
function buildDeepSeekPayload(input) {
  const subjectLabel = input.subjectCode ? `[${input.subjectCode}] ${input.subjectName || "DUS Dersi"}` : input.subjectName || "DUS Dersi";
  const unitLabel = input.topicCode ? `${input.topicCode} \u2014 ${input.unitTitle || "Genel Konu"}` : input.unitTitle || "Genel Konu";
  let userContent = "";
  switch (input.taskType) {
    case "TRIAGE_PATCH":
      userContent = [
        `### HEDEF \xDCN\u0130TE BA\u011ELAMI`,
        `- Ders Blo\u011Fu: ${subjectLabel}`,
        `- M\xFCfredat \xDCnitesi: ${unitLabel}`,
        input.bucket ? `- Mevcut Kova Stat\xFCs\xFC: ${input.bucket}` : "",
        input.scoreSummary ? `- Son Test Performans\u0131: ${input.scoreSummary}` : "",
        input.userNotes ? `- \xD6\u011Frencinin Kar\u0131\u015Ft\u0131rd\u0131\u011F\u0131 Nokta / Hata Notu: ${input.userNotes}` : "",
        "",
        `### \u0130STENEN \xC7IKTI (TR\u0130YAJ YAMASI & \xC7APRAZ KIYAS):`,
        `1. **\xC7apraz K\u0131yas Matrisi (Markdown Tablo)**: Bu \xFCnitede \xD6SYM'nin en \xE7ok birbirine \xE7eldirici yapt\u0131\u011F\u0131 en az 3 kavram \xE7iftini yan yana k\u0131yasla.`,
        `2. **5 Dakikal\u0131k Nokta At\u0131\u015F\u0131 Klinik/Akademik Yama**: Say\u0131sal e\u015Fikleri, alt\u0131n standartlar\u0131 ve istisnalar\u0131 maddeler halinde \xF6zetle.`,
        `3. **2 Adet Atomik Anki Cloze Kart\u0131**: Do\u011Frudan \`01-KRITIK-OTOPSI-VE-TABLO\` destesine eklenecek {{c1::...}} format\u0131nda kart yaz.`
      ].filter(Boolean).join("\n");
      break;
    case "SWSPS_ERROR_AUTOPSY":
      userContent = [
        `### SWSPS B\u0130L\u0130\u015ESEL CEZA & HATA OTOPS\u0130S\u0130 BA\u011ELAMI`,
        `- Ders Blo\u011Fu: ${subjectLabel}`,
        `- \u0130lgili \xDCnite: ${unitLabel}`,
        input.swspsContext ? `- Kay\u0131tl\u0131 SWSPS Hata Verisi:
${input.swspsContext}` : "",
        input.userNotes ? `- Yanl\u0131\u015F Yap\u0131lan Soru / D\xFC\u015F\xFClen \xC7eldirici: ${input.userNotes}` : "",
        "",
        `### \u0130STENEN \xC7IKTI (SWSPS DER\u0130N OTOPS\u0130 PROTOKOL\xDC):`,
        `1. **Bili\u015Fsel K\xF6k Neden Analizi**: Bu hatan\u0131n nedenini (\xC7eldirici Tuza\u011F\u0131 1.4x / Muhakeme 1.25x / Bilgi 1.0x / Dikkat 0.8x) ve bili\u015Fsel yan\u0131lsamay\u0131 a\xE7\u0131kla.`,
        `2. **Do\u011Fru \u015E\u0131k vs D\xFC\u015F\xFClen \xC7eldirici Ayr\u0131m Tablosu**: \u0130ki se\xE7ene\u011Fi birbirinden tek bak\u0131\u015Fta ay\u0131ran "Turnusol Ka\u011F\u0131d\u0131" bilgisini g\xF6ster.`,
        `3. **Antidot Anki Cloze & Haf\u0131za \xC7ivisi (Mnemonic)**: Ayn\u0131 hatay\u0131 bir daha yapmay\u0131 imkans\u0131z k\u0131lacak 3 adet {{c1::...}} Cloze kart\u0131 ve 1 adet fonolojik/abs\xFCrt haf\u0131za \xE7ivisi \xFCret.`
      ].filter(Boolean).join("\n");
      break;
    case "ANKI_CLOZE":
      userContent = [
        `### ANK\u0130 FSRS & M\u0130KRO-BELLEK BA\u011ELAMI`,
        `- Ders Blo\u011Fu: ${subjectLabel}`,
        `- M\xFCfredat \xDCnitesi: ${unitLabel}`,
        input.userNotes ? `- Odaklan\u0131lacak Alt Ba\u015Fl\u0131k / Hata: ${input.userNotes}` : "",
        "",
        `### \u0130STENEN \xC7IKTI (01-KRITIK-OTOPSI-VE-TABLO DESTES\u0130):`,
        `1. **6 Adet Y\xFCksek Se\xE7icilikli Atomik Anki Cloze Kart\u0131**: Her biri tek sat\u0131rl\u0131k, s\u0131navda do\u011Frudan soru \xE7\xF6zd\xFCren {{c1::...}} ve {{c2::...}} format\u0131nda kartlar.`,
        `2. **3 Adet Bili\u015Fsel Kanca / Haf\u0131za \xC7ivisi (Mnemonic)**: Bu \xFCnitenin en nank\xF6r s\u0131n\u0131flama veya say\u0131sal e\u015Fiklerini kal\u0131c\u0131 k\u0131lacak kodlamalar.`
      ].filter(Boolean).join("\n");
      break;
    case "UNIT_BLURTING":
      userContent = [
        `### T+0 BO\u015E KA\u011EIT (BLURTING) KAL\u0130BRASYON BA\u011ELAMI`,
        `- Ders Blo\u011Fu: ${subjectLabel}`,
        `- M\xFCfredat \xDCnitesi: ${unitLabel}`,
        input.userNotes ? `- Ek Not: ${input.userNotes}` : "",
        "",
        `### \u0130STENEN \xC7IKTI (T+0 BLURTING KONTROL L\u0130STES\u0130):`,
        `1. **Bo\u015F Ka\u011F\u0131tta Mutlaka Olmas\u0131 Gereken 7 Alt\u0131n DUS E\u015Fi\u011Fi**: \xD6\u011Frenci kitab\u0131 kapat\u0131p bo\u015F ka\u011F\u0131da \u015Fema \xE7izerken unutursa puan kaybedece\u011Fi kritik maddeler.`,
        `2. **Say\u0131sal Parametreler ve E\u015Fik De\u011Ferler Tablosu**: S\xFCre, doz, milimetre, y\xFCzde ve a\xE7\u0131 de\u011Ferleri.`,
        `3. **T+3 G\xFCn\xFC (40 Soruluk Test) \xD6ncesi 3 Kritik \xD6SYM Tuza\u011F\u0131**: Soru k\xF6klerinde dikkat edilmesi gereken tuzaklar.`
      ].filter(Boolean).join("\n");
      break;
    case "MOCK_EXAM_STRATEGY":
      userContent = [
        `### 16 BRAN\u015E DENEME ANAL\u0130Z\u0130 & AD\xC7C 108 NET STRATEJ\u0130 BA\u011ELAMI`,
        input.examContext ? input.examContext : `- Odak Ders: ${subjectLabel}`,
        input.swspsContext ? `- En Y\xFCksek SWSPS Ceza Puanl\u0131 Hatalar:
${input.swspsContext}` : "",
        input.userNotes ? `- \xD6\u011Frencinin Stratejik Notu / Hedefi: ${input.userNotes}` : "",
        "",
        `### \u0130STENEN \xC7IKTI (TAKT\u0130KSEL DENEME KO\xC7LU\u011EU):`,
        `1. **Net A\xE7\u0131\u011F\u0131 Te\u015Fhisi (108.0 Hedefine Kalan Fark Analizi)**: En h\u0131zl\u0131 net art\u0131\u015F\u0131 sa\u011Flayacak 3 kald\u0131ra\xE7 bran\u015F ve \xFCnite.`,
        `2. **SWSPS Ceza Puan\u0131 Y\xFCksek Konular \u0130\xE7in 7 G\xFCnl\xFCk Mikro-M\xFCdahale Plan\u0131**: Hangi g\xFCn hangi kova/hataya nas\u0131l m\xFCdahale edilmeli?`,
        `3. **Soru \xC7\xF6z\xFCm H\u0131z\u0131 (50-60 sn/soru) ve Turlama Tekni\u011Fi Kalibrasyonu**.`
      ].filter(Boolean).join("\n");
      break;
    case "CUSTOM":
    default:
      userContent = [
        input.unitTitle ? `Ba\u011Flam: ${subjectLabel} \u2014 ${unitLabel}` : "",
        input.examContext ? `Sistem Telemetrisi:
${input.examContext}` : "",
        input.customPrompt || input.userNotes || "DUS 2027 AD\xC7C TOP 10 hedefi i\xE7in kritik klinik/akademik analiz yap."
      ].filter(Boolean).join("\n\n");
      break;
  }
  const topP = typeof input.topP === "number" ? Math.max(0.1, Math.min(1, Number(input.topP.toFixed(2)))) : 0.95;
  const presencePenalty = typeof input.presencePenalty === "number" ? Math.max(-2, Math.min(2, Number(input.presencePenalty.toFixed(2)))) : 0;
  const frequencyPenalty = typeof input.frequencyPenalty === "number" ? Math.max(-2, Math.min(2, Number(input.frequencyPenalty.toFixed(2)))) : 0.1;
  const cachePreference = typeof input.cachePreference === "number" ? Math.max(1, Math.min(10, Math.round(input.cachePreference))) : 8;
  const systemPrompt = input.masterSystemPrompt && input.masterSystemPrompt.trim().length > 10 ? input.masterSystemPrompt.trim() : DEFAULT_DEEPSEEK_MASTER_PROMPT;
  return {
    model: DEPLOY_DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
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
function parseDeepSeekResponse(raw) {
  const choices = Array.isArray(raw?.choices) ? raw.choices : [];
  const firstChoice = choices[0] || {};
  const message = firstChoice.message || {};
  const rawContent = typeof message.content === "string" ? message.content.trim() : "";
  const rawReasoning = typeof message.reasoning_content === "string" && message.reasoning_content.trim() ? message.reasoning_content.trim() : null;
  const finishReason = typeof firstChoice.finish_reason === "string" ? firstChoice.finish_reason : void 0;
  const usageObj = raw?.usage || {};
  const promptDetails = usageObj.prompt_tokens_details || {};
  const completionDetails = usageObj.completion_tokens_details || {};
  return {
    id: typeof raw?.id === "string" ? raw.id : "deploy-completion",
    model: typeof raw?.model === "string" ? raw.model : DEPLOY_DEEPSEEK_MODEL,
    content: rawContent || (rawReasoning ? `[D\xFC\u015F\xFCnme \xD6zeti]:
${rawReasoning}` : ""),
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
function resolveEnvValue(rawVal, fallback) {
  if (!rawVal) return fallback;
  const trimmed = rawVal.trim();
  if (!trimmed || trimmed.startsWith("YOUR_") || trimmed.startsWith("MY_") || trimmed.startsWith("<") || trimmed === "undefined" || trimmed === "null") {
    return fallback;
  }
  return trimmed;
}
var activeAccessToken = resolveEnvValue(
  process.env.TICKTICK_ACCESS_TOKEN,
  "f91fae7a-ee3d-4452-bbd7-42a1c1cea335"
);
var activeRefreshToken = resolveEnvValue(process.env.TICKTICK_REFRESH_TOKEN, "");
var clientId = resolveEnvValue(process.env.TICKTICK_CLIENT_ID, "uA1j1GZtLknH5I89cI");
var clientSecret = resolveEnvValue(
  process.env.TICKTICK_CLIENT_SECRET,
  "gfZY577hM8TF2m6u72sKlITUaiKIBbdh"
);
var deployApiKey = resolveEnvValue(
  process.env.DEPLOY_API_KEY,
  "8p68e3DgJyuHUdhKnrfrAg=="
);
var deployBaseUrl = resolveEnvValue(
  process.env.DEPLOY_BASE_URL,
  DEPLOY_BASE_URL
).replace(/\/$/, "");
var deployModel = resolveEnvValue(process.env.DEPLOY_MODEL, DEPLOY_DEEPSEEK_MODEL);
var cachedRawRecords = null;
var lastCacheTimestamp = 0;
function getRedirectUri(req) {
  if (typeof req.query.redirectUri === "string" && req.query.redirectUri.startsWith("http")) {
    return req.query.redirectUri;
  }
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol;
  const appUrl = process.env.APP_URL && !process.env.APP_URL.startsWith("MY_") && !process.env.APP_URL.startsWith("YOUR_") ? process.env.APP_URL.replace(/\/$/, "") : `${protocol}://${req.get("host")}`;
  return `${appUrl}/auth/callback`;
}
function formatTickTickDateParam(date, isEndOfDay) {
  const trDateStr = toTurkeyDateString(date.toISOString());
  const timePart = isEndOfDay ? "23:59:59" : "00:00:00";
  return `${trDateStr}T${timePart}+0300`;
}
async function fetchFocusChunk(fromStr, toStr, type, token) {
  const url = `https://api.ticktick.com/open/v1/focus?from=${encodeURIComponent(
    fromStr
  )}&to=${encodeURIComponent(toStr)}&type=${type}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TickTick API HTTP ${response.status}: ${errText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
async function fetchAllTickTickFocusRecords(forceRefresh = false) {
  const nowMs = Date.now();
  if (!forceRefresh && cachedRawRecords && nowMs - lastCacheTimestamp < 6e4) {
    return cachedRawRecords;
  }
  const windows = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < 3; i++) {
    const end = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1e3);
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1e3);
    windows.push({
      from: formatTickTickDateParam(start, false),
      to: formatTickTickDateParam(end, true)
    });
  }
  const requests = [];
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
function createApiApp() {
  const app2 = express();
  app2.use(express.json());
  app2.get("/api/auth/ticktick/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "tasks:read tasks:write",
      state: "dus_ticktick_oauth",
      redirect_uri: redirectUri,
      response_type: "code"
    });
    const authUrl = `https://ticktick.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl, redirectUri });
  });
  const oauthCallbackHandler = async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const redirectUri = getRedirectUri(req);
    if (code) {
      try {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const bodyParams = new URLSearchParams({
          code,
          grant_type: "authorization_code",
          scope: "tasks:read tasks:write",
          redirect_uri: redirectUri
        });
        const tokenRes = await fetch("https://ticktick.com/oauth/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: bodyParams.toString()
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData.access_token) {
            activeAccessToken = tokenData.access_token;
            cachedRawRecords = null;
          }
          if (tokenData.refresh_token) {
            activeRefreshToken = tokenData.refresh_token;
          }
        }
      } catch (err) {
        console.warn("TickTick OAuth token exchange warning:", err);
      }
    }
    res.send(`
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>TickTick Ba\u011Flant\u0131s\u0131 Ba\u015Far\u0131l\u0131</title>
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
          <p>TickTick kimlik do\u011Frulamas\u0131 tamamland\u0131. Bu pencere otomatik olarak kapanacakt\u0131r.</p>
        </body>
      </html>
    `);
  };
  app2.get(["/auth/callback", "/auth/callback/"], oauthCallbackHandler);
  app2.get("/api/ticktick/focus", async (req, res) => {
    const requestedDate = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : void 0;
    const todayStr = toTurkeyDateString((/* @__PURE__ */ new Date()).toISOString());
    try {
      const forceRefresh = req.query.refresh === "1" || req.query.refresh === "true";
      const records = await fetchAllTickTickFocusRecords(forceRefresh);
      const summary = buildTickTickFocusSummary(records, todayStr, requestedDate);
      res.json({
        ...summary,
        hasRefreshToken: Boolean(activeRefreshToken)
      });
    } catch (error) {
      const fallbackSummary = buildTickTickFocusSummary(
        cachedRawRecords || [],
        todayStr,
        requestedDate
      );
      res.status(200).json({
        ...fallbackSummary,
        connected: Boolean(cachedRawRecords && cachedRawRecords.length > 0),
        hasRefreshToken: Boolean(activeRefreshToken),
        warning: error instanceof Error ? error.message : "TickTick verisi \xE7ekilemedi."
      });
    }
  });
  app2.get("/api/ai/status", (_req, res) => {
    res.json({
      configured: Boolean(deployApiKey),
      provider: "deploy.com",
      baseUrl: deployBaseUrl,
      model: deployModel
    });
  });
  app2.post("/api/ai/deepseek", async (req, res) => {
    try {
      const input = req.body || {};
      const payload = buildDeepSeekPayload(input);
      payload.model = deployModel;
      const apiRes = await fetch(`${deployBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deployApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!apiRes.ok) {
        const errText = await apiRes.text();
        throw new Error(`Deploy.com API HTTP ${apiRes.status}: ${errText}`);
      }
      const rawJson = await apiRes.json();
      const parsed = parseDeepSeekResponse(rawJson);
      res.json(parsed);
    } catch (error) {
      console.error("Deploy.com DeepSeek API Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "DeepSeek v4.1 Flash yan\u0131t\u0131 al\u0131namad\u0131."
      });
    }
  });
  let serverWorkspaceCache = null;
  app2.get("/api/workspace", (_req, res) => {
    res.json({
      ok: true,
      hasWorkspace: Boolean(serverWorkspaceCache),
      workspace: serverWorkspaceCache
    });
  });
  app2.post("/api/workspace", (req, res) => {
    if (req.body && typeof req.body === "object") {
      serverWorkspaceCache = {
        ...req.body,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    res.json({
      ok: true,
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  return app2;
}
var app = createApiApp();

// server.ts
dotenv2.config({ override: true });
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = 3e3;
async function startServer() {
  const app2 = createApiApp();
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app2.use(express2.static(distPath));
    app2.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`DUS 2027, TickTick & DeepSeek v4.1 Server running on http://localhost:${PORT}`);
  });
}
startServer();
