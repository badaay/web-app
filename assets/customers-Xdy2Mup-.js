import{s as i}from"./supabase-C347XlkA.js";async function v(){const n=document.getElementById("customers-list"),p=document.getElementById("add-customer-btn");p.onclick=()=>c();async function m(){n.innerHTML="Memuat pelanggan...";const{data:t,error:a}=await i.from("customers").select("*").order("name");if(a){n.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(t.length===0){n.innerHTML='<div class="text-muted">Tidak ada pelanggan ditemukan.</div>';return}n.innerHTML=`
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Nama</th>
                        <th>Alamat</th>
                        <th>Lokasi</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${t.map(e=>`
                        <tr>
                            <td>${e.name}</td>
                            <td>${e.address}</td>
                            <td><small>${e.lat?.toFixed(4)}, ${e.lng?.toFixed(4)}</small></td>
                            <td>
                                <button class="btn btn-sm btn-outline-info view-map" data-lat="${e.lat}" data-lng="${e.lng}" data-name="${e.name}">Peta</button>
                                <button class="btn btn-sm btn-outline-primary edit-cust" data-id="${e.id}">Edit</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `,document.querySelectorAll(".view-map").forEach(e=>{e.onclick=()=>b(parseFloat(e.dataset.lat),parseFloat(e.dataset.lng),e.dataset.name)}),document.querySelectorAll(".edit-cust").forEach(e=>{e.onclick=()=>c(t.find(d=>d.id===e.dataset.id))})}let l;function b(t,a,e){if(!t||!a)return alert("Koordinat tidak disetel untuk pelanggan ini.");new bootstrap.Modal(document.getElementById("mapModal")).show(),setTimeout(()=>{l&&l.remove(),l=L.map("admin-map").setView([t,a],15),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(l),L.marker([t,a]).addTo(l).bindPopup(e).openPopup()},300)}function c(t=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),e=document.getElementById("crudModalTitle"),d=document.getElementById("crudModalBody"),f=document.getElementById("save-crud-btn");e.innerText=t?"Edit Pelanggan":"Tambah Pelanggan",d.innerHTML=`
            <form id="customer-form">
                <div class="mb-3">
                    <label class="form-label">Nama Pelanggan</label>
                    <input type="text" class="form-control" id="cust-name" value="${t?.name||""}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Alamat</label>
                    <textarea class="form-control" id="cust-address" rows="2" required>${t?.address||""}</textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Lintang (Latitude)</label>
                        <input type="number" step="any" class="form-control" id="cust-lat" value="${t?.lat||""}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Bujur (Longitude)</label>
                        <input type="number" step="any" class="form-control" id="cust-lng" value="${t?.lng||""}">
                    </div>
                </div>
            </form>
        `,f.onclick=async()=>{const s=document.getElementById("cust-name").value,r=document.getElementById("cust-address").value,u=parseFloat(document.getElementById("cust-lat").value),g=parseFloat(document.getElementById("cust-lng").value);if(!s||!r)return alert("Nama dan Alamat wajib diisi.");let o;t?o=await i.from("customers").update({name:s,address:r,lat:u,lng:g}).eq("id",t.id):o=await i.from("customers").insert([{name:s,address:r,lat:u,lng:g}]),o.error?alert("Gagal menyimpan: "+o.error.message):(a.hide(),m())},a.show()}m()}export{v as initCustomers};
