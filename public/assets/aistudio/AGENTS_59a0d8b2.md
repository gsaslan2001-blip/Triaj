# AGENTS.md — ExcelMaster LLM & Ajan Operasyon Kılavuzu

> Bu dosya, `ExcelMaster` projesine **soğuk başlangıç (cold-start)** yapan tüm yapay zeka ajanları (Gemini, Claude, GPT-4, Cursor, Codex vb.) için **tek sayfalık mutlak operasyon rehberidir**. Sistem mimarisi ve detaylar için [GEMINI.md](./GEMINI.md) dosyasını referans alınız.

---

## ⚡ 1. PROJE KİMLİĞİ VE MİMARİ KATMANLARI

`ExcelMaster`, veri, tablo, büyük veri boru hatları, semantik vektör analizi ve Excel operasyonlarının yürütüldüğü kurumsal otomasyon merkezidir. Sistem **3 ana operasyon katmanından** ve **özel Vibe Coding yeteneklerinden (skills)** oluşur:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          EXCELMASTER MİMARİSİ                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. KATMAN: EXCEL ÇEKİRDEĞİ & GRAFİK MİMARİSİ                           │
│    • excel-xml-chart-architect  : Dinamik grafikler, sparklines, helper│
│    • com-surgical-mutator       : OpenPyXL yıkımını önleyen cerrahi COM│
│    • xlsx-official              : Sıfır formül hatası, strict date ser.│
│    • excel-dashboard-reporting  : 2 kanatlı yönetici panosu gridi      │
│    • xlwings-live-automation    : Açık masaüstü Excel canlı müdahale   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. KATMAN: ATOMİK SENKRONİZASYON & ÇİFT YÖNLÜ KÖPRÜ                   │
│    • bidirectional-sync-orchestrator : SHA-256 kilit, strict coercion  │
│    • headless-formula-evaluator : CalculateFullRebuild, 6 anomali QA   │
│    • spa-excel-websocket-sync   : Web SPA Takvim Kokpiti, FastAPI WS   │
│    • swsps-anki-bridge          : Bilişsel triyaj -> Anki filtreli dest│
│    • polars                     : Milyon satırlık ultra hızlı DataFrame│
│    • data-engineer              : Uçtan uca veri aktarımı ve ETL       │
│    • data-quality-frameworks    : Great Expectations & veri kontratları│
│    • data-storytelling          : Aksiyon odaklı yönetici anlatısı     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. KATMAN: VEKTÖR & DUS SEMANTİK MOTORU                               │
│    • vector-database-engineer   : Supabase pgvector & yerel sqlite-vec │
│    • similarity-search-patterns : Semantik arama, KNN/ANN, reranking   │
│    • embedding-strategies       : Chunking, text-embedding-3 boyut opt.│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 2. OPERASYONEL DEĞİŞMEZLER (INVARIANTS)

1. **Sıfır Formül Hatası İlkesi:**  
   Oluşturulan veya güncellenen hiçbir `.xlsx/.xlsm` dosyasında `#REF!`, `#VALUE!`, `#NAME?`, `#DIV/0!`, `#N/A` hatası bulunamaz. Tüm aramalarda `IFERROR()` veya `IFNA()` koruyucusu kullanılır.
2. **Dinamik Formül Standardı:**  
   Geleneksel `VLOOKUP` ve `INDEX+MATCH` kullanımı KESİNLİKLE YASAKTIR. Modern `XLOOKUP`, `FILTER`, `UNIQUE`, `SORT` ve `LET` kullanılır. Formüller OpenPyXL/XlsxWriter/Win32COM üzerinden İngilizce büyük harfle (`=XLOOKUP(...)`) yazılır.
3. **Strict Date Serialization Invariant (Tarihleri Asla String Yazmama Doktrini):**  
   Hiçbir scriptte veya senkronizasyon modülünde tarihler metin (str / `'2026-10-31'`) olarak yazılamaz! Tarihler mutlak suretle tamsayı Excel seri numarası (`serial = (d - date(1899,12,30)).days`) olarak atanmalı ve hücre formatı `NumberFormatLocal = 'gg.aa.yyyy'` olarak yapılandırılmalıdır.
