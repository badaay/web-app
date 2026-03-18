const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CbE94ypO.js","assets/config-CON8XM2G.js","assets/toast-D3E5iWRc.js","assets/ui-common-hIOATXsD.js","assets/utils-CJqnORQj.js"])))=>i.map(i=>d[i]);
import{_ as i}from"./admin-BMQzeMRj.js";import"./auth-service-PfjuabZR.js";import"./config-CON8XM2G.js";import"./toast-D3E5iWRc.js";async function k(){const e=document.getElementById("role-feature");e&&(e.innerHTML=`
        <div class="container-fluid py-4">
            <div class="row g-4">
                <div class="col-12">
                    <div class="card bg-vscode border-0 shadow-sm p-4 text-white overflow-hidden" style="border-radius: 15px;">
                        <div class="d-flex align-items-center position-relative" style="z-index: 2;">
                            <div>
                                <h2 class="fw-bold mb-2">Selamat Datang di Portal Admin SiFatih</h2>
                                <p class="text-white-50 mb-0">Kelola operasional, pelanggan, dan antrian dalam satu tempat.</p>
                            </div>
                            <div class="ms-auto d-none d-md-block">
                                <i class="bi bi-speedometer2 text-accent opacity-25" style="font-size: 8rem; margin-right: -2rem;"></i>
                            </div>
                        </div>
                        <div class="position-absolute top-0 end-0 p-4 opacity-10" style="z-index: 1;">
                            <i class="bi bi-shield-lock-fill" style="font-size: 15rem; margin-top: -5rem; margin-right: -3rem;"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-4">
                    <div class="card bg-vscode border-0 h-100 shadow-sm hover-scale transition-300 pointer-cursor" 
                         id="quick-add-customer-btn" 
                         style="border-radius: 12px; border-left: 4px solid var(--accent-color) !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="rounded-3 bg-accent bg-opacity-10 p-3 me-3">
                                <i class="bi bi-person-plus-fill text-accent fs-3"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-white">Daftar Pelanggan Baru</h5>
                                <p class="text-white-50 small mb-0">Klik untuk langsung membuka form registrasi pelanggan.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-4">
                    <div class="card bg-vscode border-0 h-100 shadow-sm hover-scale transition-300 pointer-cursor" 
                         id="quick-wo-btn"
                         style="border-radius: 12px; border-left: 4px solid #ffca28 !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="rounded-3 bg-warning bg-opacity-10 p-3 me-3">
                                <i class="bi bi-file-earmark-plus text-warning fs-3"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-white">Buat Antrian Baru</h5>
                                <p class="text-white-50 small mb-0">Kelola Work Order dan instalasi pemasangan baru.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-4">
                    <div class="card bg-vscode border-0 h-100 shadow-sm hover-scale transition-300 pointer-cursor" 
                         id="quick-map-btn"
                         style="border-radius: 12px; border-left: 4px solid #29b6f6 !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="rounded-3 bg-info bg-opacity-10 p-3 me-3">
                                <i class="bi bi-pin-map text-info fs-3"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-1 text-white">Pantau Lokasi</h5>
                                <p class="text-white-50 small mb-0">Lihat persebaran pelanggan di peta interaktif.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mt-2">
                <div class="col-12">
                    <h5 class="text-white-50 mb-3 px-1 fw-bold" style="letter-spacing: 1px; font-size: 0.8rem;">RINGKASAN SISTEM</h5>
                    <div class="row g-3">
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Total Pelanggan</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-total-customers">-</div>
                            </div>
                         </div>
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Antrian Aktif</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-active-wo">-</div>
                            </div>
                         </div>
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Karyawan Aktif</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-total-employees">-</div>
                            </div>
                         </div>
                         <div class="col-6 col-sm-3">
                            <div class="card bg-vscode border-secondary border-opacity-25 p-3 text-center">
                                <div class="text-white-50 small mb-1">Paket Layanan</div>
                                <div class="h4 fw-bold text-white mb-0" id="stat-total-packages">-</div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `,document.getElementById("quick-add-customer-btn").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"add-customer-view-content"}))},document.getElementById("quick-wo-btn").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"work-orders-content"}))},document.getElementById("quick-map-btn").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"customer-map-view-content"}))},g(),w())}async function g(){try{const{supabase:e}=await i(async()=>{const{supabase:n}=await import("./config-CON8XM2G.js").then(c=>c.b);return{supabase:n}},[]),[m,a,d,o]=await Promise.all([e.from("customers").select("*",{count:"exact",head:!0}),e.from("work_orders").select("*",{count:"exact",head:!0}).neq("status","closed"),e.from("employees").select("*",{count:"exact",head:!0}).eq("status","Aktif"),e.from("internet_packages").select("*",{count:"exact",head:!0})]);document.getElementById("stat-total-customers").innerText=m.count||0,document.getElementById("stat-active-wo").innerText=a.count||0,document.getElementById("stat-total-employees").innerText=d.count||0,document.getElementById("stat-total-packages").innerText=o.count||0}catch(e){console.error("Dashboard stats error:",e)}}async function w(){const e=document.querySelector(".container-fluid.py-4");if(!e)return;e.insertAdjacentHTML("beforeend",`
        <div class="row g-4 mt-2">
            <div class="col-12">
                <div id="today-queue-widget">
                    <div class="d-flex justify-content-between align-items-center mb-3 px-1">
                         <h5 class="text-white-50 fw-bold" style="letter-spacing: 1px; font-size: 0.8rem;">ANTRIAN AKTIF HARI INI</h5>
                         <button class="btn btn-link btn-sm text-white-50" id="view-all-wo-link">Lihat Semua →</button>
                    </div>
                    <div class="card bg-vscode border-secondary border-opacity-25">
                        <div class="card-body p-2" id="today-queue-list" style="max-height: 320px; overflow-y: auto;">
                            <div class="text-center p-5">
                                <div class="spinner-border text-white-50" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2 text-white-50">Memuat antrian...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `),document.getElementById("view-all-wo-link").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"work-orders-content"}))};const a=document.getElementById("today-queue-list"),{supabase:d}=await i(async()=>{const{supabase:t}=await import("./config-CON8XM2G.js").then(s=>s.b);return{supabase:t}},[]),{getStatusColor:o,getStatusDisplayText:n}=await i(async()=>{const{getStatusColor:t,getStatusDisplayText:s}=await import("./utils-CJqnORQj.js");return{getStatusColor:t,getStatusDisplayText:s}},[]),c=new Date().toISOString().split("T")[0],{data:v,error:u}=await d.from("work_orders").select("*, customers(name, phone), employees(name), master_queue_types(name, color, icon)").or(`registration_date.eq.${c},status.in.(confirmed,open)`).order("created_at",{ascending:!1}).limit(20);if(u){a.innerHTML=`<div class="p-3 text-danger">Error: ${u.message}</div>`;return}if(v.length===0){a.innerHTML=`
            <div class="text-center p-5">
                <i class="bi bi-check2-circle fs-1 text-success"></i>
                <p class="mt-2 text-white-50">Tidak ada antrian aktif untuk hari ini. Santai!</p>
            </div>
        `;return}a.innerHTML=v.map(t=>{const s=t.master_queue_types,r=t.customers,l=t.employees,p=o(t.status),b=n(t.status);return`
            <div class="list-group-item list-group-item-action bg-transparent text-white border-bottom border-secondary border-opacity-25 p-3">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <span class="badge rounded-pill me-3" style="background-color:${s?.color||"#6b7280"}; padding: 0.5em 0.7em;">
                            <i class="bi ${s?.icon||"bi-ticket-detailed"}"></i>
                        </span>
                        <div>
                            <h6 class="mb-0 fw-bold">${r?.name||"N/A"}</h6>
                            <small class="text-white-50">${r?.phone||""} &middot; ${s?.name||"Tiket"}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center text-nowrap">
                        <div class="text-end me-3 d-none d-sm-block">
                            <span class="badge" style="background-color:${p}; color:#fff;">${b}</span>
                            <br>
                            <small class="text-white-50">${l?.name||"Belum ditugaskan"}</small>
                        </div>
                        ${t.status==="waiting"?`
                            <button class="btn btn-sm btn-success dashboard-confirm-wo" data-wo-id="${t.id}" title="Konfirmasi & Tugaskan">
                                Konfirmasi
                            </button>
                        `:""}
                    </div>
                </div>
            </div>
        `}).join(""),a.querySelectorAll(".dashboard-confirm-wo").forEach(t=>{t.onclick=async()=>{const s=t.dataset.woId,{initWorkOrders:r}=await i(async()=>{const{initWorkOrders:l}=await import("./index-CbE94ypO.js");return{initWorkOrders:l}},__vite__mapDeps([0,1,2,3,4]));document.dispatchEvent(new CustomEvent("request-wo-confirmation",{detail:{woId:s}}))}})}export{k as initDashboard};
