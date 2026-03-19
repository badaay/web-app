import{A as Z,s as l}from"./config-CON8XM2G.js";/* empty css               */import{A as ee}from"./config-Dipwna8v.js";function te(i,o,d="Map"){return!i||!o?"":`<a href="${`https://www.google.com/maps/search/?api=1&query=${i},${o}`}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> ${d}</a>`}const X="pwa_install_dismissed_at",ne=2880*60*1e3;function ae(){return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0}function se(){return/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream}function Y(){const i=localStorage.getItem(X);return i?Date.now()-parseInt(i,10)<ne:!1}function ie({bannerId:i="pwa-install-banner"}={}){if(ae())return;const o=document.getElementById(i);if(!o)return;let d=null;function L(){o.classList.remove("d-none"),requestAnimationFrame(()=>{requestAnimationFrame(()=>o.classList.add("pwa-banner--visible"))})}function y(r=!1){o.classList.remove("pwa-banner--visible"),setTimeout(()=>o.classList.add("d-none"),420),r&&localStorage.setItem(X,String(Date.now()))}o.querySelector("[data-pwa-dismiss]")?.addEventListener("click",()=>y(!0));const u=o.querySelector("[data-pwa-install]");if(se()){o.querySelector("[data-pwa-ios]")?.classList.remove("d-none"),o.querySelector("[data-pwa-android]")?.classList.add("d-none"),u?.classList.add("d-none"),Y()||L();return}window.addEventListener("beforeinstallprompt",r=>{r.preventDefault(),d=r,Y()||L()}),window.addEventListener("appinstalled",()=>{y(!1),d=null}),u?.addEventListener("click",async()=>{if(!d)return;u.disabled=!0,u.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Menginstall...',d.prompt();const{outcome:r}=await d.userChoice;d=null,r==="accepted"?y(!1):(u.disabled=!1,u.innerHTML='<i class="bi bi-download me-1"></i>Install')})}document.addEventListener("DOMContentLoaded",async()=>{const i=document.getElementById("activity-chat-container"),o=document.getElementById("error-alert"),d=document.getElementById("error-message"),L=document.getElementById("technician-info"),y=document.getElementById("tech-name"),u=document.getElementById("tech-id");let r;document.getElementById("executionModal")&&(r=new bootstrap.Modal(document.getElementById("executionModal")));const _=document.getElementById("btn-save-exec"),G=document.getElementById("exec-status"),R=document.getElementById("exec-notes"),q=document.getElementById("exec-photo"),M=document.getElementById("exec-photo-preview"),B=document.getElementById("photo-preview-container"),A=document.getElementById("exec-mac"),P=document.getElementById("exec-sn"),C=document.getElementById("exec-actual-date"),H=document.getElementById("exec-activation-date"),O=document.getElementById("exec-cable-label"),N=document.getElementById("claim-section"),j=document.getElementById("execution-details-section"),W=document.getElementById("team-selection-container"),S=document.getElementById("btn-confirm-claim");let s=null,f=null;const z=document.getElementById("btn-refresh");let g;ie(),z&&z.addEventListener("click",async()=>{g&&await T(g)}),q&&q.addEventListener("change",function(e){const t=e.target.files[0];if(t){const a=new FileReader;a.onload=function(n){f=n.target.result,M.src=f,B.classList.remove("d-none")},a.readAsDataURL(t)}else f=null,B.classList.add("d-none"),M.src=""});const U=new URLSearchParams(window.location.search).get("eid");if(!U){h("Akses ditolak. Format URL tidak valid atau kode teknisi tidak ditemukan. Mengalihkan ke halaman login..."),setTimeout(()=>{window.location.href=Z+"/admin/login"},3e3);return}try{const{data:e,error:t}=await l.from("employees").select("*").eq("employee_id",U).single();if(t||!e){h(`Data teknisi dengan ID ${U} tidak ditemukan.`);return}y.innerText=e.name,u.innerText=e.employee_id,g=e.id,L.classList.remove("d-none"),await T(e.id)}catch(e){console.error(e),h("Terjadi kesalahan saat memuat data dari server.")}async function T(e){i.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:t,error:a}=await l.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*),
                employees!employee_id ( name ),
                master_queue_types(name, color, icon),
                work_order_assignments ( id, employee_id, assignment_role, points_earned, employees(name) )
            `).or(`status.eq.confirmed,employee_id.eq.${e},claimed_by.eq.${e}`).order("created_at",{ascending:!0});if(a){h("Gagal memuat daftar pekerjaan: "+a.message),i.innerHTML="";return}if(!t||t.length===0){i.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}i.innerHTML="",t.forEach(n=>{const k=n.customers?.name||"Pelanggan tidak diketahui",b=n.customers?.address||"-",p=n.customers?.lat,w=n.customers?.lng,E=te(p,w),c=new Date(n.created_at),v=c.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),F=c.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),$=V(n.status),x=n.master_queue_types,m=document.createElement("div");m.className="chat-bubble",m.style.borderLeftColor=x?.color||"#3B82F6",m.innerHTML=`
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                         <span class="badge rounded-pill px-2 me-2" style="background:${x?.color||"#6b7280"}">
                            <i class="bi ${x?.icon||"bi-ticket-detailed"} me-1"></i>
                            ${x?.name||"Tiket"}
                        </span>
                        <div>
                            <div class="fw-bold mb-0">${n.title}</div>
                            <div class="small text-muted"><i class="bi bi-clock me-1"></i> ${F} ${v}</div>
                        </div>
                    </div>
                    <span class="badge rounded-pill bg-${$} bg-opacity-10 text-${$} px-3 py-2" style="font-size: 0.75rem">${n.status}</span>
                </div>

                <div class="p-3 bg-light rounded-4 mb-3 border border-light">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-person-circle fs-5 text-primary me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Nama Pelanggan</div>
                            <div class="fw-medium">${k}</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-start">
                        <i class="bi bi-geo-alt-fill fs-5 text-danger me-3"></i>
                        <div>
                            <div class="small text-muted" style="font-size: 0.7rem">Alamat Pemasangan</div>
                            <div class="fw-medium small">${b} ${E}</div>
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
            `;const I=m.querySelector('.btn-eksekusi[data-action="execute"]');I&&I.addEventListener("click",()=>Q(n));const D=m.querySelector('.btn-eksekusi[data-action="claim"]');D&&D.addEventListener("click",()=>J(n)),i.appendChild(m)})}async function J(e){if(!r)return;s=e,N.classList.remove("d-none"),j.classList.add("d-none"),document.getElementById("btn-save-exec").classList.add("d-none"),W.innerHTML='<div class="spinner-border spinner-border-sm text-success"></div>';const{data:t}=await l.from("employees").select("id, name").neq("id",g);W.innerHTML=t.map(a=>`
            <div class="form-check">
                <input class="btn-check team-member-check" type="checkbox" id="team-${a.id}" value="${a.id}" autocomplete="off">
                <label class="btn btn-sm btn-outline-success rounded-pill px-3" for="team-${a.id}">${a.name}</label>
            </div>
        `).join(""),S.onclick=async()=>{S.disabled=!0,S.innerHTML='<span class="spinner-border spinner-border-sm"></span> Memproses...';try{const a=Array.from(document.querySelectorAll(".team-member-check:checked")).map(p=>p.value),{error:n}=await l.from("work_orders").update({status:"open",claimed_by:g,claimed_at:new Date().toISOString(),ket:"Team Lead: "+y.innerText+(a.length>0?" | Anggota: "+a.length:"")}).eq("id",e.id);if(n)throw n;const k=[{work_order_id:e.id,employee_id:g,assignment_role:"lead",assigned_at:new Date().toISOString()},...a.map(p=>({work_order_id:e.id,employee_id:p,assignment_role:"member",assigned_at:new Date().toISOString()}))],{error:b}=await l.from("work_order_assignments").upsert(k,{onConflict:"work_order_id,employee_id"});b&&console.warn("Gagal menyimpan assignment tim:",b.message),r.hide(),await T(g)}catch(a){h("Gagal mengambil tiket: "+a.message)}finally{S.disabled=!1,S.innerText="Konfirmasi & Mulai Pengerjaan"}},r.show()}function Q(e){if(!r)return;s=e,N.classList.add("d-none"),j.classList.remove("d-none"),document.getElementById("btn-save-exec").classList.remove("d-none"),R.value=e.ket||"",G.value=e.status==="closed"?"closed":"open",q.value="",f=null,B.classList.add("d-none"),M.src="";const t=e.installation_monitorings&&e.installation_monitorings.length>0?e.installation_monitorings[0]:null;t?(A.value=t.mac_address||"",P.value=t.sn_modem||"",O.value=t.cable_label||"",C.value=t.actual_date||"",H.value=t.activation_date||"",t.photo_proof&&(f=t.photo_proof,M.src=f,B.classList.remove("d-none"))):(A.value="",P.value="",O.value="",C.value=new Date().toISOString().split("T")[0],H.value=new Date().toISOString().split("T")[0]),r.show()}_&&_.addEventListener("click",async()=>{if(!s)return;const e=G.value,t=R.value;_.disabled=!0,_.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{let a=s.points||0;if(e==="closed"){const{data:w}=await l.from("master_queue_types").select("base_point, name").eq("id",s.type_id).maybeSingle();w?a=w.base_point:a=100;const{data:E}=await l.from("work_order_assignments").select("id, assignment_role").eq("work_order_id",s.id);if(E&&E.length>0){const c=E.map(v=>({id:v.id,points_earned:v.assignment_role==="lead"?a:Math.floor(a/2)}));await l.from("work_order_assignments").upsert(c,{onConflict:"id"})}if(w&&w.name==="PSB"){const{data:c}=await l.from("customers").select("phone, email, name, customer_code").eq("id",s.customer_id).single();if(c&&!c.customer_code){const v=new Date,F=String(v.getFullYear()).slice(-2),$=String(v.getMonth()+1).padStart(2,"0"),x=String(Math.floor(1e6+Math.random()*9e6)),m=`${F}${$}${x}`,I=c.email||`${c.phone}${ee.AUTH_DOMAIN_SUFFIX}`,D=Math.random().toString(36).slice(-12)+"Aa1!",{error:K}=await l.auth.signUp({email:I,password:D,options:{data:{full_name:c.name,customer_code:m,role:"customer"}}});K?console.warn("PSB selesai tapi gagal membuat akun pelanggan:",K.message):await l.from("customers").update({customer_code:m,email:I}).eq("id",s.customer_id)}}}const{error:n}=await l.from("work_orders").update({status:e,points:a,ket:t||s.ket,...e==="closed"&&{completed_at:new Date().toISOString()}}).eq("id",s.id);if(n)throw n;const k={work_order_id:s.id,customer_id:s.customer_id,employee_id:s.employee_id,mac_address:A.value||null,sn_modem:P.value||null,cable_label:O.value||null,actual_date:C.value||null,activation_date:H.value||null,photo_proof:f,notes:t,is_confirmed:!1},b=s.installation_monitorings&&s.installation_monitorings.length>0?s.installation_monitorings[0]:null;b&&(k.id=b.id);const{error:p}=await l.from("installation_monitorings").upsert(k,{onConflict:"work_order_id"});if(p)throw p;r.hide(),await T(g)}catch(a){console.error("Update error:",a),h("Gagal mengupdate status: "+a.message)}finally{_.disabled=!1,_.innerText="Simpan"}});function h(e){o.classList.remove("d-none"),d.innerText=e,i.innerHTML=""}function V(e){const t=e?e.toLowerCase():"";return t==="waiting"?"warning":t==="confirmed"?"success":t==="open"?"info":t==="closed"?"secondary":t.includes("pending")||t.includes("antrian")?"warning":t.includes("selesai")?"success":t.includes("proses")?"info":t.includes("cancel")?"danger":"secondary"}});
