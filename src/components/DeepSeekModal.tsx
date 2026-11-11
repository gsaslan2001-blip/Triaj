/**
 * Deploy.com DeepSeek v4.1 Flash (1017) Bilişsel DUS Motoru, Master Prompt Stüdyosu & Model Ayarları
 * Dokümantasyon: https://docs.deploy.com/deepseek-v4-1-flash-1017
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useDUS } from '../context/DUSContext';
import {
  requestDeepSeekCompletion,
  DeepSeekTaskType,
  DeepSeekResult,
  DeepSeekModelConfig,
  DEPLOY_DEEPSEEK_MODEL,
  DEFAULT_DEEPSEEK_MASTER_PROMPT,
  DEFAULT_DEEPSEEK_MODEL_CONFIG,
  DEEPSEEK_CONFIG_STORAGE_KEY,
  LOCKED_MAX_COMPLETION_TOKENS,
  LOCKED_REASONING_EFFORT,
  LOCKED_IDEAL_TEMPERATURE
} from '../utils/deepseek';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Save,
  Loader2,
  Cpu,
  BookOpen,
  Layers,
  MessageSquare,
  Sliders,
  AlertOctagon,
  TrendingUp,
  RotateCcw,
  Brain,
  Lock
} from 'lucide-react';

interface DeepSeekModalProps {
  onClose: () => void;
  initialSubjectId?: string;
  initialTopicId?: string;
}

type ModalViewTab = 'GENERATOR' | 'MASTER_SETTINGS';

const MASTER_PROMPT_PRESETS: { id: string; label: string; prompt: string }[] = [
  {
    id: 'CANONICAL_DUS_2027',
    label: 'Kanonik DUS 2027 Master Prompt (ADÇC TOP 10 + Kova + SWSPS)',
    prompt: DEFAULT_DEEPSEEK_MASTER_PROMPT
  },
  {
    id: 'OSYM_DISTRACTOR_HUNTER',
    label: 'ÖSYM Çeldirici Avcısı & Diferansiyel Tanı Modu',
    prompt: `Sen ÖSYM DUS Soru Hazırlama Komisyonunun kıdemli klinik denetçisisin.
Her yanıtta:
1. Konunun en sık karıştırılan çeldiricilerini Markdown Çapraz Kıyas Tablosu ile ayır.
2. "İlk tercih / Altın standart / Kesin kontrendikasyon / En sık etken" ayrımlarını kalın vurgula.
3. Sınavda tuzak kurulan sayısal eşikleri (mm, açı, süre, M/F oranı, gen mutasyonu) tek bakışta listele.`
  },
  {
    id: 'ANKI_FSRS_CLOZE_FACTORY',
    label: 'FSRS Anki Cloze & Hafıza Çivisi (Mnemonic) Fabrikası',
    prompt: `Sen FSRS (Free Spaced Repetition Scheduler) ve Bilişsel Kodlama uzmanısın.
Her yanıtta:
1. Yalnızca doğrudan Anki "01-KRITIK-OTOPSI-VE-TABLO" destesine yapıştırılabilecek tek satırlık atomik {{c1::...}} ve {{c2::...}} Cloze kartları üret.
2. Her kartın altına nankör ezberleri kilitleyen fonolojik, mekansal veya absürt bir Hafıza Çivisi (Mnemonic) ekle.`
  }
];

export const DeepSeekModal: React.FC<DeepSeekModalProps> = ({
  onClose,
  initialSubjectId = 'B09',
  initialTopicId
}) => {
  const {
    subjects,
    topics,
    updateTopic,
    mockExams,
    semanticErrors,
    report,
    systemParams
  } = useDUS();

  const [activeTab, setActiveTab] = useState<ModalViewTab>('GENERATOR');

  // Persisted Model & Master Prompt Configuration (Token, Reasoning ve Temperature kilitlidir)
  const [modelConfig, setModelConfig] = useState<DeepSeekModelConfig>(() => {
    try {
      const saved = localStorage.getItem(DEEPSEEK_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DeepSeekModelConfig>;
        if (parsed.masterSystemPrompt) {
          parsed.masterSystemPrompt = parsed.masterSystemPrompt
            .replace(/İntörn Hekimi|İntörn Hekim|İntern Hekim/gi, 'Mezunu — Diş Hekimi')
            .replace(/kullanıcı:\s*Furkan Kurt/g, 'kullanıcı: Dt. Furkan Kurt');
        }
        return {
          ...DEFAULT_DEEPSEEK_MODEL_CONFIG,
          ...parsed,
          reasoningEffort: LOCKED_REASONING_EFFORT,
          maxCompletionTokens: LOCKED_MAX_COMPLETION_TOKENS,
          temperature: LOCKED_IDEAL_TEMPERATURE
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_DEEPSEEK_MODEL_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(DEEPSEEK_CONFIG_STORAGE_KEY, JSON.stringify(modelConfig));
    } catch {
      // ignore
    }
  }, [modelConfig]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const subjectTopics = useMemo(
    () =>
      topics
        .filter(t => t.subjectId === selectedSubjectId)
        .sort((a, b) => a.unitNumber - b.unitNumber),
    [topics, selectedSubjectId]
  );

  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || subjectTopics[0]?.id || ''
  );
  const [taskType, setTaskType] = useState<DeepSeekTaskType>('TRIAGE_PATCH');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeepSeekResult | null>(null);
  const [showReasoning, setShowReasoning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToUnit, setSavedToUnit] = useState<boolean>(false);
  const [settingsSavedBanner, setSettingsSavedBanner] = useState<boolean>(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const selectedTopic = topics.find(t => t.id === selectedTopicId) || subjectTopics[0];

  // Canlı Sistem Telemetrisi (Deneme Neti, SWSPS ve Kova Özeti)
  const liveTelemetrySummary = useMemo(() => {
    const latestExam = mockExams[mockExams.length - 1];
    const topSwsps = [...semanticErrors]
      .sort((a, b) => b.swspsScore - a.swspsScore)
      .slice(0, 3);

    const examLine = latestExam
      ? `Son Deneme (${latestExam.id} - ${latestExam.institution}): Toplam ${latestExam.totalNet}/120 Net (Temel: ${latestExam.basicNet}/40, Klinik: ${latestExam.clinicalNet}/80, Hedef ${systemParams.targetTotalNet} Farkı: ${latestExam.targetDiff}, Statü: ${latestExam.adccStatus})`
      : `Hedef Net: ${systemParams.targetTotalNet}/120`;

    const kovaLine = `Kova Triyaj Dağılımı: Yeşil=${report.greenBucket}, Sarı=${report.yellowBucket}, Kırmızı=${report.redBucket}, Depolama İndeksi=%${report.overallRetentionIndex}`;

    const swspsLines = topSwsps
      .map(
        e =>
          `  * [${e.branchCode}] ${e.semanticCode} (${e.subtopic}) — SWSPS: ${e.swspsScore} (${e.errorType}): ${e.questionSummary}`
      )
      .join('\n');

    return {
      examLine,
      kovaLine,
      swspsLines
    };
  }, [mockExams, semanticErrors, report, systemParams.targetTotalNet]);

  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    const firstUnit = topics
      .filter(t => t.subjectId === subId)
      .sort((a, b) => a.unitNumber - b.unitNumber)[0];
    setSelectedTopicId(firstUnit?.id || '');
    setSavedToUnit(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedToUnit(false);

    try {
      const effectiveSystemPrompt = modelConfig.injectLiveTelemetryContext
        ? `${modelConfig.masterSystemPrompt}\n\n[CANLI ADAY TELEMETRİSİ]:\n- ${liveTelemetrySummary.examLine}\n- ${liveTelemetrySummary.kovaLine}`
        : modelConfig.masterSystemPrompt;

      const scoreSummary = selectedTopic?.t3Score
        ? `${selectedTopic.t3Score.correct}/${selectedTopic.t3Score.total} (%${selectedTopic.t3Score.percentage})`
        : undefined;

      const response = await requestDeepSeekCompletion({
        taskType,
        subjectCode: selectedSubject?.code,
        subjectName: selectedSubject?.name,
        unitTitle: selectedTopic?.title,
        topicCode: selectedTopic?.topicCode,
        bucket: selectedTopic?.currentBucket,
        scoreSummary,
        swspsContext: liveTelemetrySummary.swspsLines,
        examContext: `${liveTelemetrySummary.examLine}\n${liveTelemetrySummary.kovaLine}`,
        userNotes: customNotes,
        customPrompt: customNotes,
        masterSystemPrompt: effectiveSystemPrompt,
        reasoningEffort: LOCKED_REASONING_EFFORT,
        maxCompletionTokens: LOCKED_MAX_COMPLETION_TOKENS,
        temperature: LOCKED_IDEAL_TEMPERATURE,
        topP: modelConfig.topP,
        presencePenalty: modelConfig.presencePenalty,
        frequencyPenalty: modelConfig.frequencyPenalty,
        cachePreference: modelConfig.cachePreference
      });
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'DeepSeek v4.1 Flash API yanıtı alınamadı.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.content) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToUnit = () => {
    if (!selectedTopic || !result?.content) return;
    const prefix = selectedTopic.clinicalNotes ? `${selectedTopic.clinicalNotes}\n\n` : '';
    updateTopic(selectedTopic.id, {
      clinicalNotes: `${prefix}[DeepSeek v4.1 Notu]: ${result.content}`
    });
    setSavedToUnit(true);
  };

  const handleResetSettings = () => {
    setModelConfig(DEFAULT_DEEPSEEK_MODEL_CONFIG);
    setSettingsSavedBanner(true);
    setTimeout(() => setSettingsSavedBanner(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-6">
        {/* Üst Başlık & Sekme Geçişi */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">
                  DUS 2027 Bilişsel AI Motoru &amp; Master Prompt Stüdyosu
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px]">
                  {DEPLOY_DEEPSEEK_MODEL}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-mono text-[10px] inline-flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  32.768 Token · Reasoning: MAX · Temp: 0.20
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Ebbinghaus Kova Triyajı, SWSPS Çeldirici Otopsisi, 16 Branş Deneme Koçu ve Atomik Anki Cloze Motoru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-slate-800 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('GENERATOR')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'GENERATOR'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Üretim Kokpiti</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MASTER_SETTINGS')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'MASTER_SETTINGS'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Master Prompt &amp; Ayarlar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================
            SEKME 1: BİLİŞSEL AI ÜRETİM KOKPİTİ (6 GÖREV MODU + HIZLI TOKEN BAR)
           =================================================================== */}
        {activeTab === 'GENERATOR' && (
          <div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              {/* Ders ve Ünite Seçimi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DUS Ders Bloğu (14 Kanonik Blok)
                  </label>
                  <select
                    aria-label="AI için DUS Ders Bloğu Seç"
                    value={selectedSubjectId}
                    onChange={e => handleSubjectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        [{sub.code}] {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlgili Müfredat Ünitesi ({subjectTopics.length} Ünite)
                  </label>
                  <select
                    aria-label="AI için Müfredat Ünitesi Seç"
                    value={selectedTopic?.id || ''}
                    onChange={e => {
                      setSelectedTopicId(e.target.value);
                      setSavedToUnit(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  >
                    {subjectTopics.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.topicCode || `#${String(u.unitNumber).padStart(2, '0')}`} — {u.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6 Bilişsel Görev Modu Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bilişsel Görev Modu (6 Uzmanlaşmış Protokol)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTaskType('TRIAGE_PATCH')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taskType === 'TRIAGE_PATCH'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1. Triyaj Yaması</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Çapraz Kıyas Tablosu &amp; 5 dk Yama
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('SWSPS_ERROR_AUTOPSY')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taskType === 'SWSPS_ERROR_AUTOPSY'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      <span>2. SWSPS Hata Otopsisi</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Çeldirici Analizi &amp; Antidot Kart
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('ANKI_CLOZE')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taskType === 'ANKI_CLOZE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3. FSRS Anki Cloze</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      6 Atomik Kart &amp; Hafıza Çivisi
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('UNIT_BLURTING')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taskType === 'UNIT_BLURTING'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>4. T+0 Blurting</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Boş Kağıt 7 Altın Eşik Listesi
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('MOCK_EXAM_STRATEGY')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taskType === 'MOCK_EXAM_STRATEGY'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>5. Deneme &amp; 108 Net Koçu</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      16 Branş &amp; SWSPS Taktik Planı
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('CUSTOM')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taskType === 'CUSTOM'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                      <span>6. Serbest DUS Sorgusu</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Özel Klinik / Akademik Soru Sor
                    </div>
                  </button>
                </div>
              </div>

              {/* Kilitli Sistem Parametre Şeridi (Max Token 32.768 & Reasoning MAX & Temperature 0.20 — Değiştirilemez) */}
              <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold">Maksimum Token Kapasitesi</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      Kilitli
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-sm font-extrabold text-indigo-300 tabular-nums">
                      32.768 Token (32K)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Üst Limit</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold">Reasoning Effort (Muhakeme)</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      Kilitli
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-sm font-extrabold text-emerald-300 uppercase">
                      MAX (Tam Derinlik)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Derin Otopsi</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold">Temperature (Klinik Kesinlik)</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      Kilitli
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-sm font-extrabold text-sky-300 tabular-nums">
                      0.20 (Deterministik)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Sıfır Halüsinasyon</span>
                  </div>
                </div>
              </div>

              {/* Ek Bağlam / Hata Notu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {taskType === 'CUSTOM'
                    ? 'Sormak İstediğiniz DUS Sorusu / Klinik Vaka'
                    : 'Odaklanılacak Alt Başlık, Karıştırılan Çeldirici veya Özel Not (Opsiyonel)'}
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="Örn: Gama-1 ve Gama-2 fazlarının korozyon direncini, Kennedy Sınıf I indirekt tutucu hattını veya PTCH1/MAML2 translokasyonlarını kıyasla..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                  <span>Master Prompt: Aktif ({modelConfig.masterSystemPrompt.length} krk)</span>
                  <span>·</span>
                  <span>Canlı Telemetri: {modelConfig.injectLiveTelemetryContext ? 'Açık' : 'Kapalı'}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>DeepSeek v4.1 ({modelConfig.maxCompletionTokens} Token) Üretiyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>DeepSeek v4.1 Flash ile Üret</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Hata veya Sonuç Çıktısı */}
            {error && (
              <div className="mx-6 mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            {result && (
              <div className="px-6 pb-6 space-y-3">
                <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-950">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>DeepSeek v4.1 Flash Çıktısı</span>
                      <span className="text-[10px] font-mono font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200 text-slate-700 tabular-nums">
                        Toplam: {result.usage.totalTokens} token (Prompt: {result.usage.promptTokens} · Yanıt: {result.usage.completionTokens} · Düşünme: {result.usage.reasoningTokens} · Cache: {result.usage.cachedTokens})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {result.reasoningContent && (
                        <button
                          type="button"
                          onClick={() => setShowReasoning(prev => !prev)}
                          className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-md text-xs font-semibold flex items-center gap-1"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          <span>{showReasoning ? 'Düşünmeyi Gizle' : 'Düşünme Zinciri'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>

                      {selectedTopic && (
                        <button
                          type="button"
                          onClick={handleSaveToUnit}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1"
                        >
                          {savedToUnit ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Üniteye Kaydedildi</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Ünite Yama Notuna Ekle</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {showReasoning && result.reasoningContent && (
                    <div className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap max-h-44 overflow-y-auto border border-slate-700">
                      <div className="text-emerald-400 font-bold mb-1">
                        [DeepSeek v4.1 İçsel Muhakeme Zinciri (reasoning_content)]:
                      </div>
                      {result.reasoningContent}
                    </div>
                  )}

                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-sans bg-white p-3.5 rounded-lg border border-indigo-100">
                    {result.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            SEKME 2: MASTER PROMPT STÜDYOSU VE MODEL HİPERPARAMETRE AYARLARI
           =================================================================== */}
        {activeTab === 'MASTER_SETTINGS' && (
          <div className="p-6 space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  DeepSeek v4.1 Flash (1017) Master System Prompt &amp; Hiperparametre Yapılandırması
                </h3>
                <p className="text-xs text-slate-500">
                  Buradaki ayarlar otomatik olarak kaydedilir ve tüm AI çağrılarında (`system` rolü ve model parametreleri olarak) kullanılır.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {settingsSavedBanner && (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-semibold">
                    Varsayılan Ayarlar Yüklendi!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Varsayılanlara Sıfırla</span>
                </button>
              </div>
            </div>

            {/* Hazır Master Prompt Şablonları */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Hazır Master Prompt Şablonu Seçin
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MASTER_PROMPT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setModelConfig(prev => ({ ...prev, masterSystemPrompt: preset.prompt }))
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      modelConfig.masterSystemPrompt === preset.prompt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Master System Prompt Düzenleyici */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900">
                  Master System Prompt (`role: "system"`)
                </label>
                <span className="font-mono text-[11px] text-slate-500">
                  {modelConfig.masterSystemPrompt.length} karakter
                </span>
              </div>
              <textarea
                rows={9}
                aria-label="Master System Prompt"
                value={modelConfig.masterSystemPrompt}
                onChange={e =>
                  setModelConfig(prev => ({ ...prev, masterSystemPrompt: e.target.value }))
                }
                className="w-full p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] leading-relaxed rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Model Hiperparametreleri Grid (Max Token, Reasoning ve Temperature Kilitlidir) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-300">Max Completion Tokens</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
                <div className="font-mono font-extrabold text-sm text-indigo-300 tabular-nums">
                  32.768 (Kilitli)
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Maksimum tavan kapasite
                </span>
              </div>

              <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-300">Reasoning Effort</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
                <div className="font-mono font-extrabold text-sm text-emerald-300 uppercase">
                  MAX (Kilitli)
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Her zaman maksimum muhakeme
                </span>
              </div>

              <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-slate-300">Temperature</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
                <div className="font-mono font-extrabold text-sm text-sky-300 tabular-nums">
                  0.20 (Kilitli)
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  DUS Klinik Kesinlik İdeal Oranı
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Top P (0.1 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={1.0}
                  value={modelConfig.topP}
                  onChange={e =>
                    setModelConfig(prev => ({
                      ...prev,
                      topP: parseFloat(e.target.value) || 0.95
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Nucleus sampling
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Frequency Penalty
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={-2}
                  max={2}
                  value={modelConfig.frequencyPenalty}
                  onChange={e =>
                    setModelConfig(prev => ({
                      ...prev,
                      frequencyPenalty: parseFloat(e.target.value) || 0
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Presence Penalty
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={-2}
                  max={2}
                  value={modelConfig.presencePenalty}
                  onChange={e =>
                    setModelConfig(prev => ({
                      ...prev,
                      presencePenalty: parseFloat(e.target.value) || 0
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  KV Cache Preference (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={modelConfig.cachePreference}
                  onChange={e =>
                    setModelConfig(prev => ({
                      ...prev,
                      cachePreference: parseInt(e.target.value, 10) || 8
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={modelConfig.injectLiveTelemetryContext}
                    onChange={e =>
                      setModelConfig(prev => ({
                        ...prev,
                        injectLiveTelemetryContext: e.target.checked
                      }))
                    }
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span>Canlı Telemetri Enjekte Et</span>
                </label>
                <span className="text-[10px] text-slate-500 mt-1">
                  Son deneme neti ve Kova dağılımını Master Prompt&apos;a ekler
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('GENERATOR')}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              >
                Ayarları Onayla &amp; Üretim Kokpitine Geç
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
