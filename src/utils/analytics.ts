/**
 * DUS 2027 Excel-to-App Mimari Kılavuzu: Matematiksel Hesaplama ve Analitik Motoru
 * - SWSPS (Semantic Weighted Spaced Penalty Score) Bilişsel Ceza Skoru Algoritması
 * - Deneme_Analiz 16 Branş Net, Sapma ve ADÇC Baraj Hesaplayıcısı
 * - Gunluk_Log & Soru_Bankasi_Metrikleri Net, Doğruluk ve Soru Başı Hız (sn/soru) Hesaplayıcısı
 * - Tekrar_Takvimi 5 Kademeli Yoğunluk Isı Haritası & Konu_Takip_Matrisi 3 Kademeli Gecikme Skalası
 * - Tekrar_Kaydi Aynı Gün Mükerrer İşlem Kilidi
 */

import {
  CanonicalBranchCode,
  CanonicalBranchSpec,
  CognitiveErrorType,
  DailyStudyQuestionLog,
  MockExamRecord,
  QuestionFormatType,
  SemanticErrorRecord,
  SWSPSBreakdown,
  SWSPSTier,
  TopicTaxonomyItem,
  TopicUnit,
  BucketType,
  TriageRecord,
  AuditValidationStatus
} from '../types/dus';
import { getDaysDiff, getTodayString } from './triage';

export const CANONICAL_16_BRANCHES: CanonicalBranchSpec[] = [
  { code: 'B01', name: 'Anatomi', shortName: 'Anatomi', category: 'TEMEL_BILIMLER', questionCount: 6, targetAccuracyPercent: 88, targetNet: 5.3 },
  { code: 'B02', name: 'Histoloji ve Embriyoloji', shortName: 'Histoloji', category: 'TEMEL_BILIMLER', questionCount: 4, targetAccuracyPercent: 90, targetNet: 3.6 },
  { code: 'B03', name: 'Fizyoloji', shortName: 'Fizyoloji', category: 'TEMEL_BILIMLER', questionCount: 4, targetAccuracyPercent: 90, targetNet: 3.6 },
  { code: 'B04', name: 'Tıbbi Biyokimya', shortName: 'Biyokimya', category: 'TEMEL_BILIMLER', questionCount: 6, targetAccuracyPercent: 86, targetNet: 5.2 },
  { code: 'B05', name: 'Tıbbi Mikrobiyoloji', shortName: 'Mikrobiyoloji', category: 'TEMEL_BILIMLER', questionCount: 6, targetAccuracyPercent: 88, targetNet: 5.3 },
  { code: 'B06', name: 'Tıbbi Patoloji', shortName: 'Patoloji', category: 'TEMEL_BILIMLER', questionCount: 4, targetAccuracyPercent: 90, targetNet: 3.6 },
  { code: 'B07', name: 'Tıbbi Farmakoloji', shortName: 'Farmakoloji', category: 'TEMEL_BILIMLER', questionCount: 6, targetAccuracyPercent: 88, targetNet: 5.3 },
  { code: 'B08', name: 'Tıbbi Biyoloji ve Genetik', shortName: 'Biyoloji', category: 'TEMEL_BILIMLER', questionCount: 4, targetAccuracyPercent: 92, targetNet: 3.7 },
  { code: 'B09', name: 'Ağız, Diş ve Çene Cerrahisi', shortName: 'Çene Cerrahisi', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 95, targetNet: 9.5 },
  { code: 'B10', name: 'Ağız, Diş ve Çene Radyolojisi', shortName: 'Radyoloji', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 92, targetNet: 9.2 },
  { code: 'B11', name: 'Periodontoloji', shortName: 'Periodontoloji', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 90, targetNet: 9.0 },
  { code: 'B12', name: 'Ortodonti', shortName: 'Ortodonti', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 88, targetNet: 8.8 },
  { code: 'B13', name: 'Çocuk Diş Hekimliği (Pedodonti)', shortName: 'Pedodonti', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 90, targetNet: 9.0 },
  { code: 'B14', name: 'Endodonti', shortName: 'Endodonti', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 92, targetNet: 9.2 },
  { code: 'B15', name: 'Restoratif Diş Tedavisi', shortName: 'Restoratif', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 90, targetNet: 9.0 },
  { code: 'B16', name: 'Protetik Diş Tedavisi', shortName: 'Protetik', category: 'KLINIK_BILIMLER', questionCount: 10, targetAccuracyPercent: 88, targetNet: 8.8 }
];

