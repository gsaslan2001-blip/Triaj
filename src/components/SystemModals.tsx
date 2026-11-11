/**
 * DUS 2027 Excel-to-App Mimari Kılavuzu:
 * - Sekme 14: Parametreler_Ayar (Sistem Genel Ayarları - SSOT Modalı)
 * - Sekme 15: Giris_Rehberi (Sarı Hücre Veri Giriş Kuralları & Mimari Kılavuz Çekmecesi)
 */

import React, { useState } from 'react';
import { useDUS } from '../context/DUSContext';
import { X, Sliders, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

export const SystemParametersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { systemParams, updateSystemParams } = useDUS();

  const [examDate, setExamDate] = useState(systemParams.examDate);
  const [targetBasicNet, setTargetBasicNet] = useState(systemParams.targetBasicNet);
  const [targetClinicalNet, setTargetClinicalNet] = useState(systemParams.targetClinicalNet);
  const [adccEliteThreshold, setAdccEliteThreshold] = useState(systemParams.adccEliteThreshold);
  const [targetFsrsRetention, setTargetFsrsRetention] = useState(systemParams.targetFsrsRetention);
  const [dailyUnitCapacity, setDailyUnitCapacity] = useState(systemParams.dailyUnitCapacity);
  const [wBilgi, setWBilgi] = useState(systemParams.errorWeights.Bilgi);
  const [wMuhakeme, setWMuhakeme] = useState(systemParams.errorWeights.Muhakeme);
  const [wDikkat, setWDikkat] = useState(systemParams.errorWeights.Dikkat);
  const [wCeldirici, setWCeldirici] = useState(systemParams.errorWeights.Çeldirici);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number((targetBasicNet + targetClinicalNet).toFixed(2));
    updateSystemParams({
      examDate,
      targetBasicNet,
      targetClinicalNet,
      targetTotalNet: total,
      adccEliteThreshold,
      targetFsrsRetention,
      dailyUnitCapacity,
      errorWeights: {
        Bilgi: wBilgi,
        Muhakeme: wMuhakeme,
        Dikkat: wDikkat,
        Çeldirici: wCeldirici
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sekme 14: Parametreler_Ayar (Sistem Genel Ayarları — SSOT)
              </h3>
              <p className="text-xs text-slate-500">
                Proje Sahibi: {systemParams.ownerName} ({systemParams.ownerRole})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">DUS Sınav Tarihi</label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hedef Temel Net (≤40)
              </label>
              <input
                type="number"
                step="0.5"
                min={10}
                max={40}
                value={targetBasicNet}
                onChange={e => setTargetBasicNet(parseFloat(e.target.value) || 36)}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hedef Klinik Net (≤80)
              </label>
              <input
                type="number"
                step="0.5"
                min={20}
                max={80}
                value={targetClinicalNet}
                onChange={e => setTargetClinicalNet(parseFloat(e.target.value) || 72)}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ADÇC Elit Barajı
              </label>
              <input
                type="number"
                step="1"
                value={adccEliteThreshold}
                onChange={e => setAdccEliteThreshold(parseFloat(e.target.value) || 100)}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hedef FSRS Retention %
              </label>
              <input
                type="number"
                step="0.5"
                value={targetFsrsRetention}
                onChange={e => setTargetFsrsRetention(parseFloat(e.target.value) || 90)}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Günlük Tekrar Kapasitesi
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={dailyUnitCapacity}
                onChange={e => setDailyUnitCapacity(parseInt(e.target.value, 10) || 5)}
                className="w-full px-2.5 py-1.5 bg-yellow-50 border border-yellow-400 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-900">
              SWSPS Bilişsel Hata Tipi Ağırlık Katsayıları (W_HataTipi)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Çeldirici Tuzağı</label>
                <input
                  type="number"
                  step="0.05"
                  value={wCeldirici}
                  onChange={e => setWCeldirici(parseFloat(e.target.value) || 1.4)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Muhakeme Hatası</label>
                <input
                  type="number"
                  step="0.05"
                  value={wMuhakeme}
                  onChange={e => setWMuhakeme(parseFloat(e.target.value) || 1.25)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Bilgi Eksikliği</label>
                <input
                  type="number"
                  step="0.05"
                  value={wBilgi}
                  onChange={e => setWBilgi(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Soru Kökü / Dikkat</label>
                <input
                  type="number"
                  step="0.05"
                  value={wDikkat}
                  onChange={e => setWDikkat(parseFloat(e.target.value) || 0.8)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="font-mono font-bold text-indigo-700">
              Hesaplanan Toplam Hedef Net: {(targetBasicNet + targetClinicalNet).toFixed(1)} / 120.0
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
              >
                SSOT Parametrelerini Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const GirisRehberiModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sekme 15: Giris_Rehberi — Veri Giriş Kuralları &amp; Mimari Rehber
              </h3>
              <p className="text-xs text-slate-500">
                DUS 2027 Stratejik Yönetim Sistemi — Excel-to-App Operasyon Standardı
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-700 max-h-[65vh] overflow-y-auto pr-1">
          <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Altın Kural: Yalnızca Açık Sarı Hücrelere Veri Girilir!</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Sistemdeki tüm gri/beyaz metrik alanları (T+3 tarihi, Kova rengi, T+14 randevusu, SWSPS ceza puanı, soru başı hız sn/soru ve ADÇC baraj statüsü) formüllerle otomatik hesaplanır.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">1. Ebbinghaus Kova Triyajı (Sekme 2-6)</div>
              <p className="text-[11px] text-slate-600">
                T+0 gününde konu çalışılır + 20 soru çözülür (buradaki istatistik kova belirlemez!). 3 gün sonra (T+3) 40 soruluk esas testte &ge;34 Doğru (&ge;%85) Yeşil Kovaya taburcu edilir ve bir daha tekrar sırasına girmez; 28-33 Doğru Sarı Kovaya (T+14); &le;27 Doğru Kırmızı Kovaya (Cumartesi Onarım) atanır.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">2. 5 Kademeli Takvim &amp; Sürükle-Bırak</div>
              <p className="text-[11px] text-slate-600">
                Takvim sekmesinde yoğun günler (5+ görev = Mercan Kırmızı) üzerindeki görev çiplerini fareyle tutup boş günlere (Beyaz/Yeşil) bırakarak görev yükünüzü dengeleyin.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">3. SWSPS Bilişsel Ceza Skoru (Sekme 9-10)</div>
              <p className="text-[11px] text-slate-600">
                Deneme ve soru bankalarındaki yanlışlar; Hata Tipi (Çeldirici 1.4x, Muhakeme 1.25x), Tekrar Sayısı, FSRS Zorluk (D) ve Unutma Riski (1-R) ile çarpılarak aciliyet sırasına dizilir.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">4. 16 Branş Deneme &amp; Hız Kronometresi</div>
              <p className="text-[11px] text-slate-600">
                Deneme &amp; SWSPS sekmesinde 16 branşın Spider/Radar grafiğini izleyin ve soru çözerken canlı kronometreyi başlatarak 50-60 sn/soru DUS temposunu koruyun.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Anlaşıldı, Komuta Merkezine Dön</span>
          </button>
        </div>
      </div>
    </div>
  );
};
