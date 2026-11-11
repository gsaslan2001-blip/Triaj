/**
 * DUS 2027 Excel-to-App Mimari Kılavuzu: Başlangıç Veri Havuzu (SSOT Seed Data)
 * - Sekme 7: Deneme_Analiz (DENEME-01..DENEME-05)
 * - Sekme 8 & 11: Gunluk_Log & Soru_Bankasi_Metrikleri
 * - Sekme 9: Konu_Matrisi (KM-01..KM-16 Kanonik Taksonomi & FSRS S/D/R Parametreleri)
 * - Sekme 10: Semantik_Hata_Analizi (SWSPS Bilişsel Ceza Skorlu Hata Kayıtları)
 * - Sekme 12: Anki_FSRS_Takip (%95.8 Kalıcılık & 16 Branş Kart Dağılımı)
 * - Sekme 14: Parametreler_Ayar (Sistem Genel Ayarları - SSOT)
 */

import {
  AnkiFsrsSnapshot,
  DailyStudyQuestionLog,
  MockExamRecord,
  SemanticErrorRecord,
  SystemParameters,
  TopicTaxonomyItem
} from '../types/dus';
import { calculateSWSPS, evaluateMockExam, DEFAULT_ERROR_WEIGHTS } from '../utils/analytics';

export const EXTENDED_STORAGE_KEYS = {
  MOCK_EXAMS: 'dus_excel_mock_exams_v1',
  SEMANTIC_ERRORS: 'dus_excel_semantic_errors_v1',
  QUESTION_LOGS: 'dus_excel_question_logs_v1',
  TOPIC_TAXONOMY: 'dus_excel_topic_taxonomy_v1',
  ANKI_SNAPSHOT: 'dus_excel_anki_snapshot_v1',
  SYSTEM_PARAMS: 'dus_excel_system_params_v1'
};

export const INITIAL_SYSTEM_PARAMETERS: SystemParameters = {
  ownerName: 'Dt. Furkan Kurt',
  ownerRole: 'İstanbul Üniversitesi Diş Hekimliği Fakültesi Mezunu — Diş Hekimi',
  targetGoalTitle: '24 Ekim 2027 DUS — Ankara Üniversitesi ADÇC, TOP 10',
  examDate: '2027-10-24',
  targetBasicNet: 36.0,
  targetClinicalNet: 72.0,
  targetTotalNet: 108.0,
  adccEliteThreshold: 100.0,
  targetFsrsRetention: 90.0,
  dailyUnitCapacity: 5,
  idealSpeedMinSec: 50,
  idealSpeedMaxSec: 60,
  errorWeights: { ...DEFAULT_ERROR_WEIGHTS }
};

export const DEMO_SEED_IDS = {
  MOCK_EXAMS: new Set(['DENEME-01', 'DENEME-02', 'DENEME-03', 'DENEME-04']),
  SEMANTIC_ERRORS: new Set(['ERR-01', 'ERR-02', 'ERR-03', 'ERR-04', 'ERR-05']),
  QUESTION_LOGS: new Set(['LOG-01', 'LOG-02', 'LOG-03', 'LOG-04', 'LOG-05', 'LOG-06']),
  TRIAGE_LOGS: new Set([
    'log-seed-green-b16',
    'log-seed-yellow-b14',
    'log-seed-red-b05',
    'log-seed-1',
    'log-seed-2'
  ]),
  DEMO_TOPIC_IDS_AND_DATES: new Map<string, string>([
    ['unit-b14-05', '2026-11-05'],
    ['unit-b16-10', '2026-11-02'],
    ['unit-b05-04', '2026-11-07'],
    ['unit-b04-01', '2026-11-07']
  ])
};

export const INITIAL_MOCK_EXAMS: MockExamRecord[] = [];

