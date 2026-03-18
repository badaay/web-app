import{A as X,s as u}from"./config-CON8XM2G.js";/* empty css               */function Z(s,i,l="Map"){return!s||!i?"":`<a href="${`https://www.google.com/maps/search/?api=1&query=${s},${i}`}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> ${l}</a>`}const W="pwa_install_dismissed_at",ee=2880*60*1e3;function te(){return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0}function ne(){return/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream}function N(){const s=localStorage.getItem(W);return s?Date.now()-parseInt(s,10)<ee:!1}function ae({bannerId:s="pwa-install-banner"}={}){if(te())return;const i=document.getElementById(s);if(!i)return;let l=null;function v(){i.classList.remove("d-none"),requestAnimationFrame(()=>{requestAnimationFrame(()=>i.classList.add("pwa-banner--visible"))})}function p(o=!1){i.classList.remove("pwa-banner--visible"),setTimeout(()=>i.classList.add("d-none"),420),o&&localStorage.setItem(W,String(Date.now()))}i.querySelector("[data-pwa-dismiss]")?.addEventListener("click",()=>p(!0));const c=i.querySelector("[data-pwa-install]");if(ne()){i.querySelector("[data-pwa-ios]")?.classList.remove("d-none"),i.querySelector("[data-pwa-android]")?.classList.add("d-none"),c?.classList.add("d-none"),N()||v();return}window.addEventListener("beforeinstallprompt",o=>{o.preventDefault(),l=o,N()||v()}),window.addEventListener("appinstalled",()=>{p(!1),l=null}),c?.addEventListener("click",async()=>{if(!l)return;c.disabled=!0,c.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Menginstall...',l.prompt();const{outcome:o}=await l.userChoice;l=null,o==="accepted"?p(!1):(c.disabled=!1,c.innerHTML='<i class="bi bi-download me-1"></i>Install')})}document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("activity-chat-container"),i=document.getElementById("error-alert"),l=document.getElementById("error-message"),v=document.getElementById("technician-info"),p=document.getElementById("tech-name"),c=document.getElementById("tech-id");let o;document.getElementById("executionModal")&&(o=new bootstrap.Modal(document.getElementById("executionModal")));const b=document.getElementById("btn-save-exec"),A=document.getElementById("exec-status"),P=document.getElementById("exec-notes"),S=document.getElementById("exec-photo"),h=document.getElementById("exec-photo-preview"),k=document.getElementById("photo-preview-container"),B=document.getElementById("exec-mac"),T=document.getElementById("exec-sn"),M=document.getElementById("exec-actual-date"),$=document.getElementById("exec-activation-date"),q=document.getElementById("exec-cable-label"),C=document.getElementById("claim-section"),H=document.getElementById("execution-details-section"),O=document.getElementById("team-selection-container"),y=document.getElementById("btn-confirm-claim");let r=null,d=null;const R=document.getElementById("btn-refresh");let m;ae(),R&&R.addEventListener("click",async()=>{m&&await x(m)}),S&&S.addEventListener("change",function(t){const e=t.target.files[0];if(e){const a=new FileReader;a.onload=function(n){d=n.target.result,h.src=d,k.classList.remove("d-none")},a.readAsDataURL(e)}else d=null,k.classList.add("d-none"),h.src=""});const D=new URLSearchParams(window.location.search).get("eid");if(!D){_("Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login..."),setTimeout(()=>{window.location.href=X+"/admin/login"},3e3);return}try{const{data:t,error:e}=await u.from("employees").select("*").eq("employee_id",D).single();if(e||!t){_(`Data teknisi dengan ID ${D} tidak ditemukan.`);return}p.innerText=t.name,c.innerText=t.employee_id,m=t.id,v.classList.remove("d-none"),await x(t.id)}catch(t){console.error(t),_("Terjadi kesalahan saat memuat data dari server.")}async function x(t){s.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:e,error:a}=await u.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*),
                master_queue_types(name, color, icon)
            `).or(`status.eq.confirmed,employee_id.eq.${t},claimed_by.eq.${t}`).order("created_at",{ascending:!0});if(a){_("Gagal memuat daftar pekerjaan: "+a.message),s.innerHTML="";return}if(!e||e.length===0){s.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}s.innerHTML="",e.forEach(n=>{const g=n.customers?.name||"Pelanggan tidak diketahui",L=n.customers?.address||"-",w=n.customers?.lat,E=n.customers?.lng,J=Z(w,E),j=new Date(n.created_at),Q=j.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),V=j.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),G=Y(n.status),I=n.master_queue_types,f=document.createElement("div");f.className="chat-bubble",f.style.borderLeftColor=I?.color||"#3B82F6",f.innerHTML=`
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                         <span class="badge rounded-pill px-2 me-2" style="background:${I?.color||"#6b7280"}">
                            <i class="bi ${I?.icon||"bi-ticket-detailed"} me-1"></i>
                            ${I?.name||"Tiket"}
                        </span>
                        <div>
                            <div class="fw-bold mb-0">${n.title}</div>
                            <div class="small text-muted"><i class="bi bi-clock me-1"></i> ${V} ${Q}</div>
                        </div>
                    </div>
                    <span class="badge rounded-pill bg-${G} bg-opacity-10 text-${G} px-3 py-2" style="font-size: 0.75rem">${n.status}</span>
                </div>

                <div class="p-3 bg-light rounded-4 mb-3 border border-light">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-person-circle fs-5 text-primary me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Nama Pelanggan</div>
                            <div class="fw-medium">${g}</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-start">
                        <i class="bi bi-geo-alt-fill fs-5 text-danger me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Alamat Pemasangan</div>
                            <div class="fw-medium small">${L} ${J}</div>
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
            `;const U=f.querySelector('.btn-eksekusi[data-action="execute"]');U&&U.addEventListener("click",()=>K(n));const F=f.querySelector('.btn-eksekusi[data-action="claim"]');F&&F.addEventListener("click",()=>z(n)),s.appendChild(f)})}async function z(t){if(!o)return;r=t,C.classList.remove("d-none"),H.classList.add("d-none"),document.getElementById("btn-save-exec").classList.add("d-none"),O.innerHTML='<div class="spinner-border spinner-border-sm text-success"></div>';const{data:e}=await u.from("employees").select("id, name").neq("id",m);O.innerHTML=e.map(a=>`
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${a.id}" value="${a.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${a.id}">${a.name}</label>
            </div>
        `).join(""),y.onclick=async()=>{y.disabled=!0,y.innerHTML='<span class="spinner-border spinner-border-sm"></span> Memproses...';try{const a=Array.from(document.querySelectorAll(".team-member-check:checked")).map(g=>g.value),{error:n}=await u.from("work_orders").update({status:"open",claimed_by:m,claimed_at:new Date().toISOString(),ket:"Team Lead: "+p.innerText+(a.length>0?" | Anggota: "+a.length:"")}).eq("id",t.id);if(n)throw n;o.hide(),await x(m)}catch(a){alert("Gagal mengambil tiket: "+a.message)}finally{y.disabled=!1,y.innerText="Konfirmasi & Mulai Pengerjaan"}},o.show()}function K(t){if(!o)return;r=t,C.classList.add("d-none"),H.classList.remove("d-none"),document.getElementById("btn-save-exec").classList.remove("d-none"),P.value=t.ket||"",A.value=t.status==="closed"?"closed":"open",S.value="",d=null,k.classList.add("d-none"),h.src="";const e=t.installation_monitorings&&t.installation_monitorings.length>0?t.installation_monitorings[0]:null;e?(B.value=e.mac_address||"",T.value=e.sn_modem||"",q.value=e.cable_label||"",M.value=e.actual_date||"",$.value=e.activation_date||"",e.photo_proof&&(d=e.photo_proof,h.src=d,k.classList.remove("d-none"))):(B.value="",T.value="",q.value="",M.value=new Date().toISOString().split("T")[0],$.value=new Date().toISOString().split("T")[0]),o.show()}b&&b.addEventListener("click",async()=>{if(!r)return;const t=A.value,e=P.value;b.disabled=!0,b.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{let a=r.points||0;if(t==="closed"){const{data:E}=await u.from("master_queue_types").select("base_point").eq("id",r.type_id).maybeSingle();E?a=E.base_point:a=100}const{error:n}=await u.from("work_orders").update({status:t,points:a,ket:e||r.ket}).eq("id",r.id);if(n)throw n;const g={work_order_id:r.id,customer_id:r.customer_id,employee_id:r.employee_id,mac_address:B.value||null,sn_modem:T.value||null,cable_label:q.value||null,actual_date:M.value||null,activation_date:$.value||null,photo_proof:d,notes:e,is_confirmed:!1},L=r.installation_monitorings&&r.installation_monitorings.length>0?r.installation_monitorings[0]:null;L&&(g.id=L.id);const{error:w}=await u.from("installation_monitorings").upsert(g,{onConflict:"work_order_id"});if(w)throw w;o.hide(),await x(m)}catch(a){console.error("Update error:",a),alert("Gagal mengupdate status: "+a.message)}finally{b.disabled=!1,b.innerText="Simpan"}});function _(t){i.classList.remove("d-none"),l.innerText=t,s.innerHTML=""}function Y(t){const e=t?t.toLowerCase():"";return e==="waiting"?"warning":e==="confirmed"?"success":e==="open"?"info":e==="closed"?"secondary":e.includes("pending")||e.includes("antrian")?"warning":e.includes("selesai")?"success":e.includes("proses")?"info":e.includes("cancel")?"danger":"secondary"}});
