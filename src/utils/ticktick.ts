/**
 * TickTick Odak (Pomodoro & Süre Ölçer) Veri Konsolidasyonu ve 4 Kademeli Segment Motoru
 * Doktrin: ExcelMaster TickTick_Pomodoro Sayfası & UTC+3 (Europe/Istanbul) Standardı
 */

export type FocusSegment = '0-3 Saat' | '3-7 Saat' | '8-10 Saat' | '10+ Saat';

export interface RawTickTickFocusRecord {
  id: string;
  type: 0 | 1; // 0 = Pomodoro, 1 = Süre Ölçer (Stopwatch)
  startTime: string;
  endTime: string;
  duration: number; // Milisaniye cinsinden net odak süresi
  pauseDuration?: number;
  note?: string;
  tasks?: {
    title?: string;
    projectName?: string;
    tags?: string[];
  }[];
}

export interface ConsolidatedFocusDay {
  date: string;             // YYYY-MM-DD (UTC+3 Türkiye Saati)
  dayNameTR: string;        // Pazartesi, Salı, ...
  pomoCount: number;        // Pomodoro oturum sayısı
  pomoMinutes: number;      // Pomodoro dakika toplamı (type=0)
  stopwatchCount: number;   // Süre Ölçer oturum sayısı
  stopwatchMinutes: number; // Süre Ölçer dakika toplamı (type=1)
  totalMinutes: number;     // Dakika (D+E)
  totalHours: number;       // Saat (F/60, 2 ondalık)
  segment: FocusSegment;    // 0-3 Saat | 3-7 Saat | 8-10 Saat | 10+ Saat
  notes: string[];          // Oturum notları ve görev başlıkları
  sessionsCount: number;
}

export interface TickTickFocusSummary {
  connected: boolean;
  lastSyncedAt: string;
  todayDate: string;
  activeDate: string;
  activeDayStats: ConsolidatedFocusDay;
  sevenDayAvgHours: number;
  sevenDayTotalMinutes: number;
  totalTrackedDays: number;
  totalAllTimeHours: number;
  segmentDistribution: Record<FocusSegment, number>;
  dailyLogs: ConsolidatedFocusDay[];
}

const TR_DAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi'
];

/**
 * ISO zaman damgasını UTC+3 (Türkiye Saati) YYYY-MM-DD formatına çevirir
 */
export function toTurkeyDateString(isoTimeStr: string): string {
  const date = new Date(isoTimeStr);
  if (Number.isNaN(date.getTime())) {
    return isoTimeStr.slice(0, 10);
  }
  const trTimeMs = date.getTime() + 3 * 60 * 60 * 1000;
  return new Date(trTimeMs).toISOString().split('T')[0];
}

/**
 * YYYY-MM-DD tarihinin Türkçe gün adını döndürür
 */
export function getTurkishDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  return TR_DAYS[utcDate.getUTCDay()] || '';
}

/**
 * Saat değerine göre README.md'deki 4 Kademeli Performans Segmentini belirler:
 * =IF(G<3; "0-3 Saat"; IF(G<8; "3-7 Saat"; IF(G<=10; "8-10 Saat"; "10+ Saat")))
 */
export function classifyFocusSegment(hours: number): FocusSegment {
  if (hours < 3) return '0-3 Saat';
  if (hours < 8) return '3-7 Saat';
  if (hours <= 10) return '8-10 Saat';
  return '10+ Saat';
}

/**
 * Ham TickTick Pomodoro (type=0) ve Süre Ölçer (type=1) kayıtlarını
 * UTC+3 gün bazında birleştirir ve sıralar (en yeniden en eskiye).
 */
export function consolidateTickTickRecords(
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

/**
 * Boş bir gün için varsayılan odak kaydı üretir
 */
export function createEmptyFocusDay(dateStr: string): ConsolidatedFocusDay {
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

/**
 * Konsolide günlük kayıtlardan özet KPI ve 4-Kademeli Segment Dağılımı oluşturur
 */
export function buildTickTickFocusSummary(
  records: RawTickTickFocusRecord[],
  todayDateStr: string,
  requestedDateStr?: string
): TickTickFocusSummary {
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

  // Son 7 aktif çalışma gününün ortalaması (veya son 7 kayıt)
  const recentSeven = dailyLogs.slice(0, 7);
  const sevenDayTotalMinutes = recentSeven.reduce((acc, d) => acc + d.totalMinutes, 0);
  const sevenDayAvgHours =
    recentSeven.length > 0
      ? Number((sevenDayTotalMinutes / 60 / recentSeven.length).toFixed(2))
      : 0;

  // Seçili tarih varsa onu bul, yoksa bugünü, bugün boşsa en son aktif günü seç
  let activeDate = requestedDateStr || todayDateStr;
  let activeDayStats = dailyLogs.find(d => d.date === activeDate);

  if (!activeDayStats) {
    if (!requestedDateStr && dailyLogs.length > 0) {
      // Kullanıcı özel bir tarih seçmediyse ve bugün henüz kayıt yoksa en son aktif günü göster
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

/**
 * Ortam değişkenlerindeki YOUR_* veya MY_* gibi yer tutucu (placeholder) değerleri filtreler
 */
export function resolveEnvValue(rawVal: string | undefined, fallback: string): string {
  if (!rawVal) return fallback;
  const trimmed = rawVal.trim();
  if (
    !trimmed ||
    trimmed.startsWith('YOUR_') ||
    trimmed.startsWith('MY_') ||
    trimmed.startsWith('<') ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return fallback;
  }
  return trimmed;
}

/**
 * API yanıt metnini güvenli biçimde ayrıştırır; HTML (<!doctype ...) döndüğünde SyntaxError fırlatmaz
 */
export function safeParseJsonResponse<T>(rawText: string): { ok: true; data: T } | { ok: false; isHtml: boolean; error: string } {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return { ok: false, isHtml: false, error: 'Boş sunucu yanıtı alındı.' };
  }
  if (trimmed.startsWith('<') || /^<!doctype/i.test(trimmed)) {
    return {
      ok: false,
      isHtml: true,
      error: 'API rotası yerine HTML yanıtı döndü.'
    };
  }
  try {
    const parsed = JSON.parse(trimmed) as T;
    return { ok: true, data: parsed };
  } catch {
    return {
      ok: false,
      isHtml: false,
      error: 'Geçersiz JSON yanıtı alındı.'
    };
  }
}

