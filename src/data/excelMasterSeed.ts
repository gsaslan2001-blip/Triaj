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

export const INITIAL_MOCK_EXAMS: MockExamRecord[] = [
  evaluateMockExam(
    'DENEME-01',
    '2026-02-15',
    'DUSDATA Türkiye Geneli TG-1',
    {
      B01: 3.75, B02: 2.5, B03: 2.75, B04: 3.5, B05: 4.0, B06: 2.5, B07: 3.75, B08: 2.75,
      B09: 7.5, B10: 7.25, B11: 6.5, B12: 6.0, B13: 6.75, B14: 7.0, B15: 6.75, B16: 6.25
    },
    108.0,
    100.0,
    'Bazal kalibrasyon denemesi. Ortodonti ankraj ve Biyokimya metabolizma üniteleri T+3 kuyruğuna alındı.'
  ),
  evaluateMockExam(
    'DENEME-02',
    '2026-03-01',
    'DUSTIME Kurumsal Deneme-2',
    {
      B01: 4.25, B02: 3.0, B03: 3.0, B04: 4.0, B05: 4.5, B06: 3.0, B07: 4.25, B08: 3.0,
      B09: 8.25, B10: 8.0, B11: 7.5, B12: 6.75, B13: 7.5, B14: 7.75, B15: 7.5, B16: 7.0
    },
    108.0,
    100.0,
    'Klinik bilimler +8.25 net artış gösterdi. Cerrahi ve Endodonti vaka sorularında hız 52 sn/soruya indi.'
  ),
  evaluateMockExam(
    'DENEME-03',
    '2026-03-18',
    'DUSDATA Türkiye Geneli TG-2',
    {
      B01: 4.75, B02: 3.25, B03: 3.25, B04: 4.5, B05: 4.75, B06: 3.25, B07: 4.75, B08: 3.5,
      B09: 8.75, B10: 8.5, B11: 8.25, B12: 7.5, B13: 8.0, B14: 8.5, B15: 8.25, B16: 7.75
    },
    108.0,
    100.0,
    '97.50 toplam net. ADÇC 100 barajına 2.5 net kaldı. Perio 2017 sınıflaması Yeşil Kovaya taburcu edildi.'
  ),
  evaluateMockExam(
    'DENEME-04',
    '2026-04-04',
    'ÖSYM Birebir Prova — Stratejik Kamp Denemesi',
    {
      B01: 5.25, B02: 3.5, B03: 3.5, B04: 4.75, B05: 5.0, B06: 3.5, B07: 5.0, B08: 3.75,
      B09: 9.25, B10: 9.0, B11: 8.75, B12: 8.25, B13: 8.5, B14: 9.0, B15: 8.75, B16: 8.25
    },
    108.0,
    100.0,
    '104.00 Net ile ADÇC ELİT Barajı (100+) aşıldı! Kalan 4.0 netlik fark için SWSPS yüksek hatalara odaklanılıyor.'
  )
];

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

