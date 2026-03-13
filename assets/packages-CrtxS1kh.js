import{s}from"./config-YQH4oVGj.js";async function v(){const d=document.getElementById("packages-list"),o=document.getElementById("add-package-btn");o&&(o.onclick=()=>r());async function i(){d.innerHTML="Memuat paket...";const{data:e,error:a}=await s.from("internet_packages").select("*").order("price");if(a){d.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){d.innerHTML='<div class="text-muted text-center py-4">Tidak ada data paket ditemukan.</div>';return}d.innerHTML=`
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama Paket</th>
                            <th>Kecepatan</th>
                            <th>Harga</th>
                            <th>Keterangan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.map(t=>`
                            <tr>
                                <td class="fw-bold">${t.name}</td>
                                <td>${t.speed||"-"}</td>
                                <td>Rp ${new Intl.NumberFormat("id-ID").format(t.price)}</td>
                                <td class="small text-white-50">${t.description||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-pkg" data-id="${t.id}">Edit</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-pkg").forEach(t=>{t.onclick=()=>r(e.find(n=>n.id===t.dataset.id))})}function r(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),n=document.getElementById("crudModalBody"),u=document.getElementById("save-crud-btn");t.innerText=e?"Edit Paket":"Tambah Paket",n.innerHTML=`
            <form id="package-form">
                <div class="mb-3">
                    <label class="form-label">Nama Paket</label>
                    <input type="text" class="form-control" id="pkg-name" value="${e?.name||""}" placeholder="Contoh: 175K 20Mbps" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Harga (Rp)</label>
                        <input type="number" class="form-control" id="pkg-price" value="${e?.price||""}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Kecepatan</label>
                        <input type="text" class="form-control" id="pkg-speed" value="${e?.speed||""}" placeholder="Contoh: 20Mbps">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" id="pkg-desc" rows="2">${e?.description||""}</textarea>
                </div>
            </form>
        `,u.onclick=async()=>{const c=document.getElementById("pkg-name").value,m=parseFloat(document.getElementById("pkg-price").value),b=document.getElementById("pkg-speed").value,g=document.getElementById("pkg-desc").value;if(!c||isNaN(m))return alert("Nama dan Harga wajib diisi.");const p={name:c,price:m,speed:b,description:g};let l;e?l=await s.from("internet_packages").update(p).eq("id",e.id):l=await s.from("internet_packages").insert([p]),l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),i())},a.show()}i()}export{v as initPackages};
