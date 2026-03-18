import{A as V,s as l}from"./config-CON8XM2G.js";/* empty css               */import{i as X}from"./pwa-install-D8ZuVKTr.js";function Y(s,g,E="Map"){return!s||!g?"":`<a href="${`https://www.google.com/maps/search/?api=1&query=${s},${g}`}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> ${E}</a>`}document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("activity-chat-container"),g=document.getElementById("error-alert"),E=document.getElementById("error-message"),S=document.getElementById("technician-info"),q=document.getElementById("tech-name"),N=document.getElementById("tech-id");let o;document.getElementById("executionModal")&&(o=new bootstrap.Modal(document.getElementById("executionModal")));const d=document.getElementById("btn-save-exec"),A=document.getElementById("exec-status"),D=document.getElementById("exec-notes"),L=document.getElementById("exec-photo"),p=document.getElementById("exec-photo-preview"),f=document.getElementById("photo-preview-container"),I=document.getElementById("exec-mac"),w=document.getElementById("exec-sn"),B=document.getElementById("exec-actual-date"),$=document.getElementById("exec-activation-date"),T=document.getElementById("exec-cable-label"),P=document.getElementById("claim-section"),C=document.getElementById("execution-details-section"),H=document.getElementById("team-selection-container"),b=document.getElementById("btn-confirm-claim");let i=null,r=null;const O=document.getElementById("btn-refresh");let c;X(),O&&O.addEventListener("click",async()=>{c&&await v(c)}),L&&L.addEventListener("change",function(t){const e=t.target.files[0];if(e){const a=new FileReader;a.onload=function(n){r=n.target.result,p.src=r,f.classList.remove("d-none")},a.readAsDataURL(e)}else r=null,f.classList.add("d-none"),p.src=""});const M=new URLSearchParams(window.location.search).get("eid");if(!M){y("Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login..."),setTimeout(()=>{window.location.href=V+"/admin/login"},3e3);return}try{const{data:t,error:e}=await l.from("employees").select("*").eq("employee_id",M).single();if(e||!t){y(`Data teknisi dengan ID ${M} tidak ditemukan.`);return}q.innerText=t.name,N.innerText=t.employee_id,c=t.id,S.classList.remove("d-none"),await v(t.id)}catch(t){console.error(t),y("Terjadi kesalahan saat memuat data dari server.")}async function v(t){s.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:e,error:a}=await l.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*),
                master_queue_types(name, color, icon)
            `).or(`status.eq.confirmed,employee_id.eq.${t},claimed_by.eq.${t}`).order("created_at",{ascending:!0});if(a){y("Gagal memuat daftar pekerjaan: "+a.message),s.innerHTML="";return}if(!e||e.length===0){s.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}s.innerHTML="",e.forEach(n=>{const m=n.customers?.name||"Pelanggan tidak diketahui",h=n.customers?.address||"-",k=n.customers?.lat,x=n.customers?.lng,K=Y(k,x),j=new Date(n.created_at),J=j.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),Q=j.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),R=F(n.status),_=n.master_queue_types,u=document.createElement("div");u.className="chat-bubble",u.style.borderLeftColor=_?.color||"#3B82F6",u.innerHTML=`
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                         <span class="badge rounded-pill px-2 me-2" style="background:${_?.color||"#6b7280"}">
                            <i class="bi ${_?.icon||"bi-ticket-detailed"} me-1"></i>
                            ${_?.name||"Tiket"}
                        </span>
                        <div>
                            <div class="fw-bold mb-0">${n.title}</div>
                            <div class="small text-muted"><i class="bi bi-clock me-1"></i> ${Q} ${J}</div>
                        </div>
                    </div>
                    <span class="badge rounded-pill bg-${R} bg-opacity-10 text-${R} px-3 py-2" style="font-size: 0.75rem">${n.status}</span>
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
                            <div class="fw-medium small">${h} ${K}</div>
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
            `;const U=u.querySelector('.btn-eksekusi[data-action="execute"]');U&&U.addEventListener("click",()=>z(n));const G=u.querySelector('.btn-eksekusi[data-action="claim"]');G&&G.addEventListener("click",()=>W(n)),s.appendChild(u)})}async function W(t){if(!o)return;i=t,P.classList.remove("d-none"),C.classList.add("d-none"),document.getElementById("btn-save-exec").classList.add("d-none"),H.innerHTML='<div class="spinner-border spinner-border-sm text-success"></div>';const{data:e}=await l.from("employees").select("id, name").neq("id",c);H.innerHTML=e.map(a=>`
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${a.id}" value="${a.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${a.id}">${a.name}</label>
            </div>
        `).join(""),b.onclick=async()=>{b.disabled=!0,b.innerHTML='<span class="spinner-border spinner-border-sm"></span> Memproses...';try{const a=Array.from(document.querySelectorAll(".team-member-check:checked")).map(m=>m.value),{error:n}=await l.from("work_orders").update({status:"open",claimed_by:c,claimed_at:new Date().toISOString(),ket:"Team Lead: "+q.innerText+(a.length>0?" | Anggota: "+a.length:"")}).eq("id",t.id);if(n)throw n;o.hide(),await v(c)}catch(a){alert("Gagal mengambil tiket: "+a.message)}finally{b.disabled=!1,b.innerText="Konfirmasi & Mulai Pengerjaan"}},o.show()}function z(t){if(!o)return;i=t,P.classList.add("d-none"),C.classList.remove("d-none"),document.getElementById("btn-save-exec").classList.remove("d-none"),D.value=t.ket||"",A.value=t.status==="closed"?"closed":"open",L.value="",r=null,f.classList.add("d-none"),p.src="";const e=t.installation_monitorings&&t.installation_monitorings.length>0?t.installation_monitorings[0]:null;e?(I.value=e.mac_address||"",w.value=e.sn_modem||"",T.value=e.cable_label||"",B.value=e.actual_date||"",$.value=e.activation_date||"",e.photo_proof&&(r=e.photo_proof,p.src=r,f.classList.remove("d-none"))):(I.value="",w.value="",T.value="",B.value=new Date().toISOString().split("T")[0],$.value=new Date().toISOString().split("T")[0]),o.show()}d&&d.addEventListener("click",async()=>{if(!i)return;const t=A.value,e=D.value;d.disabled=!0,d.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{let a=i.points||0;if(t==="closed"){const{data:x}=await l.from("master_queue_types").select("base_point").eq("id",i.type_id).maybeSingle();x?a=x.base_point:a=100}const{error:n}=await l.from("work_orders").update({status:t,points:a,ket:e||i.ket}).eq("id",i.id);if(n)throw n;const m={work_order_id:i.id,customer_id:i.customer_id,employee_id:i.employee_id,mac_address:I.value||null,sn_modem:w.value||null,cable_label:T.value||null,actual_date:B.value||null,activation_date:$.value||null,photo_proof:r,notes:e,is_confirmed:!1},h=i.installation_monitorings&&i.installation_monitorings.length>0?i.installation_monitorings[0]:null;h&&(m.id=h.id);const{error:k}=await l.from("installation_monitorings").upsert(m,{onConflict:"work_order_id"});if(k)throw k;o.hide(),await v(c)}catch(a){console.error("Update error:",a),alert("Gagal mengupdate status: "+a.message)}finally{d.disabled=!1,d.innerText="Simpan"}});function y(t){g.classList.remove("d-none"),E.innerText=t,s.innerHTML=""}function F(t){const e=t?t.toLowerCase():"";return e==="waiting"?"warning":e==="confirmed"?"success":e==="open"?"info":e==="closed"?"secondary":e.includes("pending")||e.includes("antrian")?"warning":e.includes("selesai")?"success":e.includes("proses")?"info":e.includes("cancel")?"danger":"secondary"}});
