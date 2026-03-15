import{s,A as X}from"./config-CON8XM2G.js";/* empty css               */document.addEventListener("DOMContentLoaded",async()=>{const r=document.getElementById("activity-chat-container"),G=document.getElementById("error-alert"),z=document.getElementById("error-message"),W=document.getElementById("technician-info"),D=document.getElementById("tech-name"),v=document.getElementById("tech-id");let o;document.getElementById("executionModal")&&(o=new bootstrap.Modal(document.getElementById("executionModal")));const l=document.getElementById("btn-save-exec"),q=document.getElementById("exec-status"),A=document.getElementById("exec-notes"),I=document.getElementById("exec-photo"),y=document.getElementById("exec-photo-preview"),h=document.getElementById("photo-preview-container"),w=document.getElementById("exec-mac"),B=document.getElementById("exec-sn"),T=document.getElementById("exec-actual-date"),S=document.getElementById("exec-activation-date"),M=document.getElementById("exec-cable-label"),P=document.getElementById("claim-section"),C=document.getElementById("execution-details-section"),H=document.getElementById("team-selection-container"),m=document.getElementById("btn-confirm-claim");let i=null,c=null;const O=document.getElementById("btn-refresh"),u=document.getElementById("btn-install");O&&O.addEventListener("click",async()=>{if(v.innerText&&v.innerText!=="ID TKN"){const e=await s.from("employees").select("id").eq("employee_id",v.innerText).single();e.data&&await k(e.data.id)}});let b;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),b=e,u&&u.classList.remove("d-none")}),u&&u.addEventListener("click",async()=>{if(b){b.prompt();const{outcome:e}=await b.userChoice;e==="accepted"&&u.classList.add("d-none"),b=null}}),I&&I.addEventListener("change",function(e){const t=e.target.files[0];if(t){const a=new FileReader;a.onload=function(n){c=n.target.result,y.src=c,h.classList.remove("d-none")},a.readAsDataURL(t)}else c=null,h.classList.add("d-none"),y.src=""});const $=new URLSearchParams(window.location.search).get("code");if(!$){_("Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login..."),setTimeout(()=>{window.location.href=X+"/admin/login"},3e3);return}try{const{data:e,error:t}=await s.from("employees").select("*").eq("employee_id",$).single();if(t||!e){_(`Data teknisi dengan ID ${$} tidak ditemukan.`);return}D.innerText=e.name,v.innerText=e.employee_id,x=e.id,W.classList.remove("d-none"),await k(e.id)}catch(e){console.error(e),_("Terjadi kesalahan saat memuat data dari server.")}async function k(e){r.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:t,error:a}=await s.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*)
            `).or(`employee_id.eq.${e},claimed_by.eq.${e},status.eq.confirmed`).order("created_at",{ascending:!0});if(a){_("Gagal memuat daftar pekerjaan: "+a.message),r.innerHTML="";return}if(!t||t.length===0){r.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}r.innerHTML="",t.forEach(n=>{const d=n.customers?.name||"Pelanggan tidak diketahui",E=n.customers?.address||"-",g=n.customers?.lat,L=n.customers?.lng;let p="";g&&L&&(p=`<a href="https://www.google.com/maps/search/?api=1&query=${g},${L}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> Map</a>`);const R=new Date(n.created_at),Q=R.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),V=R.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),j=J(n.status),f=document.createElement("div");f.className="chat-bubble",f.innerHTML=`
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
                            <div class="fw-medium">${d}</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-start">
                        <i class="bi bi-geo-alt-fill fs-5 text-danger me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Alamat Pemasangan</div>
                            <div class="fw-medium small">${E} ${p}</div>
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
            `;const N=f.querySelector('.btn-eksekusi[data-action="execute"]');N&&N.addEventListener("click",()=>K(n));const U=f.querySelector('.btn-eksekusi[data-action="claim"]');U&&U.addEventListener("click",()=>F(n)),r.appendChild(f)})}async function F(e){if(!o)return;i=e,P.classList.remove("d-none"),C.classList.add("d-none"),document.getElementById("btn-save-exec").classList.add("d-none"),H.innerHTML='<div class="spinner-border spinner-border-sm text-success"></div>';const{data:t}=await s.from("employees").select("id, name").neq("id",x);H.innerHTML=t.map(a=>`
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${a.id}" value="${a.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${a.id}">${a.name}</label>
            </div>
        `).join(""),m.onclick=async()=>{m.disabled=!0,m.innerHTML='<span class="spinner-border spinner-border-sm"></span> Memproses...';try{const a=Array.from(document.querySelectorAll(".team-member-check:checked")).map(d=>d.value),{error:n}=await s.from("work_orders").update({status:"open",claimed_by:x,claimed_at:new Date().toISOString(),ket:"Team Lead: "+D.innerText+(a.length>0?" | Anggota: "+a.length:"")}).eq("id",e.id);if(n)throw n;o.hide(),await k(x)}catch(a){alert("Gagal mengambil tiket: "+a.message)}finally{m.disabled=!1,m.innerText="Konfirmasi & Mulai Pengerjaan"}},o.show()}let x;function K(e){if(!o)return;i=e,P.classList.add("d-none"),C.classList.remove("d-none"),document.getElementById("btn-save-exec").classList.remove("d-none"),A.value=e.ket||"",q.value=e.status==="closed"?"closed":"open",I.value="",c=null,h.classList.add("d-none"),y.src="";const t=e.installation_monitorings&&e.installation_monitorings.length>0?e.installation_monitorings[0]:null;t?(w.value=t.mac_address||"",B.value=t.sn_modem||"",M.value=t.cable_label||"",T.value=t.actual_date||"",S.value=t.activation_date||"",t.photo_proof&&(c=t.photo_proof,y.src=c,h.classList.remove("d-none"))):(w.value="",B.value="",M.value="",T.value=new Date().toISOString().split("T")[0],S.value=new Date().toISOString().split("T")[0]),o.show()}l&&l.addEventListener("click",async()=>{if(!i)return;const e=q.value,t=A.value;l.disabled=!0,l.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{let a=i.points||0;if(e==="closed"){const{data:p}=await s.from("master_queue_types").select("base_point").eq("id",i.type_id).maybeSingle();p?a=p.base_point:a=100}const{error:n}=await s.from("work_orders").update({status:e,points:a,ket:t||i.ket}).eq("id",i.id);if(n)throw n;const d={work_order_id:i.id,customer_id:i.customer_id,employee_id:i.employee_id,mac_address:w.value||null,sn_modem:B.value||null,cable_label:M.value||null,actual_date:T.value||null,activation_date:S.value||null,photo_proof:c,notes:t,is_confirmed:!1},E=i.installation_monitorings&&i.installation_monitorings.length>0?i.installation_monitorings[0]:null;E&&(d.id=E.id);const{error:g}=await s.from("installation_monitorings").upsert(d,{onConflict:"work_order_id"});if(g)throw g;o.hide();const L=i.employee_id;await k(L)}catch(a){console.error("Update error:",a),alert("Gagal mengupdate status: "+a.message)}finally{l.disabled=!1,l.innerText="Simpan"}});function _(e){G.classList.remove("d-none"),z.innerText=e,r.innerHTML=""}function J(e){const t=e?e.toLowerCase():"";return t==="waiting"?"warning":t==="confirmed"?"success":t==="open"?"info":t==="closed"?"secondary":t.includes("pending")||t.includes("antrian")?"warning":t.includes("selesai")?"success":t.includes("proses")?"info":t.includes("cancel")?"danger":"secondary"}});
