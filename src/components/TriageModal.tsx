/**
 * Test Sonucu Girişi ve Bilişsel Kova Triyajı Modalı
 * Doktrin: T+0 (Konu + 20 Soru Kalibrasyon -> Kova Belirlemez!), T+3 Esas Triyaj (Yeşil/Sarı/Kırmızı Kutu Ayrımı),
 * T+14 Sarı Kova Doğrulama, Cumartesi Kırmızı Kova Onarımı ve Deneme Yanlışı T+3 (15 Soru) Doğrulama
 */

import React, { useState, useMemo } from 'react';
import { useDUS } from '../context/DUSContext';
import { TopicUnit, TestStage } from '../types/dus';
import {
  evaluateT0Calibration,
  evaluateT3Triage,
  evaluateT14Verification,
  evaluateSaturdayRepair,
  evaluateExamT3Verification
} from '../utils/triage';
import { requestDeepSeekCompletion } from '../utils/deepseek';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Sparkles,
  Calendar,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

interface TriageModalProps {
  topic: TopicUnit;
  stage?: TestStage;
  onClose: () => void;
}

export const TriageModal: React.FC<TriageModalProps> = ({ topic, stage: initialStage, onClose }) => {
  const {
    subjects,
    todayStr,
    recordT0Completion,
    recordT3Triage,
    recordT14Verification,
    recordSaturdayRepair,
    recordExamT3Verification
  } = useDUS();

  const subject = subjects.find(s => s.id === topic.subjectId);

  // Default stage inference
  const defaultStage: TestStage = useMemo(() => {
    if (initialStage) return initialStage;
    if (topic.status === 'NOT_STARTED') return 'T0_SAMPLING';
    if (topic.status === 'T0_DONE') return 'T3_MAIN';
    if (topic.currentBucket === 'YELLOW') return 'T14_VERIFICATION';
    if (topic.currentBucket === 'RED') return 'SATURDAY_REPAIR';
    return 'T3_MAIN';
  }, [initialStage, topic]);

  const [stage, setStage] = useState<TestStage>(defaultStage);
  const [actionDate, setActionDate] = useState<string>(todayStr);

  const getDefaultTotalForStage = (targetStage: TestStage): number => {
    if (targetStage === 'T0_SAMPLING') return 20;
    if (targetStage === 'T3_MAIN') return 40;
    if (targetStage === 'T14_VERIFICATION') return 20;
    if (targetStage === 'SATURDAY_REPAIR') return 30;
    if (targetStage === 'EXAM_T3_VERIFICATION') return 15;
    return 40;
  };

  const initialTotal = getDefaultTotalForStage(defaultStage);
  const [totalQuestions, setTotalQuestions] = useState<number>(initialTotal);
  const [correctCount, setCorrectCount] = useState<number>(Math.round(initialTotal * 0.8));
  const [notes, setNotes] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const handleGenerateAIPatch = async () => {
    setIsGeneratingAI(true);
    try {
      const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const res = await requestDeepSeekCompletion({
        taskType: 'TRIAGE_PATCH',
        subjectCode: subject?.code,
        subjectName: subject?.name,
        unitTitle: topic.title,
        scoreSummary: `${correctCount}/${totalQuestions} (%${pct})`,
        userNotes: notes,
        reasoningEffort: 'max'
      });
      if (res.content) {
        setNotes(prev => (prev.trim() ? `${prev.trim()}\n\n${res.content}` : res.content));
      }
    } catch (err) {
      console.error('DeepSeek patch generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle stage change
  const handleStageSelect = (newStage: TestStage) => {
    setStage(newStage);
    const newTotal = getDefaultTotalForStage(newStage);
    setTotalQuestions(newTotal);
    setCorrectCount(Math.round(newTotal * 0.8));
  };

  const wrongCount = Math.max(0, totalQuestions - correctCount);
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Live calculation preview
  const previewResult = useMemo(() => {
    if (stage === 'T0_SAMPLING') {
      return evaluateT0Calibration(correctCount, totalQuestions, actionDate);
    }
    if (stage === 'T3_MAIN') {
      return evaluateT3Triage(correctCount, totalQuestions, actionDate);
    }
    if (stage === 'T14_VERIFICATION') {
      return evaluateT14Verification(
        correctCount,
        totalQuestions,
        actionDate,
        Boolean(topic.promotedFromRed)
      );
    }
    if (stage === 'SATURDAY_REPAIR') {
      return evaluateSaturdayRepair(correctCount, totalQuestions, actionDate);
    }
    if (stage === 'EXAM_T3_VERIFICATION') {
      return evaluateExamT3Verification(correctCount, totalQuestions, actionDate);
    }
    return null;
  }, [stage, correctCount, totalQuestions, actionDate, topic.promotedFromRed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === 'T0_SAMPLING') {
      recordT0Completion(topic.id, correctCount, totalQuestions, notes, actionDate);
    } else if (stage === 'T3_MAIN') {
      recordT3Triage(topic.id, correctCount, totalQuestions, notes, actionDate);
    } else if (stage === 'T14_VERIFICATION') {
      recordT14Verification(topic.id, correctCount, totalQuestions, notes, actionDate);
    } else if (stage === 'SATURDAY_REPAIR') {
      recordSaturdayRepair(topic.id, correctCount, totalQuestions, notes, actionDate);
    } else if (stage === 'EXAM_T3_VERIFICATION') {
      recordExamT3Verification(topic.id, correctCount, totalQuestions, notes, actionDate);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{subject?.name || 'Ders'}</span>
              <span>·</span>
              <span>Ünite {topic.unitNumber}</span>
              {topic.topicCode && (
                <>
                  <span>·</span>
                  <span className="font-mono text-indigo-700">{topic.topicCode}</span>
                </>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{topic.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Aşama Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              1. Çalışma / Triyaj Aşaması Seçimi (PDF Doktrin Akışı)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleStageSelect('T0_SAMPLING')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  stage === 'T0_SAMPLING'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-medium ring-1 ring-sky-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>1. T+0 Konu Çalışması + 20 Soru</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[10px]">
                    Kova Belirlemez
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  İlk kalibrasyon (20 soru) — Sadece T+3 gününü kilitler
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStageSelect('T3_MAIN')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  stage === 'T3_MAIN'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-medium ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>2. T+3 Esas Kova Triyajı</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px]">
                    Ana Karar Noktası
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Çalıştıktan 3 gün sonra (40 soru) — Yeşil / Sarı / Kırmızı ayrımı
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStageSelect('T14_VERIFICATION')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  stage === 'T14_VERIFICATION'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-medium ring-1 ring-amber-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>3. Sarı Kova T+14 Doğrulama</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px]">
                    {topic.promotedFromRed ? '3. Banka' : '2. Banka'}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  5 dk yıldızlı tekrar + 20-25 soru (≥%85 Yeşil Taburcu)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStageSelect('SATURDAY_REPAIR')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  stage === 'SATURDAY_REPAIR'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>4. Cumartesi Kırmızı Kova Onarımı</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px]">
                    ≥%80 Sarıya Terfi
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  25 dk Boş Kağıt inşası + 2. Bankadan 30 soru
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStageSelect('EXAM_T3_VERIFICATION')}
                className={`sm:col-span-2 p-2.5 rounded-lg border text-left transition-colors ${
                  stage === 'EXAM_T3_VERIFICATION'
                    ? 'border-purple-500 bg-purple-50 text-purple-950 font-medium ring-1 ring-purple-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>5. Deneme Yanlışı T+3 Doğrulama Testi (PDF Madde 7.3)</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[10px]">
                    15 Soru Mini Kontrol
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Deneme hatasından 3 gün sonra 15 soru: ≥13 doğru (≥%85) dosya kapanır, ≥3 yanlışta ünite Cumartesi Kırmızı Kovaya atılır
                </div>
              </button>
            </div>
          </div>

          {/* Tarih & Soru Sayıları Girişi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label htmlFor="action-date" className="block text-xs font-semibold text-slate-700 mb-1">
                İşlem / Çözüm Tarihi
              </label>
              <div className="relative">
                <input
                  id="action-date"
                  type="date"
                  value={actionDate}
                  onChange={e => setActionDate(e.target.value || todayStr)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="total-q" className="block text-xs font-semibold text-slate-700 mb-1">
                Toplam Çözülen Soru
              </label>
              <input
                id="total-q"
                type="number"
                min="1"
                max="200"
                value={totalQuestions}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setTotalQuestions(val);
                  if (correctCount > val) setCorrectCount(val);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="correct-q" className="block text-xs font-semibold text-slate-700 mb-1">
                Doğru Soru Sayısı
              </label>
              <input
                id="correct-q"
                type="number"
                min="0"
                max={totalQuestions}
                value={correctCount}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  const safeVal = Number.isNaN(val) ? 0 : Math.max(0, val);
                  setCorrectCount(Math.min(safeVal, totalQuestions));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Hızlı Skor Preset Butonları (Kullanım Kolaylığı İçin) */}
          {stage === 'T3_MAIN' && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500 font-medium">Hızlı Kutu Simülasyonu:</span>
              <button
                type="button"
                onClick={() => {
                  setTotalQuestions(40);
                  setCorrectCount(36);
                }}
                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition-colors"
              >
                🟢 Yeşil Kutu (36/40 · %90)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalQuestions(40);
                  setCorrectCount(31);
                }}
                className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors"
              >
                🟡 Sarı Kutu (31/40 · %78)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalQuestions(40);
                  setCorrectCount(24);
                }}
                className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold transition-colors"
              >
                🔴 Kırmızı Kutu (24/40 · %60)
              </button>
            </div>
          )}

          {/* Dinamik Başarı & Triyaj Önizlemesi */}
          <div className="border rounded-lg p-3.5 bg-slate-50 border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                {stage === 'T0_SAMPLING' ? 'T+0 Kalibrasyon Oranı (Kova Belirlemez):' : 'Test Başarı Oranı:'}{' '}
                <span className="font-bold text-slate-900 font-mono text-sm">%{percentage}</span> ({correctCount}/{totalQuestions})
              </div>
              <div className="text-xs text-slate-500">
                Yanlış: <span className="font-semibold text-rose-600">{wrongCount}</span>
              </div>
            </div>

            {/* Progress bar — T+0'da mavi kalibrasyon barı, diğerlerinde Yeşil/Sarı/Kırmızı kova barı */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stage === 'T0_SAMPLING'
                    ? 'bg-sky-500'
                    : previewResult?.bucket === 'GREEN'
                    ? 'bg-emerald-500'
                    : previewResult?.bucket === 'YELLOW'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* T+0 Kalibrasyon Doktrin Kutusu (Kova Ataması Yapılmaz!) */}
            {stage === 'T0_SAMPLING' && previewResult && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 space-y-1.5">
                <div className="font-bold flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>T+0 Kalibrasyon Kuralı (20 Soru): Buradaki İstatistik Kova Rengini Belirlemez!</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[10px]">
                    Kova: HENÜZ YOK (T+3 Bekliyor)
                  </span>
                </div>
                <div className="text-[11px] text-sky-900 leading-relaxed">
                  <strong>Doktrin Akışı:</strong> T+0 günü konuyu çalışıp çözdüğünüz 20 soruluk kalibrasyon testi sadece ilk kodlamayı tamamlar; kısa süreli hafıza yanılsaması nedeniyle buradaki doğru/yanlış sayısı <strong>Yeşil, Sarı veya Kırmızı kutu ataması yapmaz</strong>.
                </div>
                <div className="text-[11px] text-sky-900 leading-relaxed flex items-center gap-1.5 pt-1 border-t border-sky-200/70">
                  <Calendar className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                  <span>
                    <strong>Kilitlenen Esas Karar Tarihi (T+3):</strong>{' '}
                    <span className="font-mono font-bold underline">{previewResult.nextScheduledDate}</span> günü (3 gün sonra) konuyu tekrar okumadan çözülecek T+3 testinde Yeşil çıkarsa konu bir daha tekrar sırasına girmez; Sarı veya Kırmızı çıkarsa kaynak protokolü uygulanır.
                  </span>
                </div>
              </div>
            )}

            {/* T+3 / T+14 / Cumartesi / Deneme T+3 Triyaj Tahsis Kartı */}
            {stage !== 'T0_SAMPLING' && previewResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  previewResult.bucket === 'GREEN'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : previewResult.bucket === 'YELLOW'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 font-bold">
                  <div className="flex items-center gap-1.5">
                    {previewResult.bucket === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {previewResult.bucket === 'YELLOW' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {previewResult.bucket === 'RED' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
                    <span>
                      {previewResult.bucket === 'GREEN' &&
                        'Atanan Kutu: 🟢 YEŞİL KOVA (Taburcu — Tekrar Sırasına Bir Daha Girmez!)'}
                      {previewResult.bucket === 'YELLOW' &&
                        'Atanan Kutu: 🟡 SARI KOVA (Müşahede — T+14 Doğrulama Kuyruğu)'}
                      {previewResult.bucket === 'RED' &&
                        'Atanan Kutu: 🔴 KIRMIZI KOVA (Yoğun Bakım — Cumartesi Onarım Bloğu)'}
                    </span>
                  </div>
                  {previewResult.nextScheduledDate ? (
                    <span className="px-2 py-0.5 rounded bg-white/80 font-mono text-[10px] border border-current/20">
                      Hedef Tarih: {previewResult.nextScheduledDate}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Takvimden Düşürüldü
                    </span>
                  )}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  <span className="font-semibold">Klinik Teşhis:</span> {previewResult.clinicalDiagnosis}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  <span className="font-semibold">PDF Protokol Aksiyonu:</span> {previewResult.recommendedAction}
                </div>
                {previewResult.recommendedBank && (
                  <div className="text-[11px] leading-relaxed opacity-90 flex items-center gap-1.5 pt-1 border-t border-current/10">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <span className="font-semibold">Kaynak / Soru Bankası Kuralı:</span>{' '}
                      {previewResult.recommendedBank}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Klinik Not / Hata Yama Notu + DeepSeek v4.1 Flash Yardımcı Butonu */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="triage-notes" className="block text-xs font-semibold text-slate-700">
                Hata Otopsisi &amp; Nokta Atışı Yama Notu (Opsiyonel)
              </label>
              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={handleGenerateAIPatch}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {isGeneratingAI ? 'DeepSeek v4.1 Üretiyor...' : 'DeepSeek v4.1 ile Yama & Cloze Üret'}
                </span>
              </button>
            </div>
            <textarea
              id="triage-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Örn: Evre III ve IV ayrımındaki çiğneme disfonksiyonu kriteri kaçtı, 10 dk ana kitaptan okundu..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Form Aksiyonları */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {stage === 'T0_SAMPLING'
                ? 'T+0 (20 Soru) Kaydet ve T+3 Tarihini Kilitle'
                : 'Sonucu Kaydet ve Kova Triyajına İşle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
