/**
 * DUS 2027 Müfredat ve 227 Konsolide Ünite Taksonomi Veritabanı (UNITS.md)
 * ExcelMaster (DUS_2027_Stratejik_Yonetim_Sistemi.xlsx) Konu_Takip_Matrisi & Tekrar_Plani Uyumlu
 * Temel Bilimler: 6 Ders Bloğu (B01-B07) - 72 Ünite - 40 Soru (%33.33)
 * Klinik Bilimler: 8 Ders Bloğu (B09-B16) - 155 Ünite - 80 Soru (%66.67)
 * Toplam: 14 Ders Bloğu (15 Temel DUS Dersi) - 227 Ünite - 120 Soru (%100.0)
 */

import { DUSSubject, TopicUnit } from '../types/dus';

export const CANONICAL_DUS_SUBJECTS: DUSSubject[] = [
  // ==================== TEMEL BİLİMLER (6 DERS BLOĞU / 72 ÜNİTE / 40 SORU / %33.33) ====================
  {
    id: 'B01',
    code: 'B01',
    name: 'Anatomi',
    category: 'TEMEL_BILIMLER',
    cognitiveGroup: 'GRUP_A',
    questionCount: 6,
    weightPercentage: 5.0,
    unitCount: 10,
    excelColumn: 'K',
    ankiDeckPattern: 'DUS::*Anatomi*',
    description: 'Kemikler, eklemler, kaslar, pleksuslar, dolaşım, sinir sistemi, kraniyal sinirler ve duyu organları.',
    colorTheme: 'sky',
    iconName: 'Skull',
    protocol: {
      cognitiveCharacteristics: 'Düşük kavramsal hikaye, çok yüksek izole terim ve komşuluk yükü. Çok hızlı unutulur.',
      t0Method: 'İkili Kodlama + Ayıklama. Ana kitaptan çalış, saf ezberleri Image Occlusion olarak Anki Öncelikli Desteye at, 10 dk Boş Kağıt anlatımı yap.',
      t3Method: 'T+3 gününde kalan 40 soruyu çöz. Doğru sayısına göre Kova Triyajına ata.',
      questionBankUsage: '1. Soru Bankası %100 tüketilir. 4. Soru Bankası kesinlikle çözülmez (zaman israfı).',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Anatomi* (1-2 kutuluk Image Occlusion tabloları).'
    }
  },
  {
    id: 'B02+B03',
    code: 'B02+B03',
    name: 'Fizyoloji ve Histoloji',
    category: 'TEMEL_BILIMLER',
    cognitiveGroup: 'GRUP_B',
    questionCount: 8,
    weightPercentage: 6.67,
    unitCount: 28,
    excelColumn: 'L-M',
    ankiDeckPattern: 'DUS::*Histoloji* & DUS::*Fizyoloji*',
    description: 'Hücre ve sistem fizyolojisi (12 ünite, 4 soru) ile genel/özel histoloji ve embriyoloji (16 ünite, 4 soru) konsolide bloğu.',
    colorTheme: 'emerald',
    iconName: 'Activity',
    protocol: {
      cognitiveCharacteristics: 'Fizyolojide yüksek mantıksal mekanizma zinciri (4 soru) + Histoloji/Embriyolojide görsel doku ve gelişim evreleri (4 soru).',
      t0Method: 'Fizyoloji için Detaylandırıcı Sorgulama ("Neden?") + Feynman Tekniği; Histoloji için embriyolojik safhaları Boş Kağıda çiz + T+0 10 soru çöz.',
      t3Method: 'T+3 gününde kalan 40 soruyu çöz. ≥%85 (34+ doğru) ise Yeşil Kovaya ayırıp taburcu et.',
      questionBankUsage: '1. Soru Bankası + Çıkmış DUS soruları + DUSBANKASI karma blokları.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Histoloji* & DUS::*Fizyoloji*.'
    }
  },
  {
    id: 'B04',
    code: 'B04',
    name: 'Tıbbi Biyokimya',
    category: 'TEMEL_BILIMLER',
    cognitiveGroup: 'GRUP_A',
    questionCount: 6,
    weightPercentage: 5.0,
    unitCount: 10,
    excelColumn: 'N',
    ankiDeckPattern: 'DUS::*Biyokimya*',
    description: 'Karbonhidratlar, lipidler, metabolizma, aminoasitler, proteinler, enzimler, vitaminler, hormonlar, hücre/organeller ve genetik.',
    colorTheme: 'indigo',
    iconName: 'Dna',
    protocol: {
      cognitiveCharacteristics: 'Yoğun enzim regülatörleri (aktivatör/inhibitör), kofaktörler ve allosterik moleküller.',
      t0Method: 'Hikayeleştirilmiş mekanizma kancaları (Mnemonic) kur, metabolizma yolağını boş kağıda çiz, T+0 10 soru çöz.',
      t3Method: 'T+3 gününde kalan 40 soruyu sınav ciddiyetiyle çöz.',
      questionBankUsage: '1. Soru Bankası + Çıkmış soruların 3 kez taranması.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Biyokimya* (Allosterik enzim ve vitamin tabloları).'
    }
  },
  {
    id: 'B05',
    code: 'B05',
    name: 'Tıbbi Mikrobiyoloji',
    category: 'TEMEL_BILIMLER',
    cognitiveGroup: 'GRUP_A',
    questionCount: 6,
    weightPercentage: 5.0,
    unitCount: 7,
    excelColumn: 'O',
    ankiDeckPattern: 'DUS::*Mikrobiyoloji*',
    description: 'Temel mikrobiyoloji, immünoloji, bakteriler, virüsler, mantarlar, parazitoloji ve HEDEF70 özet taraması.',
    colorTheme: 'violet',
    iconName: 'Bug',
    protocol: {
      cognitiveCharacteristics: 'Çok yüksek volatiliteli saf ezber (virüs reseptörleri, toksinler, boyanma özellikleri).',
      t0Method: 'Fonolojik ve absürt hafıza kancaları (örn. EBV -> CD21, Rino -> ICAM-1) kur ve T+0 10 soru çöz.',
      t3Method: 'T+3 testi sonrası zayıf kalan mikroorganizmaları 15 dk oku ve yıldızla.',
      questionBankUsage: '1. Soru Bankası + DUSBANKASI ünite modu.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Mikrobiyoloji* (Virüs-Reseptör ve Bakteri Toksin tabloları).'
    }
  },
  {
    id: 'B06',
    code: 'B06',
    name: 'Tıbbi Patoloji',
    category: 'TEMEL_BILIMLER',
    cognitiveGroup: 'GRUP_B',
    questionCount: 4,
    weightPercentage: 3.33,
    unitCount: 9,
    excelColumn: 'P',
    ankiDeckPattern: 'DUS::*Patoloji*',
    description: 'Hücresel adaptasyonlar, hemodinamik hastalıklar, inflamasyon, immün sistem, neoplazi, damar/deri/kemik patolojisi ve oral patoloji.',
    colorTheme: 'rose',
    iconName: 'Flame',
    protocol: {
      cognitiveCharacteristics: 'Neden-sonuç zinciri ve histopatolojik ayırıcı tanı kontrastı (özellikle Oral Patoloji ve Odontojenik Kistler/Tümörler).',
      t0Method: 'Detaylandırıcı sorgulama. Benzer kist ve tümörleri yan yana kıyasla, T+0 10 soru çöz.',
      t3Method: 'T+3 vaka soruları + DUSBANKASI karma tarama.',
      questionBankUsage: '1. ve 2. Soru Bankası entegrasyonu.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Patoloji* (İmmünohistokimyasal belirteçler ve tümör gen mutasyonları).'
    }
  },
  {
    id: 'B07',
    code: 'B07',
    name: 'Tıbbi Farmakoloji',
    category: 'TEMEL_BILIMLER',
    cognitiveGroup: 'GRUP_B',
    questionCount: 6,
    weightPercentage: 5.0,
    unitCount: 8,
    excelColumn: 'Q',
    ankiDeckPattern: 'DUS::*Farmakoloji*',
    description: 'Genel farmakoloji, kemoterapötikler, otonom sinir sistemi, kardiyovasküler, santral SS, otakoidler/NSAİİ, hormonlar ve diğer ilaçlar.',
    colorTheme: 'amber',
    iconName: 'Pill',
    protocol: {
      cognitiveCharacteristics: 'Yüksek mantıksal reseptör mekanizmaları + izole yan etki ve kontrendikasyon ezberleri.',
      t0Method: 'Reseptör üzerinden fizyolojik etkiyi türet ("Neden taşikardi yapar?"). Yan etkileri kancala ve T+0 10 soru çöz.',
      t3Method: 'T+3 gecikmeli vaka soruları çözümü.',
      questionBankUsage: '1. Soru Bankası + Çıkmış sorular.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Farmakoloji* (Kontrendikasyon ve spesifik yan etki listeleri).'
    }
  },

  // ==================== KLİNİK BİLİMLER (8 DERS BLOĞU / 155 ÜNİTE / 80 SORU / %66.67) ====================
  {
    id: 'B09',
    code: 'B09',
    name: 'Ağız, Diş ve Çene Cerrahisi',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 17,
    excelColumn: 'S',
    ankiDeckPattern: 'DUS::*Cerrahi*',
    description: 'Cerrahiye giriş, anestezi, diş çekimi, gömülü dişler, periapikal/kist/tümör cerrahisi, enfeksiyon, travma, ortognatik cerrahi ve TME.',
    colorTheme: 'red',
    iconName: 'Crosshair',
    protocol: {
      cognitiveCharacteristics: 'Cerrahi anatomi, komplikasyonlar, acil yaklaşımlar, Pell-Gregory ve Le Fort sınıflamaları.',
      t0Method: 'Cerrahi adımları ve sinir hasarı risk haritasını boş kağıda çiz, T+0 10 soru çöz.',
      t3Method: 'T+3 40 Soru. Sarı kova çıkarsa T+14 doğrulama, kırmızı çıkarsa Cumartesi onarım.',
      questionBankUsage: '1. Banka %100, 2. Banka sadece kova onarımlarında, 3. ve 4. Banka vaka hızında.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Cerrahi* (Antibiyotik profilaksi rejimleri, flep endikasyonları ve cerrahi aciller).'
    }
  },
  {
    id: 'B10',
    code: 'B10',
    name: 'Ağız, Diş ve Çene Radyolojisi',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 26,
    excelColumn: 'T',
    ankiDeckPattern: 'DUS::*Radyoloji*',
    description: 'Radyasyon fiziği, projeksiyon geometrisi, intraoral/panoramik/KIBT görüntüleme, kistler, tümörler, sistemik hastalıklar ve kalsifikasyonlar.',
    colorTheme: 'slate',
    iconName: 'Radio',
    protocol: {
      cognitiveCharacteristics: 'Radyolusent/radyoopak lezyon ayırıcı tanısı, KIBT ve projeksiyon artefakt analizi.',
      t0Method: 'Görsel radyografi ve lezyon sınırlarını analiz et ("Sabun köpüğü", "Güneş ışını", "Soğan zarı" vb.), T+0 10 soru çöz.',
      t3Method: 'T+3 40 soru çözümü ve Kova Triyajı.',
      questionBankUsage: '4 Soru Bankası ve DUSBANKASI Favoriler.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Radyoloji* (Görsel kartlar ve radyografik patognomonik bulgular).'
    }
  },
  {
    id: 'B11',
    code: 'B11',
    name: 'Çocuk Diş Hekimliği',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 29,
    excelColumn: 'U',
    ankiDeckPattern: 'DUS::*Pedodonti*',
    description: 'Diş gelişimi ve anomalileri, süt dişi pulpa tedavileri, floridler, fissür örtücüler, travma, davranış yönlendirmesi ve restorasyonlar.',
    colorTheme: 'pink',
    iconName: 'Smile',
    protocol: {
      cognitiveCharacteristics: 'Kalsifikasyon/sürme yaşları, IADT luksasyon-avülsiyon tedavi algoritmaları ve süt dişi kavite prensipleri.',
      t0Method: 'IADT kılavuzu travma karar ağacını çiz. Süt dişi ampütasyon ve kuafaj endikasyonlarını karşılaştır, T+0 10 soru çöz.',
      t3Method: 'T+3 40 soru ile test et.',
      questionBankUsage: '1. Banka + Çıkmışlar + Klinik vaka bankaları.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Pedodonti* (Yer tutucu endikasyon tablosu ve travma splint süreleri).'
    }
  },
  {
    id: 'B12',
    code: 'B12',
    name: 'Endodonti',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 25,
    excelColumn: 'V',
    ankiDeckPattern: 'DUS::*Endodonti*',
    description: 'Kök kanal anatomisi, pulpa ve periapikal doku, teşhis, mekanik preparasyon, irrigasyon, medikamentler, vital/rejeneratif endodonti ve travma.',
    colorTheme: 'purple',
    iconName: 'Zap',
    protocol: {
      cognitiveCharacteristics: 'Ayırıcı tanı klinik semptomları (soğuk/sıcak testi, perküsyon), Ni-Ti alaşım fazları ve irrigasyon kimyası.',
      t0Method: 'AAE pulpa-apikal sınıflamasını yan yana vaka tablosu olarak yaz, T+0 10 soru çöz.',
      t3Method: 'T+3 40 soru geri çağırma.',
      questionBankUsage: '4 Soru Bankası tam teşekküllü uygulanır.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Endodonti* (NiTi fazları, NaOCl/EDTA etkileşimleri ve rezorpsiyon tipleri).'
    }
  },
  {
    id: 'B13',
    code: 'B13',
    name: 'Ortodonti',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 21,
    excelColumn: 'W',
    ankiDeckPattern: 'DUS::*Ortodonti*',
    description: 'Büyüme ve gelişme, dentisyon, diş hareketi biyomekaniği, sefalometrik teşhis, ankraj, minivida, apareyler, maloklüzyonlar ve retansiyon.',
    colorTheme: 'lime',
    iconName: 'Compass',
    protocol: {
      cognitiveCharacteristics: 'SNA/SNB/ANB açısal değerleri, büyüme teorileri, servikal vertebra maturasyonu ve ortodontik kuvvet biyolojisi.',
      t0Method: 'Sefalometrik referans noktalarını kafa şeması üzerinde işaretle. İskeletsel vs Dişsel ayrımı yap, T+0 10 soru çöz.',
      t3Method: 'T+3 40 soru çözümü ve Kova Triyajı.',
      questionBankUsage: '1. Banka + 3. Banka karma modları.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Ortodonti* (Sefalometrik norm değerleri ve fonksiyonel aparey endikasyonları).'
    }
  },
  {
    id: 'B14',
    code: 'B14',
    name: 'Periodontoloji',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 11,
    excelColumn: 'X',
    ankiDeckPattern: 'DUS::*Periodontoloji*',
    description: 'Periodonsiyum anatomisi, etiyoloji, patogenez, gingival patolojiler, periodontitis (2017 sınıflaması), cerrahi/cerrahi olmayan tedavi ve implant.',
    colorTheme: 'green',
    iconName: 'HeartPulse',
    protocol: {
      cognitiveCharacteristics: '2017 AAP/EFP Sınıflaması milimetrik klinik ataşman/kemik kaybı eşikleri, Gracey küret numaraları ve flep teknikleri.',
      t0Method: 'Boş A4 kağıdına 4 sütun aç (Sağlıklı, Periodontitis, Mukogingival, Peri-implant) ve kendi zihninden dök, T+0 10 soru çöz.',
      t3Method: 'T+3 vaka soruları (Evre I-IV, Derece A-C ayrımı).',
      questionBankUsage: '1., 2., 3., 4. Soru Bankası klinik derinlikte kullanılır.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Periodontoloji* (2017 sınıflama matrisi ve kemik içi defekt tipleri).'
    }
  },
  {
    id: 'B15',
    code: 'B15',
    name: 'Protetik Diş Tedavisi',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 9,
    excelColumn: 'Y',
    ankiDeckPattern: 'DUS::*Protetik*',
    description: 'Diş anatomisi, oklüzyon, sabit protezler, implantoloji, hareketli bölümlü protezler, tam protezler, maddeler bilgisi, TME ve çene yüz protezleri.',
    colorTheme: 'blue',
    iconName: 'Shield',
    protocol: {
      cognitiveCharacteristics: 'Kennedy sınıflamaları, biyomekanik prensipler, kroşe tipleri, ölçü maddeleri ve milimetrik preparasyon eşikleri.',
      t0Method: 'Karşılaştırmalı Tablo + Kitabı Kapat Anlat + T+0 10 Soru (Kennedy sınıflamaları ve kroşeler).',
      t3Method: 'T+3 Kalan 40 Soru + DUSBANKASI Karma Denemeleri.',
      questionBankUsage: 'Klinik ağırlıklı ders: 4 Soru Bankası da Faz 2 ve 3 boyunca aktif tüketilir.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Protetik* (Kroşe endikasyonları, alaşımlar ve preparasyon açıları).'
    }
  },
  {
    id: 'B16',
    code: 'B16',
    name: 'Restoratif Diş Tedavisi',
    category: 'KLINIK_BILIMLER',
    cognitiveGroup: 'GRUP_C',
    questionCount: 10,
    weightPercentage: 8.33,
    unitCount: 17,
    excelColumn: 'Z',
    ankiDeckPattern: 'DUS::*Restoratif*',
    description: 'Diş sert dokuları, çürüksüz lezyonlar, dentin hassasiyeti, çürük oluşumu, tükürük, preparasyonlar, adeziv sistemler, kompozitler ve amalgam.',
    colorTheme: 'orange',
    iconName: 'Sparkles',
    protocol: {
      cognitiveCharacteristics: 'Adeziv jenerasyonları (monomer-dentin bağı), kompozit doldurucular, amalgam fazları ve beyazlatma kimyası.',
      t0Method: 'Çapraz Kıyas Tablolarını (Mine vs Dentin, 4-8. Jen Adezivler, Gama-1 vs Gama-2) incele ve T+0 10 soru çöz.',
      t3Method: 'T+3 kalan 40 soru. Yanlışları ana kitaptan 15 dk yama yap.',
      questionBankUsage: '1. Banka + DUSBANKASI ünite taramaları + Klinik 4. Banka.',
      ankiProtocol: 'Anki Filtreli Deste: DUS::*Restoratif* (Florür PPM merdiveni, pin çapları ve adeziv pH değerleri).'
    }
  }
];

