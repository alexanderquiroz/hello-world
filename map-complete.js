/* Mapa independiente de la tabla. Solo recibe datos autorizados del RPC. */
(() => {
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors={AMOV:'#dc4545',ENTEL:'#126bd4',INTEGRATEL:'#0e9c7b',VIETTEL:'#c29812'};
const names={AMOV:'Claro',ENTEL:'Entel',INTEGRATEL:'Integratel',VIETTEL:'Viettel / Bitel'};
const nf=(n,d=0)=>Number(n||0).toLocaleString('es-PE',{maximumFractionDigits:d});
let map=null,groups=null,allBounds=null,run=0;
function clear(message='Inicia sesión para consultar el mapa completo.') {
 run++;
 if(map){map.remove();map=null;}groups=null;allBounds=null;
 document.getElementById('map').innerHTML='<div class="map-placeholder">'+esc(message)+'</div>';
 document.getElementById('mapNote').textContent='';
 document.getElementById('mapCounters').replaceChildren();
 document.getElementById('mapLegend').replaceChildren();
 document.getElementById('map').dataset.loadedPoints='0';
 document.getElementById('map').dataset.loadedSegments='0';
 document.getElementById('map').dataset.geometryGroups='0';
}
function validate(data) {
 if(!data||!Array.isArray(data.puntos)||!Array.isArray(data.segmentos))throw new Error('El mapa no recibió un conjunto geográfico válido.');
 if(data.puntos.length!==Number(data.puntos_validos)||data.segmentos.length!==Number(data.segmentos_validos))throw new Error('La respuesta geográfica está incompleta. No se mostrará un mapa parcial.');
}
function valid(v,max){return v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Math.abs(Number(v))<=max;}
function groupSegments(rows) {
 const groups=new Map();
 for(const r of rows) {
  if(!valid(r[2],90)||!valid(r[3],180)||!valid(r[4],90)||!valid(r[5],180))throw new Error('Segmento con coordenadas no válidas en la respuesta.');
  const a=[Number(r[2]),Number(r[3])],b=[Number(r[4]),Number(r[5])];
  const key=[r[1]||'',JSON.stringify(a),JSON.stringify(b)].join('|');
  if(!groups.has(key))groups.set(key,{a,b,rows:[]});groups.get(key).rows.push(r);
 }
 return [...groups.values()];
}
function bounds(){if(map&&allBounds?.isValid())map.fitBounds(allBounds,{padding:[30,30],maxZoom:13});}
function resize(){if(map){map.invalidateSize({pan:false});}}
async function render(data) {
 validate(data);
 clear('Preparando todas las ubicaciones…');const token=run;
 const el=document.getElementById('map'),note=document.getElementById('mapNote');
 const counters=document.getElementById('mapCounters');
 if(!window.L){clear('No se cargó la biblioteca cartográfica. Recarga la página; los datos siguen disponibles en la tabla.');return;}
 const L=window.L;
 el.replaceChildren();
 map=L.map('map',{scrollWheelZoom:false,preferCanvas:true,maxZoom:19}).setView([-9.2,-75.1],5);
 const localMap=map;
 const tile=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 let tileWarning=false;
 tile.on('tileerror',()=>{if(token!==run||tileWarning)return;tileWarning=true;note.textContent+=' El fondo cartográfico no está cargando; comprueba la conexión. Las geometrías no se han eliminado.';});
 groups={points:L.featureGroup().addTo(map),roads:L.featureGroup().addTo(map)};
 allBounds=L.latLngBounds([]);
 const markerGroup=typeof L.markerClusterGroup==='function'?L.markerClusterGroup({animate:false,showCoverageOnHover:false,maxClusterRadius:38,spiderfyOnMaxZoom:true,chunkedLoading:false,iconCreateFunction:c=>L.divIcon({html:'<span>'+nf(c.getChildCount())+'</span>',className:'dgic-cluster',iconSize:[38,38]})}):L.featureGroup();
 groups.points.addLayer(markerGroup);
 const markers=[];const unique=new Set();const counts={};
 for(let i=0;i<data.puntos.length;i++) {
  if(token!==run)return;
  const r=data.puntos[i],lat=Number(r[2]),lon=Number(r[3]);
  if(!valid(r[2],90)||!valid(r[3],180))throw new Error('Punto no válido en la respuesta geográfica.');
  unique.add(lat+'|'+lon);allBounds.extend([lat,lon]);
  counts[r[1]||'SIN_VINCULO']=(counts[r[1]||'SIN_VINCULO']||0)+1;
  const replaced=r[6]==='REEMPLAZADA';const color=replaced?'#8867bc':colors[r[1]]||'#657a95';
  const popup=()=>'<strong>'+esc(r[4]||'Registro '+r[0])+'</strong><br>'+esc(names[r[1]]||'Sin vínculo a operador')+' · '+esc(r[5])+'<br>Registro: '+esc(r[0])+(replaced?'<br>Localidad original reemplazada, conservada en el histórico.':'');
  let marker;
  if(L.markerClusterGroup)marker=L.marker([lat,lon],{icon:L.divIcon({className:'dgic-point'+(replaced?' replaced':''),html:'<i style="background:'+color+'"></i>',iconSize:[14,14],iconAnchor:[7,7]}),keyboard:false});
  else marker=L.circleMarker([lat,lon],{radius:5,color,fillColor:color,fillOpacity:.85,weight:1});
  marker.bindPopup(popup);markers.push(marker);
  if(i%700===0&&i>0)await new Promise(requestAnimationFrame);
 }
 if(token!==run)return;
 // Añadir por lotes deja que el navegador responda al zoom y a los controles.
 for(let i=0;i<markers.length;i+=500){if(token!==run)return;if(markerGroup.addLayers)markerGroup.addLayers(markers.slice(i,i+500));else markers.slice(i,i+500).forEach(m=>markerGroup.addLayer(m));await new Promise(requestAnimationFrame);}
 const roadGroups=groupSegments(data.segmentos);
 for(const g of roadGroups) {
  if(token!==run)return;
  const r=g.rows[0],color=colors[r[1]]||'#526d99';allBounds.extend(g.a);allBounds.extend(g.b);
  const popup=()=>'<strong>'+esc(r[6]||'Tramo vial')+'</strong><br>'+esc(names[r[1]]||'Operador no informado')+'<br>'+g.rows.length+' segmento(s) con estos extremos.<br>IDs: '+esc(g.rows.map(x=>x[0]).join(', '))+'<br>Distancia fuente acumulada: '+nf(g.rows.reduce((a,x)=>a+Number(x[7]||0),0),4)+' km<br><em>Línea entre extremos registrados; no es el trazado vial medido.</em>';
  L.polyline([g.a,g.b],{color:'#fff',weight:8,opacity:.85,interactive:false}).addTo(groups.roads);
  L.polyline([g.a,g.b],{color,weight:4.5,opacity:.95}).bindPopup(popup).addTo(groups.roads);
  L.circleMarker(g.a,{radius:2.5,color,fillOpacity:1,weight:1}).addTo(groups.roads);
  L.circleMarker(g.b,{radius:2.5,color,fillOpacity:1,weight:1}).addTo(groups.roads);
 }
 if(token!==run)return;
 L.control.layers(null,{'Puntos de todos los registros filtrados':groups.points,'Segmentos viales filtrados':groups.roads},{collapsed:false}).addTo(map);
 const missing=Number(data.sin_coordenadas_puntos||0)+Number(data.sin_coordenadas_segmentos||0);
 counters.innerHTML='<span><strong>'+nf(data.puntos_validos)+'</strong> registros ubicados</span><span><strong>'+nf(data.segmentos_validos)+'</strong> segmentos</span><span><strong>'+nf(missing)+'</strong> sin coordenadas válidas</span>';
 document.getElementById('mapLegend').innerHTML=Object.entries(names).map(([code,label])=>'<span><i style="background:'+colors[code]+'"></i>'+label+'</span>').join('')+'<span><i style="background:#8867bc"></i>Localidad reemplazada</span>';
 note.textContent='Mapa de toda la selección, independiente de la página de la tabla. '+nf(unique.size)+' ubicaciones puntuales distintas. '+(data.puntos.length>unique.size?'Hay registros con la misma ubicación. ':'')+(L.markerClusterGroup&&data.puntos.length?'Pulsa los grupos numerados para desplegarlos. ':'')+(data.segmentos.length?nf(data.segmentos.length)+' segmentos en '+nf(roadGroups.length)+' trazos entre extremos; los coincidentes se agrupan, no se borran. Distancia fuente: '+nf(data.kilometros,4)+' km. No es la geometría exacta de la carretera.':'');
 if(!data.puntos.length&&!data.segmentos.length)note.textContent='No hay geometrías válidas para esta selección. Los registros sin coordenadas permanecen en la tabla.';
 el.dataset.loadedPoints=String(data.puntos.length);el.dataset.loadedSegments=String(data.segmentos.length);el.dataset.geometryGroups=String(roadGroups.length);
 map.invalidateSize({pan:false});bounds();setTimeout(()=>{if(map===localMap){resize();bounds();}},100);
}
window.DGIC_MAP=Object.freeze({clear,render,fit:bounds,resize,validate,groupSegments});
})();
