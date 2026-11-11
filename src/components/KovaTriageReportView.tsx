/**
 * Bilişsel Kova Triyajı Yönetici Raporu, Kovalara Konu Ekleme, Sarı/Yeşil/Kırmızı Kutu Ayrımı
 * ve Cumartesi Yapılacaklar Operasyon Masası (PDF Madde 5.1, 5.2, 7.3, 8.3 & 8.4)
 */

import React, { useState, useMemo } from 'react';
import { useDUS } from '../context/DUSContext';
import { TopicUnit, TestStage } from '../types/dus';
import { getNextSaturday, addDays } from '../utils/triage';
import { TriageModal } from './TriageModal';
import {
  Printer,
  Copy,
  Check,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Trash2,
  PlusCircle,
  Calendar,
  Wrench,
  Sparkles,
  Layers
} from 'lucide-react';

export const KovaTriageReportView: React.FC = () => {
  const {
    subjects,
    report,
    topics,
    todayStr,
    clearTopicScheduledTask,
    rescheduleTopicTask,
    assignTopicBucketDirectly,
    navigateToSubject
  } = useDUS();

  const [copied, setCopied] = useState(false);
  const [activeModalState, setActiveModalState] = useState<{
    topic: TopicUnit;
    stage?: TestStage;
  } | null>(null);

  // Kovalara Hızlı Konu Ekleme & Akış Başlatıcı State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'B01');
  const subjectTopics = useMemo(
    () => topics.filter(t => t.subjectId === selectedSubjectId),
    [topics, selectedSubjectId]
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [quickActionDate, setQuickActionDate] = useState<string>(todayStr);

  // Seçili ders değiştiğinde ilk üniteyi seç
  const effectiveSelectedTopic = useMemo(() => {
    const found = subjectTopics.find(t => t.id === selectedTopicId);
    return found || subjectTopics[0] || null;
  }, [subjectTopics, selectedTopicId]);

  // Kutu Bazlı Filtrelenmiş Üniteler (T+0/T+3 Bekleyen, Yeşil, Sarı, Kırmızı)
  const t0WaitingTopics = useMemo(
    () =>
      topics.filter(
        t => t.status === 'T0_DONE' && t.currentBucket === 'NONE' && !t.discharged
      ),
    [topics]
  );

  const greenBoxTopics = useMemo(
    () => topics.filter(t => t.currentBucket === 'GREEN' || t.discharged),
    [topics]
  );

  const yellowBoxTopics = useMemo(
    () => topics.filter(t => t.currentBucket === 'YELLOW' && !t.discharged),
    [topics]
  );

  const redBoxTopics = useMemo(
    () => topics.filter(t => t.currentBucket === 'RED' && !t.discharged),
    [topics]
  );

  // Cumartesi Yapılacaklar Takip Checklist State (Yerel oturum kontrolü)
  const upcomingSaturday = useMemo(() => getNextSaturday(todayStr), [todayStr]);
  const [saturdayStepsDone, setSaturdayStepsDone] = useState<Record<string, boolean>>({
    'sat-block1-anki': false,
    'sat-block3-wed-t3': false,
    'sat-block4-branch': false
  });
  const [redFreeRecallDone, setRedFreeRecallDone] = useState<Record<string, boolean>>({});

  const toggleSaturdayStep = (key: string) => {
    setSaturdayStepsDone(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRedFreeRecall = (topicId: string) => {
    setRedFreeRecallDone(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  // Markdown formatında yönetici özeti kopyalama
  const handleCopySummary = () => {
    const md = `
# DUS 2027 BİLİŞSEL KOVA TRİYAJI YÖNETİCİ RAPORU (${todayStr})
- Genel Depolama Gücü Skoru: %${report.overallRetentionIndex} / 100
- Temel Bilimler Depolama İndeksi: %${report.temelRetentionIndex} (40 Soru / %33.3)
- Klinik Bilimler Depolama İndeksi: %${report.klinikRetentionIndex} (80 Soru / %66.7)

## Kutu & Kova Dağılımı:
- 🔵 T+0 Tamamlandı / T+3 Kararı Bekleyen (20 Soru Kalibrasyon Çözüldü): ${t0WaitingTopics.length} Ünite
- 🟢 Yeşil Kutu (Taburcu - Tekrar Sırasına Bir Daha Girmez): ${report.greenBucket} Ünite
- 🟡 Sarı Kutu (Müşahede - T+14 Doğrulama): ${report.yellowBucket} Ünite
- 🔴 Kırmızı Kutu (Yoğun Bakım - Cumartesi Kova Onarım Bloğu): ${report.redBucket} Ünite

## Acil Durum Sigortası (PDF Madde 8.4):
- Durum: ${report.redAlarmActive ? '🚨 ALARM (Kırmızı kova >= 3 ünite, yeni konu durdurulmalı!)' : '🟢 GÜVENLİ (Kırmızı kova limit altında)'}

## Acil Aksiyonlar:
${report.urgentTasks.map(t => `- [${t.priority}] ${t.subjectName} - ${t.topicTitle}: ${t.actionType} (${t.targetDate})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. Rapor Başlığı ve Dışa Aktarma Aksiyonları */}
      <div className="apple-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Rapor Tarihi: {todayStr}</span>
            <span aria-hidden="true">·</span>
            <span>PDF Doktrin Akışı: T+0 (20 Soru) → T+3 Kova Ayrımı → Cumartesi Onarımı</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
            Bilişsel Kova Triyajı, Sarı/Yeşil/Kırmızı Kutu Ayrımı &amp; Cumartesi Masası
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            T+0 günü 20 soruluk çözüm istatistiği kova belirlemez; esas karar T+3 gününde verilir. Yeşil kutuya giren ünite taburcu olur ve tekrar sırasına bir daha girmez.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Kopyalandı!' : 'Özeti Kopyala'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Raporu Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Kovalara Konu Ekleme & T+0 -> T+3 Akış Başlatıcı Panel */}
      <div className="apple-card p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Kovalara Konu Ekle &amp; T+0 → T+3 Triyaj Akışı Başlatıcı
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              İstediğiniz dersi ve üniteyi seçerek önce <strong>T+0 (Konu + 20 Soru Kalibrasyon)</strong> ile 3 gün sonrasına kilitleyebilir veya doğrudan <strong>T+3 Kova Triyajı</strong> ile Yeşil / Sarı / Kırmızı kutuya atayabilirsiniz.
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md self-start md:self-auto">
            T+0 = 20 Soru (Kova Belirlemez) · T+3 = Esas Karar Noktası
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label htmlFor="quick-subject-select" className="block text-xs font-semibold text-slate-700 mb-1">
              1. Branş / Ders Seçin (14 Blok)
            </label>
            <select
              id="quick-subject-select"
              value={selectedSubjectId}
              onChange={e => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopicId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.questionCount} Soru)
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label htmlFor="quick-topic-select" className="block text-xs font-semibold text-slate-700 mb-1">
              2. Konu / Ünite Seçin (227 Müfredat Ünitesi)
            </label>
            <select
              id="quick-topic-select"
              value={effectiveSelectedTopic?.id || ''}
              onChange={e => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {subjectTopics.map(t => {
                const statusBadge =
                  t.currentBucket === 'GREEN' || t.discharged
                    ? '🟢 Yeşil (Taburcu)'
                    : t.currentBucket === 'YELLOW'
                    ? '🟡 Sarı Kova (T+14)'
                    : t.currentBucket === 'RED'
                    ? '🔴 Kırmızı Kova (Cumartesi)'
                    : t.status === 'T0_DONE'
                    ? `🔵 T+3 Bekliyor (${t.t3DueDate || ''})`
                    : '⚪ Başlanmadı';
                return (
                  <option key={t.id} value={t.id}>
                    [{t.topicCode || `Ünite ${t.unitNumber}`}] {t.title} — ({statusBadge})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="quick-action-date" className="block text-xs font-semibold text-slate-700 mb-1">
              3. Çalışma / Çözüm Tarihi
            </label>
            <input
              id="quick-action-date"
              type="date"
              value={quickActionDate}
              onChange={e => setQuickActionDate(e.target.value || todayStr)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {effectiveSelectedTopic && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">{effectiveSelectedTopic.title}:</span>{' '}
              {effectiveSelectedTopic.currentBucket === 'GREEN' || effectiveSelectedTopic.discharged ? (
                <span className="text-emerald-700 font-semibold">
                  🟢 Yeşil Kutuda (Taburcu — Tekrar sırasına bir daha girmez)
                </span>
              ) : effectiveSelectedTopic.currentBucket === 'YELLOW' ? (
                <span className="text-amber-700 font-semibold">
                  🟡 Sarı Kutuda (T+14 Doğrulama Tarihi: {effectiveSelectedTopic.t14DueDate || '-'})
                </span>
              ) : effectiveSelectedTopic.currentBucket === 'RED' ? (
                <span className="text-rose-700 font-semibold">
                  🔴 Kırmızı Kutuda (Cumartesi Onarım Tarihi: {effectiveSelectedTopic.saturdayRepairDate || '-'})
                </span>
              ) : effectiveSelectedTopic.status === 'T0_DONE' ? (
                <span className="text-sky-700 font-semibold">
                  🔵 T+0 (20 Soru) Çözüldü — Kova Kararı T+3 Gününde ({effectiveSelectedTopic.t3DueDate}) Verilecek
                </span>
              ) : (
                <span className="text-slate-500">
                  Henüz çalışılmadı. T+0 (Konu + 20 soru) ile akışı başlatın.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  assignTopicBucketDirectly(effectiveSelectedTopic.id, 'T0_DONE', quickActionDate)
                }
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                1. T+0 Çalıştım + 20 Soru Çözdüm (T+3 Kilitle: {addDays(quickActionDate, 3)})
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveModalState({ topic: effectiveSelectedTopic, stage: 'T3_MAIN' })
                }
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                2. T+3 Skor Gir &amp; Kova Belirle
              </button>

              <button
                type="button"
                onClick={() =>
                  assignTopicBucketDirectly(effectiveSelectedTopic.id, 'GREEN', quickActionDate)
                }
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg transition-colors"
                title="T+3 ≥%85 Başarı: Yeşil Kutuya Ata (Taburcu — Bir daha tekrar sırasına girmez)"
              >
                🟢 Yeşil Kutu (Taburcu)
              </button>

              <button
                type="button"
                onClick={() =>
                  assignTopicBucketDirectly(effectiveSelectedTopic.id, 'YELLOW', quickActionDate)
                }
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold rounded-lg transition-colors"
                title="T+3 %70-%84 Başarı: Sarı Kutuya Ata (T+14 Doğrulama Kuyruğu)"
              >
                🟡 Sarı Kutu (T+14)
              </button>

              <button
                type="button"
                onClick={() =>
                  assignTopicBucketDirectly(effectiveSelectedTopic.id, 'RED', quickActionDate)
                }
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold rounded-lg transition-colors"
                title="T+3 <%70 Başarı: Kırmızı Kutuya Ata (Cumartesi Kova Onarım Bloğu)"
              >
                🔴 Kırmızı Kutu (Cumartesi)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Acil Durum Sigortası Denetim Bandı (Doktrin Madde 8.4) */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          report.redAlarmActive
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}
      >
        {report.redAlarmActive ? (
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <div className="text-xs">
          <div className="font-bold text-sm">
            {report.redAlarmActive
              ? `🚨 ACİL DURUM SİGORTASI AKTİF: Kırmızı Kovada ${report.redBucket} Ünite Birikti!`
              : '🟢 Bilişsel Akış Sağlıklı: Kırmızı Kova Tolerans Sınırı Altında'}
          </div>
          <p className="mt-1 leading-relaxed opacity-90">
            {report.redAlarmActive
              ? 'Doktrin Madde 8.4 Kuralı: "Bir hafta içinde Kırmızı Kovaya (<%70 doğru) düşen ünite sayısı 3\'ü geçerse, yeni konular durdurulmalıdır." Kırmızı Kovadaki üniteler Cumartesi Onarım Bloğunda temizlenmeden yeni konu hızı artırılmamalıdır.'
              : 'Kırmızı kovadaki ünite sayısı güvenli sınırda (maksimum 2). Yeni konu edinimine ve T+3 gecikmeli geri çağırma döngüsüne normal planda devam edebilirsiniz.'}
          </p>
        </div>
      </div>

      {/* 4. Sarı / Yeşil / Kırmızı Kutu Ayrımı & T+0->T+3 Akış Panosu (4 Kutu Görsel Ayrımı) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Sarı / Yeşil / Kırmızı Kutu Ayrımı ve T+0 → T+3 Karar Mimarisi</span>
            </h3>
            <p className="text-xs text-slate-500">
              Her kutunun PDF doktrinindeki çalışma kuralı ve içinde bulunan aktif üniteler aşağıda canlı olarak ayrıştırılmıştır.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KUTU 0: T+0 Çalışıldı / T+3 Kararı Bekleyenler */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                  1. T+0 Kalibrasyon (T+3 Bekleyen)
                </span>
                <Clock className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1.5 text-sky-950 flex items-baseline gap-1.5 tabular-nums">
                <span>{t0WaitingTopics.length}</span>
                <span className="text-xs font-normal text-sky-800">Ünite T+3 Sırasında</span>
              </div>
              <div className="text-[11px] text-sky-900 mt-1 font-semibold bg-sky-100/80 px-2 py-1 rounded">
                T+0: Konu + 20 Soru (İstatistik Kova Belirlemez!)
              </div>
              <p className="text-[11px] text-sky-800 mt-2 leading-relaxed">
                T+0 günü çözülen 20 soru sadece ilk kodlamayı yapar. Kova rengi <strong>3 gün sonraki (T+3)</strong> soru çözümündeki performansa göre belirlenir.
              </p>

              {/* İçindeki Üniteler */}
              <div className="mt-3 pt-2.5 border-t border-sky-200/80 space-y-1.5 max-h-48 overflow-y-auto">
                {t0WaitingTopics.length === 0 ? (
                  <div className="text-[11px] text-sky-700/70 italic py-2">
                    Şu an T+3 kararını bekleyen ünite yok.
                  </div>
                ) : (
                  t0WaitingTopics.map(t => (
                    <div
                      key={t.id}
                      className="bg-white p-2 rounded-lg border border-sky-200 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          T+0: {t.t0Date} → T+3: <strong className="text-sky-700">{t.t3DueDate}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalState({ topic: t, stage: 'T3_MAIN' })}
                        className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded text-[10px] shrink-0"
                      >
                        T+3 Çöz
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* KUTU 1: YEŞİL KUTU (TABURCU) */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  2. 🟢 Yeşil Kutu (Taburcu)
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1.5 text-emerald-950 flex items-baseline gap-1.5 tabular-nums">
                <span>{report.greenBucket}</span>
                <span className="text-xs font-normal text-emerald-800">Ünite Mezun Oldu</span>
              </div>
              <div className="text-[11px] text-emerald-900 mt-1 font-semibold bg-emerald-100/80 px-2 py-1 rounded">
                T+3: ≥%85 Başarı (40 Soruda 34-40 Doğru)
              </div>
              <p className="text-[11px] text-emerald-800 mt-2 leading-relaxed">
                <strong>Aşama 1:</strong> Yanlış çıkan 1-6 sorunun paragrafı 5-10 dk okunur.{' '}
                <strong>Aşama 2:</strong> Konu <strong>bir daha tekrar sırasına GİRMEZ!</strong> 2. Soru Bankası çözülmez; sadece ders bitince karma branş denemelerinde görülür.
              </p>

              {/* İçindeki Üniteler */}
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 space-y-1.5 max-h-48 overflow-y-auto">
                {greenBoxTopics.length === 0 ? (
                  <div className="text-[11px] text-emerald-700/70 italic py-2">
                    Henüz Yeşil Kutuya (Taburcu) geçen ünite yok.
                  </div>
                ) : (
                  greenBoxTopics.map(t => (
                    <div
                      key={t.id}
                      className="bg-white p-2 rounded-lg border border-emerald-200 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[10px] text-emerald-700 font-mono">
                          Taburcu (Tekrar Kuyruğuna Girmez) {t.t3Score ? `· %${t.t3Score.percentage}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearTopicScheduledTask(t.id)}
                        className="px-1.5 py-1 text-slate-400 hover:text-rose-600 rounded text-[10px] shrink-0"
                        title="Sıfırla"
                      >
                        Sıfırla
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* KUTU 2: SARI KUTU (MÜŞAHEDE - T+14) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  3. 🟡 Sarı Kutu (Müşahede)
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1.5 text-amber-950 flex items-baseline gap-1.5 tabular-nums">
                <span>{report.yellowBucket}</span>
                <span className="text-xs font-normal text-amber-800">Ünite T+14 Takibinde</span>
              </div>
              <div className="text-[11px] text-amber-900 mt-1 font-semibold bg-amber-100/80 px-2 py-1 rounded">
                T+3: %70-%84 Başarı (40 Soruda 28-33 Doğru)
              </div>
              <p className="text-[11px] text-amber-800 mt-2 leading-relaxed">
                <strong>Aşama 1:</strong> Yanlış alt başlıklar 15 dk okunur ve yıldızlanır.{' '}
                <strong>Aşama 2 (T+14):</strong> 14 gün sonra yıldızlı yerlere 5 dk göz atılır + 2. Soru Bankasından (Kırmızıdan terfi ise 3. Bankadan) 20-25 soru çözülür (≥%85 Yeşile mezun olur, &lt;%70 Kırmızıya düşer).
              </p>

              {/* İçindeki Üniteler */}
              <div className="mt-3 pt-2.5 border-t border-amber-200/80 space-y-1.5 max-h-48 overflow-y-auto">
                {yellowBoxTopics.length === 0 ? (
                  <div className="text-[11px] text-amber-700/70 italic py-2">
                    Şu an Sarı Kutuda (T+14 Müşahede) ünite yok.
                  </div>
                ) : (
                  yellowBoxTopics.map(t => (
                    <div
                      key={t.id}
                      className="bg-white p-2 rounded-lg border border-amber-200 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[10px] text-amber-800 font-mono">
                          T+14: <strong>{t.t14DueDate || '-'}</strong> · {t.promotedFromRed ? '3. Banka' : '2. Banka'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalState({ topic: t, stage: 'T14_VERIFICATION' })}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[10px] shrink-0"
                      >
                        T+14 Çöz
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* KUTU 3: KIRMIZI KUTU (CUMARTESİ YOĞUN BAKIM) */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  4. 🔴 Kırmızı Kutu (Yoğun Bakım)
                </span>
                <AlertOctagon className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1.5 text-rose-950 flex items-baseline gap-1.5 tabular-nums">
                <span>{report.redBucket}</span>
                <span className="text-xs font-normal text-rose-800">Ünite Cumartesi Onarımında</span>
              </div>
              <div className="text-[11px] text-rose-900 mt-1 font-semibold bg-rose-100/80 px-2 py-1 rounded">
                T+3: &lt;%70 Başarı (40 Soruda ≤27 Doğru)
              </div>
              <p className="text-[11px] text-rose-800 mt-2 leading-relaxed">
                <strong>Aşama 1:</strong> Hafta içi programı bozma, çöken başlıkları not al.{' '}
                <strong>Aşama 2 (Cumartesi Onarım Bloğu):</strong> 25 dk Boş Kağıt / Kıyas Tablosu ile aktif yeniden inşa + 2. Soru Bankasından 30 soru çöz (≥%80 / 24+ doğru ise Sarı Kovaya + T+14 3. Bankaya terfi eder).
              </p>

              {/* İçindeki Üniteler */}
              <div className="mt-3 pt-2.5 border-t border-rose-200/80 space-y-1.5 max-h-48 overflow-y-auto">
                {redBoxTopics.length === 0 ? (
                  <div className="text-[11px] text-rose-700/70 italic py-2">
                    Şu an Kırmızı Kutuda (Cumartesi Onarımı) ünite yok.
                  </div>
                ) : (
                  redBoxTopics.map(t => (
                    <div
                      key={t.id}
                      className="bg-white p-2 rounded-lg border border-rose-200 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[10px] text-rose-700 font-mono">
                          Cumartesi: <strong>{t.saturdayRepairDate || upcomingSaturday}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalState({ topic: t, stage: 'SATURDAY_REPAIR' })}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-[10px] shrink-0"
                      >
                        Onar (30S)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CUMARTESİ YAPILACAKLAR & KOVA ONARIM MASASI (PDF Madde 5.2, 7.3, 8.3 & 8.4) */}
      <div className="bg-white rounded-xl border-2 border-rose-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
              <Wrench className="w-4 h-4" />
              <span>Cumartesi Yapılacaklar &amp; Kova Onarım Protokolü (En Yakın Cumartesi: {upcomingSaturday})</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              Cumartesi Konsolidasyon, Kırmızı Kova Onarım ve Çarşamba T+3 Günü (Yeni Konu Çalışılmaz!)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              PDF Doktrini Madde 5.2 &amp; 8.3: Cumartesi günü yeni ünite açılmaz; hafta içi Kırmızı Kovaya düşen üniteler onarılır, Çarşamba konularının T+3 testi çözülür ve biten derslerden karma branş denemesi atılır.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold font-mono">
              Kırmızı Kova: {redBoxTopics.length} / 3 Maks. Ünite
            </span>
          </div>
        </div>

        {/* Cumartesi 4 Bloklu Operasyon Akışı */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sol Sütun: Cumartesi Blok 2 — Kırmızı Kova Onarım Masası (En Kritik Görev) */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                Cumartesi Blok 2: 🔴 Kırmızı Kova Onarım Masası (Ünite Başı 45 Dk)
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px] font-bold">
                Yeni Konu Yok!
              </span>
            </div>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              Hafta içi T+3 testinde <strong>&lt;%70 (40 soruda ≤27 doğru)</strong> yapan veya Deneme Yanlışı T+3 (15 soru) kontrolünde <strong>≥3 yanlış</strong> çıkaran üniteler burada onarılır:
              <br />
              <strong>1. Adım (25 Dk):</strong> Pasif okuma yasak! Çöken alt başlıkları <em>Boş Kağıt (Free Recall)</em> veya <em>Kıyas Tablosu</em> ile sıfırdan çiz.
              <br />
              <strong>2. Adım (20 Dk):</strong> 2. Soru Bankasından (veya DUSBANKASI) <strong>30 soru</strong> çöz. <strong>≥%80 (24+ doğru)</strong> çıkarsa ünite <strong>Sarı Kovaya</strong> terfi eder ve T+14&apos;e 3. Soru Bankasından doğrulama testi kilitlenir.
            </p>

            {redBoxTopics.length === 0 ? (
              <div className="bg-white border border-rose-200/80 rounded-lg p-4 text-center space-y-2">
                <div className="text-xs font-bold text-emerald-800">
                  🎉 Kırmızı Kovada Onarım Bekleyen Ünite Yok!
                </div>
                <p className="text-[11px] text-slate-600">
                  Hafta içi tüm üniteleriniz Yeşil veya Sarı Kovada. Cumartesi Blok 2 süresini DUSBANKASI zor seviye soru taramasına veya karma branş denemesine ayırabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {redBoxTopics.map(topic => {
                  const sub = subjects.find(s => s.id === topic.subjectId);
                  const isStep1Done = Boolean(redFreeRecallDone[topic.id]);
                  return (
                    <div
                      key={topic.id}
                      className="bg-white rounded-lg border border-rose-200 p-3 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {sub?.name || topic.subjectId} · {topic.topicCode}
                          </span>
                          <div className="text-xs font-bold text-slate-900 mt-1">
                            {topic.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Planlı Cumartesi: <strong className="font-mono text-rose-700">{topic.saturdayRepairDate || upcomingSaturday}</strong>
                            {topic.t3Score && ` · T+3 Skoru: ${topic.t3Score.correct}/${topic.t3Score.total} (%${topic.t3Score.percentage})`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModalState({ topic, stage: 'SATURDAY_REPAIR' })
                          }
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 shadow-2xs transition-colors"
                        >
                          <span>30 Soru Sonucu Gir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={isStep1Done}
                            onChange={() => toggleRedFreeRecall(topic.id)}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                          <span className={isStep1Done ? 'line-through text-slate-400' : ''}>
                            Adım 1: 25 dk Boş Kağıt / Kıyas Tablosu ile aktif şema inşası yapıldı
                          </span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
                          Hedef: ≥24/30 Doğru (≥%80) → 🟡 Sarı Kova (T+14 3. Banka)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sağ Sütun: Cumartesi Blok 1, Blok 3 ve Blok 4 Kontrol Listesi */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cumartesi 4 Bloklu Tam Gün Akış Checklist&apos;i (PDF Madde 8.3)
              </div>

              {/* Blok 1 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
                <input
                  id="sat-b1"
                  type="checkbox"
                  checked={Boolean(saturdayStepsDone['sat-block1-anki'])}
                  onChange={() => toggleSaturdayStep('sat-block1-anki')}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sat-b1" className="text-xs cursor-pointer flex-1">
                  <span className="font-bold text-slate-900 block">
                    Cumartesi Blok 1 (Sabah · 45 Dk): İki Desteli Anki Kotası
                  </span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    1. Öncelikli Deste (<code>01-KRITIK-OTOPSI-VE-TABLO</code>) 15-20 dk tamamen sıfırlanır. Kalan 25 dk&apos;da <code>02-ANA-TEMEL-BILIM</code> destesinden maksimum 80-100 kart çözülür ve uygulama kapatılır.
                  </span>
                </label>
              </div>

              {/* Blok 3 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
                <input
                  id="sat-b3"
                  type="checkbox"
                  checked={Boolean(saturdayStepsDone['sat-block3-wed-t3'])}
                  onChange={() => toggleSaturdayStep('sat-block3-wed-t3')}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sat-b3" className="text-xs cursor-pointer flex-1">
                  <span className="font-bold text-slate-900 block">
                    Cumartesi Blok 3 (Öğleden Sonra): Çarşamba (T-3) Konularının T+3 Esas Testi (40 Soru)
                  </span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    Çarşamba günü T+0 (konu + 20 soru) çalışılan ünitelerin 3 gün gecikmeli T+3 esas geri çağırma testi çözülür; Yeşil (≥%85 taburcu), Sarı (%70-%84 T+14) veya Kırmızı (&lt;%70 gelecek Cumartesi) kutuya ayrılır.
                  </span>
                </label>
              </div>

              {/* Blok 4 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
                <input
                  id="sat-b4"
                  type="checkbox"
                  checked={Boolean(saturdayStepsDone['sat-block4-branch'])}
                  onChange={() => toggleSaturdayStep('sat-block4-branch')}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sat-b4" className="text-xs cursor-pointer flex-1">
                  <span className="font-bold text-slate-900 block">
                    Cumartesi Blok 4 (Akşam): DUSBANKASI Favoriler + 2 Karma Branş Denemesi &amp; T+3 (15 Soru) Kontrolü
                  </span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    Hafta içi DUSBANKASI&apos;nda &quot;Favorilere / Zor Sorulara&quot; eklenen sorular taranır, biten derslerden 2 adet Karma Branş Denemesi çözülür ve Çarşamba deneme yanlışlarının 15 soruluk T+3 doğrulaması yapılır (≥3 yanlış çıkan ünite Kırmızı Kovaya atılır).
                  </span>
                </label>
              </div>
            </div>

            {effectiveSelectedTopic && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-600">
                  Deneme yanlışı T+3 (15 soru) doğrulama testini kaydetmek için:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveModalState({
                      topic: effectiveSelectedTopic,
                      stage: 'EXAM_T3_VERIFICATION'
                    })
                  }
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold rounded-lg transition-colors shrink-0"
                >
                  Deneme Yanlışı T+3 (15 Soru) Gir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. İki Kanatlı Grid KPI Paneli */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Depolama Gücü Skoru */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Neokortikal Depolama Gücü
            </div>
            <div className="text-3xl font-extrabold font-mono mt-2 text-emerald-400 tabular-nums">
              %{report.overallRetentionIndex}
            </div>
            <div className="text-xs text-slate-400 mt-1">DUS Genel Ağırlıklı İndeks</div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Temel Bilimler (%33.3):</span>
              <span className="font-mono font-bold text-white tabular-nums">
                %{report.temelRetentionIndex}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Klinik Bilimler (%66.7):</span>
              <span className="font-mono font-bold text-white tabular-nums">
                %{report.klinikRetentionIndex}
              </span>
            </div>
          </div>
        </div>

        {/* Yeşil Kova */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Yeşil Kova (Taburcu)
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono mt-2 text-emerald-900 flex items-baseline gap-1.5 tabular-nums">
              <span>{report.greenBucket}</span>
              <span className="text-sm font-normal text-emerald-700">Ünite</span>
            </div>
            <div className="text-xs text-emerald-800 mt-1 font-medium">
              T+3 ≥%85 Başarı (34-40 Doğru)
            </div>
          </div>

          <p className="text-[11px] text-emerald-700 mt-3 pt-3 border-t border-emerald-200 leading-relaxed">
            Şema neokortekste sağlam. Tekrar sırasına bir daha girmez; 2. Soru Bankası çözülmez.
          </p>
        </div>

        {/* Sarı Kova */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Sarı Kova (Müşahede)
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono mt-2 text-amber-900 flex items-baseline gap-1.5 tabular-nums">
              <span>{report.yellowBucket}</span>
              <span className="text-sm font-normal text-amber-700">Ünite</span>
            </div>
            <div className="text-xs text-amber-800 mt-1 font-medium">
              T+3 %70-%84 Başarı (28-33 Doğru)
            </div>
          </div>

          <p className="text-[11px] text-amber-700 mt-3 pt-3 border-t border-amber-200 leading-relaxed">
            15 dk yama okundu. 14 gün sonrasına (T+14) 2. Bankadan 20-25 soru doğrulama planlandı.
          </p>
        </div>

        {/* Kırmızı Kova */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Kırmızı Kova (Yoğun Bakım)
              </span>
              <AlertOctagon className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono mt-2 text-rose-900 flex items-baseline gap-1.5 tabular-nums">
              <span>{report.redBucket}</span>
              <span className="text-sm font-normal text-rose-700">Ünite</span>
            </div>
            <div className="text-xs text-rose-800 mt-1 font-medium">
              T+3 &lt;%70 Başarı (≤27 Doğru)
            </div>
          </div>

          <p className="text-[11px] text-rose-700 mt-3 pt-3 border-t border-rose-200 leading-relaxed">
            Cumartesi Kova Onarım Bloğuna atandı (25 dk Boş Kağıt yeniden inşa + 30 soru).
          </p>
        </div>
      </div>

      {/* 7. Acil Eylem Listesi (Actionable Urgent Tasks — Takvim ile %100 Senkronize) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Kova Triyajı Acil Eylem Matrisi (Takvim &amp; Kuyruk ile Senkronize)
            </h3>
            <p className="text-xs text-slate-500">
              Yeşil kutuya geçen üniteler buradan kalıcı olarak düşer. Sadece T+3 bekleyen, Sarı (T+14) ve Kırmızı (Cumartesi) görevler listelenir.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
            {report.urgentTasks.length} Planlı Görev
          </span>
        </div>

        {report.urgentTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Bekleyen acil triyaj görevi bulunmuyor. Tüm aktif üniteler güncel veya Yeşil Kovada (Taburcu)!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.urgentTasks.map(task => {
              const targetTopic = topics.find(t => t.id === task.topicId);
              const isDueOrOverdue = task.targetDate <= todayStr;

              return (
                <div
                  key={task.id}
                  className="py-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          task.bucket === 'RED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : task.bucket === 'YELLOW'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {task.actionType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isDueOrOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isDueOrOverdue ? `ACİL / BUGÜN (${task.targetDate})` : `PLANLI: ${task.targetDate}`}
                      </span>
                      <span className="font-semibold text-slate-600">{task.subjectName}</span>
                    </div>

                    <div className="font-bold text-slate-900 text-sm mt-1">{task.topicTitle}</div>

                    <div className="text-slate-600 text-[11px] mt-0.5">{task.instruction}</div>
                  </div>

                  {targetTopic && (
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500">Tarih:</span>
                        <input
                          type="date"
                          aria-label={`${task.topicTitle} Hedef Tarihini Değiştir`}
                          value={task.targetDate}
                          onChange={e => {
                            if (e.target.value) {
                              rescheduleTopicTask(targetTopic.id, e.target.value);
                            }
                          }}
                          className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-[11px] text-slate-800"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => clearTopicScheduledTask(targetTopic.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                        title="Üniteyi silmeden bu planlı triyaj görevini tüm sekmelerden kaldır"
                        aria-label={`Görevi Sil: ${task.topicTitle}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Görevi Sil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModalState({ topic: targetTopic })}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <span>Görevi Uygula</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. 14 DUS Blok Dersi Bazında Kova Matrisi & Isı Haritası */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            DUS Dersleri Triyaj &amp; Kalıcılık Matrisi
          </h3>
          <p className="text-xs text-slate-500">
            Temel ve Klinik branşların ünite dağılımı, kova oranları ve neokortikal kalıcılık skorları
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kod</th>
                <th className="py-3 px-4">Ders Adı</th>
                <th className="py-3 px-4">Alan</th>
                <th className="py-3 px-4">Bilişsel Doğa</th>
                <th className="py-3 px-4 text-center">Soru Ağırlığı</th>
                <th className="py-3 px-4 text-center">Toplam Ünite</th>
                <th className="py-3 px-4 text-center">🟢 Yeşil</th>
                <th className="py-3 px-4 text-center">🟡 Sarı</th>
                <th className="py-3 px-4 text-center">🔴 Kırmızı</th>
                <th className="py-3 px-4 text-right">Depolama Gücü</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.subjectSummaries.map(sub => {
                const isTemel = sub.category === 'TEMEL_BILIMLER';

                return (
                  <tr key={sub.subjectId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{sub.subjectId}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => navigateToSubject(sub.subjectId)}
                        className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left transition-colors"
                      >
                        {sub.subjectName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {isTemel ? 'Temel Bilimler' : 'Klinik Bilimler'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sub.cognitiveGroup === 'GRUP_A' && 'Grup A (Saf Ezber)'}
                      {sub.cognitiveGroup === 'GRUP_B' && 'Grup B (Mekanizmik)'}
                      {sub.cognitiveGroup === 'GRUP_C' && 'Grup C (Klinik Karar)'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {sub.questionWeight} Soru
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900">
                      {sub.totalUnits}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-700 font-semibold">
                      {sub.greenCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">
                      {sub.yellowCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-rose-700 font-semibold">
                      {sub.redCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              sub.retentionRate >= 80
                                ? 'bg-emerald-500'
                                : sub.retentionRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${sub.retentionRate}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 w-9 text-right">
                          %{sub.retentionRate}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. Bilişsel Doktrin Kuralları Kartı */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 space-y-3">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>DUS Kova Triyajı Operasyonel Anayasası (PDF Doktrin Kuralları)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed text-slate-600">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              1. T+0 (20 Soru) Kova Belirlemez, T+3 Belirler!
            </strong>
            T+0 günü konuyu çalışıp çözdüğünüz 20 soruluk testteki doğru/yanlış oranı kova rengini belirlemez. En önemli karar noktası 3 gün sonraki T+3 çözümüdür; T+3&apos;te Yeşil (≥%85) çıkan konu bir daha tekrar sırasına girmez!
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              2. Sarı Kutu (T+14) ve Kırmızı Kutu (Cumartesi) Akışı
            </strong>
            T+3&apos;te %70-%84 yapan ünite Sarı Kutuya alınır (15 dk yama + 14 gün sonra 2. Bankadan 20-25 soru). &lt;%70 yapan ünite Kırmızı Kutuya düşer ve Cumartesi Onarım Bloğuna (25 dk Boş Kağıt + 30 soru) kilitlenir.
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              3. Cumartesi Onarımından Sarıya Terfi (3. Banka Kuralı)
            </strong>
            Cumartesi Kırmızı Kova onarımında 30 soruda ≥%80 (24+ doğru) yapan ünite Sarı Kovaya terfi eder ve T+14 doğrulama testi 3. Soru Bankasından (veya DUSBANKASI) planlanır.
          </div>
        </div>
      </div>

      {/* Modal */}
      {activeModalState && (
        <TriageModal
          topic={activeModalState.topic}
          stage={activeModalState.stage}
          onClose={() => setActiveModalState(null)}
        />
      )}
    </div>
  );
};