/**
 * UNITS.md Dokümanındaki 227 Konsolide DUS Ünitesinin Tam Fihristi
 */
export const CURRICULUM_UNITS_BY_SUBJECT: Record<string, string[]> = {
  B01: [
    'Ünite 01 - Kemikler',
    'Ünite 02 - Eklemler',
    'Ünite 03 - Kaslar',
    'Ünite 04 - Pleksuslar',
    'Ünite 05 - Solunum Sistemi',
    'Ünite 06 - Dolaşım Sistemi',
    'Ünite 07 - Sindirim Sistemi',
    'Ünite 08 - Merkezi Sinir Sistemi',
    'Ünite 09 - Periferik Sinir Sistemi ve Kraniyal Sinirler',
    'Ünite 10 - Duyu Organları'
  ],
  'B02+B03': [
    'Hücre Fizyolojisi',
    'Temel Dokular',
    'Kan Fizyolojisi',
    'Dolaşım Sistemi',
    'Solunum Fizyolojisi',
    'Sindirim Sistemi',
    'Böbrek Fizyolojisi',
    'Endokrin Sistemi',
    'Genel Embriyoloji',
    'Sinir Sistemi Fizyolojisi',
    'Kas Fizyolojisi',
    'Duyu Organları',
    'Histoloji - Hücre',
    'Histoloji - Epitel Doku',
    'Histoloji - Yağ ve Kıkırdak',
    'Histoloji - Kas',
    'Histoloji - Kan',
    'Histoloji - Sinir',
    'Histoloji - Dolaşım Sistemi',
    'Histoloji - İmmün Sistem ve Hematopoetik Organlar',
    'Histoloji - Solunum Sistemi',
    'Histoloji - Sindirim Sistemi',
    'Histoloji - Endokrin Sistem',
    'Histoloji - Genital Sistem',
    'Histoloji - Deri ve Ekleri',
    'Histoloji - Göz ve Kulak',
    'Histoloji - Merkezi Sinir Sistemi (MSS)',
    'Histoloji - Genel Embriyoloji'
  ],
  B04: [
    'BÖLÜM 1 - KARBONHİDRATLAR',
    'BÖLÜM 2 LİPİDLER',
    'BÖLÜM 3 - METABOLİZMA',
    'BÖLÜM 4 - AMİNOASİTLER',
    'BÖLÜM 5 - PROTEİNLER',
    '6 ENZİMLER VE KLİNİK',
    '7 VİTAMİNLER',
    'BÖLÜM 8 - HORMONLAR',
    'BÖLÜM 9 - HÜCRE VE ORGANELLER',
    'BÖLÜM 10 - GENETİK Nükleotidler ve Genom'
  ],
  B05: [
    '1 Temel Mikrobiyoloji',
    '2 İmmunoloji',
    '3 Bakteriler',
    '4 virüsler',
    'Mantarlar',
    'Parazitoloji',
    'HEDEF70'
  ],
  B06: [
    '1- HÜCRESEL ADAPTASYONLAR HÜCRE HASARI ve ÖLÜMÜ',
    '2- HEMODİNAMİK HASTALIKLAR ve ŞOK',
    '3- İNFLAMASYON ve TAMİR',
    '4- İMMÜN SİSTEM HASTALIKLARI',
    '5- NEOPLAZİ',
    '6- DAMAR HASTALIKLARI',
    '7- DERİ HASTALIKLARI',
    '8- Kemik, Eklem Hastalıkları ve Yumuşak Doku Tümörleri',
    'Oral Patoloji'
  ],
  B07: [
    '1-Genel Farmakoloji',
    '2-Kemoterapötikler',
    '3-Otonom Sinir Sistemi',
    '4-Kardiyovasküler Sistem',
    '5-Santral SS',
    '6-Otakoidler ve NSAİİ',
    '7-Hormonlar',
    '8-Diğer Sistem İlaçları'
  ],
  B09: [
    '1 CERRAHİYE GİRİŞ',
    '2 ANESTEZİ',
    '3 DİŞ ÇEKİMİ',
    '4 GÖMÜLÜ DİŞLER',
    '5 PERİAPİKAL CERRAHİ',
    '6 KİST ve TÜMÖR CERRAHİSİ',
    '7 ENFEKSİYON',
    '8 YARA İYİLEŞMESİ',
    '9 OROANTRAL İLİŞKİ ve OROANTRAL FİSTÜL',
    '10 PREPROTETİK CERRAHİ',
    '11 İMPLANT CERRAHİSİ',
    '12 MAKSİLLOFASİAL TRAVMA',
    '13 ORTOGNATİK CERRAHİ',
    '14 KRANİOFASİAL DEFORMİTE ve SENDROMLAR',
    '15 DUDAK - DAMAK YARIĞI',
    '16 LAZER',
    '17 OROFASİYAL AĞRI TEMPOROMANDİBULER EKLEM'
  ],
  B10: [
    '1- Radyoloji Temeli',
    '2- Radyasyonun Biyolojik Etkileri',
    '3- Radyasyondan Korunma',
    '4- Dijital Radyografi',
    '5- Film ile Görüntüleme',
    '6- Projeksiyon Geometrisi',
    '7- İntraoral Radyografi',
    '8- Ekstraoral Radyografi',
    '9- Panoramik Radyografi',
    '10- Radyografik Anatomi',
    '11- Konik Işınlı Bilgisayarlı Tomografi',
    '12- Diğer Görüntüleme Teknikler',
    '13- Radyografik Tanı için Yaklaşım',
    '14- İnflamatuar Patolojiler',
    '15- Kistler',
    '16- Benign Tümörler',
    '17- Malign Tümörler',
    '18- Sistemik Hastalıkları',
    '19- Çürük Radyolojisi',
    '20- Periodontal Radyoloji',
    '21- İmplant Radyolojisi',
    '22- Dental Anomaliler',
    '23- Paranazal Sinüs Görüntülemesi',
    '24- Temporomandibular Eklem Görüntülemesi',
    '25- Tükürük Bezi Hastalıklarında Görüntüleme',
    '26- Yumuşak Doku Kalsifikasyonlar'
  ],
  B11: [
    '1 DİŞLERİN OLUŞUM DÖNEMLERİ',
    '2 DİŞ SÜRME EVRELERİ',
    '3 DİŞLERİN GELİŞİM ANOMALİLERİ',
    '4 SÜT DENTİSYONDA ÇÜRÜK',
    '5. Ünite',
    '6 SÜT DİŞİ PULPA HASTALIKLARININ TEDAVİSİNDEKİ AMAÇ',
    '7. Ünite',
    '8. Ünite',
    '9 BESLENME ve ÇÜRÜK ARASINDAKİ İLİŞKİLER',
    '10 TATLANDIRICILAR',
    '11 ÇÜRÜK PROFİLAKSİSİNDE FLORİDLER',
    '12 FİSSÜR ÖRTÜCÜLER',
    '13 ÇOCUKLARDA KAPANIŞ İLİŞKİLERİ ve OKLUZAL REHBERLİK',
    '14 DİŞ YARALANMALARI VE TRAVMA',
    '15 ÇOCUKLARDA PERİODONSİYUM VE GİNGİVAL HASTALIKLAR',
    '16 ÇOCUKLUK DÖNEMİ HASTALIKLARININ AĞIZ İÇİ BELİRTİLERİ',
    '17 ÇOCUKLARDA SİSTEMİK HASTALIKLAR VE AĞIZ İÇİ BULGULARI',
    '18 ÇOCUK DİŞ HEKİMLİĞİNDE İLAÇ KULLANIMI VE ANTİBİYOTİKLER',
    '19 ÇOCUK HASTADA PSİKOLOJİK YAKLAŞIM VE DAVRANIŞ YÖNLENDİRMESİ',
    '20 ENGELLİ ÇOCUKLARDA SINIFLAMA VE TEDAVİ YAKLAŞIMLARI',
    '21 ÇOCUK DİŞ HEKİMLİĞİNDE LOKAL ANESTEZİ',
    '22 SEDASYON ve GENEL ANESTEZİ',
    '23. Ünite',
    '24 SÜT DİŞLERİNİN MORFOLOJİK VE HİSTOLOJİK ÖZELLİKLERİ',
    '25 MİNE, DENTİN VE PULPANIN YAPISAL ÖZELLİKLERİ',
    '26 SÜT DİŞLERİNDE KAVİTE HAZIRLAMA VE BLACK PRENSİPLERİ',
    '27 ÇOCUK DİŞ HEKİMLİĞİNDE KULLANILAN RESTORATİF MATERYALLER',
    '28 ANTERİOR VE POSTERİOR SÜT DİŞLERİNİN RESTORASYONLARI',
    '29 SÜT DİŞLERİ ÇEKİM ENDİKASYONLARI VE KONTRENDİKASYONLARI'
  ],
  B12: [
    'Ünite 1 - GİRİŞ',
    'Ünite 2 - KÖK KANAL ANATOMİSİ ve GİRİŞ KAVİTESİ PREPARASYONU',
    'Ünite 3 - İZOLASYON',
    'Ünite 4 - ENDODONTİDE LOKAL ANESTEZİ UYGULAMALARI',
    'Ünite 5 - PULPA ve PERİAPİKAL DOKU',
    'Ünite 6 - ENDODONTİK ENFEKSİYONLARIN MİKROBİYOLOJİSİ',
    'Ünite 7 - ENDODONTİK İMMÜNOLOJİ',
    'Ünite 8 - ENDODONTİDE TEŞHİS',
    'Ünite 9 - MEKANİK PREPARASYON',
    'Ünite 10 - ENDODONTİDE KARŞILAŞILAN HATALAR',
    'Ünite 11 - ENDODONTİDE İRRİGASYON',
    'Ünite 12 - KÖK KANAL MEDİKAMENTLERİ',
    'Ünite 13 - KÖK KANAL DOLUMU',
    'Ünite 14 - TEKRARLAYAN KÖK KANAL TEDAVİSİ',
    'Ünite 15 - ENDODONTİK ACİL DURUMLAR',
    'Ünite 16 - ENDODONTİDE CERRAHİ OPERASYONLAR',
    'Ünite 17 - VİTAL PULPA TEDAVİLERİ',
    'Ünite 18 - REJENERATİF ENDODONTİ',
    'Ünite 19 - TRAVMA',
    'Ünite 20 - ENDODONTİK TEDAVİ SONRASI RESTORATİF İŞLEMLER',
    'Ünite 21 - ENDODONTİDE BEYAZLATMA (BLEACHING)',
    'Ünite 22 - ENDODONTİ ve PERİODONTOLOJİ İLİŞKİSİ',
    'Ünite 23 - ENDODONTİ ve ORTODONTİ İLİŞKİSİ',
    'Ünite 24 - GERİATRİK ENDODONTİ',
    'Ünite 25 - ENDODONTİDE LAZER KULLANIMI'
  ],
  B13: [
    '1- BÜYÜME ve GELİŞME',
    '2- DENTİSYON',
    '3- DİŞ HAREKETİ',
    '4- TEŞHİS TANI',
    '5- ANKRAJ',
    '6- MİNİVİDA ve MİNİPLAK',
    '7- MATURASYON',
    '8- APAREYLER',
    '9- MALOKLÜZYONLAR',
    '10- ALIŞKANLIKLAR',
    '11- YER DARLIĞI',
    '12- LOKAL SORUNLAR',
    '13- GÖMÜLÜ DİŞLER',
    '14- SÜRME REHBERLİĞİ/SERİ ÇEKİM',
    '15- SABİT TEDAVİ TEKNİKLERİ',
    '16- MATERYAL',
    '17- YETİŞKİNLERDE TEDAVİ ORTOGNATİK CERRAHİ',
    '18- DUDAK DAMAK YARIKLARI',
    '19- SENDROMLAR',
    '20- KOMPLİKASYONLAR',
    '21- RELAPS/RETANSİYON'
  ],
  B14: [
    '1- PERİODONSİYUM',
    '2- ETİYOLOJİ',
    '3- PATOGENEZ',
    '4- GİNGİVAL PATOLOJİLER',
    '5- PERİODONTİTİS',
    '6- ÖZEL DURUMLAR ve EPİDEMİYOLOJİ',
    '7- MUAYENE ve TEŞHİS',
    '8- CERRAHİ OLMAYAN TEDAVİ',
    '9- CERRAHİ TEDAVİ',
    '10- İMPLANT',
    '11- SİSTEMİK HASTALIKLAR'
  ],
  B15: [
    '1- DİŞ ANATOMİSİ',
    '2- OKLÜZYON',
    '3- SABİT PROTEZLER',
    '4- İMPLANTOLOJİ',
    '5- HAREKETLİ BÖLÜMLÜ PROTEZLER',
    '6- TAM PROTEZLER',
    '7- MADDELER BİLGİSİ',
    '8- TEMPOROMANDİBULAR EKLEM',
    '9- ÇENE YÜZ PROTEZLERİ'
  ],
  B16: [
    '1 DİŞ SERT DOKULARI',
    '2 ÇÜRÜKSÜZ DİŞLERİN LEZYONLARI',
    '3 DENTİN HASSASİYETİ VE TEDAVİSİ',
    '4 DİŞ ÇÜRÜĞÜ OLUŞUMU',
    '5 TÜKÜRÜK HİSTOLOJİSİ FİZYOLOJİSİ VE BİYOKİMYASI',
    '6 OPERATİF DİŞ HEKİMLİĞİ DİŞ PREPARASYONLARI VE ÖZELLİKLERİ',
    '7 RESTORATİF DİŞ HEKİMLİĞİNDE KULLANILAN MADDELER',
    '8 ADEZYON VE ADEZİV SİSTEMLER',
    '9 KOMPOZİT REZİNLER',
    '10 DENTAL AMALGAM',
    '11 KOMPLEKS POSTERİOR AMALGAM RESTORASYONLAR',
    '12 POSTERİOR İNDİREKT RESTORASYONLAR',
    '13 DİŞ HEKİMLİĞİNDE RENK VE BEYAZLATMA TEDAVİLERİ',
    '14 KONSERVATİF ESTETİK UYGULAMALAR',
    '15 RESTORATİF DİŞ HEKİMLİĞİNDE MUAYENE',
    '16 KORUYUCU TEDAVİ UYGULAMALARI',
    '17 RESTORATİF DİŞ HEKİMLİĞİNDE KULLANILAN ALETLER VE EKİPMANLAR'
  ]
};

