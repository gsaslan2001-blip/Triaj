/**
 * DUS 2027 Stratejik Yönetim Sistemi — Kova Triyajı, SWSPS Bilişsel Ceza Motoru,
 * Deneme Analizi, FSRS Parametreleri ve Soru/Hız Metrikleri Tip Tanımları
 * Doktrin: Bilişsel Öğrenme Psikolojisi, 80/20 Pareto & Excel-to-App Mimari Kılavuzu
 */

export type SubjectCategory = 'TEMEL_BILIMLER' | 'KLINIK_BILIMLER';

export type CognitiveGroup = 'GRUP_A' | 'GRUP_B' | 'GRUP_C';

export type BucketType = 'GREEN' | 'YELLOW' | 'RED' | 'NONE';

export type PriorityLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type TestStage =
  | 'T0_SAMPLING'        // T+0 günü: 10 soruluk adımlı örnekleme
  | 'T3_MAIN'            // T+3 günü: Kalan 40 soru esas geri çağırma (Triyaj Belirleyici)
  | 'T14_VERIFICATION'   // Sarı Kova T+14: 20-25 soru doğrulama testi
  | 'SATURDAY_REPAIR'    // Kırmızı Kova Cumartesi: 30 soru onarım testi
  | 'BRANCH_EXAM';       // Biten dersler için karma branş denemesi

export interface SubjectProtocol {
  cognitiveCharacteristics: string;
  t0Method: string;
  t3Method: string;
  questionBankUsage: string;
  ankiProtocol: string;
}

export interface DUSSubject {
  id: string;
  code: string;              // B01, B02+B03, B04..B16
  name: string;
  category: SubjectCategory; // Temel Bilimler vs Klinik Bilimler
  cognitiveGroup: CognitiveGroup; // Grup A (Ezber), Grup B (Mekanizma), Grup C (Klinik)
  questionCount: number;     // DUS sınavındaki soru sayısı (örn: 10, 8, 6, 4)
  weightPercentage: number;  // Sınav ağırlığı %
  unitCount?: number;        // Konsolide ünite sayısı (Toplam 227)
  excelColumn?: string;      // ExcelMaster Konu_Takip_Matrisi sütunu (K..Z)
  ankiDeckPattern?: string;  // Anki Filtreli Deste Deseni (DUS::*Anatomi* vb.)
  description: string;
  protocol: SubjectProtocol;
  colorTheme: string;
  iconName: string;
}

export interface ScoreDetail {
  correct: number;
  wrong: number;
  empty?: number;
  total: number;
  percentage: number;
  date: string;
}

export interface TopicUnit {
  id: string;
  topicCode?: string;            // ExcelMaster K0001..K0227
  subjectId: string;
  unitNumber: number;
  title: string;
  subtopics: string[];
  status: 'NOT_STARTED' | 'T0_DONE' | 'T3_PENDING' | 'TRIAGED' | 'DISCHARGED';
  currentBucket: BucketType;
  priority: PriorityLevel;
  t0Date?: string;               // YYYY-MM-DD
  t3DueDate?: string;            // YYYY-MM-DD (T+0 + 3 gün)
  t14DueDate?: string;           // YYYY-MM-DD (Sarı Kova için T+3 + 14 gün)
  saturdayRepairDate?: string;   // YYYY-MM-DD (Kırmızı Kova için en yakın Cumartesi)
  reviewCount?: number;          // Toplam tekrar/test sayısı
  lastStudiedDate?: string;      // Son çalışma tarihi
  t0Score?: ScoreDetail;
  t3Score?: ScoreDetail;
  t14Score?: ScoreDetail;
  repairScore?: ScoreDetail;
  clinicalNotes?: string;        // Nokta atışı 5-10 dk yama notları
  mnemonics?: string[];          // Bilişsel kanca / hafıza çivileri
  criticalDifferences?: string[];// Çapraz kıyas / tuzaklar
  discharged: boolean;           // Yeşil kova taburcu edildi mi
  createdAt: string;
  updatedAt: string;
}

