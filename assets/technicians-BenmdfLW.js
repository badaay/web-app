import{s as d}from"./supabase-DlQAt1xf.js";async function b(){const i=document.getElementById("technicians-list"),s=document.getElementById("add-tech-btn");s&&(s.onclick=()=>c());async function m(){i.innerHTML="Memuat teknisi...";const{data:e,error:a}=await d.from("technicians").select("*").order("name");if(a){i.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){i.innerHTML='<div class="text-muted">Tidak ada teknisi ditemukan.</div>';return}i.innerHTML=`
            <table class="table table-dark table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Telepon</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${e.map(t=>`
                        <tr>
                            <td>${t.name}</td>
                            <td>${t.email}</td>
                            <td>${t.phone||"-"}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary edit-tech" data-id="${t.id}">Edit</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `,document.querySelectorAll(".edit-tech").forEach(t=>{t.onclick=()=>c(e.find(o=>o.id===t.dataset.id))})}async function c(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),o=document.getElementById("crudModalBody"),u=document.getElementById("save-crud-btn");t.innerText=e?"Edit Teknisi":"Tambah Teknisi",o.innerHTML=`
            <form id="tech-form">
                <div class="mb-3">
                    <label class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" id="tech-name" value="${e?.name||""}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="tech-email" value="${e?.email||""}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Telepon</label>
                    <input type="text" class="form-control" id="tech-phone" value="${e?.phone||""}">
                </div>
            </form>
        `,u.onclick=async()=>{const n={name:document.getElementById("tech-name").value,email:document.getElementById("tech-email").value,phone:document.getElementById("tech-phone").value};if(!n.name||!n.email)return alert("Nama dan Email wajib diisi.");let l;if(e)l=await d.from("technicians").update(n).eq("id",e.id);else{const{data:r}=await d.from("roles").select("id").eq("name","Teknisi").single();r&&(n.role_id=r.id),l=await d.from("technicians").insert([n])}l.error?alert("Gagal menyimpan: "+l.error.message):(a.hide(),m())},a.show()}m()}export{b as initTechnicians};
