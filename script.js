/**
 * script.js - Logika Interaktif RajaWisata
 * Proyek Web Pariwisata Indonesia (Front-End Murni / Vanilla JS)
 * 
 * Modul Fitur:
 * 1. Navigasi & Hamburger Menu Responsive
 * 2. Highlight Menu Aktif Otomatis
 * 3. Pencarian & Filter Kategori Destinasi (destinasi.html)
 * 4. Render Destinasi Dinamis dari data.js
 * 5. Lightbox Galeri Foto (galeri.html)
 * 6. Form Booking Lengkap & Validasi (kontak.html)
 * 7. Manajemen Booking Saya di localStorage (booking.html)
 * 8. Integrasi Kirim Booking via WhatsApp
 */

// Nomor WhatsApp Admin RajaWisata (Format internasional Indonesia: 628...)
const WA_PHONE = '6282123075421';

// Kunci penyimpanan data di browser (localStorage)
const STORAGE_KEY = 'rajawisata_bookings';

/**
 * Helper: Format angka ke format mata uang Rupiah
 * Contoh: 750000 -> "Rp 750.000"
 */
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(angka || 0);
}

/**
 * Helper: Format tanggal ISO atau YYYY-MM-DD ke format Indonesia yang ramah dibaca
 * Contoh: "2026-11-20" -> "20 November 2026"
 */
function formatTanggalIndo(tanggalStr) {
    if (!tanggalStr) return '-';
    try {
        const parts = tanggalStr.split('-');
        if (parts.length === 3) {
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        return tanggalStr;
    } catch (e) {
        return tanggalStr;
    }
}

/**
 * ====================================================================
 * FITUR 1 & 2: RESPONSIVE NAVBAR, HAMBURGER MENU & MENU AKTIF
 * ====================================================================
 */
function initNavbar() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.querySelector('.nav-links');

    // Toggle menu hamburger di layar kecil
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('active');
            hamburgerBtn.classList.toggle('open', isOpen);
            hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Tutup menu hamburger jika pengguna mengklik area luar menu
        document.addEventListener('click', function (e) {
            if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                hamburgerBtn.classList.remove('open');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Tutup menu saat salah satu link diklik
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburgerBtn.classList.remove('open');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Highlight Menu Aktif berdasarkan nama file yang dibuka
    highlightActiveMenu();
}

function highlightActiveMenu() {
    // Mengambil nama file dari path URL saat ini (misal: "destinasi.html")
    const pathname = window.location.pathname;
    let currentFile = pathname.substring(pathname.lastIndexOf('/') + 1);

    // Jika dibuka di root tanpa nama file, arahkan ke index.html
    if (!currentFile || currentFile === '') {
        currentFile = 'index.html';
    }

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentFile) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * ====================================================================
 * FITUR 3 & 4: PENCARIAN & FILTER KATEGORI DESTINASI (destinasi.html)
 * ====================================================================
 */
function initDestinasiPage() {
    const destinasiContainer = document.getElementById('destinasiListContainer');
    const searchInput = document.getElementById('searchDestinasi');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Pastikan container destinasi ada di halaman ini
    if (!destinasiContainer) return;

    // Pastikan data destinasi tersedia dari data.js
    if (typeof destinasiData === 'undefined' || !Array.isArray(destinasiData)) {
        console.error('Data destinasi tidak ditemukan! Pastikan data.js dimuat sebelum script.js');
        return;
    }

    let activeCategory = 'Semua';
    let searchQuery = '';

    // Fungsi utama untuk memfilter dan me-render kartu destinasi
    function filterAndRender() {
        const cleanQuery = searchQuery.trim().toLowerCase();

        const filtered = destinasiData.filter(item => {
            // Filter Kategori
            const matchCategory = (activeCategory === 'Semua') || (item.kategori.toLowerCase() === activeCategory.toLowerCase());

            // Filter Pencarian (berdasarkan nama atau lokasi)
            const matchSearch = cleanQuery === '' ||
                item.nama.toLowerCase().includes(cleanQuery) ||
                item.lokasi.toLowerCase().includes(cleanQuery) ||
                item.kategori.toLowerCase().includes(cleanQuery);

            return matchCategory && matchSearch;
        });

        // Tampilkan hasil filter
        if (filtered.length === 0) {
            destinasiContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>Destinasi Tidak Ditemukan</h3>
                    <p>Maaf, tidak ada destinasi yang cocok dengan kata kunci "<strong>${escapeHtml(searchQuery)}</strong>"${activeCategory !== 'Semua' ? ' pada kategori ' + activeCategory : ''}.</p>
                    <button class="btn btn-sm btn-secondary" id="resetFilterBtn">Reset Filter & Pencarian</button>
                </div>
            `;

            const resetBtn = document.getElementById('resetFilterBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    activeCategory = 'Semua';
                    searchQuery = '';
                    if (searchInput) searchInput.value = '';
                    filterButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.getAttribute('data-kategori') === 'Semua');
                    });
                    filterAndRender();
                });
            }
            return;
        }

        // Render kartu-kartu destinasi
        destinasiContainer.innerHTML = filtered.map(item => `
            <div class="destinasi-card">
                <img src="${escapeHtml(item.gambar)}" alt="${escapeHtml(item.nama)}" loading="lazy">
                <div class="destinasi-info">
                    <div>
                        <div class="destinasi-header">
                            <h3>${escapeHtml(item.nama)}</h3>
                            <span class="destinasi-badge">${escapeHtml(item.kategori)}</span>
                        </div>
                        <p class="destinasi-meta"><strong>Lokasi:</strong> ${escapeHtml(item.lokasi)}</p>
                        <p class="destinasi-desc">${escapeHtml(item.deskripsi)}</p>
                    </div>
                    <div class="destinasi-footer">
                        <div class="destinasi-harga">
                            <span class="label-harga">Mulai dari</span>
                            <span class="nominal-harga">${formatRupiah(item.harga)} <span class="satuan">/ orang</span></span>
                        </div>
                        <a href="kontak.html?dest=${encodeURIComponent(item.id)}" class="btn">BOOK NOW!</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Event listener input pencarian (real-time saat mengetik)
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            searchQuery = e.target.value;
            filterAndRender();
        });
    }

    // Event listener tombol filter kategori
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            activeCategory = this.getAttribute('data-kategori') || 'Semua';
            filterAndRender();
        });
    });

    // Render awal seluruh destinasi
    filterAndRender();
}

