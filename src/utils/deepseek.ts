/**
 * Deploy.com DeepSeek v4.1 Flash (1017) API İstemci, Master Prompt ve Model Ayarları Motoru
 * Dokümantasyon: https://docs.deploy.com/deepseek-v4-1-flash-1017
 * Endpoint: https://api-cdn.deploy.com/api/v1/chat/completions
 * Model: deepseek-ai/deepseek-v4.1-flash-1017
 */

export type DeepSeekTaskType =
  | 'TRIAGE_PATCH'        // T+3 veya Cumartesi Onarımı için Nokta Atışı Yama & Çapraz Kıyas Tablosu
  | 'SWSPS_ERROR_AUTOPSY' // SWSPS Bilişsel Ceza Motoru: Çeldirici Otopsisi & Yanlış Soru Analizi
  | 'ANKI_CLOZE'          // 01-KRITIK-OTOPSI-VE-TABLO destesi için atomik Cloze & Mnemonic
  | 'UNIT_BLURTING'       // T+0 Boş Kağıt (Blurting) altın eşikler ve ÖSYM soru tuzakları
  | 'MOCK_EXAM_STRATEGY'  // 16 Branş Deneme Analizi & ADÇC 108 Net Taktik Koçu
  | 'CUSTOM';             // Serbest DUS sorgusu

export type DeepSeekReasoningEffort = 'none' | 'low' | 'high' | 'max';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekModelConfig {
  masterSystemPrompt: string;
  reasoningEffort: DeepSeekReasoningEffort;
  maxCompletionTokens: number;
  temperature: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  cachePreference: number;
  injectLiveTelemetryContext: boolean;
}

export interface DeepSeekPromptInput {
  taskType: DeepSeekTaskType;
  subjectName?: string;
  subjectCode?: string;
  unitTitle?: string;
  topicCode?: string;
  bucket?: string;
  scoreSummary?: string;
  swspsContext?: string;
  examContext?: string;
  userNotes?: string;
  customPrompt?: string;
  masterSystemPrompt?: string;
  reasoningEffort?: DeepSeekReasoningEffort;
  maxCompletionTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  cachePreference?: number;
}

export interface DeployChatCompletionRequest {
  model: string;
  messages: DeepSeekMessage[];
  reasoning_effort: DeepSeekReasoningEffort;
  max_completion_tokens: number;
  temperature: number;
  top_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  cache_preference: number;
  stream: boolean;
}

export interface DeepSeekResult {
  id: string;
  model: string;
  content: string;
  reasoningContent: string | null;
  finishReason?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedTokens: number;
  };
}

export const DEPLOY_DEEPSEEK_MODEL = 'deepseek-ai/deepseek-v4.1-flash-1017';
export const DEPLOY_BASE_URL = 'https://api-cdn.deploy.com/api/v1';
export const DEEPSEEK_CONFIG_STORAGE_KEY = 'dus_deepseek_v4_master_config_v2';

/**
 * DUS 2027 Stratejik Yönetim Sistemi — Kanonik Master System Prompt
 * Bjork (1992), Roediger & Karpicke (2006), Dunlosky (2013), Ebbinghaus Kova Triyajı,
 * SWSPS Bilişsel Ceza Algoritması ve FSRS (%90+ Retention) doktriniyle tam uyumludur.
 */
