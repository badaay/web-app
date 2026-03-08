import{s as p}from"./supabase-DlQAt1xf.js";async function S(){const b=document.getElementById("work-orders-list"),f=document.getElementById("add-work-order-btn");let r=[],i="All",d="";f&&(f.onclick=()=>x());async function h(){if(!b)return;b.innerHTML='<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat Antrian...</div></div>';const{data:t,error:e}=await p.from("work_orders").select("*, customers(*), employees(name)").order("created_at",{ascending:!1});if(e){b.innerHTML=`<div class="alert alert-danger">Error: ${e.message}</div>`;return}r=t,v(),k(),g()}function v(){const t=document.getElementById("wo-status-summary");if(!t)return;const e=r.reduce((o,s)=>(o[s.status]=(o[s.status]||0)+1,o),{}),a=["Antrian","Pending","Konfirmasi","ODP Penuh","Cancel","Completed"];t.innerHTML=`
            <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${i==="All"?"ring-active":""}"
                style="background:var(--vscode-accent);color:#fff;cursor:pointer;" 
                data-filter="All">Semua: ${r.length}</button>
            ${a.map(o=>`
                <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${i===o?"ring-active":""}"
                    style="background-color:${c(o)};color:#fff;cursor:pointer;"
                    data-filter="${o}">${o}: ${e[o]||0}</button>
            `).join("")}
        `,t.querySelectorAll(".wo-filter-badge").forEach(o=>{o.onclick=()=>{const s=o.dataset.filter;i=s===i&&s!=="All"?"All":s,v(),g()}})}function k(){if(document.getElementById("wo-search-bar"))return;const t=document.getElementById("work-orders-list"),e=document.createElement("div");e.id="wo-search-bar",e.className="mb-3 d-flex gap-2 align-items-center",e.innerHTML=`
            <div class="input-group input-group-sm" style="max-width:320px;">
                <span class="input-group-text bg-vscode-header border-0 text-white-50"><i class="bi bi-search"></i></span>
                <input id="wo-search-input" type="text" class="form-control" placeholder="Cari nama pelanggan, petugas, ket...">
            </div>
            <button class="btn btn-sm btn-outline-secondary" id="wo-clear-search"><i class="bi bi-x"></i></button>
        `,t.parentNode.insertBefore(e,t),document.getElementById("wo-search-input").addEventListener("input",a=>{d=a.target.value.toLowerCase(),g()}),document.getElementById("wo-clear-search").addEventListener("click",()=>{d="",document.getElementById("wo-search-input").value="",g()})}function y(){let t=i==="All"?r:r.filter(e=>e.status===i);return d&&(t=t.filter(e=>(e.customers?.name||"").toLowerCase().includes(d)||(e.employees?.name||"").toLowerCase().includes(d)||(e.ket||"").toLowerCase().includes(d)||(e.description||"").toLowerCase().includes(d)||(e.status||"").toLowerCase().includes(d))),t}function g(){const t=y();b.innerHTML=`
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Registrasi</th>
                            <th>Status / Ket</th>
                            <th>Pelanggan</th>
                            <th>Petugas / Poin</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.length===0?'<tr><td colspan="5" class="text-center text-white-50 py-4">Tidak ada data yang cocok.</td></tr>':""}
                        ${t.map(e=>`
                            <tr>
                                <td>
                                    <div class="fw-bold text-accent">${e.registration_date||"-"}</div>
                                    <div class="small text-white-50">Daftar: ${new Date(e.created_at).toLocaleDateString("id-ID")}</div>
                                </td>
                                <td>
                                    <div class="mb-1">
                                        <span class="badge" style="background-color:${c(e.status)};color:#fff;">
                                            ${e.status}
                                        </span>
                                    </div>
                                    <div class="small text-white-50">${e.ket||e.title||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${e.customers?.name||"-"}</div>
                                    <div class="small text-white-50">${e.customers?.phone||"-"}</div>
                                    <div class="small fst-italic text-white-50">${e.customers?.address||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${e.employees?.name||"-"}</div>
                                    <div class="small"><i class="bi bi-star-fill text-warning me-1"></i>${e.points||0} Poin</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${e.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${e.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${e.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-wo").forEach(e=>{e.onclick=()=>x(r.find(a=>a.id===e.dataset.id))}),document.querySelectorAll(".view-wo-map").forEach(e=>{e.onclick=()=>P(r.find(a=>a.id===e.dataset.id))}),document.querySelectorAll(".copy-wo-format").forEach(e=>{e.onclick=()=>{const a=r.find(m=>m.id===e.dataset.id),o=a.customers?.lat?`https://www.google.com/maps?q=${a.customers.lat},${a.customers.lng}`:"(Peta belum set)",s=`${a.customers?.name||"-"}, ${a.customers?.address||"-"}, ${a.customers?.phone||"-"}, ${o}, (${a.points||0} poin)`;navigator.clipboard.writeText(s),M("Format PSB berhasil disalin!")}})}function c(t){return{Antrian:"#22c55e",Pending:"#f97316",Konfirmasi:"#3b82f6","ODP Penuh":"#a16207",Cancel:"#374151",Completed:"#6b7280",Selesai:"#6b7280"}[t]||"#6c757d"}async function x(t=null){const e=new bootstrap.Modal(document.getElementById("crudModal")),a=document.getElementById("crudModalTitle"),o=document.getElementById("crudModalBody"),s=document.getElementById("save-crud-btn"),{data:m}=await p.from("customers").select("*").order("name"),{data:n}=await p.from("employees").select("id, name").order("name");a.innerText=t?"Edit Antrian PSB":"Tambah Antrian PSB Baru",o.innerHTML=`
            <form id="work-order-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Tanggal Daftar (Wajib)</label>
                    <input type="date" class="form-control" id="wo-reg-date" value="${t?.registration_date||new Date().toISOString().split("T")[0]}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Status Antrian</label>
                    <select class="form-select" id="wo-status">
                        <option value="Antrian" ${t?.status==="Antrian"?"selected":""}>Antrian</option>
                        <option value="Pending" ${t?.status==="Pending"?"selected":""}>Pending</option>
                        <option value="Konfirmasi" ${t?.status==="Konfirmasi"?"selected":""}>Konfirmasi</option>
                        <option value="ODP Penuh" ${t?.status==="ODP Penuh"?"selected":""}>ODP Penuh</option>
                        <option value="Cancel" ${t?.status==="Cancel"?"selected":""}>Cancel</option>
                        <option value="Completed" ${t?.status==="Completed"||t?.status==="Selesai"?"selected":""}>Selesai</option>
                    </select>
                </div>
                <div class="col-md-12 mb-3">
                    <label class="form-label small text-white-50">Pelanggan (Wajib)</label>
                    <select class="form-select" id="wo-customer-id" required>
                        <option value="">Pilih Pelanggan...</option>
                        ${m?.map(l=>`<option value="${l.id}" ${t?.customer_id===l.id?"selected":""}>${l.name} - ${l.phone||""}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Teknisi / Petugas</label>
                    <select class="form-select" id="wo-employee-id">
                        <option value="">Pilih Petugas...</option>
                        ${n?.map(l=>`<option value="${l.id}" ${t?.employee_id===l.id?"selected":""}>${l.name}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Pembayaran</label>
                    <input type="text" class="form-control" id="wo-payment" value="${t?.payment_status||""}" placeholder="Contoh: Tunai, Transfer">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Nama Referal</label>
                    <input type="text" class="form-control" id="wo-referral" value="${t?.referral_name||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Ket Singkat</label>
                    <input type="text" class="form-control" id="wo-ket" value="${t?.ket||""}" placeholder="Data OK, Data Tidak Lengkap">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">Keterangan / Detail (Notes)</label>
                    <textarea class="form-control" id="wo-description" rows="2">${t?.description||""}</textarea>
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">URL Foto Rumah</label>
                    <input type="text" class="form-control" id="wo-photo" value="${t?.photo_url||""}" placeholder="https://...">
                </div>
            </form>
        `,s.onclick=async()=>{const l={registration_date:document.getElementById("wo-reg-date").value,customer_id:document.getElementById("wo-customer-id").value,employee_id:document.getElementById("wo-employee-id").value||null,status:document.getElementById("wo-status").value,title:"Pemasangan Baru (PSB)",payment_status:document.getElementById("wo-payment").value,referral_name:document.getElementById("wo-referral").value,ket:document.getElementById("wo-ket").value,description:document.getElementById("wo-description").value,photo_url:document.getElementById("wo-photo").value,updated_at:new Date().toISOString()};if(!l.registration_date||!l.customer_id)return alert("Tanggal Daftar dan Pelanggan wajib diisi.");let u;t?u=await p.from("work_orders").update(l).eq("id",t.id):u=await p.from("work_orders").insert([l]),u.error?alert("Gagal menyimpan: "+u.error.message):(e.hide(),h())},e.show()}function P(t){if(!t.customers?.lat||!t.customers?.lng)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=L.map("admin-map").setView([t.customers.lat,t.customers.lng],15);window.adminModalMap=a,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a);const o=c(t.status),s=w(o);L.marker([t.customers.lat,t.customers.lng],{icon:L.divIcon({className:"",html:s,iconSize:[32,40],iconAnchor:[16,40],popupAnchor:[0,-40]})}).addTo(a).bindPopup($(t)).openPopup()},300)}window.showAllPSBMap=()=>{new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=y().filter(n=>n.customers?.lat&&n.customers?.lng);if(a.length===0)return alert("Tidak ada data PSB dengan koordinat yang valid untuk filter ini.");const o=L.map("admin-map").setView([a[0].customers.lat,a[0].customers.lng],12);window.adminModalMap=o,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o),B(o);const s=document.querySelector("#mapModal .modal-title");if(s){const n=i==="All"?"Semua Status":i;s.innerHTML=`<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${c(i)}">${n}</span> (${a.length} titik)`}const m=[];if(a.forEach(n=>{const l=c(n.status),u=L.marker([n.customers.lat,n.customers.lng],{icon:L.divIcon({className:"",html:w(l),iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}).addTo(o).bindPopup($(n));m.push(u)}),m.length>1){const n=new L.featureGroup(m);o.fitBounds(n.getBounds().pad(.15))}},300)};function w(t){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${t}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
        </svg>`}function $(t){const e=c(t.status),a=`https://www.google.com/maps?q=${t.customers?.lat},${t.customers?.lng}`;return`
            <div style="min-width:200px;font-family:sans-serif;">
                <div style="background:${e};color:#fff;padding:6px 10px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;font-weight:600;">
                    <i class="bi bi-person"></i> ${t.customers?.name||"-"}
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;">Status</td><td><span style="background:${e};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${t.status}</span></td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Daftar</td><td>${t.registration_date||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">No HP</td><td>${t.customers?.phone||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Alamat</td><td>${t.customers?.address||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Petugas</td><td>${t.employees?.name||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Ket</td><td>${t.ket||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Bayar</td><td>${t.payment_status||"-"}</td></tr>
                </table>
                <div style="margin-top:8px;">
                    <a href="${a}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>
            </div>
        `}function B(t){const e=L.control({position:"bottomright"});e.onAdd=()=>{const a=L.DomUtil.create("div","map-legend"),o=["Antrian","Pending","Konfirmasi","ODP Penuh","Cancel","Completed"];return a.style.cssText="background:rgba(30,30,30,0.9);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;min-width:130px;border:1px solid #444;",a.innerHTML='<div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #444;padding-bottom:4px;">Legend Status</div>'+o.map(s=>`
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:12px;height:12px;border-radius:50%;background:${c(s)};display:inline-block;flex-shrink:0;border:1px solid #fff;"></span>
                        <span>${s}</span>
                    </div>`).join(""),a},e.addTo(t)}function M(t){const e=document.createElement("div");e.className="position-fixed bottom-0 end-0 m-3",e.style.zIndex=9999,e.innerHTML=`<div class="toast show align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex"><div class="toast-body">${t}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`,document.body.appendChild(e),setTimeout(()=>e.remove(),3e3)}if(!document.getElementById("psb-styles")){const t=document.createElement("style");t.id="psb-styles",t.innerHTML=`
            .bg-brown { background-color: #795548; color: #fff; }
            .wo-filter-badge.ring-active { outline: 2px solid #fff; outline-offset: 2px; }
            .wo-filter-badge:hover { opacity: 0.85; }
        `,document.head.appendChild(t)}h()}export{S as initWorkOrders};
