import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  TopicUnit,
  TriageRecord,
  DailyGoal,
  MockExamRecord,
  SemanticErrorRecord,
  DailyStudyQuestionLog,
  TopicTaxonomyItem,
  AnkiFsrsSnapshot,
  SystemParameters
} from '../types/dus';
import { INITIAL_TOPIC_UNITS } from '../data/dusDatabase';
import {
  INITIAL_ANKI_FSRS_SNAPSHOT,
  INITIAL_SYSTEM_PARAMETERS
} from '../data/excelMasterSeed';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface CloudWorkspaceSnapshot {
  studyDate: string;
  streakDays: number;
  topics: TopicUnit[];
  triageLogs: TriageRecord[];
  dailyGoal: DailyGoal;
  mockExams: MockExamRecord[];
  semanticErrors: SemanticErrorRecord[];
  questionLogs: DailyStudyQuestionLog[];
  topicTaxonomy: TopicTaxonomyItem[];
  ankiSnapshot: AnkiFsrsSnapshot;
  systemParams: SystemParameters;
  updatedAtIso?: string;
}

/**
 * Firestore 'undefined' alanları kabul etmediği için nesneleri derinlemesine temizler.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function arrayToOrderedMap<T extends { id?: string }>(
  items: T[],
  fallbackPrefix: string
): Record<string, T & { _order: number }> {
  const map: Record<string, T & { _order: number }> = {};
  items.forEach((item, index) => {
    const rawKey = item.id || `${fallbackPrefix}_${index}`;
    const safeKey =
      String(rawKey).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 96) ||
      `${fallbackPrefix}_${index}`;
    map[safeKey] = stripUndefined({
      ...item,
      _order: index
    });
  });
  return map;
}

function orderedMapToArray<T>(mapObj: unknown): T[] {
  if (!mapObj || typeof mapObj !== 'object' || Array.isArray(mapObj)) {
    return [];
  }
  const entries = Object.values(mapObj as Record<string, T & { _order?: number }>);
  return entries
    .sort(
      (a, b) =>
        (typeof a._order === 'number' ? a._order : 0) -
        (typeof b._order === 'number' ? b._order : 0)
    )
    .map(entry => {
      const clone = { ...(entry as Record<string, unknown>) };
      delete clone._order;
      return clone as T;
    });
}

const seedTopicIds = new Set(INITIAL_TOPIC_UNITS.map(t => t.id));

function isTopicModifiedFromDefault(topic: TopicUnit): boolean {
  if (!seedTopicIds.has(topic.id)) return true;
  return Boolean(
    topic.status !== 'NOT_STARTED' ||
      topic.currentBucket !== 'NONE' ||
      topic.discharged ||
      topic.t0Date ||
      topic.t3DueDate ||
      topic.t14DueDate ||
      topic.saturdayRepairDate ||
      topic.t0Score !== undefined ||
      topic.t3Score !== undefined ||
      topic.t14Score !== undefined ||
      topic.repairScore !== undefined ||
      topic.clinicalNotes
  );
}

export function buildFirestoreStateMap(
  snapshot: CloudWorkspaceSnapshot
): Record<string, unknown> {
  const activeTopics = snapshot.topics.filter(isTopicModifiedFromDefault);
  const currentTopicIds = new Set(snapshot.topics.map(t => t.id));
  const deletedSeedTopicIds = INITIAL_TOPIC_UNITS.filter(
    t => !currentTopicIds.has(t.id)
  ).map(t => t.id);

  const deletedMap: Record<string, boolean> = {};
  for (const delId of deletedSeedTopicIds) {
    deletedMap[delId] = true;
  }

  return {
    topicsDeltaById: arrayToOrderedMap(activeTopics, 'topic'),
    deletedSeedTopicsById: deletedMap,
    triageLogsById: arrayToOrderedMap(snapshot.triageLogs, 'log'),
    mockExamsById: arrayToOrderedMap(snapshot.mockExams, 'exam'),
    semanticErrorsById: arrayToOrderedMap(snapshot.semanticErrors, 'err'),
    questionLogsById: arrayToOrderedMap(snapshot.questionLogs, 'qlog'),
    topicTaxonomyById: arrayToOrderedMap(snapshot.topicTaxonomy, 'tax'),
    dailyGoal: stripUndefined({
      ...snapshot.dailyGoal,
      checklistById: arrayToOrderedMap(snapshot.dailyGoal.checklist || [], 'chk'),
      checklist: undefined
    }),
    ankiSnapshot: stripUndefined(snapshot.ankiSnapshot),
    systemParams: stripUndefined(snapshot.systemParams)
  };
}

export function parseFirestoreWorkspaceDoc(
  data: Record<string, unknown>,
  fallbackTodayStr: string
): CloudWorkspaceSnapshot | null {
  const stateMap = data.stateMap as Record<string, unknown> | undefined;
  if (!stateMap || typeof stateMap !== 'object') {
    return null;
  }

  const updatedAtField = data.updatedAt as Timestamp | undefined;
  const updatedAtIso =
    updatedAtField && typeof updatedAtField.toDate === 'function'
      ? updatedAtField.toDate().toISOString()
      : undefined;

  const deltaTopics = orderedMapToArray<TopicUnit>(stateMap.topicsDeltaById);
  const deltaById = new Map(deltaTopics.map(t => [t.id, t]));
  const deletedSeedMap =
    (stateMap.deletedSeedTopicsById as Record<string, boolean> | undefined) || {};

  // Merge deltaTopics onto INITIAL_TOPIC_UNITS + append any custom topics
  const mergedTopics: TopicUnit[] = [];
  for (const seedTopic of INITIAL_TOPIC_UNITS) {
    if (deletedSeedMap[seedTopic.id]) continue;
    const override = deltaById.get(seedTopic.id);
    if (override) {
      mergedTopics.push({
        ...seedTopic,
        ...override
      });
      deltaById.delete(seedTopic.id);
    } else {
      mergedTopics.push(seedTopic);
    }
  }
  for (const customTopic of deltaById.values()) {
    mergedTopics.push(customTopic);
  }

  const rawGoal = (stateMap.dailyGoal as Record<string, unknown> | undefined) || {};
  const checklist = orderedMapToArray<DailyGoal['checklist'][number]>(
    rawGoal.checklistById
  );

  const dailyGoal: DailyGoal = {
    date: typeof rawGoal.date === 'string' ? rawGoal.date : fallbackTodayStr,
    targetStudyMinutes:
      typeof rawGoal.targetStudyMinutes === 'number' ? rawGoal.targetStudyMinutes : 360,
    completedStudyMinutes:
      typeof rawGoal.completedStudyMinutes === 'number'
        ? rawGoal.completedStudyMinutes
        : 120,
    targetQuestions:
      typeof rawGoal.targetQuestions === 'number' ? rawGoal.targetQuestions : 100,
    completedQuestions:
      typeof rawGoal.completedQuestions === 'number' ? rawGoal.completedQuestions : 50,
    block1Done: Boolean(rawGoal.block1Done),
    block2Done: Boolean(rawGoal.block2Done),
    block3Done: Boolean(rawGoal.block3Done),
    block4Done: Boolean(rawGoal.block4Done),
    checklist,
    notes: typeof rawGoal.notes === 'string' ? rawGoal.notes : ''
  };

  return {
    studyDate: typeof data.studyDate === 'string' ? data.studyDate : fallbackTodayStr,
    streakDays: typeof data.streakDays === 'number' ? data.streakDays : 14,
    topics: mergedTopics,
    triageLogs: orderedMapToArray<TriageRecord>(stateMap.triageLogsById),
    dailyGoal,
    mockExams: orderedMapToArray<MockExamRecord>(stateMap.mockExamsById),
    semanticErrors: orderedMapToArray<SemanticErrorRecord>(stateMap.semanticErrorsById),
    questionLogs: orderedMapToArray<DailyStudyQuestionLog>(stateMap.questionLogsById),
    topicTaxonomy: orderedMapToArray<TopicTaxonomyItem>(stateMap.topicTaxonomyById),
    ankiSnapshot:
      (stateMap.ankiSnapshot as AnkiFsrsSnapshot | undefined) ||
      INITIAL_ANKI_FSRS_SNAPSHOT,
    systemParams:
      (stateMap.systemParams as SystemParameters | undefined) ||
      INITIAL_SYSTEM_PARAMETERS,
    updatedAtIso
  };
}

export async function saveCloudWorkspace(
  userId: string,
  snapshot: CloudWorkspaceSnapshot,
  isExistingDoc: boolean
): Promise<void> {
  const path = `workspaces/${userId}`;
  const docRef = doc(db, 'workspaces', userId);
  const stateMap = buildFirestoreStateMap(snapshot);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(snapshot.studyDate)
    ? snapshot.studyDate
    : '2026-11-11';

  try {
    if (!isExistingDoc) {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        await setDoc(docRef, {
          ownerId: userId,
          schemaVersion: 2,
          studyDate: validDate,
          streakDays: Math.max(0, Math.min(3650, Math.round(snapshot.streakDays || 0))),
          stateMap,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return;
      }
      const existingData = existingSnap.data();
      await setDoc(docRef, {
        ownerId: userId,
        schemaVersion: 2,
        studyDate: validDate,
        streakDays: Math.max(0, Math.min(3650, Math.round(snapshot.streakDays || 0))),
        stateMap,
        createdAt: existingData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return;
    }

    const existingSnap = await getDoc(docRef);
    const createdAtVal = existingSnap.exists()
      ? existingSnap.data().createdAt
      : serverTimestamp();

    await setDoc(docRef, {
      ownerId: userId,
      schemaVersion: 2,
      studyDate: validDate,
      streakDays: Math.max(0, Math.min(3650, Math.round(snapshot.streakDays || 0))),
      stateMap,
      createdAt: createdAtVal,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(
      error,
      isExistingDoc ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function signInWithGoogleCloud(): Promise<User> {
  const credential = await signInWithPopup(auth, googleAuthProvider);
  return credential.user;
}

export async function signOutFromCloud(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, doc, getDoc, setDoc, onSnapshot };
export type { User };
