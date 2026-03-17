import{s as c}from"./config-CON8XM2G.js";import{s as l}from"./toast-D3E5iWRc.js";async function w(e,t=""){const o=document.getElementById(e);if(o)try{const{data:a,error:n}=await c.from("internet_packages").select("name").order("name");if(n)throw n;let s='<option value="">Pilih Paket...</option>';a.forEach(i=>{const r=i.name===t?"selected":"";s+=`<option value="${i.name}" ${r}>${i.name}</option>`}),o.innerHTML=s}catch(a){console.error("Error fetching packages:",a)}}function h(e,t){return!e||!t?"":`https://www.google.com/maps/search/?api=1&query=${e},${t}`}function p(e="#3b82f6",t=""){const o=t?`<text x="12" y="15.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">${t}</text>`:"";return L.divIcon({className:"",html:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z"
                fill="${e}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5.5" fill="white" opacity="0.9"/>
            ${o}
        </svg>`,iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36]})}function u(e,t,o="Lokasi",a=""){if(!e||!t)return l("warning","Koordinat tidak valid.");const n=document.getElementById("mapModal");if(!n)return;new bootstrap.Modal(n).show();const i=n.querySelector(".modal-title");i&&(i.innerHTML=`<i class="bi bi-geo-alt me-2 text-info"></i>${o}`),setTimeout(()=>{window.adminModalMap&&(window.adminModalMap.remove(),window.adminModalMap=null);const r=L.map("admin-map").setView([e,t],16);window.adminModalMap=r,L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(r);const d=L.marker([e,t],{icon:p("#3b82f6")}).addTo(r);a&&d.bindPopup(a,{maxWidth:280}).openPopup()},300)}function g(e="Memuat data..."){return`
        <div class="d-flex align-items-center justify-content-center p-5">
            <div class="spinner-border text-primary me-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="text-white-50">${e}</span>
        </div>
    `}export{h as a,g,w as p,u as s};
