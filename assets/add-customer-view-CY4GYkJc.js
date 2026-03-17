import{s as D}from"./config-CON8XM2G.js";import{g as C,b as F,c as M}from"./registration-service-BCvO0A0I.js";import{p as H,a as S}from"./ui-common-hIOATXsD.js";import{s as u}from"./toast-D3E5iWRc.js";import"./auth-service-PfjuabZR.js";async function G(){const x=document.getElementById("add-customer-view-container"),v=document.getElementById("back-to-customers-btn");v&&(v.onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"customers-content"}))}),x.innerHTML=`
        <div class="row">
            <div class="col-lg-8 mx-auto">
                <form id="add-customer-view-form" class="row g-4">
                    <!-- Section 1: Kredensial & Akun Login -->
                    <div class="col-12">
                        <div class="card bg-vscode border-0 shadow-sm">
                            <div class="card-header bg-vscode-header border-0 py-3">
                                <h6 class="mb-0 text-info fw-bold"><i class="bi bi-shield-lock me-2"></i>Kredensial & Akun Login</h6>
                            </div>
                            <div class="card-body p-4">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="p-3 rounded border border-secondary border-opacity-25" style="background: rgba(0,0,0,0.2);">
                                            <label class="form-label text-white-50 small fw-bold mb-1">ID Login (Customer Code)</label>
                                            <div class="h4 mb-0 text-info fw-bold font-monospace" id="adv-reg-id-display">--------</div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Password Login</label>
                                        <div class="input-group">
                                            <input type="password" id="adv-reg-password" class="form-control" readonly placeholder="Klik generate...">
                                            <button class="btn btn-outline-secondary border-secondary" type="button" id="adv-toggle-pass">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <button type="button" id="adv-btn-gen-credentials" class="btn btn-info w-100 py-2 shadow-sm">
                                            <i class="bi bi-magic me-2"></i> Buat Kredensial Otomatis
                                        </button>
                                        <p class="text-white-50 smaller mt-2 mb-0"><i class="bi bi-info-circle me-1"></i> ID Login dihasilkan otomatis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Detail Profil -->
                    <div class="col-12">
                        <div class="card bg-vscode border-0 shadow-sm">
                            <div class="card-header bg-vscode-header border-0 py-3">
                                <h6 class="mb-0 text-info fw-bold"><i class="bi bi-person-vcard me-2"></i>Detail Profil</h6>
                            </div>
                            <div class="card-body p-4">
                                <div class="row g-3">
                                    <div class="col-md-12">
                                        <label class="form-label text-white-50 small fw-bold">Nama Lengkap</label>
                                        <input type="text" class="form-control" id="adv-cust-name" placeholder="Nama sesuai KTP" required>
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label text-white-50 small fw-bold">Email Kontak Pelanggan (Opsional)</label>
                                        <input type="text" class="form-control" id="adv-cust-email" placeholder="contoh@gmail.com">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">NIK / KTP</label>
                                        <input type="text" class="form-control" id="adv-cust-ktp" placeholder="16 Digit NIK">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">No. HP Utama</label>
                                        <input type="text" class="form-control" id="adv-cust-phone" placeholder="08xxxxxxxxxx" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">No. HP Alternatif</label>
                                        <input type="text" class="form-control" id="adv-cust-alt-phone" placeholder="No. HP lain / Darurat">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Paket Layanan</label>
                                        <select class="form-select" id="adv-cust-package">
                                            <option value="">Memuat paket...</option>
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="p-3 rounded border border-secondary border-opacity-10">
                                            <label class="form-label text-white-50 small fw-bold mb-1 d-block"><i class="bi bi-person-bounding-box me-1"></i>Foto KTP</label>
                                            <input type="file" class="form-control form-control-sm mb-2" id="adv-cust-ktp-file" accept="image/*">
                                            <div id="ktp-preview-container" class="d-none">
                                                <img id="ktp-preview" src="" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px;">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="p-3 rounded border border-secondary border-opacity-10">
                                            <label class="form-label text-white-50 small fw-bold mb-1 d-block"><i class="bi bi-house me-1"></i>Foto Rumah / Lokasi</label>
                                            <input type="file" class="form-control form-control-sm mb-2" id="adv-cust-house-file" accept="image/*">
                                            <div id="house-preview-container" class="d-none">
                                                <img id="house-preview" src="" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px;">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label text-white-50 small fw-bold">Alamat Pemasangan</label>
                                        <textarea class="form-control" id="adv-cust-address" rows="3" placeholder="Alamat lengkap lokasi pemasangan" required></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 3: Lokasi Pemasangan -->
                    <div class="col-12">
                        <div class="card bg-vscode border-0 shadow-sm">
                            <div class="card-header bg-vscode-header border-0 py-3 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-info fw-bold"><i class="bi bi-geo-alt me-2"></i>Lokasi Pemasangan</h6>
                                <a id="adv-google-maps-link" href="#" target="_blank" class="btn btn-outline-success btn-sm d-none">
                                    <i class="bi bi-google me-1"></i> Buka Google Maps
                                </a>
                            </div>
                            <div class="card-body p-4">
                                <div id="location-picker-map" class="rounded border border-secondary mb-3" style="height: 350px; background: #1e1e1e; z-index: 1;"></div>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Latitude</label>
                                        <input type="number" step="any" class="form-control" id="adv-cust-lat" placeholder="Koordinat Latitude">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-white-50 small fw-bold">Longitude</label>
                                        <input type="number" step="any" class="form-control" id="adv-cust-lng" placeholder="Koordinat Longitude">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 mt-4 text-center">
                        <button type="button" class="btn btn-primary px-5 py-3 shadow fw-bold rounded-pill" id="save-adv-customer-btn">
                            <i class="bi bi-person-check me-2 fs-5"></i> Daftarkan Pelanggan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;const g=document.getElementById("adv-reg-id-display"),i=document.getElementById("adv-reg-password"),f=document.getElementById("adv-btn-gen-credentials"),p=document.getElementById("adv-toggle-pass"),I=document.getElementById("adv-cust-ktp-file"),E=document.getElementById("ktp-preview"),B=document.getElementById("ktp-preview-container"),P=document.getElementById("adv-cust-house-file"),T=document.getElementById("house-preview"),K=document.getElementById("house-preview-container"),n=document.getElementById("adv-cust-lat"),c=document.getElementById("adv-cust-lng");let l=null,h=null,y=null;f&&(f.onclick=()=>{const e=C(),a=F();i.value=e,g.innerText=a,g.classList.add("text-info"),l={pass:e,code:a}}),p&&(p.onclick=()=>{const e=p.querySelector("i");i.type==="password"?(i.type="text",e.classList.replace("bi-eye","bi-eye-slash")):(i.type="password",e.classList.replace("bi-eye-slash","bi-eye"))});const w=(e,a,s,t)=>{e.onchange=r=>{const m=r.target.files[0];if(m){const d=new FileReader;d.onload=k=>{t(k.target.result),a.src=k.target.result,s.classList.remove("d-none")},d.readAsDataURL(m)}}};w(I,E,B,e=>h=e),w(P,T,K,e=>y=e),H("adv-cust-package");let o,b;const N=[-7.15097,112.721245];setTimeout(()=>{o&&o.remove(),o=L.map("location-picker-map").setView(N,13),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o);const e=(a,s)=>{b?b.setLatLng([a,s]):b=L.marker([a,s]).addTo(o),o.panTo([a,s]);const t=document.getElementById("adv-google-maps-link");if(t){const r=S(a,s);t.href=r,t.classList.remove("d-none")}};o.on("click",a=>{const{lat:s,lng:t}=a.latlng;n.value=s.toFixed(7),c.value=t.toFixed(7),e(s,t)}),[n,c].forEach(a=>{a.oninput=()=>{const s=parseFloat(n.value),t=parseFloat(c.value);!isNaN(s)&&!isNaN(t)&&e(s,t)}})},500),document.getElementById("save-adv-customer-btn").onclick=async()=>{if(!l)return u("warning",'Silakan klik "Buat Kredensial Otomatis" terlebih dahulu.');const e={name:document.getElementById("adv-cust-name").value.trim(),ktp:document.getElementById("adv-cust-ktp").value.trim(),phone:document.getElementById("adv-cust-phone").value.trim(),alt_phone:document.getElementById("adv-cust-alt-phone").value.trim(),packet:document.getElementById("adv-cust-package").value,address:document.getElementById("adv-cust-address").value.trim(),lat:parseFloat(n.value)||null,lng:parseFloat(c.value)||null,photo_ktp:h,photo_rumah:y,customer_code:l.code};if(!e.name||!e.phone||!e.address)return u("warning","Nama, No. HP, dan Alamat wajib diisi.");const a=document.getElementById("save-adv-customer-btn"),s=a.innerHTML;a.disabled=!0,a.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Mendaftarkan...';try{const t=document.getElementById("adv-cust-email").value.trim(),m=(await M(l.code,l.pass,l.code,t)).user.id,{error:d}=await D.from("customers").update(e).eq("id",m);if(d)throw d;u("success",`Sukses! Pelanggan "${e.name}" berhasil didaftarkan.

ID LOGIN: ${l.code}
PASSWORD: ${l.pass}`),document.dispatchEvent(new CustomEvent("navigate",{detail:"customers-content"}))}catch(t){console.error("Save customer error:",t),u("error","Terjadi kesalahan: "+t.message)}finally{a.disabled=!1,a.innerHTML=s}}}export{G as initAddCustomerView};
