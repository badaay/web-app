import{s as l}from"./config-CON8XM2G.js";import{s as i}from"./toast-D3E5iWRc.js";import{g as h}from"./ui-common-hIOATXsD.js";async function w(){const d=document.getElementById("packages-list"),o=document.getElementById("add-package-btn");o&&(o.onclick=()=>c());async function r(){d.innerHTML=h("Memuat paket...");const{data:e,error:a}=await l.from("internet_packages").select("*").order("price");if(a){d.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){d.innerHTML=`
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
        `,document.querySelectorAll(".edit-pkg").forEach(t=>{t.onclick=()=>c(e.find(s=>s.id===t.dataset.id))})}function c(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),s=document.getElementById("crudModalBody"),u=document.getElementById("save-crud-btn");t.innerText=e?"Edit Paket":"Tambah Paket",s.innerHTML=`
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
        `,u.onclick=async()=>{const m=document.getElementById("pkg-name").value,p=parseFloat(document.getElementById("pkg-price").value),g=document.getElementById("pkg-speed").value,f=document.getElementById("pkg-desc").value;if(!m||isNaN(p))return i("warning","Nama dan Harga wajib diisi.");const b={name:m,price:p,speed:g,description:f};let n;e?n=await l.from("internet_packages").update(b).eq("id",e.id):n=await l.from("internet_packages").insert([b]),n.error?i("error","Gagal menyimpan: "+n.error.message):(i("success","Paket berhasil disimpan!"),a.hide(),r())},a.show()}r()}export{w as initPackages};