4. **OpenPyXL extLst Koruma ve COM Cerrahi Yazım İlkesi:**  
   `Tekrar_Takvimi` ve gelişmiş koşullu biçimlendirme içeren dosyalarda `openpyxl.save()` KESİNLİKLE KULLANILAMAZ. Veri güncellemeleri `com-surgical-mutator` (headless Win32COM / xlwings) üzerinden cerrahi hücre yazımı ile yürütülür.
5. **NTFS Hardlink Tekil Dosya İlkesi (Split-Brain Immunity):**  
   Masaüstü ve Repo kopyaları ayrı ayrı bağımsız dosyalar olarak senkronize edilmez. Masaüstündeki dosya, repo kökündeki `DUS_2027_Stratejik_Yonetim_Sistemi.xlsx` dosyasına doğrudan **NTFS Hardlink (`mklink /H`)** ile bağlıdır. Diskte tek bir inode bulunur; scriptler tek bir hedefe yazar ve çift yazım kaynaklı veri ezilmesi sıfırlanır.
6. **16 Kanonik Branş Taksonomi Standardı:**  
   Tüm tablolar (`Parametreler_Ayar`, `Deneme_Analiz`, `Anki_FSRS_Takip`, `Konu_Takip_Matrisi`) ve API entegrasyonları `data/canonical_branches.json` altındaki 16 kanonik branş (8 Temel `B01`..`B08` + 8 Klinik `B09`..`B16`) standardına uymak zorundadır.
7. **XLOOKUP Regresyon Kilidi:**  
   Entegrasyon scriptleri (`ticktick_sync.py`, `anki_sync.py`) özet ve başlık hücrelerine formül yazarken asla eski `VLOOKUP` yapısını yeniden enjekte edemez; formüller mutlak suretle `XLOOKUP` olarak kilitlidir.
8. **Büyük Veri Eşik Değeri (Polars Önceliği):**  
   100.000 satırı aşan tablolarda Pandas yerine mutlak suretle `polars` ve Lazy execution (`pl.scan_parquet`, `pl.scan_csv`) kullanılır. Ara saklamalarda Apache Parquet zorunludur.
9. **Canlı Otomasyon Güvenliği:**  
   `xlwings` ve COM oturumlarında ekran yenileme geçici kapatılmalı (`app.screen_updating = False`), işlem sonunda dosya kaydedilip `finally:` bloğunda nesneler temizlenmelidir.

---

## 🎯 3. YETENEK (SKILL) TETİKLEME MATRİSİ

