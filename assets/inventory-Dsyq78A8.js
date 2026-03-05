import{s}from"./supabase-C347XlkA.js";async function g(){const n=document.getElementById("inventory-list"),y=document.getElementById("add-inventory-btn");y.onclick=()=>m();async function c(){n.innerHTML="Memuat inventaris...";const{data:t,error:a}=await s.from("inventory_items").select("*").order("name");if(a){n.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(t.length===0){n.innerHTML='<div class="text-muted">Tidak ada barang inventaris ditemukan.</div>';return}n.innerHTML=`
            <table class="table table-hover align-middle">
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
                            <td>${e.name}</td>
                            <td>${e.stock}</td>
                            <td>${e.unit}</td>
                            <td>${e.category||"-"}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary edit-item" data-id="${e.id}">Edit</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `,document.querySelectorAll(".edit-item").forEach(e=>{e.onclick=()=>m(t.find(o=>o.id===e.dataset.id))})}function m(t=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),e=document.getElementById("crudModalTitle"),o=document.getElementById("crudModalBody"),v=document.getElementById("save-crud-btn");e.innerText=t?"Edit Barang":"Tambah Barang",o.innerHTML=`
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
        `,v.onclick=async()=>{const d=document.getElementById("item-name").value,i=parseInt(document.getElementById("item-stock").value),r=document.getElementById("item-unit").value,u=document.getElementById("item-category").value;if(!d||isNaN(i)||!r)return alert("Nama, Stok, dan Satuan wajib diisi.");let l;t?l=await s.from("inventory_items").update({name:d,stock:i,unit:r,category:u}).eq("id",t.id):l=await s.from("inventory_items").insert([{name:d,stock:i,unit:r,category:u}]),l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),c())},a.show()}c()}export{g as initInventory};
