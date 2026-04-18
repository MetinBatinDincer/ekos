import { useState } from 'react';
import { Settings, Server, Bell, Shield, Database, Wifi, Save } from 'lucide-react';

const SettingSection = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
    <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#10b98120' }}>
        <Icon size={16} className="text-emerald-400" />
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const ToggleSetting = ({ label, sub, defaultValue }) => {
  const [enabled, setEnabled] = useState(defaultValue);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white">{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{sub}</p>}
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className="w-11 h-6 rounded-full relative transition-all"
        style={{ background: enabled ? '#10b981' : '#334155' }}
      >
        <div
          className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
          style={{ left: enabled ? '26px' : '4px' }}
        />
      </button>
    </div>
  );
};

const InputSetting = ({ label, value, unit }) => (
  <div className="flex items-center justify-between gap-4">
    <p className="text-sm text-white flex-1">{label}</p>
    <div className="flex items-center gap-2">
      <input
        defaultValue={value}
        className="w-24 px-3 py-1.5 text-sm rounded-lg text-right outline-none"
        style={{ background: '#1a2540', border: '1px solid #334155', color: '#f1f5f9' }}
      />
      {unit && <span className="text-xs" style={{ color: '#64748b' }}>{unit}</span>}
    </div>
  </div>
);

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* System */}
        <SettingSection icon={Server} title="Sistem Konfigürasyonu">
          <InputSetting label="OCPP Versiyon" value="2.0.1" />
          <InputSetting label="Veri Güncelleme Aralığı" value="30" unit="saniye" />
          <InputSetting label="Anomali Eşik Skoru" value="0.50" />
          <InputSetting label="Tahmin Ufku" value="48" unit="saat" />
          <ToggleSetting label="Otomatik Model Yenileme" sub="Her 24 saatte model güncellenir" defaultValue={true} />
        </SettingSection>

        {/* Notifications */}
        <SettingSection icon={Bell} title="Bildirim Ayarları">
          <ToggleSetting label="Kritik Arıza Bildirimi" sub="Anlık SMS ve e-posta" defaultValue={true} />
          <ToggleSetting label="Uyarı Bildirimleri" sub="Yüksek anomali skoru" defaultValue={true} />
          <ToggleSetting label="Günlük Rapor E-postası" sub="Sabah 08:00" defaultValue={false} />
          <ToggleSetting label="Talep Artışı Uyarısı" sub="%20 üzeri beklenmez artış" defaultValue={true} />
          <InputSetting label="Bildirim E-postası" value="admin@ekos.tr" />
        </SettingSection>

        {/* AI Model */}
        <SettingSection icon={Database} title="AI Model Ayarları">
          <ToggleSetting label="Prophet + LightGBM Hibrit" sub="Enerji tahmin modeli" defaultValue={true} />
          <ToggleSetting label="LSTM Autoencoder" sub="Anomali tespit (Aşama 1)" defaultValue={true} />
          <ToggleSetting label="XGBoost Sınıflandırıcı" sub="Arıza tipi tespiti (Aşama 2)" defaultValue={true} />
          <ToggleSetting label="NLG Türkçe Açıklamalar" sub="AI kararlarının doğal dil açıklaması" defaultValue={true} />
          <InputSetting label="Model Güven Eşiği" value="0.75" />
        </SettingSection>

        {/* Security */}
        <SettingSection icon={Shield} title="Güvenlik">
          <ToggleSetting label="İki Faktörlü Doğrulama" defaultValue={false} />
          <ToggleSetting label="API Rate Limiting" defaultValue={true} />
          <ToggleSetting label="Audit Log" sub="Tüm işlemler kaydedilir" defaultValue={true} />
          <InputSetting label="Oturum Zaman Aşımı" value="30" unit="dakika" />
        </SettingSection>
      </div>

      {/* OCPP Connection status */}
      <div className="rounded-2xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={18} className="text-emerald-400" />
          <h3 className="font-semibold text-white">OCPP Bağlantı Durumu</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Protokol', value: 'OCPP 2.0.1', color: '#10b981' },
            { label: 'Bağlı İstasyon', value: '6/8', color: '#06b6d4' },
            { label: 'Mesaj Gecikmesi', value: '12 ms', color: '#10b981' },
            { label: 'Son Handshake', value: '30s önce', color: '#94a3b8' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3" style={{ background: '#1a2540' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white' }}
        >
          <Save size={16} />
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}
