/**
 * Günlük Hedef Yönetimi, Canlı TickTick Pomodoro/Süre Ölçer Entegrasyonu ve 4 Katmanlı Bilişsel SOP Kokpiti
 * Doktrin: DUS 2027 4 Blok SOP Şablonu (PDF Madde 8.2) & ExcelMaster TickTick_Pomodoro Konsolidasyonu
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDUS } from '../context/DUSContext';
import { TopicUnit } from '../types/dus';
import {
  TickTickFocusSummary,
  FocusSegment,
  ConsolidatedFocusDay,
  buildTickTickFocusSummary,
  safeParseJsonResponse
} from '../utils/ticktick';
import { TriageModal } from './TriageModal';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Target,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Link2,
  Timer,
  Flame,
  Calendar,
  BarChart2,
  Award,
  TrendingUp,
  Info,
  Check
} from 'lucide-react';

function getSegmentBadgeClasses(segment: FocusSegment): string {
  switch (segment) {
    case '10+ Saat':
      return 'bg-slate-900 text-amber-400 border-amber-500 font-extrabold shadow-xs';
    case '8-10 Saat':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    case '3-7 Saat':
      return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    case '0-3 Saat':
    default:
      return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  }
}

export const DailyPlannerView: React.FC = () => {
  const {
    dailyGoal,
    updateDailyGoal,
    toggleBlockDone,
    addGoalChecklistItem,
    toggleGoalChecklistItem,
    deleteGoalChecklistItem,
    topics,
    subjects,
    report,
    todayStr,
    mockExams,
    semanticErrors,
    toggleSemanticErrorAnkiStatus,
    clearTopicScheduledTask,
    ankiSnapshot,
    systemParams
  } = useDUS();

  const [newChecklistText, setNewChecklistText] = useState('');
  const [activeModalTopic, setActiveModalTopic] = useState<TopicUnit | null>(null);
  const [showExecutiveCharts, setShowExecutiveCharts] = useState<boolean>(true);
  const [showSwspsTooltip, setShowSwspsTooltip] = useState<boolean>(false);

  // TickTick Focus & Pomodoro State
  const [ticktickSummary, setTicktickSummary] = useState<TickTickFocusSummary | null>(() => {
    try {
      const cached = localStorage.getItem('dus_ticktick_focus_cache_v1');
      if (cached) {
        const parsed = safeParseJsonResponse<TickTickFocusSummary>(cached);
        if (parsed.ok && parsed.data && Array.isArray(parsed.data.dailyLogs)) {
          return parsed.data;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [selectedTickTickDate, setSelectedTickTickDate] = useState<string>('');
  const [isSyncingTickTick, setIsSyncingTickTick] = useState<boolean>(false);
  const [ticktickError, setTicktickError] = useState<string | null>(null);
  const [showTickTickHistory, setShowTickTickHistory] = useState<boolean>(false);

  const fetchTickTickFocus = useCallback(
    async (dateParam?: string, forceRefresh = false) => {
      setIsSyncingTickTick(true);
      setTicktickError(null);
      try {
        const params = new URLSearchParams();
        if (dateParam) params.set('date', dateParam);
        if (forceRefresh) params.set('refresh', '1');

        const res = await fetch(`/api/ticktick/focus?${params.toString()}`, {
          headers: { Accept: 'application/json' }
        });
        const rawText = await res.text();
        const parsed = safeParseJsonResponse<TickTickFocusSummary & { error?: string; warning?: string }>(rawText);

        if (!parsed.ok) {
          // Eğer statik önbellek veya HTML fallback döndüyse yerel önbellek/varsayılan özeti kullan
          setTicktickSummary(prev => prev ?? buildTickTickFocusSummary([], todayStr, dateParam));
          return;
        }

        if (!res.ok || parsed.data.error) {
          throw new Error(parsed.data.error || `TickTick bağlantı hatası (${res.status})`);
        }

        const data: TickTickFocusSummary = parsed.data;
        setTicktickSummary(data);
        setSelectedTickTickDate(data.activeDate);

        if (data.connected && data.dailyLogs.length > 0) {
          try {
            localStorage.setItem('dus_ticktick_focus_cache_v1', JSON.stringify(data));
          } catch {
            // ignore
          }
        }

        if (data.activeDayStats && data.connected) {
          updateDailyGoal({
            completedStudyMinutes: data.activeDayStats.totalMinutes
          });
        }
      } catch (err) {
        setTicktickError(
          err instanceof Error ? err.message : 'TickTick odak verileri çekilemedi.'
        );
      } finally {
        setIsSyncingTickTick(false);
      }
    },
    [todayStr, updateDailyGoal]
  );

  useEffect(() => {
    fetchTickTickFocus();
  }, [fetchTickTickFocus]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchTickTickFocus(selectedTickTickDate || undefined, true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchTickTickFocus, selectedTickTickDate]);

  const handleConnectTickTickOAuth = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(
        `/api/auth/ticktick/url?redirectUri=${encodeURIComponent(redirectUri)}`,
        { headers: { Accept: 'application/json' } }
      );
      const rawText = await res.text();
      const parsed = safeParseJsonResponse<{ url?: string }>(rawText);
      if (!res.ok || !parsed.ok || !parsed.data.url) {
        throw new Error('OAuth URL alınamadı');
      }
      window.open(parsed.data.url, 'ticktick_oauth_popup', 'width=600,height=720');
    } catch (err) {
      setTicktickError(
        err instanceof Error ? err.message : 'TickTick OAuth penceresi açılamadı.'
      );
    }
  };

  const handleSelectTickTickDay = (day: ConsolidatedFocusDay) => {
    setSelectedTickTickDate(day.date);
    if (ticktickSummary) {
      setTicktickSummary({
        ...ticktickSummary,
        activeDate: day.date,
        activeDayStats: day
      });
    }
    updateDailyGoal({
      completedStudyMinutes: day.totalMinutes
    });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistText.trim()) {
      addGoalChecklistItem(newChecklistText);
      setNewChecklistText('');
    }
  };

  const dueTopics = topics.filter(t => {
    if (t.discharged) return false;
    if (t.status === 'T0_DONE' && t.t3DueDate && t.t3DueDate <= todayStr) return true;
    if (t.currentBucket === 'YELLOW' && t.t14DueDate && t.t14DueDate <= todayStr) return true;
    if (t.currentBucket === 'RED' && t.saturdayRepairDate && t.saturdayRepairDate <= todayStr) return true;
    return false;
  });

  const studyPercent = dailyGoal.targetStudyMinutes > 0
    ? Math.min(100, Math.round((dailyGoal.completedStudyMinutes / dailyGoal.targetStudyMinutes) * 100))
    : 0;

  const questionPercent = dailyGoal.targetQuestions > 0
    ? Math.min(100, Math.round((dailyGoal.completedQuestions / dailyGoal.targetQuestions) * 100))
    : 0;

  const completedBlocksCount = [
    dailyGoal.block1Done,
    dailyGoal.block2Done,
    dailyGoal.block3Done,
    dailyGoal.block4Done
  ].filter(Boolean).length;

  const activeStats = ticktickSummary?.activeDayStats;
  const activeHours = activeStats
    ? activeStats.totalHours
    : Number((dailyGoal.completedStudyMinutes / 60).toFixed(2));
  const activeSegment: FocusSegment = activeStats
    ? activeStats.segment
    : activeHours < 3
    ? '0-3 Saat'
    : activeHours < 8
    ? '3-7 Saat'
    : activeHours <= 10
    ? '8-10 Saat'
    : '10+ Saat';

  const latestExam = mockExams[mockExams.length - 1] || null;
  const elite10PlusDays = ticktickSummary?.segmentDistribution['10+ Saat'] ?? 0;

  return (
    <div className="space-y-6">
      {/* 0. SEKME 1: DASHBOARD (KOMUTA MERKEZİ) 2 KANATLI 6 KPI GRİD & GRAFİKLER */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="font-semibold text-indigo-700">{systemParams.ownerName}</span>
              <span aria-hidden="true">·</span>
              <span>{systemParams.ownerRole}</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {systemParams.targetGoalTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowExecutiveCharts(prev => !prev)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showExecutiveCharts ? 'Komuta Grafiklerini Daralt' : 'Komuta Grafiklerini Göster'}</span>
          </button>
        </div>

        {/* 6 Simetrik KPI Kartı (B5, D5, F5, I5, K5, M5) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase">B5 · HEDEF TOPLAM NET</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 tabular-nums">
              {systemParams.targetTotalNet.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5 font-mono">
              T:{systemParams.targetBasicNet} + K:{systemParams.targetClinicalNet}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-500 uppercase">D5 · SON DENEME / FARK</div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1 tabular-nums">
              {latestExam ? latestExam.totalNet.toFixed(2) : '0.00'}
            </div>
            <div
              className={`text-[10px] font-mono font-bold mt-0.5 ${
                latestExam && latestExam.targetDiff >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {latestExam ? `${latestExam.targetDiff >= 0 ? '+' : ''}${latestExam.targetDiff.toFixed(2)} Net` : '-'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-500 uppercase">F5 · TOPLAM ÇALIŞMA</div>
            <div className="text-2xl font-extrabold font-mono text-indigo-700 mt-1 tabular-nums">
              {ticktickSummary ? ticktickSummary.totalAllTimeHours : '42.5'}s
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {ticktickSummary ? `${ticktickSummary.totalTrackedDays} Aktif Gün` : 'Kümülatif Saat'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-500 uppercase">I5 · SON 7 GÜN ORT.</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 tabular-nums">
              {ticktickSummary ? ticktickSummary.sevenDayAvgHours : '6.4'}s
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Günlük Ortalama</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] font-mono text-emerald-800 uppercase">K5 · ANKİ RETENTION</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-800 mt-1 tabular-nums">
              %{ankiSnapshot.overallRetentionPercent}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-semibold">
              Hedef: %{systemParams.targetFsrsRetention}
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] font-mono text-amber-900 uppercase">M5 · 10+ SAAT ELİT GÜN</div>
            <div className="text-2xl font-extrabold font-mono text-amber-900 mt-1 tabular-nums flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-600" />
              <span>{elite10PlusDays}</span>
            </div>
            <div className="text-[10px] text-amber-800 mt-0.5 font-semibold">Zirve Disiplin Günü</div>
          </div>
        </div>

        {/* Açılır Komuta Merkezi Grafikleri: Son 14 Gün Odak Sütun Grafiği + SWSPS Taktiksel Triyaj Özeti */}
        {showExecutiveCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 items-stretch">
            {/* Sol 7 Kolon: Son 14 Günlük Odaklanma ve Çalışma Süresi Sütun Grafiği */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Son 14 Günlük Odaklanma &amp; Çalışma Süresi (Saat)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Günlük sütuna tıklayarak o günün Pomodoro ve süre ölçer detaylarını inceleyebilirsiniz.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                  TickTick Pomo + Süre Ölçer
                </span>
              </div>

              <div className="h-44 flex items-end gap-1.5 pt-6 pb-1">
                {(ticktickSummary?.dailyLogs.slice(0, 14).reverse() || []).map(day => {
                  const pct = Math.min(100, Math.max(8, (day.totalHours / 12) * 100));
                  const barColor =
                    day.segment === '10+ Saat'
                      ? 'bg-slate-900'
                      : day.segment === '8-10 Saat'
                      ? 'bg-emerald-600'
                      : day.segment === '3-7 Saat'
                      ? 'bg-indigo-600'
                      : 'bg-amber-500';
                  return (
                    <div
                      key={day.date}
                      onClick={() => handleSelectTickTickDay(day)}
                      className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
                      title={`${day.date}: ${day.totalHours} Saat (${day.segment})`}
                    >
                      <span className="text-[9px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 tabular-nums">
                        {day.totalHours}s
                      </span>
                      <div className="w-full h-32 bg-slate-200/70 rounded-t flex items-end overflow-hidden">
                        <div
                          className={`w-full ${barColor} rounded-t transition-all`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 tabular-nums">
                        {day.date.slice(8)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                <span>Renk Kodları:</span>
                <div className="flex items-center gap-3 font-medium">
                  <span className="text-slate-900">■ 10+ Saat (Elit)</span>
                  <span className="text-emerald-700">■ 8-10 Saat</span>
                  <span className="text-indigo-700">■ 3-7 Saat</span>
                  <span className="text-amber-600">■ 0-3 Saat</span>
                </div>
              </div>
            </div>

            {/* Sağ 5 Kolon: Taktiksel SWSPS v2.0 & Acil Hata Onarım Öncelikleri */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between relative">
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900">
                      Taktiksel SWSPS v2.0 — Acil Hata Onarım Öncelikleri
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kova durumu, branş soru ağırlığı ve Anki korumasına göre canlı sıralanan ilk 3 açık
                  </p>
                </div>

                {/* Sağ Üst Köşe Info Simgesi & Hover Bilgilendirme */}
                <div
                  className="relative shrink-0"
                  onMouseEnter={() => setShowSwspsTooltip(true)}
                  onMouseLeave={() => setShowSwspsTooltip(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowSwspsTooltip(prev => !prev)}
                    onFocus={() => setShowSwspsTooltip(true)}
                    onBlur={() => setShowSwspsTooltip(false)}
                    aria-label="SWSPS Nedir? Bilgilendirme"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 transition-colors text-[11px] font-medium"
                  >
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>SWSPS v2.0</span>
                  </button>

                  {showSwspsTooltip && (
                    <div
                      role="tooltip"
                      className="absolute right-0 top-9 w-80 sm:w-[420px] p-3.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 z-30 text-xs space-y-2 leading-relaxed"
                    >
                      <div className="font-bold text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span>SWSPS v2.0 — Dinamik Klinik Öncelik Motoru</span>
                        <span className="font-mono text-[10px] text-slate-400">7 Çarpanlı Formül</span>
                      </div>
                      <p className="text-[11px] text-slate-200">
                        Deneme ve soru bankası yanlışlarınızı; <strong>hata kök nedeni</strong>, <strong>ünitenin Kova statüsü</strong>, <strong>DUS branş soru sayısı</strong> ve <strong>Anki Cloze müdahalesi</strong> ile canlı çarparak önceliklendirir.
                      </p>
                      <div className="bg-slate-800/90 rounded-lg p-2.5 font-mono text-[10px] text-slate-300 space-y-1">
                        <div className="text-amber-300 font-semibold">
                          SWSPS v2 = Temel × K_Kova × B_Branş × M_Onarım
                        </div>
                        <div>• Hata Tipi: Çeldirici (1.40x) | Muhakeme (1.25x) | Bilgi (1.00x) | Dikkat (0.80x)</div>
                        <div>• Kova Çarpanı: Kırmızı (1.35x) | Sarı (1.15x) | Yeşil (0.85x)</div>
                        <div>• Branş Kaldıracı: 10 Soru Klinik (1.15x) | 6 Soru (1.00x) | 4 Soru (0.90x)</div>
                        <div>• Anki Sönümlemesi: Bekliyor (1.00x) | Anki&apos;de (0.60x · -%40) | Taburcu+Anki (0.35x)</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-0.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                          🔴 ≥10.0: Kritik Blokaj
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                          🟠 6.5–9.9: Yüksek Risk
                        </span>
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-200 font-semibold">
                          🟡 3.5–6.4: Orta Risk
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          🟢 &lt;3.5: Kontrol Altında
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Kademeli Klinik Aciliyet Dağılım Şeridi */}
              <div className="grid grid-cols-4 gap-1.5 my-2 text-[10px] font-mono">
                <div className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
                  <span className="font-semibold">Kritik (≥10)</span>
                  <span className="font-extrabold">
                    {semanticErrors.filter(e => e.swspsScore >= 10).length}
                  </span>
                </div>
                <div className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
                  <span className="font-semibold">Yüksek (6.5+)</span>
                  <span className="font-extrabold">
                    {semanticErrors.filter(e => e.swspsScore >= 6.5 && e.swspsScore < 10).length}
                  </span>
                </div>
                <div className="px-2 py-1 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-center justify-between">
                  <span className="font-semibold">Orta (3.5+)</span>
                  <span className="font-extrabold">
                    {semanticErrors.filter(e => e.swspsScore >= 3.5 && e.swspsScore < 6.5).length}
                  </span>
                </div>
                <div className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
                  <span className="font-semibold">Kontrol (&lt;3.5)</span>
                  <span className="font-extrabold">
                    {semanticErrors.filter(e => e.swspsScore < 3.5).length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-2">
                {[...semanticErrors]
                  .sort((a, b) => b.swspsScore - a.swspsScore)
                  .slice(0, 3)
                  .map((err, idx) => {
                    const bd = err.breakdown;
                    const tier = bd?.tier || (err.swspsScore >= 10 ? 'KRITIK_BLOKAJ' : err.swspsScore >= 6.5 ? 'YUKSEK_RISK' : err.swspsScore >= 3.5 ? 'ORTA_RISK' : 'KONTROL_ALTINDA');
                    const severityLabel = bd?.tierLabel || 'Yüksek Risk';
                    const severityColor =
                      tier === 'KRITIK_BLOKAJ'
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : tier === 'YUKSEK_RISK'
                        ? 'text-amber-800 bg-amber-50 border-amber-200'
                        : tier === 'ORTA_RISK'
                        ? 'text-yellow-800 bg-yellow-50 border-yellow-300'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200';

                    const bucketBadge =
                      bd?.matchedBucket === 'RED'
                        ? { text: 'Kırmızı Kova (1.35x)', cls: 'bg-rose-100 text-rose-800 border-rose-200' }
                        : bd?.matchedBucket === 'YELLOW'
                        ? { text: 'Sarı Kova (1.15x)', cls: 'bg-amber-100 text-amber-800 border-amber-200' }
                        : bd?.matchedBucket === 'GREEN'
                        ? { text: 'Yeşil Kova (0.85x)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
                        : { text: 'Standart (1.00x)', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

                    const matchedTopicObj = bd?.matchedTopicId
                      ? topics.find(t => t.id === bd.matchedTopicId) || null
                      : null;

                    return (
                      <div
                        key={err.id}
                        className="p-2.5 rounded-lg bg-white border border-slate-200/90 hover:border-slate-300 transition-colors space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="font-mono font-bold text-slate-900">#{idx + 1}</span>
                              <span className="font-semibold text-indigo-700">
                                [{err.branchCode}] {err.branchName}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded border font-mono font-semibold ${bucketBadge.cls}`}>
                                {bucketBadge.text}
                              </span>
                              {bd && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                                  {bd.branchQuestionCount}S ({bd.branchMultiplier.toFixed(2)}x)
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                              {err.subtopic}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[11px] font-bold tabular-nums ${severityColor}`}
                            >
                              <span>{err.swspsScore.toFixed(2)} Puan</span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                              {severityLabel}
                            </div>
                          </div>
                        </div>

                        {/* Çarpan Röntgeni (Score Breakdown) */}
                        {bd && (
                          <div className="px-2 py-1 rounded bg-slate-50 border border-slate-200/80 font-mono text-[10px] text-slate-600 truncate" title={bd.formulaSummary}>
                            <span className="font-bold text-slate-800">Çarpan Röntgeni: </span>
                            {bd.formulaSummary}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <p
                            className="text-slate-600 truncate"
                            title={bd?.recommendedAction || err.distractorAnalysis}
                          >
                            <span className="font-semibold text-slate-800">Eylem: </span>
                            {bd?.recommendedAction || err.distractorAnalysis}
                          </p>

                          <div className="flex items-center gap-1 shrink-0">
                            {matchedTopicObj && (
                              <button
                                type="button"
                                onClick={() => setActiveModalTopic(matchedTopicObj)}
                                className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-semibold transition-colors"
                                title={`İlgili üniteyi (${matchedTopicObj.title}) test et / onar`}
                              >
                                Onar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleSemanticErrorAnkiStatus(err.id)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-colors ${
                                err.ankiClozeStatus === 'Eklendi'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                              title="Anki Cloze durumunu değiştir (Anki'ye eklendiğinde SWSPS cezası %40 düşer)"
                            >
                              {err.ankiClozeStatus === 'Eklendi' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Anki&apos;de (0.60x)</span>
                                </>
                              ) : (
                                <span>Anki&apos;ye Al (-%40)</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                <span>Toplam Kayıtlı Hata Otopsisi: {semanticErrors.length}</span>
                <span className="font-mono text-slate-700 font-semibold">
                  Anki Korumasında: {semanticErrors.filter(e => e.ankiClozeStatus === 'Eklendi').length}/{semanticErrors.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Üst Yönetici Özeti, Canlı TickTick Pomodoro/Süre Ölçer Entegrasyonu ve Hedef İlerlemesi */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{todayStr}</span>
              <span aria-hidden="true">·</span>
              <span>Bilişsel Çalışma Kokpiti</span>
              {ticktickSummary?.connected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 normal-case font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  TickTick API Aktif ({ticktickSummary.totalTrackedDays} Gün / {ticktickSummary.totalAllTimeHours} Saat)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Günün Hedefleri, TickTick Odak İstatistikleri ve 4 Blok İlerleme
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTickTickFocus(selectedTickTickDate || undefined, true)}
              disabled={isSyncingTickTick}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTickTick ? 'animate-spin' : ''}`} />
              <span>{isSyncingTickTick ? 'Çekiliyor...' : 'TickTick Senkronize Et'}</span>
            </button>

            <button
              type="button"
              onClick={handleConnectTickTickOAuth}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="TickTick OAuth 2.0 ile Yeniden Yetkilendir"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>TickTick Bağlantısı</span>
            </button>

            <div className="flex items-center gap-1.5 pl-1">
              <span className="text-xs text-slate-600 font-medium">Bloklar:</span>
              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                {completedBlocksCount} / 4 Blok
              </span>
            </div>
          </div>
        </div>

        {ticktickError && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{ticktickError}</span>
            <button
              type="button"
              onClick={() => fetchTickTickFocus(undefined, true)}
              className="font-semibold underline hover:text-rose-950"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* 2 Sütunlu Hedef Kartları */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* SOL KART: Canlı TickTick Odak Süresi (Pomodoro + Süre Ölçer) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Günlük Odak Süresi (TickTick Pomo + Süre Ölçer)</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded border text-[11px] font-mono ${getSegmentBadgeClasses(
                    activeSegment
                  )}`}
                  title="README 4 Kademeli Performans Segmenti"
                >
                  {activeSegment}
                </span>
                <div className="text-xs font-mono font-bold text-slate-900">
                  {dailyGoal.completedStudyMinutes} / {dailyGoal.targetStudyMinutes} dk (%{studyPercent})
                </div>
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${studyPercent}%` }}
              />
            </div>

            {/* TickTick Kırılım Metrikleri (Pomodoro vs Süre Ölçer & 7 Gün Ortalaması) */}
            {ticktickSummary && activeStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-500" />
                    <span>Pomodoro (type=0)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                    {activeStats.pomoMinutes} dk
                    <span className="text-[10px] font-normal text-slate-500 ml-1">
                      ({activeStats.pomoCount} otr)
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Timer className="w-3 h-3 text-indigo-500" />
                    <span>Süre Ölçer (type=1)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                    {activeStats.stopwatchMinutes} dk
                    <span className="text-[10px] font-normal text-slate-500 ml-1">
                      ({activeStats.stopwatchCount} otr)
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Toplam Saat (UTC+3)
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700 mt-0.5">
                    {activeStats.totalHours} Saat
                    <span className="text-[10px] font-normal text-slate-500 ml-1">
                      ({activeStats.dayNameTR})
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Son 7 Gün Ort.
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                    {ticktickSummary.sevenDayAvgHours} Saat/gün
                  </div>
                </div>
              </div>
            )}

            {/* Tarih Seçici & Manuel Hızlı Ayar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                {ticktickSummary && ticktickSummary.dailyLogs.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      aria-label="TickTick Çalışma Günü Seç"
                      value={selectedTickTickDate}
                      onChange={e => {
                        const found = ticktickSummary.dailyLogs.find(
                          d => d.date === e.target.value
                        );
                        if (found) {
                          handleSelectTickTickDay(found);
                        } else {
                          fetchTickTickFocus(e.target.value, false);
                        }
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800"
                    >
                      {ticktickSummary.dailyLogs.slice(0, 30).map(day => (
                        <option key={day.date} value={day.date}>
                          {day.date} ({day.dayNameTR}) — {day.totalMinutes} dk ({day.totalHours}s)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowTickTickHistory(prev => !prev)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-1"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{showTickTickHistory ? 'Tabloyu Gizle' : 'Segment & Geçmiş'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateDailyGoal({
                      completedStudyMinutes: Math.max(0, dailyGoal.completedStudyMinutes - 30)
                    })
                  }
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-mono"
                >
                  -30dk
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDailyGoal({
                      completedStudyMinutes: dailyGoal.completedStudyMinutes + 30
                    })
                  }
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-mono"
                >
                  +30dk
                </button>
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-slate-500">Hedef:</span>
                  <input
                    type="number"
                    step="30"
                    min="60"
                    max="900"
                    aria-label="Günlük Hedef Çalışma Dakikası"
                    value={dailyGoal.targetStudyMinutes}
                    onChange={e =>
                      updateDailyGoal({ targetStudyMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs text-right font-mono"
                  />
                  <span className="text-slate-500">dk</span>
                </div>
              </div>
            </div>

            {/* Açılır TickTick Segment Dağılımı (K2:K5) ve Son Çalışma Günleri Tablosu */}
            {showTickTickHistory && ticktickSummary && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between">
                    <span className="font-semibold">🔴 0-3 Saat:</span>
                    <span className="font-mono font-bold">
                      {ticktickSummary.segmentDistribution['0-3 Saat']} gün
                    </span>
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                    <span className="font-semibold">🟡 3-7 Saat:</span>
                    <span className="font-mono font-bold">
                      {ticktickSummary.segmentDistribution['3-7 Saat']} gün
                    </span>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold">🟢 8-10 Saat:</span>
                    <span className="font-mono font-bold">
                      {ticktickSummary.segmentDistribution['8-10 Saat']} gün
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-amber-500 text-amber-400 flex items-center justify-between">
                    <span className="font-semibold">🏆 10+ Saat:</span>
                    <span className="font-mono font-bold">
                      {ticktickSummary.segmentDistribution['10+ Saat']} gün
                    </span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-2.5">Tarih</th>
                        <th className="py-1.5 px-2">Gün</th>
                        <th className="py-1.5 px-2 text-right">Pomo</th>
                        <th className="py-1.5 px-2 text-right">Süre Ölçer</th>
                        <th className="py-1.5 px-2 text-right">Toplam</th>
                        <th className="py-1.5 px-2.5 text-right">Segment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {ticktickSummary.dailyLogs.slice(0, 14).map(log => (
                        <tr
                          key={log.date}
                          onClick={() => handleSelectTickTickDay(log)}
                          className={`cursor-pointer hover:bg-indigo-50/60 ${
                            selectedTickTickDate === log.date ? 'bg-indigo-50/90 font-semibold' : ''
                          }`}
                        >
                          <td className="py-1.5 px-2.5 text-slate-900">{log.date}</td>
                          <td className="py-1.5 px-2 font-sans text-slate-600">{log.dayNameTR}</td>
                          <td className="py-1.5 px-2 text-right text-slate-700">
                            {log.pomoMinutes} dk
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-700">
                            {log.stopwatchMinutes} dk
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                            {log.totalMinutes} dk ({log.totalHours}s)
                          </td>
                          <td className="py-1.5 px-2.5 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${getSegmentBadgeClasses(
                                log.segment
                              )}`}
                            >
                              {log.segment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SAĞ KART: Soru Çözüm Hedefi */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Günlük Çözülen Soru</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900">
                  {dailyGoal.completedQuestions} / {dailyGoal.targetQuestions} Soru (%{questionPercent})
                </div>
              </div>

              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${questionPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    T+0 Kalibrasyon (Kova Belirlemez)
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                    20 Soru / Ünite
                  </div>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    T+3 Esas Test (Kova Kararı)
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700 mt-0.5">
                    40 Soru / Ünite
                  </div>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-md p-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Müfredat Havuzu
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                    {topics.length} Ünite (14 Blok)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateDailyGoal({
                      completedQuestions: Math.max(0, dailyGoal.completedQuestions - 10)
                    })
                  }
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-mono"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDailyGoal({ completedQuestions: dailyGoal.completedQuestions + 20 })
                  }
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-mono"
                >
                  +20 (T+0)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDailyGoal({ completedQuestions: dailyGoal.completedQuestions + 40 })
                  }
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-mono"
                >
                  +40 (T+3)
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500">Hedef:</span>
                <input
                  type="number"
                  step="10"
                  min="20"
                  max="400"
                  aria-label="Günlük Hedef Soru Sayısı"
                  value={dailyGoal.targetQuestions}
                  onChange={e =>
                    updateDailyGoal({ targetQuestions: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs text-right font-mono"
                />
                <span className="text-slate-500">soru</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Planlı & Acil Triyaj Görevleri (Takvim ve Triyaj Raporu ile %100 Senkronize) */}
      {report.urgentTasks.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Planlı &amp; Acil Triyaj Görevleri ({report.urgentTasks.length} Aktif Görev ·{' '}
                {dueTopics.length} Bugün/Geciken)
              </span>
            </div>
            <span className="text-xs text-amber-800">
              Takvim, Tekrar Kuyruğu ve Triyaj Raporu ile gerçek zamanlı senkronizedir.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.urgentTasks.map(task => {
              const topic = topics.find(t => t.id === task.topicId);
              if (!topic) return null;
              const sub = subjects.find(s => s.id === topic.subjectId);
              const isDueNow = task.targetDate <= todayStr;

              return (
                <div
                  key={task.id}
                  className="bg-white border border-amber-200/90 rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase">
                      <span>
                        {sub?.name || 'Ders'} · Ünite {topic.unitNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                          isDueNow
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isDueNow ? `ACİL / BUGÜN (${task.targetDate})` : `PLANLI: ${task.targetDate}`}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-1">
                      {topic.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                      {task.bucket === 'NONE' && (
                        <span className="text-indigo-700 font-semibold">
                          T+3: Esas 40 Soru Çözülecek (Kova Kararı Verilecek)
                        </span>
                      )}
                      {task.bucket === 'YELLOW' && (
                        <span className="text-amber-700 font-semibold">
                          T+14: {topic.promotedFromRed ? '3. Bankadan' : '2. Bankadan'} 20-25 Soru Doğrulama
                        </span>
                      )}
                      {task.bucket === 'RED' && (
                        <span className="text-rose-700 font-semibold">
                          Cumartesi: 25 dk Boş Kağıt Onarımı + 2. Bankadan 30 Soru
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => clearTopicScheduledTask(topic.id)}
                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                      title="Üniteyi silmeden bu planlı görevi tüm sekmelerden kaldır"
                      aria-label={`Görevi Sil: ${topic.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Görevi Sil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModalTopic(topic)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Test Gir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DUS 2027 4 Katmanlı Bilişsel Blok SOP Şablonu */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Standart Operasyon Prosedürü (SOP)
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Günlük 4 Bilişsel Blok Akışı
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gününüzü tek bir işe ayırmak bilişsel tükenmişlik yaratır; her gün bu 4 bloğu sırayla tamamlayın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blok 1 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              dailyGoal.block1Done
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    BLOK 1 (Sabah İlk İş)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">45 dk Sert Tavan</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  İki Desteli Anki &amp; Mikro-Bellek
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  İlk 15-20 dk:{' '}
                  <strong className="text-slate-800">01-KRITIK-OTOPSI-VE-TABLO</strong> destesi %100
                  sıfırlanır. Kalan sürede budanmış temel bilim kartları çözülür. 45. dk&apos;da Anki
                  kesin kapatılır!
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleBlockDone('block1Done')}
                className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                aria-label="Blok 1 Durumunu Değiştir"
              >
                {dailyGoal.block1Done ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Blok 2 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              dailyGoal.block2Done
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    BLOK 2 (Zirve Odak)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">2,5 - 4 Saat</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  Yeni Konu Edinimi &amp; T+0 (20 Soru Kalibrasyon)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Ana kitaptan derin kodlama (her 3 sayfada 90 sn özetle). Ünite biter bitmez: 10 dk{' '}
                  <strong className="text-slate-800">Boş Kağıt (Blurting)</strong> +{' '}
                  <strong className="text-slate-800">20 soru çöz</strong> (buradaki istatistik kova belirlemez!). Esas testi 3 gün sonrasına (T+3) kilitle!
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleBlockDone('block2Done')}
                className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                aria-label="Blok 2 Durumunu Değiştir"
              >
                {dailyGoal.block2Done ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Blok 3 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              dailyGoal.block3Done
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    BLOK 3 (Öğleden Sonra)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">1,5 - 2,5 Saat</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  T+3 Gecikmeli Geri Çağırma &amp; Esas Kova Triyajı
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  3 gün önce çalışılan konunun{' '}
                  <strong className="text-slate-800">esas 40 sorusu</strong> konu okunmadan
                  doğrudan çözülür. Performansa göre ünite{' '}
                  <span className="text-emerald-700 font-semibold">Yeşil (≥34 — bir daha tekrar sırasına girmez!)</span>,{' '}
                  <span className="text-amber-700 font-semibold">Sarı (28-33 — T+14)</span> veya{' '}
                  <span className="text-rose-700 font-semibold">Kırmızı (≤27 — Cumartesi Onarım)</span> kovaya atanır.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleBlockDone('block3Done')}
                className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                aria-label="Blok 3 Durumunu Değiştir"
              >
                {dailyGoal.block3Done ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Blok 4 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              dailyGoal.block4Done
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    BLOK 4 (Akşam Kapanış)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">45 - 90 dk</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  Biten Derslerin Karma Denemesi &amp; Hata Kaydı
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Biten derslerden 30-40 soruluk karma test. Yanlış çıkan soruların 5 dk
                  mikro-okumasını yap ve{' '}
                  <strong className="text-slate-800">Pazar gününe biriktirmeden</strong> 30 saniyede
                  tek satırlık Cloze zıtlık kuralını Anki&apos;ye gir!
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleBlockDone('block4Done')}
                className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                aria-label="Blok 4 Durumunu Değiştir"
              >
                {dailyGoal.block4Done ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Günlük Görev Listesi (Checklist) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Günün Görev Kontrol Listesi</h3>
            <p className="text-xs text-slate-500">Kişiselleştirilmiş günlük çalışma adımlarınız</p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {dailyGoal.checklist.filter(i => i.done).length} / {dailyGoal.checklist.length} Tamam
          </span>
        </div>

        {/* Yeni Görev Ekleme */}
        <form onSubmit={handleAddChecklist} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newChecklistText}
            onChange={e => setNewChecklistText(e.target.value)}
            placeholder="Yeni günlük görev ekleyin (örn: Farmakoloji otonom sinir sistemi T+0 20 soru)..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ekle</span>
          </button>
        </form>

        {/* Görevler Listesi */}
        <div className="space-y-2">
          {dailyGoal.checklist.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                item.done
                  ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGoalChecklistItem(item.id)}
                className="flex items-center gap-3 text-left flex-1"
              >
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs font-medium">{item.text}</span>
              </button>

              <button
                type="button"
                onClick={() => deleteGoalChecklistItem(item.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                aria-label="Görevi Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {activeModalTopic && (
        <TriageModal topic={activeModalTopic} onClose={() => setActiveModalTopic(null)} />
      )}
    </div>
  );
};
