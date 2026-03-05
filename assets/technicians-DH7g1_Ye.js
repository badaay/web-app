import{s}from"./supabase-C347XlkA.js";async function f(){const n=document.getElementById("technicians-list"),u=document.getElementById("add-tech-btn");u.onclick=()=>m();async function c(){n.innerHTML="Memuat teknisi...";const{data:e,error:a}=await s.from("technicians").select("*").order("name");if(a){n.innerHTML=`<div class="text-danger">Kesalahan: ${a.message}</div>`;return}if(e.length===0){n.innerHTML='<div class="text-muted">Tidak ada teknisi ditemukan.</div>';return}n.innerHTML=`
            <table class="table table-hover align-middle">
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
        `,document.querySelectorAll(".edit-tech").forEach(t=>{t.onclick=()=>m(e.find(l=>l.id===t.dataset.id))})}function m(e=null){const a=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),l=document.getElementById("crudModalBody"),h=document.getElementById("save-crud-btn");t.innerText=e?"Edit Teknisi":"Tambah Teknisi",l.innerHTML=`
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
        `,h.onclick=async()=>{const d=document.getElementById("tech-name").value,o=document.getElementById("tech-email").value,r=document.getElementById("tech-phone").value;if(!d||!o)return alert("Nama dan Email wajib diisi.");let i;e?i=await s.from("technicians").update({name:d,email:o,phone:r}).eq("id",e.id):i=await s.from("technicians").insert([{name:d,email:o,phone:r}]),i.error?alert("Gagal menyimpan: "+i.error.message):(a.hide(),c())},a.show()}c()}export{f as initTechnicians};
