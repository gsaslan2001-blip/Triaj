import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateT0Calibration,
  evaluateT3Triage,
  evaluateT14Verification,
  evaluateSaturdayRepair,
  evaluateExamT3Verification,
  addDays,
  getNextSaturday,
  generateNotifications,
  generateTriageReport
} from './triage';
import { DUSSubject, TopicUnit } from '../types/dus';
import { CANONICAL_DUS_SUBJECTS, INITIAL_TOPIC_UNITS } from '../data/dusDatabase';

test('T+0 Calibration (20 questions) never determines a bucket regardless of score and strictly locks T+3', () => {
  const lowScore = evaluateT0Calibration(5, 20, '2026-11-10');
  assert.equal(lowScore.bucket, 'NONE');
  assert.equal(lowScore.affectsBucket, false);
  assert.equal(lowScore.scheduleType, 'T3_LOCKED');
  assert.equal(lowScore.nextScheduledDate, '2026-11-13');

  const highScore = evaluateT0Calibration(20, 20, '2026-11-10');
  assert.equal(highScore.bucket, 'NONE');
  assert.equal(highScore.affectsBucket, false);
  assert.equal(highScore.scheduleType, 'T3_LOCKED');
  assert.equal(highScore.nextScheduledDate, '2026-11-13');
});

test('T+3 Triage correctly assigns GREEN bucket for >= 85% (34-40 correct) and permanently discharges the topic', () => {
  const result = evaluateT3Triage(35, 40, '2026-11-10');
  assert.equal(result.bucket, 'GREEN');
  assert.equal(result.priority, 'P4_LOW');
  assert.equal(result.percentage, 88);
  assert.equal(result.scheduleType, 'DISCHARGED');
  assert.equal(result.nextScheduledDate, undefined);
});

test('T+3 Triage correctly assigns YELLOW bucket for 70%-84% (28-33 correct) and schedules T+14 from 2nd Question Bank', () => {
  const result = evaluateT3Triage(30, 40, '2026-11-10');
  assert.equal(result.bucket, 'YELLOW');
  assert.equal(result.priority, 'P2_HIGH');
  assert.equal(result.percentage, 75);
  assert.equal(result.scheduleType, 'T14_VERIFICATION');
  assert.ok(result.recommendedBank?.includes('2. Soru Bankası'));
  // 2026-11-10 + 14 days = 2026-11-24
  assert.equal(result.nextScheduledDate, '2026-11-24');
});

test('T+3 Triage correctly assigns RED bucket for < 70% (<= 27 correct) and schedules Saturday repair', () => {
  const result = evaluateT3Triage(24, 40, '2026-11-10'); // 2026-11-10 is Tuesday
  assert.equal(result.bucket, 'RED');
  assert.equal(result.priority, 'P1_CRITICAL');
  assert.equal(result.percentage, 60);
  assert.equal(result.scheduleType, 'SATURDAY_REPAIR');
  // 2026-11-10 Tuesday -> upcoming Saturday is 2026-11-14
  assert.equal(result.nextScheduledDate, '2026-11-14');
});

test('T+14 Verification promotes to GREEN on >= 85%', () => {
  const result = evaluateT14Verification(18, 20, '2026-11-24'); // 90%
  assert.equal(result.bucket, 'GREEN');
  assert.equal(result.scheduleType, 'DISCHARGED');
});

test('T+14 Verification demotes to RED on < 70%', () => {
  const result = evaluateT14Verification(12, 20, '2026-11-24'); // 60%
  assert.equal(result.bucket, 'RED');
  assert.equal(result.scheduleType, 'SATURDAY_REPAIR');
});

test('Saturday Repair promotes to YELLOW on >= 80% and schedules T+14 from 3rd Question Bank', () => {
  const result = evaluateSaturdayRepair(25, 30, '2026-11-14'); // ~83%
  assert.equal(result.bucket, 'YELLOW');
  assert.equal(result.scheduleType, 'T14_VERIFICATION');
  assert.equal(result.nextScheduledDate, '2026-11-28');
  assert.ok(result.recommendedBank?.includes('3. Soru Bankası'));
});

