/**
 * Uygulama Başlığı ve Ana Navigasyon
 */

import React, { useState } from 'react';
import { useDUS } from '../context/DUSContext';
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
  HelpCircle
} from 'lucide-react';

export type ActiveTab = 'planner' | 'subjects' | 'analytics' | 'report' | 'notifications';

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
    soundEnabled,
    toggleSound,
    exportDataJSON,
    importDataJSON,
    resetToInitialData,
    report,
    requestBrowserNotificationPermission,
    browserNotificationsEnabled,
    systemParams
  } = useDUS();

  const [menuOpen, setMenuOpen] = useState(false);

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
    a.download = `DUS_Kova_Triyaj_Yedek_${new Date().toISOString().split('T')[0]}.json`;
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
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Üst Komuta Satırı: Marka Kimliği — Ana Sekmeler — Aksiyon & Araç Çubuğu */}
        <div className="flex items-center justify-between gap-3 h-15">
          {/* Sol: Marka & Aday Kimliği */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono font-bold tracking-tight shrink-0">
              <span className="text-xs text-emerald-400">DUS</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
                  DUS 2027 Komuta
                </h1>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold whitespace-nowrap">
                  108 Net
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                <span>{systemParams.ownerName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-300 tabular-nums">{daysLeft} Gün</span>
              </div>
            </div>
          </div>

          {/* Orta: Ana Navigasyon Sekmeleri (Masaüstü) */}
          <nav
            aria-label="Ana Navigasyon"
            className="hidden lg:flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl"
          >
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'planner'
                  ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Komuta Merkezi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'subjects'
                  ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Müfredat (227)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Deneme &amp; SWSPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'report'
                  ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Triyaj Raporu</span>
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${
                  activeTab === 'report' ? 'text-indigo-700' : 'text-amber-400'
                }`}
              >
                ({report.urgentTasks.length})
              </span>
              {report.redAlarmActive && (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
            </button>
          </nav>

          {/* Sağ: AI Koçu + Birleştirilmiş Sistem Araçları */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenDeepSeek}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
              title="Deploy.com DeepSeek v4.1 Flash (1017) Bilişsel DUS Motoru"
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>DeepSeek AI</span>
            </button>

            {/* Birleştirilmiş Araç Grubu */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={onOpenSystemParams}
                className="px-2 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
                title="Hedef Net ve Sistem Parametreleri (SSOT)"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Ayarlar</span>
              </button>

              <button
                type="button"
                onClick={onOpenGuide}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                title="Sistem Kullanım ve Veri Giriş Rehberi"
                aria-label="Giriş Rehberi"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                title={soundEnabled ? 'Sesleri Kapat' : 'Sesleri Aç'}
                aria-label="Ses Ayarı"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                aria-label="Bildirimler"
                title="Bekleyen Triyaj Bildirimleri"
              >
                <Bell className="w-4 h-4" />
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
                  className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Yedek
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs text-slate-800">
                    <button
                      type="button"
                      onClick={handleExport}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>JSON Veri Yedek İndir</span>
                    </button>

                    <label className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Yedekten Geri Yükle</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>

                    <div className="border-t border-slate-100 my-1" />

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
          className="flex lg:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80"
        >
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'planner'
                ? 'bg-white text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Komuta Merkezi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-white text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Müfredat &amp; Konu Matrisi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-white text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tekrar Takvimi ({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Deneme &amp; Hata Analizi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'report'
                ? 'bg-white text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
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
