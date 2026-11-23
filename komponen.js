"use strict";

/* =============================================================
   KOMPONEN.JS — Modul 11 & 12 (Shadow DOM, Slot, CustomEvent)
   NIM / Nama : 255314023 / William Galih Wisanggeni
   ============================================================= */

// 1. <salam-pengguna>
class SalamPengguna extends HTMLElement {
  connectedCallback() {
    const nama = this.getAttribute("nama") || "Galih";
    this.textContent = `Halo, ${nama}! Selamat datang di blog profil saya.`;
  }
}
customElements.define("salam-pengguna", SalamPengguna);

// 2. <tombol-tema>
class TombolTema extends HTMLElement {
  connectedCallback() {
    this.render();
    if (localStorage.getItem("tema_galih") === "dark") {
      document.body.classList.add("dark-mode");
      const btn = this.querySelector(".btn-tema-custom");
      if (btn) btn.textContent = "Mode Terang";
    }
  }

  render() {
    this.innerHTML = `<button type="button" class="btn-tema-custom">Mode Gelap</button>`;
    const btn = this.querySelector(".btn-tema-custom");
    if (btn) btn.addEventListener("click", () => this.toggleTema());
  }

  toggleTema() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("tema_galih", isDark ? "dark" : "light");

    const btn = this.querySelector(".btn-tema-custom");
    if (btn) btn.textContent = isDark ? "Mode Terang" : "Mode Gelap";
  }
}
customElements.define("tombol-tema", TombolTema);

// 3. Template & <kartu-artikel> (Shadow DOM + Slot + CustomEvent)
const templateKartu = document.createElement("template");
templateKartu.innerHTML = `
  <style>
    :host { display: block; }
    .kartu {
      border: 1px solid var(--kartu-garis, #dddddd);
      border-radius: var(--kartu-radius, 8px);
      padding: 16px;
      background: var(--kartu-latar, #ffffff);
      color: var(--kartu-teks, inherit);
      transition: background-color .15s ease, border-color .15s ease;
      margin-bottom: 12px;
    }
    .kartu:hover { background: var(--kartu-hover, #eef4fb); }
    ::slotted(h3) { margin: 0 0 .5rem 0; color: var(--kartu-judul-warna, brown); }
    ::slotted(p) { margin: 0 0 .5rem 0; }
    .aksi { margin-top: .75rem; display: flex; gap: .5rem; flex-wrap: wrap; }
    button {
      cursor: pointer;
      padding: .4rem .8rem;
      border: 1px solid var(--tombol-garis, #888);
      border-radius: 6px;
      background: var(--tombol-latar, #f2f2f2);
      color: var(--tombol-teks, inherit);
      font: inherit;
    }
  </style>
  <article class="kartu">
    <slot name="judul">Tanpa judul</slot>
    <slot>Tanpa isi</slot>
    <div class="aksi">
      <button type="button" class="btn-like" part="tombol-like">Like (0)</button>
      <button type="button" class="btn-hapus" part="tombol-hapus">Hapus Artikel</button>
      <slot name="aksi"></slot>
    </div>
  </article>`;

class KartuArtikel extends HTMLElement {
  #like = 0;
  #tombolLike;

  static get observedAttributes() {
    return ["like"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateKartu.content.cloneNode(true));

    this.#tombolLike = this.shadowRoot.querySelector(".btn-like");
    this.#tombolLike.addEventListener("click", () => {
      this.#like++;
      this.#perbaruiTombolLike();
      this.dispatchEvent(new CustomEvent("suka", {
        detail: { jumlah: this.#like },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot.querySelector(".btn-hapus").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hapus-artikel", {
        bubbles: true,
        composed: true,
      }));
    });
  }

  attributeChangedCallback(nama, nilaiLama, nilaiBaru) {
    if (nama === "like") {
      this.#like = Number(nilaiBaru) || 0;
      this.#perbaruiTombolLike();
    }
  }

  #perbaruiTombolLike() {
    this.#tombolLike.textContent = `Like (${this.#like})`;
  }
}
customElements.define("kartu-artikel", KartuArtikel);

// 4. <daftar-artikel> (Mengambil Data API & Menyusun Kartu Slotted)
function buatKartu(post) {
  const kartu = document.createElement("kartu-artikel");
  kartu.dataset.id = post.id;

  const judul = document.createElement("h3");
  judul.slot = "judul";
  judul.textContent = post.title;

  const isi = document.createElement("p");
  isi.textContent = post.body;

  kartu.append(judul, isi);
  return kartu;
}

class DaftarArtikel extends HTMLElement {
  #sudahMuat = false;

  connectedCallback() {
    if (this.#sudahMuat) return;
    this.#sudahMuat = true;
    this.muat();
  }

  async muat() {
    this.textContent = "Memuat artikel dari server...";
    const batas = Number(this.getAttribute("batas")) || 5;

    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=${batas}`);
      if (!res.ok) throw new Error("Status: " + res.status);
      const data = await res.json();

      this.replaceChildren(...data.map(buatKartu));

      this.dispatchEvent(new CustomEvent("artikel-dimuat", {
        detail: { jumlah: data.length },
        bubbles: true,
      }));
    } catch (error) {
      console.error(error);
      const pesan = document.createElement("p");
      pesan.style.color = "red";
      pesan.textContent = "Gagal memuat artikel dari server.";
      const ulang = document.createElement("button");
      ulang.type = "button";
      ulang.textContent = "Coba lagi";
      ulang.style.marginTop = "8px";
      ulang.addEventListener("click", () => this.muat());
      this.replaceChildren(pesan, ulang);
    }
  }
}
customElements.define("daftar-artikel", DaftarArtikel);

// 5. Template & <kartu-komentar> (Shadow DOM + Slot + CustomEvent)
const templateKomentar = document.createElement("template");
templateKomentar.innerHTML = `
  <style>
    :host { display: block; }
    .komentar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      padding: .6rem .8rem;
      margin: .4rem 0;
      border-left: 4px solid var(--komentar-aksen, brown);
      background: var(--komentar-latar, #ffffff);
      border-radius: 0 6px 6px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .teks { flex: 1; color: var(--komentar-teks, inherit); }
    ::slotted([slot="nama"]) { margin-right: .35rem; color: var(--komentar-nama-warna, brown); }
    .aksi-btn { display: flex; gap: .4rem; }
    button {
      cursor: pointer;
      padding: .2rem .5rem;
      border: 1px solid #d9534f;
      border-radius: 4px;
      background: transparent;
      color: #d9534f;
      font-size: .85rem;
    }
    button.btn-edit {
      border-color: #0275d8;
      color: #0275d8;
    }
  </style>
  <div class="komentar">
    <div class="teks">
      <slot name="nama">Anonim</slot>: 
      <slot>(kosong)</slot>
    </div>
    <div class="aksi-btn">
      <button type="button" class="btn-edit" part="tombol-edit">Edit</button>
      <button type="button" class="btn-hapus" part="tombol-hapus">Hapus</button>
    </div>
  </div>`;

class KartuKomentar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateKomentar.content.cloneNode(true));

    this.shadowRoot.querySelector(".btn-hapus").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hapus-komentar", {
        detail: { id: this.dataset.id },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot.querySelector(".btn-edit").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("edit-komentar", {
        detail: { id: this.dataset.id },
        bubbles: true,
        composed: true,
      }));
    });
  }
}
customElements.define("kartu-komentar", KartuKomentar);