/**
 * ====================================================================
 * FITUR 5: LIGHTBOX GALERI (galeri.html)
 * ====================================================================
 */
function initGalleryLightbox() {
    const galleryGrid = document.querySelector('.gallery-grid');
    const lightboxModal = document.getElementById('lightboxModal');

    if (!galleryGrid || !lightboxModal) return;

    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    // Ambil semua elemen foto di galeri
    const galleryItems = galleryGrid.querySelectorAll('.gallery-item');
    if (galleryItems.length === 0) return;

    let currentIndex = 0;

    // Fungsi untuk menampilkan foto pada indeks tertentu
    function showImage(index) {
        if (index < 0) {
            index = galleryItems.length - 1;
        } else if (index >= galleryItems.length) {
            index = 0;
        }

        currentIndex = index;
        const currentItem = galleryItems[currentIndex];
        const imgEl = currentItem.querySelector('img');
        const title = currentItem.getAttribute('data-title') || (imgEl ? imgEl.alt : '');
        const src = imgEl ? imgEl.getAttribute('src') : '';

        if (lightboxImg) {
            lightboxImg.src = src;
            lightboxImg.alt = title;
        }
        if (lightboxCaption) {
            lightboxCaption.textContent = title;
        }
        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentIndex + 1} dari ${galleryItems.length}`;
        }
    }

    // Fungsi membuka lightbox
    function openLightbox(index) {
        showImage(index);
        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Mencegah scrolling background
    }

    // Fungsi menutup lightbox
    function closeLightbox() {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Pasang klik pada setiap foto galeri
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    // Tombol Navigasi Next & Prev
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIndex + 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIndex - 1);
        });
    }

    // Tombol Tutup (X)
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });
    }

    // Tutup saat mengklik area gelap di luar foto
    lightboxModal.addEventListener('click', function (e) {
        if (e.target === lightboxModal || e.target.classList.contains('lightbox-content-box')) {
            closeLightbox();
        }
    });

    // Navigasi Keyboard: Esc untuk keluar, panah kiri/kanan untuk navigasi
    document.addEventListener('keydown', function (e) {
        if (!lightboxModal.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            showImage(currentIndex + 1);
        } else if (e.key === 'ArrowLeft') {
            showImage(currentIndex - 1);
        }
    });
}

/**
 * ====================================================================
 * FITUR 6 & 8: FORM BOOKING LENGKAP & INTEGRASI WHATSAPP (kontak.html)
 * ====================================================================
 */
function initBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const selectDestinasi = document.getElementById('destinasi');
    const inputJumlah = document.getElementById('jumlah');
    const inputTanggal = document.getElementById('tanggal');
    const inputNama = document.getElementById('nama');
    const inputEmail = document.getElementById('email');
    const inputPesan = document.getElementById('pesan');

    // Elemen kalkulasi harga & notifikasi
    const estimasiHargaSatuan = document.getElementById('estimasiHargaSatuan');
    const estimasiTotal = document.getElementById('estimasiTotal');
    const successBox = document.getElementById('successBox');
    const waLinkBtn = document.getElementById('waLinkBtn');
    const successDetail = document.getElementById('successDetail');

    if (!bookingForm) return;

    // 1. Populasi Dropdown Destinasi dari data.js
    if (selectDestinasi && typeof destinasiData !== 'undefined' && Array.isArray(destinasiData)) {
        selectDestinasi.innerHTML = destinasiData.map(item => `
            <option value="${escapeHtml(item.id)}" data-harga="${item.harga}">
                ${escapeHtml(item.nama)} - ${formatRupiah(item.harga)}/org (${escapeHtml(item.kategori)})
            </option>
        `).join('');
    }

    // 2. Baca Query String `?dest=...` dari URL jika dibuka dari tombol BOOK NOW! di destinasi.html
    const urlParams = new URLSearchParams(window.location.search);
    const destParam = urlParams.get('dest');
    if (destParam && selectDestinasi) {
        const matchingOption = Array.from(selectDestinasi.options).find(opt => opt.value.toLowerCase() === destParam.toLowerCase());
        if (matchingOption) {
            selectDestinasi.value = matchingOption.value;
        }
    }

    // 3. Batasi Tanggal Minimal ke Hari Ini (tidak boleh di masa lalu)
    if (inputTanggal) {
        const todayStr = new Date().toISOString().split('T')[0];
        inputTanggal.min = todayStr;
    }

    // 4. Kalkulasi Estimasi Total Harga Real-Time
    function updateEstimasiHarga() {
        if (!selectDestinasi || !inputJumlah) return;

        const selectedOption = selectDestinasi.options[selectDestinasi.selectedIndex];
        let hargaSatuan = 0;

        if (selectedOption) {
            hargaSatuan = parseInt(selectedOption.getAttribute('data-harga'), 10) || 0;
        }

        const jumlah = parseInt(inputJumlah.value, 10) || 0;
        const total = (jumlah > 0) ? (hargaSatuan * jumlah) : 0;

        if (estimasiHargaSatuan) {
            estimasiHargaSatuan.textContent = formatRupiah(hargaSatuan);
        }
        if (estimasiTotal) {
            estimasiTotal.textContent = formatRupiah(total);
        }

        return { hargaSatuan, jumlah, total };
    }

    if (selectDestinasi) selectDestinasi.addEventListener('change', updateEstimasiHarga);
    if (inputJumlah) {
        inputJumlah.addEventListener('input', updateEstimasiHarga);
        inputJumlah.addEventListener('change', updateEstimasiHarga);
    }

    // Jalankan kalkulasi awal
    updateEstimasiHarga();

    // 5. Validasi Form & Simpan ke localStorage
    bookingForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Bersihkan state error sebelumnya
        clearAllErrors();

        let isValid = true;

        // Validasi Nama Lengkap
        const namaVal = inputNama ? inputNama.value.trim() : '';
        if (!namaVal) {
            showError('nama', 'Nama lengkap wajib diisi.');
            isValid = false;
        } else if (namaVal.length < 3) {
            showError('nama', 'Nama terlalu singkat (minimal 3 karakter).');
            isValid = false;
        }

        // Validasi Format Email
        const emailVal = inputEmail ? inputEmail.value.trim() : '';
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
            showError('email', 'Alamat email wajib diisi.');
            isValid = false;
        } else if (!emailPattern.test(emailVal)) {
            showError('email', 'Format alamat email tidak valid (contoh: nama@domain.com).');
            isValid = false;
        }

        // Validasi Destinasi
        const destId = selectDestinasi ? selectDestinasi.value : '';
        const destObj = (typeof destinasiData !== 'undefined') ? destinasiData.find(d => d.id === destId) : null;
        if (!destId || !destObj) {
            showError('destinasi', 'Silakan pilih destinasi wisata.');
            isValid = false;
        }

        // Validasi Tanggal Perjalanan (tidak boleh kosong & tidak boleh di masa lalu)
        const tanggalVal = inputTanggal ? inputTanggal.value : '';
        if (!tanggalVal) {
            showError('tanggal', 'Tanggal perjalanan wajib dipilih.');
            isValid = false;
        } else {
            const selectedDate = new Date(tanggalVal);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                showError('tanggal', 'Tanggal perjalanan tidak boleh di masa lalu.');
                isValid = false;
            }
        }

        // Validasi Jumlah Wisatawan (minimal 1)
        const jumlahVal = inputJumlah ? parseInt(inputJumlah.value, 10) : 0;
        if (!jumlahVal || isNaN(jumlahVal) || jumlahVal < 1) {
            showError('jumlah', 'Jumlah wisatawan minimal 1 orang.');
            isValid = false;
        }

        // Jika form belum valid, batalkan proses
        if (!isValid) return;

        // Hitung total akhir
        const totalBiaya = destObj.harga * jumlahVal;
        const bookingId = 'RW-' + Date.now().toString().slice(-6);

        // Buat objek booking baru
        const newBooking = {
            id: bookingId,
            nama: namaVal,
            email: emailVal,
            destinasiId: destObj.id,
            destinasiNama: destObj.nama,
            destinasiLokasi: destObj.lokasi,
            tanggal: tanggalVal,
            jumlah: jumlahVal,
            hargaSatuan: destObj.harga,
            totalBiaya: totalBiaya,
            pesan: inputPesan ? inputPesan.value.trim() : '',
            waktuDibuat: new Date().toISOString()
        };

        // Simpan ke localStorage
        saveBookingToStorage(newBooking);

        // Siapkan pesan teks untuk WhatsApp
        const waMessageText = 
`*KONFIRMASI BOOKING RAJAWISATA*
----------------------------------------
*Kode Booking:* ${newBooking.id}
*Nama Pemesan:* ${newBooking.nama}
*Email:* ${newBooking.email}
*Destinasi:* ${newBooking.destinasiNama} (${newBooking.destinasiLokasi})
*Tanggal Perjalanan:* ${formatTanggalIndo(newBooking.tanggal)}
*Jumlah Wisatawan:* ${newBooking.jumlah} orang
*Total Biaya:* ${formatRupiah(newBooking.totalBiaya)}
${newBooking.pesan ? `*Catatan Tambahan:* ${newBooking.pesan}\n` : ''}----------------------------------------
Halo Admin RajaWisata, saya ingin mengonfirmasi pemesanan di atas. Terima kasih!`;

        // Format nomor WhatsApp: hilangkan karakter non-angka dan ganti awalan 0 menjadi 62 (Indonesia)
        let formattedPhone = WA_PHONE.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.slice(1);
        }

        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessageText)}`;

        // Tampilkan pesan sukses dan tombol WhatsApp
        if (successBox) {
            successBox.style.display = 'block';
            if (successDetail) {
                successDetail.innerHTML = `
                    Booking dengan kode <strong>${escapeHtml(newBooking.id)}</strong> untuk 
                    <strong>${escapeHtml(newBooking.destinasiNama)}</strong> (${newBooking.jumlah} orang) 
                    telah berhasil disimpan ke riwayat pemesanan Anda!
                `;
            }
            if (waLinkBtn) {
                waLinkBtn.href = waUrl;
            }
            successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Reset form input
        bookingForm.reset();
        if (inputJumlah) inputJumlah.value = '1';
        updateEstimasiHarga();
    });

    // Helper: Menampilkan pesan error pada field tertentu
    function showError(fieldId, message) {
        const formGroup = document.getElementById('group-' + fieldId);
        if (formGroup) {
            formGroup.classList.add('has-error');
            const errorEl = formGroup.querySelector('.error-message');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
            }
        }
    }

    // Helper: Membersihkan semua error
    function clearAllErrors() {
        const errorGroups = document.querySelectorAll('.form-group.has-error');
        errorGroups.forEach(group => {
            group.classList.remove('has-error');
            const errorEl = group.querySelector('.error-message');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });
    }

    // Hapus error saat input diubah oleh pengguna
    const allInputs = bookingForm.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', function () {
            const group = this.closest('.form-group');
            if (group && group.classList.contains('has-error')) {
                group.classList.remove('has-error');
                const err = group.querySelector('.error-message');
                if (err) err.style.display = 'none';
            }
        });
    });
}