function buildInitial227Units(): TopicUnit[] {
  const units: TopicUnit[] = [];

  for (const subject of CANONICAL_DUS_SUBJECTS) {
    const unitTitles = CURRICULUM_UNITS_BY_SUBJECT[subject.id] || [];
    unitTitles.forEach((title, idx) => {
      const unitNumber = idx + 1;
      const paddedNo = String(unitNumber).padStart(2, '0');
      const id = `unit-${subject.id.toLowerCase().replace(/[^a-z0-9]/g, '')}-${paddedNo}`;

      units.push({
        id,
        subjectId: subject.id,
        unitNumber,
        title,
        subtopics: [],
        status: 'NOT_STARTED',
        currentBucket: 'NONE',
        priority: 'P3_MEDIUM',
        discharged: false,
        createdAt: '2026-11-10',
        updatedAt: '2026-11-10'
      });
    });
  }

  return units;
}

export const INITIAL_TOPIC_UNITS: TopicUnit[] = buildInitial227Units();

export const STORAGE_KEYS = {
  SUBJECTS: 'dus_triage_subjects_v2',
  TOPICS: 'dus_triage_topics_v2',
  GOALS: 'dus_triage_goals_v2',
  SETTINGS: 'dus_triage_settings_v2',
  TRIAGE_LOGS: 'dus_triage_logs_v2'
};
