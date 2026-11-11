/**
 * Bilişsel Kova Triyajı ve Karar Motoru
 * Doktrin: DUS 2027 80/20 Pareto & Ebbinghaus Gecikmeli Geri Çağırma Mimarisi
 */

import {
  BucketType,
  PriorityLevel,
  DUSSubject,
  TopicUnit,
  TriageNotification,
  KovaTriageReport,
  SubjectTriageSummary
} from '../types/dus';

export interface TriageResult {
  bucket: BucketType;
  priority: PriorityLevel;
  percentage: number;
  correct: number;
  wrong: number;
  total: number;
  clinicalDiagnosis: string;
  recommendedAction: string;
  nextScheduledDate?: string;
  scheduleType?: 'DISCHARGED' | 'T14_VERIFICATION' | 'SATURDAY_REPAIR' | 'T3_LOCKED';
  affectsBucket?: boolean;
  recommendedBank?: string;
}

/**
 * T+0 Günü Konu Çalışması + 20 Soruluk Kalibrasyon Değerlendirmesi
 * Doktrin Kuralı: T+0 günündeki 20 soruluk çözüm istatistiği kova rengini (Yeşil/Sarı/Kırmızı) BELİRLEMEZ!
 * Tek amacı ilk kodlamayı doğrulamak ve 3 gün sonrasına (T+3) esas geri çağırma testini kilitlemektir.
 * @param correct Doğru sayısı
 * @param total Toplam soru (Standart 20 soru)
 * @param studyDate Konunun çalışıldığı tarih (YYYY-MM-DD)
 */
export function evaluateT0Calibration(
  correct: number,
  total: number = 20,
  studyDate: string = getTodayString()
): TriageResult {
  const safeTotal = total > 0 ? total : 20;
  const safeCorrect = Math.max(0, Math.min(correct, safeTotal));
  const wrong = safeTotal - safeCorrect;
  const percentage = Math.round((safeCorrect / safeTotal) * 100);
  const t3Date = addDays(studyDate, 3);

  return {
    bucket: 'NONE',
    priority: 'P3_MEDIUM',
    percentage,
    correct: safeCorrect,
    wrong,
    total: safeTotal,
    clinicalDiagnosis:
      'T+0 İlk Kodlama & 20 Soruluk Kalibrasyon tamamlandı. Bu aşamadaki doğru/yanlış oranı kova rengini BELİRLEMEZ (kısa süreli hafıza yanılsamasını önlemek için kova kararı T+3 gününe bırakılır).',
    recommendedAction: `Konu T+3 Bekleyenler sırasına alındı. 3 gün sonra (${t3Date}) konuyu tekrar okumadan çözülecek T+3 esas testindeki performansa göre Yeşil (bir daha tekrar sırasına girmez), Sarı (T+14) veya Kırmızı (Cumartesi Onarım) kovaya ayrılacaktır.`,
    nextScheduledDate: t3Date,
    scheduleType: 'T3_LOCKED',
    affectsBucket: false,
    recommendedBank: '1. Soru Bankası (Kalan 40 Soru - T+3 Esas Test)'
  };
}

/**
 * T+3 Günü Esas Geri Çağırma Testi Sonucuna Göre Bilişsel Kova Triyajı Kararı
 * @param correct Doğru sayısı
 * @param total Toplam soru (Standart 40 soru)
 * @param testDate Testin çözüldüğü tarih (YYYY-MM-DD)
 */
