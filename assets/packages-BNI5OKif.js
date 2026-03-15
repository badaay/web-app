import{s}from"./config-CON8XM2G.js";async function h(){const d=document.getElementById("packages-list"),i=document.getElementById("add-package-btn");i&&(i.onclick=()=>r());async function o(){d.innerHTML="Memuat paket...";const{data:e,error:a}=await s.from("internet_packages").select("*").order("price");if(a){d.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){d.innerHTML=`
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-tags fs-1 d-block mb-3"></i>
                    Tidak ada data paket ditemukan.
                </div>`;return}d.innerHTML=`
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle mb-0">
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
                                <td class="fw-bold text-accent">${t.name}</td>
                                <td>
                                    <span class="badge bg-vscode-header border border-secondary text-white fw-normal">${t.speed||"-"}</span>
                                </td>
                                <td class="fw-bold">Rp ${new Intl.NumberFormat("id-ID").format(t.price)}</td>
                                <td class="small text-white-50 text-wrap" style="max-width: 200px;">${t.description||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-pkg" data-id="${t.id}">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-pkg").forEach(t=>{t.onclick=()=>r(e.find(n=>n.id===t.dataset.id))})}function r(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),n=document.getElementById("crudModalBody"),p=document.getElementById("save-crud-btn");t.innerText=e?"Edit Paket":"Tambah Paket",n.innerHTML=`
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
        `,p.onclick=async()=>{const c=document.getElementById("pkg-name").value,m=parseFloat(document.getElementById("pkg-price").value),u=document.getElementById("pkg-speed").value,g=document.getElementById("pkg-desc").value;if(!c||isNaN(m))return alert("Nama dan Harga wajib diisi.");const b={name:c,price:m,speed:u,description:g};let l;e?l=await s.from("internet_packages").update(b).eq("id",e.id):l=await s.from("internet_packages").insert([b]),l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),o())},a.show()}o()}export{h as initPackages};