export type AuditValidationStatus = 'Geçerli' | 'Girişi kontrol et / Mükerrer';

export interface TriageRecord {
  id: string;
  recordCode?: string;           // TEKRAR-0001..
  topicId: string;
  subjectId: string;
  topicTitle: string;
  subjectName: string;
  date: string;
  stage: TestStage;
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  percentage: number;
  resultingBucket: BucketType;
  resultingPriority: PriorityLevel;
  clinicalDiagnosis: string;
  recommendedAction: string;
  validationStatus?: AuditValidationStatus;
  notes?: string;
}

export type CognitiveBlock = 'BLOK_1' | 'BLOK_2' | 'BLOK_3' | 'BLOK_4';

export interface DailyGoalItem {
  id: string;
  text: string;
  done: boolean;
  block?: CognitiveBlock;
  priority?: PriorityLevel;
  relatedTopicId?: string;
}

export interface DailyGoal {
  date: string;                     // YYYY-MM-DD
  targetStudyMinutes: number;
  completedStudyMinutes: number;
  targetQuestions: number;
  completedQuestions: number;
  block1Done: boolean;              // Blok 1: Anki & Mikro-Bellek (45 dk)
  block2Done: boolean;              // Blok 2: Yeni Konu Edinimi & T+0 (Boş Kağıt + 10 Soru)
  block3Done: boolean;              // Blok 3: T+3 Gecikmeli Geri Çağırma (40 Soru) & Kova Triyajı
  block4Done: boolean;              // Blok 4: Branş Denemesi & Anında Anki Kaydı
  checklist: DailyGoalItem[];
  notes: string;
}

export interface TriageNotification {
  id: string;
  topicId?: string;
  subjectId?: string;
  type: 'T3_DUE' | 'T14_DUE' | 'SATURDAY_REPAIR' | 'RED_LIMIT_ALERT' | 'SYSTEM_INFO';
  title: string;
  message: string;
  dueDate: string;                  // YYYY-MM-DD
  priority: PriorityLevel;
  bucket?: BucketType;
  isRead: boolean;
  createdAt: string;
}

export interface SubjectTriageSummary {
  subjectId: string;
  subjectName: string;
  category: SubjectCategory;
  cognitiveGroup: CognitiveGroup;
  totalUnits: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  pendingCount: number;
  dischargedCount: number;
  retentionRate: number;            // %85+ neokortikal depolama yüzdesi
  questionWeight: number;
}

export interface KovaTriageReport {
  generatedAt: string;
  totalTopics: number;
  greenBucket: number;              // Yeşil Kova (Taburcu)
  yellowBucket: number;             // Sarı Kova (Müşahede)
  redBucket: number;                // Kırmızı Kova (Yoğun Bakım)
  pendingTriage: number;            // Henüz T+3 yapılmamış
  overallRetentionIndex: number;    // Genel Depolama Gücü Skoru (0-100)
  temelRetentionIndex: number;
  klinikRetentionIndex: number;
  redAlarmActive: boolean;          // PDF Madde 8.4: Kırmızı kova >= 3 ise acil alarm!
  urgentTasks: {
    id: string;
    topicId: string;
    topicTitle: string;
    subjectName: string;
    bucket: BucketType;
    priority: PriorityLevel;
    actionType: string;
    targetDate: string;
    instruction: string;
  }[];
  subjectSummaries: SubjectTriageSummary[];
}

// ============================================================================
// EXCEL-TO-APP MİMARİ KILAVUZU: 16 BRANŞ DENEME ANALİZİ, SWSPS, SORU GÜNLÜĞÜ & FSRS
// ============================================================================