test('Saturday Repair stays RED on < 80%', () => {
  const result = evaluateSaturdayRepair(20, 30, '2026-11-14'); // ~67%
  assert.equal(result.bucket, 'RED');
  assert.equal(result.scheduleType, 'SATURDAY_REPAIR');
  // Next Saturday from Saturday 2026-11-14 is 2026-11-21
  assert.equal(result.nextScheduledDate, '2026-11-21');
});

test('Exam T+3 Verification (15 questions, PDF 7.3) discharges on >= 13 correct and sends to Saturday RED on >= 3 wrong', () => {
  const passResult = evaluateExamT3Verification(13, 15, '2026-11-10');
  assert.equal(passResult.bucket, 'GREEN');
  assert.equal(passResult.scheduleType, 'DISCHARGED');

  const failResult = evaluateExamT3Verification(12, 15, '2026-11-10'); // 3 wrong
  assert.equal(failResult.bucket, 'RED');
  assert.equal(failResult.scheduleType, 'SATURDAY_REPAIR');
  assert.equal(failResult.nextScheduledDate, '2026-11-14');
});

test('Date helper addDays works reliably across month bounds', () => {
  assert.equal(addDays('2026-11-10', 3), '2026-11-13');
  assert.equal(addDays('2026-11-25', 10), '2026-12-05');
  assert.equal(addDays('2026-12-25', 10), '2027-01-04');
});

test('getNextSaturday correctly finds Saturday', () => {
  // 2026-11-10 is Tuesday -> Saturday is 2026-11-14
  assert.equal(getNextSaturday('2026-11-10'), '2026-11-14');
  // 2026-11-14 is already Saturday
  assert.equal(getNextSaturday('2026-11-14'), '2026-11-14');
  // 2026-11-15 is Sunday -> Next Saturday is 2026-11-21
  assert.equal(getNextSaturday('2026-11-15'), '2026-11-21');
});

test('generateNotifications triggers RED_LIMIT_ALERT when 3 or more topics are RED', () => {
  const mockTopics: TopicUnit[] = [
    {
      id: 't1',
      subjectId: 'B01',
      unitNumber: 1,
      title: 'Kafatası Kemikleri',
      subtopics: [],
      status: 'TRIAGED',
      currentBucket: 'RED',
      priority: 'P1_CRITICAL',
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01'
    },
    {
      id: 't2',
      subjectId: 'B02',
      unitNumber: 1,
      title: 'Epitel Dokusu',
      subtopics: [],
      status: 'TRIAGED',
      currentBucket: 'RED',
      priority: 'P1_CRITICAL',
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01'
    },
    {
      id: 't3',
      subjectId: 'B03',
      unitNumber: 1,
      title: 'Aksiyon Potansiyeli',
      subtopics: [],
      status: 'TRIAGED',
      currentBucket: 'RED',
      priority: 'P1_CRITICAL',
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01'
    }
  ];

  const notifications = generateNotifications(mockTopics, '2026-11-10');
  const alert = notifications.find(n => n.type === 'RED_LIMIT_ALERT');
  assert.ok(alert, 'Should trigger RED_LIMIT_ALERT');
  assert.equal(alert?.priority, 'P1_CRITICAL');
});

test('generateTriageReport calculates accurate metrics and overall retention index', () => {
  const mockSubjects: DUSSubject[] = [
    {
      id: 'B01',
      code: 'B01',
      name: 'Anatomi',
      category: 'TEMEL_BILIMLER',
      cognitiveGroup: 'GRUP_A',
      questionCount: 6,
      weightPercentage: 5,
      description: 'Test',
      protocol: {
        cognitiveCharacteristics: '',
        t0Method: '',
        t3Method: '',
        questionBankUsage: '',
        ankiProtocol: ''
      },
      colorTheme: 'blue',
      iconName: 'Brain'
    },
    {
      id: 'B09',
      code: 'B09',
      name: 'Protetik Diş Tedavisi',
      category: 'KLINIK_BILIMLER',
      cognitiveGroup: 'GRUP_C',
      questionCount: 10,
      weightPercentage: 8.33,
      description: 'Test',
      protocol: {
        cognitiveCharacteristics: '',
        t0Method: '',
        t3Method: '',
        questionBankUsage: '',
        ankiProtocol: ''
      },
      colorTheme: 'amber',
      iconName: 'Activity'
    }
  ];

  const mockTopics: TopicUnit[] = [
    {
      id: 't1',
      subjectId: 'B01',
      unitNumber: 1,
      title: 'Kafatası',
      subtopics: [],
      status: 'DISCHARGED',
      currentBucket: 'GREEN',
      priority: 'P4_LOW',
      discharged: true,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01'
    },
    {
      id: 't2',
      subjectId: 'B09',
      unitNumber: 1,
      title: 'Sabit Protezler',
      subtopics: [],
      status: 'TRIAGED',
      currentBucket: 'YELLOW',
      priority: 'P2_HIGH',
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01'
    }
  ];

  const report = generateTriageReport(mockSubjects, mockTopics, '2026-11-10');
  assert.equal(report.totalTopics, 2);
  assert.equal(report.greenBucket, 1);
  assert.equal(report.yellowBucket, 1);
  assert.equal(report.redBucket, 0);
  assert.equal(report.redAlarmActive, false);
  assert.ok(report.overallRetentionIndex > 0);
});