export function evaluateT3Triage(
  correct: number,
  total: number = 40,
  testDate: string = getTodayString()
): TriageResult {
  const safeTotal = total > 0 ? total : 40;
  const safeCorrect = Math.max(0, Math.min(correct, safeTotal));
  const wrong = safeTotal - safeCorrect;
  const percentage = Math.round((safeCorrect / safeTotal) * 100);

  if (percentage >= 85) {
    // YEŞİL KOVA: ≥%85 Başarı (Örn: 40 Soruda 34-40 Doğru)
    return {
      bucket: 'GREEN',
      priority: 'P4_LOW',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'Araya 3 tam gün girmesine rağmen şema neokortekste sağlam (≥%85).',
      recommendedAction:
        'Aşama 1: Sadece yanlış çıkan 1-6 sorunun paragrafını ana kitaptan oku (5-10 dk). Aşama 2 (Taburcu!): Konu bir daha tekrar sırasına GİRMEZ! 2. Soru Bankası çözülmez; sadece ders bittiğinde karma branş denemelerinde görülür.',
      scheduleType: 'DISCHARGED',
      affectsBucket: true,
      recommendedBank: 'Tekrar Kuyruğundan Çıkarıldı (Sadece Ders Sonu Karma Branş Denemesi)'
    };
  } else if (percentage >= 70) {
    // SARI KOVA: %70-%84 Başarı (Örn: 40 Soruda 28-33 Doğru)
    const t14Date = addDays(testDate, 14);
    return {
      bucket: 'YELLOW',
      priority: 'P2_HIGH',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis:
        'Ana iskelet oturmuş ancak bazı spesifik alt başlıklar veya sınıflamalar 3 günde erimiş (%70-%84).',
      recommendedAction:
        'Aşama 1: Yanlış çıkan soruların alt başlıklarını ana kitaptan 15 dk dikkatlice oku ve yıldızla. Aşama 2: 14 gün sonrasına (T+14) yıldızlı yerlere 5 dk göz atma + 2. Soru Bankasından (veya DUSBANKASI) 1 test (20-25 soru) doğrulama görevi kilitlendi.',
      nextScheduledDate: t14Date,
      scheduleType: 'T14_VERIFICATION',
      affectsBucket: true,
      recommendedBank: '2. Soru Bankası / DUSBANKASI (20-25 Soru Doğrulama Testi)'
    };
  } else {
    // KIRMIZI KOVA: <%70 Başarı (Örn: 40 Soruda ≤27 Doğru)
    const saturdayDate = getNextSaturday(testDate);
    return {
      bucket: 'RED',
      priority: 'P1_CRITICAL',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis:
        'Alarm! İlk gün şema hiç oturmamış veya ünite aşırı nankör (<%70). Hafta içi 10 dk yama yetmez.',
      recommendedAction:
        'Aşama 1: Hafta içi günlük programı bozma, çöken alt başlıkları not al. Aşama 2: Ünite Cumartesi Kova Onarım Bloğuna (25 dk Boş Kağıt / Kıyas Tablosu ile aktif yeniden inşa + 2. Soru Bankasından 30 soru) atandı.',
      nextScheduledDate: saturdayDate,
      scheduleType: 'SATURDAY_REPAIR',
      affectsBucket: true,
      recommendedBank: '2. Soru Bankası / DUSBANKASI (30 Soru Cumartesi Onarım Testi)'
    };
  }
}

/**
 * Sarı Kova T+14 Doğrulama Testi Değerlendirmesi
 * @param correct Doğru sayısı
 * @param total Toplam soru (Standart 20-25)
 * @param testDate Test tarihi
 * @param promotedFromRed Kırmızı Kovadan Cumartesi onarımıyla mı geldi (3. Banka kullanımı)
 */