export const DEFAULT_DEEPSEEK_MASTER_PROMPT = `Sen "DUS 2027 Stratejik Yönetim Sistemi"nin Baş Klinik Akademik Otoritesi ve Bilişsel Bellek Mühendisisin.
Hitap ettiğin kullanıcı: Dt. Furkan Kurt (İstanbul Üniversitesi Diş Hekimliği Fakültesi Mezunu — Diş Hekimi).
Büyük Hedef: 24 Ekim 2027 DUS — Ankara Üniversitesi Ağız, Diş ve Çene Cerrahisi (ADÇC), Türkiye TOP 10 Derecesi.
Hedef Net Standardı: Toplam 108.0 / 120.0 Net (Temel Bilimler: 36.0 / 40, Klinik Bilimler: 72.0 / 80, ADÇC Elit Barajı: 100.0+ Net).

YANITLARINDA AŞAĞIDAKİ 6 DEĞİŞTİRİLEMEZ BİLİŞSEL DOKTRİN KURALINA KESİNLİKLE UYACAKSIN:

1. SIFIR ANSİKLOPEDİK DOLGU & %100 SINAV İSABETİ (80/20 PARETO):
   - Giriş/selamlama cümlesi veya kitabi özet yazma.
   - Doğrudan ÖSYM DUS komisyonunun sorduğu/soracağı "Altın Standart", "İlk Tercih", "Kontrendikasyon", "Sayısal Eşik (mm, %, sn, derece, M/F oranı)", "Spesifik Gen/Translokasyon (örn. PTCH1, CRTC1-MAML2, MYB-NFIB)" ve "En Sık / En Nadir" ayrımlarını keskin maddelerle ver.

2. YAN YANA ÇAPRAZ KIYAS MATRİSİ (DISCRIMINATION LEARNING):
   - Birbiriyle karışan kavramları (örn. Evre III vs Evre IV Periodontitis, Gama-1 vs Gama-2 fazı, Foramen ovale vs spinosum, Kontrollü vs Kontrolsüz devrilme, Ameloblastoma vs OKK) mutlaka Markdown Tablosu (| Kriter | Kavram A | Kavram B | ÖSYM Tuzağı |) halinde kıyasla.

3. EBBINGHAUS KOVA TRİYAJI PROTOKOLÜ:
   - Yeşil Kova (T+3 40 soruda ≥34 Doğru, ≥%85): Şema neokortekste sağlamdır, taburcu edilir (2. soru bankası çözülmez).
   - Sarı Kova (T+3 40 soruda 28-33 Doğru, %70-%84): Sadece eriyen alt başlıklara 15 dk nokta atışı yama yapılır ve T+14 gününe 2. bankadan 20 soru doğrulama atanır.
   - Kırmızı Kova (T+3 40 soruda ≤27 Doğru, <%70): Hafta içi akışı bozulmaz; Cumartesi Kova Onarım Bloğunda 25 dk Boş Kağıt (Blurting) + 30 soru ile şema sıfırdan inşa edilir.

4. SWSPS (SEMANTIC WEIGHTED SPACED PENALTY SCORE) HATA OTOPSİSİ:
   - Yanlış yapılan sorularda bilişsel hata kök nedenini teşhis et:
     * Çeldirici Tuzağı (1.40x ceza): Hangi kelime/istisna tuzağa düşürdü?
     * Muhakeme Hatası (1.25x ceza): Klinik karar algoritmasında hangi basamak atlandı?
     * Bilgi Eksikliği (1.00x ceza): Hangi spot eşik unutuldu?
     * Soru Kökü / Dikkat (0.80x ceza): "Değildir / En az / İlk" vurgusu nasıl kaçırıldı?

5. ANKİ FSRS & ATOMİK CLOZE KART STANDARDI (01-KRITIK-OTOPSI-VE-TABLO):
   - Anki kartı üretirken asla uzun paragraf yazma; maksimum 1-2 cümlelik, tek satırda kopyalanmaya hazır {{c1::...}} ve {{c2::...}} Cloze formatı kullan.
   - Nankör ezberler (Grup A dersleri: Anatomi, Mikrobiyoloji, Farmakoloji, Biyokimya) için mutlaka fonolojik, mekansal veya absürt bir "Hafıza Çivisi (Mnemonic)" ekle.

6. ÇIKTI FORMATI:
   - Başlıkları net, taranabilir, klinik ve yüksek yoğunluklu (high-density) tut. Gereksiz hiçbir kelime kullanma.`;

export const LOCKED_MAX_COMPLETION_TOKENS = 32768;
export const LOCKED_REASONING_EFFORT: DeepSeekReasoningEffort = 'max';
export const LOCKED_IDEAL_TEMPERATURE = 0.2;