test('UNITS.md curriculum database contains 14 canonical blocks and 227 consolidated units (72 Temel + 155 Klinik)', () => {
  assert.equal(CANONICAL_DUS_SUBJECTS.length, 14);
  assert.equal(INITIAL_TOPIC_UNITS.length, 227);

  const temelIds = new Set(
    CANONICAL_DUS_SUBJECTS.filter(s => s.category === 'TEMEL_BILIMLER').map(s => s.id)
  );
  const klinikIds = new Set(
    CANONICAL_DUS_SUBJECTS.filter(s => s.category === 'KLINIK_BILIMLER').map(s => s.id)
  );

  const temelUnits = INITIAL_TOPIC_UNITS.filter(u => temelIds.has(u.subjectId));
  const klinikUnits = INITIAL_TOPIC_UNITS.filter(u => klinikIds.has(u.subjectId));

  assert.equal(temelUnits.length, 72);
  assert.equal(klinikUnits.length, 155);
});

test('Clearing a scheduled task removes it from Triage Report urgentTasks and bucket counts while preserving total curriculum units', () => {
  const mockTopics: TopicUnit[] = [
    {
      id: 'unit-b14-05',
      subjectId: 'B14',
      unitNumber: 5,
      title: 'İmplantolojide Cerrahi Prensipler',
      subtopics: [],
      status: 'TRIAGED',
      currentBucket: 'RED',
      priority: 'P1_CRITICAL',
      t0Date: '2026-11-05',
      saturdayRepairDate: '2026-11-14',
      t3Score: { correct: 22, wrong: 18, total: 40, percentage: 55, date: '2026-11-08' },
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-08'
    },
    {
      id: 'unit-b16-10',
      subjectId: 'B16',
      unitNumber: 10,
      title: 'Kök Kanal İrrigasyonu',
      subtopics: [],
      status: 'TRIAGED',
      currentBucket: 'YELLOW',
      priority: 'P2_HIGH',
      t0Date: '2026-11-06',
      t14DueDate: '2026-11-23',
      t3Score: { correct: 31, wrong: 9, total: 40, percentage: 78, date: '2026-11-09' },
      discharged: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-09'
    }
  ];

  const initialReport = generateTriageReport(CANONICAL_DUS_SUBJECTS, mockTopics, '2026-11-10');
  assert.equal(initialReport.totalTopics, 2);
  assert.equal(initialReport.redBucket, 1);
  assert.equal(initialReport.yellowBucket, 1);
  assert.equal(initialReport.urgentTasks.length, 2);

  // Simulate clearTopicScheduledTask('unit-b14-05')
  const afterClearTopics: TopicUnit[] = mockTopics.map(t =>
    t.id === 'unit-b14-05'
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
          t3Score: undefined
        }
      : t
  );

  const updatedReport = generateTriageReport(CANONICAL_DUS_SUBJECTS, afterClearTopics, '2026-11-10');
  assert.equal(updatedReport.totalTopics, 2, 'Unit must remain in curriculum');
  assert.equal(updatedReport.redBucket, 0, 'Red bucket count must immediately drop to 0');
  assert.equal(updatedReport.yellowBucket, 1);
  assert.equal(updatedReport.urgentTasks.length, 1, 'Task must be removed from Triage Report urgentTasks');
  assert.equal(updatedReport.urgentTasks[0].topicId, 'unit-b16-10');
});


