/**
 * Triyaj — Bilişsel Kova Triyajı & Çalışma Sistemi (Apple-Inspired Luxury Mimari Kabuğu)
 */

import React, { useState } from 'react';
import { DUSProvider, useDUS } from './context/DUSContext';
import { Header } from './components/Header';
import { DailyPlannerView } from './components/DailyPlannerView';
import { SubjectDatabaseView } from './components/SubjectDatabaseView';
import { KovaTriageReportView } from './components/KovaTriageReportView';
import { NotificationCalendarView } from './components/NotificationCalendarView';
import { ExamAndErrorAnalyticsView } from './components/ExamAndErrorAnalyticsView';
import { DeepSeekModal } from './components/DeepSeekModal';
import { SystemParametersModal, GirisRehberiModal } from './components/SystemModals';
import { X, Bell, CheckCircle2, Trash2, Activity, ArrowUpRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isDeepSeekModalOpen, setIsDeepSeekModalOpen] = useState(false);
  const [isSystemParamsOpen, setIsSystemParamsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const {
    activeTab,
    setActiveTab,
    setFocusedSubjectId,
    navigateToSubject,
    navigateToAnalytics,
    navigateToCalendar,
    notifications,
    topics,
    subjects,
    report,
    dailyGoal,
    triageLogs,
    semanticErrors,
    clearTopicScheduledTask
  } = useDUS();

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-zinc-900 font-sans flex flex-col">
      {/* Üst Navigasyon */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenDeepSeek={() => setIsDeepSeekModalOpen(true)}
        onOpenSystemParams={() => setIsSystemParamsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Kompakt Sekmeler Arası Canlı Senkronizasyon Şeridi (Interaktif SSOT Durum Çubuğu) */}
      <div className="bg-white/85 backdrop-blur-md border-b border-zinc-200/80 sticky top-13 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5 text-zinc-600">
            <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 mr-0.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Canlı SSOT:</span>
            </span>
            <button
              type="button"
              onClick={() => navigateToCalendar('PRIORITY_QUEUE')}
              className="px-2 py-0.5 rounded-md bg-indigo-50/90 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono font-semibold tabular-nums transition-colors"
              title="Acil Tekrar Kuyruğunu Aç"
            >
              Planlı Görev: {report.urgentTasks.length}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="px-2 py-0.5 rounded-md bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-mono font-semibold tabular-nums transition-colors"
              title="Triyaj Raporu — Yeşil Kova (Taburcu)"
            >
              🟢 Yeşil: {report.greenBucket}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="px-2 py-0.5 rounded-md bg-amber-50/90 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-mono font-semibold tabular-nums transition-colors"
              title="Triyaj Raporu — Sarı Kova (T+14 Müşahede)"
            >
              🟡 Sarı: {report.yellowBucket}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="px-2 py-0.5 rounded-md bg-rose-50/90 hover:bg-rose-100 text-rose-800 border border-rose-200/80 font-mono font-semibold tabular-nums transition-colors"
              title="Triyaj Raporu — Kırmızı Kova (Cumartesi Onarım)"
            >
              🔴 Kırmızı: {report.redBucket}
            </button>
            {semanticErrors.length > 0 && (
              <button
                type="button"
                onClick={() => navigateToAnalytics('SWSPS_ERRORS')}
                className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200/80 font-mono font-semibold tabular-nums transition-colors"
                title="SWSPS Hata Analizini Aç"
              >
                SWSPS Hata: {semanticErrors.length}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-zinc-500 tabular-nums">
            <button
              type="button"
              onClick={() => {
                setFocusedSubjectId(null);
                setActiveTab('subjects');
              }}
              className="hover:text-zinc-900 transition-colors"
            >
              Müfredat: <strong className="text-zinc-900">{topics.length} Ünite</strong>
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={() => navigateToCalendar('AUDIT_LOG')}
              className="hover:text-zinc-900 transition-colors"
            >
              Denetim Kaydı: <strong className="text-zinc-900">{triageLogs.length}</strong>
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="hover:text-zinc-900 transition-colors"
            >
              Depolama Gücü: <strong className="text-emerald-700">%{report.overallRetentionIndex}</strong>
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={() => navigateToAnalytics('QUESTION_SPEED_LOG')}
              className="hover:text-zinc-900 transition-colors"
            >
              Günlük Soru: <strong className="text-indigo-700">{dailyGoal.completedQuestions}/{dailyGoal.targetQuestions}</strong>
            </button>
          </div>
        </div>
      </div>

      {/* Ana Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-4">
        {activeTab === 'planner' && <DailyPlannerView />}
        {activeTab === 'subjects' && <SubjectDatabaseView />}
        {activeTab === 'notifications' && <NotificationCalendarView />}
        {activeTab === 'analytics' && <ExamAndErrorAnalyticsView />}
        {activeTab === 'report' && <KovaTriageReportView />}
      </main>

      {/* Alt Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-zinc-200/80 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800">Triyaj</span>
            <span aria-hidden="true">·</span>
            <span>Bilişsel Kova &amp; Çalışma Sistemi (SSOT Reaktif Mimari)</span>
          </div>
          <div>
            Bjork (1992), Roediger &amp; Karpicke (2006), Dunlosky (2013) · Aktif Geri Çağırma Doktrini
          </div>
        </div>
      </footer>

      {/* Hızlı Bildirim Çekmecesi (Drawer) */}
      {isNotificationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/35 backdrop-blur-xs">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-md h-full shadow-2xl border-l border-zinc-200/80 flex flex-col">
            <div className="p-3.5 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs text-zinc-900">Aktif Triyaj Bildirimleri</h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold tabular-nums">
                  {notifications.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-emerald-500" />
                  Şu an için bekleyen acil triyaj bildiriminiz bulunmuyor.
                </div>
              ) : (
                notifications.map(n => {
                  const targetTopic = topics.find(t => t.id === n.topicId);
                  const sub = targetTopic ? subjects.find(s => s.id === targetTopic.subjectId) : null;

                  return (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        n.priority === 'P1_CRITICAL'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                          : n.priority === 'P2_HIGH'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span>{sub ? `[${sub.code}] ${sub.name}` : 'Sistem Uyarısı'}</span>
                        <span className="font-mono tabular-nums">{n.dueDate}</span>
                      </div>
                      <div className="font-bold">{n.title}</div>
                      <p className="text-[11px] opacity-90">{n.message}</p>
                      {targetTopic && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotificationDrawerOpen(false);
                              navigateToSubject(targetTopic.subjectId);
                            }}
                            className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-zinc-200 rounded-md text-[10px] font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Üniteye Git</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => clearTopicScheduledTask(targetTopic.id)}
                            className="px-2 py-1 bg-white hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 rounded-md text-[10px] font-medium inline-flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Görevi Sil</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3.5 border-t border-zinc-200/80 bg-zinc-50/80">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationDrawerOpen(false);
                  navigateToCalendar('HEATMAP_CALENDAR');
                }}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl text-center transition-colors"
              >
                Tüm Takvimi ve Bildirimleri Aç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy.com DeepSeek v4.1 Flash (1017) Bilişsel DUS Motoru Modalı */}
      {isDeepSeekModalOpen && <DeepSeekModal onClose={() => setIsDeepSeekModalOpen(false)} />}

      {/* Sekme 14: Parametreler_Ayar (SSOT) Modalı */}
      {isSystemParamsOpen && (
        <SystemParametersModal onClose={() => setIsSystemParamsOpen(false)} />
      )}

      {/* Sekme 15: Giris_Rehberi Modalı */}
      {isGuideOpen && <GirisRehberiModal onClose={() => setIsGuideOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <DUSProvider>
      <AppContent />
    </DUSProvider>
  );
}

