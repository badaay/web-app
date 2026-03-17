import{s as r}from"./config-CON8XM2G.js";import{s as c}from"./toast-D3E5iWRc.js";import{g}from"./ui-common-hIOATXsD.js";async function B(){const n=document.getElementById("inventory-list"),m=document.getElementById("add-inventory-btn");m&&(m.onclick=()=>b());async function u(){n.innerHTML=g("Memuat inventaris...");const{data:t,error:a}=await r.from("inventory_items").select("*").order("name");if(a){n.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(t.length===0){n.innerHTML=`
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-box-seam fs-1 d-block mb-3"></i>
                    Tidak ada barang inventaris ditemukan.
                </div>`;return}n.innerHTML=`
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Nama Barang</th>
                            <th>Stok</th>
                            <th>Satuan</th>
                            <th>Kategori</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.map(e=>`
                            <tr>
                                <td class="fw-bold">${e.name}</td>
                                <td>
                                    <span class="badge bg-vscode-header border border-secondary text-white px-3 fs-6">${e.stock}</span>
                                </td>
                                <td>${e.unit}</td>
                                <td>
                                    <span class="badge bg-secondary opacity-75 fw-normal">${e.category||"-"}</span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-item" data-id="${e.id}">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-item").forEach(e=>{e.onclick=()=>b(t.find(i=>i.id===e.dataset.id))})}function b(t=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),e=document.getElementById("crudModalTitle"),i=document.getElementById("crudModalBody"),v=document.getElementById("save-crud-btn");e.innerText=t?"Edit Barang":"Tambah Barang",i.innerHTML=`
            <form id="inventory-form">
                <div class="mb-3">
                    <label class="form-label">Nama Barang</label>
                    <input type="text" class="form-control" id="item-name" value="${t?.name||""}" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Stok</label>
                        <input type="number" class="form-control" id="item-stock" value="${t?.stock||0}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Satuan</label>
                        <input type="text" class="form-control" id="item-unit" placeholder="pcs, kg, dll." value="${t?.unit||""}" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Kategori</label>
                    <input type="text" class="form-control" id="item-category" value="${t?.category||""}">
                </div>
            </form>
        `,v.onclick=async()=>{const s=document.getElementById("item-name").value,l=parseInt(document.getElementById("item-stock").value),d=document.getElementById("item-unit").value,y=document.getElementById("item-category").value;if(!s||isNaN(l)||!d)return c("warning","Nama, Stok, dan Satuan wajib diisi.");let o;t?o=await r.from("inventory_items").update({name:s,stock:l,unit:d,category:y}).eq("id",t.id):o=await r.from("inventory_items").insert([{name:s,stock:l,unit:d,category:y}]),o.error?c("error","Gagal menyimpan: "+o.error.message):(c("success","Barang berhasil disimpan!"),a.hide(),u())},a.show()}u()}export{B as initInventory};
