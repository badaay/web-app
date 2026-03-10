import{s as b}from"./supabase-BeOTOPRS.js";/* empty css               *//* empty css              *//* empty css               */document.addEventListener("DOMContentLoaded",async()=>{const l=document.getElementById("psb-form-container");if(!l)return;l.innerHTML=`
        <div class="row mb-4">
            <div class="col-12 text-center">
                <h3 class="text-white mb-2"><i class="bi bi-person-plus text-primary me-2"></i>Registrasi Pelanggan</h3>
                <p class="text-white-50">Lengkapi form di bawah untuk mendaftar layanan Pemasangan Baru.</p>
            </div>
        </div>

        <!-- STEPPER INDICATORS -->
        <div class="d-flex mb-4 justify-content-center flex-wrap gap-2 gap-md-4">
            <div class="step-indicator active d-flex align-items-center" id="ind-step-1">
                <div class="step-num bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">1</div>
                <span class="small fw-bold text-white">Pilih Paket</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-2">
                <div class="step-num bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">2</div>
                <span class="small fw-bold text-white">Lokasi</span>
            </div>
            <div class="step-indicator opacity-50 d-flex align-items-center" id="ind-step-3">
                <div class="step-num bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">3</div>
                <span class="small fw-bold text-white">Biodata</span>
            </div>
        </div>

        <!-- LOADING OVERLAY -->
        <div id="step-loading" class="d-none text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="text-white-50 mt-3">Sedang memproses...</p>
        </div>

        <form id="add-psb-registration-form">
            <!-- ====== STEP 1: PILIH PAKET ====== -->
            <div id="step-1" class="step-section">
                <div class="card bg-vscode border-secondary mb-4 shadow-sm">
                    <div class="card-header border-secondary bg-dark bg-opacity-50 pt-3 pb-2">
                        <h5 class="mb-0 text-white"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">1</span> Pilih Paket</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3" id="package-cards-container">
                            <div class="col-12 text-center text-white-50 py-4"><div class="spinner-border spinner-border-sm me-2"></div> Memuat opsi paket...</div>
                        </div>
                        <input type="hidden" id="selected-package-name" required>
                        <input type="hidden" id="selected-package-price">
                        <input type="hidden" id="selected-package-speed">
                    </div>
                </div>
                <div class="text-end">
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform" id="btn-next-2">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>

            <!-- ====== STEP 2: LOKASI PEMASANGAN ====== -->
            <div id="step-2" class="step-section d-none">
                <div class="card bg-vscode border-secondary mb-4 shadow-sm">
                    <div class="card-header border-secondary bg-dark bg-opacity-50 pt-3 pb-2">
                        <h5 class="mb-0 text-white"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">2</span> Instalasi / Lokasi Pemasangan</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-4 d-flex align-items-stretch">
                            <div class="col-md-7">
                                <label class="form-label text-white-50 small mb-2">Pilih Titik Lokasi di Peta</label>
                                <div class="position-relative">
                                    <div id="location-picker-map" class="rounded border border-secondary shadow-sm" style="height: 350px; background: #1e1e1e; z-index: 1;"></div>
                                    <button type="button" id="btn-get-location" class="btn btn-sm btn-dark border-secondary position-absolute" style="top: 10px; right: 10px; z-index: 1000;">
                                        <i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya
                                    </button>
                                </div>
                                <p class="text-white-50 mt-2 mb-0" style="font-size: 0.75rem;"><i class="bi bi-info-circle me-1"></i> Klik pada peta untuk menentukan koordinat pasti lokasi pemasangan.</p>
                                
                                <!-- HIDDEN LAT LONG -->
                                <div class="d-none">
                                    <input type="number" step="any" id="adv-cust-lat" required>
                                    <input type="number" step="any" id="adv-cust-lng" required>
                                </div>
                            </div>
                            <div class="col-md-5 d-flex flex-column bg-dark bg-opacity-25 p-3 rounded border border-secondary">
                                <div class="mb-3 flex-grow-1">
                                    <label class="form-label text-white fw-medium small mb-2">Detail Alamat Pemasangan</label>
                                    <textarea class="form-control bg-dark text-white border-secondary h-100" id="adv-cust-address" style="min-height: 120px;" placeholder="Tuliskan alamat lengkap... (Nama Jalan, Blok, No Rumah, RT/RW, Patokan)" required></textarea>
                                </div>
                                <div class="mt-2">
                                    <label class="form-label text-white-50 small">Rencana Tanggal Pasang</label>
                                    <input type="date" class="form-control bg-dark text-white border-secondary" id="adv-cust-install-date">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-outline-secondary px-4 py-2" id="btn-back-1">
                        <i class="bi bi-arrow-left me-2"></i> Kembali
                    </button>
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform" id="btn-next-3">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>

            <!-- ====== STEP 3: BIODATA DIRI ====== -->
            <div id="step-3" class="step-section d-none">
                <div class="card bg-vscode border-secondary mb-4 shadow-sm">
                    <div class="card-header border-secondary bg-dark bg-opacity-50 pt-3 pb-2">
                        <h5 class="mb-0 text-white"><span class="badge bg-primary rounded-circle me-2 px-2 py-1">3</span> Biodata Diri</h5>
                    </div>
                    <div class="card-body">
                        <!-- Selected Package Summary Card -->
                        <div class="card bg-gradient border-primary mb-4 shadow" id="summary-package-card" style="display:none; background: linear-gradient(145deg, rgba(13,110,253,0.1) 0%, rgba(0,0,0,0) 100%);">
                            <div class="card-body py-3 px-4">
                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <span class="text-white-50 small d-block mb-1">Paket yang dipilih:</span>
                                        <h5 class="text-white mb-0 d-inline-block" id="summary-pkg-name">-</h5>
                                        <span class="badge bg-info text-dark ms-2 align-bottom" id="summary-pkg-speed">-</span>
                                    </div>
                                    <div class="text-end">
                                        <span class="text-white-50 small d-block mb-1">Estimasi Biaya</span>
                                        <h4 class="text-success mb-0" id="summary-pkg-price">-</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Nama Lengkap</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-name" placeholder="Sesuai KTP" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Email</label>
                                <input type="email" class="form-control bg-dark text-white border-secondary" id="adv-cust-email" placeholder="email@contoh.com">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">No. Handphone / WhatsApp</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-phone" placeholder="08xxxxxxxxxx" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">No. HP Alternatif</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-alt-phone" placeholder="Keluarga / Kerabat (Opsional)">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-between flex-wrap gap-3 mt-4">
                    <button type="button" class="btn btn-outline-secondary px-4 py-2" id="btn-back-2">
                        <i class="bi bi-arrow-left me-2"></i> Kembali
                    </button>
                    <button type="button" class="btn btn-success btn-lg px-5 py-2 fw-bold shadow-sm transition-transform" id="save-adv-customer-btn">
                        <i class="bi bi-check-circle-fill me-2"></i> Selesaikan Registrasi
                    </button>
                </div>
            </div>
        </form>
    `;let i,r;const s=[-7.15097,112.721245],d=[document.getElementById("step-1"),document.getElementById("step-2"),document.getElementById("step-3")],B=[document.getElementById("ind-step-1"),document.getElementById("ind-step-2"),document.getElementById("ind-step-3")],g=document.getElementById("step-loading");function I(e=500){return new Promise(t=>{d.forEach(n=>n.classList.add("d-none")),g.classList.remove("d-none"),setTimeout(()=>{g.classList.add("d-none"),t()},e)})}function S(e){B.forEach((t,n)=>{const a=t.querySelector(".step-num");n===e?(t.classList.remove("opacity-50"),a.classList.replace("bg-secondary","bg-primary"),a.classList.contains("bg-success")&&a.classList.replace("bg-success","bg-primary"),a.innerHTML=n+1):n<e?(t.classList.remove("opacity-50"),a.classList.contains("bg-secondary")&&a.classList.replace("bg-secondary","bg-success"),a.classList.contains("bg-primary")&&a.classList.replace("bg-primary","bg-success"),a.innerHTML='<i class="bi bi-check"></i>'):(t.classList.add("opacity-50"),a.classList.contains("bg-primary")&&a.classList.replace("bg-primary","bg-secondary"),a.classList.contains("bg-success")&&a.classList.replace("bg-success","bg-secondary"),a.innerHTML=n+1)})}async function P(e){if(await I(),d[e].classList.remove("d-none"),S(e),e===1)i||(i=L.map("location-picker-map").setView(s,13),L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(i),i.on("click",t=>v(t.latlng.lat,t.latlng.lng))),setTimeout(()=>i.invalidateSize(),200);else if(e===2){const t=document.getElementById("summary-package-card");t.style.display="block",t.animate([{opacity:0,transform:"translateY(-10px)"},{opacity:1,transform:"translateY(0)"}],{duration:300,fill:"forwards"})}}function m(e,t,n){const a=document.getElementById(e);a&&(a.onclick=async()=>{n&&!n()||await P(t)})}m("btn-next-2",1,()=>document.getElementById("selected-package-name").value?!0:(alert("Silakan pilih paket internet terlebih dahulu."),!1)),m("btn-next-3",2,()=>{const e=document.getElementById("adv-cust-lat").value,t=document.getElementById("adv-cust-lng").value,n=document.getElementById("adv-cust-address").value.trim();return!e||!t?(alert("Silakan pilih titik lokasi pemasangan di peta."),!1):n?!0:(alert("Silakan isi detail alamat pemasangan."),!1)}),m("btn-back-1",0),m("btn-back-2",1);const y=document.getElementById("adv-cust-install-date");y&&(y.value=new Date().toISOString().split("T")[0]),await M();function v(e,t){document.getElementById("adv-cust-lat").value=e.toFixed(7),document.getElementById("adv-cust-lng").value=t.toFixed(7),r&&r.remove(),r=L.marker([e,t]).addTo(i),i.setView([e,t],16)}const c=document.getElementById("btn-get-location");c&&(c.onclick=()=>{if(!navigator.geolocation)return alert("Browser Anda tidak mendukung geolokasi.");c.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span> Mencari...',c.disabled=!0,navigator.geolocation.getCurrentPosition(e=>{v(e.coords.latitude,e.coords.longitude),c.innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya',c.disabled=!1},e=>{alert("Gagal mendapatkan lokasi: "+e.message),c.innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya',c.disabled=!1},{enableHighAccuracy:!0,timeout:1e4})});const o=document.getElementById("save-adv-customer-btn");o&&(o.onclick=async()=>{const e=document.getElementById("adv-cust-name").value.trim(),t=document.getElementById("adv-cust-phone").value.trim();if(!e||!t)return alert("Mohon lengkapi Nama Lengkap dan No. Handphone/WhatsApp.");const n=document.getElementById("selected-package-name").value,a=document.getElementById("adv-cust-address").value.trim(),T=document.getElementById("adv-cust-lat").value,A=document.getElementById("adv-cust-lng").value,h=document.getElementById("adv-cust-install-date").value,f=document.getElementById("adv-cust-email").value.trim(),x=document.getElementById("adv-cust-alt-phone").value.trim();let k=a;(f||x)&&(k+=`
(Email: `+(f||"-")+" | HP Alt: "+(x||"-")+")"),o.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan Data...',o.disabled=!0;try{const{data:p}=await b.from("roles").select("id").eq("name","Customer").single(),D=p?p.id:null,{data:u,error:w}=await b.from("customers").insert([{name:e,address:k,phone:t,packet:n,install_date:h||null,lat:parseFloat(T),lng:parseFloat(A),role_id:D}]).select().single();if(w)throw w;if(u&&u.id){const{error:E}=await b.from("work_orders").insert([{customer_id:u.id,status:"Antrian",title:"Pemasangan Baru (PSB)",registration_date:h||new Date().toISOString(),referral_name:"",ket:"Paket: "+n,created_at:new Date().toISOString()}]);E&&console.warn("Notice: Gagal membuat antrian PSB otomatis:",E.message)}alert("Registrasi Pelanggan berhasil diselesaikan! Data masuk ke Antrian."),window.location.href="/?success=true"}catch(p){alert("Gagal memproses pendaftaran: "+p.message),o.innerHTML='<i class="bi bi-check-circle-fill me-2"></i> Selesaikan Registrasi',o.disabled=!1}})});async function M(){const l=document.getElementById("package-cards-container"),{data:i,error:r}=await b.from("internet_packages").select("*").order("price",{ascending:!0});if(r||!i||i.length===0){l.innerHTML='<div class="col-12 text-center text-white-50 my-4">Belum ada paket tersedia di database.</div>';return}l.innerHTML=i.map(s=>`
        <div class="col-md-4 col-sm-6 mb-3">
            <div class="card bg-dark border border-secondary package-card h-100 shadow-sm transition-all" 
                 style="cursor: pointer; transition: all 0.2s;" 
                 onclick="window.selectPackage('${s.name}', '${s.speed||""}', '${s.price}', this)">
                <div class="card-body text-center d-flex flex-column p-4">
                    <div class="mb-3">
                        <i class="bi bi-wifi fs-1 text-primary opacity-75"></i>
                    </div>
                    <h4 class="card-title text-white fw-bold mb-1">${s.name}</h4>
                    <span class="badge bg-secondary text-white mx-auto mb-3 px-3 py-1 rounded-pill">${s.speed||"Up to..."}</span>
                    <p class="card-text small text-white-50 flex-grow-1">${s.description||"Pilihan tepat untuk kebutuhan internet Anda."}</p>
                    <hr class="border-secondary mb-3">
                    <h4 class="text-success mb-0 d-flex flex-column">
                        <span class="fs-6 text-white-50 fw-normal">Biaya / bulan</span>
                        <div class="mt-1">Rp ${Number(s.price).toLocaleString("id-ID")}</div>
                    </h4>
                </div>
            </div>
        </div>
    `).join("")}window.selectPackage=function(l,i,r,s){document.querySelectorAll(".package-card").forEach(d=>{d.classList.remove("border-primary","bg-primary","bg-opacity-10"),d.classList.add("border-secondary"),d.querySelector(".card-title").classList.remove("text-primary"),d.querySelector(".card-title").classList.add("text-white"),d.style.transform="scale(1)",d.style.boxShadow="none"}),s.classList.remove("border-secondary"),s.classList.add("border-primary","bg-primary","bg-opacity-10"),s.querySelector(".card-title").classList.remove("text-white"),s.querySelector(".card-title").classList.add("text-primary"),s.style.transform="scale(1.02)",s.style.boxShadow="0 0 15px rgba(13,110,253,0.3)",document.getElementById("selected-package-name").value=l,document.getElementById("selected-package-speed").value=i,document.getElementById("selected-package-price").value=r,document.getElementById("summary-pkg-name").textContent=l,document.getElementById("summary-pkg-speed").textContent=i||"Promo",document.getElementById("summary-pkg-price").textContent="Rp "+Number(r).toLocaleString("id-ID")};
