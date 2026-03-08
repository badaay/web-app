import{s as B}from"./supabase-DlQAt1xf.js";async function D(){const f=document.getElementById("customer-map-view-container");if(!f)return;if(f.dataset.initialized==="true"){window._cmapReloadData&&window._cmapReloadData();return}f.dataset.initialized="true";let y=[],b=[],d=null,p=null,c=null;const g={Antrian:"#22c55e",Pending:"#f97316",Konfirmasi:"#3b82f6","ODP Penuh":"#a16207",Cancel:"#374151",Completed:"#6b7280",Selesai:"#6b7280","Tidak Ada Antrian":"#6b7280"},S={customer_code:"Kode Pelanggan",packet:"Paket Internet",phone:"No. HP",address:"Alamat",install_date:"Tanggal Pasang",username:"Username PPPoE",mac_address:"MAC Address",damping:"Redaman (dBm)",ktp:"NIK / KTP",wo_status:"Status Antrian PSB"};let l={customer_code:!0,packet:!0,phone:!0,address:!0,install_date:!1,username:!1,mac_address:!1,damping:!0,ktp:!1,wo_status:!0};const v={},h=["#3b82f6","#f97316","#a855f7","#22c55e","#ef4444","#eab308","#06b6d4","#ec4899","#14b8a6","#f43f5e"];let k=0;function w(e){return e?(v[e]||(v[e]=h[k%h.length],k++),v[e]):"#6b7280"}f.innerHTML=`
        <div id="cmap-wrapper" style="display:flex;height:calc(100vh - 130px);gap:0;border-radius:12px;overflow:hidden;border:1px solid var(--vscode-border);">

            <!-- ===== Sidebar ===== -->
            <div id="cmap-sidebar" style="width:290px;min-width:290px;background:var(--vscode-sidebar-bg);border-right:1px solid var(--vscode-border);display:flex;flex-direction:column;overflow:hidden;">

                <!-- Header -->
                <div style="padding:14px 16px;background:var(--vscode-header-bg);border-bottom:1px solid var(--vscode-border);">
                    <div style="font-weight:700;color:#fff;font-size:14px;"><i class="bi bi-sliders me-2 text-accent"></i>Kustomisasi MAP</div>
                    <div id="cmap-count" style="font-size:11px;color:var(--vscode-text);margin-top:2px;">Memuat data...</div>
                </div>

                <div style="flex:1;overflow-y:auto;padding:12px 14px;">

                    <!-- ── Warna Marker (TOP PRIORITY) ── -->
                    <div style="margin-bottom:14px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">🎨 Warna Marker</div>
                        <select id="cmap-color-mode" class="form-select form-select-sm">
                            <option value="antrian" selected>Status Antrian PSB</option>
                            <option value="packet">Paket Internet</option>
                            <option value="damping">Redaman Signal</option>
                            <option value="single">Satu Warna (Biru)</option>
                        </select>
                        <!-- Live legend mini -->
                        <div id="cmap-mini-legend" style="margin-top:10px;font-size:11px;"></div>
                    </div>

                    <hr style="border-color:var(--vscode-border);margin:10px 0;">

                    <!-- ── Filter ── -->
                    <div style="margin-bottom:14px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">🔍 Filter</div>

                        <div class="mb-2">
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Status Antrian PSB</label>
                            <select id="cmap-filter-antrian" class="form-select form-select-sm">
                                <option value="">Semua Status</option>
                                <option value="Antrian">Antrian</option>
                                <option value="Pending">Pending</option>
                                <option value="Konfirmasi">Konfirmasi</option>
                                <option value="ODP Penuh">ODP Penuh</option>
                                <option value="Cancel">Cancel</option>
                                <option value="Completed">Completed</option>
                                <option value="Tidak Ada Antrian">Tidak Ada Antrian</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Paket Internet</label>
                            <select id="cmap-filter-packet" class="form-select form-select-sm">
                                <option value="">Semua Paket</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Redaman Signal</label>
                            <select id="cmap-filter-damping" class="form-select form-select-sm">
                                <option value="all">Semua</option>
                                <option value="good">Normal (≥ -28 dBm)</option>
                                <option value="bad">Buruk (< -28 dBm)</option>
                            </select>
                        </div>

                        <div>
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Lokasi</label>
                            <select id="cmap-filter-coords" class="form-select form-select-sm">
                                <option value="1">Ada koordinat saja</option>
                                <option value="0">Semua pelanggan</option>
                            </select>
                        </div>
                    </div>

                    <hr style="border-color:var(--vscode-border);margin:10px 0;">

                    <!-- ── Tampilkan di Popup ── -->
                    <div style="margin-bottom:14px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">📋 Kolom Popup</div>
                        ${Object.entries(S).map(([e,i])=>`
                            <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer;font-size:12px;color:var(--vscode-text);">
                                <input type="checkbox" class="cmap-field-toggle" data-field="${e}" ${l[e]?"checked":""} style="cursor:pointer;">
                                ${e==="wo_status"?`<span style="color:#f97316;">${i}</span>`:i}
                            </label>
                        `).join("")}
                    </div>

                </div>

                <!-- Footer Buttons -->
                <div style="padding:12px 14px;border-top:1px solid var(--vscode-border);display:flex;flex-direction:column;gap:8px;">
                    <button id="cmap-fit-bounds-btn" class="btn btn-outline-info btn-sm w-100">
                        <i class="bi bi-bounding-box me-1"></i>Fit ke Semua Marker
                    </button>
                    <button id="cmap-apply-btn" class="btn btn-primary btn-sm w-100 d-none">
                        Terapkan
                    </button>
                </div>
            </div>

            <!-- ===== Map ===== -->
            <div style="flex:1;position:relative;">
                <div id="customer-map-full" style="height:100%;width:100%;"></div>
                <div id="cmap-stats-panel" style="position:absolute;top:10px;left:10px;z-index:999;background:rgba(15,15,15,0.88);backdrop-filter:blur(4px);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;border:1px solid #333;pointer-events:none;"></div>
            </div>
        </div>
    `,document.getElementById("cmap-apply-btn").onclick=()=>x(),document.getElementById("cmap-fit-bounds-btn").onclick=()=>{if(p&&d){const e=p.getBounds();e.isValid()&&d.fitBounds(e.pad(.12))}},["cmap-color-mode","cmap-filter-antrian","cmap-filter-packet","cmap-filter-damping","cmap-filter-coords"].forEach(e=>{document.getElementById(e)?.addEventListener("change",x)}),document.getElementById("cmap-wrapper").addEventListener("change",e=>{e.target.classList.contains("cmap-field-toggle")&&x()}),document.getElementById("cmap-color-mode").addEventListener("change",()=>{$()}),await _();async function _(){const e=document.getElementById("cmap-count");e&&(e.textContent="Memuat data...");const{data:i,error:a}=await B.from("customers").select("id, name, customer_code, packet, phone, address, install_date, username, mac_address, damping, ktp, lat, lng").order("name");if(a){f.innerHTML=`<div class="alert alert-danger">Gagal memuat pelanggan: ${a.message}</div>`;return}const{data:n,error:r}=await B.from("work_orders").select("customer_id, status, registration_date, created_at").order("created_at",{ascending:!1});r&&console.warn("Gagal memuat antrian:",r.message);const t={};(n||[]).forEach(s=>{t[s.customer_id]||(t[s.customer_id]=s)}),y=i.map(s=>({...s,wo_status:t[s.id]?.status||"Tidak Ada Antrian",wo_reg_date:t[s.id]?.registration_date||null}));const o=[...new Set(i.map(s=>s.packet).filter(Boolean))].sort(),m=document.getElementById("cmap-filter-packet");if(m){for(;m.options.length>1;)m.remove(1);o.forEach(s=>{const u=document.createElement("option");u.value=s,u.textContent=s,m.appendChild(u)})}window._cmapReloadData=_,$(),x()}function x(){const e=document.getElementById("cmap-filter-antrian")?.value||"",i=document.getElementById("cmap-filter-packet")?.value||"",a=document.getElementById("cmap-filter-damping")?.value||"all",n=document.getElementById("cmap-filter-coords")?.value==="1";document.querySelectorAll(".cmap-field-toggle").forEach(t=>{l[t.dataset.field]=t.checked}),b=y.filter(t=>{if(n&&(!t.lat||!t.lng))return!1;if(e){const o=t.wo_status;if(!(e==="Completed"&&(o==="Completed"||o==="Selesai"))){if(o!==e)return!1}}return!(i&&t.packet!==i||a==="good"&&t.damping&&parseFloat(t.damping)<-28||a==="bad"&&(!t.damping||parseFloat(t.damping)>=-28))});const r=document.getElementById("cmap-count");r&&(r.textContent=`${b.length} pelanggan ditampilkan`),z()}function P(e,i){switch(i){case"antrian":return g[e.wo_status]||"#6b7280";case"packet":return w(e.packet);case"damping":return e.damping?parseFloat(e.damping)>=-28?"#22c55e":"#ef4444":"#6b7280";default:return"#3b82f6"}}function T(e,i=""){const a="#fff",n=i?`<text x="12" y="15.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">${i}</text>`:"";return L.divIcon({className:"",html:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z"
                    fill="${e}" stroke="${a}" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="5.5" fill="white" opacity="0.9"/>
                ${n}
            </svg>`,iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}const E={Antrian:"A",Pending:"P",Konfirmasi:"K","ODP Penuh":"O",Cancel:"X",Completed:"✓",Selesai:"✓","Tidak Ada Antrian":"-"};function A(e,i){const a=P(e,i),n=e.lat?`https://www.google.com/maps?q=${e.lat},${e.lng}`:null,r=e.damping&&parseFloat(e.damping)<-28?"#ef4444":"#22c55e",t=g[e.wo_status]||"#6b7280",o=[];return l.wo_status&&o.push(["🚦","Status PSB",`<span style="background:${t};color:#fff;padding:1px 7px;border-radius:3px;font-size:11px;font-weight:600;">${e.wo_status}</span>`+(e.wo_reg_date?`<span style="color:#888;font-size:10px;margin-left:4px;">${e.wo_reg_date}</span>`:"")]),l.customer_code&&e.customer_code&&o.push(["🏷️","Kode",e.customer_code]),l.packet&&o.push(["📦","Paket",e.packet||"-"]),l.phone&&o.push(["📱","HP",e.phone||"-"]),l.address&&o.push(["🏠","Alamat",e.address||"-"]),l.install_date&&o.push(["📅","Pasang",e.install_date?new Date(e.install_date).toLocaleDateString("id-ID"):"-"]),l.username&&o.push(["💻","User",e.username||"-"]),l.mac_address&&o.push(["🔌","MAC",`<span style="font-family:monospace;font-size:11px;">${e.mac_address||"-"}</span>`]),l.damping&&o.push(["📶","Redaman",e.damping?`<span style="color:${r};font-weight:600;">${e.damping} dBm</span>`:"-"]),l.ktp&&o.push(["🪪","KTP",e.ktp||"-"]),`
            <div style="min-width:210px;font-family:sans-serif;">
                <div style="background:${a};color:#fff;padding:8px 12px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;">
                    <div style="font-weight:700;font-size:13px;">${e.name}</div>
                    ${l.customer_code?`<div style="font-size:10px;opacity:0.85;">${e.customer_code||""}</div>`:""}
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    ${o.map(([m,s,u])=>`
                        <tr>
                            <td style="color:#666;padding:2px 2px;white-space:nowrap;">${m} ${s}</td>
                            <td style="padding:2px 4px;">${u}</td>
                        </tr>`).join("")}
                </table>
                ${n?`<div style="margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;">
                    <a href="${n}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>`:""}
            </div>
        `}function z(){if(!document.getElementById("customer-map-full"))return;const e=document.getElementById("cmap-color-mode")?.value||"antrian";d?setTimeout(()=>d.invalidateSize(),150):(d=L.map("customer-map-full").setView([-6.2,106.8],10),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:""}).addTo(d)),p&&d.removeLayer(p),p=L.featureGroup();const i=b.filter(a=>a.lat&&a.lng);if(i.forEach(a=>{const n=P(a,e),r=e==="antrian"?E[a.wo_status]||"?":"",t=L.marker([a.lat,a.lng],{icon:T(n,r)}).bindPopup(A(a,e),{maxWidth:300});p.addLayer(t)}),p.addTo(d),i.length>0){const a=p.getBounds();a.isValid()&&d.fitBounds(a.pad(.12))}C(e,i),I(i,e)}function $(){const e=document.getElementById("cmap-mini-legend");if(!e)return;const i=document.getElementById("cmap-color-mode")?.value||"antrian";i==="antrian"?e.innerHTML=Object.entries(g).filter(([a])=>a!=="Selesai").map(([a,n])=>`
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:11px;height:11px;border-radius:50%;background:${n};display:inline-block;border:1px solid rgba(255,255,255,0.3);flex-shrink:0;"></span>
                        <span style="color:var(--vscode-text);">${a}</span>
                    </div>`).join(""):i==="damping"?e.innerHTML=`
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="width:11px;height:11px;border-radius:50%;background:#22c55e;display:inline-block;border:1px solid rgba(255,255,255,0.3);"></span><span style="color:var(--vscode-text);">Normal (≥ -28 dBm)</span></div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="width:11px;height:11px;border-radius:50%;background:#ef4444;display:inline-block;border:1px solid rgba(255,255,255,0.3);"></span><span style="color:var(--vscode-text);">Buruk (< -28 dBm)</span></div>
                <div style="display:flex;align-items:center;gap:6px;"><span style="width:11px;height:11px;border-radius:50%;background:#6b7280;display:inline-block;border:1px solid rgba(255,255,255,0.3);"></span><span style="color:var(--vscode-text);">Tidak Diketahui</span></div>`:e.innerHTML=""}function C(e,i){c&&(c.remove(),c=null),d&&(c=L.control({position:"bottomright"}),c.onAdd=()=>{const a=L.DomUtil.create("div");if(a.style.cssText="background:rgba(15,15,15,0.9);backdrop-filter:blur(4px);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;border:1px solid #333;max-width:190px;",e==="antrian"){const n=Object.entries(g).filter(([t])=>t!=="Selesai"),r={};i.forEach(t=>{r[t.wo_status]=(r[t.wo_status]||0)+1}),a.innerHTML='<div style="font-weight:700;margin-bottom:7px;border-bottom:1px solid #444;padding-bottom:5px;font-size:12px;">📊 Status Antrian PSB</div>'+n.map(([t,o])=>`
                        <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
                            <span style="width:12px;height:12px;border-radius:50%;background:${o};display:inline-block;border:1px solid rgba(255,255,255,0.4);flex-shrink:0;"></span>
                            <span style="flex:1;">${t}</span>
                            <span style="opacity:0.7;font-size:11px;">${r[t]||0}</span>
                        </div>`).join("")}else if(e==="damping")a.innerHTML=`<div style="font-weight:700;margin-bottom:7px;border-bottom:1px solid #444;padding-bottom:5px;">📶 Redaman Signal</div>
                    <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><span style="width:12px;height:12px;border-radius:50%;background:#22c55e;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Normal (≥ -28 dBm)</div>
                    <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><span style="width:12px;height:12px;border-radius:50%;background:#ef4444;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Buruk (< -28 dBm)</div>
                    <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:50%;background:#6b7280;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Tidak Diketahui</div>`;else if(e==="packet"){const n=[...new Set(i.map(r=>r.packet).filter(Boolean))];a.innerHTML='<div style="font-weight:700;margin-bottom:7px;border-bottom:1px solid #444;padding-bottom:5px;">📦 Paket Internet</div>'+n.map(r=>`
                        <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
                            <span style="width:12px;height:12px;border-radius:50%;background:${w(r)};display:inline-block;border:1px solid rgba(255,255,255,0.4);flex-shrink:0;"></span>
                            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r}</span>
                        </div>`).join("")+'<div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:50%;background:#6b7280;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Tidak ada paket</div>'}else a.innerHTML='<div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:50%;background:#3b82f6;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Pelanggan</div>';return a},c.addTo(d))}function I(e,i){const a=document.getElementById("cmap-stats-panel");if(a)if(i==="antrian"){const n={};e.forEach(t=>{n[t.wo_status]=(n[t.wo_status]||0)+1});const r=Object.entries(g).filter(([t])=>t!=="Selesai"&&n[t]).map(([t,o])=>`<span style="color:${o};">● ${t}: ${n[t]||0}</span>`).join('<span style="color:#555;margin:0 4px;">|</span>');a.innerHTML=`
                <div style="font-weight:600;margin-bottom:5px;color:#fff;font-size:13px;">${e.length} Titik di Peta</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;">${r}</div>`}else if(i==="damping"){const n=e.filter(o=>o.damping&&parseFloat(o.damping)<-28).length,r=e.filter(o=>o.damping&&parseFloat(o.damping)>=-28).length,t=e.filter(o=>!o.damping).length;a.innerHTML=`
                <div style="font-weight:600;margin-bottom:5px;color:#fff;font-size:13px;">${e.length} Titik di Peta</div>
                <div style="display:flex;gap:10px;font-size:11px;">
                    <span style="color:#22c55e;">● ${r} Normal</span>
                    <span style="color:#ef4444;">● ${n} Buruk</span>
                    <span style="color:#6b7280;">● ${t} N/A</span>
                </div>`}else a.innerHTML=`<div style="font-weight:600;color:#fff;">${e.length} Titik di Peta</div>`}}export{D as initCustomerMapView};
