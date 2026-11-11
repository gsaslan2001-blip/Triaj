/**
 * DUS 2027 Stratejik Yönetim Sistemi — Kova Triyajı & Excel-to-App Mimari Kabuğu
 */

import React, { useState } from 'react';
import { DUSProvider, useDUS } from './context/DUSContext';
import { Header, ActiveTab } from './components/Header';
import { DailyPlannerView } from './components/DailyPlannerView';
import { SubjectDatabaseView } from './components/SubjectDatabaseView';
import { KovaTriageReportView } from './components/KovaTriageReportView';
import { NotificationCalendarView } from './components/NotificationCalendarView';
import { ExamAndErrorAnalyticsView } from './components/ExamAndErrorAnalyticsView';
import { DeepSeekModal } from './components/DeepSeekModal';
import { SystemParametersModal, GirisRehberiModal } from './components/SystemModals';
import { X, Bell, CheckCircle2, Trash2, Activity } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('planner');
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isDeepSeekModalOpen, setIsDeepSeekModalOpen] = useState(false);
  const [isSystemParamsOpen, setIsSystemParamsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const {
    notifications,
    topics,
    subjects,
    report,
    dailyGoal,
    triageLogs,
    clearTopicScheduledTask
  } = useDUS();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Üst Navigasyon */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenDeepSeek={() => setIsDeepSeekModalOpen(true)}
        onOpenSystemParams={() => setIsSystemParamsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Kompakt Sekmeler Arası Canlı Senkronizasyon Şeridi (SSOT Durum Çubuğu) */}
      <div className="bg-white border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Canlı Bütünleşik Veri (SSOT):</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono font-bold tabular-nums transition-colors"
            >
              Planlı Görev: {report.urgentTasks.length}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold tabular-nums transition-colors"
            >
              🟢 Yeşil: {report.greenBucket}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-mono font-bold tabular-nums transition-colors"
            >
              🟡 Sarı: {report.yellowBucket}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-mono font-bold tabular-nums transition-colors"
            >
              🔴 Kırmızı: {report.redBucket}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-slate-600 tabular-nums">
            <span>
              Müfredat: <strong className="text-slate-900">{topics.length} Ünite</strong>
            </span>
            <span>·</span>
            <span>
              Denetim Kaydı: <strong className="text-slate-900">{triageLogs.length}</strong>
            </span>
            <span>·</span>
            <span>
              Depolama Gücü: <strong className="text-emerald-700">%{report.overallRetentionIndex}</strong>
            </span>
            <span>·</span>
            <span>
              Günlük Soru: <strong className="text-indigo-700">{dailyGoal.completedQuestions}/{dailyGoal.targetQuestions}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Ana Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'planner' && <DailyPlannerView />}
        {activeTab === 'subjects' && <SubjectDatabaseView />}
        {activeTab === 'notifications' && <NotificationCalendarView />}
        {activeTab === 'analytics' && <ExamAndErrorAnalyticsView />}
        {activeTab === 'report' && <KovaTriageReportView />}
      </main>

      {/* Alt Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Triyaj</span>
            <span aria-hidden="true">·</span>
            <span>Bilişsel Kova Triyajı, SWSPS Ceza Motoru &amp; FSRS Çalışma Sistemi</span>
          </div>
          <div>
            Bjork (1992), Roediger &amp; Karpicke (2006), Dunlosky (2013) ve Excel-to-App Mimari Kılavuzu
          </div>
        </div>
      </footer>

      {/* Hızlı Bildirim Çekmecesi (Drawer) */}
      {isNotificationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Aktif Triyaj Bildirimleri</h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {notifications.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  Şu an için bekleyen acil triyaj bildiriminiz bulunmuyor.
                </div>
              ) : (
                notifications.map(n => {
                  const targetTopic = topics.find(t => t.id === n.topicId);
                  const sub = targetTopic ? subjects.find(s => s.id === targetTopic.subjectId) : null;

                  return (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border text-xs space-y-2 ${
                        n.priority === 'P1_CRITICAL'
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : n.priority === 'P2_HIGH'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>{sub ? `[${sub.code}] ${sub.name}` : 'Sistem Uyarısı'}</span>
                        <span className="font-mono">{n.dueDate}</span>
                      </div>
                      <div className="font-bold">{n.title}</div>
                      <p className="text-[11px] opacity-90">{n.message}</p>
                      {targetTopic && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => clearTopicScheduledTask(targetTopic.id)}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
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

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationDrawerOpen(false);
                  setActiveTab('notifications');
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg text-center transition-colors"
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
