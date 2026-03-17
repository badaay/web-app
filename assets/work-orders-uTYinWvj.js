import{s as d}from"./config-CON8XM2G.js";import{s as k}from"./toast-D3E5iWRc.js";import{g as ae}from"./ui-common-hIOATXsD.js";async function ne(){const F=document.getElementById("work-orders-list"),z=document.getElementById("add-work-order-btn");let y=[],h="All",B="";z&&(z.onclick=()=>j()),document.addEventListener("quick-wo",e=>{const t=e.detail;t&&setTimeout(()=>{j(null,t)},100)});async function N(){if(!F)return;F.innerHTML=ae("Memuat Antrian...");const{data:e,error:t}=await d.from("work_orders").select("*, customers(*), employees(name)").order("created_at",{ascending:!1});if(t){F.innerHTML=`<div class="alert alert-danger">Error: ${t.message}</div>`;return}y=e,W(),X(),R()}function W(){const e=document.getElementById("wo-status-summary");if(!e)return;const t=y.reduce((l,s)=>(l[s.status]=(l[s.status]||0)+1,l),{}),a=["waiting","confirmed","open","closed"];e.innerHTML=`
            <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${h==="All"?"ring-active":""}"
                style="background:var(--vscode-accent);color:#fff;cursor:pointer;" 
                data-filter="All">Semua: ${y.length}</button>
            ${a.map(l=>`
                <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${h===l?"ring-active":""}"
                    style="background-color:${M(l)};color:#fff;cursor:pointer;"
                    data-filter="${l}">${l}: ${t[l]||0}</button>
            `).join("")}
        `,e.querySelectorAll(".wo-filter-badge").forEach(l=>{l.onclick=()=>{const s=l.dataset.filter;h=s===h&&s!=="All"?"All":s,W(),R()}})}function X(){if(document.getElementById("wo-search-bar"))return;const e=document.getElementById("work-orders-list"),t=document.createElement("div");t.id="wo-search-bar",t.className="mb-3 d-flex gap-2 align-items-center",t.innerHTML=`
            <div class="input-group input-group-sm" style="max-width:320px;">
                <span class="input-group-text bg-vscode-header border-0 text-white-50"><i class="bi bi-search"></i></span>
                <input id="wo-search-input" type="text" class="form-control" placeholder="Cari nama pelanggan, petugas, ket...">
            </div>
            <button class="btn btn-sm btn-outline-secondary" id="wo-clear-search"><i class="bi bi-x"></i></button>
        `,e.parentNode.insertBefore(t,e),document.getElementById("wo-search-input").addEventListener("input",a=>{B=a.target.value.toLowerCase(),R()}),document.getElementById("wo-clear-search").addEventListener("click",()=>{B="",document.getElementById("wo-search-input").value="",R()})}function K(){let e=h==="All"?y:y.filter(t=>t.status===h);return B&&(e=e.filter(t=>(t.customers?.name||"").toLowerCase().includes(B)||(t.employees?.name||"").toLowerCase().includes(B)||(t.ket||"").toLowerCase().includes(B)||(t.description||"").toLowerCase().includes(B)||(t.status||"").toLowerCase().includes(B))),e}function R(){const e=K();F.innerHTML=`
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Registrasi</th>
                            <th>Status / Ket</th>
                            <th>Pelanggan</th>
                            <th>Teknisi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.length===0?`<tr><td colspan="5" class="text-center text-white-50 py-5">
                            <i class="bi bi-clipboard-x fs-1 d-block mb-3"></i>
                            Tidak ada data yang cocok.
                        </td></tr>`:""}
                        ${e.map(t=>`
                            <tr>
                                <td>
                                    <div class="fw-bold text-accent">${t.registration_date||"-"}</div>
                                    <div class="small text-white-50">Daftar: ${new Date(t.created_at).toLocaleDateString("id-ID")}</div>
                                </td>
                                <td>
                                    <div class="mb-1">
                                        <span class="badge rounded-pill px-3" style="background-color:${M(t.status)};color:#fff;">
                                            ${t.status}
                                        </span>
                                    </div>
                                    <div class="small text-white-50">${t.ket||t.title||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.customers?.name||"-"}</div>
                                    <div class="small text-white-50">${t.customers?.phone||"-"}</div>
                                    <div class="small fst-italic text-white-50 text-wrap" style="max-width: 250px;">${t.customers?.address||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.employees?.name||"-"}</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${t.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${t.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${t.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                        ${t.status==="confirmed"||t.status==="open"||t.status==="closed"?`<button class="btn btn-outline-success monitor-wo" data-id="${t.id}" title="Pantau Pemasangan"><i class="bi bi-tools"></i></button>`:""}
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-wo").forEach(t=>{t.onclick=()=>j(y.find(a=>a.id===t.dataset.id))}),document.querySelectorAll(".view-wo-map").forEach(t=>{t.onclick=()=>ee(y.find(a=>a.id===t.dataset.id))}),document.querySelectorAll(".copy-wo-format").forEach(t=>{t.onclick=()=>{const a=y.find(m=>m.id===t.dataset.id),l=a.customers?.lat?`https://www.google.com/maps?q=${a.customers.lat},${a.customers.lng}`:"(Peta belum set)",s=`${a.customers?.name||"-"}, ${a.customers?.address||"-"}, ${a.customers?.phone||"-"}, ${l}, (${a.points||0} poin)`;navigator.clipboard.writeText(s),k("success","Format PSB berhasil disalin!")}}),document.querySelectorAll(".monitor-wo").forEach(t=>{t.onclick=()=>Y(y.find(a=>a.id===t.dataset.id))})}function M(e){return{waiting:"#f97316",confirmed:"#22c55e",open:"#3b82f6",closed:"#6b7280",Pending:"#f97316",Konfirmasi:"#22c55e",Selesai:"#6b7280",Cancel:"#374151"}[e]||"#6c757d"}async function j(e=null,t=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),l=document.getElementById("crudModalTitle"),s=document.getElementById("crudModalBody"),m=document.getElementById("save-crud-btn"),{data:r}=await d.from("customers").select("*").order("name"),{data:c}=await d.from("employees").select("id, name").order("name"),{data:p}=await d.from("master_queue_types").select("*").order("name");let g=null;if(e){const{data:o}=await d.from("installation_monitorings").select("*").eq("work_order_id",e.id).maybeSingle();g=o}l.innerText=e?"Edit Antrian PSB":t?"Buat Tiket Perbaikan":"Tambah Antrian PSB Baru",s.innerHTML=`
            <form id="work-order-form" class="row">
                <!-- LEFT COLUMN: CUSTOMER -->
                <div class="col-md-6 border-end border-secondary">
                    <h6 class="text-accent mb-3"><i class="bi bi-person"></i> Data Pelanggan</h6>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Cari / Pilih Pelanggan (Sedia Ada)</label>
                        <select class="form-select" id="wo-customer-select">
                            <option value="">-- Buat Pelanggan Baru --</option>
                            ${r?.map(o=>`<option value="${o.id}" ${e?.customer_id===o.id||t?.id===o.id?"selected":""} 
                                data-name="${o.name||""}" data-phone="${o.phone||""}" data-address="${o.address||""}" 
                                data-lat="${o.lat||""}" data-lng="${o.lng||""}" data-ktp="${o.ktp||""}">
                                ${o.name} - ${o.phone||""}
                            </option>`).join("")}
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-white-50">Nama Pelanggan (Wajib)</label>
                        <input type="text" class="form-control" id="wo-cust-name" value="${e?.customers?.name||t?.name||""}" required placeholder="Nama Sesuai KTP">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-white-50">No Handphone (Wajib)</label>
                        <input type="text" class="form-control" id="wo-cust-phone" value="${e?.customers?.phone||t?.phone||""}" required placeholder="08xxxxxxxx">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Alamat Lengkap</label>
                        <textarea class="form-control" id="wo-cust-address" rows="2" placeholder="Detail Alamat">${e?.customers?.address||t?.address||""}</textarea>
                    </div>
                    <div class="row g-2 mb-3 align-items-center">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Latitude</label>
                            <input type="number" step="any" class="form-control" id="wo-cust-lat" value="${e?.customers?.lat||t?.lat||""}" placeholder="-7.xxxxx">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Longitude</label>
                            <input type="number" step="any" class="form-control" id="wo-cust-lng" value="${e?.customers?.lng||t?.lng||""}" placeholder="112.xxxxx">
                        </div>
                        <div class="col-12 mt-2">
                            <div class="position-relative">
                                <div id="wo-location-picker" class="rounded border border-secondary shadow-sm" style="height: 200px; background: #1e1e1e; z-index: 1;"></div>
                                <button type="button" id="wo-btn-get-location" class="btn btn-sm btn-dark border-secondary position-absolute" style="top: 10px; right: 10px; z-index: 1000;">
                                    <i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi
                                </button>
                            </div>
                        </div>
                        <div class="col-12 mt-1">
                            <a href="#" id="wo-maps-link" target="_blank" class="small text-info text-decoration-none" style="display: none;">
                                <i class="bi bi-geo-alt-fill"></i> Buka Titik di Google Maps
                            </a>
                        </div>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Foto Rumah</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="wo-photo-rumah" value="${e?.photo_url||""}" placeholder="URL / File">
                                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('wo-file-rumah').click()"><i class="bi bi-upload"></i></button>
                                <input type="file" id="wo-file-rumah" class="d-none" accept="image/*">
                            </div>
                            <div id="wo-preview-rumah" class="mt-2 text-center" style="${e?.photo_url?"display:block;":"display:none;"}">
                                <img src="${e?.photo_url||""}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; object-fit: cover; border-radius: 6px;">
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Foto KTP</label>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="wo-photo-ktp" value="${e?.customers?.ktp||t?.ktp||""}" placeholder="URL / File">
                                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('wo-file-ktp').click()"><i class="bi bi-upload"></i></button>
                                <input type="file" id="wo-file-ktp" class="d-none" accept="image/*">
                            </div>
                            <div id="wo-preview-ktp" class="mt-2 text-center" style="${e?.customers?.ktp||t?.ktp?"display:block;":"display:none;"}">
                                <img src="${e?.customers?.ktp||t?.ktp||""}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; object-fit: cover; border-radius: 6px;">
                            </div>
                        </div>
                        <div class="col-12 small text-white-50 fst-italic mt-1" style="font-size:0.75rem;">* Anda bisa input URL langsung atau upload file gambar dari perangkat Anda.</div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: WORK ORDER & INSTALLATION -->
                <div class="col-md-6">
                    <h6 class="text-accent mb-3"><i class="bi bi-card-checklist"></i> Antrian & Pemasangan</h6>
                    
                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Tanggal Daftar (Wajib)</label>
                            <input type="date" class="form-control" id="wo-reg-date" value="${e?.registration_date||new Date().toISOString().split("T")[0]}" required>
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Status Antrian</label>
                            <select class="form-select" id="wo-status">
                                <option value="waiting" ${e?.status==="waiting"?"selected":""}>Waiting (Menunggu)</option>
                                <option value="confirmed" ${e?.status==="confirmed"?"selected":""}>Confirmed (Divalidasi)</option>
                                <option value="open" ${e?.status==="open"?"selected":""}>Open (Pengerjaan)</option>
                                <option value="closed" ${e?.status==="closed"?"selected":""}>Closed (Selesai)</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-white-50">Tipe Antrian</label>
                        <select class="form-select" id="wo-type-id">
                            <option value="">-- Pilih Tipe --</option>
                            ${p?.map(o=>`<option value="${o.id}" ${e?.type_id===o.id||t&&o.name==="Repair"?"selected":""}>${o.name}</option>`).join("")}
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Teknisi / Petugas (Lead)</label>
                        <select class="form-select" id="wo-employee-id">
                            <option value="">Belum Ditugaskan...</option>
                            ${c?.map(o=>`<option value="${o.id}" ${e?.employee_id===o.id?"selected":""}>${o.name}</option>`).join("")}
                        </select>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Pembayaran</label>
                            <input type="text" class="form-control" id="wo-payment" value="${e?.payment_status||""}" placeholder="Cth: Lunas via TF">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Keterangan Paket</label>
                            <input type="text" class="form-control" id="wo-ket" value="${e?.ket||""}" placeholder="Cth: Paket Up to 30Mbps">
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Catatan Internal</label>
                        <textarea class="form-control" id="wo-description" rows="2" placeholder="Catatan tambahan...">${e?.description||""}</textarea>
                    </div>

                    <!-- Installation Specifics -->
                    <h6 class="text-accent mb-2 mt-4 border-top border-secondary pt-3"><i class="bi bi-calendar-event"></i> Jadwal Pemasangan</h6>
                    <div class="row g-2 mb-3">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Rencana Tgl Pemasangan</label>
                            <input type="date" class="form-control" id="wo-planned-date" value="${g?.planned_date||""}">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Aktual Terpasang</label>
                            <input type="date" class="form-control" id="wo-actual-date" value="${g?.actual_date||""}">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Tanggal Aktif Billing</label>
                            <input type="date" class="form-control" id="wo-activation-date" value="${g?.activation_date||""}">
                        </div>
                        <div class="col-sm-6 d-flex align-items-end mb-1">
                            <div class="form-check form-switch w-100">
                                <input class="form-check-input" type="checkbox" role="switch" id="wo-is-confirmed" ${g?.is_confirmed?"checked":""}>
                                <label class="form-check-label small text-white" for="wo-is-confirmed">Pemasangan Dikonfirmasi</label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `,setTimeout(()=>{let o,u;const b=()=>{const n=document.getElementById("wo-cust-lat").value,i=document.getElementById("wo-cust-lng").value,P=document.getElementById("wo-maps-link");n&&i?(P.href=`https://www.google.com/maps?q=${n},${i}`,P.style.display="inline-block",u&&u.setLatLng([n,i])):P.style.display="none"},T=parseFloat(document.getElementById("wo-cust-lat").value)||-7.15097,f=parseFloat(document.getElementById("wo-cust-lng").value)||112.721245;o=L.map("wo-location-picker").setView([T,f],13),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o),document.getElementById("wo-cust-lat").value&&document.getElementById("wo-cust-lng").value&&(u=L.marker([T,f]).addTo(o));const I=(n,i)=>{document.getElementById("wo-cust-lat").value=n.toFixed(7),document.getElementById("wo-cust-lng").value=i.toFixed(7),u&&u.remove(),u=L.marker([n,i]).addTo(o),o.setView([n,i],16),b()};o.on("click",n=>I(n.latlng.lat,n.latlng.lng)),document.getElementById("wo-btn-get-location").onclick=()=>{if(!navigator.geolocation)return k("warning","Geolokasi tidak didukung.");document.getElementById("wo-btn-get-location").innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>...',navigator.geolocation.getCurrentPosition(n=>{I(n.coords.latitude,n.coords.longitude),document.getElementById("wo-btn-get-location").innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya'},n=>{k("error","Gagal: "+n.message),document.getElementById("wo-btn-get-location").innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya'})},setTimeout(()=>o.invalidateSize(),300);const w=(n,i,P)=>{const U=document.getElementById(n),D=document.getElementById(i),S=document.getElementById(P),C=S.querySelector("img");U.addEventListener("change",A=>{const _=A.target.files[0];if(_){const q=new FileReader;q.onload=O=>{D.value=O.target.result,C.src=O.target.result,S.style.display="block"},q.readAsDataURL(_)}}),D.addEventListener("input",A=>{A.target.value?(C.src=A.target.value,S.style.display="block"):S.style.display="none"})};w("wo-file-rumah","wo-photo-rumah","wo-preview-rumah"),w("wo-file-ktp","wo-photo-ktp","wo-preview-ktp");const E=document.getElementById("wo-cust-lat"),v=document.getElementById("wo-cust-lng");E&&v&&(E.addEventListener("input",b),v.addEventListener("input",b),b());const $=document.getElementById("wo-customer-select");$&&$.addEventListener("change",n=>{const i=n.target.options[n.target.selectedIndex];n.target.value?(document.getElementById("wo-cust-name").value=i.dataset.name||"",document.getElementById("wo-cust-phone").value=i.dataset.phone||"",document.getElementById("wo-cust-address").value=i.dataset.address||"",document.getElementById("wo-cust-lat").value=i.dataset.lat||"",document.getElementById("wo-cust-lng").value=i.dataset.lng||"",document.getElementById("wo-photo-ktp").value=i.dataset.ktp||""):(document.getElementById("wo-cust-name").value="",document.getElementById("wo-cust-phone").value="",document.getElementById("wo-cust-address").value="",document.getElementById("wo-cust-lat").value="",document.getElementById("wo-cust-lng").value="",document.getElementById("wo-photo-ktp").value=""),b()})},100),m.onclick=async()=>{const o=document.getElementById("wo-customer-select").value,u=document.getElementById("wo-cust-name").value,b=document.getElementById("wo-cust-phone").value,T=document.getElementById("wo-cust-address").value,f=document.getElementById("wo-cust-lat").value,I=document.getElementById("wo-cust-lng").value,w=document.getElementById("wo-photo-ktp").value,E=document.getElementById("wo-reg-date").value,v=document.getElementById("wo-status").value,$=document.getElementById("wo-employee-id").value||null,n=document.getElementById("wo-payment").value,i=document.getElementById("wo-ket").value,P=document.getElementById("wo-description").value,U=document.getElementById("wo-photo-rumah").value,D=document.getElementById("wo-planned-date").value||null,S=document.getElementById("wo-actual-date").value||null,C=document.getElementById("wo-activation-date").value||null,A=document.getElementById("wo-is-confirmed").checked;if(!u||!b||!E)return k("warning","Mohon isi field Wajib (Nama, No HP, Tanggal Daftar).");m.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...',m.disabled=!0;try{let _=o;const{data:q}=await d.from("roles").select("id").eq("name","Customer").maybeSingle(),O=q?q.id:null,J={name:u,phone:b,address:T,lat:f?parseFloat(f):null,lng:I?parseFloat(I):null,ktp:w,role_id:O};if(o)await d.from("customers").update(J).eq("id",o);else{const{data:x,error:H}=await d.from("customers").insert([J]).select().single();if(H)throw H;_=x.id}const Q={customer_id:_,employee_id:$,type_id:document.getElementById("wo-type-id").value||null,status:v,source:e?e.source:"admin",title:"Pemasangan Baru (PSB)",payment_status:n,ket:i,description:P,photo_url:U,registration_date:E,updated_at:new Date().toISOString()};let Z=e?.id;if(e){const{error:x}=await d.from("work_orders").update(Q).eq("id",e.id);if(x)throw x}else{const{data:x,error:H}=await d.from("work_orders").insert([Q]).select().single();if(H)throw H;Z=x.id}if(v==="confirmed"||v==="open"||v==="closed"||D||S||C||A||g){const x={work_order_id:Z,customer_id:_,employee_id:$,planned_date:D,actual_date:S,activation_date:C,is_confirmed:A,updated_at:new Date().toISOString()};g?await d.from("installation_monitorings").update(x).eq("id",g.id):await d.from("installation_monitorings").insert([x])}a.hide(),N(),k("success","Data antrian berhasil disimpan!")}catch(_){k("error","Gagal menyimpan: "+_.message)}finally{m.innerHTML="Simpan",m.disabled=!1}},a.show()}async function Y(e){if(!e)return;const t=new bootstrap.Modal(document.getElementById("crudModal")),a=document.getElementById("crudModalTitle"),l=document.getElementById("crudModalBody"),s=document.getElementById("save-crud-btn");a.innerHTML='<i class="bi bi-tools text-success me-2"></i> Pantau Proses Pemasangan',l.innerHTML='<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>',t.show();const{data:m,error:r}=await d.from("installation_monitorings").select("*").eq("work_order_id",e.id).maybeSingle(),c=m||{};l.innerHTML=`
            <form id="monitor-form">
                <div class="alert bg-dark border-secondary text-white-50 mb-4 p-3 shadow-sm">
                    <table>
                        <tr><td style="width: 80px;" class="fw-bold">Pelanggan</td><td>: ${e.customers?.name||"-"}</td></tr>
                        <tr><td class="fw-bold">No HP</td><td>: ${e.customers?.phone||"-"}</td></tr>
                        <tr><td class="fw-bold">Teknisi</td><td>: ${e.employees?.name||"-"}</td></tr>
                        <tr><td class="fw-bold">Alamat</td><td>: ${e.customers?.address||"-"}</td></tr>
                    </table>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Rencana Pemasangan</label>
                        <input type="date" class="form-control" id="mon-planned-date" value="${c.planned_date||""}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Aktual Pemasangan</label>
                        <input type="date" class="form-control" id="mon-actual-date" value="${c.actual_date||""}">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small text-white-50">Bukti Foto Instalasi</label>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" id="mon-photo" value="${c.photo_proof||""}" placeholder="URL / File">
                            <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('mon-file-photo').click()"><i class="bi bi-upload"></i></button>
                            <input type="file" id="mon-file-photo" class="d-none" accept="image/*">
                        </div>
                        <div id="mon-preview-photo" class="mt-2 text-center" style="${c.photo_proof?"display:block;":"display:none;"}">
                            <img src="${c.photo_proof||""}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" onerror="this.style.display='none'">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">MAC Address Modem</label>
                        <input type="text" class="form-control" id="mon-mac" value="${c.mac_address||""}" placeholder="Cth: 1A:2B:3C:4D:5E:6F">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">SN Modem (Serial Number)</label>
                        <input type="text" class="form-control" id="mon-sn" value="${c.sn_modem||""}" placeholder="Cth: ZTE12345678">
                    </div>
                    <div class="col-12 mt-4 p-3 bg-dark border border-secondary rounded shadow-sm">
                        <div class="form-check form-switch fs-6 mb-0 d-flex align-items-center">
                            <input class="form-check-input mt-0 me-3" type="checkbox" role="switch" id="mon-is-confirmed" ${c.is_confirmed?"checked":""} style="transform: scale(1.3);">
                            <label class="form-check-label text-white fw-bold" for="mon-is-confirmed">Pemasangan Selesai Dikerjakan (Dikonfirmasi)</label>
                        </div>
                    </div>
                </div>
            </form>
        `,setTimeout(()=>{((g,o,u)=>{const b=document.getElementById(g),T=document.getElementById(o),f=document.getElementById(u),I=f.querySelector("img");b.addEventListener("change",w=>{const E=w.target.files[0];if(E){const v=new FileReader;v.onload=$=>{T.value=$.target.result,I.src=$.target.result,f.style.display="block"},v.readAsDataURL(E)}}),T.addEventListener("input",w=>{w.target.value?(I.src=w.target.value,f.style.display="block"):f.style.display="none"})})("mon-file-photo","mon-photo","mon-preview-photo")},100),s.onclick=async()=>{s.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...',s.disabled=!0;try{const p={work_order_id:e.id,customer_id:e.customer_id,employee_id:e.employee_id,planned_date:document.getElementById("mon-planned-date").value||null,actual_date:document.getElementById("mon-actual-date").value||null,photo_proof:document.getElementById("mon-photo").value,mac_address:document.getElementById("mon-mac").value,sn_modem:document.getElementById("mon-sn").value,is_confirmed:document.getElementById("mon-is-confirmed").checked,updated_at:new Date().toISOString()};c.id?await d.from("installation_monitorings").update(p).eq("id",c.id):await d.from("installation_monitorings").insert([p]),p.is_confirmed&&e.status!=="closed"&&confirm("Pemasangan dikonfirmasi. Ganti status antrian PSB menjadi Closed (Selesai)?")&&await d.from("work_orders").update({status:"closed"}).eq("id",e.id),t.hide(),N(),k("success","Monitoring instalasi berhasil diperbarui!")}catch(p){k("error","Error: "+p.message)}finally{s.innerHTML="Simpan",s.disabled=!1}}}function ee(e){if(!e.customers?.lat||!e.customers?.lng)return k("warning","Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=L.map("admin-map").setView([e.customers.lat,e.customers.lng],15);window.adminModalMap=a,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a);const l=M(e.status),s=G(l);L.marker([e.customers.lat,e.customers.lng],{icon:L.divIcon({className:"",html:s,iconSize:[32,40],iconAnchor:[16,40],popupAnchor:[0,-40]})}).addTo(a).bindPopup(V(e)).openPopup()},300)}window.showAllPSBMap=()=>{new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=K().filter(r=>r.customers?.lat&&r.customers?.lng);if(a.length===0)return alert("Tidak ada data PSB dengan koordinat yang valid untuk filter ini.");const l=L.map("admin-map").setView([a[0].customers.lat,a[0].customers.lng],12);window.adminModalMap=l,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l),te(l);const s=document.querySelector("#mapModal .modal-title");if(s){const r=h==="All"?"Semua Status":h;s.innerHTML=`<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${M(h)}">${r}</span> (${a.length} titik)`}const m=[];if(a.forEach(r=>{const c=M(r.status),p=L.marker([r.customers.lat,r.customers.lng],{icon:L.divIcon({className:"",html:G(c),iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}).addTo(l).bindPopup(V(r));m.push(p)}),m.length>1){const r=new L.featureGroup(m);l.fitBounds(r.getBounds().pad(.15))}},300)};function G(e){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${e}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
        </svg>`}function V(e){const t=M(e.status),a=`https://www.google.com/maps?q=${e.customers?.lat},${e.customers?.lng}`;return`
            <div style="min-width:200px;font-family:sans-serif;">
                <div style="background:${t};color:#fff;padding:6px 10px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;font-weight:600;">
                    <i class="bi bi-person"></i> ${e.customers?.name||"-"}
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:2px 4px;">Status</td><td><span style="background:${t};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${e.status}</span></td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Daftar</td><td>${e.registration_date||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">No HP</td><td>${e.customers?.phone||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Alamat</td><td>${e.customers?.address||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Petugas</td><td>${e.employees?.name||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Ket</td><td>${e.ket||"-"}</td></tr>
                    <tr><td style="color:#666;padding:2px 4px;">Bayar</td><td>${e.payment_status||"-"}</td></tr>
                </table>
                <div style="margin-top:8px;">
                    <a href="${a}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>
            </div>
        `}function te(e){const t=L.control({position:"bottomright"});t.onAdd=()=>{const a=L.DomUtil.create("div","map-legend"),l=["Antrian","Pending","Konfirmasi","ODP Penuh","Cancel","Completed"];return a.style.cssText="background:rgba(30,30,30,0.9);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;min-width:130px;border:1px solid #444;",a.innerHTML='<div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #444;padding-bottom:4px;">Legend Status</div>'+l.map(s=>`
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:12px;height:12px;border-radius:50%;background:${M(s)};display:inline-block;flex-shrink:0;border:1px solid #fff;"></span>
                        <span>${s}</span>
                    </div>`).join(""),a},t.addTo(e)}if(!document.getElementById("psb-styles")){const e=document.createElement("style");e.id="psb-styles",e.innerHTML=`
            .bg-brown { background-color: #795548; color: #fff; }
            .wo-filter-badge.ring-active { outline: 2px solid #fff; outline-offset: 2px; }
            .wo-filter-badge:hover { opacity: 0.85; }
        `,document.head.appendChild(e)}N()}export{ne as initWorkOrders};