export const DEFAULT_ERROR_WEIGHTS: Record<CognitiveErrorType, number> = {
  Bilgi: 1.0,
  Muhakeme: 1.25,
  Dikkat: 0.8,
  Çeldirici: 1.4
};

export interface SWSPSInput {
  errorType: CognitiveErrorType;
  repeatCount: number;         // N_Tekrar >= 1
  difficultyD: number;         // Z_Zorluk (1 - 10)
  fsrsRetrievabilityR: number; // R_FSRS (0 - 1 veya 0 - 100%)
  daysElapsed: number;         // Delta_t (gün)
  customWeights?: Record<CognitiveErrorType, number>;
  // SWSPS v2.0 Dinamik Çarpan Parametreleri (Opsiyonel — Verildiğinde Kova, Branş ve Anki sönümlemesini uygular)
  bucket?: BucketType;
  branchCode?: CanonicalBranchCode;
  ankiClozeStatus?: 'Eklendi' | 'Bekliyor';
  isTopicDischarged?: boolean;
  matchedTopicId?: string;
  matchedTopicTitle?: string;
}

export function getBucketSwspsMultiplier(bucket?: BucketType): number {
  switch (bucket) {
    case 'RED':
      return 1.35;
    case 'YELLOW':
      return 1.15;
    case 'GREEN':
      return 0.85;
    case 'NONE':
    default:
      return 1.0;
  }
}

export function getBranchSwspsMultiplier(branchCode?: CanonicalBranchCode): {
  multiplier: number;
  questionCount: number;
} {
  if (!branchCode) return { multiplier: 1.0, questionCount: 6 };
  const spec = CANONICAL_16_BRANCHES.find(b => b.code === branchCode);
  const qCount = spec?.questionCount ?? 6;
  if (qCount >= 10) return { multiplier: 1.15, questionCount: qCount };
  if (qCount <= 4) return { multiplier: 0.9, questionCount: qCount };
  return { multiplier: 1.0, questionCount: qCount };
}

export function getMitigationSwspsMultiplier(
  ankiClozeStatus?: 'Eklendi' | 'Bekliyor',
  isTopicDischarged?: boolean
): number {
  if (isTopicDischarged && ankiClozeStatus === 'Eklendi') {
    return 0.35; // Sönümlenmiş Hata (%65 Ceza İndirimi)
  }
  if (ankiClozeStatus === 'Eklendi') {
    return 0.6; // Anki FSRS Korumasında (%40 Ceza İndirimi)
  }
  if (isTopicDischarged) {
    return 0.75; // Yeşil Kovada Taburcu (%25 Ceza İndirimi)
  }
  return 1.0; // Bekliyor (Tam Ceza)
}

export function classifySwspsTier(score: number): {
  tier: SWSPSTier;
  tierLabel: string;
  recommendedAction: string;
} {
  if (score >= 10.0) {
    return {
      tier: 'KRITIK_BLOKAJ',
      tierLabel: 'Kritik Blokaj',
      recommendedAction: 'Acil Cumartesi Onarımı + Çapraz Kıyas Tablosu + Anki Cloze Zorunlu'
    };
  }
  if (score >= 6.5) {
    return {
      tier: 'YUKSEK_RISK',
      tierLabel: 'Yüksek Risk',
      recommendedAction: '15 dk Nokta Atışı Yama + Anki Cloze Kartı Üret'
    };
  }
  if (score >= 3.5) {
    return {
      tier: 'ORTA_RISK',
      tierLabel: 'Orta Risk',
      recommendedAction: 'Soru Bankası Tekrarında Odaklan'
    };
  }
  return {
    tier: 'KONTROL_ALTINDA',
    tierLabel: 'Kontrol Altında',
    recommendedAction: 'Anki FSRS Döngüsünde Takipte'
  };
}

/**
 * SWSPS v2.0 Çarpan Röntgeni (Breakdown) ve Dinamik Klinik Önceliklendirme Motoru
 * SWSPS_v2 = Temel_SWSPS * K_Kova * B_DUS * M_Onarım
 */
