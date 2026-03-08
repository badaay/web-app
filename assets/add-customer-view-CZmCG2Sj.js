import{s as o}from"./supabase-DlQAt1xf.js";async function r(){const n=document.getElementById("add-customer-view-container"),c=document.getElementById("back-to-customers-btn");c.onclick=()=>{window.switchAdminModule&&window.switchAdminModule("customers-content")},n.innerHTML=`
        <form id="add-customer-view-form" class="row g-3">
            <div class="col-md-7">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Nama Pelanggan</label>
                        <input type="text" class="form-control" id="adv-cust-name" placeholder="Nama Lengkap" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Kode Pelanggan</label>
                        <input type="text" class="form-control" id="adv-cust-code" placeholder="Contoh: 25094031501">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">NIK / KTP</label>
                        <input type="text" class="form-control" id="adv-cust-ktp" placeholder="16 Digit NIK">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">No. HP / WhatsApp</label>
                        <input type="text" class="form-control" id="adv-cust-phone" placeholder="08xxxxxxxxxx">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Paket Internet</label>
                        <select class="form-select" id="adv-cust-packet">
                            <option value="175K 20Mbps">175K 20Mbps</option>
                            <option value="200K 25Mbps">200K 25Mbps</option>
                            <option value="250K 30Mbps">250K 30Mbps</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Tanggal Pasang</label>
                        <input type="date" class="form-control" id="adv-cust-install-date">
                    </div>
                    <div class="col-12">
                        <label class="form-label text-white-50 small">Alamat Pemasangan</label>
                        <textarea class="form-control" id="adv-cust-address" rows="2" placeholder="Alamat lengkap lokasi pemasangan" required></textarea>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">Username PPPoE</label>
                        <input type="text" class="form-control" id="adv-cust-username" placeholder="user@prefix">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-white-50 small">MAC Address</label>
                        <input type="text" class="form-control" id="adv-cust-mac" placeholder="XX:XX:XX:XX:XX:XX">
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <label class="form-label text-white-50 small">Pilih Lokasi di Peta</label>
                <div id="location-picker-map" class="rounded border border-dark" style="height: 350px; background: #1e1e1e;"></div>
                <div class="row mt-2 g-2">
                    <div class="col">
                        <input type="number" step="any" class="form-control form-control-sm" id="adv-cust-lat" placeholder="Latitude" readonly>
                    </div>
                    <div class="col">
                        <input type="number" step="any" class="form-control form-control-sm" id="adv-cust-lng" placeholder="Longitude" readonly>
                    </div>
                </div>
                <p class="text-white-50 mt-1" style="font-size: 0.75rem;"><i class="bi bi-info-circle me-1"></i> Klik pada peta untuk menentukan koordinat lokasi pelanggan.</p>
            </div>
            <div class="col-12 mt-4 text-end">
                <hr class="border-secondary opacity-25">
                <button type="button" class="btn btn-primary px-5 py-2" id="save-adv-customer-btn">
                    <i class="bi bi-save me-2"></i> Simpan Data Pelanggan
                </button>
            </div>
        </form>
    `;let a,l;const i=[-7.15097,112.721245];setTimeout(()=>{a&&a.remove(),a=L.map("location-picker-map").setView(i,13),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a),a.on("click",e=>{const{lat:t,lng:s}=e.latlng;document.getElementById("adv-cust-lat").value=t,document.getElementById("adv-cust-lng").value=s,l&&l.remove(),l=L.marker([t,s]).addTo(a)})},500),document.getElementById("save-adv-customer-btn").onclick=async()=>{const e={name:document.getElementById("adv-cust-name").value,customer_code:document.getElementById("adv-cust-code").value,ktp:document.getElementById("adv-cust-ktp").value,phone:document.getElementById("adv-cust-phone").value,packet:document.getElementById("adv-cust-packet").value,install_date:document.getElementById("adv-cust-install-date").value,address:document.getElementById("adv-cust-address").value,username:document.getElementById("adv-cust-username").value,mac_address:document.getElementById("adv-cust-mac").value,lat:parseFloat(document.getElementById("adv-cust-lat").value)||null,lng:parseFloat(document.getElementById("adv-cust-lng").value)||null},{data:t}=await o.from("roles").select("id").eq("name","Customer").single();if(t&&(e.role_id=t.id),!e.name||!e.address)return alert("Nama dan Alamat wajib diisi.");if(!e.lat||!e.lng)return alert("Silakan pilih lokasi di peta terlebih dahulu.");const{data:s,error:d}=await o.from("customers").insert([e]);d?alert("Gagal menyimpan: "+d.message):(alert("Pelanggan berhasil ditambahkan!"),window.switchAdminModule&&window.switchAdminModule("customers-content"))}}export{r as initAddCustomerView};
