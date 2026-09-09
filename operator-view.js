/* Vista por operador: identidad visual y selección sin datos simulados. */
(() => {
'use strict';
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brands = [
 {code:'AMOV',name:'Claro',mark:'Claro',className:'claro'},
 {code:'ENTEL',name:'Entel',mark:'entel',className:'entel'},
 {code:'INTEGRATEL',name:'Integratel',mark:'integratel',className:'integratel'},
 {code:'VIETTEL',name:'Viettel / Bitel',mark:'bitel',className:'bitel'}
];
function mark(b,small=false) {return `<span class="operator-mark ${b.className} ${small?'small':''}" aria-hidden="true">${b.mark}</span>`;}
function cards(container,codes,master,{unlinked=false,onChange,onAll,onNone}={}) {
 const known=new Set(master.map(o=>o.valor_codigo));
 container.innerHTML=brands.map(b=>{
 const selected=codes===null||codes.includes(b.code);
 return `<label class="operator-card ${b.className} ${selected?'selected':''}"><input type="checkbox" data-operator-code="${b.code}" ${selected?'checked':''} ${known.has(b.code)?'':'disabled'}><span>${mark(b)}</span><span class="operator-card-copy"><strong>${b.name}</strong><small>${selected?'Seleccionado':'Seleccionar'}</small></span></label>`;
 }).join('');
 container.onchange=e=>{if(e.target.dataset.operatorCode)onChange(e.target.dataset.operatorCode,e.target.checked);};
 const actions=document.getElementById('operatorSelectionActions');
 actions.innerHTML='<button class="link" data-operator-all>Seleccionar todos</button><button class="link" data-operator-none>Quitar selección</button>'+(unlinked?`<label><input type="checkbox" data-unlinked ${codes===null||codes.includes('SIN_VINCULO')?'checked':''}>Incluir reportes sin vínculo a operador</label>`:'');
 actions.onclick=e=>{if(e.target.closest('[data-operator-all]'))onAll();if(e.target.closest('[data-operator-none]'))onNone();};
 actions.onchange=e=>{if(e.target.hasAttribute('data-unlinked'))onChange('SIN_VINCULO',e.target.checked);};
}
function selectedNames(codes) {return codes===null?'Todos los operadores':brands.filter(b=>codes.includes(b.code)).map(b=>b.name).concat(codes.includes('SIN_VINCULO')?['Sin vínculo']:[]).join(' + ')||'Sin operador seleccionado';}
function banner(container,codes,{source,count,historical,c4=false,updated='—'}) {
 const sel=brands.filter(b=>codes!==null&&codes.includes(b.code));
 const single=sel.length===1&&codes.length===1;
 container.innerHTML=`<div class="operator-banner-identity">${single?mark(sel[0]):'<span class="operator-mark multiple" aria-hidden="true">'+window.DGIC_UI.icon('users')+'</span>'}<div><div class="operator-banner-title"><h2>${esc(selectedNames(codes))}</h2><span class="operator-tag">${single?'Operador seleccionado':'Selección múltiple'}</span></div><p>${esc(source==='ALL'?'Todas las fuentes contractuales; C4 se consulta por separado.':source)}</p></div></div><div class="operator-banner-metrics"><div><small>${c4?'Registros C4':'Compromisos vigentes'}</small><strong>${count==null?'—':Number(count).toLocaleString('es-PE')}</strong><span>${historical==null?'':Number(historical).toLocaleString('es-PE')+' registros históricos'}</span></div><div><small>Datos preparados</small><time id="operatorSnapshot">${esc(updated)}</time></div></div>`;
}
window.DGIC_OPERATOR=Object.freeze({brands,cards,banner,selectedNames});
})();
