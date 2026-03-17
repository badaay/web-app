import{s as i}from"./config-CON8XM2G.js";import{g as f}from"./ui-common-hIOATXsD.js";import"./toast-D3E5iWRc.js";async function v(){const l=document.getElementById("roles-list"),s=document.getElementById("add-role-btn");s&&(s.onclick=()=>c());async function r(){l.innerHTML=f("Memuat data role...");const{data:e,error:a}=await i.from("roles").select("*").order("name");if(a){l.innerHTML=`<div class="card-body text-center py-5 text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){l.innerHTML=`
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-shield-lock fs-1 d-block mb-3"></i>
                    Tidak ada data role ditemukan.
                </div>`;return}l.innerHTML=`
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle mb-0">
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
                                <td class="fw-bold text-accent">${t.name}</td>
                                <td><span class="badge rounded-pill bg-info text-dark px-3">${t.code}</span></td>
                                <td class="small text-white-50 text-wrap" style="max-width: 250px;">${t.description||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-role" data-id="${t.id}">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-role").forEach(t=>{t.onclick=()=>c(e.find(o=>o.id===t.dataset.id))})}function c(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),o=document.getElementById("crudModalBody"),u=document.getElementById("save-crud-btn");t.innerText=e?"Edit Role":"Tambah Role",o.innerHTML=`
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
        `,u.onclick=async()=>{const n=document.getElementById("role-name").value,m=document.getElementById("role-code").value.toUpperCase(),b=document.getElementById("role-desc").value;if(!n||!m)return alert("Nama dan Kode wajib diisi.");const p={name:n,code:m,description:b};let d;e?d=await i.from("roles").update({name:n,description:b}).eq("id",e.id):d=await i.from("roles").insert([p]),d.error?alert("Gagal menyimpan: "+d.error.message):(a.hide(),r())},a.show()}r()}export{v as initRoles};
