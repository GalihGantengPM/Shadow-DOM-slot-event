"use strict";

/* =============================================================
   SCRIPT.JS — Modul 11 & 12 (Event Delegation & LocalStorage)
   NIM / Nama : 255314023 / William Galih Wisanggeni
   ============================================================= */

const BASE = "https://jsonplaceholder.typicode.com";

/* ===================== Toggle Info Tambahan ===================== */
const tombolInfo = document.querySelector("#btn-info");
const kotakAside = document.querySelector("aside");
if (tombolInfo && kotakAside) {
  tombolInfo.addEventListener("click", () => {
    kotakAside.classList.toggle("tersembunyi");
  });
}

/* ===================== Event Delegation pada <daftar-artikel> ===================== */
const wadahArtikel = document.querySelector(".daftar-artikel");

function ambilLike() { return JSON.parse(localStorage.getItem("semuaLike_galih")) || {}; }
function simpanLike(obj) { localStorage.setItem("semuaLike_galih", JSON.stringify(obj)); }

if (wadahArtikel) {
  // Tangkap CustomEvent "suka" dari Shadow DOM
  wadahArtikel.addEventListener("suka", (e) => {
    const kartu = e.target;
    const judulEl = kartu.querySelector('[slot="judul"]');
    const judulText = judulEl ? judulEl.textContent : "Artikel";
    console.log(`"${judulText}" disukai: ${e.detail.jumlah} kali`);

    const like = ambilLike();
    const id = kartu.dataset.id || judulText;
    like[id] = e.detail.jumlah;
    simpanLike(like);
  });

  // Tangkap CustomEvent "hapus-artikel"
  wadahArtikel.addEventListener("hapus-artikel", (e) => {
    const kartu = e.target;
    const judulEl = kartu.querySelector('[slot="judul"]');
    const judulText = judulEl ? judulEl.textContent : "";
    const id = kartu.dataset.id || judulText;

    const like = ambilLike();
    delete like[id];
    simpanLike(like);
    kartu.remove();
  });

  // Pulihkan jumlah Like dari LocalStorage setelah artikel selesai di-render
  wadahArtikel.addEventListener("artikel-dimuat", () => {
    const like = ambilLike();
    wadahArtikel.querySelectorAll("kartu-artikel").forEach((kartu) => {
      const id = kartu.dataset.id || kartu.querySelector('[slot="judul"]')?.textContent;
      if (like[id]) {
        kartu.setAttribute("like", like[id]);
      }
    });
  });
}

/* ===================== Tambah Artikel Manual ===================== */
const btnTambahArtikel = document.querySelector("#btn-tambah-artikel");
if (btnTambahArtikel && wadahArtikel) {
  btnTambahArtikel.addEventListener("click", () => {
    const inputJudul = document.querySelector("#input-judul-artikel");
    const inputIsi = document.querySelector("#input-isi-artikel");

    const judulText = inputJudul.value.trim();
    const isiText = inputIsi.value.trim();

    if (judulText === "" || isiText === "") {
      alert("Judul dan isi artikel tidak boleh kosong!");
      return;
    }

    const kartu = document.createElement("kartu-artikel");
    kartu.dataset.id = "custom_" + Date.now();

    const judul = document.createElement("h3");
    judul.slot = "judul";
    judul.textContent = judulText;

    const isi = document.createElement("p");
    isi.textContent = isiText;

    kartu.append(judul, isi);
    wadahArtikel.prepend(kartu);

    inputJudul.value = "";
    inputIsi.value = "";
  });
}

/* ===================== Komentar dengan Shadow DOM & Event Delegation ===================== */
const formKomentar = document.querySelector("#form-komentar");
const daftarKomentar = document.querySelector("#daftar-komentar");
const pesanError = document.querySelector("#pesan-error");

function ambilKomentar() { return JSON.parse(localStorage.getItem("komentar_galih")) || []; }
function simpanKomentarArr(arr) { localStorage.setItem("komentar_galih", JSON.stringify(arr)); }

function renderKomentar(k) {
  const kartu = document.createElement("kartu-komentar");
  kartu.dataset.id = k.id;

  const nama = document.createElement("strong");
  nama.slot = "nama";
  nama.textContent = k.nama;

  const pesan = document.createElement("span");
  pesan.textContent = k.pesan;

  kartu.append(nama, pesan);
  daftarKomentar.appendChild(kartu);
}

