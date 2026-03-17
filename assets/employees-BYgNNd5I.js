import{s as d,A as y}from"./config-CON8XM2G.js";import{s as n}from"./toast-D3E5iWRc.js";import{g as f}from"./ui-common-hIOATXsD.js";async function $(){const i=document.getElementById("employees-list"),c=document.getElementById("add-employee-btn");c&&(c.onclick=()=>m());async function r(){i.innerHTML=f("Memuat karyawan...");const{data:e,error:l}=await d.from("employees").select("*, roles(name)").order("name");if(l){i.innerHTML=`<div class="text-danger">Kesalahan: ${l.message}</div>`;return}if(e.length===0){i.innerHTML=`
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-person-x fs-1 d-block mb-3"></i>
                    Tidak ada data karyawan ditemukan.
                </div>`;return}i.innerHTML=`
            <div class="table-container shadow-sm">
            <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nama / ID</th>
                            <th>Role / Jabatan</th>
                            <th>Status</th>
                            <th>Masuk</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.map(a=>`
                            <tr>
                                <td>
                                    <div class="fw-bold">
                                        <a href="${y}/activity.html?code=${a.employee_id}" class="text-info text-decoration-none" target="_blank">
                                            <i class="bi bi-person-badge me-1 small"></i>${a.name}
                                        </a>
                                    </div>
                                    <div class="small text-white-50">${a.employee_id}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${a.roles?.name||"-"}</div>
                                    <div class="small text-white-50">${a.position}</div>
                                </td>
                                <td>
                                    <span class="badge rounded-pill px-3 ${a.status==="Aktif"?"bg-success":"bg-danger"}">
                                        ${a.status}
                                    </span>
                                </td>
                                <td>${a.join_date||"-"}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-emp" data-id="${a.id}">
                                        <i class="bi bi-pencil me-1"></i> Edit
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,document.querySelectorAll(".edit-emp").forEach(a=>{a.onclick=()=>m(e.find(o=>o.id===a.dataset.id))})}async function m(e=null){const l=new bootstrap.Modal(document.getElementById("crudModal")),a=document.getElementById("crudModalTitle"),o=document.getElementById("crudModalBody"),b=document.getElementById("save-crud-btn"),{data:u}=await d.from("roles").select("id, name").order("name");a.innerText=e?"Edit Karyawan":"Tambah Karyawan",o.innerHTML=`
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
                        ${u?.map(t=>`<option value="${t.id}" ${e?.role_id===t.id?"selected":""}>${t.name}</option>`).join("")}
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
        `,b.onclick=async()=>{const t={name:document.getElementById("emp-name").value,employee_id:document.getElementById("emp-id").value,role_id:document.getElementById("emp-role-id").value||null,position:document.getElementById("emp-position").value,status:document.getElementById("emp-status").value,birth_place:document.getElementById("emp-birthplace").value,birth_date:document.getElementById("emp-birthdate").value,address:document.getElementById("emp-address").value,join_date:document.getElementById("emp-join-date").value,education:document.getElementById("emp-education").value,training:document.getElementById("emp-training").value,bpjs:document.getElementById("emp-bpjs").value};if(!t.name||!t.employee_id)return n("warning","Nama dan ID wajib diisi.");let s;if(e)s=await d.from("employees").update(t).eq("id",e.id);else{const p=`${t.employee_id.toLowerCase()}@fatih.com`,v=Math.random().toString(36).slice(-12)+"Aa1!";s=await AuthService.registerEmployee(p,v,t)}s.error?n("error","Gagal menyimpan: "+s.error.message):(n("success",e?"Data karyawan diperbarui.":"Karyawan baru berhasil didaftarkan."),l.hide(),r())},l.show()}r()}export{$ as initEmployees};