export function calculateSWSPSBreakdown(input: SWSPSInput): SWSPSBreakdown {
  const weights = input.customWeights || DEFAULT_ERROR_WEIGHTS;
  const wError = weights[input.errorType] ?? 1.0;
  const nRepeat = Math.max(1, input.repeatCount);
  const clampedD = Math.max(1, Math.min(10, input.difficultyD));
  const rNormalized =
    input.fsrsRetrievabilityR > 1
      ? Math.max(0, Math.min(1, input.fsrsRetrievabilityR / 100))
      : Math.max(0, Math.min(1, input.fsrsRetrievabilityR));
  const deltaT = Math.max(0, input.daysElapsed);

  const difficultyFactor = Number((1 + clampedD / 10).toFixed(2));
  const forgettingRisk = Number(Math.max(0.05, 1 - rNormalized).toFixed(2));
  const recencyBoost = Number((1 + Math.max(0, (14 - deltaT) / 14) * 0.5).toFixed(2));

  const rawBaseScore = Number(
    (wError * nRepeat * difficultyFactor * forgettingRisk * recencyBoost * 10).toFixed(2)
  );

  const matchedBucket: BucketType = input.bucket || 'NONE';
  const bucketMultiplier = getBucketSwspsMultiplier(matchedBucket);
  const { multiplier: branchMultiplier, questionCount: branchQuestionCount } =
    getBranchSwspsMultiplier(input.branchCode);
  const mitigationMultiplier = getMitigationSwspsMultiplier(
    input.ankiClozeStatus,
    input.isTopicDischarged
  );

  const finalScore = Number(
    (rawBaseScore * bucketMultiplier * branchMultiplier * mitigationMultiplier).toFixed(2)
  );

  const { tier, tierLabel, recommendedAction } = classifySwspsTier(finalScore);

  const bucketText =
    matchedBucket === 'RED'
      ? 'Kırmızı Kova (1.35x)'
      : matchedBucket === 'YELLOW'
      ? 'Sarı Kova (1.15x)'
      : matchedBucket === 'GREEN'
      ? 'Yeşil Kova (0.85x)'
      : 'Standart Kova (1.00x)';

  const ankiText =
    mitigationMultiplier === 0.35
      ? 'Taburcu+Anki (0.35x)'
      : mitigationMultiplier === 0.6
      ? 'Anki Eklendi (0.60x)'
      : mitigationMultiplier === 0.75
      ? 'Taburcu (0.75x)'
      : 'Anki Bekliyor (1.00x)';

  const formulaSummary = `${input.errorType} (${wError.toFixed(2)}x) × ${nRepeat}. Tekrar × Zorluk (${difficultyFactor.toFixed(2)}x) × Unutma (${forgettingRisk.toFixed(2)}) × ${bucketText} × ${branchQuestionCount}S Branş (${branchMultiplier.toFixed(2)}x) × ${ankiText}`;

  return {
    rawBaseScore,
    finalScore,
    errorWeight: wError,
    repeatCount: nRepeat,
    difficultyFactor,
    forgettingRisk,
    recencyBoost,
    bucketMultiplier,
    branchMultiplier,
    mitigationMultiplier,
    matchedBucket,
    matchedTopicId: input.matchedTopicId,
    matchedTopicTitle: input.matchedTopicTitle,
    branchQuestionCount,
    tier,
    tierLabel,
    recommendedAction,
    formulaSummary
  };
}

/**
 * SWSPS (Semantic Weighted Spaced Penalty Score) Bilişsel Ceza Skoru Algoritması
 */
export function calculateSWSPS(input: SWSPSInput): number {
  return calculateSWSPSBreakdown(input).finalScore;
}

/**
 * Tüm SWSPS hata kayıtlarını mevcut Müfredat Kova durumu, Branş soru ağırlığı,
 * geçen gün sayısı ve Anki müdahale durumuna göre canlı olarak yeniden hesaplar.
 */