| Kullanıcı İsteği / Senaryo | Devreye Girecek Yetenekler | Önerilen Araç / Motor |
|---|---|---|
| Dinamik grafik, helper columns, sparklines, halka/sütun grafiği | `excel-xml-chart-architect` | `xlsxwriter`, `univer`, `excelize` |
| extLst koruması, openpyxl save yıkımını önleme, cerrahi yazım | `com-surgical-mutator` | `win32com`, `xlwings`, `excelize` |
| Çift yönlü senkronizasyon, SHA-256 kilit, strict date coercion | `bidirectional-sync-orchestrator` | `python`, `sqlite-vec`, `easyexcel` |
| CalculateFullRebuild, 6 anomali kontratı, görsel QA | `headless-formula-evaluator` | `win32com`, `gotenberg`, `tabula` |
| Bilişsel hata triyajından Anki filtreli deste & takvim tetikleme | `swsps-anki-bridge` | `AnkiConnect`, `python` |
| Web SPA Takvim Kokpiti, canlı WebSocket köprüsü, ECharts | `spa-excel-websocket-sync` | `fastapi`, `handsontable`, `univer` |
| Excel tablosu oluşturma, formül yazma, tarih linter denetimi | `xlsx-official` | `openpyxl`, `xlsxwriter` |
| Yönetici dashboard'u, KPI kartı, 2 kanatlı grid yerleşimi | `excel-dashboard-reporting` | `xlsxwriter` |
| Açık olan masaüstü Excel'e canlı veri yazma, makro tetikleme | `xlwings-live-automation` | `xlwings`, `win32com` |
| Milyon satırlık CSV/Excel işleme, hızlı filtreleme, toplama | `polars` | `polars`, `pyarrow` |
| Uçtan uca veri aktarımı, ETL mimarisi | `data-engineer` | `python`, `scripts/` |
| Tablo doğrulama, null/tekillik kontrolü, veri sözleşmesi | `data-quality-frameworks` | `great-expectations` |
| Yönetici özeti, veri hikayesi, grafik içi yorumlama | `data-storytelling` | Markdown + KPI |
| Supabase pgvector & yerel sqlite-vec DUS semantik motoru | `vector-database-engineer` | `supabase-py`, `sqlite-vec` |
| Semantik benzerlik, KNN, hibrit metin araması | `similarity-search-patterns` | `numpy`, `scikit-learn` |
| Metin vektörleme, chunking stratejisi, embedding modeli seçimi | `embedding-strategies` | `openai`, `sentence-transformers` |

---

## 🔗 4. MEVCUT ENTEGRASYONLAR

- **DUS Stratejik Yönetim Sistemi:** `DUS_2027_Stratejik_Yonetim_Sistemi.xlsx` ana çalışma kitabıdır. Masaüstündeki dosya NTFS Hardlink ile bu dosyaya doğrudan bağlıdır.
- **TickTick Pomodoro Entegrasyonu:** `TickTick_DUS_Senkronize_Et.bat` -> `src/excel_master/integrations/ticktick_sync.py` üzerinden odak oturumlarını COM cerrahi yazımla ana dosyaya aktarır. XLOOKUP regresyon kilidi ile B2 hücresini modern tutar.
- **AnkiConnect FSRS Entegrasyonu:** `Anki_DUS_Senkronize_Et.bat` -> `src/excel_master/integrations/anki_sync.py` üzerinden 16 kanonik branşın kart istatistiklerini ve FSRS kalıcılık skorlarını COM cerrahi yazımla `Anki_FSRS_Takip` sayfasına işler.
- **Web SPA Takvim Kokpiti:** `DUS_TickTick_Takvim_Baslat.bat` -> `scripts/ticktick_calendar_app.py` ile `http://localhost:8088` üzerinden interaktif sürükle-bırak takvim deneyimi sunar.
- **Otomatik QA ve Doğrulama:** `python src/excel_master/core/verifier.py` Win32COM üzerinden `CalculateFullRebuild()` işletir ve 6 anomali kontratını canlı test eder.

---

## 📌 5. POST-MORTEM & KALICI OPERASYONEL ÇIKARIMLAR

1. **Dashboard Çakışması ve İki Kanatlı Grid Kuralı:**  
   XlsxWriter'da grafikler eklenirken (`insert_chart`) grafik piksel genişlikleri hücre boyutlarından taşarsa alttaki ve sağdaki tabloların üzerine biner. Çakışmayı sıfırlamak için **Sol Kanat (B-G / 570px), Boşluk Koridoru (H / 4 genişlik), Sağ Kanat (I-N / 570px)** simetrik gridi uygulanmalıdır. Tablo ve özet alanları grafiklerin bittiği satırdan en az 2 satır sonra (Row 46+) başlatılmalıdır.
2. **Tekil Master Dosya ve NTFS Hardlink Standardı (Split-Brain Önleme):**  
   Masaüstü ve Repo kopyaları ayrı ayrı tutulduğunda dosya boyutları ve değiştirilme zamanları ayrışır (split-brain). Çözüm: Dosya yalnızca repo kökünde tutulur ve Masaüstüne `mklink /H` ile NTFS Hardlink oluşturulur. Otomasyon scriptleri tekil dosyayı günceller; her iki konum anında ve atomik olarak güncel kalır.
