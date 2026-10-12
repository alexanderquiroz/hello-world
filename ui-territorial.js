/* Vista territorial 4.0: reorganiza los nodos existentes; no consulta ni modifica datos. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (window.DGIC_TERRITORIAL) return;
  const grid = document.querySelector('.visual-grid');
  const mapCard = $('mapCard');
  const stateCard = document.querySelector('.state-card');
  const operatorCard = $('operatorCard');
  const periodCard = document.querySelector('.operator-period-card');
  const departmentCard = document.querySelector('.operator-department-card');
  const sidebar = document.querySelector('.sidebar');
  if (!grid || !mapCard || !stateCard || !operatorCard || !periodCard || !departmentCard || !sidebar) return;

  const icon = name => window.DGIC_UI?.icon(name) || '';
  const element = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (id, text, symbol, action) => {
    const b = element('button', 'link'); b.id = id; b.type = 'button';
    b.innerHTML = icon(symbol); b.append(element('span', '', text));
    b.addEventListener('click', action); return b;
  };
  const chartCard = (id, title, description) => {
    const c = element('article', 'card'); c.id = id;
    const head = element('div', 'card-head');
    head.append(element('h3', '', title), element('p', '', description));
    const body = element('div', 'bar-chart');
    c.append(head, body); return c;
  };

  // El mapa se coloca primero también en el DOM, para navegación por teclado.
  const rail = element('aside', 'territorial-rail');
  rail.setAttribute('aria-label', 'Resumen de la selección');
  const projectDepartments = chartCard('territorialProjectDepartments', 'Departamentos (Top 5)', 'Resultados de la selección actual.');
  projectDepartments.classList.add('territorial-project-departments');
  rail.append(stateCard, departmentCard, projectDepartments);
  const more = element('details', 'territorial-more'); more.id = 'territorialMoreCharts';
  const summary = element('summary', '', 'Más gráficos: operadores y año contractual');
  const secondary = element('div', 'territorial-secondary');
  const projectPeriods = chartCard('territorialProjectPeriods', 'Por periodo contractual', 'Periodos registrados, no años calendario.');
  projectPeriods.classList.add('territorial-project-periods');
  secondary.append(operatorCard, periodCard, projectPeriods); more.append(summary, secondary);
  grid.replaceChildren(mapCard, rail); grid.after(more);

  // Réplicas de presentación de gráficos agregados. No contienen fichas privadas.
  function mirror(sourceId, target, top) {
    const source = $(sourceId); if (!source) return;
    let rows = [...source.querySelectorAll('.bar-row')];
    if (top) rows.sort((a, b) => parseFloat(b.querySelector('.bar-fill')?.style.width || '0') - parseFloat(a.querySelector('.bar-fill')?.style.width || '0'));
    const nodes = (rows.length ? rows.slice(0, top || rows.length) : [...source.children]).map(node => {
      const copy = node.cloneNode(true);
      copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      return copy;
    });
    target.querySelector('.bar-chart').replaceChildren(...nodes);
  }
  function refreshCharts() {
    mirror('departmentChart', projectDepartments, 5);
    mirror('periodChart', projectPeriods);
    const source = document.querySelector('.project-tab.active')?.dataset.source;
    projectDepartments.querySelector('h3').textContent = source === '3.5 GHz-Km' ? 'Kilómetros por departamento (Top 5)' : source === 'PLANTA REPORTADA_C4' ? 'Reportes C4 por departamento (Top 5)' : 'Compromisos vigentes por departamento (Top 5)';
    departmentCard.querySelector('h3').textContent = source === 'PLANTA REPORTADA_C4' ? 'Reportes C4 por departamento (Top 5)' : 'Compromisos vigentes por departamento (Top 5)';
  }
  ['departmentChart', 'periodChart', 'projectTabs'].forEach(id => {
    if ($(id)) new MutationObserver(refreshCharts).observe($(id), {childList: true});
  });

  // Los controles nuevos actúan sobre la presentación, no sobre la selección SQL.
  const legendToggle = button('territorialLegendToggle', 'Leyenda', 'info', () => {
    const hidden = mapCard.classList.toggle('territorial-legend-hidden');
    legendToggle.setAttribute('aria-expanded', String(!hidden));
  });
  legendToggle.setAttribute('aria-controls', 'mapLegend'); legendToggle.setAttribute('aria-expanded', 'true');
  mapCard.querySelector('.map-actions').prepend(legendToggle);
  const gotoMap = button('territorialGotoMap', 'Vista mapa', 'map', () => {
    mapCard.scrollIntoView({behavior: motion(), block: 'start'});
  });
  gotoMap.className = 'btn'; document.querySelector('.exports')?.append(gotoMap);
  function motion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }

  // Recalcular el lienzo de Leaflet cuando cambia el espacio, sin volver a consultar.
  let frame = 0;
  function resizeMap() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if ($('map')?.getBoundingClientRect().width) window.DGIC_MAP?.resize();
    });
  }
  if ('ResizeObserver' in window) new ResizeObserver(resizeMap).observe($('map'));
  else window.addEventListener('resize', resizeMap, {passive: true});
  more.addEventListener('toggle', resizeMap);

  // Cuenta lo marcado sin reinterpretar «Ninguno» como «Todos».
  function decorateFilters() {
    document.querySelectorAll('#filters .filter-group').forEach(group => {
      const head = group.querySelector('summary');
      if (!head) return;
      const options = [...group.querySelectorAll('input[data-option]')];
      const selected = options.filter(input => input.checked).length;
      let count = head.querySelector('.filter-count');
      if (!count) { count = element('span', 'filter-count'); head.append(count); }
      const badge = !options.length ? 'Sin opciones' : selected === options.length ? `Todos (${selected})` : !selected ? 'Ninguno' : `${selected} de ${options.length}`;
      count.dataset.label = badge; count.setAttribute('aria-label', badge);
      count.classList.toggle('partial', selected < options.length);
    });
  }
  new MutationObserver(decorateFilters).observe($('filters'), {childList: true});

  sidebar.id ||= 'territorialFilters';
  const filterToggle = button('territorialFilterToggle', 'Mostrar filtros', 'filter', () => setFilters(!document.body.classList.contains('territorial-filters-open')));
  filterToggle.className = 'btn'; filterToggle.setAttribute('aria-controls', sidebar.id); filterToggle.setAttribute('aria-expanded', 'false');
  sidebar.before(filterToggle);
  function setFilters(open) {
    document.body.classList.toggle('territorial-filters-open', open);
    filterToggle.setAttribute('aria-expanded', String(open));
    filterToggle.querySelector('span:last-child').textContent = open ? 'Ocultar filtros' : 'Mostrar filtros';
  }
  $('applyFilters').addEventListener('click', () => {
    if (window.matchMedia('(max-width:1000px)').matches) setFilters(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('territorial-filters-open') && !$('loginDialog')?.open && !$('recordDialog')?.open) {
      setFilters(false); filterToggle.focus();
    }
  });
  document.body.classList.add('territorial-ready');
  refreshCharts(); decorateFilters(); resizeMap();
  window.DGIC_TERRITORIAL = Object.freeze({version: '4.0', resize: resizeMap});
})();
