import{s as d}from"./supabase-DlQAt1xf.js";async function P(){const c=document.getElementById("work-orders-list"),b=document.getElementById("add-work-order-btn");let r=[],m="All";b&&(b.onclick=()=>h());async function g(){if(!c)return;c.innerHTML='<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat Antrian...</div></div>';const{data:e,error:t}=await d.from("work_orders").select("*, customers(*), employees(name)").order("created_at",{ascending:!1});if(t){c.innerHTML=`<div class="alert alert-danger">Error: ${t.message}</div>`;return}r=e,f(),y()}function y(){const e=document.getElementById("wo-status-summary");if(!e)return;const t=r.reduce((a,n)=>(a[n.status]=(a[n.status]||0)+1,a),{}),s=["Antrian","Pending","Konfirmasi","ODP Penuh","Cancel","Completed"];e.innerHTML=s.map(a=>`
            <div class="badge ${v(a)} me-2 p-2" style="cursor: pointer;" onclick="window.filterWorkOrders('${a}')">
                ${a}: ${t[a]||0}
            </div>
        `).join(""),window.filterWorkOrders=a=>{m=a===m?"All":a,f()}}function f(){const e=m==="All"?r:r.filter(t=>t.status===m);c.innerHTML=`
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
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
                        ${e.map(t=>`
                            <tr>
                                <td>
                                    <div class="fw-bold text-accent">${t.registration_date||"-"}</div>
                                    <div class="small text-white-50">Daftar: ${new Date(t.created_at).toLocaleDateString()}</div>
                                </td>
                                <td>
                                    <div class="mb-1"><span class="badge ${v(t.status)}">${t.status}</span></div>
                                    <div class="small text-white-50">${t.ket||t.title}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.customers?.name||"-"}</div>
                                    <div class="small text-white-50">${t.customers?.phone||"-"}</div>
                                    <div class="small fst-italic text-white-50">${t.customers?.address||"-"}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.employees?.name||"-"}</div>
                                    <div class="small"><i class="bi bi-star-fill text-warning me-1"></i>${t.points||0} Poin</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${t.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${t.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-wo").forEach(t=>{t.onclick=()=>h(r.find(s=>s.id===t.dataset.id))}),document.querySelectorAll(".view-wo-map").forEach(t=>{t.onclick=()=>$(r.find(s=>s.id===t.dataset.id))}),document.querySelectorAll(".copy-wo-format").forEach(t=>{t.onclick=()=>{const s=r.find(i=>i.id===t.dataset.id),a=s.customers?.lat?`https://www.google.com/maps?q=${s.customers.lat},${s.customers.lng}`:"(Peta belum set)",n=`${s.customers?.name||"-"}, ${s.customers?.address||"-"}, ${s.customers?.phone||"-"}, ${a}, (${s.points||0} poin)`;navigator.clipboard.writeText(n),alert("Format PSB berhasil disalin!")}})}function v(e){switch(e){case"Antrian":return"bg-success";case"Pending":return"bg-warning text-dark";case"Completed":case"Selesai":return"bg-secondary";case"Konfirmasi":return"bg-primary";case"ODP Penuh":return"bg-brown";case"Cancel":return"bg-dark border border-secondary";default:return"bg-info text-dark"}}function p(e){switch(e){case"Antrian":return"#28a745";case"Pending":return"#fd7e14";case"Konfirmasi":return"#007bff";case"ODP Penuh":return"#795548";case"Cancel":return"#000000";case"Selesai":case"Completed":return null;default:return"#6c757d"}}async function h(e=null){const t=new bootstrap.Modal(document.getElementById("crudModal")),s=document.getElementById("crudModalTitle"),a=document.getElementById("crudModalBody"),n=document.getElementById("save-crud-btn"),{data:i}=await d.from("customers").select("*").order("name"),{data:k}=await d.from("employees").select("id, name").order("name");s.innerText=e?"Edit Antrian PSB":"Tambah Antrian PSB Baru",a.innerHTML=`
            <form id="work-order-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Tanggal Daftar (Wajib)</label>
                    <input type="date" class="form-control" id="wo-reg-date" value="${e?.registration_date||new Date().toISOString().split("T")[0]}" required>
                </div>
                <div class="col-md-6 mb-3">
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
                <div class="col-md-12 mb-3">
                    <label class="form-label small text-white-50">Pelanggan (Wajib)</label>
                    <select class="form-select" id="wo-customer-id" required>
                        <option value="">Pilih Pelanggan...</option>
                        ${i?.map(l=>`<option value="${l.id}" ${e?.customer_id===l.id?"selected":""}>${l.name} - ${l.phone||""}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Teknisi / Petugas</label>
                    <select class="form-select" id="wo-employee-id">
                        <option value="">Pilih Petugas...</option>
                        ${k?.map(l=>`<option value="${l.id}" ${e?.employee_id===l.id?"selected":""}>${l.name}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Pembayaran</label>
                    <input type="text" class="form-control" id="wo-payment" value="${e?.payment_status||""}" placeholder="Contoh: Tunai, Transfer">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Nama Referal</label>
                    <input type="text" class="form-control" id="wo-referral" value="${e?.referral_name||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Ket Singkat</label>
                    <input type="text" class="form-control" id="wo-ket" value="${e?.ket||""}" placeholder="Data OK, Data Tidak Lengkap">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">Keterangan / Detail (Notes)</label>
                    <textarea class="form-control" id="wo-description" rows="2">${e?.description||""}</textarea>
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">URL Foto Rumah</label>
                    <input type="text" class="form-control" id="wo-photo" value="${e?.photo_url||""}" placeholder="https://...">
                </div>
            </form>
        `,n.onclick=async()=>{const l={registration_date:document.getElementById("wo-reg-date").value,customer_id:document.getElementById("wo-customer-id").value,employee_id:document.getElementById("wo-employee-id").value||null,status:document.getElementById("wo-status").value,title:"Pemasangan Baru (PSB)",payment_status:document.getElementById("wo-payment").value,referral_name:document.getElementById("wo-referral").value,ket:document.getElementById("wo-ket").value,description:document.getElementById("wo-description").value,photo_url:document.getElementById("wo-photo").value,updated_at:new Date().toISOString()};if(!l.registration_date||!l.customer_id)return alert("Tanggal Daftar dan Pelanggan wajib diisi.");let u;e?u=await d.from("work_orders").update(l).eq("id",e.id):u=await d.from("work_orders").insert([l]),u.error?alert("Gagal menyimpan: "+u.error.message):(t.hide(),g())},t.show()}let o;function $(e){if(!e.customers?.lat||!e.customers?.lng)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{o&&o.remove(),o=L.map("admin-map").setView([e.customers.lat,e.customers.lng],15),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o);const s=p(e.status);s&&L.circleMarker([e.customers.lat,e.customers.lng],{radius:8,fillColor:s,color:"#fff",weight:2,opacity:1,fillOpacity:.8}).addTo(o).bindPopup(`<b>${e.customers.name}</b><br>${e.status}<br>${e.customers.address}`).openPopup()},300)}if(!document.getElementById("psb-styles")){const e=document.createElement("style");e.id="psb-styles",e.innerHTML=".bg-brown { background-color: #795548; color: #fff; }",document.head.appendChild(e)}g(),window.showAllPSBMap=()=>{new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{o&&o.remove();const t=r.filter(a=>a.customers?.lat&&a.customers?.lng&&p(a.status));if(t.length===0)return alert("Tidak ada data PSB dengan koordinat yang valid untuk ditampilkan di peta.");o=L.map("admin-map").setView([t[0].customers.lat,t[0].customers.lng],12),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(o);const s=[];if(t.forEach(a=>{const n=p(a.status),i=L.circleMarker([a.customers.lat,a.customers.lng],{radius:7,fillColor:n,color:"#000",weight:1,opacity:1,fillOpacity:1}).addTo(o).bindPopup(`<b>${a.customers.name}</b><br>Status: ${a.status}<br>Addr: ${a.customers.address}`);s.push(i)}),s.length>1){const a=new L.featureGroup(s);o.fitBounds(a.getBounds().pad(.1))}},300)}}export{P as initWorkOrders};
