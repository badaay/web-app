import{s as l}from"./supabase-BeOTOPRS.js";/* empty css               *//* empty css              *//* empty css               */document.addEventListener("DOMContentLoaded",async()=>{const o=document.getElementById("activity-chat-container"),R=document.getElementById("error-alert"),q=document.getElementById("error-message"),A=document.getElementById("technician-info"),O=document.getElementById("tech-name"),m=document.getElementById("tech-id");let u;document.getElementById("executionModal")&&(u=new bootstrap.Modal(document.getElementById("executionModal")));const r=document.getElementById("btn-save-exec"),B=document.getElementById("exec-status"),T=document.getElementById("exec-notes"),x=document.getElementById("exec-photo"),g=document.getElementById("exec-photo-preview"),p=document.getElementById("photo-preview-container"),E=document.getElementById("exec-mac"),_=document.getElementById("exec-sn"),I=document.getElementById("exec-actual-date"),L=document.getElementById("exec-activation-date");let a=null,s=null;const S=document.getElementById("btn-refresh"),c=document.getElementById("btn-install");S&&S.addEventListener("click",async()=>{if(m.innerText&&m.innerText!=="ID TKN"){const e=await l.from("employees").select("id").eq("employee_id",m.innerText).single();e.data&&await w(e.data.id)}});let d;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),d=e,c&&c.classList.remove("d-none")}),c&&c.addEventListener("click",async()=>{if(d){d.prompt();const{outcome:e}=await d.userChoice;e==="accepted"&&c.classList.add("d-none"),d=null}}),x&&x.addEventListener("change",function(e){const t=e.target.files[0];if(t){const i=new FileReader;i.onload=function(n){s=n.target.result,g.src=s,p.classList.remove("d-none")},i.readAsDataURL(t)}else s=null,p.classList.add("d-none"),g.src=""});const M=window.location.pathname.split("/"),D=M.findIndex(e=>e==="activity"||e==="activity.html");let f=null;if(D>0&&(f=M[D-1]),new URLSearchParams(window.location.search).get("shortGenerated"),!f){b("Format URL tidak valid. ID Teknisi tidak ditemukan di URL.");return}try{const{data:e,error:t}=await l.from("employees").select("*").eq("employee_id",f).single();if(t||!e){b(`Data teknisi dengan ID ${f} tidak ditemukan.`);return}O.innerText=e.name,m.innerText=e.employee_id,A.classList.remove("d-none"),await w(e.id)}catch(e){console.error(e),b("Terjadi kesalahan saat memuat data dari server.")}async function w(e){o.innerHTML=`
            <div class="loading-chat">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading tasks...</span>
                </div>
            </div>
        `;const{data:t,error:i}=await l.from("work_orders").select(`
                *,
                customers ( name, address, phone, lat, lng ),
                installation_monitorings (*)
            `).eq("employee_id",e).order("created_at",{ascending:!0});if(i){b("Gagal memuat daftar pekerjaan: "+i.message),o.innerHTML="";return}if(!t||t.length===0){o.innerHTML=`
                <div class="text-center text-white-50 mt-5">
                    <i class="bi bi-check-circle fs-1 d-block mb-3 text-success opacity-50"></i>
                    <p>Tidak ada pekerjaan (Work Order) aktif yang di-assign ke Anda saat ini.</p>
                </div>
            `;return}o.innerHTML="",t.forEach(n=>{const h=n.customers?.name||"Pelanggan tidak diketahui",v=n.customers?.address||"-",y=n.customers?.lat,$=n.customers?.lng;let P="";y&&$&&(P=`<a href="https://www.google.com/maps/search/?api=1&query=${y},${$}" target="_blank" class="badge bg-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> Map</a>`);const C=new Date(n.created_at),j=C.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),G=C.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),W=U(n.status),k=document.createElement("div");k.className="chat-bubble",k.innerHTML=`
                <div class="chat-header">
                    <span><i class="bi bi-clock"></i> ${G} ${j}</span>
                    <span class="badge bg-${W}">${n.status}</span>
                </div>
                <div class="chat-title">${n.title}</div>
                <div class="chat-detail mb-2">
                    <i class="bi bi-person text-white-50 me-1"></i> ${h}<br>
                    <i class="bi bi-geo-alt text-white-50 me-1"></i> ${v} ${P}
                </div>
                ${n.description?`<div class="p-2 bg-dark bg-opacity-50 rounded text-white-50 small mb-2">${n.description}</div>`:""}
                
                ${n.status!=="Selesai"?`
                <button class="btn btn-primary btn-sm btn-eksekusi fw-bold" data-target="${n.id}">
                    <i class="bi bi-play-fill text-white"></i> Eksekusi
                </button>
                `:`
                <button class="btn btn-outline-secondary btn-sm btn-eksekusi fw-bold" disabled>
                    <i class="bi bi-check2-all"></i> Selesai
                </button>
                `}
            `;const H=k.querySelector(".btn-eksekusi:not([disabled])");H&&H.addEventListener("click",()=>N(n)),o.appendChild(k)})}function N(e){if(!u)return;a=e,T.value=e.ket||"",B.value=e.status==="Selesai"?"Selesai":"Pending",x.value="",s=null,p.classList.add("d-none"),g.src="";const t=e.installation_monitorings&&e.installation_monitorings.length>0?e.installation_monitorings[0]:null;t?(E.value=t.mac_address||"",_.value=t.sn_modem||"",I.value=t.actual_date||"",L.value=t.activation_date||"",t.photo_proof&&(s=t.photo_proof,g.src=s,p.classList.remove("d-none"))):(E.value="",_.value="",I.value=new Date().toISOString().split("T")[0],L.value=new Date().toISOString().split("T")[0]),u.show()}r&&r.addEventListener("click",async()=>{if(!a)return;const e=B.value,t=T.value;r.disabled=!0,r.innerHTML='<span class="spinner-border spinner-border-sm"></span> Menyimpan...';try{const{error:i}=await l.from("work_orders").update({status:e,ket:t||a.ket}).eq("id",a.id);if(i)throw i;const n={work_order_id:a.id,customer_id:a.customer_id,employee_id:a.employee_id,mac_address:E.value||null,sn_modem:_.value||null,actual_date:I.value||null,activation_date:L.value||null,photo_proof:s,notes:t,is_confirmed:!1},h=a.installation_monitorings&&a.installation_monitorings.length>0?a.installation_monitorings[0]:null;h&&(n.id=h.id);const{error:v}=await l.from("installation_monitorings").upsert(n,{onConflict:"work_order_id"});if(v)throw v;u.hide();const y=a.employee_id;await w(y)}catch(i){console.error("Update error:",i),alert("Gagal mengupdate status: "+i.message)}finally{r.disabled=!1,r.innerText="Simpan"}});function b(e){R.classList.remove("d-none"),q.innerText=e,o.innerHTML=""}function U(e){const t=e?e.toLowerCase():"";return t.includes("pending")||t.includes("antrian")?"warning":t.includes("selesai")?"success":t.includes("proses")?"info":t.includes("cancel")?"danger":"secondary"}});
