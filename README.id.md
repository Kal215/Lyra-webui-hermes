# Lyra Studio

Antarmuka web modern dan ruang kerja multi-agen untuk pengembangan AI otonom.

[Fitur](#fitur) • [Panduan Cepat](#panduan-cepat) • [Arsitektur Agen](#arsitektur-agen) • [Konfigurasi](#konfigurasi) • [English](README.md)

---

## Gambaran Umum

Lyra Studio adalah ruang kerja pengembang open-source yang dirancang untuk berinteraksi dengan LLM dan mengorkestrasi sistem multi-agen. Dibangun menggunakan Next.js dan Tailwind CSS, aplikasi ini menyediakan dua mode interaksi:

1. **Direct Chat (`/chat`)**: Streaming HTTP Server-Sent Events (SSE) langsung ke endpoint yang kompatibel dengan format OpenAI (OpenRouter, DeepSeek, Anthropic, OpenAI, Groq, Ollama). Tidak memerlukan runtime lokal atau dependensi CLI.
2. **Autonomous Studio (`/work`)**: Ruang kerja berbasis agen yang mendukung modifikasi berkas workspace, pemantauan eksekusi perkakas (tools), inspeksi penalaran (reasoning), dan koordinasi tugas secara real-time.

---

## Fitur

- **Direct Chat Tanpa Konfigurasi Rumit**: Mendukung streaming respons langsung dengan inspeksi penalaran model (`<think>`) dan format Markdown rapi.
- **Skuad Agen Spesialis Bawaan**: Menyediakan 9 peran agen spesialis dengan prompt sistem terarah (Engineer, Architect, Researcher, QA, Security, Verifier, Synthesizer).
- **Dukungan Multi-Provider**: Terhubung mudah ke berbagai penyedia cloud (OpenRouter, OpenAI, Anthropic, DeepSeek, Groq) maupun server inferensi lokal (Ollama, vLLM).
- **Workspace Interaktif**: Penjelajah berkas bawaan, penampil kode dengan penyorotan sintaks, dan penandaan konteks berkas.
- **Antarmuka Dwibahasa**: Dukungan penuh untuk Bahasa Indonesia dan Bahasa Inggris di seluruh tampilan.
- **Privasi Terjaga**: Kunci API dan konfigurasi lingkungan disimpan secara lokal di mesin pengguna dan diabaikan dari pelacakan git.

---

## Panduan Cepat

### Prasyarat
- Node.js 20.x atau lebih baru
- npm atau pnpm

### Instalasi

```bash
git clone https://github.com/Kal215/lyrav2.git
cd lyrav2/web
npm install
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

### Pengaturan API Key

1. Buka menu **Pengaturan** (`/settings`).
2. Pilih penyedia model Anda (OpenRouter, OpenAI, DeepSeek, Groq, atau Custom).
3. Masukkan API Key dan tentukan model default.
4. Klik **Simpan Konfigurasi**.

---

## Arsitektur Agen

Lyra Studio menyertakan persona spesialis bawaan untuk alur kerja pengembangan terstruktur:

| Peran | Pengenal | Fokus Utama |
| :--- | :--- | :--- |
| Senior Engineer | `Forge` (`coder`) | Implementasi fitur, refaktorisasi kode, eksekusi pengujian |
| System Architect | `Atlas` (`planner`) | Perancangan arsitektur, dekomposisi tugas, peta jalan sistem |
| Research Specialist | `Scout` (`researcher`) | Tinjauan dokumentasi, riset web, verifikasi fakta |
| QA Engineer | `Iris` (`qa`) | Analisis kasus tepi (edge-case), regresi, validasi alur |
| Security Officer | `Sentinel` (`security`) | Audit hak akses, pemindaian celah keamanan, isolasi rahasia |
| Verifier | `Nova` (`verifier`) | Validasi kriteria penerimaan tugas, verifikasi diff kode |
| Integration Lead | `Echo` (`synthesizer`) | Sintesis lintas agen, dokumentasi akhir, pelaporan terpadu |

---

## Struktur Proyek

```
web/
├── src/
│   ├── app/                 # Next.js App Router (chat, work, settings, memory, dll.)
│   │   ├── api/             # Rute API backend (chat-stream, settings, workspace)
│   │   ├── chat/            # Antarmuka chat dengan streaming & penalaran
│   │   ├── work/            # Studio otonom dengan feed perkakas & todo dinamis
│   │   └── settings/        # Pengaturan model & manajemen kredensial API
│   ├── components/          # Komponen UI modular (workspace, shell, sidebar)
│   ├── lib/                 # Utilitas inti, reasoning extractor, bootstrap profil
│   └── store/               # State store Zustand
```

---

## Lisensi

Lisensi MIT. Bebas digunakan untuk keperluan open-source, edukasi, maupun komersial.

---
*Dibuat oleh [M. Riskal Fadhilla] — Cloud DevOps & AI Integration Engineer.*
