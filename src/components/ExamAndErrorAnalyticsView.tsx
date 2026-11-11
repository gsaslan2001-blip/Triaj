/**
 * DUS 2027 Excel-to-App Mimari Kılavuzu:
 * - Sekme 7: Deneme_Analiz (16 Branş Net Girişi, Spider/Radar Grafiği, Net Artış Eğrisi & ADÇC 100+ Barajı)
 * - Sekme 9 & 10: Semantik_Hata_Analizi (SWSPS Bilişsel Ceza Skoru Motoru) & Konu_Matrisi (FSRS S/D/R)
 * - Sekme 8 & 11: Gunluk_Log (Canlı Soru Kronometresi & Hız sn/soru) & Soru_Bankasi_Metrikleri
 * - Sekme 12: Anki_FSRS_Takip (%95.8 Kalıcılık, Kart Olgunluk Dağılımı & 16 Branş Kart Tablosu)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDUS } from '../context/DUSContext';
import {
  CanonicalBranchCode,
  CognitiveErrorType,
  QuestionFormatType
} from '../types/dus';
import {
  CANONICAL_16_BRANCHES,
  calculateSWSPS,
  calculateSWSPSBreakdown,
  calculateQuestionLogMetrics,
  aggregateQuestionBankMetrics
} from '../utils/analytics';
import {
  TrendingUp,
  AlertOctagon,
  Timer,
  Database,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Award,
  Activity,
  Sliders
} from 'lucide-react';

type AnalyticsTab = 'MOCK_EXAMS' | 'SWSPS_ERRORS' | 'QUESTION_SPEED_LOG' | 'ANKI_FSRS';

export const ExamAndErrorAnalyticsView: React.FC = () => {
  const {
    topics,
    mockExams,
    addMockExam,
    deleteMockExam,
    semanticErrors,
    addSemanticError,
    toggleSemanticErrorAnkiStatus,
    deleteSemanticError,
    questionLogs,
    addQuestionLog,
    deleteQuestionLog,
    topicTaxonomy,
    updateTaxonomyItem,
    ankiSnapshot,
    updateAnkiSnapshot,
    systemParams,
    todayStr
  } = useDUS();

  const [activeSubTab, setActiveSubTab] = useState<AnalyticsTab>('MOCK_EXAMS');

  // --- 1. DENEME_ANALIZ STATE ---
  const [isNewExamOpen, setIsNewExamOpen] = useState(false);
  const [examDate, setExamDate] = useState(todayStr);
  const [examInstitution, setExamInstitution] = useState('DUSDATA Türkiye Geneli TG-3');
  const [examNotes, setExamNotes] = useState('');
  const [branchInputs, setBranchInputs] = useState<Record<CanonicalBranchCode, number>>(() => {
    const init = {} as Record<CanonicalBranchCode, number>;
    for (const b of CANONICAL_16_BRANCHES) {
      init[b.code] = Number((b.questionCount * 0.85).toFixed(2));
    }
    return init;
  });

  // --- 2. SWSPS HATA ANALİZİ STATE ---
  const [errBranchCode, setErrBranchCode] = useState<CanonicalBranchCode>('B09');
  const [errSemanticCode, setErrSemanticCode] = useState<string>('ADCC_IMPACT_01');
  const [errSubtopic, setErrSubtopic] = useState<string>('Pell-Gregory & İnferior Alveolar Sinir Komşuluğu');
  const [errSource, setErrSource] = useState<string>('ÖSYM Birebir Prova Denemesi');
  const [errSummary, setErrSummary] = useState<string>('');
  const [errType, setErrType] = useState<CognitiveErrorType>('Çeldirici');
  const [errDistractor, setErrDistractor] = useState<string>('');
  const [errCloze, setErrCloze] = useState<string>('');
  const [copiedClozeId, setCopiedClozeId] = useState<string | null>(null);

  // --- 3. CANLI SORU ÇÖZÜM KRONOMETRESİ & GUNLUK_LOG STATE ---
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [logSourceBook, setLogSourceBook] = useState<string>('DUSBANKASI AI Motoru');
  const [logBranchCode, setLogBranchCode] = useState<CanonicalBranchCode>('B09');
  const [logSemanticCode, setLogSemanticCode] = useState<string>('ADCC_IMPACT_01');
  const [logFormat, setLogFormat] = useState<QuestionFormatType>('Klinik Vaka / Senaryo');
  const [logCorrect, setLogCorrect] = useState<number>(36);
  const [logWrong, setLogWrong] = useState<number>(4);
  const [logEmpty, setLogEmpty] = useState<number>(0);
  const [logDurationMinutes, setLogDurationMinutes] = useState<number>(34);
  const [logNotes, setLogNotes] = useState<string>('');

  // Kronometre sayacı
  useEffect(() => {
    if (!isStopwatchRunning) return;
    const interval = setInterval(() => {
      setStopwatchSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formattedStopwatch = useMemo(() => {
    const mins = Math.floor(stopwatchSeconds / 60);
    const secs = stopwatchSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [stopwatchSeconds]);

  const handleApplyStopwatchToForm = () => {
    setIsStopwatchRunning(false);
    const mins = Math.max(1, Math.round(stopwatchSeconds / 60));
    setLogDurationMinutes(mins);
  };

  // Son deneme ve radar grafiği hesaplaması
  const latestExam = mockExams[mockExams.length - 1] || null;

  // Canlı SWSPS v2.0 Önizleme Röntgeni
  const previewBreakdown = useMemo(() => {
    const tax = topicTaxonomy.find(t => t.semanticCode === errSemanticCode);
    const repeats = semanticErrors.filter(e => e.semanticCode === errSemanticCode).length + 1;
    const branchTopics = topics.filter(t => t.subjectId === errBranchCode);
    const matchedTopic =
      branchTopics.find(t => t.currentBucket === 'RED') ||
      branchTopics.find(t => t.currentBucket === 'YELLOW') ||
      branchTopics.find(t => t.currentBucket === 'GREEN') ||
      branchTopics[0];

    return calculateSWSPSBreakdown({
      errorType: errType,
      repeatCount: repeats,
      difficultyD: tax?.fsrsDifficultyD ?? 7.5,
      fsrsRetrievabilityR: tax?.fsrsRetrievabilityR ?? 75,
      daysElapsed: 0,
      customWeights: systemParams.errorWeights,
      bucket: matchedTopic?.currentBucket || 'NONE',
      branchCode: errBranchCode,
      ankiClozeStatus: errCloze.trim() ? 'Eklendi' : 'Bekliyor',
      isTopicDischarged: Boolean(matchedTopic?.discharged)
    });
  }, [
    errType,
    errSemanticCode,
    errBranchCode,
    errCloze,
    topics,
    topicTaxonomy,
    semanticErrors,
    systemParams.errorWeights
  ]);
  const previewSWSPS = previewBreakdown.finalScore;

  // Canlı Soru Log Önizleme Metrikleri
  const previewLogMetrics = useMemo(() => {
    return calculateQuestionLogMetrics(logCorrect, logWrong, logEmpty, logDurationMinutes);
  }, [logCorrect, logWrong, logEmpty, logDurationMinutes]);

  // Soru Bankası ve Format Kümülatif Metrikleri
  const aggregatedBanks = useMemo(() => {
    return aggregateQuestionBankMetrics(questionLogs);
  }, [questionLogs]);

  // Yeni Deneme Kaydet
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    addMockExam(examDate, examInstitution, branchInputs, examNotes);
    setIsNewExamOpen(false);
    setExamNotes('');
  };

  // Yeni SWSPS Hata Kaydet
  const handleCreateError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errSummary.trim()) return;
    addSemanticError({
      date: todayStr,
      source: errSource,
      branchCode: errBranchCode,
      semanticCode: errSemanticCode,
      subtopic: errSubtopic,
      questionSummary: errSummary,
      errorType: errType,
      distractorAnalysis: errDistractor || 'Çeldirici ayrımı Anki Cloze kartına dönüştürüldü.',
      ankiClozeText: errCloze || undefined,
      mockExamId: latestExam?.id
    });
    setErrSummary('');
    setErrDistractor('');
    setErrCloze('');
  };

  // Yeni Soru Çözüm Oturumu Kaydet
  const handleCreateQuestionLog = (e: React.FormEvent) => {
    e.preventDefault();
    addQuestionLog({
      date: todayStr,
      sourceBook: logSourceBook,
      branchCode: logBranchCode,
      semanticCode: logSemanticCode,
      questionFormat: logFormat,
      correct: logCorrect,
      wrong: logWrong,
      empty: logEmpty,
      durationMinutes: logDurationMinutes,
      notes: logNotes
    });
    setLogNotes('');
  };

  // 16 Branş Spider/Radar SVG Nokta Hesaplayıcısı
  const radarGeometry = useMemo(() => {
    const cx = 170;
    const cy = 170;
    const maxR = 115;
    const total = CANONICAL_16_BRANCHES.length;

    const targetPoints: string[] = [];
    const actualPoints: string[] = [];
    const axes: {
      code: CanonicalBranchCode;
      shortName: string;
      xEnd: number;
      yEnd: number;
      xLabel: number;
      yLabel: number;
      actualPct: number;
      targetPct: number;
    }[] = [];

    CANONICAL_16_BRANCHES.forEach((b, idx) => {
      const angle = (Math.PI * 2 * idx) / total - Math.PI / 2;
      const targetPct = b.targetAccuracyPercent / 100;
      const actualNet = latestExam ? latestExam.branchNets[b.code] ?? 0 : b.targetNet * 0.85;
      const actualPct = Math.max(0, Math.min(1, actualNet / b.questionCount));

      const tx = cx + Math.cos(angle) * (maxR * targetPct);
      const ty = cy + Math.sin(angle) * (maxR * targetPct);
      targetPoints.push(`${tx.toFixed(1)},${ty.toFixed(1)}`);

      const ax = cx + Math.cos(angle) * (maxR * actualPct);
      const ay = cy + Math.sin(angle) * (maxR * actualPct);
      actualPoints.push(`${ax.toFixed(1)},${ay.toFixed(1)}`);

      axes.push({
        code: b.code,
        shortName: b.shortName,
        xEnd: cx + Math.cos(angle) * maxR,
        yEnd: cy + Math.sin(angle) * maxR,
        xLabel: cx + Math.cos(angle) * (maxR + 26),
        yLabel: cy + Math.sin(angle) * (maxR + 22),
        actualPct: Math.round(actualPct * 100),
        targetPct: b.targetAccuracyPercent
      });
    });

    return {
      cx,
      cy,
      maxR,
      targetPolygon: targetPoints.join(' '),
      actualPolygon: actualPoints.join(' '),
      axes
    };
  }, [latestExam]);

  return (
    <div className="space-y-6">
      {/* 1. Üst Başlık ve 4 Analitik Modül Seçici */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Excel-to-App Mimari Kılavuzu · Sekme 7, 8, 9, 10, 11 ve 12
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              16 Branş Deneme Analizi, SWSPS Bilişsel Ceza Motoru, Soru/Hız Kronometresi &amp; FSRS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hedef: {systemParams.targetGoalTitle} · Hedef Net: {systemParams.targetTotalNet.toFixed(1)} / 120 (ADÇC Elit Barajı: {systemParams.adccEliteThreshold}+)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab('MOCK_EXAMS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'MOCK_EXAMS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Deneme_Analiz (16 Branş &amp; Radar)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('SWSPS_ERRORS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'SWSPS_ERRORS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SWSPS Hata Motoru &amp; FSRS Matrisi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('QUESTION_SPEED_LOG')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'QUESTION_SPEED_LOG'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Soru Günlüğü &amp; Hız Kronometresi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ANKI_FSRS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'ANKI_FSRS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Anki_FSRS_Takip (%{ankiSnapshot.overallRetentionPercent})</span>
            </button>
          </div>
        </div>

        {/* Hızlı Özet Metrik Şeridi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Son Deneme Neti ({latestExam?.id || '-'})
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold font-mono text-slate-900 tabular-nums">
                {latestExam ? latestExam.totalNet.toFixed(2) : '0.00'}
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  latestExam && latestExam.targetDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                ({latestExam && latestExam.targetDiff >= 0 ? '+' : ''}
                {latestExam ? latestExam.targetDiff.toFixed(2) : '0.0'} Hedef Farkı)
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              ADÇC 100+ Baraj Statüsü
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-extrabold border ${
                  latestExam?.adccStatus === 'ELİT'
                    ? 'bg-slate-900 text-amber-400 border-amber-500'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                }`}
              >
                {latestExam?.adccStatus || 'GELİŞİM'}
              </span>
              <span className="text-xs font-mono text-slate-600">
                Başarı: %{latestExam?.accuracyPercent ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              En Yüksek SWSPS Ceza Puanı
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold font-mono text-rose-700 tabular-nums">
                {semanticErrors.length > 0
                  ? Math.max(...semanticErrors.map(e => e.swspsScore)).toFixed(2)
                  : '0.00'}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {semanticErrors[0]?.semanticCode || '-'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Ortalama Soru Çözüm Hızı
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold font-mono text-indigo-700 tabular-nums">
                {questionLogs.length > 0
                  ? (
                      questionLogs.reduce((a, b) => a + b.speedSecondsPerQuestion, 0) /
                      questionLogs.length
                    ).toFixed(1)
                  : '52.0'}{' '}
                sn
              </span>
              <span className="text-xs text-emerald-700 font-semibold">Hedef: 50-60 sn</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SEKME 7: DENEME_ANALIZ (16 BRANŞ NET, SPIDER RADAR & TREND EĞRİSİ)
         ===================================================================== */}
      {activeSubTab === 'MOCK_EXAMS' && (
        <div className="space-y-6">
          {/* Grafikler: Sol Çift Eksenli Net Artış Eğrisi + Sağ 16 Branş Spider/Radar Grafiği */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sol 7 Kolon: Deneme Net İlerleme Eğrisi & ADÇC 100+ Baraj Çizgisi */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Deneme Net İlerleme Eğrisi &amp; ADÇC 100+ Elit Baraj Çizgisi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Temel Bilimler (Max 40), Klinik Bilimler (Max 80) ve Toplam Net (Max 120) Trendi
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewExamOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni 16 Branş Deneme Gir</span>
                </button>
              </div>

              {/* SVG Line Chart */}
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 600 250" className="w-full h-60 overflow-visible">
                  {/* Arka Plan Kılavuz Çizgileri */}
                  {[0, 30, 60, 90, 100, 108, 120].map(val => {
                    const y = 215 - (val / 120) * 185;
                    const isAdcc = val === 100;
                    const isTarget = val === 108;
                    return (
                      <g key={val}>
                        <line
                          x1={45}
                          y1={y}
                          x2={575}
                          y2={y}
                          stroke={isAdcc ? '#D97706' : isTarget ? '#059669' : '#E2E8F0'}
                          strokeWidth={isAdcc || isTarget ? 1.5 : 1}
                          strokeDasharray={isAdcc || isTarget ? '5 4' : undefined}
                        />
                        <text
                          x={40}
                          y={y + 3}
                          textAnchor="end"
                          className="text-[10px] fill-slate-500 font-mono"
                        >
                          {val}
                        </text>
                        {isAdcc && (
                          <text
                            x={52}
                            y={y + 11}
                            textAnchor="start"
                            className="text-[9px] fill-amber-700 font-mono font-bold"
                          >
                            ADÇC Elit Barajı (100.0)
                          </text>
                        )}
                        {isTarget && (
                          <text
                            x={52}
                            y={y - 4}
                            textAnchor="start"
                            className="text-[9px] fill-emerald-700 font-mono font-bold"
                          >
                            Hedef ({systemParams.targetTotalNet})
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Çizgiler ve Noktalar */}
                  {mockExams.length > 0 && (() => {
                    const count = mockExams.length;
                    const getX = (idx: number) =>
                      count === 1 ? 310 : 120 + (idx / (count - 1)) * 420;
                    const getY = (net: number) => 215 - (net / 120) * 185;

                    const totalPath = mockExams
                      .map((m, i) => `${getX(i)},${getY(m.totalNet)}`)
                      .join(' ');
                    const clinicalPath = mockExams
                      .map((m, i) => `${getX(i)},${getY(m.clinicalNet)}`)
                      .join(' ');
                    const basicPath = mockExams
                      .map((m, i) => `${getX(i)},${getY(m.basicNet)}`)
                      .join(' ');

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#0F172A"
                          strokeWidth="3"
                          points={totalPath}
                        />
                        <polyline
                          fill="none"
                          stroke="#4F46E5"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          points={clinicalPath}
                        />
                        <polyline
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="2"
                          strokeDasharray="2 2"
                          points={basicPath}
                        />

                        {mockExams.map((m, i) => {
                          const x = getX(i);
                          const yTotal = getY(m.totalNet);
                          return (
                            <g key={m.id}>
                              <circle
                                cx={x}
                                cy={yTotal}
                                r={5}
                                fill={m.adccStatus === 'ELİT' ? '#059669' : '#0F172A'}
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                              />
                              <text
                                x={x}
                                y={yTotal - 10}
                                textAnchor="middle"
                                className="text-[10px] font-mono font-bold fill-slate-900"
                              >
                                {m.totalNet.toFixed(1)}
                              </text>
                              <text
                                x={x}
                                y={235}
                                textAnchor="middle"
                                className="text-[10px] font-mono fill-slate-600"
                              >
                                {m.id}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span className="w-3 h-1 bg-slate-900 inline-block rounded" />
                    Toplam Net
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                    <span className="w-3 h-1 bg-indigo-600 inline-block rounded" />
                    Klinik Net (≤80)
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-sky-700">
                    <span className="w-3 h-1 bg-sky-600 inline-block rounded" />
                    Temel Net (≤40)
                  </span>
                </div>
                <span className="text-slate-500 font-mono">
                  Toplam {mockExams.length} Kurumsal Deneme
                </span>
              </div>
            </div>

            {/* Sağ 5 Kolon: 16 Branş Spider / Radar Grafiği */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  16 DUS Branşı Radar (Spider) Analizi ({latestExam?.id || 'Bazal'})
                </h3>
                <p className="text-xs text-slate-500">
                  Mavi Poligon: Son Deneme Başarı % · Yeşil Çizgi: ADÇC Hedef % Standartları
                </p>
              </div>

              <div className="flex items-center justify-center my-2">
                <svg viewBox="0 0 340 340" className="w-72 h-72 overflow-visible">
                  {/* Konsantrik Radar Halkaları (%25, %50, %75, %100) */}
                  {[0.25, 0.5, 0.75, 1.0].map(level => (
                    <circle
                      key={level}
                      cx={radarGeometry.cx}
                      cy={radarGeometry.cy}
                      r={radarGeometry.maxR * level}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* 16 Branş Eksen Çizgileri ve Etiketleri */}
                  {radarGeometry.axes.map(axis => (
                    <g key={axis.code}>
                      <line
                        x1={radarGeometry.cx}
                        y1={radarGeometry.cy}
                        x2={axis.xEnd}
                        y2={axis.yEnd}
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />
                      <text
                        x={axis.xLabel}
                        y={axis.yLabel}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9px] font-mono font-bold fill-slate-700"
                      >
                        {axis.code}
                      </text>
                    </g>
                  ))}

                  {/* Hedef Poligonu */}
                  <polygon
                    points={radarGeometry.targetPolygon}
                    fill="rgba(16, 185, 129, 0.08)"
                    stroke="#059669"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />

                  {/* Son Deneme Poligonu */}
                  <polygon
                    points={radarGeometry.actualPolygon}
                    fill="rgba(79, 70, 229, 0.22)"
                    stroke="#4F46E5"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">En Güçlü Klinik Branş:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    B09 Çene Cerrahisi (%{latestExam ? Math.round((latestExam.branchNets.B09 / 10) * 100) : 92})
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Öncelikli Gelişim Branşı:</span>
                  <span className="font-bold text-amber-700 font-mono">
                    B12 Ortodonti / B16 Protetik
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 16 Branş Deneme Sonuçları Tablosu (Sayfa 11) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Deneme_Analiz — 16 Kanonik Branş Netleri ve ADÇC Baraj Tablosu
                </h3>
                <p className="text-xs text-slate-500">
                  Temel Net (≤40) + Klinik Net (≤80) = Toplam Net (≤120) · ADÇC Baraj Statüsü: ≥100.0 Net = ELİT
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="py-3 px-3">Deneme ID</th>
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-3">Kurum / Sınav Adı</th>
                    <th className="py-3 px-3 text-right">Temel (40)</th>
                    <th className="py-3 px-3 text-right">Klinik (80)</th>
                    <th className="py-3 px-3 text-right">Toplam Net</th>
                    <th className="py-3 px-3 text-right">Hedefe Uzaklık</th>
                    <th className="py-3 px-3 text-right">Başarı %</th>
                    <th className="py-3 px-3 text-center">ADÇC Statüsü</th>
                    <th className="py-3 px-3 text-right">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {mockExams.map(exam => (
                    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-indigo-700">{exam.id}</td>
                      <td className="py-3 px-3 tabular-nums text-slate-600">{exam.date}</td>
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-slate-900">{exam.institution}</div>
                        {exam.notes && (
                          <div className="text-[11px] text-slate-500 truncate max-w-md">
                            {exam.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-sky-700 font-bold">
                        {exam.basicNet.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-indigo-700 font-bold">
                        {exam.clinicalNet.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-extrabold text-slate-900 text-sm">
                        {exam.totalNet.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right tabular-nums font-bold ${
                          exam.targetDiff >= 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {exam.targetDiff >= 0 ? '+' : ''}
                        {exam.targetDiff.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                        %{exam.accuracyPercent}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {exam.adccStatus === 'ELİT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-500 font-extrabold text-[11px]">
                            <Award className="w-3 h-3" />
                            <span>ELİT (100+)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-[11px]">
                            <span>GELİŞİM</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteMockExam(exam.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          aria-label={`${exam.id} Denemesini Sil`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yeni 16 Branş Deneme Giriş Modalı */}
          {isNewExamOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Yeni 16 Branş DUS Deneme Sınavı Girişi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Açık sarı hücrelere her branşın netini girin; Temel (≤40), Klinik (≤80) ve ADÇC Barajı otomatik hesaplanır.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateExam} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sınav Tarihi
                      </label>
                      <input
                        type="date"
                        value={examDate}
                        onChange={e => setExamDate(e.target.value)}
                        className="w-full px-3 py-2 bg-yellow-50 border border-yellow-400 rounded-lg text-xs font-mono"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kurum / Deneme Adı
                      </label>
                      <input
                        type="text"
                        value={examInstitution}
                        onChange={e => setExamInstitution(e.target.value)}
                        className="w-full px-3 py-2 bg-yellow-50 border border-yellow-400 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {CANONICAL_16_BRANCHES.map(b => (
                      <div
                        key={b.code}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-indigo-700">{b.code}</span>
                          <span className="font-mono text-slate-500">Max: {b.questionCount}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {b.shortName}
                        </div>
                        <input
                          type="number"
                          step="0.25"
                          min={-2.5}
                          max={b.questionCount}
                          aria-label={`${b.name} Net Girişi`}
                          value={branchInputs[b.code]}
                          onChange={e =>
                            setBranchInputs(prev => ({
                              ...prev,
                              [b.code]: parseFloat(e.target.value) || 0
                            }))
                          }
                          className="w-full px-2 py-1 bg-yellow-100 border border-yellow-400 rounded text-xs font-mono font-bold text-right tabular-nums"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stratejik Deneme Notu
                    </label>
                    <input
                      type="text"
                      value={examNotes}
                      onChange={e => setExamNotes(e.target.value)}
                      placeholder="Örn: Protetik Kennedy Sınıf II ve Biyokimya kollajen soruları SWSPS listesine eklendi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsNewExamOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Denemeyi Hesapla &amp; Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SEKME 9 & 10: SEMANTIK_HATA_ANALIZI (SWSPS v2.0) & KONU_MATRISI (FSRS)
         ===================================================================== */}
      {activeSubTab === 'SWSPS_ERRORS' && (
        <div className="space-y-6">
          {/* Üst 4 Kademeli Klinik Aciliyet Bandı KPI Özeti */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-rose-800 uppercase">
                  🔴 Kritik Blokaj (≥10.0)
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Cumartesi Onarım + Tablo + Cloze
                </div>
              </div>
              <span className="text-2xl font-extrabold font-mono text-rose-800 tabular-nums">
                {semanticErrors.filter(e => e.swspsScore >= 10).length}
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-900 uppercase">
                  🟠 Yüksek Risk (6.5–9.9)
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  15 dk Nokta Atışı Yama + Cloze
                </div>
              </div>
              <span className="text-2xl font-extrabold font-mono text-amber-900 tabular-nums">
                {semanticErrors.filter(e => e.swspsScore >= 6.5 && e.swspsScore < 10).length}
              </span>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-yellow-900 uppercase">
                  🟡 Orta Risk (3.5–6.4)
                </div>
                <div className="text-[11px] text-yellow-800 mt-0.5">
                  Soru Bankası Tekrarında Odaklan
                </div>
              </div>
              <span className="text-2xl font-extrabold font-mono text-yellow-900 tabular-nums">
                {semanticErrors.filter(e => e.swspsScore >= 3.5 && e.swspsScore < 6.5).length}
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-900 uppercase">
                  🟢 Kontrol Altında (&lt;3.5)
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Anki FSRS Döngüsünde Takipte
                </div>
              </div>
              <span className="text-2xl font-extrabold font-mono text-emerald-900 tabular-nums">
                {semanticErrors.filter(e => e.swspsScore < 3.5).length}
              </span>
            </div>
          </div>

          {/* SWSPS v2.0 Matematiksel Formül & Yeni Hata Teşhis Formu */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-[11px] font-semibold text-rose-600 uppercase">
                    Sekme 10 · Semantik_Hata_Analizi (SWSPS v2.0)
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Dinamik SWSPS v2.0 &amp; Hata Teşhis Kaydı
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Canlı SWSPS v2.0 ({previewBreakdown.tierLabel})
                  </div>
                  <div className="text-lg font-extrabold font-mono text-rose-700 tabular-nums">
                    {previewSWSPS.toFixed(2)} Puan
                  </div>
                </div>
              </div>

              {/* Canlı Çarpan Röntgeni Kutusu */}
              <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1">
                <div className="text-amber-300 font-bold">
                  Canlı Çarpan Röntgeni (Temel: {previewBreakdown.rawBaseScore} Puan):
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {previewBreakdown.formulaSummary}
                </div>
              </div>

              <form onSubmit={handleCreateError} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Branş</label>
                    <select
                      value={errBranchCode}
                      onChange={e => setErrBranchCode(e.target.value as CanonicalBranchCode)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-medium"
                    >
                      {CANONICAL_16_BRANCHES.map(b => (
                        <option key={b.code} value={b.code}>
                          [{b.code}] {b.shortName} ({b.questionCount}S)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Semantik Kod (FSRS)
                    </label>
                    <select
                      value={errSemanticCode}
                      onChange={e => {
                        setErrSemanticCode(e.target.value);
                        const found = topicTaxonomy.find(t => t.semanticCode === e.target.value);
                        if (found) {
                          setErrBranchCode(found.branchCode);
                          setErrSubtopic(found.subtopic);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono"
                    >
                      {topicTaxonomy.map(t => (
                        <option key={t.id} value={t.semanticCode}>
                          {t.semanticCode} (R:%{t.fsrsRetrievabilityR})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bilişsel Hata Tipi (W)
                    </label>
                    <select
                      value={errType}
                      onChange={e => setErrType(e.target.value as CognitiveErrorType)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-semibold"
                    >
                      <option value="Çeldirici">Çeldirici Tuzağı (1.40x)</option>
                      <option value="Muhakeme">Muhakeme Hatası (1.25x)</option>
                      <option value="Bilgi">Bilgi Eksikliği (1.00x)</option>
                      <option value="Dikkat">Soru Kökü / Dikkat (0.80x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kaynak</label>
                    <input
                      type="text"
                      value={errSource}
                      onChange={e => setErrSource(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hata Yapılan Soru Özeti &amp; Kavram
                  </label>
                  <input
                    type="text"
                    value={errSummary}
                    onChange={e => setErrSummary(e.target.value)}
                    placeholder="Örn: OKK kapsülünün kalın sanılması, PTCH1 ve satellit kist mekanizması..."
                    className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Düşülen Çeldirici Analizi
                  </label>
                  <input
                    type="text"
                    value={errDistractor}
                    onChange={e => setErrDistractor(e.target.value)}
                    placeholder="Neden bu şıkka düştüm? Hangi iki kavram birbiriyle karıştı?"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tek Satırlık Anki Cloze Kart Metni (Girildiğinde SWSPS -%40 Sönümlenir)
                  </label>
                  <input
                    type="text"
                    value={errCloze}
                    onChange={e => setErrCloze(e.target.value)}
                    placeholder="Örn: {{c1::OKK}} ince frajil kapsüllüdür ve {{c2::PTCH1}} mutasyonu gösterir."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
                >
                  Hata Teşhisini &amp; SWSPS v2.0 Puanını Kaydet
                </button>
              </form>
            </div>

            {/* Sağ 7 Kolon: SWSPS v2.0 Sıralı Hata Listesi */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Canlı SWSPS v2.0 Bilişsel Ceza Sıralaması ({semanticErrors.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formül: Temel SWSPS &times; Kova Çarpanı (1.35x/1.15x/0.85x) &times; Branş Kaldıracı (1.15x/1.00x/0.90x) &times; Anki Sönümlemesi (0.60x)
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[490px] overflow-y-auto pr-1">
                {[...semanticErrors]
                  .sort((a, b) => b.swspsScore - a.swspsScore)
                  .map(err => {
                    const bd = err.breakdown;
                    const tierBadgeCls =
                      bd?.tier === 'KRITIK_BLOKAJ'
                        ? 'bg-rose-600 text-white'
                        : bd?.tier === 'YUKSEK_RISK'
                        ? 'bg-amber-600 text-white'
                        : bd?.tier === 'ORTA_RISK'
                        ? 'bg-yellow-500 text-slate-950'
                        : 'bg-emerald-600 text-white';

                    const kovaChipCls =
                      bd?.matchedBucket === 'RED'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : bd?.matchedBucket === 'YELLOW'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : bd?.matchedBucket === 'GREEN'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={err.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-xs font-extrabold tabular-nums ${tierBadgeCls}`}
                            >
                              SWSPS: {err.swspsScore.toFixed(2)} · {bd?.tierLabel || 'Risk'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono text-[11px] font-bold">
                              {err.semanticCode}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              [{err.branchCode}] {err.branchName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {bd && (
                              <span
                                className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${kovaChipCls}`}
                              >
                                Kova: {bd.bucketMultiplier.toFixed(2)}x
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              {err.errorType}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSemanticErrorAnkiStatus(err.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                err.ankiClozeStatus === 'Eklendi'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                              title="Anki'ye eklendiğinde SWSPS cezası %40 sönümlenir (0.60x)"
                            >
                              {err.ankiClozeStatus === 'Eklendi'
                                ? 'Anki: Eklendi (0.60x)'
                                : 'Anki Bekliyor (-%40 İndir)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSemanticError(err.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              aria-label={`${err.id} Hatasını Sil`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-900">{err.questionSummary}</div>

                        {/* Çarpan Röntgeni & Önerilen Klinik Müdahale */}
                        {bd && (
                          <div className="p-2 rounded-lg bg-white border border-slate-200/90 space-y-1 text-[11px]">
                            <div className="font-mono text-[10px] text-slate-600">
                              <strong className="text-slate-900">Çarpan Röntgeni:</strong>{' '}
                              {bd.formulaSummary}
                            </div>
                            <div className="text-indigo-900 font-medium">
                              <strong className="text-slate-900">Klinik Reçete:</strong>{' '}
                              {bd.recommendedAction}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600">
                          <strong className="text-slate-800">Çeldirici Otopsisi:</strong>{' '}
                          {err.distractorAnalysis}
                        </div>

                        {err.ankiClozeText && (
                          <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between gap-2 text-[11px] font-mono text-indigo-950">
                            <span className="truncate">{err.ankiClozeText}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(err.ankiClozeText || '');
                                setCopiedClozeId(err.id);
                                setTimeout(() => setCopiedClozeId(null), 2000);
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-sans font-semibold shrink-0 flex items-center gap-1"
                            >
                              {copiedClozeId === err.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedClozeId === err.id ? 'Kopyalandı' : 'Cloze Kopyala'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Sekme 9: Konu_Matrisi (KM-01..KM-16 Kanonik Taksonomi & FSRS S/D/R Tablosu) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Sekme 9: Konu_Matrisi — Kanonik Konu Taksonomisi &amp; FSRS Bellek Parametreleri (S / D / R)
              </h3>
              <p className="text-xs text-slate-500">
                FSRS Retrievability (R%) veya Zorluk (D) değerlerini güncellediğinizde SWSPS ceza skorları anında yeniden hesaplanır.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Branş</th>
                    <th className="py-2.5 px-3">Semantik Kod</th>
                    <th className="py-2.5 px-3">Alt Konu</th>
                    <th className="py-2.5 px-3 text-center">DUS Ağırlığı</th>
                    <th className="py-2.5 px-3 text-center">Stability (S Gün)</th>
                    <th className="py-2.5 px-3 text-center bg-amber-500 text-slate-950">
                      Difficulty D (1-10)
                    </th>
                    <th className="py-2.5 px-3 text-center bg-amber-500 text-slate-950">
                      Retrievability R (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {topicTaxonomy.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-700">{item.id}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                        [{item.branchCode}] {item.branchName}
                      </td>
                      <td className="py-2 px-3 font-bold text-indigo-700">{item.semanticCode}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{item.subtopic}</td>
                      <td className="py-2 px-3 text-center tabular-nums font-bold">
                        {item.dusWeight.toFixed(1)}x
                      </td>
                      <td className="py-2 px-3 text-center tabular-nums text-slate-700">
                        {item.fsrsStabilityS}g
                      </td>
                      <td className="py-2 px-3 text-center bg-yellow-50/80">
                        <input
                          type="number"
                          step="0.1"
                          min={1}
                          max={10}
                          aria-label={`${item.semanticCode} FSRS Zorluk D`}
                          value={item.fsrsDifficultyD}
                          onChange={e =>
                            updateTaxonomyItem(item.id, {
                              fsrsDifficultyD: parseFloat(e.target.value) || 5
                            })
                          }
                          className="w-16 px-1.5 py-0.5 bg-yellow-100 border border-yellow-400 rounded text-center font-bold tabular-nums"
                        />
                      </td>
                      <td className="py-2 px-3 text-center bg-yellow-50/80">
                        <input
                          type="number"
                          min={10}
                          max={100}
                          aria-label={`${item.semanticCode} FSRS Kalıcılık R`}
                          value={item.fsrsRetrievabilityR}
                          onChange={e =>
                            updateTaxonomyItem(item.id, {
                              fsrsRetrievabilityR: parseInt(e.target.value, 10) || 80
                            })
                          }
                          className="w-16 px-1.5 py-0.5 bg-yellow-100 border border-yellow-400 rounded text-center font-bold tabular-nums"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEKME 8 & 11: GUNLUK_LOG (KRONOMETRE & HIZ) VE SORU_BANKASI_METRIKLERI
         ===================================================================== */}
      {activeSubTab === 'QUESTION_SPEED_LOG' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sol 5 Kolon: Canlı Soru Çözüm Kronometresi & Oturum Giriş Formu */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              {/* Canlı Kronometre Kutusu */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                    Canlı Soru Çözüm Kronometresi
                  </div>
                  <div className="text-3xl font-extrabold font-mono tracking-wider mt-0.5 tabular-nums">
                    {formattedStopwatch}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    İdeal DUS Temposu: 50 - 60 sn / soru
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(r => !r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        isStopwatchRunning
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {isStopwatchRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Duraklat</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Başlat</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStopwatchRunning(false);
                        setStopwatchSeconds(0);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      title="Sıfırla"
                      aria-label="Kronometreyi Sıfırla"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyStopwatchToForm}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-md"
                  >
                    Süreyi Forma Aktar
                  </button>
                </div>
              </div>

              {/* Gunluk_Log Formu */}
              <form onSubmit={handleCreateQuestionLog} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Soru Bankası / Kaynak
                    </label>
                    <select
                      value={logSourceBook}
                      onChange={e => setLogSourceBook(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-medium"
                    >
                      <option value="DUSBANKASI AI Motoru">DUSBANKASI AI Motoru</option>
                      <option value="DUSDATA Soru Bankası">DUSDATA Soru Bankası</option>
                      <option value="TTS Çıkmış Sorular">TTS Çıkmış Sorular</option>
                      <option value="DUSDATA Vaka Kitabı">DUSDATA Vaka Kitabı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Soru Formatı</label>
                    <select
                      value={logFormat}
                      onChange={e => setLogFormat(e.target.value as QuestionFormatType)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-medium"
                    >
                      <option value="Klinik Vaka / Senaryo">Klinik Vaka / Senaryo</option>
                      <option value="Öncüllü / Ayrım Sorusu">Öncüllü / Ayrım Sorusu</option>
                      <option value="Spot / Bilgi Sorusu">Spot / Bilgi Sorusu</option>
                      <option value="ÖSYM Çıkmış Sorular">ÖSYM Çıkmış Sorular</option>
                      <option value="Komplikasyon Yönetimi">Komplikasyon Yönetimi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Branş</label>
                    <select
                      value={logBranchCode}
                      onChange={e => setLogBranchCode(e.target.value as CanonicalBranchCode)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg"
                    >
                      {CANONICAL_16_BRANCHES.map(b => (
                        <option key={b.code} value={b.code}>
                          [{b.code}] {b.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Semantik Kod</label>
                    <input
                      type="text"
                      value={logSemanticCode}
                      onChange={e => setLogSemanticCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Doğru</label>
                    <input
                      type="number"
                      min={0}
                      value={logCorrect}
                      onChange={e => setLogCorrect(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Yanlış</label>
                    <input
                      type="number"
                      min={0}
                      value={logWrong}
                      onChange={e => setLogWrong(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Boş</label>
                    <input
                      type="number"
                      min={0}
                      value={logEmpty}
                      onChange={e => setLogEmpty(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Süre (dk)</label>
                    <input
                      type="number"
                      min={1}
                      value={logDurationMinutes}
                      onChange={e => setLogDurationMinutes(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1.5 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold text-center"
                    />
                  </div>
                </div>

                {/* Canlı Hesaplanan Net ve Hız Önizleme Bandı */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-500">Net:</span>{' '}
                    <strong className="text-slate-900">{previewLogMetrics.net}</strong> (%{previewLogMetrics.accuracyPercent})
                  </div>
                  <div>
                    <span className="text-slate-500">Hız:</span>{' '}
                    <strong className="text-indigo-700">
                      {previewLogMetrics.speedSecondsPerQuestion} sn/soru
                    </strong>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                    {previewLogMetrics.paceVerdict}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                >
                  Soru Çözüm Oturumunu Kaydet
                </button>
              </form>
            </div>

            {/* Sağ 7 Kolon: Soru_Bankasi_Metrikleri (Kaynak & Format Kıyası) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Sekme 11: Soru_Bankasi_Metrikleri — Kaynak ve Soru Formatı Performans Kıyası
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Kaynak / Soru Bankası</th>
                        <th className="py-2 px-2 text-right">Toplam</th>
                        <th className="py-2 px-2 text-right">Net</th>
                        <th className="py-2 px-2 text-right">Doğruluk %</th>
                        <th className="py-2 px-2 text-right">Ort. Hız (sn)</th>
                        <th className="py-2 px-3 text-right">Kapsama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {aggregatedBanks.bySource.map(row => (
                        <tr key={row.key}>
                          <td className="py-2 px-3 font-sans font-bold text-slate-900">{row.key}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{row.totalQuestions}</td>
                          <td className="py-2 px-2 text-right tabular-nums font-bold text-indigo-700">
                            {row.net}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums font-bold text-emerald-700">
                            %{row.accuracyPercent}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {row.avgSpeedSeconds} sn
                          </td>
                          <td className="py-2 px-3 text-right font-sans">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {row.coverageStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    5 Soru Formatına Göre Doğruluk % ve Hız (sn/soru) Dağılımı
                  </div>
                  <div className="space-y-2">
                    {aggregatedBanks.byFormat.map(fmt => (
                      <div key={fmt.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">{fmt.key}</span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {fmt.totalQuestions} Soru · %{fmt.accuracyPercent} Başarı ·{' '}
                            {fmt.avgSpeedSeconds} sn/soru
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600"
                            style={{ width: `${Math.min(100, fmt.accuracyPercent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gunluk_Log Son Oturumlar Tablosu */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Sekme 8: Gunluk_Log — Kayıtlı Soru Çözüm Oturumları ({questionLogs.length})
                  </h4>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Tarih</th>
                        <th className="py-2 px-3">Kaynak &amp; Branş</th>
                        <th className="py-2 px-2 text-right">D / Y</th>
                        <th className="py-2 px-2 text-right">Net</th>
                        <th className="py-2 px-2 text-right">Hız (sn)</th>
                        <th className="py-2 px-2 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {questionLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 tabular-nums text-slate-600">{log.date}</td>
                          <td className="py-2 px-3 font-sans">
                            <div className="font-bold text-slate-900">
                              [{log.branchCode}] {log.branchName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {log.sourceBook} · {log.questionFormat}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {log.correct}D / {log.wrong}Y
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums font-bold text-emerald-700">
                            {log.net}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums font-bold text-indigo-700">
                            {log.speedSecondsPerQuestion} sn
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => deleteQuestionLog(log.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              aria-label={`${log.id} Kaydını Sil`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEKME 12: ANKI_FSRS_TAKIP (BELLEK KALICILIK MOTORU & 16 BRANŞ KART)
         ===================================================================== */}
      {activeSubTab === 'ANKI_FSRS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sol 4 Kolon: Dairesel Kalıcılık Göstergesi (%95.8 vs %90.0 Hedef) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Sekme 12 · Anki_FSRS_Takip
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Canlı FSRS Retention (Kalıcılık) Göstergesi
                </h3>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(ankiSnapshot.overallRetentionPercent / 100) * 314} 314`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                      %{ankiSnapshot.overallRetentionPercent}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Hedef: %{ankiSnapshot.targetRetentionPercent}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Sapma: +{(ankiSnapshot.overallRetentionPercent - ankiSnapshot.targetRetentionPercent).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Günlük Tekrar</span>
                  <input
                    type="number"
                    aria-label="Anki Günlük Tekrar Sayısı"
                    value={ankiSnapshot.dailyReviewCount}
                    onChange={e =>
                      updateAnkiSnapshot({ dailyReviewCount: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 mt-0.5 px-1.5 py-0.5 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Canlı Retention %</span>
                  <input
                    type="number"
                    step="0.1"
                    aria-label="Anki Genel Kalıcılık Yüzdesi"
                    value={ankiSnapshot.overallRetentionPercent}
                    onChange={e =>
                      updateAnkiSnapshot({
                        overallRetentionPercent: parseFloat(e.target.value) || 90
                      })
                    }
                    className="w-20 mt-0.5 px-1.5 py-0.5 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Sağ 8 Kolon: Kart Olgunluk Dağılımı (Stacked Bar) & 16 Branş Anki Tablosu */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Anki Deste Olgunluk Dağılımı ({ankiSnapshot.totalCards} Toplam Kart)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Olgun (&ge;21 Gün): {ankiSnapshot.matureCards} · Genç (&lt;21 Gün):{' '}
                    {ankiSnapshot.youngCards} · Öğrenilen: {ankiSnapshot.learningCards} · Yeni:{' '}
                    {ankiSnapshot.newCards}
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold">
                  Kart Başı Hız: {ankiSnapshot.averageTimeSecondsPerCard} sn
                </span>
              </div>

              {/* Stacked Bar */}
              <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full"
                  style={{ width: `${(ankiSnapshot.matureCards / ankiSnapshot.totalCards) * 100}%` }}
                  title={`Olgun Kartlar: ${ankiSnapshot.matureCards}`}
                />
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${(ankiSnapshot.youngCards / ankiSnapshot.totalCards) * 100}%` }}
                  title={`Genç Kartlar: ${ankiSnapshot.youngCards}`}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${(ankiSnapshot.learningCards / ankiSnapshot.totalCards) * 100}%` }}
                  title={`Öğrenilen Kartlar: ${ankiSnapshot.learningCards}`}
                />
                <div
                  className="bg-sky-400 h-full"
                  style={{ width: `${(ankiSnapshot.newCards / ankiSnapshot.totalCards) * 100}%` }}
                  title={`Yeni Kartlar: ${ankiSnapshot.newCards}`}
                />
              </div>

              {/* 16 Branş Anki Kart ve Kalıcılık Tablosu */}
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Branş</th>
                      <th className="py-2 px-2 text-right">Toplam Kart</th>
                      <th className="py-2 px-2 text-right">Olgun (&ge;21G)</th>
                      <th className="py-2 px-2 text-right">Genç (&lt;21G)</th>
                      <th className="py-2 px-2 text-right">Yeni</th>
                      <th className="py-2 px-3 text-right">FSRS Retention %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {ankiSnapshot.branchStats.map(b => (
                      <tr key={b.branchCode} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">
                          [{b.branchCode}] {b.branchName}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums font-bold">{b.totalCards}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-emerald-700">
                          {b.matureCards}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums text-indigo-700">
                          {b.youngCards}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums text-slate-600">
                          {b.newCards}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-extrabold text-emerald-700">
                          %{b.retentionPercent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