3. **Minimalizm ve Sıfır Metin Kalabalığı Standardı:**  
   Yönetici panolarında grafik başlıklarında veya tablolarda parantez içi amatör yer tutucu ifadeler (*"Veri Girdikçe Çizilir"*, *"Otomatik Sıralanır"*) kesinlikle kullanılmaz. Yalın, profesyonel KPI başlıkları ve aksiyona dönük göstergeler kullanılır.
4. **Dinamik Konu Takip Isı Haritası (Heatmap):**  
   `Konu_Takip_Matrisi` sayfasında 14 DUS branşı yan yana sütun blokları olarak yerleşir (Fizyoloji ve Histoloji 28 üniteyle birleşiktir). Her ünite için Tekrar, Son Çalışma, Önerilen Tarih ve Gecikme Gün (`=IF(E8="", "", IF(TODAY()<=E8, 0, TODAY()-E8))`) formülleri işletilir; 3-Color Scale ile gecikme arttıkça renk otomatik olarak yeşilden (`#A7F3D0`), sarıya (`#FDE68A`) ve kırmızıya (`#FCA5A5`) döner.
5. **Kişiselleştirilmiş Müfredat ve Süreç Kilidi Yönetimi:**  
   Kullanıcının çalışma notlarından sağlanan fihristler (Perio, Orto, Radyo, Anatomi, Resto, Endo, Protez) `custom_curriculum.json` altında modüler tutulur; ham dosya ekleri (`.pdf`, `- Kopya`) veri temizleme aşamasında arındırılır. Windows üzerinde açık Excel oturumlarının dosya yazımını engellemesi (`PermissionError: [Errno 13]`) riskine karşı script çalıştırmadan önce `Get-Process -Name EXCEL` kontrolü yapılmalı ve dosya serbest bırakılmalıdır.
6. **Anki Başlatma Kancası (Hook) ve Non-Blocking Arka Plan Standardı:**  
   Anki her başlatıldığında ExcelMaster'ı tetiklemek için `%APPDATA%\Anki2\addons21\excelmaster_sync\` altında `gui_hooks.profile_did_open` kancası kullanılır. Anki ana arayüzünün (UI thread) kilitlenmemesi için tetikleme `QTimer.singleShot(2500, ...)` ile geciktirilmeli ve `subprocess.CREATE_NO_WINDOW` bayrağı ile konsol açılmadan sessizce yürütülmelidir. Kullanıcı Excel dosyasında elle çalıştığı esnada çakışma olmaması için veri ara katmanı (`data/anki_latest_snapshot.json`) üzerinden taşınmalıdır.
7. **Excel COM Koşullu Biçimlendirme Dil Tuzağı ve Kompakt Tekrar Kokpiti:**  
   Windows Türkçe yerelinde Excel COM üzerinden `FormatConditions.Add` işletilirken İngilizce mantık fonksiyonları (`AND`, `ISNUMBER`) Excel formül motoru tarafından sessizce syntax hatası olarak elenir ve koşullu renklendirme çalışmaz. Türkçe Excel'de mutlak suretle `=VE(ESAYIYSA(delay);delay>15)` formülü kullanılmalıdır. Periyodik tekrarlarda (+2G, +7G, +15G, +1Ay) 'Taşı' ve 'Yapıldı' gibi 15 sütunluk over-engineering kurguları yerine; doğrudan hücreden taşınabilen tarihler ve tek bir 'Tamamlanan Tekrar' açılır kutusu içeren 10 sütunluk kompakt kokpit mimarisi uygulanmalıdır.
