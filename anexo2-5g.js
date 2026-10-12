/* Módulo 5G Anexo 2. La asignación procede del maestro; no representa ejecución. */
(() => {
'use strict';
const SOURCE='3.5 GHz - 5G (Entidades)';
const types={EDUCATIVA:'Institución educativa',SALUD:'Establecimiento de salud',UNIVERSIDAD:'Universidad',DEPORTIVA:'Sede deportiva'};
const origins={CELDA_COMBINADA_G2_G9_MAESTRO:'Año indicado en el maestro',LEYENDA_COLOR_MAESTRO:'Leyenda de color del maestro',EXCEL_CONTRASTE:'Archivo por operador y año',SIN_ANIO_RESUELTO:'Sin año resuelto'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0).toLocaleString('es-PE');
let cache=null,active=false,generation=0;
function typeLabel(v){return types[v]||v||'Sin tipo informado';}
function originLabel(v){return origins[v]||v||'Sin origen informado';}
function setActive(value){active=!!value;generation++;document.body.classList.toggle('anexo2-5g-mode',active);const el=document.getElementById('anexo2Control');if(el)el.hidden=!active;}
function cardSpecs(data){
 const k=data.kpi,periods=data.periodos||[];
 const amount=code=>periods.filter(p=>p.periodo_codigo===code).reduce((a,p)=>a+Number(p.vigentes||0),0);
 return [['Entidades únicas',k.entidades,'Sin duplicar por operador','building'],['Compromisos operador–entidad',k.compromisos_vigentes,'Asignaciones registradas en el maestro','antenna'],['Año 1',amount('1'),'Asignaciones de la selección','calendar'],['Año 2',amount('2'),'Asignaciones de la selección','calendar'],['Sin periodo',amount('SIN_PERIODO'),'Pendiente de resolver con sustento','alert']];
}
function typeFromRow(row){const v=row.tipo_entidad||String(row.tipo_compromiso_codigo||'').replace(/^A2_5G_/,'');return typeLabel(v);}
async function enrich(db,rows,signal){
 const ids=rows.filter(r=>r.fuente===SOURCE).map(r=>r.compromiso_id);
 if(!ids.length)return rows;
 let q=db.rpc('dashboard_5g_ficha',{p_compromiso_ids:ids});if(signal)q=q.abortSignal(signal);
 const {data,error}=await q;if(error)throw new Error(error.message||'No se pudo leer la ficha 5G.');
 const byId=new Map((data||[]).map(r=>[String(r.compromiso_id),r]));
 if(byId.size!==new Set(ids.map(String)).size)throw new Error('La ficha 5G está incompleta; no se ha sustituido el detalle por datos de ejemplo.');
 return rows.map(r=>byId.has(String(r.compromiso_id))?{...r,...byId.get(String(r.compromiso_id))}:r);
}
function mount(){
 if(document.getElementById('anexo2Control'))return;
 const el=document.createElement('section');el.id='anexo2Control';el.className='card anexo2-control';el.hidden=true;
 document.getElementById('meta').insertAdjacentElement('afterend',el);
}
async function renderControl(db,session,onLogin,signal){
 mount();if(!active)return;const token=generation;const el=document.getElementById('anexo2Control');
 try{
  if(!cache){let q=db.rpc('dashboard_5g_control');if(signal)q=q.abortSignal(signal);const {data,error}=await q;if(error)throw error;cache=data;}
  if(!active||token!==generation)return;
  const c=cache;
  el.innerHTML=`<details><summary>Maestro y conciliación de fuentes <span class="anexo2-quality">${num(c.discrepancias)} diferencias por revisar</span></summary><div class="anexo2-control-body"><p><strong>Fuente principal:</strong> ${esc(c.maestro)}. Las marcas de este archivo determinan las asignaciones a los operadores.</p><p><strong>Archivo de contraste:</strong> ${esc(c.archivo_trabajado)}. Se usa para contrastar asignaciones y completar el año solo cuando coincide la entidad y el operador.</p><div class="anexo2-totals"><span>Universo maestro: <strong>${num(c.entidades)} entidades</strong></span><span>Maestro: <strong>${num(c.asignaciones_maestro)} asignaciones</strong></span><span>Contraste: <strong>${num(c.asignaciones_contraste)} asignaciones</strong></span><span>Sin año resuelto: <strong>${num(c.sin_anio)}</strong></span></div><p class="anexo2-caption">Estos controles corresponden al archivo completo; no cambian con los filtros. Las tarjetas superiores sí corresponden a la selección.</p><p>${(c.por_tipo||[]).map(t=>`${esc(typeLabel(t.tipo_entidad))}: ${num(t.entidades)}`).join(' · ')}</p><p>La tecnología es <strong>5G comprometida</strong>. Una marca «X» o el estado «ACTIVO» de un establecimiento no acredita instalación ni conformidad contractual.</p><button class="btn" id="anexo2Differences">${session?'Ver diferencias entre archivos':'Iniciar sesión para ver las diferencias'}</button><div id="anexo2DiffResult" aria-live="polite"></div></div></details>`;
  document.getElementById('anexo2Differences').onclick=async()=>{
   if(!session){onLogin();return;}
   const b=document.getElementById('anexo2Differences'),target=document.getElementById('anexo2DiffResult');b.disabled=true;
   try{
    const {data,error}=await db.rpc('dashboard_5g_discrepancias');if(error)throw error;
    if(!active||token!==generation)return;
    const labels={SOLO_MAESTRO:'Solo en el maestro: se conserva',SOLO_CONTRASTE:'Solo en el contraste: no se agrega'};
    target.innerHTML='<div class="table-wrap"><table><thead><tr><th>Operador</th><th>Tipo</th><th>Código</th><th>Entidad</th><th>Diferencia</th><th>Hoja maestro</th><th>Fila</th></tr></thead><tbody>'+(data||[]).map(r=>'<tr>'+[r.codigo_operador,typeLabel(r.tipo_entidad),r.codigo_entidad,r.entidad,labels[r.diferencia]||r.diferencia,r.hoja_maestro,r.fila_maestro].map(v=>'<td title="'+esc(v)+'">'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p class="anexo2-caption">No se cambian las asignaciones para forzar que ambos totales coincidan.</p>';
   }catch(e){if(active&&token===generation)target.textContent='No se pudieron consultar las diferencias: '+(e.message||'Error de conexión');}
   finally{b.disabled=false;}
  };
 }catch(e){if(active&&token===generation)el.textContent='El resumen se mantiene disponible. No se pudo cargar el control de fuentes: '+(e.message||'Error de conexión');}
}
function clearPrivate(){generation++;const el=document.getElementById('anexo2DiffResult');if(el)el.replaceChildren();}
window.DGIC_A2_5G=Object.freeze({SOURCE,setActive,cardSpecs,typeFromRow,typeLabel,originLabel,enrich,renderControl,clearPrivate,mount});
})();
