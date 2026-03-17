const b=[];let d=!1;const c={success:{bgClass:"bg-success",icon:"bi-check-circle-fill",title:"Sukses"},error:{bgClass:"bg-danger",icon:"bi-x-circle-fill",title:"Error"},warning:{bgClass:"bg-warning text-dark",icon:"bi-exclamation-triangle-fill",title:"Peringatan"},info:{bgClass:"bg-info text-dark",icon:"bi-info-circle-fill",title:"Informasi"}},g={"top-right":{top:"0",right:"0",bottom:"auto",left:"auto"},"top-left":{top:"0",right:"auto",bottom:"auto",left:"0"},"bottom-right":{top:"auto",right:"0",bottom:"0",left:"auto"},"bottom-left":{top:"auto",right:"auto",bottom:"0",left:"0"},center:{top:"50%",right:"50%",bottom:"auto",left:"50%",transform:"translate(-50%, -50%)"}};function f(i="top-right"){let e=document.getElementById(`toast-container-${i}`);if(!e){e=document.createElement("div"),e.id=`toast-container-${i}`,e.className="toast-container position-fixed p-3",e.style.zIndex="9999";const a=g[i]||g["top-right"];Object.assign(e.style,a),document.body.appendChild(e)}return e}function p(){if(d||b.length===0)return;d=!0;const i=b.shift(),{type:e,message:a,options:t,callback:l}=i,n=f(t.placement),s=c[e]||c.info,o=document.createElement("div"),r=t.customClass?` ${t.customClass}`:"";o.className=`toast align-items-center text-white ${s.bgClass} border-0 shadow-lg${r}`,o.setAttribute("role","alert"),o.setAttribute("aria-live",t.ariaLive||"assertive"),o.setAttribute("aria-atomic","true"),o.dataset.bsDelay=t.duration;const u=t.customIcon||s.icon,m=t.customTitle||s.title;o.innerHTML=`
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${u} fs-5 me-2"></i>
                <div>
                    <strong class="d-block">${m}</strong>
                    ${a}
                </div>
            </div>
            ${t.dismissible?'<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>':""}
        </div>
    `,n.appendChild(o),new bootstrap.Toast(o,{delay:t.duration}).show(),o.addEventListener("hidden.bs.toast",()=>{o.remove(),l&&l(),d=!1,p()})}function v(i,e,a){const t={duration:5e3,placement:"top-right",dismissible:!0,customClass:"",customIcon:null,customTitle:null,ariaLive:"assertive",callback:null,queue:!0,...a};if(t.queue)b.push({type:i,message:e,options:t,callback:t.callback}),p();else{const l=f(t.placement),n=c[i]||c.info,s=document.createElement("div"),o=t.customClass?` ${t.customClass}`:"";s.className=`toast align-items-center text-white ${n.bgClass} border-0 shadow-lg${o}`,s.setAttribute("role","alert"),s.setAttribute("aria-live",t.ariaLive),s.setAttribute("aria-atomic","true"),s.dataset.bsDelay=t.duration;const r=t.customIcon||n.icon,u=t.customTitle||n.title;s.innerHTML=`
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi ${r} fs-5 me-2"></i>
                    <div>
                        <strong class="d-block">${u}</strong>
                        ${e}
                    </div>
                </div>
                ${t.dismissible?'<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>':""}
            </div>
        `,l.appendChild(s),new bootstrap.Toast(s,{delay:t.duration}).show(),s.addEventListener("hidden.bs.toast",()=>{s.remove(),t.callback&&t.callback()})}}export{v as s};
