import{s as o}from"./config-YQH4oVGj.js";async function p(){const d=document.getElementById("employees-list"),n=document.getElementById("add-employee-btn");n&&(n.onclick=()=>m());async function c(){d.innerHTML="Memuat karyawan...";const{data:e,error:l}=await o.from("employees").select("*, roles(name)").order("name");if(l){d.innerHTML=`<div class="text-danger">Kesalahan: ${l.message}</div>`;return}if(e.length===0){d.innerHTML='<div class="text-muted text-center py-4">Tidak ada data karyawan ditemukan.</div>';return}d.innerHTML=`
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama / ID</th>
                            <th>Role / Jabatan</th>
                            <th>Status</th>
                            <th>Masuk</th>
                            <th>Pendidikan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.map(t=>`
                            <tr>
                                <td>
                                    <div class="fw-bold">${t.name}</div>
                                    <div class="small text-white-50">${t.employee_id}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${t.roles?.name||"-"}</div>
                                    <div class="small text-white-50">${t.position}</div>
                                </td>
                                <td>
                                    <span class="badge ${t.status==="Aktif"?"bg-success":"bg-danger"}">
                                        ${t.status}
                                    </span>
                                </td>
                                <td>${t.join_date||"-"}</td>
                                <td>${t.education||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-emp" data-id="${t.id}">Edit</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-emp").forEach(t=>{t.onclick=()=>m(e.find(s=>s.id===t.dataset.id))})}async function m(e=null){const l=new bootstrap.Modal(document.getElementById("crudModal")),t=document.getElementById("crudModalTitle"),s=document.getElementById("crudModalBody"),r=document.getElementById("save-crud-btn"),{data:u}=await o.from("roles").select("id, name").order("name");t.innerText=e?"Edit Karyawan":"Tambah Karyawan",s.innerHTML=`
            <form id="employee-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" id="emp-name" value="${e?.name||""}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">ID Karyawan</label>
                    <input type="text" class="form-control" id="emp-id" value="${e?.employee_id||""}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Role Aplikasi</label>
                    <select class="form-select" id="emp-role-id">
                        <option value="">Pilih Role...</option>
                        ${u?.map(a=>`<option value="${a.id}" ${e?.role_id===a.id?"selected":""}>${a.name}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Jabatan (Struktural)</label>
                    <input type="text" class="form-control" id="emp-position" value="${e?.position||""}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Status</label>
                    <select class="form-select" id="emp-status">
                        <option value="Aktif" ${e?.status==="Aktif"?"selected":""}>Aktif</option>
                        <option value="Non-Aktif" ${e?.status==="Non-Aktif"?"selected":""}>Non-Aktif</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tempat Lahir</label>
                    <input type="text" class="form-control" id="emp-birthplace" value="${e?.birth_place||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Lahir</label>
                    <input type="date" class="form-control" id="emp-birthdate" value="${e?.birth_date||""}">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label">Alamat</label>
                    <textarea class="form-control" id="emp-address" rows="2">${e?.address||""}</textarea>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tanggal Masuk</label>
                    <input type="date" class="form-control" id="emp-join-date" value="${e?.join_date||""}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Pendidikan Terakhir</label>
                    <input type="text" class="form-control" id="emp-education" value="${e?.education||""}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Training</label>
                    <select class="form-select" id="emp-training">
                        <option value="Ya" ${e?.training==="Ya"?"selected":""}>Ya</option>
                        <option value="Tidak" ${e?.training==="Tidak"?"selected":""}>Tidak</option>
                    </select>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">BPJS</label>
                    <select class="form-select" id="emp-bpjs">
                        <option value="Ya" ${e?.bpjs==="Ya"?"selected":""}>Ya</option>
                        <option value="Tidak" ${e?.bpjs==="Tidak"?"selected":""}>Tidak</option>
                    </select>
                </div>
            </form>
        `,r.onclick=async()=>{const a={name:document.getElementById("emp-name").value,employee_id:document.getElementById("emp-id").value,role_id:document.getElementById("emp-role-id").value||null,position:document.getElementById("emp-position").value,status:document.getElementById("emp-status").value,birth_place:document.getElementById("emp-birthplace").value,birth_date:document.getElementById("emp-birthdate").value,address:document.getElementById("emp-address").value,join_date:document.getElementById("emp-join-date").value,education:document.getElementById("emp-education").value,training:document.getElementById("emp-training").value,bpjs:document.getElementById("emp-bpjs").value};if(!a.name||!a.employee_id)return alert("Nama dan ID wajib diisi.");let i;e?i=await o.from("employees").update(a).eq("id",e.id):i=await o.from("employees").insert([a]),i.error?alert("Gagal menyimpan: "+i.error.message):(l.hide(),c())},l.show()}c()}export{p as initEmployees};
