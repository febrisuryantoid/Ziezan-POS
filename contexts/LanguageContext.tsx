
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

// Dictionary
const dictionary = {
  id: {
    // --- GENERAL ---
    dashboard: "Dasbor",
    consoles: "Console",
    members: "Member",
    reports: "Laporan",
    settings: "Pengaturan",
    logout: "Keluar",
    welcome: "Selamat Datang Kembali",
    back: "Kembali",
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    edit: "Edit",
    search_placeholder: "Cari...",
    all: "Semua",
    unknown: "Tidak Diketahui",
    jam: "Jam",
    
    // --- LANDING PAGE ---
    landing_subtitle: "Sistem Rental PlayStation",
    login_btn: "Masuk",
    admin_access: "Akses Admin",
    admin_access_desc: "Akses dashboard pengelola untuk manajemen unit, member, dan keuangan.",
    tv_mode: "Mode TV",
    open_monitor: "Buka Monitor",
    tv_mode_desc: "Tampilan layar penuh untuk monitor pelanggan dengan timer real-time.",
    rank_btn: "Rank",
    view_board: "Lihat Papan",
    rank_desc: "Lihat leaderboard top player, statistik bermain, dan pencapaian member.",
    system_version: "Sistem Ziezan Station v1.1.0",

    // --- LOGIN ---
    login_title: "Masuk Sistem",
    username: "Username",
    password: "Password",
    enter_username: "Masukkan username...",
    enter_password: "Masukkan password...",
    sign_in: "Masuk",
    invalid_login: "Username atau password salah.",

    // --- DASHBOARD ---
    overview_subtitle: "Berikut ringkasan performa hari ini.",
    active_consoles: "Console Aktif",
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
    no_data_consoles: "Belum ada data console.",
    unit: "Unit",
    status: "Status",
    hour_short: "Jam",

    // --- CONSOLES ---
    manage_units_desc: "Kelola unit console dan status rental.",
    sort_name_asc: "Nama (A-Z)",
    sort_name_desc: "Nama (Z-A)",
    sort_usage_desc: "Terbanyak Dipakai",
    filter_all: "Semua Status",
    filter_avail: "Tersedia",
    filter_in_use: "Dipakai",
    add_unit: "Tambah Console",
    edit_unit: "Edit Console", 
    session_active: "Sesi Aktif",
    maintenance: "Perbaikan",
    available_status: "TERSEDIA",
    ready_to_play: "Siap Bermain",
    elapsed: "Jalan",
    remaining: "Sisa",
    start_session: "Mulai Sesi",
    stop_session: "Stop",
    repair_mode: "Mode Perbaikan",
    repair_done: "Selesai Perbaikan",
    under_repair: "UNDER REPAIR",
    unit_in_use: "Console sedang digunakan. Selesaikan sesi terlebih dahulu.",
    console_added: "Console Ditambahkan",
    console_updated: "Console Diperbarui",
    console_deleted: "Console Dihapus",
    delete_confirm: "Hapus item ini?",
    delete_console_msg: "Anda akan menghapus console {name} secara permanen.",
    yes_delete: "Ya, Hapus",
    console_name: "Nama Console",
    console_name_placeholder: "misal: PlayStation 5 - No 01",
    
    // --- RENTAL MODAL ---
    new_rental_session: "Sesi Rental Baru",
    select_member: "Pilih Member",
    member_selected: "MEMBER TERPILIH",
    member_not_found: "Member tidak ditemukan.",
    add_new: "Tambah Baru",
    duration_hrs: "Durasi (Jam)",
    normal_price: "Harga Normal",
    use_bonus: "Pakai Bonus",
    total_bill: "Total Tagihan",
    pay_cash: "TUNAI (CASH)",
    scan_to_pay: "Scan untuk Bayar",
    waiting_payment: "Sistem menunggu konfirmasi pembayaran...",
    ready_start: "Siap Dimulai?",
    ready_start_desc: "Data tersimpan. Timer akan segera diaktifkan.",
    next_payment: "Lanjut Pembayaran",
    paid_confirm: "Saya Sudah Bayar",
    confirm_pay: "Konfirmasi",

    // --- CHECKOUT MODAL ---
    checkout_session: "Checkout Sesi",
    finish_payment: "Selesaikan Pembayaran",
    rental_duration: "Durasi Rental",
    base_cost: "Biaya Dasar",
    extra_cafe: "Tambahan / Cafe",
    final_total: "Total Akhir",
    payment_settlement: "Metode Pelunasan",
    finish_save: "Selesaikan & Simpan",
    session_ended_toast: "Sesi Selesai",
    cash: "Tunai",
    
    // --- MEMBERS ---
    manage_members_desc: "Kelola data pelanggan dan riwayat main.",
    sort_playtime: "Terbanyak Main",
    sort_join: "Terlama Daftar",
    active_status: "Status Aktif",
    no_data_members: "Belum ada data member.",
    play_stat: "Main",
    bonus_stat: "Bonus",
    add_member: "Tambah Member",
    edit_member: "Edit Member",
    full_name: "Nama Lengkap",
    nickname: "Nickname",
    phone_number: "Nomor HP",
    address: "Alamat",
    membership: "Membership",
    join_date: "Tanggal Bergabung",
    dob: "Tanggal Lahir",
    upload_gallery: "Upload Galeri",
    photo_member: "Foto Member",
    member_added: "Member Ditambahkan",
    member_updated: "Data Diperbarui",
    member_deleted: "Member Dihapus",
    delete_member_msg: "Data member akan dihapus dari seluruh record transaksi.",
    link_copied: "Link Disalin",
    verified_member: "Member Terverifikasi",
    total_play: "Total Main",
    bonus_balance: "Saldo Bonus",
    joined: "Bergabung",
    riwayat_aktivitas: "Riwayat Aktivitas",
    no_activity_history: "Belum ada aktivitas.",

    // --- REPORTS ---
    audit_desc: "Audit Keuangan & Sesi Terminal",
    history_tx: "Riwayat Transaksi",
    rows: "Baris:",
    tx_time: "Waktu Transaksi",
    member_identity: "Identitas Member",
    unit_used: "Unit Terpakai",
    method: "Metode",
    nominal: "Nominal",
    print: "Cetak",
    jam_main: "Jam Main",
    export_csv: "Export CSV",
    select_print_method: "Pilih Metode Cetak",
    wifi_pdf: "Wi-Fi / PDF",
    standard_pc: "Standard PC Print",
    thermal_mobile: "Thermal Mobile Printer",
    bluetooth: "Bluetooth",
    
    // --- SETTINGS ---
    system_settings: "Pengaturan Sistem",
    general_settings: "Umum & Tarif",
    config_subtitle: "Konfigurasi harga, perangkat keras, dan loyalty.",
    business_profile: "Profil Bisnis",
    id_card_rental: "Kartu Identitas Rental",
    upload_data: "Upload Data",
    direct_url: "Direct URL Image",
    business_name: "Nama Bisnis",
    full_address: "Alamat Lengkap",
    rate_and_bonus: "Tarif & Membership",
    profit_loyalty: "Perhitungan Profit & Loyalty",
    hourly_rate: "Harga Rental Per Jam",
    base_price_desc: "Base Terminal Price",
    birthday_bonus: "Bonus Ulang Tahun",
    auto_reward_desc: "Auto Reward System",
    tv_connectivity: "Konektivitas TV",
    iot_infra: "Infrastruktur IoT",
    cloud_link_desc: "Otomatis Aktif. Kontrol TV via Internet/Wi-Fi.",
    online: "ONLINE",
    bluetooth_settings: "Pengaturan Bluetooth",
    bt_desc: "Hubungkan ke perangkat keras untuk mengontrol daya TV otomatis.",
    connect_bt: "Hubungkan Bluetooth",
    disconnect_bt: "Putuskan Koneksi",
    data_management: "Manajemen Data",
    integrity_db: "Integritas Database",
    smart_cloud_opt: "Smart Cloud Optimizer",
    keep_data_duration: "Simpan Data Cloud Selama:",
    days_30_save: "30 Hari (Hemat)",
    days_90: "90 Hari (3 Bulan)",
    days_365: "1 Tahun",
    forever: "Selamanya",
    manual_backup: "Manual Offline Backup",
    backup_restore_desc: "Gunakan fitur ini untuk memindahkan data antar perangkat.\n1. Backup data di perangkat lama.\n2. Kirim file .json ke perangkat baru.\n3. Restore di perangkat baru.",
    invalid_file: "File Tidak Valid",
    download_data: "Download Data",
    membership_settings: "Konfigurasi Membership",
    ranking_hierarchy: "Ranking & Hierarchy",
    annual_reset: "Annual Season Reset",
    reset_desc: "Reset perulangan musim & ranking",
    reset_season_btn: "RESET SEASON",
    xp_req: "Syarat XP",
    bonus_target: "Target Bonus",
    reward: "Reward",
    save_changes: "Simpan Perubahan",
    saved: "Berhasil Disimpan!",
    
    // --- LEADERBOARD ---
    leaderboard_title: "Papan Juara",
    season_label: "Musim",
    resets_in: "Reset dalam 28 Hari",
    search_player: "Cari Teman...",
    challengers_title: "Penantang",
    no_challengers: "Belum ada penantang",
    playing: "Playing",
    
    // --- TV RECEIVER ---
    session_ended: "SESI BERAKHIR",
    tv_select_unit: "Pilih console yang mewakili layar TV ini:",
    tv_no_consoles: "Tidak ada console ditemukan. Silakan atur di Aplikasi Mobile.",
    
    // --- PUBLIC CARD ---
    member_not_found_title: "Member Tidak Ditemukan",
    member_not_found_desc: "Maaf, data member tidak ditemukan atau belum disinkronkan.",
    back_home: "Kembali ke Beranda",
    live_status: "LAGI MAIN",
  },
  en: {
    // --- GENERAL ---
    dashboard: "Dashboard",
    consoles: "Consoles",
    members: "Members",
    reports: "Reports",
    settings: "Settings",
    logout: "Sign Out",
    welcome: "Welcome Back",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search_placeholder: "Search...",
    all: "All",
    unknown: "Unknown",
    jam: "Hours",

    // --- LANDING PAGE ---
    landing_subtitle: "PlayStation Rental System",
    login_btn: "Sign In",
    admin_access: "Admin Access",
    admin_access_desc: "Access dashboard to manage units, members, and finance.",
    tv_mode: "TV Mode",
    open_monitor: "Open Monitor",
    tv_mode_desc: "Full screen display for customer monitor with real-time timer.",
    rank_btn: "Rank",
    view_board: "View Board",
    rank_desc: "View top player leaderboard, play stats, and achievements.",
    system_version: "Ziezan Station System v1.1.0",

    // --- LOGIN ---
    login_title: "System Login",
    username: "Username",
    password: "Password",
    enter_username: "Enter username...",
    enter_password: "Enter password...",
    sign_in: "Sign In",
    invalid_login: "Invalid username or password.",

    // --- DASHBOARD ---
    overview_subtitle: "Here is today's performance summary.",
    active_consoles: "Active Consoles",
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
    no_data_consoles: "No consoles found.",
    unit: "Unit",
    status: "Status",
    hour_short: "Hr",

    // --- CONSOLES ---
    manage_units_desc: "Manage consoles and rental status.",
    sort_name_asc: "Name (A-Z)",
    sort_name_desc: "Name (Z-A)",
    sort_usage_desc: "Most Used",
    filter_all: "All Status",
    filter_avail: "Available",
    filter_in_use: "In Use",
    add_unit: "Add Console",
    edit_unit: "Edit Console",
    session_active: "Session Active",
    maintenance: "Maintenance",
    available_status: "AVAILABLE",
    ready_to_play: "Ready to Play",
    elapsed: "Elapsed",
    remaining: "Left",
    start_session: "Start Session",
    stop_session: "Stop",
    repair_mode: "Repair Mode",
    repair_done: "Repair Done",
    under_repair: "UNDER REPAIR",
    unit_in_use: "Console is currently in use. Please stop session first.",
    console_added: "Console Added",
    console_updated: "Console Updated",
    console_deleted: "Console Deleted",
    delete_confirm: "Delete this item?",
    delete_console_msg: "You are about to permanently delete console {name}.",
    yes_delete: "Yes, Delete",
    console_name: "Console Name",
    console_name_placeholder: "e.g. PlayStation 5 - Unit 01",

    // --- RENTAL MODAL ---
    new_rental_session: "New Rental Session",
    select_member: "Select Member",
    member_selected: "MEMBER SELECTED",
    member_not_found: "Member not found.",
    add_new: "Add New",
    duration_hrs: "Duration (Hours)",
    normal_price: "Normal Price",
    use_bonus: "Use Bonus",
    total_bill: "Total Bill",
    pay_cash: "CASH",
    scan_to_pay: "Scan to Pay",
    waiting_payment: "System waiting for payment confirmation...",
    ready_start: "Ready to Start?",
    ready_start_desc: "Data saved. Timer will start shortly.",
    next_payment: "Proceed to Payment",
    paid_confirm: "I Have Paid",
    confirm_pay: "Confirm",

    // --- CHECKOUT MODAL ---
    checkout_session: "Checkout Session",
    finish_payment: "Complete Payment",
    rental_duration: "Rental Duration",
    base_cost: "Base Cost",
    extra_cafe: "Extras / Cafe",
    final_total: "Final Total",
    payment_settlement: "Settlement Method",
    finish_save: "Finish & Save",
    session_ended_toast: "Session Ended",
    cash: "Cash",

    // --- MEMBERS ---
    manage_members_desc: "Manage customers and play history.",
    sort_playtime: "Most Playtime",
    sort_join: "Oldest Joined",
    active_status: "Active Status",
    no_data_members: "No members found.",
    play_stat: "Play",
    bonus_stat: "Bonus",
    add_member: "Add Member",
    edit_member: "Edit Member",
    full_name: "Full Name",
    nickname: "Nickname",
    phone_number: "Phone Number",
    address: "Address",
    membership: "Membership",
    join_date: "Join Date",
    dob: "Date of Birth",
    upload_gallery: "Upload Gallery",
    photo_member: "Member Photo",
    member_added: "Member Added",
    member_updated: "Data Updated",
    member_deleted: "Member Deleted",
    delete_member_msg: "Member data will be deleted from all transaction records.",
    link_copied: "Link Copied",
    verified_member: "Verified Member",
    total_play: "Total Play",
    bonus_balance: "Bonus Balance",
    joined: "Joined",
    riwayat_aktivitas: "Activity History",
    no_activity_history: "No activity history yet.",

    // --- REPORTS ---
    audit_desc: "Financial Audit & Terminal Sessions",
    history_tx: "Transaction History",
    rows: "Rows:",
    tx_time: "Transaction Time",
    member_identity: "Member Identity",
    unit_used: "Unit Used",
    method: "Method",
    nominal: "Amount",
    print: "Print",
    jam_main: "Hrs Played",
    export_csv: "Export CSV",
    select_print_method: "Select Print Method",
    wifi_pdf: "Wi-Fi / PDF",
    standard_pc: "Standard PC Print",
    thermal_mobile: "Thermal Mobile Printer",
    bluetooth: "Bluetooth",

    // --- SETTINGS ---
    system_settings: "System Settings",
    general_settings: "General & Rates",
    config_subtitle: "Configure pricing, hardware, and loyalty.",
    business_profile: "Business Profile",
    id_card_rental: "Rental Identity Card",
    upload_data: "Upload Data",
    direct_url: "Direct URL Image",
    business_name: "Business Name",
    full_address: "Full Address",
    rate_and_bonus: "Rates & Membership",
    profit_loyalty: "Profit & Loyalty Calculation",
    hourly_rate: "Hourly Rental Rate",
    base_price_desc: "Base Terminal Price",
    birthday_bonus: "Birthday Bonus",
    auto_reward_desc: "Auto Reward System",
    tv_connectivity: "TV Connectivity",
    iot_infra: "IoT Infrastructure",
    cloud_link_desc: "Automatically Active. Control TV via Internet/Wi-Fi.",
    online: "ONLINE",
    bluetooth_settings: "Bluetooth Settings",
    bt_desc: "Connect hardware to control TV power automatically.",
    connect_bt: "Connect Bluetooth",
    disconnect_bt: "Disconnect",
    data_management: "Data Management",
    integrity_db: "Database Integrity",
    smart_cloud_opt: "Smart Cloud Optimizer",
    keep_data_duration: "Keep Cloud Data For:",
    days_30_save: "30 Days (Save Space)",
    days_90: "90 Days (3 Months)",
    days_365: "1 Year",
    forever: "Forever",
    manual_backup: "Manual Offline Backup",
    backup_restore_desc: "Use this to move data between devices.\n1. Backup on old device.\n2. Send .json file to new device.\n3. Restore on new device.",
    invalid_file: "Invalid File",
    download_data: "Download Data",
    membership_settings: "Membership Config",
    ranking_hierarchy: "Ranking & Hierarchy",
    annual_reset: "Annual Season Reset",
    reset_desc: "Reset season loop & ranking",
    reset_season_btn: "RESET SEASON",
    xp_req: "XP Req",
    bonus_target: "Bonus Target",
    reward: "Reward",
    save_changes: "Save Changes",
    saved: "Saved Successfully!",

    // --- LEADERBOARD ---
    leaderboard_title: "Leaderboard",
    season_label: "Season",
    resets_in: "Resets in 28 Days",
    search_player: "Search Friend...",
    challengers_title: "Challengers",
    no_challengers: "No challengers yet",
    playing: "Playing",

    // --- TV RECEIVER ---
    session_ended: "SESSION ENDED",
    tv_select_unit: "Select console representing this TV screen:",
    tv_no_consoles: "No consoles found. Please configure in Mobile App.",

    // --- PUBLIC CARD ---
    member_not_found_title: "Member Not Found",
    member_not_found_desc: "Sorry, member data not found or not synced.",
    back_home: "Back to Home",
    live_status: "LIVE PLAY",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof dictionary['id'], params?: Record<string, string | number>) => string;
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

  const t = (key: keyof typeof dictionary['id'], params?: Record<string, string | number>) => {
    let text = dictionary[language][key];
    if (!text) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
    }
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
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
