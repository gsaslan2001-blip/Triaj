/**
 * Test Sonucu Girişi ve Bilişsel Kova Triyajı Modalı
 * T+0 Kalibrasyonu, T+3 Esas Triyaj, T+14 Doğrulama ve Cumartesi Onarımı
 */

import React, { useState, useMemo } from 'react';
import { useDUS } from '../context/DUSContext';
import { TopicUnit, TestStage } from '../types/dus';
import { evaluateT3Triage, evaluateT14Verification, evaluateSaturdayRepair } from '../utils/triage';
import { requestDeepSeekCompletion } from '../utils/deepseek';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Sparkles } from 'lucide-react';

interface TriageModalProps {
  topic: TopicUnit;
  stage?: TestStage;
  onClose: () => void;
}

export const TriageModal: React.FC<TriageModalProps> = ({ topic, stage: initialStage, onClose }) => {
  const { subjects, recordT0Completion, recordT3Triage, recordT14Verification, recordSaturdayRepair } = useDUS();

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

  // Default question counts by stage
  const defaultTotal = stage === 'T0_SAMPLING' ? 10 : stage === 'T3_MAIN' ? 40 : stage === 'T14_VERIFICATION' ? 20 : 30;

  const [totalQuestions, setTotalQuestions] = useState<number>(defaultTotal);
  const [correctCount, setCorrectCount] = useState<number>(Math.round(defaultTotal * 0.75));
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
    const newTotal = newStage === 'T0_SAMPLING' ? 10 : newStage === 'T3_MAIN' ? 40 : newStage === 'T14_VERIFICATION' ? 20 : 30;
    setTotalQuestions(newTotal);
    setCorrectCount(Math.round(newTotal * 0.75));
  };

  const wrongCount = Math.max(0, totalQuestions - correctCount);
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Live calculation preview
  const previewResult = useMemo(() => {
    if (stage === 'T3_MAIN') {
      return evaluateT3Triage(correctCount, totalQuestions);
    }
    if (stage === 'T14_VERIFICATION') {
      return evaluateT14Verification(correctCount, totalQuestions);
    }
    if (stage === 'SATURDAY_REPAIR') {
      return evaluateSaturdayRepair(correctCount, totalQuestions);
    }
    return null;
  }, [stage, correctCount, totalQuestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === 'T0_SAMPLING') {
      recordT0Completion(topic.id, correctCount, totalQuestions, notes);
    } else if (stage === 'T3_MAIN') {
      recordT3Triage(topic.id, correctCount, totalQuestions, notes);
    } else if (stage === 'T14_VERIFICATION') {
      recordT14Verification(topic.id, correctCount, totalQuestions, notes);
    } else if (stage === 'SATURDAY_REPAIR') {
      recordSaturdayRepair(topic.id, correctCount, totalQuestions, notes);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{subject?.name || 'Ders'}</span>
              <span>·</span>
              <span>Ünite {topic.unitNumber}</span>
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
              Sınav / Test Aşaması Seçimi
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleStageSelect('T0_SAMPLING')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  stage === 'T0_SAMPLING'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-medium ring-1 ring-sky-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-semibold">T+0 Adımlı Örnekleme</div>
                <div className="text-slate-500 text-[11px] mt-0.5">İlk kalibrasyon (10 soru)</div>
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
                <div className="font-semibold">T+3 Esas Kova Triyajı</div>
                <div className="text-slate-500 text-[11px] mt-0.5">3 gün gecikmeli (40 soru)</div>
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
                <div className="font-semibold">Sarı Kova T+14 Doğrulama</div>
                <div className="text-slate-500 text-[11px] mt-0.5">2. Soru Bankası (20 soru)</div>
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
                <div className="font-semibold">Cumartesi Onarım Testi</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Kırmızı Kova (30 soru)</div>
              </button>
            </div>
          </div>

          {/* Soru Sayıları Girişi */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
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
                  const val = parseInt(e.target.value) || 0;
                  setCorrectCount(Math.min(val, totalQuestions));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Dinamik Başarı & Triyaj Önizlemesi */}
          <div className="border rounded-lg p-3.5 bg-slate-50 border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Başarı Oranı: <span className="font-bold text-slate-900 font-mono text-sm">%{percentage}</span> ({correctCount}/{totalQuestions})
              </div>
              <div className="text-xs text-slate-500">
                Yanlış: <span className="font-semibold text-rose-600">{wrongCount}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  percentage >= 85
                    ? 'bg-emerald-500'
                    : percentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Triyaj Tahsis Kartı */}
            {previewResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                previewResult.bucket === 'GREEN'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : previewResult.bucket === 'YELLOW'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {previewResult.bucket === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {previewResult.bucket === 'YELLOW' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {previewResult.bucket === 'RED' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
                  <span>
                    {previewResult.bucket === 'GREEN' && 'Atanan Kova: YEŞİL KOVA (Taburcu)'}
                    {previewResult.bucket === 'YELLOW' && 'Atanan Kova: SARI KOVA (T+14 Müşahede)'}
                    {previewResult.bucket === 'RED' && 'Atanan Kova: KIRMIZI KOVA (Cumartesi Yoğun Bakım)'}
                  </span>
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  <span className="font-semibold">Teşhis:</span> {previewResult.clinicalDiagnosis}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  <span className="font-semibold">Gelecek Eylem:</span> {previewResult.recommendedAction}
                </div>
              </div>
            )}

            {stage === 'T0_SAMPLING' && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950">
                <div className="font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                  T+0 İlk Kodlama Doktrini
                </div>
                <div className="text-[11px] text-sky-800 mt-1">
                  10 soruluk test tamamlandığında, kalan 40 soru 3 gün sonrasına (T+3) kilitlenecektir.
                </div>
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
              Sonucu Kaydet ve Triyaja İşle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
