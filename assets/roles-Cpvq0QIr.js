import{s}from"./supabase-BeOTOPRS.js";async function p(){const d=document.getElementById("roles-list"),r=document.getElementById("add-role-btn");r&&(r.onclick=()=>c());async function i(){d.innerHTML='<div class="card-body text-center py-5">Memuat data role...</div>';const{data:e,error:a}=await s.from("roles").select("*").order("name");if(a){d.innerHTML=`<div class="card-body text-center py-5 text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){d.innerHTML='<div class="card-body text-center py-5 text-muted">Tidak ada data role ditemukan.</div>';return}d.innerHTML=`
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama Role</th>
                            <th>Kode</th>
                            <th>Keterangan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.map(t=>`
                            <tr>
                                <td class="fw-bold">${t.name}</td>
                                <td><span class="badge bg-info text-dark">${t.code}</span></td>
                                <td class="small text-white-50">${t.description||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-role" data-id="${t.id}">Edit</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-role").forEach(t=>{t.onclick=()=>c(e.find(o=>o.id===t.dataset.id))})}function c(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),o=document.getElementById("crudModalBody"),b=document.getElementById("save-crud-btn");t.innerText=e?"Edit Role":"Tambah Role",o.innerHTML=`
            <form id="role-form">
                <div class="mb-3">
                    <label class="form-label">Nama Role</label>
                    <input type="text" class="form-control" id="role-name" value="${e?.name||""}" placeholder="Contoh: Administrator" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Kode Role</label>
                    <input type="text" class="form-control" id="role-code" value="${e?.code||""}" placeholder="Contoh: ADM" ${e?"disabled":""} required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" id="role-desc" rows="2">${e?.description||""}</textarea>
                </div>
            </form>
        `,b.onclick=async()=>{const n=document.getElementById("role-name").value,m=document.getElementById("role-code").value.toUpperCase(),u=document.getElementById("role-desc").value;if(!n||!m)return alert("Nama dan Kode wajib diisi.");const y={name:n,code:m,description:u};let l;e?l=await s.from("roles").update({name:n,description:u}).eq("id",e.id):l=await s.from("roles").insert([y]),l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),i())},a.show()}i()}export{p as initRoles};
