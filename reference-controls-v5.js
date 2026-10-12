/* Expone la actualización original también cuando la cabecera se compacta. */
(() => {
  'use strict';
  const original = document.getElementById('refresh');
  const toolbar = document.querySelector('#mapCard .map-actions');
  if (!original || !toolbar || document.getElementById('referenceRefresh')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'referenceRefresh';
  button.className = 'link';
  button.title = 'Actualizar datos y mapa';
  button.setAttribute('aria-label', 'Actualizar datos y mapa');
  button.innerHTML = window.DGIC_UI?.icon('refresh') || 'Actualizar';
  button.addEventListener('click', () => original.click());
  toolbar.append(button);
})();
