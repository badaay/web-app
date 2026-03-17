import{A as X,s as r}from"./config-CON8XM2G.js";/* empty css               */document.addEventListener("DOMContentLoaded",async()=>{const l=document.getElementById("activity-chat-container"),N=document.getElementById("error-alert"),G=document.getElementById("error-message"),z=document.getElementById("technician-info"),M=document.getElementById("tech-name"),W=document.getElementById("tech-id");let s;document.getElementById("executionModal")&&(s=new bootstrap.Modal(document.getElementById("executionModal")));const d=document.getElementById("btn-save-exec"),$=document.getElementById("exec-status"),D=document.getElementById("exec-notes"),E=document.getElementById("exec-photo"),y=document.getElementById("exec-photo-preview"),h=document.getElementById("photo-preview-container"),L=document.getElementById("exec-mac"),w=document.getElementById("exec-sn"),I=document.getElementById("exec-actual-date"),B=document.getElementById("exec-activation-date"),T=document.getElementById("exec-cable-label"),A=document.getElementById("claim-section"),P=document.getElementById("execution-details-section"),q=document.getElementById("team-selection-container"),u=document.getElementById("btn-confirm-claim");let i=null,o=null;const C=document.getElementById("btn-refresh"),g=document.getElementById("btn-install");let c,b;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),b=e,g&&g.classList.remove("d-none")}),C&&C.addEventListener("click",async()=>{c&&await k(c)}),g&&g.addEventListener("click",async()=>{if(b){b.prompt();const{outcome:e}=await b.userChoice;e==="accepted"&&g.classList.add("d-none"),b=null}}),E&&E.addEventListener("change",function(e){const t=e.target.files[0];if(t){const a=new FileReader;a.onload=function(n){o=n.target.result,y.src=o,h.classList.remove("d-none")},a.readAsDataURL(t)}else o=null,h.classList.add("d-none"),y.src=""});const S=new URLSearchParams(window.location.search).get("code");if(!S){x("Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login..."),setTimeout(()=>{window.location.href=X+"/admin/login"},3e3);return}try{const{data:e,error:t}=await r.from("employees").select("*").eq("employee_id",S).single();if(t||!e){x(`Data teknisi dengan ID ${S} tidak ditemukan.`);return}M.innerText=e.name,W.innerText=e.employee_id,c=e.id,z.classList.remove("d-none"),await k(e.id)}catch(e){console.error(e),x("Terjadi kesalahan saat memuat data dari server.")}async function k(e){l.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:t,error:a}=await r.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*)
            `).or(`status.eq.confirmed,employee_id.eq.${e},claimed_by.eq.${e}`).order("created_at",{ascending:!0});if(a){x("Gagal memuat daftar pekerjaan: "+a.message),l.innerHTML="";return}if(!t||t.length===0){l.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}l.innerHTML="",t.forEach(n=>{const m=n.customers?.name||"Pelanggan tidak diketahui",_=n.customers?.address||"-",p=n.customers?.lat,f=n.customers?.lng;let H="";p&&f&&(H=`<a href="https://www.google.com/maps/search/?api=1&query=${p},${f}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> Map</a>`);const O=new Date(n.created_at),Q=O.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),V=O.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),j=J(n.status),v=document.createElement("div");v.className="chat-bubble",v.innerHTML=`
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="fw-bold mb-0">${n.title}</div>
                        <div class="small text-muted"><i class="bi bi-clock me-1"></i> ${V} ${Q}</div>
                    </div>
                    <span class="badge rounded-pill bg-${j} bg-opacity-10 text-${j} px-3 py-2" style="font-size: 0.75rem">${n.status}</span>
                </div>

                <div class="p-3 bg-light rounded-4 mb-3 border border-light">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-person-circle fs-5 text-primary me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Nama Pelanggan</div>
                            <div class="fw-medium">${m}</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-start">
                        <i class="bi bi-geo-alt-fill fs-5 text-danger me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Alamat Pemasangan</div>
                            <div class="fw-medium small">${_} ${H}</div>
                        </div>
                    </div>
                </div>

                ${n.description?`<div class="p-2 border-start border-primary border-4 bg-primary bg-opacity-10 rounded-end small mb-3 text-muted">${n.description}</div>`:""}
                
                <div class="mt-3">
                    ${n.status==="confirmed"?`
                    <button class="btn btn-success btn-eksekusi fw-bold shadow-sm" data-action="claim" data-id="${n.id}">
                        <i class="bi bi-unlock-fill"></i> Ambil & Buka Tiket
                    </button>
                    `:n.status==="open"?`
                    <button class="btn btn-primary btn-eksekusi fw-bold shadow-sm" data-action="execute" data-id="${n.id}">
                        <i class="bi bi-lightning-fill"></i> Update / Selesaikan
                    </button>
                    `:`
                    <button class="btn btn-outline-secondary btn-eksekusi fw-bold" disabled>
                        <i class="bi bi-check2-all"></i> ${n.status==="closed"?"Tiket Ditutup":n.status}
                    </button>
                    `}
                </div>
            `;const R=v.querySelector('.btn-eksekusi[data-action="execute"]');R&&R.addEventListener("click",()=>K(n));const U=v.querySelector('.btn-eksekusi[data-action="claim"]');U&&U.addEventListener("click",()=>F(n)),l.appendChild(v)})}async function F(e){if(!s)return;i=e,A.classList.remove("d-none"),P.classList.add("d-none"),document.getElementById("btn-save-exec").classList.add("d-none"),q.innerHTML='<div class="spinner-border spinner-border-sm text-success"></div>';const{data:t}=await r.from("employees").select("id, name").neq("id",c);q.innerHTML=t.map(a=>`
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${a.id}" value="${a.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${a.id}">${a.name}</label>
            </div>
        `).join(""),u.onclick=async()=>{u.disabled=!0,u.innerHTML='<span class="spinner-border spinner-border-sm"></span> Memproses...';try{const a=Array.from(document.querySelectorAll(".team-member-check:checked")).map(m=>m.value),{error:n}=await r.from("work_orders").update({status:"open",claimed_by:c,claimed_at:new Date().toISOString(),ket:"Team Lead: "+M.innerText+(a.length>0?" | Anggota: "+a.length:"")}).eq("id",e.id);if(n)throw n;s.hide(),await k(c)}catch(a){alert("Gagal mengambil tiket: "+a.message)}finally{u.disabled=!1,u.innerText="Konfirmasi & Mulai Pengerjaan"}},s.show()}function K(e){if(!s)return;i=e,A.classList.add("d-none"),P.classList.remove("d-none"),document.getElementById("btn-save-exec").classList.remove("d-none"),D.value=e.ket||"",$.value=e.status==="closed"?"closed":"open",E.value="",o=null,h.classList.add("d-none"),y.src="";const t=e.installation_monitorings&&e.installation_monitorings.length>0?e.installation_monitorings[0]:null;t?(L.value=t.mac_address||"",w.value=t.sn_modem||"",T.value=t.cable_label||"",I.value=t.actual_date||"",B.value=t.activation_date||"",t.photo_proof&&(o=t.photo_proof,y.src=o,h.classList.remove("d-none"))):(L.value="",w.value="",T.value="",I.value=new Date().toISOString().split("T")[0],B.value=new Date().toISOString().split("T")[0]),s.show()}d&&d.addEventListener("click",async()=>{if(!i)return;const e=$.value,t=D.value;d.disabled=!0,d.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{let a=i.points||0;if(e==="closed"){const{data:f}=await r.from("master_queue_types").select("base_point").eq("id",i.type_id).maybeSingle();f?a=f.base_point:a=100}const{error:n}=await r.from("work_orders").update({status:e,points:a,ket:t||i.ket}).eq("id",i.id);if(n)throw n;const m={work_order_id:i.id,customer_id:i.customer_id,employee_id:i.employee_id,mac_address:L.value||null,sn_modem:w.value||null,cable_label:T.value||null,actual_date:I.value||null,activation_date:B.value||null,photo_proof:o,notes:t,is_confirmed:!1},_=i.installation_monitorings&&i.installation_monitorings.length>0?i.installation_monitorings[0]:null;_&&(m.id=_.id);const{error:p}=await r.from("installation_monitorings").upsert(m,{onConflict:"work_order_id"});if(p)throw p;s.hide(),await k(c)}catch(a){console.error("Update error:",a),alert("Gagal mengupdate status: "+a.message)}finally{d.disabled=!1,d.innerText="Simpan"}});function x(e){N.classList.remove("d-none"),G.innerText=e,l.innerHTML=""}function J(e){const t=e?e.toLowerCase():"";return t==="waiting"?"warning":t==="confirmed"?"success":t==="open"?"info":t==="closed"?"secondary":t.includes("pending")||t.includes("antrian")?"warning":t.includes("selesai")?"success":t.includes("proses")?"info":t.includes("cancel")?"danger":"secondary"}});
