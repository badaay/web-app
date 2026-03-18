import{A as Y,s as l}from"./config-CON8XM2G.js";/* empty css               */function Z(s,f,I="Map"){return!s||!f?"":`<a href="${`https://www.google.com/maps/search/?api=1&query=${s},${f}`}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> ${I}</a>`}document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("activity-chat-container"),f=document.getElementById("error-alert"),I=document.getElementById("error-message"),q=document.getElementById("technician-info"),A=document.getElementById("tech-name"),F=document.getElementById("tech-id");let o;document.getElementById("executionModal")&&(o=new bootstrap.Modal(document.getElementById("executionModal")));const d=document.getElementById("btn-save-exec"),C=document.getElementById("exec-status"),P=document.getElementById("exec-notes"),w=document.getElementById("exec-photo"),v=document.getElementById("exec-photo-preview"),y=document.getElementById("photo-preview-container"),B=document.getElementById("exec-mac"),$=document.getElementById("exec-sn"),T=document.getElementById("exec-actual-date"),M=document.getElementById("exec-activation-date"),S=document.getElementById("exec-cable-label"),H=document.getElementById("claim-section"),O=document.getElementById("execution-details-section"),j=document.getElementById("team-selection-container"),b=document.getElementById("btn-confirm-claim");let i=null,c=null;const R=document.getElementById("btn-refresh"),g=document.getElementById("btn-install");let r,p;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),p=e,g&&g.classList.remove("d-none")}),R&&R.addEventListener("click",async()=>{r&&await h(r)}),g&&g.addEventListener("click",async()=>{if(p){p.prompt();const{outcome:e}=await p.userChoice;e==="accepted"&&g.classList.add("d-none"),p=null}}),w&&w.addEventListener("change",function(e){const t=e.target.files[0];if(t){const a=new FileReader;a.onload=function(n){c=n.target.result,v.src=c,y.classList.remove("d-none")},a.readAsDataURL(t)}else c=null,y.classList.add("d-none"),v.src=""});const D=new URLSearchParams(window.location.search).get("eid");if(!D){k("Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login..."),setTimeout(()=>{window.location.href=Y+"/admin/login"},3e3);return}try{const{data:e,error:t}=await l.from("employees").select("*").eq("employee_id",D).single();if(t||!e){k(`Data teknisi dengan ID ${D} tidak ditemukan.`);return}A.innerText=e.name,F.innerText=e.employee_id,r=e.id,q.classList.remove("d-none"),await h(e.id)}catch(e){console.error(e),k("Terjadi kesalahan saat memuat data dari server.")}async function h(e){s.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:t,error:a}=await l.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*),
                master_queue_types(name, color, icon)
            `).or(`status.eq.confirmed,employee_id.eq.${e},claimed_by.eq.${e}`).order("created_at",{ascending:!0});if(a){k("Gagal memuat daftar pekerjaan: "+a.message),s.innerHTML="";return}if(!t||t.length===0){s.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}s.innerHTML="",t.forEach(n=>{const m=n.customers?.name||"Pelanggan tidak diketahui",x=n.customers?.address||"-",_=n.customers?.lat,L=n.customers?.lng,Q=Z(_,L),U=new Date(n.created_at),V=U.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),X=U.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),G=J(n.status),E=n.master_queue_types,u=document.createElement("div");u.className="chat-bubble",u.style.borderLeftColor=E?.color||"#3B82F6",u.innerHTML=`
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                         <span class="badge rounded-pill px-2 me-2" style="background:${E?.color||"#6b7280"}">
                            <i class="bi ${E?.icon||"bi-ticket-detailed"} me-1"></i>
                            ${E?.name||"Tiket"}
                        </span>
                        <div>
                            <div class="fw-bold mb-0">${n.title}</div>
                            <div class="small text-muted"><i class="bi bi-clock me-1"></i> ${X} ${V}</div>
                        </div>
                    </div>
                    <span class="badge rounded-pill bg-${G} bg-opacity-10 text-${G} px-3 py-2" style="font-size: 0.75rem">${n.status}</span>
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
                            <div class="fw-medium small">${x} ${Q}</div>
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
            `;const N=u.querySelector('.btn-eksekusi[data-action="execute"]');N&&N.addEventListener("click",()=>K(n));const z=u.querySelector('.btn-eksekusi[data-action="claim"]');z&&z.addEventListener("click",()=>W(n)),s.appendChild(u)})}async function W(e){if(!o)return;i=e,H.classList.remove("d-none"),O.classList.add("d-none"),document.getElementById("btn-save-exec").classList.add("d-none"),j.innerHTML='<div class="spinner-border spinner-border-sm text-success"></div>';const{data:t}=await l.from("employees").select("id, name").neq("id",r);j.innerHTML=t.map(a=>`
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${a.id}" value="${a.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${a.id}">${a.name}</label>
            </div>
        `).join(""),b.onclick=async()=>{b.disabled=!0,b.innerHTML='<span class="spinner-border spinner-border-sm"></span> Memproses...';try{const a=Array.from(document.querySelectorAll(".team-member-check:checked")).map(m=>m.value),{error:n}=await l.from("work_orders").update({status:"open",claimed_by:r,claimed_at:new Date().toISOString(),ket:"Team Lead: "+A.innerText+(a.length>0?" | Anggota: "+a.length:"")}).eq("id",e.id);if(n)throw n;o.hide(),await h(r)}catch(a){alert("Gagal mengambil tiket: "+a.message)}finally{b.disabled=!1,b.innerText="Konfirmasi & Mulai Pengerjaan"}},o.show()}function K(e){if(!o)return;i=e,H.classList.add("d-none"),O.classList.remove("d-none"),document.getElementById("btn-save-exec").classList.remove("d-none"),P.value=e.ket||"",C.value=e.status==="closed"?"closed":"open",w.value="",c=null,y.classList.add("d-none"),v.src="";const t=e.installation_monitorings&&e.installation_monitorings.length>0?e.installation_monitorings[0]:null;t?(B.value=t.mac_address||"",$.value=t.sn_modem||"",S.value=t.cable_label||"",T.value=t.actual_date||"",M.value=t.activation_date||"",t.photo_proof&&(c=t.photo_proof,v.src=c,y.classList.remove("d-none"))):(B.value="",$.value="",S.value="",T.value=new Date().toISOString().split("T")[0],M.value=new Date().toISOString().split("T")[0]),o.show()}d&&d.addEventListener("click",async()=>{if(!i)return;const e=C.value,t=P.value;d.disabled=!0,d.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{let a=i.points||0;if(e==="closed"){const{data:L}=await l.from("master_queue_types").select("base_point").eq("id",i.type_id).maybeSingle();L?a=L.base_point:a=100}const{error:n}=await l.from("work_orders").update({status:e,points:a,ket:t||i.ket}).eq("id",i.id);if(n)throw n;const m={work_order_id:i.id,customer_id:i.customer_id,employee_id:i.employee_id,mac_address:B.value||null,sn_modem:$.value||null,cable_label:S.value||null,actual_date:T.value||null,activation_date:M.value||null,photo_proof:c,notes:t,is_confirmed:!1},x=i.installation_monitorings&&i.installation_monitorings.length>0?i.installation_monitorings[0]:null;x&&(m.id=x.id);const{error:_}=await l.from("installation_monitorings").upsert(m,{onConflict:"work_order_id"});if(_)throw _;o.hide(),await h(r)}catch(a){console.error("Update error:",a),alert("Gagal mengupdate status: "+a.message)}finally{d.disabled=!1,d.innerText="Simpan"}});function k(e){f.classList.remove("d-none"),I.innerText=e,s.innerHTML=""}function J(e){const t=e?e.toLowerCase():"";return t==="waiting"?"warning":t==="confirmed"?"success":t==="open"?"info":t==="closed"?"secondary":t.includes("pending")||t.includes("antrian")?"warning":t.includes("selesai")?"success":t.includes("proses")?"info":t.includes("cancel")?"danger":"secondary"}});
