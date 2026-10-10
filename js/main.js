const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menú');
}));
document.querySelector('#year').textContent = new Date().getFullYear();
const prayerForm = document.querySelector('#prayer-form');
prayerForm?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(prayerForm);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();
  const subject = encodeURIComponent('Petición de oración — VIRTUOSAS');
  const body = encodeURIComponent(
    (name ? 'Nombre: ' + name + '\n' : '') +
    'Correo: ' + email + '\n\nPetición de oración:\n' + message
  );
  document.querySelector('#form-status').textContent = 'Se abrirá tu aplicación de correo para que revises y envíes tu petición.';
  window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
});