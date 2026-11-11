/**
 * DUS 2027 Müfredat ve 227 Konsolide Ünite Taksonomi Yönetim Paneli (UNITS.md)
 * - Görünüm 1: 14 Kanonik Ders Bloğu & Bilişsel Protokol Kartları
 * - Görünüm 2 (Sekme 2): Tekrar_Plani — Açık Sarı Hücrelerden Doğrudan T+0 Tarih & T+3 Doğru (0-40) Girişi
 * - Görünüm 3 (Sekme 6): Konu_Takip_Matrisi — 14 Branş Gecikme Günü 3 Renkli Isı Haritası (#A7F3D0 / #FDE68A / #FCA5A5)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useDUS } from '../context/DUSContext';
import { TopicUnit, SubjectCategory, CognitiveGroup } from '../types/dus';
import { TriageModal } from './TriageModal';
import {
  calculateTopicDelayDays,
  getDelayHeatmapStyle,
  getTopicNextTargetDate
} from '../utils/analytics';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Sparkles,
  Trash2,
  Play,
  Table,
  Tag,
  Layers,
  Grid,
  X
} from 'lucide-react';

type UnitStatusFilter = 'ALL' | 'ACTIVE_TRIAGE' | 'NOT_STARTED';
type CurriculumViewMode = 'SUBJECT_CARDS' | 'TEKRAR_PLANI' | 'KONU_TAKIP_MATRISI';

export const SubjectDatabaseView: React.FC = () => {
  const {
    subjects,
    topics,
    addTopic,
    deleteTopic,
    clearTopicScheduledTask,
    inlineUpdateTopicPlan,
    todayStr,
    focusedSubjectId,
    setFocusedSubjectId
  } = useDUS();

  // View Mode Switcher
  const [viewMode, setViewMode] = useState<CurriculumViewMode>('SUBJECT_CARDS');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SubjectCategory>('ALL');
  const [cognitiveFilter, setCognitiveFilter] = useState<'ALL' | CognitiveGroup>('ALL');
  const [unitStatusFilter, setUnitStatusFilter] = useState<UnitStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatrixSubjectId, setSelectedMatrixSubjectId] = useState<string>('ALL');

  // Expanded subject cards
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    focusedSubjectId || 'B01'
  );

  // Başka sekmeden belirli bir derse odaklanılarak gelindiyse otomatik o dersi aç
  useEffect(() => {
    if (focusedSubjectId) {
      setExpandedSubjectId(focusedSubjectId);
      setSelectedMatrixSubjectId(focusedSubjectId);
    }
  }, [focusedSubjectId]);

  // New Topic Form Modal state
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [newTopicSubjectId, setNewTopicSubjectId] = useState<string>('B01');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSubtopics, setNewTopicSubtopics] = useState('');

  // Triage Test Modal
  const [activeTestTopic, setActiveTestTopic] = useState<TopicUnit | null>(null);

  const temelSubjectsCount = subjects.filter(s => s.category === 'TEMEL_BILIMLER').length;
  const klinikSubjectsCount = subjects.filter(s => s.category === 'KLINIK_BILIMLER').length;
  const temelUnitsCount = topics.filter(t => {
    const s = subjects.find(sub => sub.id === t.subjectId);
    return s?.category === 'TEMEL_BILIMLER';
  }).length;
  const klinikUnitsCount = topics.length - temelUnitsCount;

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      if (focusedSubjectId && sub.id !== focusedSubjectId) return false;
      if (categoryFilter !== 'ALL' && sub.category !== categoryFilter) return false;
      if (cognitiveFilter !== 'ALL' && sub.cognitiveGroup !== cognitiveFilter) return false;

      const subTopics = topics.filter(t => t.subjectId === sub.id);
      const matchingTopics = subTopics.filter(t => {
        if (unitStatusFilter === 'ACTIVE_TRIAGE' && t.status === 'NOT_STARTED') return false;
        if (unitStatusFilter === 'NOT_STARTED' && t.status !== 'NOT_STARTED') return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.title.toLowerCase().includes(q) ||
            sub.name.toLowerCase().includes(q) ||
            sub.code.toLowerCase().includes(q) ||
            (t.topicCode && t.topicCode.toLowerCase().includes(q))
          );
        }
        return true;
      });

      if (searchQuery.trim() || unitStatusFilter !== 'ALL') {
        return matchingTopics.length > 0;
      }

      return true;
    });
  }, [subjects, topics, focusedSubjectId, categoryFilter, cognitiveFilter, unitStatusFilter, searchQuery]);

  // Flat filtered topics for Tekrar_Plani table
  const filteredFlatTopics = useMemo(() => {
    return topics.filter(t => {
      const sub = subjects.find(s => s.id === t.subjectId);
      if (!sub) return false;
      if (focusedSubjectId && sub.id !== focusedSubjectId) return false;
      if (categoryFilter !== 'ALL' && sub.category !== categoryFilter) return false;
      if (cognitiveFilter !== 'ALL' && sub.cognitiveGroup !== cognitiveFilter) return false;
      if (unitStatusFilter === 'ACTIVE_TRIAGE' && t.status === 'NOT_STARTED') return false;
      if (unitStatusFilter === 'NOT_STARTED' && t.status !== 'NOT_STARTED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          sub.name.toLowerCase().includes(q) ||
          sub.code.toLowerCase().includes(q) ||
          (t.topicCode && t.topicCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [topics, subjects, focusedSubjectId, categoryFilter, cognitiveFilter, unitStatusFilter, searchQuery]);

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const subtopicsList = newTopicSubtopics
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addTopic(newTopicSubjectId, newTopicTitle, subtopicsList);
    setNewTopicTitle('');
    setNewTopicSubtopics('');
    setIsAddTopicModalOpen(false);
    setExpandedSubjectId(newTopicSubjectId);
  };

  const focusedSubObj = focusedSubjectId
    ? subjects.find(s => s.id === focusedSubjectId)
    : null;

  return (
    <div className="space-y-4">
      {/* 1. Üst Filtreler, Görünüm Seçici & Başlık */}
      <div className="apple-card p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              UNITS.md · Sekme 2 (Tekrar_Plani) &amp; Sekme 6 (Konu_Takip_Matrisi)
            </div>
            <h2 className="text-base font-bold text-zinc-900 mt-0.5 tracking-tight">
              14 Ders Bloğu (15 Temel DUS Dersi) &amp; {topics.length} Konsolide Ünite
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Temel Bilimler: {temelSubjectsCount} Blok ({temelUnitsCount} Ünite · 40 Soru · %33.33) &amp; Klinik Bilimler: {klinikSubjectsCount} Blok ({klinikUnitsCount} Ünite · 80 Soru · %66.67)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {focusedSubObj && (
              <button
                type="button"
                onClick={() => setFocusedSubjectId(null)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Filtre: [{focusedSubObj.code}] {focusedSubObj.name}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddTopicModalOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Konu / Ünite Ekle</span>
            </button>
          </div>
        </div>

        {/* 3'lü Görünüm Seçici (Apple Segmented Control) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1 apple-segmented">
            <button
              type="button"
              onClick={() => setViewMode('SUBJECT_CARDS')}
              className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'SUBJECT_CARDS'
                  ? 'apple-segmented-active text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>14 Ders Bloğu &amp; Protokol Kartları</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TEKRAR_PLANI')}
              className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'TEKRAR_PLANI'
                  ? 'apple-segmented-active text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tekrar_Plani (Sarı Hücre Inline T+0 &amp; T+3 Giriş)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('KONU_TAKIP_MATRISI')}
              className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'KONU_TAKIP_MATRISI'
                  ? 'apple-segmented-active text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Konu_Takip_Matrisi (14 Branş Gecikme Isı Haritası)</span>
            </button>
          </div>

          {viewMode === 'KONU_TAKIP_MATRISI' && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="font-sans text-zinc-500">Gecikme Isı Haritası:</span>
              <span className="px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#A7F3D0' }}>
                0 Gün: Zamanında
              </span>
              <span className="px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#FDE68A' }}>
                1-7 Gün: Uyarı
              </span>
              <span className="px-2 py-0.5 rounded font-bold" style={{ backgroundColor: '#FCA5A5' }}>
                8+ Gün: Kritik
              </span>
            </div>
          )}
        </div>

        {/* Filtre ve Arama Çubuğu */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-0.5">
          <div className="md:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="K0001..K0227, ünite veya ders ara..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-1 apple-segmented text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`flex-1 py-1 px-2 font-medium rounded-[9px] transition-all ${
                categoryFilter === 'ALL'
                  ? 'apple-segmented-active text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Tümü ({topics.length} Ünite)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('TEMEL_BILIMLER')}
              className={`flex-1 py-1 px-2 font-medium rounded-[9px] transition-all ${
                categoryFilter === 'TEMEL_BILIMLER'
                  ? 'apple-segmented-active text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Temel ({temelUnitsCount})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('KLINIK_BILIMLER')}
              className={`flex-1 py-1 px-2 font-medium rounded-[9px] transition-all ${
                categoryFilter === 'KLINIK_BILIMLER'
                  ? 'apple-segmented-active text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Klinik ({klinikUnitsCount})
            </button>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Ünite Durum Filtresi"
              value={unitStatusFilter}
              onChange={e => setUnitStatusFilter(e.target.value as UnitStatusFilter)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Durum: Tüm Üniteler</option>
              <option value="ACTIVE_TRIAGE">Çalışılan / Triyajda</option>
              <option value="NOT_STARTED">Başlanmayanlar</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Bilişsel Grup Filtresi"
              value={cognitiveFilter}
              onChange={e => setCognitiveFilter(e.target.value as 'ALL' | CognitiveGroup)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Bilişsel: Tümü</option>
              <option value="GRUP_A">Grup A: Saf Ezber</option>
              <option value="GRUP_B">Grup B: Mekanizma</option>
              <option value="GRUP_C">Grup C: Klinik Karar</option>
            </select>
          </div>
        </div>
      </div>

      {/* GÖRÜNÜM 1: KANONİK DERS BLOKLARI VE PROTOKOL KARTLARI */}
      {viewMode === 'SUBJECT_CARDS' && (
        <div className="space-y-3">
          {filteredSubjects.map(sub => {
            const allSubTopics = topics
              .filter(t => t.subjectId === sub.id)
              .sort((a, b) => a.unitNumber - b.unitNumber);

            const visibleSubTopics = allSubTopics.filter(t => {
              if (unitStatusFilter === 'ACTIVE_TRIAGE' && t.status === 'NOT_STARTED') return false;
              if (unitStatusFilter === 'NOT_STARTED' && t.status !== 'NOT_STARTED') return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const subjectMatch =
                  sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
                if (
                  !subjectMatch &&
                  !t.title.toLowerCase().includes(q) &&
                  !(t.topicCode && t.topicCode.toLowerCase().includes(q))
                ) {
                  return false;
                }
              }
              return true;
            });

            const isExpanded = expandedSubjectId === sub.id;

            const greenCount = allSubTopics.filter(
              t => t.currentBucket === 'GREEN' || t.discharged
            ).length;
            const yellowCount = allSubTopics.filter(t => t.currentBucket === 'YELLOW').length;
            const redCount = allSubTopics.filter(t => t.currentBucket === 'RED').length;
            const pendingCount = allSubTopics.filter(t => t.currentBucket === 'NONE').length;

            const isTemel = sub.category === 'TEMEL_BILIMLER';

            return (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
              >
                <div
                  onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`px-2.5 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs ${
                        isTemel
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {sub.code}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
                        <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {allSubTopics.length} Ünite · {sub.questionCount} Soru (%{sub.weightPercentage})
                        </span>
                        {sub.excelColumn && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Table className="w-3 h-3" />
                            Excel Kolon: {sub.excelColumn}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{isTemel ? 'Temel Bilimler' : 'Klinik Bilimler'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600 font-medium">
                          {sub.cognitiveGroup === 'GRUP_A' && 'Grup A: Saf Ezber / Mekansal'}
                          {sub.cognitiveGroup === 'GRUP_B' && 'Grup B: Mekanizmik & Nedensel'}
                          {sub.cognitiveGroup === 'GRUP_C' && 'Grup C: Klinik Karar & Protokol'}
                        </span>
                        {sub.ankiDeckPattern && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-700">
                              <Tag className="w-3 h-3" />
                              {sub.ankiDeckPattern}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span
                        className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold"
                        title="Yeşil Kova (Taburcu)"
                      >
                        🟢 {greenCount}
                      </span>
                      <span
                        className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold"
                        title="Sarı Kova (Müşahede)"
                      >
                        🟡 {yellowCount}
                      </span>
                      <span
                        className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold"
                        title="Kırmızı Kova (Yoğun Bakım)"
                      >
                        🔴 {redCount}
                      </span>
                      <span
                        className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                        title="Henüz Triyajlanmamış Ünite"
                      >
                        ⚪ {pendingCount}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      aria-label={`${sub.name} Dersini ${isExpanded ? 'Daralt' : 'Genişlet'}`}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-2 text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>DUS 2027 Doktrini Çalışma &amp; Soru Protokolü ({sub.code})</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
                        <div>
                          <strong className="text-slate-800">T+0 İlk Kodlama:</strong> {sub.protocol.t0Method}
                        </div>
                        <div>
                          <strong className="text-slate-800">T+3 Geri Çağırma:</strong> {sub.protocol.t3Method}
                        </div>
                        <div>
                          <strong className="text-slate-800">Soru Bankası Kotası:</strong> {sub.protocol.questionBankUsage}
                        </div>
                        <div>
                          <strong className="text-slate-800">Anki Entegrasyonu:</strong> {sub.protocol.ankiProtocol}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Kanonik Müfredat Üniteleri ({visibleSubTopics.length} / {allSubTopics.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicSubjectId(sub.id);
                            setIsAddTopicModalOpen(true);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Bu Derse Ek Ünite Ekle</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {visibleSubTopics.map(topic => {
                          const isGreen = topic.currentBucket === 'GREEN' || topic.discharged;
                          const isYellow = topic.currentBucket === 'YELLOW';
                          const isRed = topic.currentBucket === 'RED';
                          const isPending = topic.currentBucket === 'NONE';

                          return (
                            <div
                              key={topic.id}
                              className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    {topic.topicCode || `#${String(topic.unitNumber).padStart(2, '0')}`}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">{topic.title}</span>

                                  {isGreen && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Yeşil Kova (Taburcu)</span>
                                    </span>
                                  )}
                                  {isYellow && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>Sarı Kova (T+14 Müşahede)</span>
                                    </span>
                                  )}
                                  {isRed && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      <AlertOctagon className="w-3 h-3 text-rose-600" />
                                      <span>Kırmızı Kova (Cumartesi Onarım)</span>
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {topic.status === 'T0_DONE' ? 'T+3 Testi Bekliyor' : 'Başlanmadı'}
                                      </span>
                                    </span>
                                  )}
                                </div>

                                {topic.subtopics && topic.subtopics.length > 0 && (
                                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1">
                                    <span className="font-semibold text-slate-600">Alt Başlıklar:</span>
                                    {topic.subtopics.map((st, i) => (
                                      <span key={i} className="after:content-[','] last:after:content-['']">
                                        {st}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {topic.clinicalNotes && (
                                  <div className="text-[11px] text-slate-600 mt-1 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                                    <span className="font-semibold not-italic text-slate-700">Yama Notu:</span>{' '}
                                    {topic.clinicalNotes}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                {getTopicNextTargetDate(topic) && (
                                  <button
                                    type="button"
                                    onClick={() => clearTopicScheduledTask(topic.id)}
                                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                                    title="Üniteyi silmeden yalnızca planlı triyaj görevini kaldır"
                                    aria-label={`Görevi Sil: ${topic.title}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Görevi Sil</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setActiveTestTopic(topic)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Test Gir &amp; Triyaj</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteTopic(topic.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Üniteyi Sil"
                                  aria-label={`${topic.title} Ünitesini Sil`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* GÖRÜNÜM 2: TEKRAR_PLANI — AÇIK SARI HÜCRELERDEN INLINE T+0 & T+3 TABLOSU (Sekme 2, Sayfa 6) */}
      {viewMode === 'TEKRAR_PLANI' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tekrar_Plani — 227 Ünite Ebbinghaus T+0 / T+3 / T+14 Otomatik Hesaplama Tablosu
              </h3>
              <p className="text-xs text-slate-500">
                Kılavuz Sayfa 6 Kuralı: Yalnızca <span className="px-1.5 py-0.5 rounded bg-yellow-100 border border-yellow-300 font-semibold text-yellow-950">Açık Sarı Hücrelere</span> (`T+0 Giriş` ve `T+3 Doğru 0-40`) veri girilir; diğer tüm tarihler ve kova aksiyonları otomatik hesaplanır.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              {filteredFlatTopics.length} Ünite Gösteriliyor
            </span>
          </div>

          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3">Konu ID</th>
                  <th className="py-3 px-3">Branş</th>
                  <th className="py-3 px-3">Ünite Adı</th>
                  <th className="py-3 px-3 bg-amber-500 text-slate-950">T+0 Giriş (Sarı Hücre)</th>
                  <th className="py-3 px-3">T+3 Tarihi (=T0+3)</th>
                  <th className="py-3 px-3 bg-amber-500 text-slate-950 text-center">T+3 Doğru (0-40)</th>
                  <th className="py-3 px-3">Kova Rengi</th>
                  <th className="py-3 px-3">Sonraki Aksiyon</th>
                  <th className="py-3 px-3">Sıradaki Hedef</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredFlatTopics.map(topic => {
                  const sub = subjects.find(s => s.id === topic.subjectId);
                  const nextTarget = getTopicNextTargetDate(topic);
                  const actionText =
                    topic.currentBucket === 'GREEN' || topic.discharged
                      ? 'TABURCU (Tekrar Sırasına Bir Daha Girmez)'
                      : topic.currentBucket === 'YELLOW'
                      ? topic.promotedFromRed
                        ? '[SARI KOVA] 3. Banka 1 Test (20-25 Soru)'
                        : '[SARI KOVA] 2. Banka 1 Test (20-25 Soru)'
                      : topic.currentBucket === 'RED'
                      ? '[KIRMIZI KOVA] Cmt 25dk Boş Kağıt + 30 Soru'
                      : topic.status === 'T0_DONE'
                      ? 'T+3 Gününde 40 Soru Çözülecek (Kova Kararı)'
                      : 'T+0 Konu + 20 Soru Bekleniyor';

                  return (
                    <tr key={topic.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-700">{topic.topicCode}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">
                        [{sub?.code}] {sub?.name}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{topic.title}</td>
                      <td className="py-2 px-3 bg-yellow-50/90 border-x border-yellow-200">
                        <input
                          type="date"
                          aria-label={`${topic.topicCode} T+0 Giriş Tarihi`}
                          value={topic.t0Date || ''}
                          onChange={e => inlineUpdateTopicPlan(topic.id, e.target.value, undefined)}
                          className="px-2 py-1 bg-yellow-100/90 border border-yellow-400 rounded text-xs font-mono text-slate-900 w-34"
                        />
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-700">
                        {topic.t3DueDate || '-'}
                      </td>
                      <td className="py-2 px-3 bg-yellow-50/90 border-x border-yellow-200 text-center">
                        <input
                          type="number"
                          min={0}
                          max={40}
                          placeholder="-"
                          aria-label={`${topic.topicCode} T+3 Doğru Sayısı`}
                          value={topic.t3Score?.correct ?? ''}
                          onChange={e => {
                            const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                            if (val !== undefined) {
                              inlineUpdateTopicPlan(topic.id, topic.t0Date, val);
                            }
                          }}
                          className="w-16 px-2 py-1 bg-yellow-100/90 border border-yellow-400 rounded text-xs font-mono font-bold text-center text-slate-900 tabular-nums"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {(topic.currentBucket === 'GREEN' || topic.discharged) && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px]">
                            🟢 YEŞİL
                          </span>
                        )}
                        {topic.currentBucket === 'YELLOW' && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                            🟡 SARI
                          </span>
                        )}
                        {topic.currentBucket === 'RED' && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[11px]">
                            🔴 KIRMIZI
                          </span>
                        )}
                        {topic.currentBucket === 'NONE' && !topic.discharged && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                            ⚪ BEKLİYOR
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px] text-slate-700">
                        {actionText}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-bold text-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <span>{nextTarget || (topic.discharged ? 'Mezun' : '-')}</span>
                          {nextTarget && (
                            <button
                              type="button"
                              onClick={() => clearTopicScheduledTask(topic.id)}
                              className="px-1.5 py-0.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded font-sans text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0"
                              title="Üniteyi silmeden planlı görevi kaldır"
                              aria-label={`Görevi Sil: ${topic.title}`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Görevi Sil</span>
                            </button>
                          )}
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

      {/* GÖRÜNÜM 3: KONU_TAKIP_MATRISI — 14 BRANŞ GECİKME ISI HARİTASI (Sekme 6, Sayfa 10) */}
      {viewMode === 'KONU_TAKIP_MATRISI' && (
        <div className="space-y-4">
          {/* Branş Hızlı Seçici */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedMatrixSubjectId('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                selectedMatrixSubjectId === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              14 Branş Tümü
            </button>
            {subjects.map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedMatrixSubjectId(sub.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                  selectedMatrixSubjectId === sub.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sub.code} ({sub.excelColumn})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredSubjects
              .filter(s => selectedMatrixSubjectId === 'ALL' || s.id === selectedMatrixSubjectId)
              .map(sub => {
                const subTopics = topics
                  .filter(t => t.subjectId === sub.id)
                  .sort((a, b) => a.unitNumber - b.unitNumber);

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                  >
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono text-xs font-bold">
                          Kolon {sub.excelColumn} · {sub.code}
                        </span>
                        <h4 className="text-xs font-bold">{sub.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        {subTopics.length} Ünite
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-2.5">Ünite Adı</th>
                            <th className="py-2 px-2 text-center">Tekrar</th>
                            <th className="py-2 px-2">Son Çalışma</th>
                            <th className="py-2 px-2">Önerilen</th>
                            <th className="py-2 px-2 text-center">Gecikme (G)</th>
                            <th className="py-2 px-2.5 text-right">Kova</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {subTopics.map(t => {
                            const delayDays = calculateTopicDelayDays(t, todayStr);
                            const delayStyle = getDelayHeatmapStyle(delayDays);
                            const nextDate = getTopicNextTargetDate(t);

                            return (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="py-2 px-2.5 font-sans font-medium text-slate-900">
                                  <span className="font-mono text-slate-400 mr-1">
                                    #{String(t.unitNumber).padStart(2, '0')}
                                  </span>
                                  {t.title}
                                </td>
                                <td className="py-2 px-2 text-center tabular-nums font-bold text-slate-700">
                                  {t.reviewCount ?? 0}
                                </td>
                                <td className="py-2 px-2 tabular-nums text-slate-600">
                                  {t.lastStudiedDate || t.t0Date || '-'}
                                </td>
                                <td className="py-2 px-2 tabular-nums text-slate-700">
                                  {nextDate || (t.discharged ? 'Mezun' : '-')}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span
                                    style={{ backgroundColor: delayStyle.bgHex }}
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] tabular-nums ${delayStyle.textClass}`}
                                  >
                                    {delayDays}G
                                  </span>
                                </td>
                                <td className="py-2 px-2.5 text-right font-sans">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTestTopic(t)}
                                    className="font-semibold text-indigo-700 hover:underline"
                                  >
                                    {t.currentBucket === 'GREEN' || t.discharged
                                      ? '🟢 Yeşil'
                                      : t.currentBucket === 'YELLOW'
                                      ? '🟡 Sarı'
                                      : t.currentBucket === 'RED'
                                      ? '🔴 Kırmızı'
                                      : '⚪ Gir'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. Yeni Konu Ekleme Modalı */}
      {isAddTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Yeni DUS Konusu / Ünitesi Ekle</h3>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İlgili DUS Ders Bloğu (14 Kanonik Blok)
                </label>
                <select
                  value={newTopicSubjectId}
                  onChange={e => setNewTopicSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name} ({sub.category === 'TEMEL_BILIMLER' ? 'Temel' : 'Klinik'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ünite / Konu Başlığı
                </label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  placeholder="Örn: Adeziv Sistemler ve 10-MDP Kimyası..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kritik Alt Başlıklar (Virgülle Ayırın)
                </label>
                <textarea
                  rows={2}
                  value={newTopicSubtopics}
                  onChange={e => setNewTopicSubtopics(e.target.value)}
                  placeholder="Örn: 4. Jen Total-Etch, 8. Jen Üniversal Adeziv, HEMA faz ayrılması..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTopicModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Konuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Triyaj Modalı */}
      {activeTestTopic && (
        <TriageModal topic={activeTestTopic} onClose={() => setActiveTestTopic(null)} />
      )}
    </div>
  );
};
