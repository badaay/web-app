import{_ as c}from"./admin-Bqyhn_VI.js";import"./auth-service-PfjuabZR.js";import"./config-CON8XM2G.js";import"./toast-D3E5iWRc.js";async function b(){const t=document.getElementById("role-feature");t&&(t.innerHTML=`
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
    `,document.getElementById("quick-add-customer-btn").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"add-customer-view-content"}))},document.getElementById("quick-wo-btn").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"work-orders-content"}))},document.getElementById("quick-map-btn").onclick=()=>{document.dispatchEvent(new CustomEvent("navigate",{detail:"customer-map-view-content"}))},l())}async function l(){try{const{supabase:t}=await c(async()=>{const{supabase:d}=await import("./config-CON8XM2G.js").then(o=>o.b);return{supabase:d}},[]),[e,a,i,s]=await Promise.all([t.from("customers").select("*",{count:"exact",head:!0}),t.from("work_orders").select("*",{count:"exact",head:!0}).neq("status","closed"),t.from("employees").select("*",{count:"exact",head:!0}).eq("status","Aktif"),t.from("internet_packages").select("*",{count:"exact",head:!0})]);document.getElementById("stat-total-customers").innerText=e.count||0,document.getElementById("stat-active-wo").innerText=a.count||0,document.getElementById("stat-total-employees").innerText=i.count||0,document.getElementById("stat-total-packages").innerText=s.count||0}catch(t){console.error("Dashboard stats error:",t)}}export{b as initDashboard};