export type CanonicalBranchCode =
  | 'B01' // Anatomi (6)
  | 'B02' // Histoloji ve Embriyoloji (4)
  | 'B03' // Fizyoloji (4)
  | 'B04' // Tıbbi Biyokimya (6)
  | 'B05' // Tıbbi Mikrobiyoloji (6)
  | 'B06' // Tıbbi Patoloji (4)
  | 'B07' // Tıbbi Farmakoloji (6)
  | 'B08' // Tıbbi Biyoloji ve Genetik (4)
  | 'B09' // Ağız, Diş ve Çene Cerrahisi (10)
  | 'B10' // Ağız, Diş ve Çene Radyolojisi (10)
  | 'B11' // Periodontoloji (10)
  | 'B12' // Ortodonti (10)
  | 'B13' // Çocuk Diş Hekimliği (Pedodonti) (10)
  | 'B14' // Endodonti (10)
  | 'B15' // Restoratif Diş Tedavisi (10)
  | 'B16';// Protetik Diş Tedavisi (10)

export interface CanonicalBranchSpec {
  code: CanonicalBranchCode;
  name: string;
  shortName: string;
  category: SubjectCategory;
  questionCount: number;
  targetAccuracyPercent: number; // %85 - %95
  targetNet: number;             // Örn: 5.4, 9.2 vb.
}

export interface MockExamRecord {
  id: string;                    // DENEME-01, DENEME-02...
  date: string;                  // YYYY-MM-DD
  institution: string;           // DUSDATA, DUSTIME, ÖSYM Prova vb.
  branchNets: Record<CanonicalBranchCode, number>;
  basicNet: number;              // <= 40.0
  clinicalNet: number;           // <= 80.0
  totalNet: number;              // <= 120.0
  targetDiff: number;            // Toplam Net - Hedef Net
  accuracyPercent: number;       // (Toplam Net / 120) * 100
  adccStatus: 'ELİT' | 'GELİŞİM';// >= 100.0 ise ELİT
  notes?: string;
}

export type CognitiveErrorType = 'Bilgi' | 'Muhakeme' | 'Dikkat' | 'Çeldirici';

export interface TopicTaxonomyItem {
  id: string;                    // KM-01..KM-17
  branchCode: CanonicalBranchCode;
  branchName: string;
  category?: SubjectCategory;    // TEMEL_BILIMLER (0.4) | KLINIK_BILIMLER (0.6)
  mainTopic: string;
  subtopic: string;
  semanticCode: string;          // Örn: ADCC_IMPACT_01, ENDO_ACCESS_01
  dusWeight: number;             // Temel Bilimler: 0.4 | Klinik Bilimler: 0.6
  unitWeight?: number | null;    // Ünite bazlı ağırlık (Daha sonra eklenecek — varsayılan null)
  fsrsStabilityS: number;        // Örn: 14.5 gün
  fsrsDifficultyD: number;       // 1 - 10 (Örn: 7.2)
  fsrsRetrievabilityR: number;   // 0 - 100 % (Örn: 84)
}

export type SWSPSTier =
  | 'KRITIK_BLOKAJ'
  | 'YUKSEK_RISK'
  | 'ORTA_RISK'
  | 'KONTROL_ALTINDA';

export interface SWSPSBreakdown {
  rawBaseScore: number;          // Temel 5 çarpanlı skor
  finalScore: number;            // Kova + Branş + Anki sönümleme sonrası dinamik skor
  errorWeight: number;           // 1.40 | 1.25 | 1.00 | 0.80
  repeatCount: number;           // N_Tekrar >= 1
  difficultyFactor: number;      // 1 + Z_Zorluk / 10
  forgettingRisk: number;        // 1 - R_FSRS
  recencyBoost: number;          // 1 + max(0, (14 - Delta_t)/14) * 0.5
  bucketMultiplier: number;      // RED: 1.35 | YELLOW: 1.15 | NONE: 1.00 | GREEN: 0.85
  branchMultiplier: number;      // Klinik (0.6 ağırlık): 1.15 | Temel (0.4 ağırlık): 1.00/0.90
  dusCategoryWeight: number;     // Temel: 0.4 | Klinik: 0.6
  unitWeight?: number | null;    // Ünite bazlı ağırlık (daha sonra eklenecek)
  mitigationMultiplier: number;  // Bekliyor: 1.00 | Anki Eklendi: 0.60 | Taburcu+Anki: 0.35
  matchedBucket: BucketType;
  matchedTopicId?: string;
  matchedTopicTitle?: string;
  branchQuestionCount: number;   // 10 | 6 | 4
  tier: SWSPSTier;
  tierLabel: string;
  recommendedAction: string;
  formulaSummary: string;
}