export function enrichSemanticErrorsWithLiveSWSPS(
  errors: SemanticErrorRecord[],
  topics: TopicUnit[],
  taxonomy: TopicTaxonomyItem[],
  todayStr: string = getTodayString(),
  customWeights?: Record<CognitiveErrorType, number>
): SemanticErrorRecord[] {
  // Her semantik kodun toplam tekrar sayısı
  const repeatMap = new Map<string, number>();
  for (const err of errors) {
    repeatMap.set(err.semanticCode, (repeatMap.get(err.semanticCode) || 0) + 1);
  }

  return errors.map(err => {
    const tax = taxonomy.find(t => t.semanticCode === err.semanticCode);
    const repeatCount = repeatMap.get(err.semanticCode) || 1;
    const daysElapsed = Math.max(0, getDaysDiff(todayStr, err.date));

    // İlgili branştaki en uygun üniteyi bul (Önce başlık eşleşmesi, yoksa kırmızı/sarı/yeşil aktif ünite)
    const branchTopics = topics.filter(t => t.subjectId === err.branchCode);
    const normalizedSub = err.subtopic.toLocaleLowerCase('tr-TR');
    let matchedTopic = branchTopics.find(t => {
      const titleLower = t.title.toLocaleLowerCase('tr-TR');
      return (
        normalizedSub.includes(titleLower.slice(0, 8)) ||
        titleLower.includes(normalizedSub.slice(0, 8))
      );
    });
    if (!matchedTopic) {
      matchedTopic =
        branchTopics.find(t => t.currentBucket === 'RED') ||
        branchTopics.find(t => t.currentBucket === 'YELLOW') ||
        branchTopics.find(t => t.currentBucket === 'GREEN') ||
        branchTopics[0];
    }

    const breakdown = calculateSWSPSBreakdown({
      errorType: err.errorType,
      repeatCount,
      difficultyD: tax?.fsrsDifficultyD ?? 7.5,
      fsrsRetrievabilityR: tax?.fsrsRetrievabilityR ?? 75,
      daysElapsed,
      customWeights,
      bucket: matchedTopic?.currentBucket || 'NONE',
      branchCode: err.branchCode,
      ankiClozeStatus: err.ankiClozeStatus,
      isTopicDischarged: Boolean(matchedTopic?.discharged),
      matchedTopicId: matchedTopic?.id,
      matchedTopicTitle: matchedTopic?.title
    });

    return {
      ...err,
      swspsScore: breakdown.finalScore,
      breakdown
    };
  });
}

/**
 * Deneme_Analiz (Sayfa 11) 16 Branş Net Hesaplayıcısı ve Doğrulama Motoru
 */
