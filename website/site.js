const button = document.querySelector('.logo-switch');
const image = button.querySelector('img');
const status = document.querySelector('#logo-status');
const logos = {
  contour: { src: './assets/images/caia-contour.webp', next: 'hand' },
  hand: { src: './assets/images/caia-hand.webp', next: 'contour' },
};
// Local visual comparison only; no analytics or external storage.
function showLogo(name, announce = false) {
  const logo = logos[name] || logos.contour;
  button.dataset.logo = logos[name] ? name : 'contour';
  image.src = logo.src;
  button.setAttribute('aria-label', `Carolina AI Alignment. Switch to ${logo.next} logo`);
  if (announce) status.textContent = `${name === 'hand' ? 'Hand' : 'Contour'} logo selected.`;
}
try { showLogo(localStorage.getItem('caia-logo') || 'contour'); } catch { showLogo('contour'); }
const alternate = new Image();
alternate.src = logos[logos[button.dataset.logo].next].src;
button.addEventListener('click', () => {
  const next = logos[button.dataset.logo].next;
  showLogo(next, true);
  try { localStorage.setItem('caia-logo', next); } catch { /* Storage is optional. */ }
});
