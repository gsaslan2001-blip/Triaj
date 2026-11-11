import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeepSeekPayload,
  parseDeepSeekResponse,
  getRecommendedMaxTokens,
  DEPLOY_DEEPSEEK_MODEL,
  DEFAULT_DEEPSEEK_MASTER_PROMPT,
  LOCKED_MAX_COMPLETION_TOKENS,
  LOCKED_REASONING_EFFORT,
  LOCKED_IDEAL_TEMPERATURE
} from './deepseek';

test('buildDeepSeekPayload creates valid Deploy.com DeepSeek v4.1 Flash 1017 payload with locked max tokens (32768), max reasoning, and 0.20 temperature', () => {
  const payload = buildDeepSeekPayload({
    taskType: 'TRIAGE_PATCH',
    subjectCode: 'B11',
    subjectName: 'Periodontoloji',
    unitTitle: '5- PERİODONTİTİS',
    bucket: 'YELLOW',
    scoreSummary: '30/40 (%75)',
    userNotes: 'Evre III ve Evre IV karıştı'
  });

  assert.equal(payload.model, DEPLOY_DEEPSEEK_MODEL);
  assert.equal(payload.reasoning_effort, LOCKED_REASONING_EFFORT);
  assert.equal(payload.max_completion_tokens, LOCKED_MAX_COMPLETION_TOKENS);
  assert.equal(payload.temperature, LOCKED_IDEAL_TEMPERATURE);
  assert.equal(payload.cache_preference, 8);
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.messages[0].role, 'system');
  assert.equal(payload.messages[0].content, DEFAULT_DEEPSEEK_MASTER_PROMPT);
  assert.ok(payload.messages[1].content.includes('[B11] Periodontoloji'));
  assert.ok(payload.messages[1].content.includes('5- PERİODONTİTİS'));
  assert.ok(payload.messages[1].content.includes('Evre III ve Evre IV karıştı'));
});

test('buildDeepSeekPayload enforces locked max_completion_tokens (32768), reasoningEffort (max), and temperature (0.20) even when override values are passed', () => {
  assert.equal(getRecommendedMaxTokens('none'), 32768);
  assert.equal(getRecommendedMaxTokens('low'), 32768);
  assert.equal(getRecommendedMaxTokens('high'), 32768);
  assert.equal(getRecommendedMaxTokens('max'), 32768);

  const customAttemptPayload = buildDeepSeekPayload({
    taskType: 'SWSPS_ERROR_AUTOPSY',
    subjectName: 'Protetik Diş Tedavisi',
    unitTitle: 'Kennedy Sınıf I',
    reasoningEffort: 'low',
    maxCompletionTokens: 4096,
    temperature: 0.9,
    topP: 0.9,
    frequencyPenalty: 0.2,
    masterSystemPrompt: 'Özel DUS 2027 Master Sistem Komutu Testi'
  });
  assert.equal(customAttemptPayload.reasoning_effort, 'max');
  assert.equal(customAttemptPayload.max_completion_tokens, 32768);
  assert.equal(customAttemptPayload.temperature, 0.2);
  assert.equal(customAttemptPayload.top_p, 0.9);
  assert.equal(customAttemptPayload.frequency_penalty, 0.2);
  assert.equal(customAttemptPayload.messages[0].content, 'Özel DUS 2027 Master Sistem Komutu Testi');
});

test('parseDeepSeekResponse extracts content, reasoning_content, finishReason, and token usage', () => {
  const rawResponse = {
    id: 'bf7eb425-c8ee-11f1-bc46-67542ee84316',
    object: 'chat.completion',
    created: 1792106317,
    model: 'deepseek-ai/deepseek-v4.1-flash-1017',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: '{{c1::EBV}} virüsü B lenfositlerde {{c2::CD21}} reseptörüne bağlanır.',
          reasoning_content: 'Selecting highest-yield DUS receptor match.'
        },
        finish_reason: 'stop',
        logprobs: null
      }
    ],
    usage: {
      prompt_tokens: 42,
      completion_tokens: 78,
      total_tokens: 120,
      prompt_tokens_details: { cached_tokens: 16 },
      completion_tokens_details: { reasoning_tokens: 20 }
    }
  };

  const parsed = parseDeepSeekResponse(rawResponse);
  assert.equal(parsed.id, 'bf7eb425-c8ee-11f1-bc46-67542ee84316');
  assert.equal(
    parsed.content,
    '{{c1::EBV}} virüsü B lenfositlerde {{c2::CD21}} reseptörüne bağlanır.'
  );
  assert.equal(parsed.reasoningContent, 'Selecting highest-yield DUS receptor match.');
  assert.equal(parsed.finishReason, 'stop');
  assert.equal(parsed.usage.totalTokens, 120);
  assert.equal(parsed.usage.reasoningTokens, 20);
  assert.equal(parsed.usage.cachedTokens, 16);
});
