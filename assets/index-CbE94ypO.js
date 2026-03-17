import{s as c}from"./config-CON8XM2G.js";import{s as m}from"./toast-D3E5iWRc.js";import{g as h}from"./ui-common-hIOATXsD.js";import{getStatusColor as b,getStatusDisplayText as v}from"./utils-CJqnORQj.js";async function k(e,a){if(!e)return;e.innerHTML=h("Memuat Antrian...");const{data:n,error:t}=await c.from("work_orders").select("*, customers(*), employees(name)").order("created_at",{ascending:!1});if(t){e.innerHTML=`<div class="alert alert-danger">Error: ${t.message}</div>`;return}a(n)}function I(e,a,n){const t=document.getElementById("wo-status-summary");if(!t)return;const o=e.reduce((i,d)=>(i[d.status]=(i[d.status]||0)+1,i),{}),s=["waiting","confirmed","open","closed"],l=e.length,r=`
        <div class="d-flex justify-content-between align-items-center mb-3" style="flex-wrap: wrap;">
            <div class="d-flex align-items-center gap-2" style="flex-wrap: wrap;">
                <div class="text-muted small me-2">Status Flow:</div>
                ${s.map((i,d)=>`
                    <div class="d-inline-flex align-items-center">
                        <button class="badge p-2 border-0 wo-filter-badge ${a===i?"ring-active":""}"
                            style="background-color:${b(i)};color:#fff;cursor:pointer;min-width:80px;"
                            data-filter="${i}"
                            title="Click to filter">
                            ${v(i)}<br><small>${o[i]||0}</small>
                        </button>
                        ${d<s.length-1?'<i class="bi bi-arrow-right text-muted mx-2"></i>':""}
                    </div>
                `).join("")}
            </div>
            <div class="ms-auto mt-2 mt-md-0">
                <button class="badge p-2 border-0 wo-filter-badge ${a==="All"?"ring-active":""}"
                    style="background:var(--vscode-accent);color:#fff;cursor:pointer;min-width:80px;"
                    data-filter="All"
                    title="Show all">
                    <i class="bi bi-list me-1"></i>Semua<br><small>${l}</small>
                </button>
            </div>
        </div>
    `;t.innerHTML=r,t.querySelectorAll(".wo-filter-badge").forEach(i=>{i.onclick=()=>{const d=i.dataset.filter;n(d===a&&d!=="All"?"All":d)}})}function T(e){if(document.getElementById("wo-search-bar"))return;const a=document.getElementById("work-orders-list"),n=document.createElement("div");n.id="wo-search-bar",n.className="mb-3 d-flex gap-2 align-items-center",n.innerHTML=`
        <div class="input-group input-group-sm" style="max-width:320px;">
            <span class="input-group-text bg-vscode-header border-0 text-white-50"><i class="bi bi-search"></i></span>
            <input id="wo-search-input" type="text" class="form-control" placeholder="Cari nama pelanggan, petugas, ket...">
        </div>
        <button class="btn btn-sm btn-outline-secondary" id="wo-clear-search"><i class="bi bi-x"></i></button>
    `,a.parentNode.insertBefore(n,a);const t=document.getElementById("wo-search-input"),o=document.getElementById("wo-clear-search");t.addEventListener("input",s=>e(s.target.value.toLowerCase())),o.addEventListener("click",()=>{t.value="",e("")})}function E(e,a,n){let t=e;return a!=="All"&&(t=t.filter(o=>o.status===a)),n&&(t=t.filter(o=>{const s=o.customers?.name?.toLowerCase()||"",l=o.customers?.phone?.toLowerCase()||"",r=o.employees?.name?.toLowerCase()||"",i=o.ket?.toLowerCase()||"";return s.includes(n)||l.includes(n)||r.includes(n)||i.includes(n)})),t}function S(e,a,n){const t=document.getElementById("work-orders-list");if(!t)return;if(e.length===0){t.innerHTML='<div class="alert alert-info mt-3">Tidak ada antrian yang cocok.</div>';return}const o=`
        <div class="table-responsive mt-3">
            <table class="table table-dark table-hover align-middle">
                <thead class="table-secondary">
                    <tr>
                        <th style="width: 100px;">Tgl Daftar</th>
                        <th style="width: 150px;">Pelanggan</th>
                        <th style="width: 100px;">No HP</th>
                        <th style="width: 80px;">Tipe</th>
                        <th style="width: 100px;">Status</th>
                        <th style="width: 120px;">Teknisi</th>
                        <th style="width: 150px;">Keterangan</th>
                        <th style="width: 80px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${e.map(s=>`
                        <tr>
                            <td><small>${s.registration_date||"-"}</small></td>
                            <td><strong>${s.customers?.name||"-"}</strong></td>
                            <td><small>${s.customers?.phone||"-"}</small></td>
                            <td><span class="badge bg-dark">${s.title?.substring(0,10)||"PSB"}</span></td>
                            <td>
                                <span class="badge" style="background-color:${b(s.status)};color:#fff;font-weight:600;">
                                    <i class="bi bi-circle-fill me-1" style="font-size:0.6em;"></i>
                                    ${v(s.status)}
                                </span>
                            </td>
                            <td><small>${s.employees?.name||"Belum ditugaskan"}</small></td>
                            <td><small>${s.ket?.substring(0,15)||s.payment_status||"-"}</small></td>
                            <td>
                                ${s.status==="waiting"?`
                                    <button class="btn btn-sm btn-success assign-confirm-wo" data-id="${s.id}" title="Konfirmasi & Tugaskan">
                                        Konfirmasi
                                    </button>
                                `:`
                                    <button class="btn btn-sm btn-primary view-wo-details-btn" data-id="${s.id}" title="Lihat Aksi">
                                        <i class="bi bi-three-dots"></i>
                                    </button>
                                `}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;t.innerHTML=o,t.querySelectorAll(".view-wo-details-btn").forEach(s=>{s.onclick=()=>{const l=s.dataset.id,r=e.find(i=>i.id===l);a&&a(r)}}),t.querySelectorAll(".assign-confirm-wo").forEach(s=>{s.onclick=()=>{const l=s.dataset.id,r=e.find(i=>i.id===l);n&&n(r)}})}async function _(e){const a=new bootstrap.Modal(document.getElementById("crudModal"));document.getElementById("crudModalTitle").textContent=e?"Edit Antrian":"Tambah Antrian";const n=document.getElementById("crudModalBody");e?(await D(e),a.show(),document.getElementById("save-crud-btn").onclick=()=>q(e.id,a)):(n.innerHTML=h("Memuat Tipe Antrian..."),a.show(),await A(a))}async function A(e){const{data:a,error:n}=await c.from("master_queue_types").select("*");if(n){m("Error loading types","error");return}const t=document.getElementById("crudModalBody");t.innerHTML=`
        <div class="mb-3">
            <label class="form-label">Pilih Tipe Antrian</label>
            <div class="row gap-2 justify-content-center">
                ${a.map(o=>`
                    <div class="col-auto">
                        <button class="btn border-2" style="min-width:120px;border-color:${o.color}!important;color:${o.color};" 
                            data-type-id="${o.id}" data-type-name="${o.name}">
                            <i class="bi ${o.icon}"></i><br><small>${o.name}</small>
                        </button>
                    </div>
                `).join("")}
            </div>
        </div>
    `,t.querySelectorAll("[data-type-id]").forEach(o=>{o.addEventListener("click",async()=>{const s=o.dataset.typeId,l=o.dataset.typeName;await P(s,l,e)})}),document.getElementById("save-crud-btn").style.display="none"}async function P(e,a,n){const t=document.getElementById("crudModalBody");t.innerHTML=h("Memuat Form...");const[o,s,l]=await Promise.all([c.from("customers").select("id, name, phone, address"),c.from("employees").select("id, name"),c.from("internet_packages").select("id, name, price")]),r=o.data||[];s.data;const i=l.data||[],d=H(e);let p=`
        <form id="type-form">
            <input type="hidden" name="type_id" value="${e}">
            <input type="hidden" name="type_name" value="${a}">
            <div class="mb-3">
                <label class="form-label fw-bold">Tipe: <span style="color:var(--vscode-accent)">${a}</span></label>
            </div>
    `;p+=`
            <div class="mb-3">
                <label class="form-label">Pilih Pelanggan *</label>
                <select class="form-select form-select-sm" name="customer_id" required>
                    <option value="">-- Pilih Pelanggan --</option>
                    ${r.map(u=>`<option value="${u.id}">${u.name} (${u.phone})</option>`).join("")}
                </select>
            </div>
        `,d.package&&(p+=`
            <div class="mb-3">
                <label class="form-label">Paket Layanan *</label>
                <select class="form-select form-select-sm" name="package_id" required>
                    <option value="">-- Pilih Paket --</option>
                    ${i.map(u=>`<option value="${u.id}">${u.name}</option>`).join("")}
                </select>
            </div>
        `),p+=`
        <div class="mb-3">
            <label class="form-label">Keterangan</label>
            <textarea class="form-control form-control-sm" name="ket" rows="2" placeholder="Catatan tambahan..."></textarea>
        </div>
        <div class="mb-3">
            <label class="form-label">Status Pembayaran</label>
            <select class="form-select form-select-sm" name="payment_status">
                <option value="pending">Pending</option>
                <option value="paid">Lunas</option>
            </select>
        </div>
    `,p+="</form>",t.innerHTML=p,document.getElementById("save-crud-btn").style.display="block",document.getElementById("save-crud-btn").onclick=()=>{const u=document.getElementById("type-form");u.checkValidity()?C(n):u.reportValidity()}}function H(e){return{customer:!0,package:e==="1"||e==="4",employee:!1}}async function C(e){const a=document.getElementById("type-form"),n=new FormData(a),t={type_id:n.get("type_id"),title:n.get("type_name"),status:"waiting",customer_id:n.get("customer_id")||null,employee_id:n.get("employee_id")||null,package_id:n.get("package_id")||null,ket:n.get("ket"),payment_status:n.get("payment_status"),created_at:new Date().toISOString()},{error:o}=await c.from("work_orders").insert(t);if(o){m(`Error: ${o.message}`,"error");return}m("Antrian berhasil ditambahkan","success"),e.hide(),window.location.reload()}async function D(e){const[a,n,t]=await Promise.all([c.from("customers").select("id, name, phone, address"),c.from("employees").select("id, name"),c.from("internet_packages").select("id, name, price")]),o=a.data||[],s=n.data||[],l=t.data||[],r=document.getElementById("crudModalBody");r.innerHTML=`
        <form id="edit-form">
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Judul</label>
                    <input type="text" class="form-control form-control-sm" name="title" value="${e.title||""}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Status</label>
                    <select class="form-select form-select-sm" name="status" required>
                        <option value="waiting" ${e.status==="waiting"?"selected":""}>Waiting</option>
                        <option value="confirmed" ${e.status==="confirmed"?"selected":""}>Confirmed</option>
                        <option value="open" ${e.status==="open"?"selected":""}>Open</option>
                        <option value="closed" ${e.status==="closed"?"selected":""}>Closed</option>
                    </select>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Pelanggan</label>
                    <select class="form-select form-select-sm" name="customer_id">
                        ${o.map(i=>`<option value="${i.id}" ${e.customer_id===i.id?"selected":""}>${i.name}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Teknisi</label>
                    <select class="form-select form-select-sm" name="employee_id">
                        <option value="">-- Pilih --</option>
                        ${s.map(i=>`<option value="${i.id}" ${e.employee_id===i.id?"selected":""}>${i.name}</option>`).join("")}
                    </select>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Paket</label>
                <select class="form-select form-select-sm" name="package_id">
                    <option value="">-- Pilih --</option>
                    ${l.map(i=>`<option value="${i.id}" ${e.package_id===i.id?"selected":""}>${i.name}</option>`).join("")}
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label">Keterangan</label>
                <textarea class="form-control form-control-sm" name="ket" rows="2">${e.ket||""}</textarea>
            </div>

            <div class="mb-3">
                <label class="form-label">Status Pembayaran</label>
                <select class="form-select form-select-sm" name="payment_status">
                    <option value="pending" ${e.payment_status==="pending"?"selected":""}>Pending</option>
                    <option value="paid" ${e.payment_status==="paid"?"selected":""}>Lunas</option>
                </select>
            </div>
        </form>
    `}async function q(e,a){const n=document.getElementById("edit-form");if(!n.checkValidity()){n.reportValidity();return}const t=new FormData(n),o={title:t.get("title"),status:t.get("status"),customer_id:t.get("customer_id")||null,employee_id:t.get("employee_id")||null,package_id:t.get("package_id")||null,ket:t.get("ket"),payment_status:t.get("payment_status"),updated_at:new Date().toISOString()},{error:s}=await c.from("work_orders").update(o).eq("id",e);if(s){m(`Error: ${s.message}`,"error");return}m("Antrian berhasil diperbarui","success"),a.hide(),window.location.reload()}async function W(e,a){const n=new bootstrap.Modal(document.getElementById("crudModal"));document.getElementById("crudModalTitle").textContent=`Pantau Instalasi - ${e.customers?.name||"Customer"}`;const t=document.getElementById("crudModalBody");t.innerHTML=h("Memuat Data Monitoring..."),n.show();const{data:o,error:s}=await c.from("installation_monitorings").select("*").eq("work_order_id",e.id).single();if(s&&s.code!=="PGRST116"){m("Error loading monitoring data","error"),n.hide();return}const l=o||{};t.innerHTML=`
        <form id="monitoring-form">
            <div class="mb-3">
                <label class="form-label">Status Instalasi</label>
                <select class="form-select form-select-sm" name="status" required>
                    <option value="not_started" ${l.status==="not_started"?"selected":""}>Belum Dimulai</option>
                    <option value="in_progress" ${l.status==="in_progress"?"selected":""}>Sedang Berlangsung</option>
                    <option value="completed" ${l.status==="completed"?"selected":""}>Selesai</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label">Catatan Teknis</label>
                <textarea class="form-control form-control-sm" name="notes" rows="3" placeholder="Catatan dari lapangan...">${l.notes||""}</textarea>
            </div>

            <div class="mb-3">
                <label class="form-label">Foto Instalasi</label>
                <input type="file" class="form-control form-control-sm" id="monitor-photo-input" accept="image/*" multiple>
                <small class="text-muted d-block mt-2">Upload foto instalasi (ukuran max per file: 5MB)</small>
            </div>

            <div id="photo-preview" class="row gap-2 mt-2"></div>

            <input type="hidden" name="work_order_id" value="${e.id}">
        </form>
    `;const r=document.getElementById("monitor-photo-input"),i=document.getElementById("photo-preview");r.addEventListener("change",d=>{i.innerHTML="",Array.from(d.target.files).forEach(p=>{if(p.size>5*1024*1024){m(`${p.name} terlalu besar (max 5MB)`,"warning");return}const u=new FileReader;u.onload=M=>{const w=document.createElement("div");w.className="col-auto",w.innerHTML=`
                    <div style="width:80px;height:80px;border-radius:4px;overflow:hidden;border:1px solid #444;">
                        <img src="${M.target.result}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                `,i.appendChild(w)},u.readAsDataURL(p)})}),document.getElementById("save-crud-btn").style.display="block",document.getElementById("save-crud-btn").onclick=async()=>{await j(e.id,l.id,r.files,a,n)}}async function j(e,a,n,t,o){const s=document.getElementById("monitoring-form"),l=new FormData(s),r=[];if(n&&n.length>0)for(let d=0;d<n.length;d++){const p=n[d],u=await N(p);r.push(u)}const i={work_order_id:e,status:l.get("status"),notes:l.get("notes"),photos:r.length>0?r:null,updated_at:new Date().toISOString()};if(a){const{error:d}=await c.from("installation_monitorings").update(i).eq("id",a);if(d){m(`Error: ${d.message}`,"error");return}}else{const{error:d}=await c.from("installation_monitorings").insert(i);if(d){m(`Error: ${d.message}`,"error");return}}m("Data monitoring berhasil disimpan","success"),o.hide(),t&&t()}function N(e){return new Promise((a,n)=>{const t=new FileReader;t.onload=()=>a(t.result),t.onerror=n,t.readAsDataURL(e)})}function O(e,a){new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const t=e.filter(r=>r.customers?.lat&&r.customers?.lng);if(t.length===0){alert("Tidak ada data PSB dengan koordinat yang valid untuk filter ini.");return}const o=L.map("admin-map").setView([t[0].customers.lat,t[0].customers.lng],12);window.adminModalMap=o,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o),F(o);const s=document.querySelector("#mapModal .modal-title");if(s){const r=a==="All"?"Semua Status":a;s.innerHTML=`<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${b(a)}">${r}</span> (${t.length} titik)`}const l=[];if(t.forEach(r=>{const i=b(r.status),d=L.marker([r.customers.lat,r.customers.lng],{icon:L.divIcon({className:"",html:R(i),iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}).addTo(o).bindPopup(z(r));l.push(d)}),l.length>1){const r=new L.featureGroup(l);o.fitBounds(r.getBounds().pad(.15))}},300)}function B(e,a){window.showAllPSBMap=()=>O(e,a)}function R(e){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${e}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}function z(e){const a=b(e.status),n=`https://www.google.com/maps?q=${e.customers?.lat},${e.customers?.lng}`;return`
        <div style="min-width:200px;font-family:sans-serif;">
            <div style="background:${a};color:#fff;padding:6px 10px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;font-weight:600;">
                <i class="bi bi-person"></i> ${e.customers?.name||"-"}
            </div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
                <tr><td style="color:#666;padding:2px 4px;">Status</td><td><span style="background:${a};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${v(e.status)}</span></td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Daftar</td><td>${e.registration_date||"-"}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">No HP</td><td>${e.customers?.phone||"-"}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Alamat</td><td>${e.customers?.address||"-"}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Petugas</td><td>${e.employees?.name||"-"}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Ket</td><td>${e.ket||"-"}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Bayar</td><td>${e.payment_status||"-"}</td></tr>
            </table>
            <div style="margin-top:8px;">
                <a href="${n}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                    <i class="bi bi-map"></i> Buka Google Maps
                </a>
            </div>
        </div>
    `}function F(e){const a=L.control({position:"bottomright"});a.onAdd=()=>{const n=L.DomUtil.create("div","map-legend"),t=["waiting","confirmed","open","closed"];return n.style.cssText="background:rgba(30,30,30,0.9);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;min-width:130px;border:1px solid #444;",n.innerHTML='<div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #444;padding-bottom:4px;">Legend Status</div>'+t.map(o=>`
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="width:12px;height:12px;border-radius:50%;background:${b(o)};display:inline-block;flex-shrink:0;border:1px solid #fff;"></span>
                    <span>${v(o)}</span>
                </div>`).join(""),n},a.addTo(e)}let f=[],g="All",x="";async function Y(){const e=document.getElementById("work-orders-content");if(!e)return;const a=document.getElementById("work-orders-list");if(!a){e.innerHTML='<div class="alert alert-danger">No list container found</div>';return}let n=document.querySelector(".admin-header");n||(n=document.createElement("div"),n.className="admin-header mb-3 d-flex justify-content-between align-items-center",e.parentNode.insertBefore(n,e)),n.innerHTML=`
        <div>
            <h3 class="m-0"><i class="bi bi-list-task"></i> Manajemen Antrian PSB</h3>
        </div>
        <div>
            <button class="btn btn-success btn-sm me-2" id="add-wo-btn">
                <i class="bi bi-plus-circle"></i> Tambah Antrian
            </button>
            <button class="btn btn-outline-secondary btn-sm" id="refresh-wo-btn">
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        </div>
    `;let t=document.getElementById("wo-status-summary");t||(t=document.createElement("div"),t.id="wo-status-summary",t.className="mb-3",e.parentNode.insertBefore(t,e)),await k(a,s=>{f=s,y()}),document.getElementById("add-wo-btn").onclick=()=>_(null),document.getElementById("refresh-wo-btn").onclick=()=>{k(a,s=>{f=s,y()})};const o=document.getElementById("map-button-wo");o&&(o.onclick=()=>{const s=E(f,g,x);B(s,g),window.showAllPSBMap()}),T(s=>{x=s,y()}),document.addEventListener("request-wo-confirmation",async s=>{const{woId:l}=s.detail,r=f.find(i=>i.id===l);if(r)$(r);else{const{data:i,error:d}=await c.from("work_orders").select("*").eq("id",l).single();i?$(i):m(`Work order with ID ${l} not found.`,"error")}})}function y(){I(f,g,a=>{g=a,y()});const e=E(f,g,x);B(e,g),S(e,a=>U(a),a=>$(a))}async function $(e){const a=document.getElementById("assignConfirmModal"),n=new bootstrap.Modal(a),t=document.getElementById("assign-wo-code"),o=document.getElementById("save-assign-confirm-btn");t.textContent=e.work_order_code;const s=async()=>{o.disabled=!0,o.innerHTML='<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';const{error:l}=await c.from("work_orders").update({status:"confirmed"}).eq("id",e.id);if(l){m(`Error: ${l.message}`,"error"),o.disabled=!1,o.innerHTML="Simpan";return}const{error:r}=await c.from("installation_monitorings").insert({work_order_id:e.id,status:"confirmed",notes:"Work order dikonfirmasi oleh admin.",updated_by:(await c.auth.getUser()).data.user.email});r?m(`Work order dikonfirmasi, tapi gagal membuat log monitoring: ${r.message}`,"warning"):m("Work order berhasil dikonfirmasi.","success"),n.hide();const i=document.getElementById("work-orders-list");k(i,d=>{f=d,y()})};o._clickHandler&&o.removeEventListener("click",o._clickHandler),o._clickHandler=s,o.addEventListener("click",o._clickHandler),a.addEventListener("hidden.bs.modal",()=>{o.disabled=!1,o.innerHTML="Simpan",o._clickHandler&&o.removeEventListener("click",o._clickHandler)},{once:!0}),n.show()}async function U(e){const a=new bootstrap.Modal(document.getElementById("crudModal")),n=document.getElementById("crudModalBody");n.innerHTML=`
        <div class="text-center">
            <p class="mb-3">
                <strong>${e.customers?.name||"-"}</strong><br>
                <small class="text-muted">${e.title||"PSB"}</small>
            </p>
            <div class="d-grid gap-2">
                <button class="btn btn-primary" id="action-edit-wo">
                    <i class="bi bi-pencil"></i> Edit Antrian
                </button>
                <button class="btn btn-info" id="action-monitor-wo">
                    <i class="bi bi-graph-up"></i> Pantau Instalasi
                </button>
                <button class="btn btn-warning" id="action-close-wo">
                    <i class="bi bi-check-circle"></i> Tutup Antrian
                </button>
                <button class="btn btn-danger" id="action-delete-wo">
                    <i class="bi bi-trash"></i> Hapus Antrian
                </button>
            </div>
        </div>
    `,document.getElementById("crudModalTitle").textContent="Aksi Antrian",document.getElementById("save-crud-btn").style.display="none",document.getElementById("action-edit-wo").onclick=()=>{a.hide(),_(e)},document.getElementById("action-monitor-wo").onclick=()=>{a.hide(),W(e,()=>{location.reload()})},document.getElementById("action-close-wo").onclick=async()=>{const{error:t}=await c.from("work_orders").update({status:"closed",closed_at:new Date().toISOString()}).eq("id",e.id);if(t){m(`Error: ${t.message}`,"error");return}m("Antrian berhasil ditutup","success"),a.hide(),location.reload()},document.getElementById("action-delete-wo").onclick=async()=>{if(!confirm("Yakin ingin menghapus antrian ini?"))return;const{error:t}=await c.from("work_orders").delete().eq("id",e.id);if(t){m(`Error: ${t.message}`,"error");return}m("Antrian berhasil dihapus","success"),a.hide(),location.reload()},a.show()}export{Y as initWorkOrders};
