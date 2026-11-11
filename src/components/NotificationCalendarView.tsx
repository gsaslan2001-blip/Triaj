/**
 * DUS 2027 Stratejik Yönetim Sistemi:
 * - Sekme 5: Tekrar_Takvimi (5 Kademeli Yoğunluk Isı Haritası & Sürükle-Bırak Görev Taşıma)
 * - Sekme 3: Tekrar_Kuyrugu (Günlük Kapasite & Öncelik Sıralı Acil Eylem Kuyruğu)
 * - Sekme 4: Tekrar_Kaydi (Mükerrer Kilitli İşlem & Denetim Geçmişi)
 */

import React, { useState, useMemo } from 'react';
import { useDUS } from '../context/DUSContext';
import { TopicUnit } from '../types/dus';
import { TriageModal } from './TriageModal';
import {
  getCalendarHeatmapStyle,
  getTopicNextTargetDate,
  calculateTopicDelayDays
} from '../utils/analytics';
import { addDays } from '../utils/triage';
import {
  Bell,
  Calendar as CalendarIcon,
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  History,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Layers,
  ShieldAlert,
  Sparkles,
  Trash2
} from 'lucide-react';

type CalendarSubTab = 'HEATMAP_CALENDAR' | 'PRIORITY_QUEUE' | 'AUDIT_LOG';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DAY_HEADERS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const NotificationCalendarView: React.FC = () => {
  const {
    notifications,
    topics,
    subjects,
    triageLogs,
    todayStr,
    soundEnabled,
    toggleSound,
    browserNotificationsEnabled,
    requestBrowserNotificationPermission,
    rescheduleTopicTask,
    clearTopicScheduledTask,
    deleteTriageLog,
    systemParams,
    calendarSubTab: subTab,
    setCalendarSubTab: setSubTab,
    navigateToSubject
  } = useDUS();

  const [activeModalTopic, setActiveModalTopic] = useState<TopicUnit | null>(null);

  // Aylık Takvim Durumu (Varsayılan: bugünün ayı)
  const initialDateParts = todayStr.split('-').map(Number);
  const [viewYear, setViewYear] = useState<number>(initialDateParts[0] || 2026);
  const [viewMonth, setViewMonth] = useState<number>((initialDateParts[1] || 4) - 1); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);

  // Aktif (Taburcu olmamış ve hedef tarihi olan) görevlerin tarihe göre haritası
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TopicUnit[]>();
    for (const topic of topics) {
      if (topic.discharged || topic.currentBucket === 'GREEN') continue;
      const targetDate = getTopicNextTargetDate(topic);
      if (!targetDate) continue;
      const list = map.get(targetDate) || [];
      list.push(topic);
      map.set(targetDate, list);
    }
    return map;
  }, [topics]);

  // Aylık 42 Hücreli (Pazartesi Başlangıçlı) Takvim Grid Hesaplaması
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    // JS getUTCDay(): 0=Paz, 1=Pzt ... 6=Cmt -> Pazartesi=0 .. Pazar=6 dönüşümü
    const startOffset = (firstDayOfMonth.getUTCDay() + 6) % 7;

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      tasks: TopicUnit[];
    }[] = [];

    const baseFirstStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;

    // Önceki aydan sarkan günler
    for (let i = startOffset; i > 0; i--) {
      const dStr = addDays(baseFirstStr, -i);
      const dayNum = Number(dStr.split('-')[2]);
      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        tasks: tasksByDate.get(dStr) || []
      });
    }

    // Ayın kendi günleri
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        tasks: tasksByDate.get(dStr) || []
      });
    }

    // 35 veya 42 hücreye tamamla
    const totalCells = cells.length <= 35 ? 35 : 42;
    const lastDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const dStr = addDays(lastDateStr, i);
      const dayNum = Number(dStr.split('-')[2]);
      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        tasks: tasksByDate.get(dStr) || []
      });
    }

    return cells;
  }, [viewYear, viewMonth, tasksByDate]);

  // Tekrar_Kuyrugu (Sekme 3) KPI ve Sıralı Liste Hesaplamaları
  const queueStats = useMemo(() => {
    const next7Str = addDays(todayStr, 7);
    let dueTodayCount = 0;
    let overdueCount = 0;
    let upcoming7DaysCount = 0;
    let greenDischargedCount = 0;
    let redRepairCount = 0;

    const activeQueueTopics: {
      topic: TopicUnit;
      targetDate: string;
      delayDays: number;
      queueCategory: 'GECİKEN' | 'BUGÜN' | 'YAKLAŞAN';
    }[] = [];

    for (const t of topics) {
      if (t.discharged || t.currentBucket === 'GREEN') {
        greenDischargedCount++;
        continue;
      }
      if (t.currentBucket === 'RED') {
        redRepairCount++;
      }
      const targetDate = getTopicNextTargetDate(t);
      if (!targetDate) continue;

      const delayDays = calculateTopicDelayDays(t, todayStr);
      if (targetDate < todayStr) {
        overdueCount++;
        activeQueueTopics.push({
          topic: t,
          targetDate,
          delayDays,
          queueCategory: 'GECİKEN'
        });
      } else if (targetDate === todayStr) {
        dueTodayCount++;
        activeQueueTopics.push({
          topic: t,
          targetDate,
          delayDays: 0,
          queueCategory: 'BUGÜN'
        });
      } else if (targetDate <= next7Str) {
        upcoming7DaysCount++;
        activeQueueTopics.push({
          topic: t,
          targetDate,
          delayDays: 0,
          queueCategory: 'YAKLAŞAN'
        });
      } else {
        activeQueueTopics.push({
          topic: t,
          targetDate,
          delayDays: 0,
          queueCategory: 'YAKLAŞAN'
        });
      }
    }

    // Öncelik Sıralaması: Önce Gecikenler -> Bugün -> Kırmızı Kova -> Sarı Kova -> Tarih
    activeQueueTopics.sort((a, b) => {
      const catOrder = { GECİKEN: 0, BUGÜN: 1, YAKLAŞAN: 2 };
      if (catOrder[a.queueCategory] !== catOrder[b.queueCategory]) {
        return catOrder[a.queueCategory] - catOrder[b.queueCategory];
      }
      const bucketOrder = { RED: 0, YELLOW: 1, NONE: 2, GREEN: 3 };
      if (bucketOrder[a.topic.currentBucket] !== bucketOrder[b.topic.currentBucket]) {
        return bucketOrder[a.topic.currentBucket] - bucketOrder[b.topic.currentBucket];
      }
      return a.targetDate.localeCompare(b.targetDate);
    });

    const totalUrgentLoad = overdueCount + dueTodayCount;
    const capacityExceeded = totalUrgentLoad > systemParams.dailyUnitCapacity;

    return {
      dueTodayCount,
      overdueCount,
      upcoming7DaysCount,
      greenDischargedCount,
      redRepairCount,
      totalUrgentLoad,
      capacityExceeded,
      activeQueueTopics
    };
  }, [topics, todayStr, systemParams.dailyUnitCapacity]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleDropOnDate = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDateStr(null);
    const topicId = e.dataTransfer.getData('text/plain') || draggedTopicId;
    if (topicId) {
      rescheduleTopicTask(topicId, targetDateStr);
      setSelectedDateStr(targetDateStr);
    }
    setDraggedTopicId(null);
  };

  const selectedDayTasks = tasksByDate.get(selectedDateStr) || [];

  return (
    <div className="space-y-4">
      {/* 1. Üst Başlık, Bildirim Kontrolleri ve Sekme Seçici */}
      <div className="apple-card p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ExcelMaster Sekme 3 · Sekme 4 · Sekme 5 — Ebbinghaus Gecikmeli Takip Motoru
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              5 Kademeli Yoğunluk Isı Haritası Takvimi, Sürükle-Bırak Görevler &amp; Tekrar Kuyruğu
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Görevleri takvim günleri arasında fareyle sürükleyip bırakarak (Drag &amp; Drop) veya tarih seçiciyle erteleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Sesli Zil: Açık' : 'Sesli Zil: Kapalı'}</span>
            </button>

            <button
              type="button"
              onClick={requestBrowserNotificationPermission}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                browserNotificationsEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {browserNotificationsEnabled ? 'Tarayıcı Bildirimi Aktif' : 'Masaüstü Bildirim İzni Ver'}
              </span>
            </button>
          </div>
        </div>

        {/* Alt Görünüm Seçici */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="apple-segmented flex-wrap">
            <button
              type="button"
              onClick={() => setSubTab('HEATMAP_CALENDAR')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                subTab === 'HEATMAP_CALENDAR'
                  ? 'apple-segmented-active'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Tekrar_Takvimi (5 Kademeli Isı Haritası &amp; Sürükle-Bırak)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('PRIORITY_QUEUE')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                subTab === 'PRIORITY_QUEUE'
                  ? 'apple-segmented-active'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tekrar_Kuyrugu ({queueStats.activeQueueTopics.length} Aktif)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('AUDIT_LOG')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                subTab === 'AUDIT_LOG'
                  ? 'apple-segmented-active'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Tekrar_Kaydi (Denetim &amp; Mükerrer Kilidi · {triageLogs.length})</span>
            </button>
          </div>

          {/* 5 Kademeli Renk Skalası Lejantı */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="text-slate-500 font-sans font-medium mr-1">Yoğunluk Skalası:</span>
            <span className="px-2 py-0.5 rounded border border-slate-200" style={{ backgroundColor: '#FFFFFF' }}>
              0: Beyaz
            </span>
            <span className="px-2 py-0.5 rounded border border-emerald-300" style={{ backgroundColor: '#DCFCE7' }}>
              1: Ferah
            </span>
            <span className="px-2 py-0.5 rounded border border-lime-400" style={{ backgroundColor: '#D9F99D' }}>
              2: İdeal
            </span>
            <span className="px-2 py-0.5 rounded border border-yellow-400" style={{ backgroundColor: '#FEF08A' }}>
              3: Orta
            </span>
            <span className="px-2 py-0.5 rounded border border-orange-400" style={{ backgroundColor: '#FED7AA' }}>
              4: Yoğun
            </span>
            <span className="px-2 py-0.5 rounded border border-rose-400 font-bold" style={{ backgroundColor: '#FECACA' }}>
              5+: Aşırı Yük
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tekrar_Kuyrugu 6 Büyük KPI Sayaç Kartları (Her zaman üstte görünür) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Bugün (T+3 / T+14)</div>
          <div className="text-2xl font-extrabold font-mono text-indigo-700 mt-1 tabular-nums">
            {queueStats.dueTodayCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bugün çözülecek</div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-800 uppercase">Geciken Görev</div>
          <div className="text-2xl font-extrabold font-mono text-rose-700 mt-1 tabular-nums">
            {queueStats.overdueCount}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">Acil öncelikli</div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-800 uppercase">Yaklaşan 7 Gün</div>
          <div className="text-2xl font-extrabold font-mono text-amber-700 mt-1 tabular-nums">
            {queueStats.upcoming7DaysCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Planlı tekrar</div>
        </div>

        <div
          className={`rounded-xl p-3.5 border shadow-2xs ${
            queueStats.capacityExceeded
              ? 'bg-orange-50 border-orange-300 text-orange-950'
              : 'bg-slate-900 border-slate-900 text-white'
          }`}
        >
          <div
            className={`text-[11px] font-semibold uppercase ${
              queueStats.capacityExceeded ? 'text-orange-800' : 'text-slate-400'
            }`}
          >
            Günlük Kapasite
          </div>
          <div className="text-2xl font-extrabold font-mono mt-1 tabular-nums">
            {queueStats.totalUrgentLoad} / {systemParams.dailyUnitCapacity}
          </div>
          <div
            className={`text-[11px] mt-0.5 ${
              queueStats.capacityExceeded ? 'text-orange-800 font-semibold' : 'text-emerald-400'
            }`}
          >
            {queueStats.capacityExceeded ? 'Kapasite Aşıldı!' : 'Kapasite Uygun'}
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase">Taburcu (Yeşil)</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 tabular-nums">
            {queueStats.greenDischargedCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">≥%85 Mezun ünite</div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-900 uppercase">Onarım (Kırmızı)</div>
          <div className="text-2xl font-extrabold font-mono text-rose-800 mt-1 tabular-nums">
            {queueStats.redRepairCount}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">Cumartesi bloğu</div>
        </div>
      </div>

      {/* Günlük Kapasite Aşım Uyarısı (Sayfa 7 Kuralı) */}
      {queueStats.capacityExceeded && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3 text-xs text-orange-950">
          <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              Günlük Maksimum Tekrar Kapasitesi Aşıldı ({queueStats.totalUrgentLoad} Aktif / Sınır:{' '}
              {systemParams.dailyUnitCapacity} Ünite)
            </div>
            <p className="mt-0.5 text-orange-900">
              Kılavuz Sayfa 7 Kuralı: Bir günde {systemParams.dailyUnitCapacity} üniteden fazla tekrar biriktiğinde bilişsel patinaj başlar. Fazla görevleri aşağıdaki ısı haritası takviminde boş (beyaz/yeşil) günlere sürükleyip bırakarak dağıtın.
            </p>
          </div>
        </div>
      )}

      {/* A. TEKRAR_TAKVIMI: 5 KADEMELİ YOĞUNLUK ISI HARİTASI & SÜRÜKLE-BIRAK TAKVİM */}
      {subTab === 'HEATMAP_CALENDAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol 8 Kolon: Aylık 7 Sütunlu Isı Haritası Grid */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {MONTH_NAMES_TR[viewMonth]} {viewYear} — Yoğunluk Isı Haritası
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const [y, m] = todayStr.split('-').map(Number);
                    setViewYear(y);
                    setViewMonth(m - 1);
                    setSelectedDateStr(todayStr);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  Bugün ({todayStr})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                  aria-label="Önceki Ay"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                  aria-label="Sonraki Ay"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pazartesi - Pazar Başlıkları */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-600 uppercase">
              {DAY_HEADERS_TR.map(dayName => (
                <div key={dayName} className="py-1.5 bg-slate-50 rounded-md border border-slate-200/70">
                  {dayName}
                </div>
              ))}
            </div>

            {/* 35/42 Hücreli Sürükle-Bırak Takvim Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map(cell => {
                const taskCount = cell.tasks.length;
                const heat = getCalendarHeatmapStyle(taskCount);
                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = cell.dateStr === todayStr;
                const isDragOver = dragOverDateStr === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    onDragOver={e => {
                      e.preventDefault();
                      if (dragOverDateStr !== cell.dateStr) {
                        setDragOverDateStr(cell.dateStr);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverDateStr === cell.dateStr) {
                        setDragOverDateStr(null);
                      }
                    }}
                    onDrop={e => handleDropOnDate(e, cell.dateStr)}
                    style={{ backgroundColor: heat.bgHex }}
                    className={`min-h-[96px] p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      !cell.isCurrentMonth ? 'opacity-45' : ''
                    } ${
                      isDragOver
                        ? 'ring-2 ring-indigo-600 border-indigo-600 scale-[1.02]'
                        : isSelected
                        ? 'ring-2 ring-slate-900 border-slate-900'
                        : isToday
                        ? 'border-indigo-500 ring-1 ring-indigo-400'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {/* Üst Satır: Gün Numarası ve [N Görev] Rozeti */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          isToday
                            ? 'bg-indigo-600 text-white px-1.5 py-0.5 rounded'
                            : 'text-slate-900'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {taskCount > 0 && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border tabular-nums ${heat.badgeClass}`}
                        >
                          [{taskCount} Görev]
                        </span>
                      )}
                    </div>

                    {/* Görev Чиpleri (Sürüklenebilir) */}
                    <div className="space-y-1 mt-1.5">
                      {cell.tasks.slice(0, 2).map(task => {
                        const sub = subjects.find(s => s.id === task.subjectId);
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={e => {
                              e.stopPropagation();
                              setDraggedTopicId(task.id);
                              e.dataTransfer.setData('text/plain', task.id);
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedDateStr(cell.dateStr);
                            }}
                            title={`${sub?.code} ${task.title} (Taşımak için başka bir güne sürükleyin)`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 border cursor-grab active:cursor-grabbing ${
                              task.currentBucket === 'RED'
                                ? 'bg-rose-600 text-white border-rose-700'
                                : task.currentBucket === 'YELLOW'
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-slate-900 text-white border-slate-800'
                            }`}
                          >
                            <GripVertical className="w-2.5 h-2.5 shrink-0 opacity-75" />
                            <span className="font-mono font-bold">{sub?.code}</span>
                            <span className="truncate">{task.title}</span>
                          </div>
                        );
                      })}
                      {taskCount > 2 && (
                        <div className="text-[10px] font-mono font-semibold text-slate-700 pl-1">
                          +{taskCount - 2} ünite daha...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sağ 4 Kolon: Seçili Günün Görev Çekmecesi & Hızlı Sürükle/Ertele Paneli */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-[11px] font-semibold text-indigo-600 uppercase font-mono">
                    Seçili Gün: {selectedDateStr}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    Günün Planlı Triyaj Görevleri ({selectedDayTasks.length})
                  </h4>
                </div>
                <span
                  className="px-2.5 py-1 rounded text-xs font-mono font-bold border"
                  style={{
                    backgroundColor: getCalendarHeatmapStyle(selectedDayTasks.length).bgHex
                  }}
                >
                  {getCalendarHeatmapStyle(selectedDayTasks.length).label}
                </span>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                  <Sparkles className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className="font-medium text-slate-700">
                    {selectedDateStr} tarihinde planlanmış görev yok (Beyaz Hücre).
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Yoğun günlerden bir görevi fareyle tutup bu güne bırakabilir veya aşağıdaki listeden bu tarihe taşıyabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayTasks.map(topic => {
                    const sub = subjects.find(s => s.id === topic.subjectId);
                    return (
                      <div
                        key={topic.id}
                        draggable
                        onDragStart={e => {
                          setDraggedTopicId(topic.id);
                          e.dataTransfer.setData('text/plain', topic.id);
                        }}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {topic.topicCode} · {sub?.code}
                            </span>
                            <div className="text-xs font-bold text-slate-900 mt-1">
                              {topic.title}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => clearTopicScheduledTask(topic.id)}
                              className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-medium rounded-md flex items-center gap-1 transition-colors"
                              title="Üniteyi silmeden yalnızca bu planlı görevi kaldır"
                              aria-label={`Görevi Sil: ${topic.title}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Görevi Sil</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveModalTopic(topic)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md flex items-center gap-1"
                            >
                              <span>Test Gir</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Hızlı Tarih Değiştirici (Klavye & Mobil Uyumlu Drag&Drop Alternatifi) */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                          <span className="text-slate-500">Başka Güne Taşı:</span>
                          <input
                            type="date"
                            aria-label={`${topic.title} Hedef Tarihini Değiştir`}
                            value={selectedDateStr}
                            onChange={e => {
                              if (e.target.value) {
                                rescheduleTopicTask(topic.id, e.target.value);
                              }
                            }}
                            className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Aktif Bildirimler Özeti */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-rose-600" />
                  <span>Bugün &amp; Geciken Alarm Havuzu</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {notifications.length} Bildirim
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {notifications.slice(0, 6).map(notif => {
                  const targetTopic = topics.find(t => t.id === notif.topicId);
                  return (
                    <div
                      key={notif.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{notif.title}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Hedef: {notif.dueDate}
                        </div>
                      </div>
                      {targetTopic && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => clearTopicScheduledTask(targetTopic.id)}
                            className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                            title="Üniteyi silmeden görevi kaldır"
                            aria-label={`Görevi Sil: ${targetTopic.title}`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Görevi Sil</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModalTopic(targetTopic)}
                            className="px-2 py-1 bg-slate-900 text-white text-[10px] font-semibold rounded shrink-0"
                          >
                            Çöz
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. TEKRAR_KUYRUGU: ÖNCELİK SIRALI ACİL EYLEM LİSTESİ (Sekme 3) */}
      {subTab === 'PRIORITY_QUEUE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tekrar_Kuyrugu — Öncelik Sıralı Acil Eylem Listesi
              </h3>
              <p className="text-xs text-slate-500">
                Sıralama Kuralı: Önce Gecikenler &rarr; Bugünün Görevleri &rarr; Kırmızı Kova &rarr; Sarı Kova
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              {queueStats.activeQueueTopics.length} Planlı Görev
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kod</th>
                  <th className="py-3 px-4">Branş &amp; Ünite</th>
                  <th className="py-3 px-4">Kuyruk Statüsü</th>
                  <th className="py-3 px-4">Kova</th>
                  <th className="py-3 px-4">Planlanan Tarih</th>
                  <th className="py-3 px-4 text-right">Gecikme</th>
                  <th className="py-3 px-4">Tarih Taşı</th>
                  <th className="py-3 px-4 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {queueStats.activeQueueTopics.map(({ topic, targetDate, delayDays, queueCategory }) => {
                  const sub = subjects.find(s => s.id === topic.subjectId);
                  return (
                    <tr key={topic.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-700">{topic.topicCode}</td>
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-bold text-slate-900">{topic.title}</div>
                        <button
                          type="button"
                          onClick={() => sub && navigateToSubject(sub.id)}
                          className="text-[11px] text-indigo-600 hover:underline font-medium"
                        >
                          [{sub?.code}] {sub?.name} (Üniteye Git)
                        </button>
                      </td>
                      <td className="py-2.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            queueCategory === 'GECİKEN'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : queueCategory === 'BUGÜN'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {queueCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans">
                        {topic.currentBucket === 'RED' && (
                          <span className="text-rose-700 font-bold">🔴 Kırmızı Kova</span>
                        )}
                        {topic.currentBucket === 'YELLOW' && (
                          <span className="text-amber-700 font-bold">🟡 Sarı Kova</span>
                        )}
                        {topic.currentBucket === 'NONE' && (
                          <span className="text-indigo-700 font-semibold">🔵 T+3 Bekliyor</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums text-slate-800">{targetDate}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {delayDays > 0 ? (
                          <span className="text-rose-700 font-bold">+{delayDays} Gün</span>
                        ) : (
                          <span className="text-emerald-700">0 Gün</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="date"
                          aria-label={`${topic.title} Kuyruk Tarihini Güncelle`}
                          value={targetDate}
                          onChange={e => {
                            if (e.target.value) {
                              rescheduleTopicTask(topic.id, e.target.value);
                            }
                          }}
                          className="px-2 py-1 bg-amber-50/70 border border-amber-300 rounded text-xs font-mono text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => clearTopicScheduledTask(topic.id)}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-medium rounded-md inline-flex items-center gap-1 transition-colors"
                            title="Üniteyi silmeden yalnızca bu planlı görevi kaldır"
                            aria-label={`Görevi Sil: ${topic.title}`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Görevi Sil</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModalTopic(topic)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md"
                          >
                            Test Gir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. TEKRAR_KAYDI: İŞLEM GEÇMİŞİ VE MÜKERRER KİLİDİ (Sekme 4) */}
      {subTab === 'AUDIT_LOG' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tekrar_Kaydi — Zaman Damgalı İşlem Geçmişi &amp; Mükerrer Önleme Kilidi
              </h3>
              <p className="text-xs text-slate-500">
                Aynı gün içinde aynı üniteye birden fazla kayıt girildiğinde sistem otomatik olarak mükerrer uyarısı üretir.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              {triageLogs.length} Kayıt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kayıt Kodu</th>
                  <th className="py-3 px-4">Gerçek Tarih</th>
                  <th className="py-3 px-4">Ders &amp; Ünite</th>
                  <th className="py-3 px-4">Aşama</th>
                  <th className="py-3 px-4 text-center">Skor</th>
                  <th className="py-3 px-4">Kova Kararı</th>
                  <th className="py-3 px-4">Mükerrer Kontrolü</th>
                  <th className="py-3 px-4 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {triageLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {log.recordCode || `TEKRAR-${String(index + 1).padStart(4, '0')}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">{log.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.topicTitle}</div>
                      <div className="text-[11px] text-slate-500">{log.subjectName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {log.stage === 'T3_MAIN' && 'T+3 Esas Test (40S)'}
                      {log.stage === 'T14_VERIFICATION' && 'T+14 Doğrulama (20S)'}
                      {log.stage === 'SATURDAY_REPAIR' && 'Cumartesi Onarım (30S)'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                      {log.correct}/{log.total} (%{log.percentage})
                    </td>
                    <td className="py-3 px-4">
                      {log.resultingBucket === 'GREEN' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Yeşil Kova (Taburcu)</span>
                        </span>
                      )}
                      {log.resultingBucket === 'YELLOW' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Sarı Kova (T+14)</span>
                        </span>
                      )}
                      {log.resultingBucket === 'RED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          <span>Kırmızı Kova (Cumartesi)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          log.validationStatus === 'Girişi kontrol et / Mükerrer'
                            ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {log.validationStatus || 'Geçerli'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteTriageLog(log.id)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-medium rounded-md inline-flex items-center gap-1 transition-colors"
                        title="Bu denetim kaydını ve bağlı planlı görevi tüm sekmelerden kaldır"
                        aria-label={`Kaydı ve Görevi Sil: ${log.topicTitle}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Görevi Sil</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Triyaj Modalı */}
      {activeModalTopic && (
        <TriageModal topic={activeModalTopic} onClose={() => setActiveModalTopic(null)} />
      )}
    </div>
  );
};