/**
 * Helper localStorage: Simpan satu booking ke array
 */
function saveBookingToStorage(booking) {
    try {
        const existingData = getBookingsFromStorage();
        existingData.unshift(booking); // Masukkan di paling atas (terbaru)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
    } catch (e) {
        console.error('Gagal menyimpan booking ke localStorage:', e);
    }
}

/**
 * Helper localStorage: Mengambil seluruh booking
 */
function getBookingsFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Gagal membaca localStorage:', e);
        return [];
    }
}

/**
 * ====================================================================
 * FITUR 7: HALAMAN BOOKING SAYA (booking.html)
 * ====================================================================
 */
function initBookingListPage() {
    const bookingListContainer = document.getElementById('bookingListContainer');
    const btnClearAll = document.getElementById('btnClearAllBookings');

    if (!bookingListContainer) return;

    function renderBookings() {
        const bookings = getBookingsFromStorage();

        if (bookings.length === 0) {
            bookingListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>Belum Ada Booking</h3>
                    <p>Anda belum memiliki riwayat pemesanan destinasi wisata.</p>
                    <a href="destinasi.html" class="btn">JELAJAHI DESTINASI SEKARANG</a>
                </div>
            `;
            if (btnClearAll) btnClearAll.style.display = 'none';
            return;
        }

        if (btnClearAll) btnClearAll.style.display = 'inline-block';

        const tableRowsHtml = bookings.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${escapeHtml(item.nama)}</strong><br>
                    <small style="color: #7f8c8d;">${escapeHtml(item.email)}</small>
                </td>
                <td>
                    <span class="destinasi-name">${escapeHtml(item.destinasiNama)}</span><br>
                    <small style="color: #576574;">${escapeHtml(item.destinasiLokasi || '')}</small>
                </td>
                <td class="booking-date">${formatTanggalIndo(item.tanggal)}</td>
                <td>${item.jumlah} orang</td>
                <td class="total-price">${formatRupiah(item.totalBiaya)}</td>
                <td>
                    <button class="btn btn-sm btn-danger btn-delete-item" data-id="${escapeHtml(item.id)}">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');

        bookingListContainer.innerHTML = `
            <div class="table-responsive">
                <table class="booking-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Pemesan</th>
                            <th>Destinasi</th>
                            <th>Tanggal</th>
                            <th>Jumlah</th>
                            <th>Total Biaya</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        // Event listener untuk setiap tombol hapus per baris
        const deleteButtons = bookingListContainer.querySelectorAll('.btn-delete-item');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const idToDelete = this.getAttribute('data-id');
                const confirmDelete = confirm('Apakah Anda yakin ingin menghapus booking ini?');
                if (confirmDelete) {
                    deleteSingleBooking(idToDelete);
                }
            });
        });
    }

    // Fungsi menghapus satu item booking
    function deleteSingleBooking(id) {
        let bookings = getBookingsFromStorage();
        bookings = bookings.filter(b => b.id !== id);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
        } catch (e) {
            console.error('Gagal memperbarui localStorage:', e);
        }
        renderBookings();
    }

    // Tombol Hapus Semua
    if (btnClearAll) {
        btnClearAll.addEventListener('click', function () {
            const confirmAll = confirm('Apakah Anda yakin ingin menghapus SEMUA data booking? Tindakan ini tidak dapat dibatalkan.');
            if (confirmAll) {
                try {
                    localStorage.removeItem(STORAGE_KEY);
                } catch (e) {
                    console.error('Gagal mengosongkan localStorage:', e);
                }
                renderBookings();
            }
        });
    }

    // Render daftar saat halaman pertama kali dibuka
    renderBookings();
}

/**
 * Helper Keamanan: Menghindari XSS saat merender string ke HTML
 */
function escapeHtml(string) {
    if (string === null || string === undefined) return '';
    return String(string)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * ====================================================================
 * INISIALISASI SETELAH DOM SIAP
 * ====================================================================
 */
document.addEventListener('DOMContentLoaded', function () {
    // 1. Inisialisasi Navbar, Hamburger & Menu Aktif di semua halaman
    initNavbar();

    // 2. Inisialisasi Pencarian & Filter jika di halaman destinasi.html
    initDestinasiPage();

    // 3. Inisialisasi Lightbox jika di halaman galeri.html
    initGalleryLightbox();

    // 4. Inisialisasi Form Booking & WhatsApp jika di halaman kontak.html
    initBookingForm();

    // 5. Inisialisasi Daftar Riwayat Booking jika di halaman booking.html
    initBookingListPage();
});