export const INITIAL_SEMANTIC_ERRORS: SemanticErrorRecord[] = [
  {
    id: 'ERR-01',
    date: '2026-04-06',
    source: 'ÖSYM Birebir Prova Denemesi',
    branchCode: 'B16',
    branchName: 'Protetik Diş Tedavisi',
    semanticCode: 'PROT_KENNEDY_01',
    subtopic: 'Kennedy Sınıf I-II İndirekt Tutucu Konumlandırması',
    questionSummary: 'Serbest sonlu HBP vakasında fulkrum hattına dik çizilen indirekt tutucu desteğinin kanin yerine 1. premolara konulması tuzağı.',
    errorType: 'Çeldirici',
    distractorAnalysis: 'Mesial oklüzal tırnak ile fulkrum hattı eksenini ters yorumladım; en uzak mezial fossa seçilmeliydi.',
    ankiClozeStatus: 'Bekliyor',
    ankiClozeText: 'Kennedy Sınıf I ve II vakalarında {{c1::indirekt tutucu}}, terminal dayanaklardan geçen {{c2::fulkrum hattının}} mümkün olduğunca önüne ve dik açıyla yerleştirilir.',
    swspsScore: calculateSWSPS({
      errorType: 'Çeldirici',
      repeatCount: 3,
      difficultyD: 8.8,
      fsrsRetrievabilityR: 68,
      daysElapsed: 2
    }),
    mockExamId: 'DENEME-04'
  },
  {
    id: 'ERR-02',
    date: '2026-04-05',
    source: 'DUSDATA Vaka Kitabı',
    branchCode: 'B12',
    branchName: 'Ortodonti',
    semanticCode: 'ORTO_CEPH_01',
    subtopic: 'Kontrollü vs Kontrolsüz Devrilme (M/F Oranı)',
    questionSummary: 'Moment/Kuvvet oranı 8:1 verildiğinde direnç merkezinin apeks hizasında kalacağı (kontrollü devrilme) yerine gövdesel hareket (10:1) seçilmesi.',
    errorType: 'Muhakeme',
    distractorAnalysis: '8:1 (Kontrollü Devrilme) ile 10:1 (Translasyon/Gövdesel) ve 12:1 (Kök Torku) eşiklerini hız baskısıyla karıştırdım.',
    ankiClozeStatus: 'Bekliyor',
    ankiClozeText: 'Ortodontik M/F oranlarında: {{c1::5:1 Kontrolsüz Devrilme}}, {{c2::8:1 Kontrollü Devrilme (apeks sabit)}}, {{c3::10:1 Gövdesel Hareket (Translasyon)}}, {{c4::12:1 Tork (Kök hareketi)}} oluşturur.',
    swspsScore: calculateSWSPS({
      errorType: 'Muhakeme',
      repeatCount: 2,
      difficultyD: 8.9,
      fsrsRetrievabilityR: 64,
      daysElapsed: 3
    }),
    mockExamId: 'DENEME-04'
  },
  {
    id: 'ERR-03',
    date: '2026-04-04',
    source: 'ÖSYM Birebir Prova Denemesi',
    branchCode: 'B09',
    branchName: 'Ağız, Diş ve Çene Cerrahisi',
    semanticCode: 'ADCC_CYST_02',
    subtopic: 'Odontojenik Keratokist (OKK) Nüks Mekanizması ve Carnoy Solüsyonu',
    questionSummary: 'OKK nüks nedenleri arasında "kalın fibröz kapsül" şıkkına düşülmesi (OKK kapsülü ince ve frajildir + satellit kistler içerir).',
    errorType: 'Çeldirici',
    distractorAnalysis: 'Kapsülün ince/frajil olması yerine kalın olduğu çeldiricisini doğru kabul ettim.',
    ankiClozeStatus: 'Eklendi',
    ankiClozeText: 'Odontojenik Keratokist (OKK) {{c1::PTCH1}} gen mutasyonu gösterir; {{c2::ince, frajil fibröz kapsülü}} ve bağ dokusundaki {{c3::kız (satellit) kistler}} nedeniyle yüksek nüks (%30+) oranına sahiptir.',
    swspsScore: calculateSWSPS({
      errorType: 'Çeldirici',
      repeatCount: 2,
      difficultyD: 8.4,
      fsrsRetrievabilityR: 74,
      daysElapsed: 4
    }),
    mockExamId: 'DENEME-04'
  },
  {
    id: 'ERR-04',
    date: '2026-04-02',
    source: 'DUSBANKASI AI Motoru',
    branchCode: 'B01',
    branchName: 'Anatomi',
    semanticCode: 'ANAT_CRANIAL_05',
    subtopic: 'Foramen Ovale vs Foramen Spinosum İçeriği',
    questionSummary: 'A. meningea media\'nın geçtiği oluşum sorusunda Foramen ovale (MALE: Mandibularis, Accessorius meningeus, Lesser petrosal, Emissary) işaretlenmesi.',
    errorType: 'Bilgi',
    distractorAnalysis: 'A. meningea media (Foramen spinosum) ile A. meningea accessoria (Foramen ovale) ayrımı karıştı.',
    ankiClozeStatus: 'Eklendi',
    ankiClozeText: '{{c1::A. meningea media}} kraniuma {{c2::Foramen spinosum}} içinden girerken; {{c3::A. meningea accessoria ve N. mandibularis (V3)}} {{c4::Foramen ovale}} içinden geçer.',
    swspsScore: calculateSWSPS({
      errorType: 'Bilgi',
      repeatCount: 2,
      difficultyD: 8.3,
      fsrsRetrievabilityR: 72,
      daysElapsed: 6
    }),
    mockExamId: 'DENEME-03'
  },
  {
    id: 'ERR-05',
    date: '2026-03-30',
    source: 'TTS Çıkmış Sorular',
    branchCode: 'B06',
    branchName: 'Tıbbi Patoloji',
    semanticCode: 'PAT_SALIVARY_01',
    subtopic: 'Mukoepidermoid Karsinom CRTC1-MAML2 Translokasyonu',
    questionSummary: 'En sık malign tükürük bezi tümörü olan Mukoepidermoid Karsinomun t(11;19) CRTC1-MAML2 füzyon genini Adenoid Kistik Karsinom (MYB-NFIB) ile karıştırma.',
    errorType: 'Bilgi',
    distractorAnalysis: 'Mukoepidermoid = MAML2, Adenoid Kistik = MYB-NFIB (İsviçre peyniri / perinöral invazyon) kodlaması pekiştirildi.',
    ankiClozeStatus: 'Eklendi',
    ankiClozeText: 'Mukoepidermoid karsinom {{c1::t(11;19) CRTC1-MAML2}} translokasyonu taşırken; perinöral invazyon şampiyonu Adenoid Kistik Karsinom {{c2::MYB-NFIB}} füzyonu gösterir.',
    swspsScore: calculateSWSPS({
      errorType: 'Bilgi',
      repeatCount: 1,
      difficultyD: 8.5,
      fsrsRetrievabilityR: 71,
      daysElapsed: 9
    }),
    mockExamId: 'DENEME-03'
  }
];