8. **Excel COM API Tarih Atama Standardı ve Seri Numara Prensibi:**  
   Win32com üzerinden Excel hücrelerine `datetime.date` atanamaz (`must be a pywintypes time object` hatası üretir ve sessizce yazımı engeller). Hücreye tarih yazılırken mutlak suretle Excel seri numarası (`serial = (d_obj - date(1899, 12, 30)).days`) kullanılmalı ve hücre formatı `NumberFormatLocal = 'gg.aa.yyyy'` olarak yapılandırılmalıdır. Bu yöntem hem formül hesaplamalarını (`=C5+2`, `=C5+7`) anında tetikler hem de dil/bölge bağımsız sıfır hatayla çalışır.
9. **TickTick Takvim Entegrasyonu ve Yoğunluk Isı Haritası (Heatmap) Standardı:**  
   DUS Tekrar Takvimi'nde görev yoğunluğunu tek bakışta göstermek için 5 kademeli renk skalası uygulanır: 0 görev = Beyaz (`#FFFFFF`), 1 görev = Canlı ferah yeşil (`#DCFCE7`), 2 görev = Limon sarısı (`#D9F99D`), 3 görev = Sıcak sarı (`#FEF08A`), 4 görev = Pastel turuncu (`#FED7AA`), 5+ görev = Mercan kırmızı (`#FECACA`). Türkçe Excel yerelinde `FormatConditions.Add` için formül mutlak suretle `=EĞERSAY(Takvim_Verisi!$A$2:$A$1126; <serial>)=<N>` şeklinde Türkçe fonksiyon ve noktalı virgül ile tanımlanmalı; hücre üstünde `15  [1 Görev]` gibi dinamik sayaç rozeti üretilmelidir.
10. **İnteraktif Sürüklenebilir Takvim Kokpiti (Drag & Drop):**  
    Excel grid hücresi içindeki birleşik metin parçaları fareyle doğrudan başka günlere sürüklenebilir yapıda olmadığından, TickTick tarzı kart sürükle-bırak deneyimi `scripts/ticktick_calendar_app.py` yerel HTML5 SPA mimarisi ile sağlanır. Masaüstünden tek tıkla (`DUS_TickTick_Takvim_Baslat.bat`) açılan bu panelde, konular ve tekrarlar fareyle tutulup gün kutularına bırakıldığı anda; günlerin ısı haritası anında yeniden hesaplanır ve Excel'deki `Tekrar_Plani` sayfasına `row_index` üzerinden geri beslenir.
11. **Strict Date Serialization Invariant (Tarihleri Asla Metin Yazmama Doktrini):**  
    API'den veya dış kaynaktan gelen ISO tarihleri (`'2026-10-31'`) Excel'e `str` olarak yazıldığında; `=AVERAGEIFS()`, `=VLOOKUP(TODAY())` ve `=TODAY()-7` gibi sayısal tarih formülleri metin ile sayıyı karşılaştıramaz ve sessizce `0` veya `#DIV/0!` döndürür. Tarihler MUTLAK SURETLE Excel tamsayı seri numarası (`serial = (d - date(1899,12,30)).days`) olarak yazılmalı ve hücre formatı `NumberFormatLocal = 'gg.aa.yyyy'` olarak yapılandırılmalıdır.
12. **OpenPyXL extLst Yıkımı ve Cerrahi COM Enjeksiyonu (`com-surgical-mutator`):**  
    OpenPyXL, Excel 2010+ gelişmiş XML uzantılarını (`<extLst>`, `x14:conditionalFormattings`, veri çubukları, ikon setleri) desteklemez ve `wb.save()` anında sessizce siler. Bu nedenle `Tekrar_Takvimi` gibi modern biçimlendirme içeren çalışma kitaplarında `openpyxl.save()` KESİNLİKLE yasaktır. Senkronizasyon scriptleri görünmez (`Visible=False`, `DisplayAlerts=False`) headless Win32COM oturumuyla cerrahi hücre güncellemesi yapmalıdır.
