import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

// Dictionary
const dictionary = {
  id: {
    dashboard: "Dasbor",
    consoles: "Unit",
    members: "Member",
    reports: "Laporan",
    settings: "Pengaturan",
    logout: "Keluar",
    welcome: "Selamat Datang Kembali",
    overview: "Dasbor",
    overview_subtitle: "Berikut ringkasan performa hari ini.",
    manage_units_desc: "Kelola unit console dan status rental.",
    manage_members_desc: "Kelola data pelanggan dan riwayat main.",
    active_consoles: "Unit Aktif",
    realtime_status: "Status Langsung",
    revenue: "Pendapatan",
    gross_revenue: "Pendapatan Kotor",
    duration: "Durasi Rental",
    total_duration_sub: "Total Durasi Harian",
    total_members: "Total Member",
    registered_sub: "Member Terdaftar",
    recent_tx: "Transaksi Terkini",
    no_tx: "Belum ada transaksi hari ini.",
    console_util: "Utilitas Console",
    add_unit: "Tambah",
    edit_unit: "Edit Unit",
    delete_unit: "Hapus Unit",
    console_name: "Nama Console",
    save: "Simpan",
    cancel: "Batal",
    delete_confirm: "Hapus item ini?",
    status: "Status",
    session_active: "Sesi Aktif",
    stop_session: "Stop Sesi",
    maintenance: "Perbaikan",
    under_maintenance: "Sedang Perbaikan",
    rent_unit: "Sewa Unit",
    select_member: "Pilih Member",
    duration_hrs: "Durasi (Jam)",
    cost: "Biaya",
    total: "Total",
    pay_method: "Metode Pembayaran",
    confirm_pay: "Konfirmasi",
    scan_qris: "Scan QRIS",
    paid_confirm: "Saya Sudah Bayar",
    ready_start: "Siap Dimulai?",
    start_session: "Mulai Sesi",
    search_placeholder: "Cari...",
    sort_name_asc: "Nama (A-Z)",
    sort_name_desc: "Nama (Z-A)",
    sort_playtime: "Terbanyak Main",
    sort_join: "Terlama Daftar",
    filter_all: "Semua Status",
    filter_avail: "Tersedia",
    filter_in_use: "Dipakai",
    add_member: "Tambah",
    edit_member: "Edit Member",
    full_name: "Nama Lengkap",
    phone: "No. HP",
    address: "Alamat",
    join_date: "Tanggal Bergabung",
    notes: "Catatan",
    total_play: "Total Main",
    bonus_balance: "Saldo Bonus",
    bonus_progress: "Progress Bonus",
    bonus_used: "Total Bonus Dipakai",
    history_tx: "Riwayat Transaksi",
    daily_recap: "Rekap Harian",
    all: "Semua",
    system_settings: "Pengaturan Sistem",
    config_subtitle: "Konfigurasi harga, perangkat keras, dan loyalty.",
    rate_and_bonus: "Tarif & Membership",
    hourly_rate: "Harga Rental Per Jam",
    rate_desc: "Harga dasar untuk perhitungan biaya rental.",
    bonus_target: "Target Bonus",
    bonus_desc: "Main X jam",
    reward: "Dapat Bonus",
    reward_desc: "Dapat Y jam",
    save_changes: "Simpan Perubahan",
    saved: "Berhasil Disimpan!",
    login_title: "Masuk Sistem",
    username: "Username",
    password: "Password",
    sign_in: "Masuk",
    access_denied: "Akses Ditolak: Khusus Admin.",
    unit_in_use: "Unit sedang digunakan. Selesaikan sesi terlebih dahulu.",
    no_data_consoles: "Belum ada unit console.",
    no_data_members: "Belum ada data member.",
    system_access: "Akses Sistem",
    membership: "Membership",
    membership_plan: "Jenis Membership",
    price_plan: "Harga Membership",
    active_status: "Status Aktif",
    general_settings: "Umum",
    membership_settings: "Konfigurasi Membership",
    bluetooth_settings: "Koneksi TV & Perangkat",
    bt_connected: "Terhubung ke TV Receiver",
    bt_disconnected: "Tidak Terhubung",
    connect_bt: "Hubungkan Bluetooth",
    disconnect_bt: "Putuskan Koneksi",
    bt_desc: "Hubungkan ke perangkat keras untuk mengontrol daya TV otomatis.",
    developer_info: "Tentang Pengembang",
    developed_by: "Dikembangkan oleh",
    contact_dev: "Hubungi Developer"
  },
  en: {
    dashboard: "Dashboard",
    consoles: "Units",
    members: "Members",
    reports: "Reports",
    settings: "Settings",
    logout: "Sign Out",
    welcome: "Welcome Back",
    overview: "Dashboard",
    overview_subtitle: "Here is today's performance summary.",
    manage_units_desc: "Manage consoles and rental status.",
    manage_members_desc: "Manage customers and play history.",
    active_consoles: "Active Units",
    realtime_status: "Real-time Status",
    revenue: "Revenue",
    gross_revenue: "Gross Revenue",
    duration: "Duration",
    total_duration_sub: "Total Daily Duration",
    total_members: "Total Members",
    registered_sub: "Registered",
    recent_tx: "Recent Transactions",
    no_tx: "No transactions today.",
    console_util: "Console Utility",
    add_unit: "Add",
    edit_unit: "Edit Unit",
    delete_unit: "Delete Unit",
    console_name: "Console Name",
    save: "Save",
    cancel: "Cancel",
    delete_confirm: "Delete this item?",
    status: "Status",
    session_active: "Session Active",
    stop_session: "Stop Session",
    maintenance: "Maintenance",
    under_maintenance: "Under Maintenance",
    rent_unit: "Rent Unit",
    select_member: "Select Member",
    duration_hrs: "Duration (Hrs)",
    cost: "Cost",
    total: "Total",
    pay_method: "Payment Method",
    confirm_pay: "Confirm",
    scan_qris: "Scan QRIS",
    paid_confirm: "I Have Paid",
    ready_start: "Ready to Start?",
    start_session: "Start Session",
    search_placeholder: "Search...",
    sort_name_asc: "Name (A-Z)",
    sort_name_desc: "Name (Z-A)",
    sort_playtime: "Most Playtime",
    sort_join: "Oldest Joined",
    filter_all: "All Status",
    filter_avail: "Available",
    filter_in_use: "In Use",
    add_member: "Add",
    edit_member: "Edit Member",
    full_name: "Full Name",
    phone: "Phone No.",
    address: "Address",
    join_date: "Join Date",
    notes: "Notes",
    total_play: "Total Playtime",
    bonus_balance: "Bonus Balance",
    bonus_progress: "Bonus Progress",
    bonus_used: "Total Bonus Used",
    history_tx: "Transaction History",
    daily_recap: "Daily Recap",
    all: "All",
    system_settings: "System Settings",
    config_subtitle: "Configure pricing and loyalty rules.",
    rate_and_bonus: "Rates & Membership",
    hourly_rate: "Hourly Rate",
    rate_desc: "Base price for rental calculation.",
    bonus_target: "Bonus Target",
    bonus_desc: "Play X hours",
    reward: "Reward",
    reward_desc: "Get Y hours",
    save_changes: "Save Changes",
    saved: "Saved Successfully!",
    login_title: "System Login",
    username: "Username",
    password: "Password",
    sign_in: "Sign In",
    access_denied: "Access Denied: Admin only.",
    unit_in_use: "Unit is currently in use. Please stop session first.",
    no_data_consoles: "No console units found.",
    no_data_members: "No members found.",
    system_access: "System Access",
    membership: "Membership",
    membership_plan: "Membership Plan",
    price_plan: "Membership Price",
    active_status: "Active Status",
    general_settings: "General",
    membership_settings: "Membership Config",
    bluetooth_settings: "TV & Device Connection",
    bt_connected: "Connected to TV Receiver",
    bt_disconnected: "Not Connected",
    connect_bt: "Connect Bluetooth",
    disconnect_bt: "Disconnect",
    bt_desc: "Connect to hardware to control TV power automatically.",
    developer_info: "Developer Info",
    developed_by: "Developed by",
    contact_dev: "Contact Developer"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof dictionary['id']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  useEffect(() => {
    const saved = localStorage.getItem('ziezan_lang') as Language;
    if (saved) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ziezan_lang', lang);
  };

  const t = (key: keyof typeof dictionary['id']) => {
    return dictionary[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};