export function evaluateT14Verification(
  correct: number,
  total: number = 20,
  testDate: string = getTodayString(),
  promotedFromRed: boolean = false
): TriageResult {
  const safeTotal = total > 0 ? total : 20;
  const safeCorrect = Math.max(0, Math.min(correct, safeTotal));
  const percentage = Math.round((safeCorrect / safeTotal) * 100);
  const wrong = safeTotal - safeCorrect;

  if (percentage >= 85) {
    // T+14'te ≥%85 ise Yeşile mezun olur!
    return {
      bucket: 'GREEN',
      priority: 'P4_LOW',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'T+14 gecikmeli doğrulaması başarılı (≥%85)! Zayıf sinapslar kalıcı olarak onarıldı.',
      recommendedAction: 'Yeşil Kovaya terfi etti (Taburcu!). Konu bir daha tekrar sırasına girmez, takvimden düşürülür.',
      scheduleType: 'DISCHARGED',
      affectsBucket: true,
      recommendedBank: 'Taburcu Edildi (Tekrar Sırasından Çıktı)'
    };
  } else if (percentage >= 70) {
    // Halen Sarı Kovada kalır, bir takip daha eklenir
    const nextDate = addDays(testDate, 14);
    const bankLabel = promotedFromRed
      ? '3. Soru Bankası / DUSBANKASI (20-25 Soru)'
      : '2. Soru Bankası / DUSBANKASI (20-25 Soru)';
    return {
      bucket: 'YELLOW',
      priority: 'P2_HIGH',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'Halen sınırda performans (%70-%84). Şema tam sağlamlaşmamış.',
      recommendedAction: `Yıldızlı başlıkları 10 dk tekrar incele. 14 gün sonrasına (${nextDate}) ${bankLabel} ile ek doğrulama planlandı.`,
      nextScheduledDate: nextDate,
      scheduleType: 'T14_VERIFICATION',
      affectsBucket: true,
      recommendedBank: bankLabel
    };
  } else {
    // T+14'te <%70 ise Kırmızıya düşer!
    const saturdayDate = getNextSaturday(testDate);
    return {
      bucket: 'RED',
      priority: 'P1_CRITICAL',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'T+14 kontrolünde ciddi unutma / gerileme tespit edildi (<%70).',
      recommendedAction:
        'Kırmızı Kovaya düşürüldü! Cumartesi Kova Onarım Bloğuna (25 dk Boş Kağıt + 30 soru) aktarıldı.',
      nextScheduledDate: saturdayDate,
      scheduleType: 'SATURDAY_REPAIR',
      affectsBucket: true,
      recommendedBank: '2. Soru Bankası / DUSBANKASI (30 Soru Cumartesi Onarım)'
    };
  }
}

/**
 * Kırmızı Kova Cumartesi Onarım Testi Değerlendirmesi (PDF Madde 5.2 - C: Kırmızı Kova Protokolü)
 * @param correct Doğru sayısı
 * @param total Toplam soru (Standart 30)
 */
export function evaluateSaturdayRepair(
  correct: number,
  total: number = 30,
  testDate: string = getTodayString()
): TriageResult {
  const safeTotal = total > 0 ? total : 30;
  const safeCorrect = Math.max(0, Math.min(correct, safeTotal));
  const percentage = Math.round((safeCorrect / safeTotal) * 100);
  const wrong = safeTotal - safeCorrect;

  if (percentage >= 80) {
    // %80+ (30 soruda ≥24 doğru) ise Sarı Kovaya terfi eder (T+14'e 3. Soru Bankasından / DUSBANKASI test konur)
    const t14Date = addDays(testDate, 14);
    return {
      bucket: 'YELLOW',
      priority: 'P2_HIGH',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'Cumartesi derin onarımı başarılı (≥%80 / 30 soruda 24+ doğru). Çöken şema yeniden inşa edildi.',
      recommendedAction:
        'Sarı Kovaya terfi etti! 14 gün sonrasına (T+14) 3. Soru Bankasından (veya DUSBANKASI) 20-25 soruluk doğrulama testi kilitlendi.',
      nextScheduledDate: t14Date,
      scheduleType: 'T14_VERIFICATION',
      affectsBucket: true,
      recommendedBank: '3. Soru Bankası / DUSBANKASI (20-25 Soru T+14 Doğrulama)'
    };
  } else {
    // Yeniden Cumartesi Kırmızı Kovada kalır
    const nextSaturday = getNextSaturday(addDays(testDate, 1));
    return {
      bucket: 'RED',
      priority: 'P1_CRITICAL',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'Onarım henüz %80 barajının altında (<%80). Konseptsel boşluk devam ediyor.',
      recommendedAction:
        'Kırmızı Kovada kaldı. Gelecek Cumartesi için Feynman / Boş Kağıt ve Detaylandırıcı Sorgulama ile yeniden inşa planlandı.',
      nextScheduledDate: nextSaturday,
      scheduleType: 'SATURDAY_REPAIR',
      affectsBucket: true,
      recommendedBank: '2. Soru Bankası / DUSBANKASI (30 Soru Cumartesi Onarım)'
    };
  }
}