13. **Dinamik Grafik Veri Bağlantısı ve Yardımcı Sütun (Helper Column) Standardı:**  
    Grafiklerin beslendiği alanlar (örn: `Parametreler_Ayar!K2:K5`) boş bırakılamaz; `redesign_dashboard.py` ve benzeri oluşturucularda `=COUNTIF(TickTick_Pomodoro!$G$6:$G$500, "*10+ Saat*")` gibi dinamik formüllerle doldurulmalıdır. Aksi takdirde halka/sütun grafikleri veri üretemez ve boş çizilir.
14. **Headless Formula Evaluation & 6 Anomali Kontratı Motoru:**  
    Statik QA doğrulayıcılar (`verifier.py`) yalnızca metinsel `#REF!` veya `#NAME?` aramasıyla sınırlı kalamaz. COM üzerinden `Application.CalculateFullRebuild()` işletilmeli; 6 Anomali Kontratı (Strict Date tamsayı kontrolü, Dashboard geri sayım Parametreler_Ayar referansı, Son Deneme dinamik XLOOKUP, TickTick XLOOKUP, Deneme K1:Z1 16 branş başlığı ve canlı sıfır formül hatası) otomatik test edilmelidir.
15. **Kanonik 16 Branş Taksonomisi, Hardlink Split-Brain Önleme ve XLOOKUP Regresyon Kilidi:**  
    DUS Temel (8) ve Klinik (8) branşları `data/canonical_branches.json` üzerinden tekil tutulur. Masaüstü ile repo arasındaki kopmayı önlemek için çift dosya yerine NTFS Hardlink (`mklink /H`) zorunludur. Entegrasyon scriptlerinde (`ticktick_sync.py`, `anki_sync.py`) başlık hücrelerine yazılan formüller mutlak suretle XLOOKUP olmalı; legacy VLOOKUP formüllerinin üzerine yazarak geriye dönüş (regression) yapması engellenmelidir.
16. **Bilişsel Kova Triyajı (Yeşil, Sarı, Kırmızı) ve Sıfır Overengineering Doktrini:**  
    220+ üniteyi klasik 1-3-7-15-30 gün mekanik tekrar kuyruklarına sokmak matematiksel yığılmaya ve sistem çöküşüne yol açar. Sistem tıptaki acil servis Triyaj mantığına geçirilmiştir:
    - **T+0 (İlk Kodlama)**: Ünite bitimi 10 soru (%20 adımlı örnekleme). T+3 günü hedeflenir.
    - **T+3 (Esas Soru)**: Kalan 40 soru çözülür.
      - **Yeşil Kova (≥%85 / 34+ doğru)**: Bilgi mühürlenmiştir. Tekrar sistemine DAHİL EDİLMEZ (Taburcu!). Takvimden ve kuyruktan düşer; sadece ders bittiğinde branş denemelerinde taranır.
      - **Sarı Kova (%70-%84 / 28-33 doğru)**: 14 gün sonrasına (T+14) 2. Soru Bankasından 20 soruluk doğrulama testi atanır. (≥%85 ise Yeşile mezun; <%70 ise Kırmızıya düşer).
      - **Kırmızı Kova (<%70 / ≤27 doğru)**: O haftanın Cumartesi gününe (Kova Onarım Bloğu: 25 dk aktif çalışma + 30 soru) atanır. (%80+ ise Sarıya terfi eder).
    - **Aritmetik Cumartesi Formülü**: Excel COM'da dil/bölge bağımlı `WEEKDAY` fonksiyonu yerine, Cumartesi hesabı `%100` saf tamsayı aritmetiğiyle (`$D5 + MOD(7 - MOD($D5, 7), 7)`) çözülür; böylece `#SPILL!`, syntax ve parser çökmeleri sıfırlanır.
    - **R1C1 Kolon Çakışmasını Önleyen Mutlak Satır Standardı**: Windows Türkçe Excel COM API'sinde tek başına `C5` gibi harf+sayı referansları R1C1 "Column 5" ($E:$E) olarak parse edilerek dizi taşması (`#TAŞMA!`) yaratabilir. Hücre formüllerinde mutlak suretle `$C{row}`, `$D{row}`, `$F{row}` formatı kullanılmalıdır.
