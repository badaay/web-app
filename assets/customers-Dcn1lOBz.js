import{s as M}from"./config-CON8XM2G.js";import{g as T,a as A,s as F,b as $,p as N}from"./ui-common-BJBdVW0F.js";import"./auth-service-BA7j2u7-.js";async function C(){const w=document.getElementById("customers-list"),B=document.getElementById("add-customer-view-btn");let y=[];B&&(B.onclick=()=>{window.switchAdminModule&&window.switchAdminModule("add-customer-view-content")});async function E(){w.innerHTML='<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat pelanggan...</div></div>';const{data:t,error:c}=await M.from("customers").select("*, roles(name)").order("created_at",{ascending:!1});if(c){w.innerHTML=`<div class="text-danger">Kesalahan: ${c.message}</div>`;return}if(y=t,t.length===0){w.innerHTML=`
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-people-fill fs-1 d-block mb-3"></i>
                    Tidak ada pelanggan ditemukan.
                </div>`;return}w.innerHTML=`
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Kode / Nama</th>
                            <th>Paket</th>
                            <th>Alamat / Lokasi</th>
                            <th>MAC / Redaman</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.map(e=>`
                            <tr>
                                <td>
                                    <div class="fw-bold">
                                        <a href="/web-app/enduser/dashboard.html?code=${e.customer_code||e.id}&customer=true" class="text-info text-decoration-none" target="_blank">
                                            <i class="bi bi-box-arrow-in-right me-1 small"></i>${e.name}
                                        </a>
                                    </div>
                                    <div class="small text-white-50 text-uppercase" style="letter-spacing: 1px; font-size: 0.7rem;">${e.customer_code||"Belum Ada Kode"}</div>
                                    ${e.email&&!e.email.includes("@sifatih.id")?`<div class="smaller text-info opacity-75 mt-1" style="font-size: 0.65rem;"><i class="bi bi-envelope me-1"></i>${e.email}</div>`:""}
                                </td>
                                <td>
                                    <span class="badge bg-vscode-header border border-secondary text-white fw-normal">${e.packet||"-"}</span>
                                </td>
                                <td>
                                    <div class="small text-wrap" style="max-width: 250px;">${e.address}</div>
                                </td>
                                <td>
                                    <div class="small font-monospace">${e.mac_address||"-"}</div>
                                    <div class="small fw-bold ${e.damping<-28?"text-danger":"text-success"}">${e.damping||"-"} dBm</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-cust" data-id="${e.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-warning reset-pass" data-id="${e.id}" data-name="${e.name}" title="Reset Password"><i class="bi bi-shield-lock"></i></button>
                                        <button class="btn btn-outline-success quick-repair" data-id="${e.id}" title="Buat Tiket Perbaikan"><i class="bi bi-tools"></i></button>
                                        ${e.lat?`<button class="btn btn-outline-info view-map" data-id="${e.id}" data-lat="${e.lat}" data-lng="${e.lng}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>`:""}
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".view-map").forEach(e=>{e.onclick=s=>{s.preventDefault(),s.stopPropagation();const l=y.find(u=>String(u.id)===e.dataset.id);_(parseFloat(e.dataset.lat),parseFloat(e.dataset.lng),l)}}),document.querySelectorAll(".edit-cust").forEach(e=>{e.onclick=s=>{s.preventDefault(),s.stopPropagation(),S(y.find(l=>String(l.id)===e.dataset.id))}}),document.querySelectorAll(".quick-repair").forEach(e=>{e.onclick=()=>{const s=y.find(l=>String(l.id)===e.dataset.id);window.switchAdminModule&&(window.switchAdminModule("work-orders-content"),setTimeout(()=>{document.dispatchEvent(new CustomEvent("quick-wo",{detail:s}))},500))}}),document.querySelectorAll(".reset-pass").forEach(e=>{e.onclick=async s=>{s.preventDefault(),s.stopPropagation();const l=e.dataset.id,u=e.dataset.name;if(!confirm(`Apakah Anda yakin ingin mengatur ulang kata sandi untuk "${u}"?`))return;const g=T(),o=e.querySelector("i"),k=o.className;try{e.disabled=!0,o.className="spinner-border spinner-border-sm",await A(l,g),alert(`Kata sandi berhasil diatur ulang!

User: ${u}
Password Baru: ${g}

Silakan simpan kata sandi ini.`)}catch(v){console.error("Reset password error:",v),alert("Gagal mengatur ulang kata sandi: "+v.message)}finally{e.disabled=!1,o.className=k}}})}function _(t,c,e){if(!t||!c)return alert("Koordinat tidak disetel untuk pelanggan ini.");const s=$(t,c),l=`
            <div style="font-family:sans-serif; min-width:210px;">
                <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:8px 12px;margin:-7px -7px 10px;border-radius:4px 4px 0 0;">
                    <div style="font-weight:700;font-size:13px;">${e.name}</div>
                    <div style="font-size:11px;opacity:0.85;">${e.customer_code||""}</div>
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;">🏠 Alamat</td><td>${e.address||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📱 No HP</td><td>${e.phone||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📦 Paket</td><td style="font-weight:600;">${e.packet||"-"}</td></tr>
                </table>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
                    <a href="${s}" target="_blank" class="btn btn-sm btn-success w-100 text-white" style="font-size:11px;">
                        <i class="bi bi-google me-1"></i> Buka Google Maps
                    </a>
                </div>
            </div>
        `;F(t,c,`Lokasi: ${e?.name}`,l)}async function S(t=null){const c=new bootstrap.Modal(document.getElementById("crudModal")),e=document.getElementById("crudModalTitle"),s=document.getElementById("crudModalBody"),l=document.getElementById("save-crud-btn");e.innerText=t?`Edit Pelanggan: ${t.name}`:"Tambah Pelanggan",s.innerHTML=`
            <form id="customer-form" class="row g-3">
                <!-- Section 1: Kredensial & Akun -->
                <div class="col-12">
                    <div class="card bg-vscode border-secondary mb-3 shadow-sm">
                        <div class="card-header bg-vscode-header border-0 py-2">
                            <h6 class="mb-0 text-info fw-bold small"><i class="bi bi-shield-lock me-2"></i>Akses Login</h6>
                        </div>
                        <div class="card-body p-3">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-white-50 small fw-bold">ID Login (Customer Code)</label>
                                    <input type="text" class="form-control form-control-sm bg-dark text-info fw-bold" id="cust-code" value="${t?.customer_code||""}" readonly>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-white-50 small fw-bold">Password Baru (Optional)</label>
                                    <div class="input-group input-group-sm">
                                        <input type="password" id="cust-new-password" class="form-control" placeholder="Kosongkan jika tidak diubah">
                                        <button class="btn btn-outline-secondary" type="button" id="btn-gen-new-pass">
                                            <i class="bi bi-magic"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" type="button" id="toggle-new-pass">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                    <div id="new-pass-msg" class="smaller text-warning mt-1 d-none">Password akan diupdate saat simpan.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Informasi Profil -->
                <div class="col-md-6">
                    <div class="bg-vscode border-0 p-0 shadow-none">
                         <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Nama Lengkap</label>
                                <input type="text" class="form-control" id="cust-name" value="${t?.name||""}" required>
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Email Kontak (Opsional)</label>
                                <input type="text" class="form-control" id="cust-email" value="${t?.email&&!t?.email.includes("@sifatih.id")?t.email:""}" placeholder="Alamat email aktif">
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">NIK / KTP</label>
                                <input type="text" class="form-control" id="cust-ktp" value="${t?.ktp||""}">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-white-50 small fw-bold">No. HP Utama</label>
                                <input type="text" class="form-control" id="cust-phone" value="${t?.phone||""}">
                            </div>
                            <div class="col-6">
                                <label class="form-label text-white-50 small fw-bold">No. HP Alternatif</label>
                                <input type="text" class="form-control" id="cust-alt-phone" value="${t?.alt_phone||""}">
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Paket Layanan</label>
                                <select class="form-select" id="cust-packet-select">
                                    <option value="">Memuat paket...</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label text-white-50 small fw-bold">Alamat Pemasangan</label>
                                <textarea class="form-control" id="cust-address" rows="3" required>${t?.address||""}</textarea>
                            </div>
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label text-white-50 small fw-bold mb-0">Koordinat Lokasi</label>
                                    <a id="edit-google-maps-link" href="${t?.lat?$(t.lat,t.lng):"#"}" target="_blank" class="btn btn-link text-success p-0 text-decoration-none smaller ${t?.lat?"":"d-none"}">
                                        <i class="bi bi-google me-1"></i> Google Maps
                                    </a>
                                </div>
                                <div class="input-group input-group-sm mb-2">
                                    <input type="number" step="any" class="form-control" id="cust-lat" value="${t?.lat||""}" placeholder="Lat">
                                    <input type="number" step="any" class="form-control" id="cust-lng" value="${t?.lng||""}" placeholder="Lng">
                                </div>
                                <div id="edit-location-picker-map" class="rounded border border-secondary" style="height: 200px; background: #1e1e1e; z-index: 1;"></div>
                            </div>
                         </div>
                    </div>
                </div>

                <!-- Section 3: Teknis & Media -->
                <div class="col-md-6">
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">Username PPPoE</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="cust-username" value="${t?.username||""}" placeholder="Username">
                            </div>
                        </div>
                         <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">MAC Address</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="cust-mac" value="${t?.mac_address||""}" placeholder="MAC Address">
                            </div>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">Redaman (dBm)</label>
                            <input type="text" class="form-control form-control-sm" id="cust-damping" value="${t?.damping||""}">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label text-white-50 small fw-bold">Tgl Pasang</label>
                            <input type="date" class="form-control form-control-sm" id="cust-install-date" value="${t?.install_date||""}">
                        </div>
                        <div class="col-md-12">
                            <div class="row g-2">
                                <div class="col-6">
                                    <label class="form-label text-white-50 small fw-bold d-block"><i class="bi bi-person-bounding-box me-1"></i>Foto KTP</label>
                                    <input type="file" class="form-control form-control-sm" id="cust-ktp-file" accept="image/*">
                                    <div id="edit-ktp-preview-container" class="${t?.photo_ktp?"":"d-none"} mt-1 text-center">
                                        <img src="${t?.photo_ktp||""}" class="img-thumbnail bg-dark" style="max-height: 80px;">
                                    </div>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-white-50 small fw-bold d-block"><i class="bi bi-house me-1"></i>Foto Rumah</label>
                                    <input type="file" class="form-control form-control-sm" id="cust-house-file" accept="image/*">
                                    <div id="edit-house-preview-container" class="${t?.photo_rumah?"":"d-none"} mt-1 text-center">
                                        <img src="${t?.photo_rumah||""}" class="img-thumbnail bg-dark" style="max-height: 80px;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `,setTimeout(()=>{const a=document.getElementById("cust-lat"),m=document.getElementById("cust-lng"),d=document.getElementById("edit-google-maps-link"),x=parseFloat(a.value)||-6.2,f=parseFloat(m.value)||106.8166,p=L.map("edit-location-picker-map").setView([x,f],14);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(p);let b;parseFloat(a.value)&&parseFloat(m.value)&&(b=L.marker([x,f]).addTo(p));const h=(r,i)=>{b?b.setLatLng([r,i]):b=L.marker([r,i]).addTo(p),p.panTo([r,i]);const n=$(r,i);n&&(d.href=n,d.classList.remove("d-none"))};p.on("click",r=>{const{lat:i,lng:n}=r.latlng;a.value=i.toFixed(7),m.value=n.toFixed(7),h(i,n)}),[a,m].forEach(r=>{r.oninput=()=>{const i=parseFloat(a.value),n=parseFloat(m.value);!isNaN(i)&&!isNaN(n)&&h(i,n)}}),setTimeout(()=>p.invalidateSize(),300)},500),N("cust-packet-select",t?.packet);const u=document.getElementById("btn-gen-new-pass"),g=document.getElementById("toggle-new-pass"),o=document.getElementById("cust-new-password"),k=document.getElementById("new-pass-msg");u&&(u.onclick=()=>{o.value=T(),o.type="text",k.classList.remove("d-none")}),g&&(g.onclick=()=>{const a=g.querySelector("i");o.type==="password"?(o.type="text",a.classList.replace("bi-eye","bi-eye-slash")):(o.type="password",a.classList.replace("bi-eye-slash","bi-eye"))});let v=t?.photo_ktp||null,I=t?.photo_rumah||null;const P=(a,m,d,x)=>{const f=document.getElementById(a);f&&(f.onchange=p=>{const b=p.target.files[0];if(b){const h=new FileReader;h.onload=r=>{const i=r.target.result;x(i);const n=document.getElementById(d);n.classList.remove("d-none"),n.querySelector("img").src=i},h.readAsDataURL(b)}})};P("cust-ktp-file","edit-ktp-preview","edit-ktp-preview-container",a=>v=a),P("cust-house-file","edit-house-preview","edit-house-preview-container",a=>I=a),l.onclick=async()=>{const a={name:document.getElementById("cust-name").value.trim(),customer_code:document.getElementById("cust-code").value.trim(),ktp:document.getElementById("cust-ktp").value.trim(),phone:document.getElementById("cust-phone").value.trim(),alt_phone:document.getElementById("cust-alt-phone").value.trim(),packet:document.getElementById("cust-packet-select").value,install_date:document.getElementById("cust-install-date").value||null,address:document.getElementById("cust-address").value.trim(),username:document.getElementById("cust-username").value.trim(),mac_address:document.getElementById("cust-mac").value.trim(),damping:document.getElementById("cust-damping").value.trim(),lat:parseFloat(document.getElementById("cust-lat").value)||null,lng:parseFloat(document.getElementById("cust-lng").value)||null,photo_ktp:v,photo_rumah:I,email:document.getElementById("cust-email").value.trim()||(t?.email&&!t?.email.includes("@sifatih.id")?t.email:null)};if(!a.name||!a.address)return alert("Nama dan Alamat wajib diisi.");l.disabled=!0;const m=l.innerHTML;l.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';try{o.value.trim().length>0&&(await A(t.id,o.value.trim()),console.log("Password updated successfully"));const{error:d}=await M.from("customers").update(a).eq("id",t.id);if(d)throw d;alert("Data pelanggan berhasil diperbarui!"),c.hide(),E()}catch(d){console.error("Save edit error:",d),alert("Gagal menyimpan: "+d.message)}finally{l.disabled=!1,l.innerHTML=m}},c.show()}E()}export{C as initCustomers};