/**
 * Deneme / Branş Denemesi Yanlışı T+3 (15 Soruluk) Doğrulama Testi (PDF Madde 7.3)
 * 15 soruda ≥13 doğru (≥%85) ise dosya kapanır (Yeşil Taburcu); 3 veya daha fazla yanlış çıkarsa ünite Cumartesi Kırmızı Kovaya atılır.
 */
export function evaluateExamT3Verification(
  correct: number,
  total: number = 15,
  testDate: string = getTodayString()
): TriageResult {
  const safeTotal = total > 0 ? total : 15;
  const safeCorrect = Math.max(0, Math.min(correct, safeTotal));
  const wrong = safeTotal - safeCorrect;
  const percentage = Math.round((safeCorrect / safeTotal) * 100);

  // PDF 7.3: 15 soruda ≥13 doğru (veya genel toplamda ≥%85 ve yanlış <= 2) ise dosya kapanır
  const passed = safeTotal === 15 ? safeCorrect >= 13 : percentage >= 85;

  if (passed) {
    return {
      bucket: 'GREEN',
      priority: 'P4_LOW',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis: 'Deneme yanlışı T+3 (15 soruluk) doğrulama testi başarılı! Nokta atışı yama tuttu.',
      recommendedAction: 'Dosya kapandı (Yeşil Kova / Taburcu!). Konu tekrar sırasına girmez.',
      scheduleType: 'DISCHARGED',
      affectsBucket: true,
      recommendedBank: 'Dosya Kapandı (Yeşil Taburcu)'
    };
  } else {
    const saturdayDate = getNextSaturday(testDate);
    return {
      bucket: 'RED',
      priority: 'P1_CRITICAL',
      percentage,
      correct: safeCorrect,
      wrong,
      total: safeTotal,
      clinicalDiagnosis:
        'Deneme yanlışı T+3 doğrulama testinde 3 veya daha fazla yanlış çıktı! Nokta atışı yama yetmedi, ünite şemasında çatlak var.',
      recommendedAction:
        'Ünite komple Cumartesi Kırmızı Kova Onarım Bloğuna (25 dk Boş Kağıt + 2. Bankadan 30 soru) gönderildi.',
      nextScheduledDate: saturdayDate,
      scheduleType: 'SATURDAY_REPAIR',
      affectsBucket: true,
      recommendedBank: '2. Soru Bankası / DUSBANKASI (30 Soru Cumartesi Onarım)'
    };
  }
}

// ----------------- TARİH HESAPLAYICILAR -----------------

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tarihten sonraki en yakın Cumartesi gününü bulur
 * Cumartesi = 6 (JS getUTCDay)
 */
export function getNextSaturday(fromDateStr: string): string {
  const [y, m, d] = fromDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const currentDay = date.getUTCDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  
  // Eğer bugün zaten Cumartesi ise en yakın Cumartesi bugündür;
  // değilse sonraki Cumartesi'ye kaç gün kaldığını hesapla
  let daysToAdd = (6 - currentDay + 7) % 7;
  if (daysToAdd === 0) {
    // Bugün Cumartesi
    daysToAdd = 0;
  }
  
  return addDays(fromDateStr, daysToAdd);
}

export function formatTRDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function isPastOrToday(dateStr: string, todayStr: string = getTodayString()): boolean {
  return dateStr <= todayStr;
}