export interface SemanticErrorRecord {
  id: string;                    // ERR-01..
  date: string;                  // YYYY-MM-DD
  source: string;                // Deneme / Soru Bankası
  branchCode: CanonicalBranchCode;
  branchName: string;
  semanticCode: string;          // Konu_Matrisi ile ilişkili kod
  subtopic: string;
  questionSummary: string;
  errorType: CognitiveErrorType; // Bilgi (1.0), Muhakeme (1.25), Dikkat (0.8), Çeldirici (1.4)
  distractorAnalysis: string;    // Düşülen çeldirici analizi
  ankiClozeStatus: 'Eklendi' | 'Bekliyor';
  ankiClozeText?: string;
  swspsScore: number;            // Dinamik hesaplanan SWSPS v2.0 Bilişsel Ceza Puanı
  breakdown?: SWSPSBreakdown;    // SWSPS v2.0 Çarpan Röntgeni ve Aciliyet Bandı
  mockExamId?: string;           // Örn: DENEME-01
}

export type QuestionFormatType =
  | 'Klinik Vaka / Senaryo'
  | 'Öncüllü / Ayrım Sorusu'
  | 'Spot / Bilgi Sorusu'
  | 'ÖSYM Çıkmış Sorular'
  | 'Komplikasyon Yönetimi';

export interface DailyStudyQuestionLog {
  id: string;                    // LOG-01..
  date: string;                  // YYYY-MM-DD
  sourceBook: string;            // DUSBANKASI AI Motoru, DUSDATA Soru Bankası, TTS Çıkmış Sorular, DUSDATA Vaka Kitabı vb.
  branchCode: CanonicalBranchCode;
  branchName: string;
  semanticCode: string;
  questionFormat: QuestionFormatType;
  totalQuestions: number;
  correct: number;
  wrong: number;
  empty: number;
  net: number;                   // Doğru - Yanlış * 0.25
  accuracyPercent: number;       // (Doğru / Toplam) * 100
  durationMinutes: number;       // Süre (dk)
  speedSecondsPerQuestion: number; // ROUND((Süre_dk * 60) / Toplam, 1)
  notes?: string;
}

export interface AnkiBranchStat {
  branchCode: CanonicalBranchCode;
  branchName: string;
  totalCards: number;
  matureCards: number;           // >= 21 Gün
  youngCards: number;            // < 21 Gün
  learningCards: number;
  newCards: number;
  retentionPercent: number;      // Örn: 95.8
}

export interface AnkiFsrsSnapshot {
  lastSyncDate: string;
  dailyReviewCount: number;
  averageTimeSecondsPerCard: number;
  overallRetentionPercent: number; // %95.8
  targetRetentionPercent: number;  // %90.0
  totalCards: number;
  newCards: number;
  learningCards: number;
  youngCards: number;
  matureCards: number;
  branchStats: AnkiBranchStat[];
}

export interface SystemParameters {
  ownerName: string;             // Dt. Furkan Kurt
  ownerRole: string;             // İstanbul Üniversitesi Diş Hekimliği Fakültesi Mezunu — Diş Hekimi
  targetGoalTitle: string;       // 24 Ekim 2027 DUS — Ankara Üniversitesi ADÇC, TOP 10
  examDate: string;              // 2027-10-24
  targetBasicNet: number;        // 36.0
  targetClinicalNet: number;     // 72.0
  targetTotalNet: number;        // 108.0 (veya 105.0)
  adccEliteThreshold: number;    // 100.0
  targetFsrsRetention: number;   // 90.0 (%)
  dailyUnitCapacity: number;     // 5 (Günlük maksimum tekrar kapasitesi)
  idealSpeedMinSec: number;      // 50 sn/soru
  idealSpeedMaxSec: number;      // 60 sn/soru
  errorWeights: Record<CognitiveErrorType, number>;
}
