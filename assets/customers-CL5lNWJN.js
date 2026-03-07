import{s as i}from"./supabase-DlQAt1xf.js";async function h(){const o=document.getElementById("customers-list"),c=document.getElementById("add-customer-view-btn"),u=document.getElementById("view-all-customers-map-btn");let r=[];c&&(c.onclick=()=>{const e=document.getElementById("add-customer-view-tab");e&&new bootstrap.Tab(e).show()}),u&&(u.onclick=()=>v());async function p(){o.innerHTML="Memuat pelanggan...";const{data:e,error:t}=await i.from("customers").select("*, roles(name)").order("created_at",{ascending:!1});if(t){o.innerHTML=`<div class="text-danger">Kesalahan: ${t.message}</div>`;return}if(r=e,e.length===0){o.innerHTML='<div class="text-muted text-center py-4">Tidak ada pelanggan ditemukan.</div>';return}o.innerHTML=`
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
                        ${e.map(a=>`
                            <tr>
                                <td>
                                    <div class="fw-bold">${a.name}</div>
                                    <div class="small text-white-50">${a.customer_code||"-"}</div>
                                </td>
                                <td>${a.packet||"-"}</td>
                                <td>
                                    <div class="small">${a.address}</div>
                                    ${a.lat?`<button class="btn btn-link p-0 small text-accent view-map" data-lat="${a.lat}" data-lng="${a.lng}" data-name="${a.name}"><i class="bi bi-geo-alt"></i> Lihat Peta</button>`:""}
                                </td>
                                <td>
                                    <div class="small">${a.mac_address||"-"}</div>
                                    <div class="small ${a.damping<-28?"text-danger":"text-success"}">${a.damping||"-"} dBm</div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-cust" data-id="${a.id}">Edit</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".view-map").forEach(a=>{a.onclick=n=>{n.stopPropagation(),g(parseFloat(a.dataset.lat),parseFloat(a.dataset.lng),a.dataset.name)}}),document.querySelectorAll(".edit-cust").forEach(a=>{a.onclick=()=>f(e.find(n=>n.id===a.dataset.id))})}let l;function g(e,t,a){if(!e||!t)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{l&&l.remove(),l=L.map("admin-map").setView([e,t],15),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l),L.marker([e,t]).addTo(l).bindPopup(a).openPopup()},300)}function v(){if(r.length===0)return alert("Tidak ada data pelanggan untuk ditampilkan.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{l&&l.remove();const t=r.filter(d=>d.lat&&d.lng);if(t.length===0)return alert("Tidak ada pelanggan dengan koordinat yang valid.");const a=t[0];l=L.map("admin-map").setView([a.lat,a.lng],12),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l);const n=[];if(t.forEach(d=>{const s=L.marker([d.lat,d.lng]).addTo(l).bindPopup(`<b>${d.name}</b><br>${d.address}`);n.push(s)}),t.length>1){const d=new L.featureGroup(n);l.fitBounds(d.getBounds().pad(.1))}},300)}async function f(e=null){const t=new bootstrap.Modal(document.getElementById("crudModal")),a=document.getElementById("crudModalTitle"),n=document.getElementById("crudModalBody"),d=document.getElementById("save-crud-btn");a.innerText=e?"Edit Pelanggan":"Tambah Pelanggan",n.innerHTML=`
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
        `,d.onclick=async()=>{const s={name:document.getElementById("cust-name").value,customer_code:document.getElementById("cust-code").value,ktp:document.getElementById("cust-ktp").value,phone:document.getElementById("cust-phone").value,packet:document.getElementById("cust-packet").value,install_date:document.getElementById("cust-install-date").value,address:document.getElementById("cust-address").value,username:document.getElementById("cust-username").value,mac_address:document.getElementById("cust-mac").value,damping:document.getElementById("cust-damping").value,lat:parseFloat(document.getElementById("cust-lat").value)||null,lng:parseFloat(document.getElementById("cust-lng").value)||null};if(!s.name||!s.address)return alert("Nama dan Alamat wajib diisi.");let m;if(e)m=await i.from("customers").update(s).eq("id",e.id);else{const{data:b}=await i.from("roles").select("id").eq("name","Customer").single();b&&(s.role_id=b.id),m=await i.from("customers").insert([s])}m.error?alert("Gagal menyimpan: "+m.error.message):(t.hide(),p())},t.show()}p()}export{h as initCustomers};