if (formKomentar && daftarKomentar) {
  ambilKomentar().forEach(renderKomentar);

  formKomentar.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputNama = document.querySelector("#input-nama");
    const inputPesan = document.querySelector("#input-pesan");
    const nama = inputNama.value.trim();
    const pesan = inputPesan.value.trim();

    if (nama === "" || pesan.length < 5) {
      if (pesanError) {
        pesanError.textContent = "Nama wajib diisi & Komentar minimal 5 karakter!";
        pesanError.style.display = "block";
      }
      return;
    }
    if (pesanError) pesanError.style.display = "none";

    const editId = formKomentar.dataset.editId;

    if (editId) {
      let simpanan = ambilKomentar();
      const idx = simpanan.findIndex(k => String(k.id) === String(editId));
      if (idx !== -1) {
        simpanan[idx].nama = nama;
        simpanan[idx].pesan = pesan;
        simpanKomentarArr(simpanan);
      }

      const elem = daftarKomentar.querySelector(`kartu-komentar[data-id="${editId}"]`);
      if (elem) {
        elem.querySelector('[slot="nama"]').textContent = nama;
        elem.querySelector('span:not([slot])').textContent = pesan;
      }

      delete formKomentar.dataset.editId;
      const btnSub = formKomentar.querySelector("button[type='submit']");
      if (btnSub) btnSub.textContent = "Kirim";
    } else {
      const k = { id: Date.now(), nama, pesan };
      renderKomentar(k);
      const arr = ambilKomentar();
      arr.push(k);
      simpanKomentarArr(arr);
    }

    formKomentar.reset();
  });

  // Event Delegation "hapus-komentar" dari Shadow DOM <kartu-komentar>
  daftarKomentar.addEventListener("hapus-komentar", (e) => {
    const id = e.detail.id;
    if (confirm("Yakin ingin menghapus komentar ini?")) {
      e.target.remove();
      const sisa = ambilKomentar().filter(k => String(k.id) !== String(id));
      simpanKomentarArr(sisa);
    }
  });

  // Event Delegation "edit-komentar"
  daftarKomentar.addEventListener("edit-komentar", (e) => {
    const id = e.detail.id;
    const kartu = e.target;
    const nama = kartu.querySelector('[slot="nama"]')?.textContent || "";
    const pesan = kartu.querySelector('span:not([slot])')?.textContent || "";

    const inputNama = document.querySelector("#input-nama");
    const inputPesan = document.querySelector("#input-pesan");
    const btnSub = formKomentar.querySelector("button[type='submit']");

    if (inputNama && inputPesan) {
      inputNama.value = nama;
      inputPesan.value = pesan;
      formKomentar.dataset.editId = id;
      if (btnSub) btnSub.textContent = "Update Komentar";
      inputPesan.focus();
    }
  });
}

const btnHapusSemua = document.querySelector("#btn-hapus-semua");
if (btnHapusSemua && daftarKomentar) {
  btnHapusSemua.addEventListener("click", () => {
    if (confirm("Hapus semua komentar di layar?")) {
      daftarKomentar.innerHTML = "";
      localStorage.removeItem("komentar_galih");
    }
  });
}

/* ===================== Fetch API Profil Penulis ===================== */
async function muatProfilPenulis() {
  const namaEl = document.querySelector("#nama-penulis");
  const emailEl = document.querySelector("#email-penulis");
  if (!namaEl || !emailEl) return;
  try {
    const res = await fetch(BASE + "/users/1");
    if (!res.ok) throw new Error("Status: " + res.status);
    const user = await res.json();
    namaEl.textContent = user.name;
    emailEl.textContent = user.email;
  } catch (error) {
    console.error("Gagal memuat profil penulis:", error);
  }
}
muatProfilPenulis();

/* ===================== Reset & Tombol Pintas ===================== */
const tombolReset = document.querySelector("#btn-reset");
if (tombolReset) {
  tombolReset.addEventListener("click", () => {
    if (confirm("Hapus semua data tersimpan (tema, komentar, like)?")) {
      localStorage.clear();
      location.reload();
    }
  });
}

document.addEventListener("keydown", (e) => {
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key.toLowerCase() === "d") {
    const tombolTemaComp = document.querySelector("tombol-tema");
    if (tombolTemaComp) tombolTemaComp.toggleTema();
  }
});

/* ===================== Tombol Kembali ke Atas ===================== */
const btnKembaliAtas = document.querySelector("#btn-kembali-atas");
if (btnKembaliAtas) {
  window.addEventListener("scroll", () => {
    btnKembaliAtas.style.display = window.scrollY > 200 ? "block" : "none";
  });
  btnKembaliAtas.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}