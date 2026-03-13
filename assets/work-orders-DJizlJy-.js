import{s as r}from"./supabase-BeOTOPRS.js";async function te(){const D=document.getElementById("work-orders-list"),N=document.getElementById("add-work-order-btn");let g=[],b="All",h="";N&&(N.onclick=()=>z());async function q(){if(!D)return;D.innerHTML='<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat Antrian...</div></div>';const{data:e,error:t}=await r.from("work_orders").select("*, customers(*), employees(name)").order("created_at",{ascending:!1});if(t){D.innerHTML=`<div class="alert alert-danger">Error: ${t.message}</div>`;return}g=e,R(),J(),H()}function R(){const e=document.getElementById("wo-status-summary");if(!e)return;const t=g.reduce((l,s)=>(l[s.status]=(l[s.status]||0)+1,l),{}),a=["Antrian","Pending","Konfirmasi","ODP Penuh","Cancel","Completed"];e.innerHTML=`
            <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${b==="All"?"ring-active":""}"
                style="background:var(--vscode-accent);color:#fff;cursor:pointer;" 
                data-filter="All">Semua: ${g.length}</button>
            ${a.map(l=>`
                <button class="badge me-1 mb-1 p-2 border-0 wo-filter-badge ${b===l?"ring-active":""}"
                    style="background-color:${I(l)};color:#fff;cursor:pointer;"
                    data-filter="${l}">${l}: ${t[l]||0}</button>
            `).join("")}
        `,e.querySelectorAll(".wo-filter-badge").forEach(l=>{l.onclick=()=>{const s=l.dataset.filter;b=s===b&&s!=="All"?"All":s,R(),H()}})}function J(){if(document.getElementById("wo-search-bar"))return;const e=document.getElementById("work-orders-list"),t=document.createElement("div");t.id="wo-search-bar",t.className="mb-3 d-flex gap-2 align-items-center",t.innerHTML=`
            <div class="input-group input-group-sm" style="max-width:320px;">
                <span class="input-group-text bg-vscode-header border-0 text-white-50"><i class="bi bi-search"></i></span>
                <input id="wo-search-input" type="text" class="form-control" placeholder="Cari nama pelanggan, petugas, ket...">
            </div>
            <button class="btn btn-sm btn-outline-secondary" id="wo-clear-search"><i class="bi bi-x"></i></button>
        `,e.parentNode.insertBefore(t,e),document.getElementById("wo-search-input").addEventListener("input",a=>{h=a.target.value.toLowerCase(),H()}),document.getElementById("wo-clear-search").addEventListener("click",()=>{h="",document.getElementById("wo-search-input").value="",H()})}function K(){let e=b==="All"?g:g.filter(t=>t.status===b);return h&&(e=e.filter(t=>(t.customers?.name||"").toLowerCase().includes(h)||(t.employees?.name||"").toLowerCase().includes(h)||(t.ket||"").toLowerCase().includes(h)||(t.description||"").toLowerCase().includes(h)||(t.status||"").toLowerCase().includes(h))),e}function H(){const e=K();D.innerHTML=`
            <div class="table-responsive">
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
                        ${e.length===0?'<tr><td colspan="5" class="text-center text-white-50 py-4">Tidak ada data yang cocok.</td></tr>':""}
                        ${e.map(t=>`
                            <tr>
                                <td>
                                    <div class="fw-bold text-accent">${t.registration_date||"-"}</div>
                                    <div class="small text-white-50">Daftar: ${new Date(t.created_at).toLocaleDateString("id-ID")}</div>
                                </td>
                                <td>
                                    <div class="mb-1">
                                        <span class="badge" style="background-color:${I(t.status)};color:#fff;">
                                            ${t.status}
                                        </span>
                                    </div>
                                    <div class="small text-white-50">${t.ket||t.title||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.customers?.name||"-"}</div>
                                    <div class="small text-white-50">${t.customers?.phone||"-"}</div>
                                    <div class="small fst-italic text-white-50">${t.customers?.address||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.employees?.name||"-"}</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${t.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${t.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${t.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                        ${t.status==="Konfirmasi"||t.status==="Completed"||t.status==="Selesai"?`<button class="btn btn-outline-success monitor-wo" data-id="${t.id}" title="Pantau Pemasangan"><i class="bi bi-tools"></i></button>`:""}
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-wo").forEach(t=>{t.onclick=()=>z(g.find(a=>a.id===t.dataset.id))}),document.querySelectorAll(".view-wo-map").forEach(t=>{t.onclick=()=>Z(g.find(a=>a.id===t.dataset.id))}),document.querySelectorAll(".copy-wo-format").forEach(t=>{t.onclick=()=>{const a=g.find(f=>f.id===t.dataset.id),l=a.customers?.lat?`https://www.google.com/maps?q=${a.customers.lat},${a.customers.lng}`:"(Peta belum set)",s=`${a.customers?.name||"-"}, ${a.customers?.address||"-"}, ${a.customers?.phone||"-"}, ${l}, (${a.points||0} poin)`;navigator.clipboard.writeText(s),Y("Format PSB berhasil disalin!")}}),document.querySelectorAll(".monitor-wo").forEach(t=>{t.onclick=()=>Q(g.find(a=>a.id===t.dataset.id))})}function I(e){return{Antrian:"#22c55e",Pending:"#f97316",Konfirmasi:"#3b82f6","ODP Penuh":"#a16207",Cancel:"#374151",Completed:"#6b7280",Selesai:"#6b7280"}[e]||"#6c757d"}async function z(e=null){const t=new bootstrap.Modal(document.getElementById("crudModal")),a=document.getElementById("crudModalTitle"),l=document.getElementById("crudModalBody"),s=document.getElementById("save-crud-btn"),{data:f}=await r.from("customers").select("*").order("name"),{data:c}=await r.from("employees").select("id, name").order("name");let i=null;if(e){const{data:o}=await r.from("installation_monitorings").select("*").eq("work_order_id",e.id).maybeSingle();i=o}a.innerText=e?"Edit Antrian PSB":"Tambah Antrian PSB Baru",l.innerHTML=`
            <form id="work-order-form" class="row">
                <!-- LEFT COLUMN: CUSTOMER -->
                <div class="col-md-6 border-end border-secondary">
                    <h6 class="text-accent mb-3"><i class="bi bi-person"></i> Data Pelanggan</h6>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Cari / Pilih Pelanggan (Sedia Ada)</label>
                        <select class="form-select" id="wo-customer-select">
                            <option value="">-- Buat Pelanggan Baru --</option>
                            ${f?.map(o=>`<option value="${o.id}" ${e?.customer_id===o.id?"selected":""} 
                                data-name="${o.name||""}" data-phone="${o.phone||""}" data-address="${o.address||""}" 
                                data-lat="${o.lat||""}" data-lng="${o.lng||""}" data-ktp="${o.ktp||""}">
                                ${o.name} - ${o.phone||""}
                            </option>`).join("")}
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-white-50">Nama Pelanggan (Wajib)</label>
                        <input type="text" class="form-control" id="wo-cust-name" value="${e?.customers?.name||""}" required placeholder="Nama Sesuai KTP">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-white-50">No Handphone (Wajib)</label>
                        <input type="text" class="form-control" id="wo-cust-phone" value="${e?.customers?.phone||""}" required placeholder="08xxxxxxxx">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Alamat Lengkap</label>
                        <textarea class="form-control" id="wo-cust-address" rows="2" placeholder="Detail Alamat">${e?.customers?.address||""}</textarea>
                    </div>
                    <div class="row g-2 mb-3 align-items-center">
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Latitude</label>
                            <input type="number" step="any" class="form-control" id="wo-cust-lat" value="${e?.customers?.lat||""}" placeholder="-7.xxxxx">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Longitude</label>
                            <input type="number" step="any" class="form-control" id="wo-cust-lng" value="${e?.customers?.lng||""}" placeholder="112.xxxxx">
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
                                <input type="text" class="form-control" id="wo-photo-ktp" value="${e?.customers?.ktp||""}" placeholder="URL / File">
                                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('wo-file-ktp').click()"><i class="bi bi-upload"></i></button>
                                <input type="file" id="wo-file-ktp" class="d-none" accept="image/*">
                            </div>
                            <div id="wo-preview-ktp" class="mt-2 text-center" style="${e?.customers?.ktp?"display:block;":"display:none;"}">
                                <img src="${e?.customers?.ktp||""}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; object-fit: cover; border-radius: 6px;">
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
                                <option value="Antrian" ${e?.status==="Antrian"?"selected":""}>Antrian</option>
                                <option value="Pending" ${e?.status==="Pending"?"selected":""}>Pending</option>
                                <option value="Konfirmasi" ${e?.status==="Konfirmasi"?"selected":""}>Konfirmasi</option>
                                <option value="ODP Penuh" ${e?.status==="ODP Penuh"?"selected":""}>ODP Penuh</option>
                                <option value="Cancel" ${e?.status==="Cancel"?"selected":""}>Cancel</option>
                                <option value="Completed" ${e?.status==="Completed"||e?.status==="Selesai"?"selected":""}>Selesai</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label small text-white-50">Teknisi / Petugas</label>
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
                            <input type="date" class="form-control" id="wo-planned-date" value="${i?.planned_date||""}">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Aktual Terpasang</label>
                            <input type="date" class="form-control" id="wo-actual-date" value="${i?.actual_date||""}">
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label small text-white-50">Tanggal Aktif Billing</label>
                            <input type="date" class="form-control" id="wo-activation-date" value="${i?.activation_date||""}">
                        </div>
                        <div class="col-sm-6 d-flex align-items-end mb-1">
                            <div class="form-check form-switch w-100">
                                <input class="form-check-input" type="checkbox" role="switch" id="wo-is-confirmed" ${i?.is_confirmed?"checked":""}>
                                <label class="form-check-label small text-white" for="wo-is-confirmed">Pemasangan Dikonfirmasi</label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `,setTimeout(()=>{let o,u;const p=()=>{const n=document.getElementById("wo-cust-lat").value,d=document.getElementById("wo-cust-lng").value,$=document.getElementById("wo-maps-link");n&&d?($.href=`https://www.google.com/maps?q=${n},${d}`,$.style.display="inline-block",u&&u.setLatLng([n,d])):$.style.display="none"},_=parseFloat(document.getElementById("wo-cust-lat").value)||-7.15097,E=parseFloat(document.getElementById("wo-cust-lng").value)||112.721245;o=L.map("wo-location-picker").setView([_,E],13),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o),document.getElementById("wo-cust-lat").value&&document.getElementById("wo-cust-lng").value&&(u=L.marker([_,E]).addTo(o));const w=(n,d)=>{document.getElementById("wo-cust-lat").value=n.toFixed(7),document.getElementById("wo-cust-lng").value=d.toFixed(7),u&&u.remove(),u=L.marker([n,d]).addTo(o),o.setView([n,d],16),p()};o.on("click",n=>w(n.latlng.lat,n.latlng.lng)),document.getElementById("wo-btn-get-location").onclick=()=>{if(!navigator.geolocation)return alert("Geolokasi tidak didukung.");document.getElementById("wo-btn-get-location").innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>...',navigator.geolocation.getCurrentPosition(n=>{w(n.coords.latitude,n.coords.longitude),document.getElementById("wo-btn-get-location").innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya'},n=>{alert("Gagal: "+n.message),document.getElementById("wo-btn-get-location").innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya'})},setTimeout(()=>o.invalidateSize(),300);const v=(n,d,$)=>{const F=document.getElementById(n),S=document.getElementById(d),P=document.getElementById($),T=P.querySelector("img");F.addEventListener("change",M=>{const B=M.target.files[0];if(B){const A=new FileReader;A.onload=O=>{S.value=O.target.result,T.src=O.target.result,P.style.display="block"},A.readAsDataURL(B)}}),S.addEventListener("input",M=>{M.target.value?(T.src=M.target.value,P.style.display="block"):P.style.display="none"})};v("wo-file-rumah","wo-photo-rumah","wo-preview-rumah"),v("wo-file-ktp","wo-photo-ktp","wo-preview-ktp");const x=document.getElementById("wo-cust-lat"),m=document.getElementById("wo-cust-lng");x&&m&&(x.addEventListener("input",p),m.addEventListener("input",p),p());const k=document.getElementById("wo-customer-select");k&&k.addEventListener("change",n=>{const d=n.target.options[n.target.selectedIndex];n.target.value?(document.getElementById("wo-cust-name").value=d.dataset.name||"",document.getElementById("wo-cust-phone").value=d.dataset.phone||"",document.getElementById("wo-cust-address").value=d.dataset.address||"",document.getElementById("wo-cust-lat").value=d.dataset.lat||"",document.getElementById("wo-cust-lng").value=d.dataset.lng||"",document.getElementById("wo-photo-ktp").value=d.dataset.ktp||""):(document.getElementById("wo-cust-name").value="",document.getElementById("wo-cust-phone").value="",document.getElementById("wo-cust-address").value="",document.getElementById("wo-cust-lat").value="",document.getElementById("wo-cust-lng").value="",document.getElementById("wo-photo-ktp").value=""),p()})},100),s.onclick=async()=>{const o=document.getElementById("wo-customer-select").value,u=document.getElementById("wo-cust-name").value,p=document.getElementById("wo-cust-phone").value,_=document.getElementById("wo-cust-address").value,E=document.getElementById("wo-cust-lat").value,w=document.getElementById("wo-cust-lng").value,v=document.getElementById("wo-photo-ktp").value,x=document.getElementById("wo-reg-date").value,m=document.getElementById("wo-status").value,k=document.getElementById("wo-employee-id").value||null,n=document.getElementById("wo-payment").value,d=document.getElementById("wo-ket").value,$=document.getElementById("wo-description").value,F=document.getElementById("wo-photo-rumah").value,S=document.getElementById("wo-planned-date").value||null,P=document.getElementById("wo-actual-date").value||null,T=document.getElementById("wo-activation-date").value||null,M=document.getElementById("wo-is-confirmed").checked;if(!u||!p||!x)return alert("Mohon isi field Wajib (Nama, No HP, Tanggal Daftar).");s.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...',s.disabled=!0;try{let B=o;const{data:A}=await r.from("roles").select("id").eq("name","Customer").maybeSingle(),O=A?A.id:null,W={name:u,phone:p,address:_,lat:E?parseFloat(E):null,lng:w?parseFloat(w):null,ktp:v,role_id:O};if(o)await r.from("customers").update(W).eq("id",o);else{const{data:y,error:C}=await r.from("customers").insert([W]).select().single();if(C)throw C;B=y.id}const G={customer_id:B,employee_id:k,status:m,title:"Pemasangan Baru (PSB)",payment_status:n,ket:d,description:$,photo_url:F,registration_date:x,updated_at:new Date().toISOString()};let V=e?.id;if(e){const{error:y}=await r.from("work_orders").update(G).eq("id",e.id);if(y)throw y}else{const{data:y,error:C}=await r.from("work_orders").insert([G]).select().single();if(C)throw C;V=y.id}if(m==="Konfirmasi"||m==="Completed"||m==="Selesai"||S||P||T||M||i){const y={work_order_id:V,customer_id:B,employee_id:k,planned_date:S,actual_date:P,activation_date:T,is_confirmed:M,updated_at:new Date().toISOString()};i?await r.from("installation_monitorings").update(y).eq("id",i.id):await r.from("installation_monitorings").insert([y])}t.hide(),q()}catch(B){alert("Gagal menyimpan: "+B.message)}finally{s.innerHTML="Simpan",s.disabled=!1}},t.show()}async function Q(e){if(!e)return;const t=new bootstrap.Modal(document.getElementById("crudModal")),a=document.getElementById("crudModalTitle"),l=document.getElementById("crudModalBody"),s=document.getElementById("save-crud-btn");a.innerHTML='<i class="bi bi-tools text-success me-2"></i> Pantau Proses Pemasangan',l.innerHTML='<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>',t.show();const{data:f,error:c}=await r.from("installation_monitorings").select("*").eq("work_order_id",e.id).maybeSingle(),i=f||{};l.innerHTML=`
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
                        <input type="date" class="form-control" id="mon-planned-date" value="${i.planned_date||""}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Aktual Pemasangan</label>
                        <input type="date" class="form-control" id="mon-actual-date" value="${i.actual_date||""}">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small text-white-50">Bukti Foto Instalasi</label>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" id="mon-photo" value="${i.photo_proof||""}" placeholder="URL / File">
                            <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('mon-file-photo').click()"><i class="bi bi-upload"></i></button>
                            <input type="file" id="mon-file-photo" class="d-none" accept="image/*">
                        </div>
                        <div id="mon-preview-photo" class="mt-2 text-center" style="${i.photo_proof?"display:block;":"display:none;"}">
                            <img src="${i.photo_proof||""}" class="img-thumbnail bg-dark border-secondary" style="max-height: 120px; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" onerror="this.style.display='none'">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">MAC Address Modem</label>
                        <input type="text" class="form-control" id="mon-mac" value="${i.mac_address||""}" placeholder="Cth: 1A:2B:3C:4D:5E:6F">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">SN Modem (Serial Number)</label>
                        <input type="text" class="form-control" id="mon-sn" value="${i.sn_modem||""}" placeholder="Cth: ZTE12345678">
                    </div>
                    <div class="col-12 mt-4 p-3 bg-dark border border-secondary rounded shadow-sm">
                        <div class="form-check form-switch fs-6 mb-0 d-flex align-items-center">
                            <input class="form-check-input mt-0 me-3" type="checkbox" role="switch" id="mon-is-confirmed" ${i.is_confirmed?"checked":""} style="transform: scale(1.3);">
                            <label class="form-check-label text-white fw-bold" for="mon-is-confirmed">Pemasangan Selesai Dikerjakan (Dikonfirmasi)</label>
                        </div>
                    </div>
                </div>
            </form>
        `,setTimeout(()=>{((u,p,_)=>{const E=document.getElementById(u),w=document.getElementById(p),v=document.getElementById(_),x=v.querySelector("img");E.addEventListener("change",m=>{const k=m.target.files[0];if(k){const n=new FileReader;n.onload=d=>{w.value=d.target.result,x.src=d.target.result,v.style.display="block"},n.readAsDataURL(k)}}),w.addEventListener("input",m=>{m.target.value?(x.src=m.target.value,v.style.display="block"):v.style.display="none"})})("mon-file-photo","mon-photo","mon-preview-photo")},100),s.onclick=async()=>{s.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...',s.disabled=!0;try{const o={work_order_id:e.id,customer_id:e.customer_id,employee_id:e.employee_id,planned_date:document.getElementById("mon-planned-date").value||null,actual_date:document.getElementById("mon-actual-date").value||null,photo_proof:document.getElementById("mon-photo").value,mac_address:document.getElementById("mon-mac").value,sn_modem:document.getElementById("mon-sn").value,is_confirmed:document.getElementById("mon-is-confirmed").checked,updated_at:new Date().toISOString()};i.id?await r.from("installation_monitorings").update(o).eq("id",i.id):await r.from("installation_monitorings").insert([o]),o.is_confirmed&&e.status!=="Completed"&&e.status!=="Selesai"&&confirm("Pemasangan dikonfirmasi. Ganti status antrian PSB menjadi Selesai?")&&await r.from("work_orders").update({status:"Selesai"}).eq("id",e.id),t.hide(),q()}catch(o){alert("Error: "+o.message)}finally{s.innerHTML="Simpan",s.disabled=!1}}}function Z(e){if(!e.customers?.lat||!e.customers?.lng)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=L.map("admin-map").setView([e.customers.lat,e.customers.lng],15);window.adminModalMap=a,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a);const l=I(e.status),s=U(l);L.marker([e.customers.lat,e.customers.lng],{icon:L.divIcon({className:"",html:s,iconSize:[32,40],iconAnchor:[16,40],popupAnchor:[0,-40]})}).addTo(a).bindPopup(j(e)).openPopup()},300)}window.showAllPSBMap=()=>{new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const a=K().filter(c=>c.customers?.lat&&c.customers?.lng);if(a.length===0)return alert("Tidak ada data PSB dengan koordinat yang valid untuk filter ini.");const l=L.map("admin-map").setView([a[0].customers.lat,a[0].customers.lng],12);window.adminModalMap=l,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l),X(l);const s=document.querySelector("#mapModal .modal-title");if(s){const c=b==="All"?"Semua Status":b;s.innerHTML=`<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${I(b)}">${c}</span> (${a.length} titik)`}const f=[];if(a.forEach(c=>{const i=I(c.status),o=L.marker([c.customers.lat,c.customers.lng],{icon:L.divIcon({className:"",html:U(i),iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}).addTo(l).bindPopup(j(c));f.push(o)}),f.length>1){const c=new L.featureGroup(f);l.fitBounds(c.getBounds().pad(.15))}},300)};function U(e){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${e}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
        </svg>`}function j(e){const t=I(e.status),a=`https://www.google.com/maps?q=${e.customers?.lat},${e.customers?.lng}`;return`
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
        `}function X(e){const t=L.control({position:"bottomright"});t.onAdd=()=>{const a=L.DomUtil.create("div","map-legend"),l=["Antrian","Pending","Konfirmasi","ODP Penuh","Cancel","Completed"];return a.style.cssText="background:rgba(30,30,30,0.9);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;min-width:130px;border:1px solid #444;",a.innerHTML='<div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #444;padding-bottom:4px;">Legend Status</div>'+l.map(s=>`
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:12px;height:12px;border-radius:50%;background:${I(s)};display:inline-block;flex-shrink:0;border:1px solid #fff;"></span>
                        <span>${s}</span>
                    </div>`).join(""),a},t.addTo(e)}function Y(e){const t=document.createElement("div");t.className="position-fixed bottom-0 end-0 m-3",t.style.zIndex=9999,t.innerHTML=`<div class="toast show align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex"><div class="toast-body">${e}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}if(!document.getElementById("psb-styles")){const e=document.createElement("style");e.id="psb-styles",e.innerHTML=`
            .bg-brown { background-color: #795548; color: #fff; }
            .wo-filter-badge.ring-active { outline: 2px solid #fff; outline-offset: 2px; }
            .wo-filter-badge:hover { opacity: 0.85; }
        `,document.head.appendChild(e)}q()}export{te as initWorkOrders};
