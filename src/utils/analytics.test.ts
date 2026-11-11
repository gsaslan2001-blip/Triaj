import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSWSPS,
  calculateSWSPSBreakdown,
  evaluateMockExam,
  calculateQuestionLogMetrics,
  getCalendarHeatmapStyle,
  calculateTopicDelayDays,
  getDelayHeatmapStyle,
  getTopicNextTargetDate,
  checkDuplicateAuditLog,
  CANONICAL_16_BRANCHES
} from './analytics';
import { CanonicalBranchCode, TopicUnit, TriageRecord } from '../types/dus';

describe('Excel-to-App Mimari Kılavuzu Hesaplama Motoru Testleri', () => {
  it('SWSPS Bilişsel Ceza Skoru: Çeldirici hatası ve düşük FSRS kalıcılığı daha yüksek ceza puanı üretir', () => {
    const highRiskScore = calculateSWSPS({
      errorType: 'Çeldirici', // 1.4
      repeatCount: 3,
      difficultyD: 8.5,
      fsrsRetrievabilityR: 65, // %65
      daysElapsed: 2 // taze hata
    });

    const lowRiskScore = calculateSWSPS({
      errorType: 'Dikkat', // 0.8
      repeatCount: 1,
      difficultyD: 3.0,
      fsrsRetrievabilityR: 92, // %92
      daysElapsed: 20 // 14 günü geçmiş
    });

    assert.ok(highRiskScore > lowRiskScore, `Beklenen: ${highRiskScore} > ${lowRiskScore}`);
    assert.ok(highRiskScore > 30);
    assert.ok(lowRiskScore < 5);
  });

  it('SWSPS v2.0: Kırmızı Kova (1.35x), 10 Soruluk Klinik Branş (1.15x) ve Anki Sönümlemesi (0.60x) doğru çalışır', () => {
    const unmitigatedRed = calculateSWSPSBreakdown({
      errorType: 'Çeldirici',
      repeatCount: 2,
      difficultyD: 8.0,
      fsrsRetrievabilityR: 70,
      daysElapsed: 1,
      bucket: 'RED',
      branchCode: 'B09', // 10 soru -> 1.15x
      ankiClozeStatus: 'Bekliyor' // 1.00x
    });

    const mitigatedAnki = calculateSWSPSBreakdown({
      errorType: 'Çeldirici',
      repeatCount: 2,
      difficultyD: 8.0,
      fsrsRetrievabilityR: 70,
      daysElapsed: 1,
      bucket: 'RED',
      branchCode: 'B09',
      ankiClozeStatus: 'Eklendi' // 0.60x (-%40)
    });

    assert.equal(unmitigatedRed.bucketMultiplier, 1.35);
    assert.equal(unmitigatedRed.branchMultiplier, 1.15);
    assert.equal(unmitigatedRed.mitigationMultiplier, 1.0);
    assert.equal(unmitigatedRed.tier, 'KRITIK_BLOKAJ');
    assert.equal(mitigatedAnki.mitigationMultiplier, 0.6);
    assert.equal(
      mitigatedAnki.finalScore,
      Number((unmitigatedRed.rawBaseScore * 1.35 * 1.15 * 0.6).toFixed(2))
    );
    assert.ok(mitigatedAnki.finalScore < unmitigatedRed.finalScore);
  });

  it('Deneme_Analiz: 16 Branş netlerini Temel (<=40), Klinik (<=80), Toplam (<=120) ve ADÇC ELİT statüsüyle hesaplar', () => {
    const branchNets = {} as Record<CanonicalBranchCode, number>;
    for (const b of CANONICAL_16_BRANCHES) {
      branchNets[b.code] = b.questionCount * 0.9; // %90 başarı -> 108.0 net
    }

    const result = evaluateMockExam('DENEME-01', '2026-04-08', 'DUSDATA Türkiye Geneli', branchNets, 108.0, 100.0);
    assert.equal(result.basicNet, 36);
    assert.equal(result.clinicalNet, 72);
    assert.equal(result.totalNet, 108);
    assert.equal(result.targetDiff, 0);
    assert.equal(result.adccStatus, 'ELİT');
  });

  it('Gunluk_Log: Net = D - Y*0.25 ve Soru Başı Hız (sn/soru) formüllerini doğru hesaplar', () => {
    const metrics = calculateQuestionLogMetrics(36, 4, 0, 35); // 40 soru, 35 dk
    assert.equal(metrics.totalQuestions, 40);
    assert.equal(metrics.net, 35);
    assert.equal(metrics.accuracyPercent, 90);
    assert.equal(metrics.speedSecondsPerQuestion, 52.5);
    assert.equal(metrics.paceVerdict, 'İDEAL TEMPO (50-60 sn)');
  });

  it('Tekrar_Takvimi 5 Kademeli Yoğunluk Isı Haritası doğru HEX kodlarını döndürür', () => {
    assert.equal(getCalendarHeatmapStyle(0).bgHex, '#FFFFFF');
    assert.equal(getCalendarHeatmapStyle(1).bgHex, '#DCFCE7');
    assert.equal(getCalendarHeatmapStyle(2).bgHex, '#D9F99D');
    assert.equal(getCalendarHeatmapStyle(3).bgHex, '#FEF08A');
    assert.equal(getCalendarHeatmapStyle(4).bgHex, '#FED7AA');
    assert.equal(getCalendarHeatmapStyle(6).bgHex, '#FECACA');
  });

  it('Konu_Takip_Matrisi Gecikme Günü ve 3 Renkli Isı Haritası doğru çalışır', () => {
    const sampleTopic: TopicUnit = {
      id: 't1',
      subjectId: 'B01',
      unitNumber: 1,
      title: 'Kemikler',
      subtopics: [],
      status: 'T0_DONE',
      currentBucket: 'NONE',
      priority: 'P3_MEDIUM',
      t3DueDate: '2026-04-01',
      discharged: false,
      createdAt: '2026-03-29',
      updatedAt: '2026-03-29'
    };

    const delay = calculateTopicDelayDays(sampleTopic, '2026-04-10');
    assert.equal(delay, 9);
    assert.equal(getDelayHeatmapStyle(delay).bgHex, '#FCA5A5');
    assert.equal(getDelayHeatmapStyle(0).bgHex, '#A7F3D0');
    assert.equal(getDelayHeatmapStyle(4).bgHex, '#FDE68A');
  });

  it('Tekrar_Kaydi aynı gün aynı konuya ikinci kayıtta mükerrer uyarısı döndürür', () => {
    const existing: TriageRecord[] = [
      {
        id: 'log-1',
        topicId: 'unit-b01-01',
        subjectId: 'B01',
        topicTitle: 'Kemikler',
        subjectName: 'Anatomi',
        date: '2026-04-08',
        stage: 'T3_MAIN',
        correct: 35,
        wrong: 5,
        empty: 0,
        total: 40,
        percentage: 88,
        resultingBucket: 'GREEN',
        resultingPriority: 'P4_LOW',
        clinicalDiagnosis: 'Sağlam',
        recommendedAction: 'Taburcu'
      }
    ];

    assert.equal(
      checkDuplicateAuditLog(existing, 'unit-b01-01', '2026-04-08'),
      'Girişi kontrol et / Mükerrer'
    );
    assert.equal(
      checkDuplicateAuditLog(existing, 'unit-b01-01', '2026-04-09'),
      'Geçerli'
    );
  });

  it('Planlı Görevi Sil: Ünite silinmeden yalnızca t3DueDate / t14DueDate / saturdayRepairDate temizlendiğinde takvim hedefi kalkar', () => {
    const scheduledTopic: TopicUnit = {
      id: 'unit-b04-01',
      topicCode: 'K0039',
      subjectId: 'B04',
      unitNumber: 1,
      title: 'BÖLÜM 1 - KARBONHİDRATLAR',
      subtopics: [],
      status: 'T0_DONE',
      currentBucket: 'NONE',
      priority: 'P3_MEDIUM',
      t0Date: '2026-11-07',
      t3DueDate: '2026-11-10',
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-07'
    };

    assert.equal(getTopicNextTargetDate(scheduledTopic), '2026-11-10');

    const clearedTaskTopic: TopicUnit = {
      ...scheduledTopic,
      status: 'NOT_STARTED',
      t3DueDate: undefined,
      t14DueDate: undefined,
      saturdayRepairDate: undefined
    };

    assert.equal(getTopicNextTargetDate(clearedTaskTopic), undefined);
    assert.equal(clearedTaskTopic.id, 'unit-b04-01');
    assert.equal(clearedTaskTopic.title, 'BÖLÜM 1 - KARBONHİDRATLAR');
  });
});