export function evaluateMockExam(
  id: string,
  date: string,
  institution: string,
  branchNets: Record<CanonicalBranchCode, number>,
  targetTotalNet: number = 108.0,
  adccThreshold: number = 100.0,
  notes?: string
): MockExamRecord {
  const basicCodes: CanonicalBranchCode[] = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08'];
  const clinicalCodes: CanonicalBranchCode[] = ['B09', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16'];

  const sanitizedNets = { ...branchNets };
  for (const spec of CANONICAL_16_BRANCHES) {
    const val = Number(sanitizedNets[spec.code] ?? 0);
    // Branş neti soru sayısını aşamaz ve -2.5 altına inemez
    sanitizedNets[spec.code] = Number(Math.max(-2.5, Math.min(spec.questionCount, val)).toFixed(2));
  }

  const rawBasic = basicCodes.reduce((acc, code) => acc + sanitizedNets[code], 0);
  const rawClinical = clinicalCodes.reduce((acc, code) => acc + sanitizedNets[code], 0);

  const basicNet = Number(Math.min(40, Math.max(0, rawBasic)).toFixed(2));
  const clinicalNet = Number(Math.min(80, Math.max(0, rawClinical)).toFixed(2));
  const totalNet = Number(Math.min(120, basicNet + clinicalNet).toFixed(2));
  const targetDiff = Number((totalNet - targetTotalNet).toFixed(2));
  const accuracyPercent = Number(((totalNet / 120) * 100).toFixed(1));
  const adccStatus: 'ELİT' | 'GELİŞİM' = totalNet >= adccThreshold ? 'ELİT' : 'GELİŞİM';

  return {
    id,
    date,
    institution,
    branchNets: sanitizedNets,
    basicNet,
    clinicalNet,
    totalNet,
    targetDiff,
    accuracyPercent,
    adccStatus,
    notes
  };
}

/**
 * Gunluk_Log (Sayfa 12) Soru Çözüm Oturumu Net, Doğruluk % ve Soru Başı Hız (sn/soru) Hesaplayıcısı
 */
export function calculateQuestionLogMetrics(
  correct: number,
  wrong: number,
  empty: number,
  durationMinutes: number
): {
  totalQuestions: number;
  net: number;
  accuracyPercent: number;
  speedSecondsPerQuestion: number;
  paceVerdict: 'ELİT HIZ (<50 sn)' | 'İDEAL TEMPO (50-60 sn)' | 'YAVAŞ (>60 sn)';
} {
  const safeCorrect = Math.max(0, Math.round(correct));
  const safeWrong = Math.max(0, Math.round(wrong));
  const safeEmpty = Math.max(0, Math.round(empty));
  const totalQuestions = Math.max(1, safeCorrect + safeWrong + safeEmpty);
  const safeMinutes = Math.max(1, durationMinutes);

  const net = Number((safeCorrect - safeWrong * 0.25).toFixed(2));
  const accuracyPercent = Number(((safeCorrect / totalQuestions) * 100).toFixed(1));
  const speedSecondsPerQuestion = Number(((safeMinutes * 60) / totalQuestions).toFixed(1));

  let paceVerdict: 'ELİT HIZ (<50 sn)' | 'İDEAL TEMPO (50-60 sn)' | 'YAVAŞ (>60 sn)' = 'İDEAL TEMPO (50-60 sn)';
  if (speedSecondsPerQuestion < 50) {
    paceVerdict = 'ELİT HIZ (<50 sn)';
  } else if (speedSecondsPerQuestion > 60) {
    paceVerdict = 'YAVAŞ (>60 sn)';
  }

  return {
    totalQuestions,
    net,
    accuracyPercent,
    speedSecondsPerQuestion,
    paceVerdict
  };
}

export interface AggregatedBankMetric {
  key: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  net: number;
  accuracyPercent: number;
  avgSpeedSeconds: number;
  coverageStatus: 'Tamamlandı / Dengeli' | 'Aktif Çözülüyor' | 'Başlangıç';
}

/**
 * Soru_Bankasi_Metrikleri (Sayfa 15): Kaynak ve Soru Formatı Bazında Kümülatif Performans Özeti
 */
export function aggregateQuestionBankMetrics(logs: DailyStudyQuestionLog[]): {
  bySource: AggregatedBankMetric[];
  byFormat: AggregatedBankMetric[];
} {
  const groupLogs = (keySelector: (l: DailyStudyQuestionLog) => string): AggregatedBankMetric[] => {
    const map = new Map<string, { q: number; d: number; y: number; sec: number }>();
    for (const log of logs) {
      const k = keySelector(log);
      const curr = map.get(k) || { q: 0, d: 0, y: 0, sec: 0 };
      curr.q += log.totalQuestions;
      curr.d += log.correct;
      curr.y += log.wrong;
      curr.sec += log.durationMinutes * 60;
      map.set(k, curr);
    }

    return Array.from(map.entries()).map(([key, val]) => {
      const net = Number((val.d - val.y * 0.25).toFixed(2));
      const accuracyPercent = val.q > 0 ? Number(((val.d / val.q) * 100).toFixed(1)) : 0;
      const avgSpeedSeconds = val.q > 0 ? Number((val.sec / val.q).toFixed(1)) : 0;
      const coverageStatus =
        val.q >= 250
          ? 'Tamamlandı / Dengeli'
          : val.q >= 80
          ? 'Aktif Çözülüyor'
          : 'Başlangıç';

      return {
        key,
        totalQuestions: val.q,
        correct: val.d,
        wrong: val.y,
        net,
        accuracyPercent,
        avgSpeedSeconds,
        coverageStatus
      };
    });
  };

  const allFormats: QuestionFormatType[] = [
    'Klinik Vaka / Senaryo',
    'Öncüllü / Ayrım Sorusu',
    'Spot / Bilgi Sorusu',
    'ÖSYM Çıkmış Sorular',
    'Komplikasyon Yönetimi'
  ];

  const bySource = groupLogs(l => l.sourceBook);
  const rawByFormat = groupLogs(l => l.questionFormat);

  const byFormat: AggregatedBankMetric[] = allFormats.map(fmt => {
    const found = rawByFormat.find(r => r.key === fmt);
    return (
      found || {
        key: fmt,
        totalQuestions: 0,
        correct: 0,
        wrong: 0,
        net: 0,
        accuracyPercent: 0,
        avgSpeedSeconds: 0,
        coverageStatus: 'Başlangıç'
      }
    );
  });

  return { bySource, byFormat };
}

/**
 * Tekrar_Takvimi (Sayfa 9): 5 Kademeli Yoğunluk Isı Haritası (Heatmap) Skalası
 * 0 Görev: #FFFFFF (Beyaz)
 * 1 Görev: #DCFCE7 (Ferah Yeşil)
 * 2 Görev: #D9F99D (Limon Sarısı)
 * 3 Görev: #FEF08A (Sıcak Sarı)
 * 4 Görev: #FED7AA (Pastel Turuncu)
 * 5+ Görev: #FECACA (Mercan Kırmızı - Aşırı Yük)
 */
export function getCalendarHeatmapStyle(taskCount: number): {
  bgHex: string;
  label: string;
  badgeClass: string;
} {
  if (taskCount <= 0) {
    return {
      bgHex: '#FFFFFF',
      label: 'Boş Gün',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  }
  if (taskCount === 1) {
    return {
      bgHex: '#DCFCE7',
      label: 'Ferah (1 Görev)',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    };
  }
  if (taskCount === 2) {
    return {
      bgHex: '#D9F99D',
      label: 'İdeal (2 Görev)',
      badgeClass: 'bg-lime-200 text-lime-950 border-lime-400'
    };
  }
  if (taskCount === 3) {
    return {
      bgHex: '#FEF08A',
      label: 'Orta Yük (3 Görev)',
      badgeClass: 'bg-yellow-200 text-yellow-950 border-yellow-400'
    };
  }
  if (taskCount === 4) {
    return {
      bgHex: '#FED7AA',
      label: 'Yoğun (4 Görev)',
      badgeClass: 'bg-orange-200 text-orange-950 border-orange-400'
    };
  }
  return {
    bgHex: '#FECACA',
    label: 'Aşırı Yük (5+ Görev)',
    badgeClass: 'bg-rose-200 text-rose-950 border-rose-400 font-extrabold'
  };
}

/**
 * Bir ünitenin sıradaki hedef tarihini (T+3, T+14 veya Cumartesi Onarım) döndürür
 */
export function getTopicNextTargetDate(topic: TopicUnit): string | undefined {
  if (topic.discharged || topic.currentBucket === 'GREEN') return undefined;
  if (topic.currentBucket === 'RED' && topic.saturdayRepairDate) return topic.saturdayRepairDate;
  if (topic.currentBucket === 'YELLOW' && topic.t14DueDate) return topic.t14DueDate;
  if (topic.status === 'T0_DONE' && topic.t3DueDate) return topic.t3DueDate;
  return topic.t3DueDate || topic.t14DueDate || topic.saturdayRepairDate;
}

/**
 * Konu_Takip_Matrisi (Sayfa 10): Gecikme Günü Hesabı ve 3 Renkli Gecikme Isı Haritası
 * Gecikme = 0: #A7F3D0 (Pastel Yeşil)
 * Gecikme 1-7 Gün: #FDE68A (Açık Sarı)
 * Gecikme 8+ Gün: #FCA5A5 (Kırmızı)
 */
export function calculateTopicDelayDays(
  topic: TopicUnit,
  todayStr: string = getTodayString()
): number {
  const nextDate = getTopicNextTargetDate(topic);
  if (!nextDate) return 0;
  if (nextDate >= todayStr) return 0;
  return Math.max(0, getDaysDiff(nextDate, todayStr));
}

export function getDelayHeatmapStyle(delayDays: number): {
  bgHex: string;
  textClass: string;
  statusLabel: string;
} {
  if (delayDays <= 0) {
    return {
      bgHex: '#A7F3D0',
      textClass: 'text-emerald-950',
      statusLabel: 'Zamanında (0G)'
    };
  }
  if (delayDays <= 7) {
    return {
      bgHex: '#FDE68A',
      textClass: 'text-amber-950',
      statusLabel: `Gecikme (${delayDays}G)`
    };
  }
  return {
    bgHex: '#FCA5A5',
    textClass: 'text-rose-950 font-bold',
    statusLabel: `Kritik Gecikme (${delayDays}G)`
  };
}

/**
 * Tekrar_Kaydi (Sayfa 8): Aynı Gün Aynı Konuya Mükerrer İşlem Kontrolü
 * =IF(COUNTIFS(Konu, currKonu, Tarih, currTarih)>1, "Girişi kontrol et / Mükerrer", "Geçerli")
 */
export function checkDuplicateAuditLog(
  existingLogs: TriageRecord[],
  topicId: string,
  dateStr: string
): AuditValidationStatus {
  const sameDayMatch = existingLogs.some(l => l.topicId === topicId && l.date === dateStr);
  return sameDayMatch ? 'Girişi kontrol et / Mükerrer' : 'Geçerli';
}