export const DEFAULT_DEEPSEEK_MODEL_CONFIG: DeepSeekModelConfig = {
  masterSystemPrompt: DEFAULT_DEEPSEEK_MASTER_PROMPT,
  reasoningEffort: LOCKED_REASONING_EFFORT,
  maxCompletionTokens: LOCKED_MAX_COMPLETION_TOKENS,
  temperature: LOCKED_IDEAL_TEMPERATURE,
  topP: 0.95,
  presencePenalty: 0.0,
  frequencyPenalty: 0.1,
  cachePreference: 8,
  injectLiveTelemetryContext: true
};

/**
 * Sistem politikası gereği tüm çağrılarda maksimum token (32.768) ve 'max' muhakeme sabitlenmiştir.
 */
export function getRecommendedMaxTokens(_effort?: DeepSeekReasoningEffort): number {
  return LOCKED_MAX_COMPLETION_TOKENS;
}

/**
 * Görev tipine, ünite bilgilerine ve Master Prompt ayarlarına göre
 * Deploy.com DeepSeek v4.1 Flash API istek gövdesini oluşturur.
 */
export function buildDeepSeekPayload(
  input: DeepSeekPromptInput
): DeployChatCompletionRequest {
  const subjectLabel = input.subjectCode
    ? `[${input.subjectCode}] ${input.subjectName || 'DUS Dersi'}`
    : input.subjectName || 'DUS Dersi';
  const unitLabel = input.topicCode
    ? `${input.topicCode} — ${input.unitTitle || 'Genel Konu'}`
    : input.unitTitle || 'Genel Konu';

  let userContent = '';

  switch (input.taskType) {
    case 'TRIAGE_PATCH':
      userContent = [
        `### HEDEF ÜNİTE BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- Müfredat Ünitesi: ${unitLabel}`,
        input.bucket ? `- Mevcut Kova Statüsü: ${input.bucket}` : '',
        input.scoreSummary ? `- Son Test Performansı: ${input.scoreSummary}` : '',
        input.userNotes ? `- Öğrencinin Karıştırdığı Nokta / Hata Notu: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (TRİYAJ YAMASI & ÇAPRAZ KIYAS):`,
        `1. **Çapraz Kıyas Matrisi (Markdown Tablo)**: Bu ünitede ÖSYM'nin en çok birbirine çeldirici yaptığı en az 3 kavram çiftini yan yana kıyasla.`,
        `2. **5 Dakikalık Nokta Atışı Klinik/Akademik Yama**: Sayısal eşikleri, altın standartları ve istisnaları maddeler halinde özetle.`,
        `3. **2 Adet Atomik Anki Cloze Kartı**: Doğrudan \`01-KRITIK-OTOPSI-VE-TABLO\` destesine eklenecek {{c1::...}} formatında kart yaz.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'SWSPS_ERROR_AUTOPSY':
      userContent = [
        `### SWSPS BİLİŞSEL CEZA & HATA OTOPSİSİ BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- İlgili Ünite: ${unitLabel}`,
        input.swspsContext ? `- Kayıtlı SWSPS Hata Verisi:\n${input.swspsContext}` : '',
        input.userNotes ? `- Yanlış Yapılan Soru / Düşülen Çeldirici: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (SWSPS DERİN OTOPSİ PROTOKOLÜ):`,
        `1. **Bilişsel Kök Neden Analizi**: Bu hatanın nedenini (Çeldirici Tuzağı 1.4x / Muhakeme 1.25x / Bilgi 1.0x / Dikkat 0.8x) ve bilişsel yanılsamayı açıkla.`,
        `2. **Doğru Şık vs Düşülen Çeldirici Ayrım Tablosu**: İki seçeneği birbirinden tek bakışta ayıran "Turnusol Kağıdı" bilgisini göster.`,
        `3. **Antidot Anki Cloze & Hafıza Çivisi (Mnemonic)**: Aynı hatayı bir daha yapmayı imkansız kılacak 3 adet {{c1::...}} Cloze kartı ve 1 adet fonolojik/absürt hafıza çivisi üret.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'ANKI_CLOZE':
      userContent = [
        `### ANKİ FSRS & MİKRO-BELLEK BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- Müfredat Ünitesi: ${unitLabel}`,
        input.userNotes ? `- Odaklanılacak Alt Başlık / Hata: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (01-KRITIK-OTOPSI-VE-TABLO DESTESİ):`,
        `1. **6 Adet Yüksek Seçicilikli Atomik Anki Cloze Kartı**: Her biri tek satırlık, sınavda doğrudan soru çözdüren {{c1::...}} ve {{c2::...}} formatında kartlar.`,
        `2. **3 Adet Bilişsel Kanca / Hafıza Çivisi (Mnemonic)**: Bu ünitenin en nankör sınıflama veya sayısal eşiklerini kalıcı kılacak kodlamalar.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'UNIT_BLURTING':
      userContent = [
        `### T+0 BOŞ KAĞIT (BLURTING) KALİBRASYON BAĞLAMI`,
        `- Ders Bloğu: ${subjectLabel}`,
        `- Müfredat Ünitesi: ${unitLabel}`,
        input.userNotes ? `- Ek Not: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (T+0 BLURTING KONTROL LİSTESİ):`,
        `1. **Boş Kağıtta Mutlaka Olması Gereken 7 Altın DUS Eşiği**: Öğrenci kitabı kapatıp boş kağıda şema çizerken unutursa puan kaybedeceği kritik maddeler.`,
        `2. **Sayısal Parametreler ve Eşik Değerler Tablosu**: Süre, doz, milimetre, yüzde ve açı değerleri.`,
        `3. **T+3 Günü (40 Soruluk Test) Öncesi 3 Kritik ÖSYM Tuzağı**: Soru köklerinde dikkat edilmesi gereken tuzaklar.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'MOCK_EXAM_STRATEGY':
      userContent = [
        `### 16 BRANŞ DENEME ANALİZİ & ADÇC 108 NET STRATEJİ BAĞLAMI`,
        input.examContext ? input.examContext : `- Odak Ders: ${subjectLabel}`,
        input.swspsContext ? `- En Yüksek SWSPS Ceza Puanlı Hatalar:\n${input.swspsContext}` : '',
        input.userNotes ? `- Öğrencinin Stratejik Notu / Hedefi: ${input.userNotes}` : '',
        '',
        `### İSTENEN ÇIKTI (TAKTiKSEL DENEME KOÇLUĞU):`,
        `1. **Net Açığı Teşhisi (108.0 Hedefine Kalan Fark Analizi)**: En hızlı net artışı sağlayacak 3 kaldıraç branş ve ünite.`,
        `2. **SWSPS Ceza Puanı Yüksek Konular İçin 7 Günlük Mikro-Müdahale Planı**: Hangi gün hangi kova/hataya nasıl müdahale edilmeli?`,
        `3. **Soru Çözüm Hızı (50-60 sn/soru) ve Turlama Tekniği Kalibrasyonu**.`
      ]
        .filter(Boolean)
        .join('\n');
      break;

    case 'CUSTOM':
    default:
      userContent = [
        input.unitTitle ? `Bağlam: ${subjectLabel} — ${unitLabel}` : '',
        input.examContext ? `Sistem Telemetrisi:\n${input.examContext}` : '',
        input.customPrompt || input.userNotes || 'DUS 2027 ADÇC TOP 10 hedefi için kritik klinik/akademik analiz yap.'
      ]
        .filter(Boolean)
        .join('\n\n');
      break;
  }

  // Sistem genelinde kilitli sabit parametreler (Kullanıcı arayüzünden veya dışarıdan değiştirilemez)
  const reasoningEffort: DeepSeekReasoningEffort = LOCKED_REASONING_EFFORT;
  const clampedMaxTokens = LOCKED_MAX_COMPLETION_TOKENS;
  const temperature = LOCKED_IDEAL_TEMPERATURE;

  const topP =
    typeof input.topP === 'number'
      ? Math.max(0.1, Math.min(1, Number(input.topP.toFixed(2))))
      : 0.95;

  const presencePenalty =
    typeof input.presencePenalty === 'number'
      ? Math.max(-2, Math.min(2, Number(input.presencePenalty.toFixed(2))))
      : 0;

  const frequencyPenalty =
    typeof input.frequencyPenalty === 'number'
      ? Math.max(-2, Math.min(2, Number(input.frequencyPenalty.toFixed(2))))
      : 0.1;

  const cachePreference =
    typeof input.cachePreference === 'number'
      ? Math.max(1, Math.min(10, Math.round(input.cachePreference)))
      : 8;

  const systemPrompt =
    input.masterSystemPrompt && input.masterSystemPrompt.trim().length > 10
      ? input.masterSystemPrompt.trim()
      : DEFAULT_DEEPSEEK_MASTER_PROMPT;

  return {
    model: DEPLOY_DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    reasoning_effort: reasoningEffort,
    max_completion_tokens: clampedMaxTokens,
    temperature,
    top_p: topP,
    presence_penalty: presencePenalty,
    frequency_penalty: frequencyPenalty,
    cache_preference: cachePreference,
    stream: false
  };
}

