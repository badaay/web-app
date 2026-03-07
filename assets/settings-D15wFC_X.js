import{s as o}from"./supabase-DlQAt1xf.js";async function y(){const s=document.getElementById("settings-content");async function r(){s.innerHTML='<div class="card-body text-center py-5">Memuat pengaturan...</div>';const{data:t,error:a}=await o.from("app_settings").select("*").order("setting_key");if(a){s.innerHTML=`<div class="card-body text-center py-5 text-danger">Kesalahan: ${a.message}</div>`;return}s.innerHTML=`
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                            <th>Deskripsi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.length===0?'<tr><td colspan="4" class="text-center">Belum ada pengaturan.</td></tr>':""}
                        ${t.map(e=>`
                            <tr>
                                <td class="fw-bold">${e.setting_key}</td>
                                <td><code>${e.setting_value||"-"}</code></td>
                                <td class="small text-white-50">${e.description||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-setting" data-id="${e.id}">Edit</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
            <div class="mt-4">
                <button class="btn btn-primary" id="add-setting-btn">
                    <i class="bi bi-plus-lg me-1"></i> Tambah Pengaturan Baru
                </button>
            </div>
        `,document.querySelectorAll(".edit-setting").forEach(e=>{e.onclick=()=>c(t.find(d=>d.id===e.dataset.id))});const n=document.getElementById("add-setting-btn");n&&(n.onclick=()=>c())}function c(t=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),n=document.getElementById("crudModalTitle"),e=document.getElementById("crudModalBody"),d=document.getElementById("save-crud-btn");n.innerText=t?"Edit Pengaturan":"Tambah Pengaturan",e.innerHTML=`
            <form id="setting-form">
                <div class="mb-3">
                    <label class="form-label">Setting Key</label>
                    <input type="text" class="form-control" id="set-key" value="${t?.setting_key||""}" placeholder="Contoh: COMPANY_NAME" ${t?"disabled":""} required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Value</label>
                    <input type="text" class="form-control" id="set-value" value="${t?.setting_value||""}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Deskripsi</label>
                    <textarea class="form-control" id="set-desc" rows="2">${t?.description||""}</textarea>
                </div>
            </form>
        `,d.onclick=async()=>{const u=document.getElementById("set-key").value,i=document.getElementById("set-value").value,m=document.getElementById("set-desc").value;if(!u||!i)return alert("Key dan Value wajib diisi.");const b={setting_key:u,setting_value:i,description:m};let l;t?l=await o.from("app_settings").update({setting_value:i,description:m}).eq("id",t.id):l=await o.from("app_settings").insert([b]),l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),r())},a.show()}r()}export{y as initSettings};
