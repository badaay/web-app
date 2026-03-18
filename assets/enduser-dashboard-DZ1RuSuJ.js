import{s as l,A as k}from"./config-CON8XM2G.js";/* empty css               */import{i as L}from"./pwa-install-D8ZuVKTr.js";document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("main-content"),r=document.getElementById("user-name"),u=document.getElementById("customer-id"),v=document.getElementById("logout-btn");L();const o=new URLSearchParams(window.location.search),d=o.get("cid"),f=o.get("customer")==="true",{data:{session:p}}=await l.auth.getSession(),c=p?.user;console.log("User session:",c);let a=null;try{if(f&&d){console.log("Mock Login Mode active for code:",d);const{data:e,error:n}=await l.from("customers").select("*").or(`customer_code.eq."${d}",id.eq."${d}"`).maybeSingle();e?a=e:console.error("Customer not found for mock code")}else if(c){const{data:e,error:n}=await l.from("customers").select("*").eq("username",c.email).maybeSingle();if(e)a=e;else{const{data:i}=await l.from("customers").select("*").ilike("name",c.user_metadata.full_name||"").limit(1).maybeSingle();a=i}}a?(r.innerText=a.name,u.innerText=a.customer_code||"N/A"):r.innerText=c?.user_metadata.full_name||"Guest User"}catch(e){console.error("Error fetching customer profile:",e)}const m=document.querySelectorAll(".menu-item");m.forEach(e=>{e.addEventListener("click",n=>{n.preventDefault(),m.forEach(t=>t.classList.remove("active")),e.classList.add("active");const i=e.getAttribute("data-view");g(i)})}),v.addEventListener("click",async()=>{await l.auth.signOut(),window.location.href=k+"/enduser/login.html"});async function g(e){s.innerHTML='<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>',e==="home"?await b():e==="status"?await h():e==="paket"?await y():e==="billing"&&await w()}async function b(){s.innerHTML=`
            <div class="chat-bubble">
                <h6 class="fw-bold mb-2">Informasi Akun</h6>
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-person-circle fs-3 text-accent me-3"></i>
                    <div>
                        <div class="small text-muted">Nama Lengkap</div>
                        <div class="fw-medium">${a?.name||"User"}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-phone fs-3 text-accent me-3"></i>
                    <div>
                        <div class="small text-muted">Nomor Telepon</div>
                        <div class="fw-medium">${a?.phone||"-"}</div>
                    </div>
                </div>
            </div>

            <div class="chat-bubble" style="border-left-color: var(--vscode-warning)">
                <h6 class="fw-bold mb-2">Pemberitahuan</h6>
                <div id="notifications-list">
                    <p class="small text-muted mb-0"><i class="bi bi-info-circle me-1"></i> Tidak ada notifikasi baru hari ini.</p>
                </div>
            </div>

            <div class="chat-bubble" style="border-left-color: var(--vscode-success)">
                <h6 class="fw-bold mb-3">Countdown Pembayaran</h6>
                <div class="text-center">
                    <div class="countdown-timer mb-1" id="billing-countdown">-- : -- : --</div>
                    <div class="small text-muted">Hari sebelum jatuh tempo berikutnya</div>
                </div>
            </div>
        `,x()}async function h(){if(!a){s.innerHTML='<div class="chat-bubble">Data pelanggan tidak ditemukan.</div>';return}const{data:e,error:n}=await l.from("work_orders").select("*").eq("customer_id",a.id).order("created_at",{ascending:!1});if(n||!e||e.length===0){s.innerHTML=`
                <div class="chat-bubble">
                    <h6 class="fw-bold mb-2">Status Pemasangan</h6>
                    <p class="small text-muted mb-0">Anda belum memiliki antrian pemasangan aktif.</p>
                </div>
            `;return}let i='<h6 class="fw-bold px-3 mb-3">Lacak Status</h6>';e.forEach(t=>{i+=`
                <div class="chat-bubble">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="fw-bold">${t.title}</div>
                        <span class="badge-status bg-opacity-10 bg-primary text-primary">${t.status}</span>
                    </div>
                    <p class="small text-muted mb-3">${t.description||"Pemasangan internet baru."}</p>
                    <div class="steps-container small">
                        <div class="step mb-2 ${t.status==="Antrian"?"fw-bold text-accent":""}">
                            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem"></i> Pendaftaran Diterima
                        </div>
                        <div class="step mb-2 ${t.status==="Pending"?"fw-bold text-accent":""}">
                            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem"></i> Menunggu Teknisi
                        </div>
                        <div class="step mb-2 ${t.status==="Konfirmasi"?"fw-bold text-accent":""}">
                            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem"></i> Dalam Pengerjaan
                        </div>
                        <div class="step ${t.status==="Selesai"?"fw-bold text-success":""}">
                            <i class="bi bi-check-circle-fill me-2"></i> Selesai & Aktif
                        </div>
                    </div>
                </div>
            `}),s.innerHTML=i}async function y(){if(!a){s.innerHTML='<div class="chat-bubble">Data pelanggan tidak ditemukan.</div>';return}s.innerHTML=`
            <div class="chat-bubble">
                <div class="text-center mb-4">
                    <i class="bi bi-box-seam display-4 text-accent"></i>
                    <h5 class="fw-bold mt-2">Paket Langganan</h5>
                </div>
                <div class="p-3 bg-light rounded-4 mb-3">
                    <div class="small text-muted">Paket Aktif</div>
                    <div class="h4 fw-bold mb-0">${a.packet||"Belum Langganan"}</div>
                </div>
                <div class="card border-0 bg-primary bg-opacity-10 rounded-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="small">Kapasitas:</span>
                            <span class="fw-bold">Unlimited</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="small">Layanan:</span>
                            <span class="fw-bold">Fiber Optic</span>
                        </div>
                    </div>
                </div>
            </div>
        `}async function w(){if(!a){s.innerHTML='<div class="chat-bubble">Data pelanggan tidak ditemukan.</div>';return}s.innerHTML=`
            <div class="chat-bubble">
                <h6 class="fw-bold mb-3">Informasi Pembayaran</h6>
                <div class="d-flex justify-content-between mb-2 border-bottom pb-2">
                    <span class="text-muted">Siklus Penagihan</span>
                    <span class="fw-bold">Setiap Tanggal ${new Date(a.install_date||Date.now()).getDate()}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 border-bottom pb-2">
                    <span class="text-muted">Status Pembayaran</span>
                    <span class="badge bg-success">Lunas</span>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-muted">Tagihan Terakhir</span>
                    <span class="fw-bold">Rp 250.000</span>
                </div>
            </div>
            
            <div class="chat-bubble">
                <h6 class="fw-bold mb-2">Metode Pembayaran</h6>
                <p class="small text-muted">Hubungi admin untuk pembayaran via transfer Bank atau E-Wallet.</p>
                <button class="btn btn-outline-primary w-100 rounded-pill">Lihat Cara Bayar</button>
            </div>
        `}function x(){const e=document.getElementById("billing-countdown");if(!e)return;let n=25,i=14,t=32;e.innerText=`${n} Hari : ${i} Jam : ${t} Menit`}b()});
