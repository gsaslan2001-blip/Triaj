/**
 * Uygulama Başlığı ve Ana Navigasyon — Apple-Inspired Luxury Frosted Command Bar
 */

import React, { useState } from 'react';
import { useDUS, ActiveAppTab } from '../context/DUSContext';
import {
  Calendar,
  Layers,
  BarChart3,
  Bell,
  Volume2,
  VolumeX,
  Download,
  Upload,
  RotateCcw,
  Clock,
  ShieldAlert,
  Cpu,
  TrendingUp,
  Sliders,
  HelpCircle,
  Cloud,
  LogOut,
  RefreshCw
} from 'lucide-react';

export type ActiveTab = ActiveAppTab;

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNotifications: () => void;
  onOpenDeepSeek: () => void;
  onOpenSystemParams: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenDeepSeek,
  onOpenSystemParams,
  onOpenGuide
}) => {
  const {
    notifications,
    topics,
    soundEnabled,
    toggleSound,
    exportDataJSON,
    importDataJSON,
    resetToInitialData,
    report,
    systemParams,
    cloudUser,
    cloudSyncStatus,
    lastCloudSyncedAt,
    cloudDomainNotice,
    signInToCloud,
    signOutOfCloud,
    forceCloudSync,
    setFocusedSubjectId
  } = useDUS();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // DUS Sınav Tarihi Geri Sayımı (SSOT Parametresi)
  const examDate = new Date(`${systemParams.examDate}T10:15:00`);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const handleExport = () => {
    const data = exportDataJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Triyaj_Yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        importDataJSON(content);
      }
    };
    reader.readAsText(file);
    setMenuOpen(false);
  };

  return (
    <header className="bg-zinc-950/92 backdrop-blur-xl text-white border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        {/* Üst Komuta Satırı: Marka Kimliği — Ana Sekmeler — Aksiyon & Araç Çubuğu */}
        <div className="flex items-center justify-between gap-2 h-13">
          {/* Sol: Marka, Triyaj Logosu & Proje Açıklaması */}
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className="flex items-center gap-2.5 shrink-0 text-left group focus:outline-hidden"
            aria-label="Triyaj Ana Sayfa"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/15 to-rose-500/20 border border-white/15 group-hover:border-emerald-400/60 flex items-center justify-center shrink-0 shadow-2xs transition-all">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4.5 h-4.5"
                aria-hidden="true"
              >
                <path
                  d="M12 3L20 7.5L12 12L4 7.5L12 3Z"
                  fill="#10B981"
                  fillOpacity="0.28"
                  stroke="#34D399"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 12L12 16.5L20 12"
                  stroke="#FBBF24"
                  strokeWidth="1.85"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16.5L12 21L20 16.5"
                  stroke="#FB7185"
                  strokeWidth="1.85"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
                  Triyaj
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-[10px] font-mono text-emerald-400 font-semibold whitespace-nowrap tabular-nums">
                  {daysLeft}G · {systemParams.targetTotalNet} Net
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-medium tracking-tight mt-0.5 whitespace-nowrap">
                Bilişsel Kova &amp; Çalışma Sistemi
              </div>
            </div>
          </button>

          {/* Orta: Ana Navigasyon Sekmeleri (Apple Segmented Control) */}
          <nav
            aria-label="Ana Navigasyon"
            className="hidden lg:flex items-center gap-0.5 bg-white/[0.06] border border-white/10 p-0.5 rounded-xl"
          >
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[9px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'planner'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Komuta Merkezi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFocusedSubjectId(null);
                setActiveTab('subjects');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[9px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'subjects'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Müfredat ({topics.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[9px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tekrar Takvimi</span>
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${
                  activeTab === 'notifications' ? 'text-indigo-700' : 'text-emerald-400'
                }`}
              >
                ({report.urgentTasks.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[9px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Deneme &amp; SWSPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[9px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'report'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Triyaj Raporu</span>
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${
                  activeTab === 'report' ? 'text-indigo-700' : 'text-amber-400'
                }`}
              >
                ({report.greenBucket + report.yellowBucket + report.redBucket})
              </span>
              {report.redAlarmActive && (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
            </button>
          </nav>

          {/* Sağ: Bulut Senkron + AI Koçu + Birleştirilmiş Sistem Araçları */}
          <div className="flex items-center gap-1.5 shrink-0">
            {cloudUser ? (
              <button
                type="button"
                onClick={() => forceCloudSync()}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title={
                  lastCloudSyncedAt
                    ? `Bulut Senkronizasyonu Aktif (${cloudUser.email || 'Bulut'}) · Son Eşitleme: ${lastCloudSyncedAt}`
                    : `Bulut Senkronizasyonu Aktif (${cloudUser.email || 'Bulut'})`
                }
              >
                <Cloud
                  className={`w-3.5 h-3.5 shrink-0 ${
                    cloudSyncStatus === 'SYNCING' ? 'animate-pulse text-amber-400' : 'text-emerald-400'
                  }`}
                />
                <span className="hidden sm:inline">
                  {cloudSyncStatus === 'SYNCING' ? 'Eşitleniyor...' : 'Bulut Aktif'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInToCloud()}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title="Cihazlar arası gerçek zamanlı bulut senkronizasyonu için bağlan"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="hidden sm:inline">Bulut Bağla</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenDeepSeek}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
              title="Deploy.com DeepSeek v4.1 Flash (1017) Bilişsel DUS Motoru"
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>DeepSeek AI</span>
            </button>

            {/* Birleştirilmiş Araç Grubu */}
            <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={onOpenSystemParams}
                className="px-1.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
                title="Hedef Net ve Sistem Parametreleri (SSOT)"
              >
                <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ayarlar</span>
              </button>

              <button
                type="button"
                onClick={onOpenGuide}
                className="p-1 text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title="Sistem Kullanım ve Veri Giriş Rehberi"
                aria-label="Giriş Rehberi"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className="p-1 text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title={soundEnabled ? 'Sesleri Kapat' : 'Sesleri Aç'}
                aria-label="Ses Ayarı"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-1 text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                aria-label="Bildirimler"
                title="Bekleyen Triyaj Bildirimleri"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white tabular-nums">
                    {notifications.length}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="px-2 py-1 text-zinc-300 hover:text-white hover:bg-white/10 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Yedek
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 text-xs text-zinc-800">
                    {cloudUser ? (
                      <>
                        <div className="px-4 py-2 border-b border-zinc-100">
                          <div className="font-semibold text-zinc-900 truncate">
                            {cloudUser.displayName || 'Bulut Çalışma Alanı'}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {cloudUser.email}
                          </div>
                          {cloudDomainNotice && (
                            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 space-y-1.5">
                              <div className="font-semibold">
                                Yerel Sunucu &amp; Bulut Yedeği Aktif
                              </div>
                              <p className="leading-snug text-amber-800">
                                Google Popup için Firebase Console &gt; Auth &gt; Settings &gt; Authorized domains listesine şu alanı ekleyebilirsiniz:
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(cloudDomainNotice);
                                  setCopiedDomain(true);
                                  setTimeout(() => setCopiedDomain(false), 2000);
                                }}
                                className="w-full px-2 py-1 rounded bg-white hover:bg-amber-100 border border-amber-300 font-mono font-bold text-amber-950 truncate text-left"
                              >
                                {copiedDomain ? '✓ Alan Adı Kopyalandı!' : `📋 ${cloudDomainNotice}`}
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            forceCloudSync();
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 text-emerald-600" />
                          <span>Şimdi Bulutla Eşitle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            signOutOfCloud();
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-zinc-500" />
                          <span>Bulut Oturumunu Kapat</span>
                        </button>
                        <div className="border-t border-zinc-100 my-1" />
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            signInToCloud();
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
                        >
                          <Cloud className="w-4 h-4 text-indigo-600" />
                          <span>Bulut Senkronu Aç</span>
                        </button>
                        <div className="border-t border-zinc-100 my-1" />
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleExport}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-zinc-500" />
                      <span>JSON Veri Yedek İndir</span>
                    </button>

                    <label className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4 text-zinc-500" />
                      <span>Yedekten Geri Yükle</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>

                    <div className="border-t border-zinc-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        resetToInitialData();
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <span>Varsayılan Veriyi Sıfırla</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobil / Tablet Navigasyon Satırı (Yalnızca <lg ekranlarda görünür) */}
        <nav
          aria-label="Mobil Navigasyon"
          className="flex lg:hidden items-center gap-1 overflow-x-auto py-1.5 border-t border-white/10"
        >
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'planner'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Komuta Merkezi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFocusedSubjectId(null);
              setActiveTab('subjects');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Müfredat ({topics.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tekrar Takvimi ({report.urgentTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Deneme &amp; SWSPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'report'
                ? 'bg-white text-zinc-950 font-semibold'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Triyaj Raporu</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

