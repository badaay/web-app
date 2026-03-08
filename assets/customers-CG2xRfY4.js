import{s as i}from"./supabase-DlQAt1xf.js";async function h(){const o=document.getElementById("customers-list"),c=document.getElementById("add-customer-view-btn"),u=document.getElementById("view-all-customers-map-btn");let r=[];c&&(c.onclick=()=>{window.switchAdminModule&&window.switchAdminModule("add-customer-view-content")}),u&&(u.onclick=()=>v());async function p(){o.innerHTML="Memuat pelanggan...";const{data:a,error:t}=await i.from("customers").select("*, roles(name)").order("created_at",{ascending:!1});if(t){o.innerHTML=`<div class="text-danger">Kesalahan: ${t.message}</div>`;return}if(r=a,a.length===0){o.innerHTML='<div class="text-muted text-center py-4">Tidak ada pelanggan ditemukan.</div>';return}o.innerHTML=`
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
                        ${a.map(e=>`
                            <tr>
                                <td>
                                    <div class="fw-bold">${e.name}</div>
                                    <div class="small text-white-50">${e.customer_code||"-"}</div>
                                </td>
                                <td>${e.packet||"-"}</td>
                                <td>
                                    <div class="small">${e.address}</div>
                                    ${e.lat?`<button class="btn btn-link p-0 small text-accent view-map" data-lat="${e.lat}" data-lng="${e.lng}" data-name="${e.name}"><i class="bi bi-geo-alt"></i> Lihat Peta</button>`:""}
                                </td>
                                <td>
                                    <div class="small">${e.mac_address||"-"}</div>
                                    <div class="small ${e.damping<-28?"text-danger":"text-success"}">${e.damping||"-"} dBm</div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-cust" data-id="${e.id}">Edit</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".view-map").forEach(e=>{e.onclick=n=>{n.stopPropagation(),g(parseFloat(e.dataset.lat),parseFloat(e.dataset.lng),e.dataset.name)}}),document.querySelectorAll(".edit-cust").forEach(e=>{e.onclick=()=>f(a.find(n=>n.id===e.dataset.id))})}let l;function g(a,t,e){if(!a||!t)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{l&&l.remove(),l=L.map("admin-map").setView([a,t],15),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l),L.marker([a,t]).addTo(l).bindPopup(e).openPopup()},300)}function v(){if(r.length===0)return alert("Tidak ada data pelanggan untuk ditampilkan.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{l&&l.remove();const t=r.filter(d=>d.lat&&d.lng);if(t.length===0)return alert("Tidak ada pelanggan dengan koordinat yang valid.");const e=t[0];l=L.map("admin-map").setView([e.lat,e.lng],12),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l);const n=[];if(t.forEach(d=>{const s=L.marker([d.lat,d.lng]).addTo(l).bindPopup(`<b>${d.name}</b><br>${d.address}`);n.push(s)}),t.length>1){const d=new L.featureGroup(n);l.fitBounds(d.getBounds().pad(.1))}},300)}async function f(a=null){const t=new bootstrap.Modal(document.getElementById("crudModal")),e=document.getElementById("crudModalTitle"),n=document.getElementById("crudModalBody"),d=document.getElementById("save-crud-btn");e.innerText=a?"Edit Pelanggan":"Tambah Pelanggan",n.innerHTML=`
            <form id="customer-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nama Pelanggan</label>
                    <input type="text" class="form-control" id="cust-name" value="${a?.name||""}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Kode Pelanggan</label>
                    <input type="text" class="form-control" id="cust-code" value="${a?.customer_code||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">NIK / KTP</label>
                    <input type="text" class="form-control" id="cust-ktp" value="${a?.ktp||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">No. HP</label>
                    <input type="text" class="form-control" id="cust-phone" value="${a?.phone||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Paket Internet</label>
                    <input type="text" class="form-control" id="cust-packet" value="${a?.packet||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Pasang</label>
                    <input type="date" class="form-control" id="cust-install-date" value="${a?.install_date||""}">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label">Alamat Pemasangan</label>
                    <textarea class="form-control" id="cust-address" rows="2" required>${a?.address||""}</textarea>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Username PPPoE</label>
                    <input type="text" class="form-control" id="cust-username" value="${a?.username||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">MAC Address</label>
                    <input type="text" class="form-control" id="cust-mac" value="${a?.mac_address||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Redaman (dBm)</label>
                    <input type="text" class="form-control" id="cust-damping" value="${a?.damping||""}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Lat</label>
                    <input type="number" step="any" class="form-control" id="cust-lat" value="${a?.lat||""}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Lng</label>
                    <input type="number" step="any" class="form-control" id="cust-lng" value="${a?.lng||""}">
                </div>
            </form>
        `,d.onclick=async()=>{const s={name:document.getElementById("cust-name").value,customer_code:document.getElementById("cust-code").value,ktp:document.getElementById("cust-ktp").value,phone:document.getElementById("cust-phone").value,packet:document.getElementById("cust-packet").value,install_date:document.getElementById("cust-install-date").value,address:document.getElementById("cust-address").value,username:document.getElementById("cust-username").value,mac_address:document.getElementById("cust-mac").value,damping:document.getElementById("cust-damping").value,lat:parseFloat(document.getElementById("cust-lat").value)||null,lng:parseFloat(document.getElementById("cust-lng").value)||null};if(!s.name||!s.address)return alert("Nama dan Alamat wajib diisi.");let m;if(a)m=await i.from("customers").update(s).eq("id",a.id);else{const{data:b}=await i.from("roles").select("id").eq("name","Customer").single();b&&(s.role_id=b.id),m=await i.from("customers").insert([s])}m.error?alert("Gagal menyimpan: "+m.error.message):(t.hide(),p())},t.show()}p()}export{h as initCustomers};