export function getDaysDiff(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffMs = t2 - t1;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ----------------- BİLDİRİM VE RAPOR MOTORU -----------------

/**
 * Konu listesine ve günün tarihine göre otomatik triyaj bildirimleri üretir
 */
export function generateNotifications(
  topics: TopicUnit[],
  todayStr: string = getTodayString()
): TriageNotification[] {
  const notifications: TriageNotification[] = [];

  // 1. Kırmızı Kova Ünite Sayısı Kontrolü (PDF 8.4: Maksimum 3 Ünite Kuralı)
  const redTopics = topics.filter(t => t.currentBucket === 'RED' && !t.discharged);
  if (redTopics.length >= 3) {
    notifications.push({
      id: `alert-red-limit-${todayStr}`,
      type: 'RED_LIMIT_ALERT',
      title: `🚨 Acil Kırmızı Kova Uyarısı (${redTopics.length} Ünite Yoğun Bakımda!)`,
      message: 'Doktrin Kuralı (Madde 8.4): Kırmızı Kovada 3 veya daha fazla ünite birikti. Sistem tıkanıklığını önlemek için yeni konu çalışması durdurulmalı, Cumartesi Onarımına odaklanılmalıdır!',
      dueDate: todayStr,
      priority: 'P1_CRITICAL',
      bucket: 'RED',
      isRead: false,
      createdAt: todayStr
    });
  }

  // 2. Her ünite için tarihe dayalı bildirimler
  for (const topic of topics) {
    if (topic.discharged) continue;

    // T+3 Gecikmeli Test Günü Bildirimi
    if (topic.status === 'T0_DONE' && topic.t3DueDate) {
      if (topic.t3DueDate <= todayStr) {
        const diff = getDaysDiff(topic.t3DueDate, todayStr);
        const overdueText = diff > 0 ? ` (${diff} gün gecikti!)` : ' (Bugün)';
        notifications.push({
          id: `t3-due-${topic.id}`,
          topicId: topic.id,
          subjectId: topic.subjectId,
          type: 'T3_DUE',
          title: `T+3 Geri Çağırma Testi${overdueText}: ${topic.title}`,
          message: 'Ünitenin kalan 40 sorusunu (1. Soru Bankası) ana konuyu tekrar okumadan doğrudan çözün ve Kova Triyajını tamamlayın.',
          dueDate: topic.t3DueDate,
          priority: 'P3_MEDIUM',
          bucket: 'NONE',
          isRead: false,
          createdAt: todayStr
        });
      }
    }

    // Sarı Kova T+14 Doğrulama Testi
    if (topic.currentBucket === 'YELLOW' && topic.t14DueDate) {
      if (topic.t14DueDate <= todayStr) {
        const diff = getDaysDiff(topic.t14DueDate, todayStr);
        const overdueText = diff > 0 ? ` (${diff} gün gecikti!)` : ' (Bugün)';
        const bankText = topic.promotedFromRed
          ? '3. Soru Bankasından (veya DUSBANKASI)'
          : '2. Soru Bankasından (veya DUSBANKASI)';
        notifications.push({
          id: `t14-due-${topic.id}`,
          topicId: topic.id,
          subjectId: topic.subjectId,
          type: 'T14_DUE',
          title: `🟡 T+14 Sarı Kova Doğrulaması${overdueText}: ${topic.title}`,
          message: `İşaretli/yıldızlı alt başlıklara 5 dk göz atıp ${bankText} 20-25 soru çözün (≥%85 ise Yeşile terfi & taburcu!).`,
          dueDate: topic.t14DueDate,
          priority: 'P2_HIGH',
          bucket: 'YELLOW',
          isRead: false,
          createdAt: todayStr
        });
      }
    }

    // Kırmızı Kova Cumartesi Onarımı
    if (topic.currentBucket === 'RED' && topic.saturdayRepairDate) {
      if (topic.saturdayRepairDate <= todayStr) {
        notifications.push({
          id: `sat-repair-${topic.id}`,
          topicId: topic.id,
          subjectId: topic.subjectId,
          type: 'SATURDAY_REPAIR',
          title: `🔴 Cumartesi Kova Onarım Görevi: ${topic.title}`,
          message:
            'Çöken alt başlıkları 25 dk aktif Boş Kağıt / Kıyas tablosu ile yeniden inşa edin + 2. Soru Bankasından 30 soru çözün (≥%80 ise Sarı Kovaya terfi!).',
          dueDate: topic.saturdayRepairDate,
          priority: 'P1_CRITICAL',
          bucket: 'RED',
          isRead: false,
          createdAt: todayStr
        });
      }
    }
  }

  return notifications;
}

/**
 * 15 Ders ve Konu Havuzu Üzerinden Kapsamlı Kova Triyaj Raporu Oluşturur
 */
export function generateTriageReport(
  subjects: DUSSubject[],
  topics: TopicUnit[],
  todayStr: string = getTodayString()
): KovaTriageReport {
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let pendingCount = 0;

  for (const topic of topics) {
    if (topic.currentBucket === 'GREEN' || topic.discharged) {
      greenCount++;
    } else if (topic.currentBucket === 'YELLOW') {
      yellowCount++;
    } else if (topic.currentBucket === 'RED') {
      redCount++;
    } else {
      pendingCount++;
    }
  }

  const redAlarmActive = redCount >= 3;

  // Ders Bazında Özetler
  const subjectSummaries: SubjectTriageSummary[] = subjects.map(sub => {
    const subTopics = topics.filter(t => t.subjectId === sub.id);
    const totalUnits = subTopics.length;
    const green = subTopics.filter(t => t.currentBucket === 'GREEN' || t.discharged).length;
    const yellow = subTopics.filter(t => t.currentBucket === 'YELLOW').length;
    const red = subTopics.filter(t => t.currentBucket === 'RED').length;
    const pending = subTopics.filter(t => t.currentBucket === 'NONE').length;
    const discharged = subTopics.filter(t => t.discharged || t.currentBucket === 'GREEN').length;

    // Neokortikal Depolama Gücü: Yeşil = 1.0, Sarı = 0.55, Kırmızı = 0.2, Henüz çalışılmamış = 0.0
    const scoreSum = (green * 100) + (yellow * 55) + (red * 20);
    const retentionRate = totalUnits > 0 ? Math.round(scoreSum / totalUnits) : 0;

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      category: sub.category,
      cognitiveGroup: sub.cognitiveGroup,
      totalUnits,
      greenCount: green,
      yellowCount: yellow,
      redCount: red,
      pendingCount: pending,
      dischargedCount: discharged,
      retentionRate,
      questionWeight: sub.questionCount
    };
  });

  // Genel Depolama Gücü İndeksleri
  const temelSubjects = subjectSummaries.filter(s => s.category === 'TEMEL_BILIMLER');
  const klinikSubjects = subjectSummaries.filter(s => s.category === 'KLINIK_BILIMLER');

  const calcWeightedIndex = (list: SubjectTriageSummary[]): number => {
    let totalWeight = 0;
    let weightedScore = 0;
    for (const s of list) {
      totalWeight += s.questionWeight;
      weightedScore += (s.retentionRate * s.questionWeight);
    }
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  };

  const temelRetentionIndex = calcWeightedIndex(temelSubjects);
  const klinikRetentionIndex = calcWeightedIndex(klinikSubjects);
  
  // DUS Toplamında Temel %33.3 (40 soru), Klinik %66.7 (80 soru)
  const overallRetentionIndex = Math.round((temelRetentionIndex * 0.333) + (klinikRetentionIndex * 0.667));

  // Acil Aksiyon Görevleri (Takvim ve Tekrar Kuyruğu ile %100 Senkronize - Yeşil/Taburcu üniteler ASLA girmez!)
  const urgentTasks: KovaTriageReport['urgentTasks'] = [];

  // Kırmızı kova görevleri (Cumartesi onarımları)
  for (const t of topics.filter(
    t => t.currentBucket === 'RED' && !t.discharged && Boolean(t.saturdayRepairDate)
  )) {
    const sub = subjects.find(s => s.id === t.subjectId);
    urgentTasks.push({
      id: `urgent-red-${t.id}`,
      topicId: t.id,
      topicTitle: t.title,
      subjectName: sub?.name || 'Ders',
      bucket: 'RED',
      priority: 'P1_CRITICAL',
      actionType: 'Cumartesi Kova Onarım Bloğu',
      targetDate: t.saturdayRepairDate!,
      instruction: '25 dk aktif Boş Kağıt / Kıyas Tablosu ile şema inşası + 2. Soru Bankasından 30 soru çözümü (≥%80 Sarı Kovaya terfi).'
    });
  }

  // Sarı kova görevleri (T+14 doğrulamaları)
  for (const t of topics.filter(
    t => t.currentBucket === 'YELLOW' && !t.discharged && Boolean(t.t14DueDate)
  )) {
    const sub = subjects.find(s => s.id === t.subjectId);
    const bankName = t.promotedFromRed ? '3. Soru Bankasından' : '2. Soru Bankasından';
    urgentTasks.push({
      id: `urgent-yellow-${t.id}`,
      topicId: t.id,
      topicTitle: t.title,
      subjectName: sub?.name || 'Ders',
      bucket: 'YELLOW',
      priority: 'P2_HIGH',
      actionType: t.promotedFromRed ? 'T+14 Doğrulama (3. Banka)' : 'T+14 Doğrulama (2. Banka)',
      targetDate: t.t14DueDate!,
      instruction: `Yıldızlı yerlere 5 dk göz at + ${bankName} 20-25 soru çöz (≥%85 Yeşile terfi, <%70 Kırmızı Kova).`
    });
  }

  // T+3 Gecikmeli test bekleyenler (Takvimdeki tüm aktif T+3 görevleri — kova rengi henüz T+3'te belirlenecek!)
  for (const t of topics.filter(
    t => t.status === 'T0_DONE' && t.currentBucket === 'NONE' && !t.discharged && Boolean(t.t3DueDate)
  )) {
    const sub = subjects.find(s => s.id === t.subjectId);
    const isDueNow = t.t3DueDate! <= todayStr;
    urgentTasks.push({
      id: `urgent-t3-${t.id}`,
      topicId: t.id,
      topicTitle: t.title,
      subjectName: sub?.name || 'Ders',
      bucket: 'NONE',
      priority: isDueNow ? 'P2_HIGH' : 'P3_MEDIUM',
      actionType: 'T+3 Esas Geri Çağırma Testi (Kova Karar Noktası)',
      targetDate: t.t3DueDate!,
      instruction: 'Konuyu tekrar okumadan 1. Soru Bankasından 40 soruyu çöz: ≥%85 Yeşil (Taburcu), %70-%84 Sarı (T+14), <%70 Kırmızı (Cumartesi).'
    });
  }

  // Sıralama: Önce bugün/gecikenler, sonra kova önceliği (RED -> YELLOW -> NONE), sonra hedef tarih
  urgentTasks.sort((a, b) => {
    const aDue = a.targetDate <= todayStr ? 0 : 1;
    const bDue = b.targetDate <= todayStr ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    const bucketRank = { RED: 0, YELLOW: 1, NONE: 2, GREEN: 3 };
    if (bucketRank[a.bucket] !== bucketRank[b.bucket]) {
      return bucketRank[a.bucket] - bucketRank[b.bucket];
    }
    return a.targetDate.localeCompare(b.targetDate);
  });

  return {
    generatedAt: todayStr,
    totalTopics: topics.length,
    greenBucket: greenCount,
    yellowBucket: yellowCount,
    redBucket: redCount,
    pendingTriage: pendingCount,
    overallRetentionIndex,
    temelRetentionIndex,
    klinikRetentionIndex,
    redAlarmActive,
    urgentTasks,
    subjectSummaries
  };
}
