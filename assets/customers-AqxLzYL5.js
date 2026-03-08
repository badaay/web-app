import{s as m}from"./supabase-DlQAt1xf.js";async function x(){const s=document.getElementById("customers-list"),c=document.getElementById("add-customer-view-btn"),p=document.getElementById("view-all-customers-map-btn");let i=[];c&&(c.onclick=()=>{window.switchAdminModule&&window.switchAdminModule("add-customer-view-content")}),p&&(p.onclick=()=>v());async function u(){s.innerHTML='<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat pelanggan...</div></div>';const{data:e,error:a}=await m.from("customers").select("*, roles(name)").order("created_at",{ascending:!1});if(a){s.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(i=e,e.length===0){s.innerHTML='<div class="text-muted text-center py-4">Tidak ada pelanggan ditemukan.</div>';return}s.innerHTML=`
            <div class="table-responsive">
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
                        ${e.map(t=>`
                            <tr>
                                <td>
                                    <div class="fw-bold">${t.name}</div>
                                    <div class="small text-white-50">${t.customer_code||"-"}</div>
                                </td>
                                <td>${t.packet||"-"}</td>
                                <td>
                                    <div class="small">${t.address}</div>
                                </td>
                                <td>
                                    <div class="small">${t.mac_address||"-"}</div>
                                    <div class="small ${t.damping<-28?"text-danger":"text-success"}">${t.damping||"-"} dBm</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-cust" data-id="${t.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        ${t.lat?`<button class="btn btn-outline-info view-map" data-id="${t.id}" data-lat="${t.lat}" data-lng="${t.lng}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>`:""}
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".view-map").forEach(t=>{t.onclick=d=>{d.preventDefault(),d.stopPropagation();const o=i.find(n=>String(n.id)===t.dataset.id);b(parseFloat(t.dataset.lat),parseFloat(t.dataset.lng),o)}}),document.querySelectorAll(".edit-cust").forEach(t=>{t.onclick=d=>{d.preventDefault(),d.stopPropagation(),y(i.find(o=>String(o.id)===t.dataset.id))}})}function f(e){const a=e.lat?`https://www.google.com/maps?q=${e.lat},${e.lng}`:null,t=e.damping&&e.damping<-28?"#ef4444":"#22c55e",d=e.install_date?new Date(e.install_date).toLocaleDateString("id-ID"):"-";return`
            <div style="min-width:220px;font-family:sans-serif;">
                <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:8px 12px;margin:-7px -7px 10px;border-radius:4px 4px 0 0;">
                    <div style="font-weight:700;font-size:13px;">${e.name}</div>
                    <div style="font-size:11px;opacity:0.85;">${e.customer_code||"Kode belum diatur"}</div>
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;white-space:nowrap;">📦 Paket</td><td style="font-weight:600;">${e.packet||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📱 No HP</td><td>${e.phone||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">🏠 Alamat</td><td>${e.address||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📅 Pasang</td><td>${d}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">💻 Username</td><td>${e.username||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📡 MAC</td><td style="font-family:monospace;font-size:11px;">${e.mac_address||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">📶 Redaman</td><td style="color:${t};font-weight:600;">${e.damping?e.damping+" dBm":"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">🪪 KTP</td><td style="font-size:11px;">${e.ktp||"-"}</td></tr>
                </table>
                ${a?`<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
                    <a href="${a}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>`:""}
            </div>
        `}function g(e,a,t){return L.marker([e,a],{icon:L.divIcon({className:"",html:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
                    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
                </svg>`,iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}).bindPopup(f(t),{maxWidth:280})}function b(e,a,t){if(!e||!a)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{const o=document.querySelector("#mapModal .modal-title");o&&(o.innerHTML=`<i class="bi bi-geo-alt me-2 text-info"></i>${t?.name||"Lokasi Pelanggan"}`)},50),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const o=L.map("admin-map").setView([e,a],16);window.adminModalMap=o,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o),g(e,a,t).addTo(o).openPopup()},300)}function v(){if(i.length===0)return alert("Tidak ada data pelanggan untuk ditampilkan.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{const a=document.querySelector("#mapModal .modal-title");a&&(a.innerHTML='<i class="bi bi-map me-2 text-info"></i>Peta Semua Pelanggan')},50),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=i.filter(l=>l.lat&&l.lng);if(a.length===0)return alert("Tidak ada pelanggan dengan koordinat yang valid.");const t=a[0],d=L.map("admin-map").setView([t.lat,t.lng],12);window.adminModalMap=d,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(d);const o=L.control({position:"topright"});o.onAdd=()=>{const l=L.DomUtil.create("div");return l.style.cssText="background:rgba(30,30,30,0.85);color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid #444;",l.innerHTML=`<i style="color:#3b82f6;">●</i> ${a.length} Pelanggan`,l},o.addTo(d);const n=[];if(a.forEach(l=>{const r=g(l.lat,l.lng,l).addTo(d);n.push(r)}),a.length>1){const l=new L.featureGroup(n);d.fitBounds(l.getBounds().pad(.12))}},300)}async function y(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),d=document.getElementById("crudModalBody"),o=document.getElementById("save-crud-btn");t.innerText=e?"Edit Pelanggan":"Tambah Pelanggan",d.innerHTML=`
            <form id="customer-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nama Pelanggan</label>
                    <input type="text" class="form-control" id="cust-name" value="${e?.name||""}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Kode Pelanggan</label>
                    <input type="text" class="form-control" id="cust-code" value="${e?.customer_code||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">NIK / KTP</label>
                    <input type="text" class="form-control" id="cust-ktp" value="${e?.ktp||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">No. HP</label>
                    <input type="text" class="form-control" id="cust-phone" value="${e?.phone||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Paket Internet</label>
                    <input type="text" class="form-control" id="cust-packet" value="${e?.packet||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Pasang</label>
                    <input type="date" class="form-control" id="cust-install-date" value="${e?.install_date||""}">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label">Alamat Pemasangan</label>
                    <textarea class="form-control" id="cust-address" rows="2" required>${e?.address||""}</textarea>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Username PPPoE</label>
                    <input type="text" class="form-control" id="cust-username" value="${e?.username||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">MAC Address</label>
                    <input type="text" class="form-control" id="cust-mac" value="${e?.mac_address||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Redaman (dBm)</label>
                    <input type="text" class="form-control" id="cust-damping" value="${e?.damping||""}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Lat</label>
                    <input type="number" step="any" class="form-control" id="cust-lat" value="${e?.lat||""}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Lng</label>
                    <input type="number" step="any" class="form-control" id="cust-lng" value="${e?.lng||""}">
                </div>
            </form>
        `,o.onclick=async()=>{const n={name:document.getElementById("cust-name").value,customer_code:document.getElementById("cust-code").value,ktp:document.getElementById("cust-ktp").value,phone:document.getElementById("cust-phone").value,packet:document.getElementById("cust-packet").value,install_date:document.getElementById("cust-install-date").value,address:document.getElementById("cust-address").value,username:document.getElementById("cust-username").value,mac_address:document.getElementById("cust-mac").value,damping:document.getElementById("cust-damping").value,lat:parseFloat(document.getElementById("cust-lat").value)||null,lng:parseFloat(document.getElementById("cust-lng").value)||null};if(!n.name||!n.address)return alert("Nama dan Alamat wajib diisi.");let l;if(e)l=await m.from("customers").update(n).eq("id",e.id);else{const{data:r}=await m.from("roles").select("id").eq("name","Customer").single();r&&(n.role_id=r.id),l=await m.from("customers").insert([n])}l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),u())},a.show()}u()}export{x as initCustomers};