/**
 * Deploy.com chat.completion JSON yanıtını güvenli biçimde ayrıştırır.
 */
export function parseDeepSeekResponse(raw: Record<string, unknown>): DeepSeekResult {
  const choices = Array.isArray(raw?.choices) ? raw.choices : [];
  const firstChoice = (choices[0] as Record<string, unknown>) || {};
  const message = (firstChoice.message as Record<string, unknown>) || {};

  const rawContent = typeof message.content === 'string' ? message.content.trim() : '';
  const rawReasoning =
    typeof message.reasoning_content === 'string' && message.reasoning_content.trim()
      ? message.reasoning_content.trim()
      : null;

  const finishReason =
    typeof firstChoice.finish_reason === 'string' ? firstChoice.finish_reason : undefined;

  const usageObj = (raw?.usage as Record<string, unknown>) || {};
  const promptDetails = (usageObj.prompt_tokens_details as Record<string, unknown>) || {};
  const completionDetails =
    (usageObj.completion_tokens_details as Record<string, unknown>) || {};

  return {
    id: typeof raw?.id === 'string' ? raw.id : 'deploy-completion',
    model: typeof raw?.model === 'string' ? raw.model : DEPLOY_DEEPSEEK_MODEL,
    content: rawContent || (rawReasoning ? `[Düşünme Özeti]:\n${rawReasoning}` : ''),
    reasoningContent: rawReasoning,
    finishReason,
    usage: {
      promptTokens: Number(usageObj.prompt_tokens) || 0,
      completionTokens: Number(usageObj.completion_tokens) || 0,
      totalTokens: Number(usageObj.total_tokens) || 0,
      reasoningTokens: Number(completionDetails.reasoning_tokens) || 0,
      cachedTokens: Number(promptDetails.cached_tokens) || 0
    }
  };
}

/**
 * Sunucu tarafı /api/ai/deepseek proxy rotası üzerinden DeepSeek v4.1 Flash modelini çağırır.
 */
export async function requestDeepSeekCompletion(
  input: DeepSeekPromptInput
): Promise<DeepSeekResult> {
  const response = await fetch('/api/ai/deepseek', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(input)
  });

  const rawText = await response.text();
  const trimmed = rawText.trim();
  if (!trimmed || trimmed.startsWith('<') || /^<!doctype/i.test(trimmed)) {
    throw new Error('DeepSeek API sunucusuna şu an ulaşılamıyor.');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    throw new Error('DeepSeek API yanıtı ayrıştırılamadı.');
  }

  if (!response.ok) {
    throw new Error(
      typeof parsed.error === 'string'
        ? parsed.error
        : `DeepSeek API hatası (HTTP ${response.status})`
    );
  }

  return parsed as unknown as DeepSeekResult;
}