export const INITIAL_TOPIC_TAXONOMY: TopicTaxonomyItem[] = [
  // TEMEL BİLİMLER (B01..B08) — Kanonik DUS Ağırlığı: 0.4 (Ünite Bazlı Ağırlık: Daha Sonra Eklenecek)
  { id: 'KM-01', branchCode: 'B01', branchName: 'Anatomi', category: 'TEMEL_BILIMLER', mainTopic: 'Kafa Çiftleri ve Foramenler', subtopic: 'N. Trigeminus Dalları, Fossa Pterygopalatina Geçişleri', semanticCode: 'ANAT_CRANIAL_05', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 14.0, fsrsDifficultyD: 8.3, fsrsRetrievabilityR: 72 },
  { id: 'KM-02', branchCode: 'B02', branchName: 'Histoloji ve Embriyoloji', category: 'TEMEL_BILIMLER', mainTopic: 'Odontogenez ve Faringeal Arkuslar', subtopic: 'Tomurcuk-Takke-Çan Evresi, 1. Faringeal Arkus (Meckel Kıkırdağı)', semanticCode: 'HISTO_ODONTO_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 20.8, fsrsDifficultyD: 6.8, fsrsRetrievabilityR: 87 },
  { id: 'KM-03', branchCode: 'B03', branchName: 'Fizyoloji', category: 'TEMEL_BILIMLER', mainTopic: 'Nörofizyoloji ve Kas Kasılması', subtopic: 'Ağrı Kapı Kontrol Teorisi (A-delta vs C Lifleri), Sarkomer Kalsiyum Döngüsü', semanticCode: 'FIZYO_PAIN_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 23.0, fsrsDifficultyD: 6.4, fsrsRetrievabilityR: 91 },
  { id: 'KM-04', branchCode: 'B04', branchName: 'Tıbbi Biyokimya', category: 'TEMEL_BILIMLER', mainTopic: 'Bağ Dokusu ve Kollajen Biyosentezi', subtopic: 'C Vitamini Hidroksilasyonu, Ehlers-Danlos ve Osteogenesis Imperfecta', semanticCode: 'BIYO_COLLAGEN_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 15.6, fsrsDifficultyD: 7.7, fsrsRetrievabilityR: 79 },
  { id: 'KM-05', branchCode: 'B05', branchName: 'Tıbbi Mikrobiyoloji', category: 'TEMEL_BILIMLER', mainTopic: 'Oral Mikrobiyoloji ve Biyofilm', subtopic: 'Socransky Kırmızı Kompleks (P. gingivalis, T. forsythia, T. denticola)', semanticCode: 'MIKRO_RED_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 27.0, fsrsDifficultyD: 6.0, fsrsRetrievabilityR: 94 },
  { id: 'KM-06', branchCode: 'B06', branchName: 'Tıbbi Patoloji', category: 'TEMEL_BILIMLER', mainTopic: 'Tükürük Bezi Tümörleri', subtopic: 'Pleomorfik Adenom (PLAG1), Mukoepidermoid Karsinom (CRTC1-MAML2)', semanticCode: 'PAT_SALIVARY_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 13.2, fsrsDifficultyD: 8.5, fsrsRetrievabilityR: 71 },
  { id: 'KM-07', branchCode: 'B07', branchName: 'Tıbbi Farmakoloji', category: 'TEMEL_BILIMLER', mainTopic: 'Lokal Anestezikler ve Antibiyotik Profilaksisi', subtopic: 'Artikain Tiyofen Halkası, Methemoglobinemi (Prilokain) ve AHA Rejimi', semanticCode: 'FARM_LOCAL_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 25.4, fsrsDifficultyD: 6.5, fsrsRetrievabilityR: 92 },
  { id: 'KM-08', branchCode: 'B08', branchName: 'Tıbbi Biyoloji ve Genetik', category: 'TEMEL_BILIMLER', mainTopic: 'Hücre Döngüsü ve Kalıtım Paternleri', subtopic: 'p53 / Rb Kontrol Noktaları, Amelogenezis İmperfekta Kalıtım Tipleri', semanticCode: 'BIYOL_GEN_01', dusWeight: 0.4, unitWeight: null, fsrsStabilityS: 24.0, fsrsDifficultyD: 6.1, fsrsRetrievabilityR: 93 },

  // KLİNİK BİLİMLER (B09..B16) — Kanonik DUS Ağırlığı: 0.6 (Ünite Bazlı Ağırlık: Daha Sonra Eklenecek)
  { id: 'KM-09', branchCode: 'B09', branchName: 'Ağız, Diş ve Çene Cerrahisi', category: 'KLINIK_BILIMLER', mainTopic: 'Gömülü Diş Cerrahisi', subtopic: 'Pell-Gregory & Winter Sınıflaması, İnferior Alveolar Sinir Komşuluğu', semanticCode: 'ADCC_IMPACT_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 24.5, fsrsDifficultyD: 7.8, fsrsRetrievabilityR: 86 },
  { id: 'KM-10', branchCode: 'B09', branchName: 'Ağız, Diş ve Çene Cerrahisi', category: 'KLINIK_BILIMLER', mainTopic: 'Odontojenik Kistler ve Tümörler', subtopic: 'Ameloblastoma, OKK (PTCH1) ve Marsüpyalizasyon Kriterleri', semanticCode: 'ADCC_CYST_02', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 16.2, fsrsDifficultyD: 8.4, fsrsRetrievabilityR: 74 },
  { id: 'KM-11', branchCode: 'B10', branchName: 'Ağız, Diş ve Çene Radyolojisi', category: 'KLINIK_BILIMLER', mainTopic: 'Çene Lezyonları Radyomorfolojisi', subtopic: 'Sabun Köpüğü, Tenis Raketi, Güneş Işını Periost Reaksiyonları', semanticCode: 'RAD_LESION_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 21.3, fsrsDifficultyD: 7.1, fsrsRetrievabilityR: 88 },
  { id: 'KM-12', branchCode: 'B11', branchName: 'Periodontoloji', category: 'KLINIK_BILIMLER', mainTopic: '2017 Yeni Periodontal Sınıflama', subtopic: 'Evreleme (Stage I-IV) ve Derecelendirme (Grade A-C) HbA1c Eşiği', semanticCode: 'PERIO_CLASS_17', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 19.4, fsrsDifficultyD: 7.5, fsrsRetrievabilityR: 82 },
  { id: 'KM-13', branchCode: 'B12', branchName: 'Ortodonti', category: 'KLINIK_BILIMLER', mainTopic: 'Sefalometrik Analiz ve Biyomekanik', subtopic: 'SNA, SNB, ANB Açıları, Moment/Kuvvet Oranı ve Devrilme Hareketi', semanticCode: 'ORTO_CEPH_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 9.5, fsrsDifficultyD: 8.9, fsrsRetrievabilityR: 64 },
  { id: 'KM-14', branchCode: 'B13', branchName: 'Çocuk Diş Hekimliği (Pedodonti)', category: 'KLINIK_BILIMLER', mainTopic: 'Dental Travmatoloji ve Vital Pulpa', subtopic: 'Avülsiyon Splint Süreleri (2 Hafta vs 4 Hafta) ve MTA Apeksifikasyon', semanticCode: 'PEDO_TRAUMA_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 18.0, fsrsDifficultyD: 7.6, fsrsRetrievabilityR: 81 },
  { id: 'KM-15', branchCode: 'B14', branchName: 'Endodonti', category: 'KLINIK_BILIMLER', mainTopic: 'Kök Kanal Anatomisi ve İrrigasyon', subtopic: 'NaOCl + EDTA Etkileşimi, Klorheksidin PCA Çökeltisi', semanticCode: 'ENDO_IRRIG_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 29.0, fsrsDifficultyD: 6.2, fsrsRetrievabilityR: 93 },
  { id: 'KM-16', branchCode: 'B15', branchName: 'Restoratif Diş Tedavisi', category: 'KLINIK_BILIMLER', mainTopic: 'Adeziv Sistemler ve Bağlanma', subtopic: '10-MDP Kimyasal Bağlanma, HEMA Faz Ayrılması ve C-Faktörü', semanticCode: 'REST_ADHES_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 22.1, fsrsDifficultyD: 6.9, fsrsRetrievabilityR: 89 },
  { id: 'KM-17', branchCode: 'B16', branchName: 'Protetik Diş Tedavisi', category: 'KLINIK_BILIMLER', mainTopic: 'Hareketli Bölümlü Protez Planlaması', subtopic: 'Kennedy Sınıflaması, Kroşe Biyomekaniği ve İndirekt Tutucular', semanticCode: 'PROT_KENNEDY_01', dusWeight: 0.6, unitWeight: null, fsrsStabilityS: 11.8, fsrsDifficultyD: 8.8, fsrsRetrievabilityR: 68 }
];

export const INITIAL_SEMANTIC_ERRORS: SemanticErrorRecord[] = [];

export const INITIAL_DAILY_QUESTION_LOGS: DailyStudyQuestionLog[] = [];

export const INITIAL_ANKI_FSRS_SNAPSHOT: AnkiFsrsSnapshot = {
  lastSyncDate: '2026-04-08',
  dailyReviewCount: 164,
  averageTimeSecondsPerCard: 7.4,
  overallRetentionPercent: 95.8,
  targetRetentionPercent: 90.0,
  totalCards: 3840,
  newCards: 190,
  learningCards: 145,
  youngCards: 1125,
  matureCards: 2380,
  branchStats: [
    { branchCode: 'B01', branchName: 'Anatomi', totalCards: 310, matureCards: 195, youngCards: 85, learningCards: 15, newCards: 15, retentionPercent: 94.2 },
    { branchCode: 'B02', branchName: 'Histoloji ve Embriyoloji', totalCards: 160, matureCards: 105, youngCards: 40, learningCards: 8, newCards: 7, retentionPercent: 95.5 },
    { branchCode: 'B03', branchName: 'Fizyoloji', totalCards: 150, matureCards: 98, youngCards: 38, learningCards: 7, newCards: 7, retentionPercent: 96.1 },
    { branchCode: 'B04', branchName: 'Tıbbi Biyokimya', totalCards: 280, matureCards: 170, youngCards: 80, learningCards: 14, newCards: 16, retentionPercent: 93.8 },
    { branchCode: 'B05', branchName: 'Tıbbi Mikrobiyoloji', totalCards: 290, matureCards: 190, youngCards: 75, learningCards: 12, newCards: 13, retentionPercent: 96.4 },
    { branchCode: 'B06', branchName: 'Tıbbi Patoloji', totalCards: 220, matureCards: 135, youngCards: 62, learningCards: 11, newCards: 12, retentionPercent: 94.0 },
    { branchCode: 'B07', branchName: 'Tıbbi Farmakoloji', totalCards: 270, matureCards: 180, youngCards: 68, learningCards: 10, newCards: 12, retentionPercent: 96.8 },
    { branchCode: 'B08', branchName: 'Tıbbi Biyoloji ve Genetik', totalCards: 140, matureCards: 92, youngCards: 34, learningCards: 6, newCards: 8, retentionPercent: 97.0 },
    { branchCode: 'B09', branchName: 'Ağız, Diş ve Çene Cerrahisi', totalCards: 320, matureCards: 210, youngCards: 86, learningCards: 10, newCards: 14, retentionPercent: 97.2 },
    { branchCode: 'B10', branchName: 'Ağız, Diş ve Çene Radyolojisi', totalCards: 240, matureCards: 155, youngCards: 65, learningCards: 8, newCards: 12, retentionPercent: 96.5 },
    { branchCode: 'B11', branchName: 'Periodontoloji', totalCards: 260, matureCards: 165, youngCards: 72, learningCards: 9, newCards: 14, retentionPercent: 96.0 },
    { branchCode: 'B12', branchName: 'Ortodonti', totalCards: 230, matureCards: 125, youngCards: 80, learningCards: 11, newCards: 14, retentionPercent: 93.4 },
    { branchCode: 'B13', branchName: 'Çocuk Diş Hekimliği (Pedodonti)', totalCards: 240, matureCards: 150, youngCards: 70, learningCards: 8, newCards: 12, retentionPercent: 95.9 },
    { branchCode: 'B14', branchName: 'Endodonti', totalCards: 250, matureCards: 165, youngCards: 68, learningCards: 6, newCards: 11, retentionPercent: 97.1 },
    { branchCode: 'B15', branchName: 'Restoratif Diş Tedavisi', totalCards: 230, matureCards: 130, youngCards: 82, learningCards: 5, newCards: 13, retentionPercent: 96.2 },
    { branchCode: 'B16', branchName: 'Protetik Diş Tedavisi', totalCards: 250, matureCards: 115, youngCards: 120, learningCards: 5, newCards: 10, retentionPercent: 93.9 }
  ]
};
