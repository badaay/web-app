import{s as I,A as Y}from"./config-CON8XM2G.js";/* empty css               *//* empty css              *//* empty css               */import{A as Z}from"./auth-service-PfjuabZR.js";import{s as E}from"./toast-D3E5iWRc.js";document.addEventListener("DOMContentLoaded",async()=>{const l=document.getElementById("psb-form-container");if(!l)return;const o=(t,s)=>{const e=document.getElementById(t);if(!e)return;const i=e.parentElement.querySelector(".custom-inline-error");i&&i.remove();const a=document.createElement("div");if(a.className="custom-inline-error mt-1 fw-bold shadow",a.style.background="#da3633",a.style.color="#fff",a.style.padding="6px 12px",a.style.borderRadius="6px",a.style.fontSize="0.8rem",a.style.position="absolute",a.style.zIndex="1050",a.style.animation="errorFadeIn 0.3s ease",a.innerHTML='<i class="bi bi-exclamation-circle-fill me-1"></i> '+s,e.parentElement.style.position="relative",e.tagName==="INPUT"||e.tagName==="TEXTAREA"){e.classList.add("is-invalid"),e.parentElement.insertBefore(a,e.nextSibling);const r=()=>{e.classList.remove("is-invalid"),a.parentNode&&a.remove()};e.addEventListener("input",r,{once:!0}),e.addEventListener("change",r,{once:!0}),e.focus()}else{a.style.left="50%",a.style.bottom="10%",a.style.transform="translate(-50%, 0)",e.appendChild(a);const r=()=>{a.parentNode&&a.remove()};e.addEventListener("click",r,{once:!0}),setTimeout(r,4e3),e.scrollIntoView({behavior:"smooth",block:"center"})}},p=()=>`
        <style>
            @keyframes errorFadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .package-card:hover {
                transform: translateY(-5px) !important;
                border-color: #58a6ff !important;
                box-shadow: 0 8px 24px rgba(88, 166, 255, 0.2) !important;
            }
            .package-card:hover .package-body {
                background-color: rgba(88, 166, 255, 0.05);
            }
        </style>
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
    `,n=()=>`
            <!-- ====== STEP 1: PILIH PAKET ====== -->
            <div id="step-1" class="step-section">

                        <div class="row g-3" id="package-cards-container">
                            <div class="col-12 text-center text-white-50 py-4"><div class="spinner-border spinner-border-sm me-2"></div> Memuat opsi paket...</div>
                        </div>
                        <input type="hidden" id="selected-package-name" required>
                        <input type="hidden" id="selected-package-price">
                        <input type="hidden" id="selected-package-speed">

                <div class="text-end">
                    <button type="button" class="btn btn-primary px-4 py-2 fw-bold transition-transform" id="btn-next-2">
                        Selanjutnya <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
    `,d=()=>`
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
                                    <button type="button" id="btn-get-location" class="btn btn-sm btn-dark border-secondary position-absolute" style="top: 315px; right: 5px; z-index: 1000;">
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
    `,q=()=>`
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
                                <div id="phone-duplicate-msg" class="small mt-1 d-none"></div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">No. HP Alternatif</label>
                                <input type="text" class="form-control bg-dark text-white border-secondary" id="adv-cust-alt-phone" placeholder="Keluarga / Kerabat (Opsional)">
                            </div>
                            <div class="col-12 mt-4">
                                <h6 class="text-white mb-3 border-bottom border-secondary pb-2">Dokumen Pendukung</h6>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Upload Foto Rumah <span class="text-danger">*</span></label>
                                <div class="photo-drop-zone" id="drop-zone-rumah" onclick="document.getElementById('adv-cust-foto-rumah').click()">
                                    <i class="bi bi-house-door fs-2 text-white-50 mb-2 d-block"></i>
                                    <span class="small text-white-50">Klik untuk upload foto rumah</span>
                                    <input type="file" id="adv-cust-foto-rumah" class="d-none" accept="image/*">
                                </div>
                                <div id="preview-rumah" class="mt-2 text-center" style="display:none;">
                                    <img src="" class="img-thumbnail bg-dark border-secondary mb-2" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px;">
                                    <button type="button" class="btn btn-sm btn-outline-danger w-100" id="btn-remove-rumah"><i class="bi bi-trash"></i> Hapus Foto Rumah</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-white-50 small">Upload Foto KTP <span class="text-danger">*</span></label>
                                <div class="photo-drop-zone" id="drop-zone-ktp" onclick="document.getElementById('adv-cust-foto-ktp').click()">
                                    <i class="bi bi-person-vcard fs-2 text-white-50 mb-2 d-block"></i>
                                    <span class="small text-white-50">Klik untuk upload foto KTP</span>
                                    <input type="file" id="adv-cust-foto-ktp" class="d-none" accept="image/*">
                                </div>
                                <div id="preview-ktp" class="mt-2 text-center" style="display:none;">
                                    <img src="" class="img-thumbnail bg-dark border-secondary mb-2" style="max-height: 200px; width: 100%; object-fit: cover; border-radius: 8px;">
                                    <button type="button" class="btn btn-sm btn-outline-danger w-100" id="btn-remove-ktp"><i class="bi bi-trash"></i> Hapus Foto KTP</button>
                                </div>
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
    `;l.innerHTML=p()+'<form id="add-psb-registration-form">'+n()+d()+q()+"</form>";const A=(t,s,e,i)=>{const a=document.getElementById(t),r=document.getElementById(s),v=document.getElementById(e),x=v.querySelector("img"),S=document.getElementById(i);a&&(a.addEventListener("change",function(P){const g=P.target.files[0];if(g){const f=new FileReader;f.onload=function(k){x.src=k.target.result,r.style.display="none",v.style.display="block"},f.readAsDataURL(g)}}),S.addEventListener("click",function(){a.value="",r.style.display="block",v.style.display="none",x.src=""}))};A("adv-cust-foto-rumah","drop-zone-rumah","preview-rumah","btn-remove-rumah"),A("adv-cust-foto-ktp","drop-zone-ktp","preview-ktp","btn-remove-ktp");const y=document.getElementById("adv-cust-phone"),u=document.getElementById("phone-duplicate-msg");y&&y.addEventListener("blur",async()=>{const t=y.value.trim();if(t.length<10)return;u.innerHTML='<span class="spinner-border spinner-border-sm"></span> Mengecek...',u.classList.remove("d-none","text-danger","text-success");const{data:s,error:e}=await I.from("customers").select("id").eq("phone",t).maybeSingle();s?(u.innerHTML='<i class="bi bi-exclamation-triangle-fill"></i> Nomor ini sudah terdaftar sebagai pelanggan.',u.classList.add("text-danger"),y.classList.add("is-invalid")):(u.innerHTML='<i class="bi bi-check-circle-fill"></i> Nomor tersedia.',u.classList.add("text-success"),y.classList.remove("is-invalid"))});let m,B;const z=[-7.15097,112.721245],N=[document.getElementById("step-1"),document.getElementById("step-2"),document.getElementById("step-3")],C=[document.getElementById("ind-step-1"),document.getElementById("ind-step-2"),document.getElementById("ind-step-3")],M=document.getElementById("step-loading");function K(t=500){return new Promise(s=>{N.forEach(e=>e.classList.add("d-none")),M.classList.remove("d-none"),setTimeout(()=>{M.classList.add("d-none"),s()},t)})}function _(t){C.forEach((s,e)=>{const i=s.querySelector(".step-num");e===t?(s.classList.remove("opacity-50"),i.classList.replace("bg-secondary","bg-primary"),i.classList.contains("bg-success")&&i.classList.replace("bg-success","bg-primary"),i.innerHTML=e+1):e<t?(s.classList.remove("opacity-50"),i.classList.contains("bg-secondary")&&i.classList.replace("bg-secondary","bg-success"),i.classList.contains("bg-primary")&&i.classList.replace("bg-primary","bg-success"),i.innerHTML='<i class="bi bi-check"></i>'):(s.classList.add("opacity-50"),i.classList.contains("bg-primary")&&i.classList.replace("bg-primary","bg-secondary"),i.classList.contains("bg-success")&&i.classList.replace("bg-success","bg-secondary"),i.innerHTML=e+1)})}async function O(t){if(await K(),N[t].classList.remove("d-none"),_(t),t===1){const s=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),e=L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}",{minZoom:0,maxZoom:20,attribution:'&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',ext:"jpg"}),i={Default:s,Terrains:e};m||(m=L.map("location-picker-map").addLayer(s).setView(z,13),L.control.layers(i).addTo(m),m.on("click",a=>D(a.latlng.lat,a.latlng.lng))),setTimeout(()=>m.invalidateSize(),200)}else if(t===2){const s=document.getElementById("summary-package-card");s.style.display="block",s.animate([{opacity:0,transform:"translateY(-10px)"},{opacity:1,transform:"translateY(0)"}],{duration:300,fill:"forwards"})}}function h(t,s,e){const i=document.getElementById(t);i&&(i.onclick=async()=>{e&&!e()||await O(s)})}h("btn-next-2",1,()=>document.getElementById("selected-package-name").value?!0:(o("package-cards-container","Silakan pilih paket internet terlebih dahulu."),!1)),h("btn-next-3",2,()=>{const t=document.getElementById("adv-cust-lat").value,s=document.getElementById("adv-cust-lng").value,e=document.getElementById("adv-cust-address").value.trim();let i=!0;return(!t||!s)&&(o("location-picker-map","Silakan pilih titik lokasi pemasangan di peta."),i=!1),e||(o("adv-cust-address","Silakan isi detail alamat pemasangan."),i=!1),i}),h("btn-back-1",0),h("btn-back-2",1);const R=document.getElementById("adv-cust-install-date");R&&(R.value=new Date().toISOString().split("T")[0]),await W();function D(t,s){document.getElementById("adv-cust-lat").value=t.toFixed(7),document.getElementById("adv-cust-lng").value=s.toFixed(7),B&&B.remove(),B=L.marker([t,s]).addTo(m),m.setView([t,s],16)}const c=document.getElementById("btn-get-location");c&&(c.onclick=()=>{if(!navigator.geolocation)return E("warning","Browser Anda tidak mendukung geolokasi.");c.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span> Mencari...',c.disabled=!0,navigator.geolocation.getCurrentPosition(t=>{D(t.coords.latitude,t.coords.longitude),c.innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya',c.disabled=!1},t=>{E("error","Gagal mendapatkan lokasi: "+t.message),c.innerHTML='<i class="bi bi-geo-alt-fill text-accent me-1"></i> Lokasi Saya',c.disabled=!1},{enableHighAccuracy:!0,timeout:1e4})});const b=document.getElementById("save-adv-customer-btn");b&&(b.onclick=async()=>{const t=document.getElementById("adv-cust-name").value.trim(),s=document.getElementById("adv-cust-phone").value.trim(),e=document.getElementById("adv-cust-foto-rumah").files[0],i=document.getElementById("adv-cust-foto-ktp").files[0];let a=!0;if(t||(o("adv-cust-name","Nama Lengkap wajib diisi."),a=!1),s||(o("adv-cust-phone","No. Handphone wajib diisi."),a=!1),e||(o("drop-zone-rumah","Foto Rumah wajib diunggah."),a=!1),i||(o("drop-zone-ktp","Foto KTP wajib diunggah."),a=!1),!a)return;const r=document.getElementById("selected-package-name").value,v=document.getElementById("adv-cust-address").value.trim(),x=document.getElementById("adv-cust-lat").value,S=document.getElementById("adv-cust-lng").value,P=null,g=document.getElementById("adv-cust-email").value.trim(),f=document.getElementById("adv-cust-alt-phone").value.trim();let k=v;(g||f)&&(k+=`
(Email: `+(g||"-")+" | HP Alt: "+(f||"-")+")"),b.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan Data...',b.disabled=!0;try{const{data:w}=await I.from("roles").select("id").eq("name","Customer").single(),F=w?w.id:null,V={name:t,address:k,phone:s,packet:r,install_date:P||null,lat:parseFloat(x),lng:parseFloat(S),role_id:F},$=g||`${s}@fatih.com`,G=Math.random().toString(36).slice(-12)+"Aa1!",{data:U,error:H}=await Z.registerCustomer($,G,V);if(H)throw H;const T=U.customer;if(T&&T.id){const{error:j}=await I.from("work_orders").insert([{customer_id:T.id,status:"waiting",source:"customer",title:"Pemasangan Baru (PSB)",registration_date:new Date().toISOString().split("T")[0],referral_name:"",ket:"Paket: "+r,created_at:new Date().toISOString()}]);j&&console.warn("Notice: Gagal membuat antrian PSB otomatis:",j.message)}E("success","Registrasi Pelanggan berhasil diselesaikan! Data masuk ke Antrian."),window.location.href=Y+"/?success=true"}catch(w){E("error","Gagal memproses pendaftaran: "+w.message),b.innerHTML='<i class="bi bi-check-circle-fill me-2"></i> Selesaikan Registrasi',b.disabled=!1}})});async function W(){const l=document.getElementById("package-cards-container"),{data:o,error:p}=await I.from("internet_packages").select("*").order("price",{ascending:!0});if(p||!o||o.length===0){l.innerHTML='<div class="col-12 text-center text-white-50 my-4">Belum ada paket tersedia di database.</div>';return}l.innerHTML=o.map(n=>`
        <div class="col-md-4 col-sm-6 mb-3">
            <div class="card bg-dark border border-secondary package-card h-100 shadow-sm transition-all" 
                 style="cursor: pointer; transition: all 0.2s;" 
                 onclick="window.selectPackage('${n.name}', '${n.speed||""}', '${n.price}', this)">
                <div class="card-body package-body text-center d-flex flex-column p-4" style="transition: all 0.2s;">
                    <div class="mb-3">
                        <i class="bi bi-wifi fs-1 text-primary opacity-75"></i>
                    </div>
                    <h4 class="card-title text-white fw-bold mb-1">${n.name}</h4>
                    <span class="badge bg-secondary text-white mx-auto mb-3 px-3 py-1 rounded-pill">${n.speed||"Up to..."}</span>
                    <p class="card-text small text-white-50 flex-grow-1">${n.description||"Pilihan tepat untuk kebutuhan internet Anda."}</p>
                    <hr class="border-secondary mb-3">
                    <h4 class="text-success mb-0 d-flex flex-column">
                        <span class="fs-6 text-white-50 fw-normal">Biaya / bulan</span>
                        <div class="mt-1">Rp ${Number(n.price).toLocaleString("id-ID")}</div>
                    </h4>
                </div>
            </div>
        </div>
    `).join("")}window.selectPackage=function(l,o,p,n){document.querySelectorAll(".package-card").forEach(d=>{d.classList.remove("border-primary","bg-primary","bg-opacity-10"),d.classList.add("border-secondary"),d.querySelector(".card-title").classList.remove("text-primary"),d.querySelector(".card-title").classList.add("text-white"),d.style.transform="scale(1)",d.style.boxShadow="none"}),n.classList.remove("border-secondary"),n.classList.add("border-primary","bg-primary","bg-opacity-10"),n.querySelector(".card-title").classList.remove("text-white"),n.querySelector(".card-title").classList.add("text-primary"),n.style.transform="scale(1.02)",n.style.boxShadow="0 0 15px rgba(13,110,253,0.3)",document.getElementById("selected-package-name").value=l,document.getElementById("selected-package-speed").value=o,document.getElementById("selected-package-price").value=p,document.getElementById("summary-pkg-name").textContent=l,document.getElementById("summary-pkg-speed").textContent=o||"Promo",document.getElementById("summary-pkg-price").textContent="Rp "+Number(p).toLocaleString("id-ID")};