export const INITIAL_DAILY_QUESTION_LOGS: DailyStudyQuestionLog[] = [
  {
    id: 'LOG-01',
    date: '2026-04-08',
    sourceBook: 'DUSBANKASI AI Motoru',
    branchCode: 'B09',
    branchName: 'Ağız, Diş ve Çene Cerrahisi',
    semanticCode: 'ADCC_IMPACT_01',
    questionFormat: 'Klinik Vaka / Senaryo',
    totalQuestions: 40,
    correct: 37,
    wrong: 3,
    empty: 0,
    net: 36.25,
    accuracyPercent: 92.5,
    durationMinutes: 33,
    speedSecondsPerQuestion: 49.5,
    notes: 'T+3 40 soruluk esas geri çağırma testi. Elit hız (<50 sn/soru) yakalandı.'
  },
  {
    id: 'LOG-02',
    date: '2026-04-07',
    sourceBook: 'DUSDATA Soru Bankası',
    branchCode: 'B14',
    branchName: 'Endodonti',
    semanticCode: 'ENDO_IRRIG_01',
    questionFormat: 'Öncüllü / Ayrım Sorusu',
    totalQuestions: 40,
    correct: 36,
    wrong: 4,
    empty: 0,
    net: 35.0,
    accuracyPercent: 90.0,
    durationMinutes: 36,
    speedSecondsPerQuestion: 54.0,
    notes: 'İrrigasyon etkileşimleri ve NaOCl kazaları. Yeşil Kovaya taburcu edildi.'
  },
  {
    id: 'LOG-03',
    date: '2026-04-06',
    sourceBook: 'TTS Çıkmış Sorular',
    branchCode: 'B11',
    branchName: 'Periodontoloji',
    semanticCode: 'PERIO_CLASS_17',
    questionFormat: 'ÖSYM Çıkmış Sorular',
    totalQuestions: 50,
    correct: 45,
    wrong: 5,
    empty: 0,
    net: 43.75,
    accuracyPercent: 90.0,
    durationMinutes: 42,
    speedSecondsPerQuestion: 50.4,
    notes: '2012-2025 ÖSYM Perio çıkmış sorular taraması.'
  },
  {
    id: 'LOG-04',
    date: '2026-04-05',
    sourceBook: 'DUSDATA Vaka Kitabı',
    branchCode: 'B16',
    branchName: 'Protetik Diş Tedavisi',
    semanticCode: 'PROT_KENNEDY_01',
    questionFormat: 'Komplikasyon Yönetimi',
    totalQuestions: 30,
    correct: 23,
    wrong: 7,
    empty: 0,
    net: 21.25,
    accuracyPercent: 76.7,
    durationMinutes: 32,
    speedSecondsPerQuestion: 64.0,
    notes: 'Kennedy Sınıf I biyomekaniği. Hız 60 sn üstüne çıktı, T+14 doğrulamasına alındı.'
  },
  {
    id: 'LOG-05',
    date: '2026-04-04',
    sourceBook: 'DUSBANKASI AI Motoru',
    branchCode: 'B01',
    branchName: 'Anatomi',
    semanticCode: 'ANAT_CRANIAL_05',
    questionFormat: 'Spot / Bilgi Sorusu',
    totalQuestions: 40,
    correct: 34,
    wrong: 6,
    empty: 0,
    net: 32.5,
    accuracyPercent: 85.0,
    durationMinutes: 31,
    speedSecondsPerQuestion: 46.5,
    notes: 'Fossa pterygopalatina ve kafa çiftleri spot taraması.'
  },
  {
    id: 'LOG-06',
    date: '2026-04-03',
    sourceBook: 'DUSDATA Soru Bankası',
    branchCode: 'B07',
    branchName: 'Tıbbi Farmakoloji',
    semanticCode: 'FARM_LOCAL_01',
    questionFormat: 'Spot / Bilgi Sorusu',
    totalQuestions: 40,
    correct: 37,
    wrong: 3,
    empty: 0,
    net: 36.25,
    accuracyPercent: 92.5,
    durationMinutes: 34,
    speedSecondsPerQuestion: 51.0,
    notes: 'Lokal anestezikler ve AHA endokardit profilaksisi.'
  }
];

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
