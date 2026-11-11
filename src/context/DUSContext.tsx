/**
 * DUS 2027 Stratejik Yönetim Sistemi — Bilişsel Kova Triyajı, SWSPS, Deneme Analizi,
 * Sürükle-Bırak Takvim ve FSRS State Yönetimi (SSOT Context)
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  DUSSubject,
  TopicUnit,
  DailyGoal,
  TriageNotification,
  KovaTriageReport,
  TriageRecord,
  MockExamRecord,
  SemanticErrorRecord,
  DailyStudyQuestionLog,
  TopicTaxonomyItem,
  AnkiFsrsSnapshot,
  SystemParameters,
  CanonicalBranchCode,
  CognitiveErrorType,
  QuestionFormatType
} from '../types/dus';
import {
  CANONICAL_DUS_SUBJECTS,
  INITIAL_TOPIC_UNITS,
  STORAGE_KEYS
} from '../data/dusDatabase';
import {
  EXTENDED_STORAGE_KEYS,
  INITIAL_MOCK_EXAMS,
  INITIAL_SEMANTIC_ERRORS,
  INITIAL_DAILY_QUESTION_LOGS,
  INITIAL_TOPIC_TAXONOMY,
  INITIAL_ANKI_FSRS_SNAPSHOT,
  INITIAL_SYSTEM_PARAMETERS
} from '../data/excelMasterSeed';
import {
  evaluateT3Triage,
  evaluateT14Verification,
  evaluateSaturdayRepair,
  generateNotifications,
  generateTriageReport,
  getTodayString,
  addDays
} from '../utils/triage';
import {
  calculateSWSPS,
  calculateSWSPSBreakdown,
  enrichSemanticErrorsWithLiveSWSPS,
  evaluateMockExam,
  calculateQuestionLogMetrics,
  checkDuplicateAuditLog,
  CANONICAL_16_BRANCHES
} from '../utils/analytics';

interface DUSContextType {
  // Core State
  subjects: DUSSubject[];
  topics: TopicUnit[];
  dailyGoal: DailyGoal;
  notifications: TriageNotification[];
  report: KovaTriageReport;
  triageLogs: TriageRecord[];
  todayStr: string;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;

  // Excel-to-App Extended State
  mockExams: MockExamRecord[];
  semanticErrors: SemanticErrorRecord[];
  questionLogs: DailyStudyQuestionLog[];
  topicTaxonomy: TopicTaxonomyItem[];
  ankiSnapshot: AnkiFsrsSnapshot;
  systemParams: SystemParameters;

  // Topic & Drag-Drop Actions
  addTopic: (subjectId: string, title: string, subtopics?: string[]) => TopicUnit;
  updateTopic: (id: string, updates: Partial<TopicUnit>) => void;
  deleteTopic: (id: string) => void;
  rescheduleTopicTask: (topicId: string, newTargetDate: string) => void;
  clearTopicScheduledTask: (topicId: string) => void;
  deleteTriageLog: (logId: string) => void;
  inlineUpdateTopicPlan: (topicId: string, t0Date?: string, t3Correct?: number) => void;

  // Triage Test Actions
  recordT0Completion: (topicId: string, correct: number, total?: number, notes?: string) => void;
  recordT3Triage: (topicId: string, correct: number, total?: number, notes?: string) => void;
  recordT14Verification: (topicId: string, correct: number, total?: number, notes?: string) => void;
  recordSaturdayRepair: (topicId: string, correct: number, total?: number, notes?: string) => void;

  // Mock Exam, SWSPS Error, Question Log & System Parameter Actions
  addMockExam: (
    date: string,
    institution: string,
    branchNets: Record<CanonicalBranchCode, number>,
    notes?: string
  ) => MockExamRecord;
  deleteMockExam: (id: string) => void;
  addSemanticError: (payload: {
    date: string;
    source: string;
    branchCode: CanonicalBranchCode;
    semanticCode: string;
    subtopic: string;
    questionSummary: string;
    errorType: CognitiveErrorType;
    distractorAnalysis: string;
    ankiClozeText?: string;
    mockExamId?: string;
  }) => SemanticErrorRecord;
  toggleSemanticErrorAnkiStatus: (id: string) => void;
  deleteSemanticError: (id: string) => void;
  addQuestionLog: (payload: {
    date: string;
    sourceBook: string;
    branchCode: CanonicalBranchCode;
    semanticCode: string;
    questionFormat: QuestionFormatType;
    correct: number;
    wrong: number;
    empty: number;
    durationMinutes: number;
    notes?: string;
  }) => DailyStudyQuestionLog;
  deleteQuestionLog: (id: string) => void;
  updateTaxonomyItem: (id: string, updates: Partial<TopicTaxonomyItem>) => void;
  updateAnkiSnapshot: (updates: Partial<AnkiFsrsSnapshot>) => void;
  updateSystemParams: (updates: Partial<SystemParameters>) => void;

  // Daily Goal Actions
  updateDailyGoal: (updates: Partial<DailyGoal>) => void;
  toggleBlockDone: (block: 'block1Done' | 'block2Done' | 'block3Done' | 'block4Done') => void;
  addGoalChecklistItem: (text: string) => void;
  toggleGoalChecklistItem: (itemId: string) => void;
  deleteGoalChecklistItem: (itemId: string) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  requestBrowserNotificationPermission: () => Promise<boolean>;
  toggleSound: () => void;

  // System Actions
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  resetToInitialData: () => void;
}

const DUSContext = createContext<DUSContextType | undefined>(undefined);

function playGentleChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {
    // Ses çalınamazsa sessizce yoksay
  }
}

const DEFAULT_SEED_TRIAGE_LOGS: TriageRecord[] = [
  {
    id: 'log-seed-green-b16',
    recordCode: 'TEKRAR-0001',
    topicId: 'unit-b16-10',
    subjectId: 'B16',
    topicTitle: '10 DENTAL AMALGAM',
    subjectName: 'Restoratif Diş Tedavisi',
    date: '2026-11-05',
    stage: 'T3_MAIN',
    correct: 36,
    wrong: 4,
    empty: 0,
    total: 40,
    percentage: 90,
    resultingBucket: 'GREEN',
    resultingPriority: 'P4_LOW',
    clinicalDiagnosis: 'Araya 3 tam gün girmesine rağmen şema neokortekste sağlam (≥%85).',
    recommendedAction: 'HİÇBİR GÖREV EKLENMEZ (Taburcu!).',
    validationStatus: 'Geçerli'
  },
  {
    id: 'log-seed-yellow-b14',
    recordCode: 'TEKRAR-0002',
    topicId: 'unit-b14-05',
    subjectId: 'B14',
    topicTitle: '5- PERİODONTİTİS',
    subjectName: 'Periodontoloji',
    date: '2026-11-08',
    stage: 'T3_MAIN',
    correct: 30,
    wrong: 10,
    empty: 0,
    total: 40,
    percentage: 75,
    resultingBucket: 'YELLOW',
    resultingPriority: 'P2_HIGH',
    clinicalDiagnosis: 'Sarı Kova (%75). Evre III-IV ayrımı 3 günde erimiş.',
    recommendedAction: 'T+14 gününe (2026-11-22) 2. Bankadan 20 soru doğrulama atandı.',
    validationStatus: 'Geçerli'
  },
  {
    id: 'log-seed-red-b05',
    recordCode: 'TEKRAR-0003',
    topicId: 'unit-b05-04',
    subjectId: 'B05',
    topicTitle: '4 virüsler',
    subjectName: 'Tıbbi Mikrobiyoloji',
    date: '2026-11-10',
    stage: 'T3_MAIN',
    correct: 24,
    wrong: 16,
    empty: 0,
    total: 40,
    percentage: 60,
    resultingBucket: 'RED',
    resultingPriority: 'P1_CRITICAL',
    clinicalDiagnosis: 'Kırmızı Kova (%60). Virüs reseptör eşleşmeleri sınavda karıştı.',
    recommendedAction: 'Cumartesi Kova Onarım Bloğuna (2026-11-14) 25 dk Boş Kağıt + 30 soru atandı.',
    validationStatus: 'Geçerli'
  }
];

export const DUSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todayStr] = useState<string>(getTodayString());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  });

  // Subjects
  const [subjects] = useState<DUSSubject[]>(CANONICAL_DUS_SUBJECTS);

  // Topics (with K0001..K0227 code enrichment & half-cleared task normalization)
  const [topics, setTopics] = useState<TopicUnit[]>(() => {
    let rawTopics = INITIAL_TOPIC_UNITS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (saved) rawTopics = JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage topics error', e);
    }
    return rawTopics.map((t, idx) => {
      const topicCode = t.topicCode || `K${String(idx + 1).padStart(4, '0')}`;
      const isGreenOrDischarged = t.discharged || t.currentBucket === 'GREEN';
      const hasScheduledTarget = Boolean(t.t3DueDate || t.t14DueDate || t.saturdayRepairDate);

      // Eğer ünite mezun değilse ve planlı tarihi silinmişse (yarım kalmış silme durumu), kova ve statüsünü de sıfırla
      if (!isGreenOrDischarged && !hasScheduledTarget && (t.status !== 'NOT_STARTED' || t.currentBucket !== 'NONE')) {
        return {
          ...t,
          topicCode,
          status: 'NOT_STARTED',
          currentBucket: 'NONE',
          priority: 'P3_MEDIUM',
          discharged: false,
          t0Date: undefined,
          t3DueDate: undefined,
          t14DueDate: undefined,
          saturdayRepairDate: undefined,
          lastStudiedDate: undefined,
          t0Score: undefined,
          t3Score: undefined,
          t14Score: undefined,
          repairScore: undefined,
          reviewCount: 0
        };
      }

      return {
        ...t,
        topicCode,
        reviewCount: t.reviewCount ?? (t.status === 'NOT_STARTED' ? 0 : t.status === 'T0_DONE' ? 1 : 2),
        lastStudiedDate: t.lastStudiedDate || t.t3Score?.date || t.t0Date
      };
    });
  });

  // Triage History / Audit Logs (Tekrar_Kaydi — aktif ünite durumlarıyla senkronize)
  const [triageLogs, setTriageLogs] = useState<TriageRecord[]>(() => {
    let initialLogs = DEFAULT_SEED_TRIAGE_LOGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRIAGE_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved) as TriageRecord[];
        // Eski uyumsuz seed kayıtlarını (unit-b01-01, unit-b15-03) temizle
        const filteredLegacy = parsed.filter(
          l => l.id !== 'log-seed-1' && l.id !== 'log-seed-2'
        );
        initialLogs = filteredLegacy.length > 0 ? filteredLegacy : DEFAULT_SEED_TRIAGE_LOGS;
      }
    } catch (e) {
      console.warn('LocalStorage triage logs error', e);
    }
    return initialLogs.filter(log => {
      const matchedTopic = topics.find(t => t.id === log.topicId);
      return matchedTopic ? matchedTopic.status !== 'NOT_STARTED' : false;
    });
  });

  // System Parameters (Parametreler_Ayar)
  const [systemParams, setSystemParams] = useState<SystemParameters>(() => {
    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.SYSTEM_PARAMS);
      if (saved) {
        const parsed = JSON.parse(saved) as SystemParameters;
        if (parsed.ownerRole && /intörn|intern/i.test(parsed.ownerRole)) {
          parsed.ownerRole = INITIAL_SYSTEM_PARAMETERS.ownerRole;
        }
        if (parsed.ownerName === 'Furkan Kurt') {
          parsed.ownerName = INITIAL_SYSTEM_PARAMETERS.ownerName;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_SYSTEM_PARAMETERS;
  });

  // Mock Exams (Deneme_Analiz)
  const [mockExams, setMockExams] = useState<MockExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.MOCK_EXAMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MOCK_EXAMS;
  });

  // Topic Taxonomy (Konu_Matrisi — Temel Bilimler: 0.4, Klinik Bilimler: 0.6, Ünite Ağırlığı: Daha Sonra Eklenecek)
  const [topicTaxonomy, setTopicTaxonomy] = useState<TopicTaxonomyItem[]>(() => {
    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.TOPIC_TAXONOMY);
      if (saved) {
        const parsed = JSON.parse(saved) as TopicTaxonomyItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized: TopicTaxonomyItem[] = parsed.map(item => {
            const isClinical = ['B09', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16'].includes(
              item.branchCode
            );
            return {
              ...item,
              category: isClinical ? 'KLINIK_BILIMLER' : 'TEMEL_BILIMLER',
              dusWeight: isClinical ? 0.6 : 0.4,
              unitWeight: typeof item.unitWeight === 'number' ? item.unitWeight : null
            };
          });
          // Eksik B08 (Tıbbi Biyoloji ve Genetik) varsa ekle ve B01..B16 sırasına göre diz
          for (const seedItem of INITIAL_TOPIC_TAXONOMY) {
            if (!normalized.some(n => n.semanticCode === seedItem.semanticCode)) {
              normalized.push(seedItem);
            }
          }
          return normalized
            .sort((a, b) => a.branchCode.localeCompare(b.branchCode))
            .map((item, idx) => ({
              ...item,
              id: `KM-${String(idx + 1).padStart(2, '0')}`
            }));
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_TOPIC_TAXONOMY;
  });

  // Semantic Errors (Semantik_Hata_Analizi)
  const [semanticErrors, setSemanticErrors] = useState<SemanticErrorRecord[]>(() => {
    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.SEMANTIC_ERRORS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SEMANTIC_ERRORS;
  });

  // Daily Question & Speed Logs (Gunluk_Log & Soru_Bankasi_Metrikleri)
  const [questionLogs, setQuestionLogs] = useState<DailyStudyQuestionLog[]>(() => {
    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.QUESTION_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_DAILY_QUESTION_LOGS;
  });

  // Anki FSRS Snapshot (Anki_FSRS_Takip)
  const [ankiSnapshot, setAnkiSnapshot] = useState<AnkiFsrsSnapshot>(() => {
    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.ANKI_SNAPSHOT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ANKI_FSRS_SNAPSHOT;
  });

  // Daily Goal
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage goal error', e);
    }
    return {
      date: todayStr,
      targetStudyMinutes: 360,
      completedStudyMinutes: 120,
      targetQuestions: 100,
      completedQuestions: 50,
      block1Done: true,
      block2Done: false,
      block3Done: false,
      block4Done: false,
      checklist: [
        { id: 'c1', text: 'Blok 1: İki Desteli Anki Öncelikli Deste sıfırlandı (15-20 dk)', done: true },
        { id: 'c2', text: 'Blok 2: Periodontoloji 2017 sınıflaması T+0 Boş Kağıt anlatımı', done: false },
        { id: 'c3', text: 'Blok 3: Amalgam T+3 geri çağırma 40 sorusu çözüldü', done: true },
        { id: 'c4', text: 'Blok 4: Akşam Karma Branş Denemesi + Anında Anki Cloze kaydı', done: false }
      ],
      notes: 'Bilişsel yorgunluk hissettiğinde yeni konu açma, T+3 kuyruğunu erit!'
    };
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
    } catch {}
  }, [topics]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(dailyGoal));
    } catch {}
  }, [dailyGoal]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRIAGE_LOGS, JSON.stringify(triageLogs));
    } catch {}
  }, [triageLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(EXTENDED_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(mockExams));
    } catch {}
  }, [mockExams]);

  useEffect(() => {
    try {
      localStorage.setItem(EXTENDED_STORAGE_KEYS.SEMANTIC_ERRORS, JSON.stringify(semanticErrors));
    } catch {}
  }, [semanticErrors]);

  useEffect(() => {
    try {
      localStorage.setItem(EXTENDED_STORAGE_KEYS.QUESTION_LOGS, JSON.stringify(questionLogs));
    } catch {}
  }, [questionLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(EXTENDED_STORAGE_KEYS.TOPIC_TAXONOMY, JSON.stringify(topicTaxonomy));
    } catch {}
  }, [topicTaxonomy]);

  useEffect(() => {
    try {
      localStorage.setItem(EXTENDED_STORAGE_KEYS.ANKI_SNAPSHOT, JSON.stringify(ankiSnapshot));
    } catch {}
  }, [ankiSnapshot]);

  useEffect(() => {
    try {
      localStorage.setItem(EXTENDED_STORAGE_KEYS.SYSTEM_PARAMS, JSON.stringify(systemParams));
    } catch {}
  }, [systemParams]);

  // Reactive Notifications
  const notifications = useMemo(() => {
    return generateNotifications(topics, todayStr);
  }, [topics, todayStr]);

  // Reactive Kova Triage Executive Report
  const report = useMemo(() => {
    return generateTriageReport(subjects, topics, todayStr);
  }, [subjects, topics, todayStr]);

  // Reactive SWSPS v2.0 Dynamic Prioritization (Kova + Branş + Anki Sönümlemesi + Yaşlanma)
  const liveSemanticErrors = useMemo(() => {
    return enrichSemanticErrorsWithLiveSWSPS(
      semanticErrors,
      topics,
      topicTaxonomy,
      todayStr,
      systemParams.errorWeights
    );
  }, [semanticErrors, topics, topicTaxonomy, todayStr, systemParams.errorWeights]);

  const requestBrowserNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === 'granted';
      setBrowserNotificationsEnabled(granted);
      if (granted && notifications.length > 0) {
        new Notification('DUS Kova Triyajı Bildirimleri Aktif', {
          body: `Bugün bekleyen ${notifications.length} adet triyaj göreviniz bulunmaktadır.`,
          icon: '/favicon.ico'
        });
      }
      return granted;
    } catch {
      return false;
    }
  }, [notifications]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const notifyUser = useCallback(
    (title: string, body: string) => {
      if (soundEnabled) {
        playGentleChime();
      }
      if (
        browserNotificationsEnabled &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch {
          // ignore
        }
      }
    },
    [soundEnabled, browserNotificationsEnabled]
  );

  // Topic CRUD
  const addTopic = useCallback(
    (subjectId: string, title: string, subtopics: string[] = []): TopicUnit => {
      const existingSubjectTopics = topics.filter(t => t.subjectId === subjectId);
      const newUnitNumber = existingSubjectTopics.length + 1;
      const nextCodeNum = topics.length + 1;
      const newTopic: TopicUnit = {
        id: `unit-${subjectId.toLowerCase()}-${Date.now().toString(36)}`,
        topicCode: `K${String(nextCodeNum).padStart(4, '0')}`,
        subjectId,
        unitNumber: newUnitNumber,
        title: title.trim(),
        subtopics,
        status: 'NOT_STARTED',
        currentBucket: 'NONE',
        priority: 'P3_MEDIUM',
        reviewCount: 0,
        discharged: false,
        createdAt: todayStr,
        updatedAt: todayStr
      };

      setTopics(prev => [newTopic, ...prev]);
      notifyUser(
        'Yeni Konu Eklendi',
        `${title} başarıyla sisteme kaydedildi. T+0 ilk kodlamaya başlayabilirsiniz.`
      );
      return newTopic;
    },
    [topics, todayStr, notifyUser]
  );

  const updateTopic = useCallback(
    (id: string, updates: Partial<TopicUnit>) => {
      setTopics(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: todayStr } : t))
      );
    },
    [todayStr]
  );

  const deleteTopic = useCallback((id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Tekrar_Takvimi (Sayfa 9 & 20): Sürükle-Bırak (Drag & Drop) ile Görev Erteleme / Taşıma
   */
  const rescheduleTopicTask = useCallback(
    (topicId: string, newTargetDate: string) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic || !newTargetDate) return;

      const updates: Partial<TopicUnit> = {};
      if (topic.currentBucket === 'RED') {
        updates.saturdayRepairDate = newTargetDate;
      } else if (topic.currentBucket === 'YELLOW') {
        updates.t14DueDate = newTargetDate;
      } else {
        updates.status = topic.status === 'NOT_STARTED' ? 'T0_DONE' : topic.status;
        updates.t3DueDate = newTargetDate;
      }

      updateTopic(topicId, updates);
      notifyUser(
        'Takvim Görevi Taşındı',
        `${topic.title} görevi ${newTargetDate} tarihine başarıyla taşındı. Yoğunluk ısı haritası güncellendi.`
      );
    },
    [topics, updateTopic, notifyUser]
  );

  /**
   * Planlanmış Triyaj Görevini Sil (Ünite müfredatta korunur; takvim, kuyruk, triyaj raporu ve denetim kaydından görev kaldırılır)
   */
  const clearTopicScheduledTask = useCallback(
    (topicId: string) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;

      setTopics(prev =>
        prev.map(t =>
          t.id === topicId
            ? {
                ...t,
                status: 'NOT_STARTED',
                currentBucket: 'NONE',
                priority: 'P3_MEDIUM',
                discharged: false,
                t0Date: undefined,
                t3DueDate: undefined,
                t14DueDate: undefined,
                saturdayRepairDate: undefined,
                lastStudiedDate: undefined,
                t0Score: undefined,
                t3Score: undefined,
                t14Score: undefined,
                repairScore: undefined,
                reviewCount: 0,
                updatedAt: todayStr
              }
            : t
        )
      );

      // Takvimden silinen görevin Tekrar_Kaydi (triageLogs) ve otomatik soru kayıtlarını da temizle
      setTriageLogs(prev => prev.filter(l => l.topicId !== topicId));
      if (topic.topicCode) {
        setQuestionLogs(prev => prev.filter(q => q.semanticCode !== topic.topicCode));
      }

      notifyUser(
        'Planlı Görev Tüm Sekmelerden Kaldırıldı',
        `${topic.title} ünitesi müfredatta korunarak takvim, kuyruk ve triyaj raporundaki görevi silindi.`
      );
    },
    [topics, todayStr, notifyUser]
  );

  /**
   * Tekrar_Kaydi (Sayfa 8): Denetim kaydını sil ve bağlı ünite görevini tüm sekmelerden kaldır
   */
  const deleteTriageLog = useCallback(
    (logId: string) => {
      const targetLog = triageLogs.find(l => l.id === logId);
      setTriageLogs(prev => prev.filter(l => l.id !== logId));
      if (targetLog) {
        clearTopicScheduledTask(targetLog.topicId);
      }
    },
    [triageLogs, clearTopicScheduledTask]
  );

  // Yardımcı: Triyaj testlerini Gunluk_Log & Soru_Bankasi_Metrikleri sekmesine de otomatik yansıt
  const appendAutoQuestionLog = useCallback(
    (
      topic: TopicUnit,
      sourceBook: string,
      correct: number,
      total: number,
      durationMinutes: number,
      notes?: string
    ) => {
      const branchCode = (topic.subjectId as CanonicalBranchCode) || 'B09';
      const branchSpec = CANONICAL_16_BRANCHES.find(b => b.code === branchCode);
      const wrong = Math.max(0, total - correct);
      const calc = calculateQuestionLogMetrics(correct, wrong, 0, durationMinutes);

      setQuestionLogs(prev => {
        const nextId = `LOG-${String(prev.length + 1).padStart(2, '0')}`;
        const newLog: DailyStudyQuestionLog = {
          id: nextId,
          date: todayStr,
          sourceBook,
          branchCode,
          branchName: branchSpec?.name || branchCode,
          semanticCode: topic.topicCode || `K0001`,
          questionFormat: 'Klinik Vaka / Senaryo',
          totalQuestions: calc.totalQuestions,
          correct,
          wrong,
          empty: 0,
          net: calc.net,
          accuracyPercent: calc.accuracyPercent,
          durationMinutes,
          speedSecondsPerQuestion: calc.speedSecondsPerQuestion,
          notes: notes || `${topic.title} triyaj testi`
        };
        return [newLog, ...prev];
      });
    },
    [todayStr]
  );

  /**
   * Tekrar_Plani (Sayfa 6): Tablodan Doğrudan T+0 Tarihi ve T+3 Doğru (0-40) Hızlı Girişi
   */
  const inlineUpdateTopicPlan = useCallback(
    (topicId: string, t0Date?: string, t3Correct?: number) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      const subject = subjects.find(s => s.id === topic.subjectId);

      if (t0Date !== undefined && t3Correct === undefined) {
        if (!t0Date) {
          clearTopicScheduledTask(topicId);
          return;
        }
        const computedT3 = addDays(t0Date, 3);
        updateTopic(topicId, {
          status: topic.status === 'NOT_STARTED' ? 'T0_DONE' : topic.status,
          t0Date,
          t3DueDate: computedT3,
          lastStudiedDate: t0Date,
          reviewCount: Math.max(1, topic.reviewCount || 0)
        });
      }

      if (t3Correct !== undefined && !Number.isNaN(t3Correct)) {
        const clamped = Math.max(0, Math.min(40, t3Correct));
        const baseT0 = t0Date || topic.t0Date || addDays(todayStr, -3);
        const computedT3 = addDays(baseT0, 3);
        const triageResult = evaluateT3Triage(clamped, 40, todayStr);
        const validationStatus = checkDuplicateAuditLog(triageLogs, topicId, todayStr);

        updateTopic(topicId, {
          t0Date: baseT0,
          t3DueDate: computedT3,
          status: triageResult.bucket === 'GREEN' ? 'DISCHARGED' : 'TRIAGED',
          currentBucket: triageResult.bucket,
          priority: triageResult.priority,
          discharged: triageResult.bucket === 'GREEN',
          t14DueDate:
            triageResult.bucket === 'YELLOW' ? triageResult.nextScheduledDate : undefined,
          saturdayRepairDate:
            triageResult.bucket === 'RED' ? triageResult.nextScheduledDate : undefined,
          lastStudiedDate: todayStr,
          reviewCount: (topic.reviewCount || 1) + 1,
          t3Score: {
            correct: clamped,
            wrong: 40 - clamped,
            total: 40,
            percentage: triageResult.percentage,
            date: todayStr
          }
        });

        const log: TriageRecord = {
          id: `log-${Date.now().toString(36)}`,
          recordCode: `TEKRAR-${String(triageLogs.length + 1).padStart(4, '0')}`,
          topicId,
          subjectId: topic.subjectId,
          topicTitle: topic.title,
          subjectName: subject?.name || 'Ders',
          date: todayStr,
          stage: 'T3_MAIN',
          correct: clamped,
          wrong: 40 - clamped,
          empty: 0,
          total: 40,
          percentage: triageResult.percentage,
          resultingBucket: triageResult.bucket,
          resultingPriority: triageResult.priority,
          clinicalDiagnosis: triageResult.clinicalDiagnosis,
          recommendedAction: triageResult.recommendedAction,
          validationStatus
        };

        setTriageLogs(prev => [log, ...prev.filter(l => l.topicId !== topicId)]);
      }
    },
    [topics, subjects, todayStr, triageLogs, updateTopic, clearTopicScheduledTask]
  );

  // T0 Kalibrasyon Tamamlama
  const recordT0Completion = useCallback(
    (topicId: string, correct: number, total: number = 10, notes?: string) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;

      const t3Date = addDays(todayStr, 3);
      const percentage = Math.round((correct / total) * 100);

      updateTopic(topicId, {
        status: 'T0_DONE',
        t0Date: todayStr,
        t3DueDate: t3Date,
        lastStudiedDate: todayStr,
        reviewCount: (topic.reviewCount || 0) + 1,
        t0Score: {
          correct,
          wrong: total - correct,
          total,
          percentage,
          date: todayStr
        },
        clinicalNotes: notes || topic.clinicalNotes
      });

      setDailyGoal(prev => ({
        ...prev,
        completedQuestions: prev.completedQuestions + total,
        completedStudyMinutes: prev.completedStudyMinutes + 10
      }));

      appendAutoQuestionLog(topic, '1. Soru Bankası (T+0 Kalibrasyon)', correct, total, 10, notes);

      notifyUser(
        'T+0 Kalibrasyonu Tamamlandı',
        `${topic.title}: 10 soruluk örnekleme kaydedildi. 3 gün sonra (${t3Date}) T+3 esas 40 soru kilitlendi.`
      );
    },
    [topics, todayStr, updateTopic, appendAutoQuestionLog, notifyUser]
  );

  // T+3 Esas Triyaj Kaydı
  const recordT3Triage = useCallback(
    (topicId: string, correct: number, total: number = 40, notes?: string) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      const subject = subjects.find(s => s.id === topic.subjectId);

      const triageResult = evaluateT3Triage(correct, total, todayStr);
      const validationStatus = checkDuplicateAuditLog(triageLogs, topicId, todayStr);

      const updatedTopic: Partial<TopicUnit> = {
        status: triageResult.bucket === 'GREEN' ? 'DISCHARGED' : 'TRIAGED',
        currentBucket: triageResult.bucket,
        priority: triageResult.priority,
        discharged: triageResult.bucket === 'GREEN',
        t14DueDate: triageResult.bucket === 'YELLOW' ? triageResult.nextScheduledDate : undefined,
        saturdayRepairDate:
          triageResult.bucket === 'RED' ? triageResult.nextScheduledDate : undefined,
        lastStudiedDate: todayStr,
        reviewCount: (topic.reviewCount || 1) + 1,
        t3Score: {
          correct,
          wrong: total - correct,
          total,
          percentage: triageResult.percentage,
          date: todayStr
        },
        clinicalNotes: notes
          ? `${topic.clinicalNotes ? topic.clinicalNotes + ' | ' : ''}${notes}`
          : topic.clinicalNotes
      };

      updateTopic(topicId, updatedTopic);

      const log: TriageRecord = {
        id: `log-${Date.now().toString(36)}`,
        recordCode: `TEKRAR-${String(triageLogs.length + 1).padStart(4, '0')}`,
        topicId,
        subjectId: topic.subjectId,
        topicTitle: topic.title,
        subjectName: subject?.name || 'Ders',
        date: todayStr,
        stage: 'T3_MAIN',
        correct,
        wrong: total - correct,
        empty: 0,
        total,
        percentage: triageResult.percentage,
        resultingBucket: triageResult.bucket,
        resultingPriority: triageResult.priority,
        clinicalDiagnosis: triageResult.clinicalDiagnosis,
        recommendedAction: triageResult.recommendedAction,
        validationStatus,
        notes
      };

      setTriageLogs(prev => [log, ...prev]);

      setDailyGoal(prev => ({
        ...prev,
        completedQuestions: prev.completedQuestions + total,
        completedStudyMinutes: prev.completedStudyMinutes + 35
      }));

      appendAutoQuestionLog(topic, '1. Soru Bankası (T+3 Triyaj)', correct, total, 35, notes);

      const bucketLabel =
        triageResult.bucket === 'GREEN'
          ? '🟢 Yeşil Kova (Taburcu)'
          : triageResult.bucket === 'YELLOW'
          ? '🟡 Sarı Kova (Müşahede - T+14)'
          : '🔴 Kırmızı Kova (Yoğun Bakım - Cumartesi)';
      notifyUser(
        `Kova Triyajı Kararı: ${bucketLabel}`,
        `${topic.title}: %${triageResult.percentage} başarı (${correct}/${total}). ${triageResult.recommendedAction}`
      );
    },
    [topics, subjects, todayStr, triageLogs, updateTopic, appendAutoQuestionLog, notifyUser]
  );

  // Sarı Kova T+14 Doğrulama Kaydı
  const recordT14Verification = useCallback(
    (topicId: string, correct: number, total: number = 20, notes?: string) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      const subject = subjects.find(s => s.id === topic.subjectId);

      const triageResult = evaluateT14Verification(correct, total, todayStr);
      const validationStatus = checkDuplicateAuditLog(triageLogs, topicId, todayStr);

      updateTopic(topicId, {
        currentBucket: triageResult.bucket,
        priority: triageResult.priority,
        discharged: triageResult.bucket === 'GREEN',
        status: triageResult.bucket === 'GREEN' ? 'DISCHARGED' : 'TRIAGED',
        t14DueDate: triageResult.bucket === 'YELLOW' ? triageResult.nextScheduledDate : undefined,
        saturdayRepairDate:
          triageResult.bucket === 'RED' ? triageResult.nextScheduledDate : undefined,
        lastStudiedDate: todayStr,
        reviewCount: (topic.reviewCount || 2) + 1,
        t14Score: {
          correct,
          wrong: total - correct,
          total,
          percentage: triageResult.percentage,
          date: todayStr
        }
      });

      const log: TriageRecord = {
        id: `log-${Date.now().toString(36)}`,
        recordCode: `TEKRAR-${String(triageLogs.length + 1).padStart(4, '0')}`,
        topicId,
        subjectId: topic.subjectId,
        topicTitle: topic.title,
        subjectName: subject?.name || 'Ders',
        date: todayStr,
        stage: 'T14_VERIFICATION',
        correct,
        wrong: total - correct,
        empty: 0,
        total,
        percentage: triageResult.percentage,
        resultingBucket: triageResult.bucket,
        resultingPriority: triageResult.priority,
        clinicalDiagnosis: triageResult.clinicalDiagnosis,
        recommendedAction: triageResult.recommendedAction,
        validationStatus,
        notes
      };

      setTriageLogs(prev => [log, ...prev]);
      setDailyGoal(prev => ({
        ...prev,
        completedQuestions: prev.completedQuestions + total,
        completedStudyMinutes: prev.completedStudyMinutes + 20
      }));

      appendAutoQuestionLog(topic, '2. Soru Bankası (T+14 Doğrulama)', correct, total, 20, notes);

      notifyUser(
        `T+14 Doğrulama: ${
          triageResult.bucket === 'GREEN'
            ? 'Yeşile Terfi Etti!'
            : triageResult.bucket === 'RED'
            ? 'Kırmızıya Düştü!'
            : 'Sarı Kovada Devam'
        }`,
        `${topic.title}: ${triageResult.recommendedAction}`
      );
    },
    [topics, subjects, todayStr, triageLogs, updateTopic, appendAutoQuestionLog, notifyUser]
  );

  // Kırmızı Kova Cumartesi Onarım Kaydı
  const recordSaturdayRepair = useCallback(
    (topicId: string, correct: number, total: number = 30, notes?: string) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      const subject = subjects.find(s => s.id === topic.subjectId);

      const triageResult = evaluateSaturdayRepair(correct, total, todayStr);
      const validationStatus = checkDuplicateAuditLog(triageLogs, topicId, todayStr);

      updateTopic(topicId, {
        currentBucket: triageResult.bucket,
        priority: triageResult.priority,
        t14DueDate: triageResult.bucket === 'YELLOW' ? triageResult.nextScheduledDate : undefined,
        saturdayRepairDate:
          triageResult.bucket === 'RED' ? triageResult.nextScheduledDate : undefined,
        lastStudiedDate: todayStr,
        reviewCount: (topic.reviewCount || 2) + 1,
        repairScore: {
          correct,
          wrong: total - correct,
          total,
          percentage: triageResult.percentage,
          date: todayStr
        }
      });

      const log: TriageRecord = {
        id: `log-${Date.now().toString(36)}`,
        recordCode: `TEKRAR-${String(triageLogs.length + 1).padStart(4, '0')}`,
        topicId,
        subjectId: topic.subjectId,
        topicTitle: topic.title,
        subjectName: subject?.name || 'Ders',
        date: todayStr,
        stage: 'SATURDAY_REPAIR',
        correct,
        wrong: total - correct,
        empty: 0,
        total,
        percentage: triageResult.percentage,
        resultingBucket: triageResult.bucket,
        resultingPriority: triageResult.priority,
        clinicalDiagnosis: triageResult.clinicalDiagnosis,
        recommendedAction: triageResult.recommendedAction,
        validationStatus,
        notes
      };

      setTriageLogs(prev => [log, ...prev]);
      setDailyGoal(prev => ({
        ...prev,
        completedQuestions: prev.completedQuestions + total,
        completedStudyMinutes: prev.completedStudyMinutes + 50
      }));

      appendAutoQuestionLog(topic, '2. Soru Bankası (Cumartesi Onarım)', correct, total, 30, notes);

      notifyUser(
        `Cumartesi Onarım Sonucu: ${
          triageResult.bucket === 'YELLOW' ? 'Sarı Kovaya Terfi Etti!' : 'Kırmızı Kovada Kaldı'
        }`,
        `${topic.title}: ${triageResult.recommendedAction}`
      );
    },
    [topics, subjects, todayStr, triageLogs, updateTopic, appendAutoQuestionLog, notifyUser]
  );

  // Deneme_Analiz CRUD
  const addMockExam = useCallback(
    (
      date: string,
      institution: string,
      branchNets: Record<CanonicalBranchCode, number>,
      notes?: string
    ): MockExamRecord => {
      const nextId = `DENEME-${String(mockExams.length + 1).padStart(2, '0')}`;
      const record = evaluateMockExam(
        nextId,
        date,
        institution,
        branchNets,
        systemParams.targetTotalNet,
        systemParams.adccEliteThreshold,
        notes
      );
      setMockExams(prev => [...prev, record]);
      notifyUser(
        `Yeni Deneme Kaydedildi (${nextId})`,
        `Toplam Net: ${record.totalNet} / 120 (${record.adccStatus}). Hedef Farkı: ${
          record.targetDiff >= 0 ? '+' : ''
        }${record.targetDiff}`
      );
      return record;
    },
    [mockExams.length, systemParams.targetTotalNet, systemParams.adccEliteThreshold, notifyUser]
  );

  const deleteMockExam = useCallback((id: string) => {
    setMockExams(prev => prev.filter(m => m.id !== id));
  }, []);

  // Semantik_Hata_Analizi (SWSPS) CRUD
  const addSemanticError = useCallback(
    (payload: {
      date: string;
      source: string;
      branchCode: CanonicalBranchCode;
      semanticCode: string;
      subtopic: string;
      questionSummary: string;
      errorType: CognitiveErrorType;
      distractorAnalysis: string;
      ankiClozeText?: string;
      mockExamId?: string;
    }): SemanticErrorRecord => {
      const branchSpec = CANONICAL_16_BRANCHES.find(b => b.code === payload.branchCode);
      const taxonomy = topicTaxonomy.find(t => t.semanticCode === payload.semanticCode);
      const existingRepeats = semanticErrors.filter(
        e => e.semanticCode === payload.semanticCode
      ).length;

      const isAddedToAnki = Boolean(payload.ankiClozeText);
      const branchTopics = topics.filter(t => t.subjectId === payload.branchCode);
      const matchedTopic =
        branchTopics.find(t => t.currentBucket === 'RED') ||
        branchTopics.find(t => t.currentBucket === 'YELLOW') ||
        branchTopics.find(t => t.currentBucket === 'GREEN') ||
        branchTopics[0];

      const breakdown = calculateSWSPSBreakdown({
        errorType: payload.errorType,
        repeatCount: existingRepeats + 1,
        difficultyD: taxonomy?.fsrsDifficultyD ?? 7.5,
        fsrsRetrievabilityR: taxonomy?.fsrsRetrievabilityR ?? 75,
        daysElapsed: 0,
        customWeights: systemParams.errorWeights,
        bucket: matchedTopic?.currentBucket || 'NONE',
        branchCode: payload.branchCode,
        ankiClozeStatus: isAddedToAnki ? 'Eklendi' : 'Bekliyor',
        isTopicDischarged: Boolean(matchedTopic?.discharged),
        matchedTopicId: matchedTopic?.id,
        matchedTopicTitle: matchedTopic?.title
      });

      const nextId = `ERR-${String(semanticErrors.length + 1).padStart(2, '0')}`;
      const newRecord: SemanticErrorRecord = {
        id: nextId,
        date: payload.date,
        source: payload.source,
        branchCode: payload.branchCode,
        branchName: branchSpec?.name || payload.branchCode,
        semanticCode: payload.semanticCode,
        subtopic: payload.subtopic,
        questionSummary: payload.questionSummary,
        errorType: payload.errorType,
        distractorAnalysis: payload.distractorAnalysis,
        ankiClozeStatus: isAddedToAnki ? 'Eklendi' : 'Bekliyor',
        ankiClozeText: payload.ankiClozeText,
        swspsScore: breakdown.finalScore,
        breakdown,
        mockExamId: payload.mockExamId
      };

      setSemanticErrors(prev => [newRecord, ...prev]);

      if (isAddedToAnki) {
        setAnkiSnapshot(prev => ({
          ...prev,
          totalCards: prev.totalCards + 1,
          youngCards: prev.youngCards + 1,
          branchStats: prev.branchStats.map(bm =>
            bm.branchCode === payload.branchCode
              ? { ...bm, totalCards: bm.totalCards + 1, youngCards: bm.youngCards + 1 }
              : bm
          )
        }));
      }

      notifyUser(
        `SWSPS v2.0 Hata Teşhisi (${nextId})`,
        `${newRecord.subtopic} — SWSPS: ${breakdown.finalScore} Puan (${breakdown.tierLabel})`
      );
      return newRecord;
    },
    [topicTaxonomy, semanticErrors, topics, systemParams.errorWeights, notifyUser]
  );

  const toggleSemanticErrorAnkiStatus = useCallback(
    (id: string) => {
      const targetErr = semanticErrors.find(e => e.id === id);
      if (!targetErr) return;
      const nextStatus = targetErr.ankiClozeStatus === 'Eklendi' ? 'Bekliyor' : 'Eklendi';
      const delta = nextStatus === 'Eklendi' ? 1 : -1;

      setSemanticErrors(prev =>
        prev.map(e => (e.id === id ? { ...e, ankiClozeStatus: nextStatus } : e))
      );

      setAnkiSnapshot(prev => ({
        ...prev,
        totalCards: Math.max(0, prev.totalCards + delta),
        youngCards: Math.max(0, prev.youngCards + delta),
        branchStats: prev.branchStats.map(bm =>
          bm.branchCode === targetErr.branchCode
            ? {
                ...bm,
                totalCards: Math.max(0, bm.totalCards + delta),
                youngCards: Math.max(0, bm.youngCards + delta)
              }
            : bm
        )
      }));
    },
    [semanticErrors]
  );

  const deleteSemanticError = useCallback(
    (id: string) => {
      const targetErr = semanticErrors.find(e => e.id === id);
      setSemanticErrors(prev => prev.filter(e => e.id !== id));
      if (targetErr && targetErr.ankiClozeStatus === 'Eklendi') {
        setAnkiSnapshot(prev => ({
          ...prev,
          totalCards: Math.max(0, prev.totalCards - 1),
          youngCards: Math.max(0, prev.youngCards - 1),
          branchStats: prev.branchStats.map(bm =>
            bm.branchCode === targetErr.branchCode
              ? {
                  ...bm,
                  totalCards: Math.max(0, bm.totalCards - 1),
                  youngCards: Math.max(0, bm.youngCards - 1)
                }
              : bm
          )
        }));
      }
    },
    [semanticErrors]
  );

  // Gunluk_Log & Soru_Bankasi_Metrikleri CRUD
  const addQuestionLog = useCallback(
    (payload: {
      date: string;
      sourceBook: string;
      branchCode: CanonicalBranchCode;
      semanticCode: string;
      questionFormat: QuestionFormatType;
      correct: number;
      wrong: number;
      empty: number;
      durationMinutes: number;
      notes?: string;
    }): DailyStudyQuestionLog => {
      const branchSpec = CANONICAL_16_BRANCHES.find(b => b.code === payload.branchCode);
      const calc = calculateQuestionLogMetrics(
        payload.correct,
        payload.wrong,
        payload.empty,
        payload.durationMinutes
      );
      const nextId = `LOG-${String(questionLogs.length + 1).padStart(2, '0')}`;

      const newLog: DailyStudyQuestionLog = {
        id: nextId,
        date: payload.date,
        sourceBook: payload.sourceBook,
        branchCode: payload.branchCode,
        branchName: branchSpec?.name || payload.branchCode,
        semanticCode: payload.semanticCode,
        questionFormat: payload.questionFormat,
        totalQuestions: calc.totalQuestions,
        correct: payload.correct,
        wrong: payload.wrong,
        empty: payload.empty,
        net: calc.net,
        accuracyPercent: calc.accuracyPercent,
        durationMinutes: payload.durationMinutes,
        speedSecondsPerQuestion: calc.speedSecondsPerQuestion,
        notes: payload.notes
      };

      setQuestionLogs(prev => [newLog, ...prev]);
      setDailyGoal(prev => ({
        ...prev,
        completedQuestions: prev.completedQuestions + calc.totalQuestions,
        completedStudyMinutes: prev.completedStudyMinutes + payload.durationMinutes
      }));

      notifyUser(
        `Soru Oturumu Kaydedildi (${calc.speedSecondsPerQuestion} sn/soru)`,
        `${newLog.branchName}: ${calc.net} Net (%${calc.accuracyPercent}) — ${calc.paceVerdict}`
      );
      return newLog;
    },
    [questionLogs.length, notifyUser]
  );

  const deleteQuestionLog = useCallback(
    (id: string) => {
      const targetLog = questionLogs.find(l => l.id === id);
      setQuestionLogs(prev => prev.filter(l => l.id !== id));
      if (targetLog && targetLog.date === todayStr) {
        setDailyGoal(prev => ({
          ...prev,
          completedQuestions: Math.max(0, prev.completedQuestions - targetLog.totalQuestions),
          completedStudyMinutes: Math.max(0, prev.completedStudyMinutes - targetLog.durationMinutes)
        }));
      }
    },
    [questionLogs, todayStr]
  );

  const updateTaxonomyItem = useCallback((id: string, updates: Partial<TopicTaxonomyItem>) => {
    setTopicTaxonomy(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const updateAnkiSnapshot = useCallback((updates: Partial<AnkiFsrsSnapshot>) => {
    setAnkiSnapshot(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSystemParams = useCallback((updates: Partial<SystemParameters>) => {
    setSystemParams(prev => ({ ...prev, ...updates }));
  }, []);

  // Daily Goal Helpers
  const updateDailyGoal = useCallback((updates: Partial<DailyGoal>) => {
    setDailyGoal(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleBlockDone = useCallback(
    (block: 'block1Done' | 'block2Done' | 'block3Done' | 'block4Done') => {
      setDailyGoal(prev => ({ ...prev, [block]: !prev[block] }));
      if (soundEnabled) playGentleChime();
    },
    [soundEnabled]
  );

  const addGoalChecklistItem = useCallback((text: string) => {
    if (!text.trim()) return;
    setDailyGoal(prev => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        { id: `c-${Date.now().toString(36)}`, text: text.trim(), done: false }
      ]
    }));
  }, []);

  const toggleGoalChecklistItem = useCallback(
    (itemId: string) => {
      setDailyGoal(prev => ({
        ...prev,
        checklist: prev.checklist.map(i => (i.id === itemId ? { ...i, done: !i.done } : i))
      }));
      if (soundEnabled) playGentleChime();
    },
    [soundEnabled]
  );

  const deleteGoalChecklistItem = useCallback((itemId: string) => {
    setDailyGoal(prev => ({
      ...prev,
      checklist: prev.checklist.filter(i => i.id !== itemId)
    }));
  }, []);

  const markNotificationRead = useCallback((_id: string) => {}, []);
  const markAllNotificationsRead = useCallback(() => {}, []);

  // Export / Import
  const exportDataJSON = useCallback((): string => {
    const payload = {
      version: '2.0-ExcelToApp',
      exportedAt: new Date().toISOString(),
      topics,
      dailyGoal,
      triageLogs,
      mockExams,
      semanticErrors,
      questionLogs,
      topicTaxonomy,
      ankiSnapshot,
      systemParams
    };
    return JSON.stringify(payload, null, 2);
  }, [
    topics,
    dailyGoal,
    triageLogs,
    mockExams,
    semanticErrors,
    questionLogs,
    topicTaxonomy,
    ankiSnapshot,
    systemParams
  ]);

  const importDataJSON = useCallback(
    (jsonStr: string): boolean => {
      try {
        const data = JSON.parse(jsonStr);
        if (Array.isArray(data.topics)) setTopics(data.topics);
        if (data.dailyGoal) setDailyGoal(data.dailyGoal);
        if (Array.isArray(data.triageLogs)) setTriageLogs(data.triageLogs);
        if (Array.isArray(data.mockExams)) setMockExams(data.mockExams);
        if (Array.isArray(data.semanticErrors)) setSemanticErrors(data.semanticErrors);
        if (Array.isArray(data.questionLogs)) setQuestionLogs(data.questionLogs);
        if (Array.isArray(data.topicTaxonomy)) setTopicTaxonomy(data.topicTaxonomy);
        if (data.ankiSnapshot) setAnkiSnapshot(data.ankiSnapshot);
        if (data.systemParams) setSystemParams(data.systemParams);
        notifyUser('Veriler Başarıyla İçe Aktarıldı', 'Yedek veriler başarıyla geri yüklendi.');
        return true;
      } catch (e) {
        console.error('Import failed', e);
        return false;
      }
    },
    [notifyUser]
  );

  const resetToInitialData = useCallback(() => {
    setTopics(
      INITIAL_TOPIC_UNITS.map((t, idx) => ({
        ...t,
        topicCode: `K${String(idx + 1).padStart(4, '0')}`,
        reviewCount: t.status === 'NOT_STARTED' ? 0 : t.status === 'T0_DONE' ? 1 : 2
      }))
    );
    setTriageLogs(DEFAULT_SEED_TRIAGE_LOGS);
    setMockExams(INITIAL_MOCK_EXAMS);
    setSemanticErrors(INITIAL_SEMANTIC_ERRORS);
    setQuestionLogs(INITIAL_DAILY_QUESTION_LOGS);
    setTopicTaxonomy(INITIAL_TOPIC_TAXONOMY);
    setAnkiSnapshot(INITIAL_ANKI_FSRS_SNAPSHOT);
    setSystemParams(INITIAL_SYSTEM_PARAMETERS);
    localStorage.removeItem(STORAGE_KEYS.TOPICS);
    localStorage.removeItem(STORAGE_KEYS.TRIAGE_LOGS);
    Object.values(EXTENDED_STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    notifyUser(
      'Veritabanı Sıfırlandı',
      '227 ünite, deneme analizleri ve SWSPS parametreleri varsayılan haline getirildi.'
    );
  }, [notifyUser]);

  const value: DUSContextType = {
    subjects,
    topics,
    dailyGoal,
    notifications,
    report,
    triageLogs,
    todayStr,
    soundEnabled,
    browserNotificationsEnabled,
    mockExams,
    semanticErrors: liveSemanticErrors,
    questionLogs,
    topicTaxonomy,
    ankiSnapshot,
    systemParams,
    addTopic,
    updateTopic,
    deleteTopic,
    rescheduleTopicTask,
    clearTopicScheduledTask,
    deleteTriageLog,
    inlineUpdateTopicPlan,
    recordT0Completion,
    recordT3Triage,
    recordT14Verification,
    recordSaturdayRepair,
    addMockExam,
    deleteMockExam,
    addSemanticError,
    toggleSemanticErrorAnkiStatus,
    deleteSemanticError,
    addQuestionLog,
    deleteQuestionLog,
    updateTaxonomyItem,
    updateAnkiSnapshot,
    updateSystemParams,
    updateDailyGoal,
    toggleBlockDone,
    addGoalChecklistItem,
    toggleGoalChecklistItem,
    deleteGoalChecklistItem,
    markNotificationRead,
    markAllNotificationsRead,
    requestBrowserNotificationPermission,
    toggleSound,
    exportDataJSON,
    importDataJSON,
    resetToInitialData
  };

  return <DUSContext.Provider value={value}>{children}</DUSContext.Provider>;
};

export const useDUS = () => {
  const context = useContext(DUSContext);
  if (!context) {
    throw new Error('useDUS must be used within a DUSProvider');
  }
  return context;
};
