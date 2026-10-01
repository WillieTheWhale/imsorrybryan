"""Original SVG print icons and the footer's converging thread study."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2] / 'website' / 'assets'
icons = {
 'misaligned-goals': '<circle cx="34" cy="39" r="23" fill="none" stroke="white" stroke-width="7"/><circle cx="34" cy="39" r="10" fill="none" stroke="white" stroke-width="5"/><path d="M31 41 58 14m-16 1 16-1-1 16" fill="none" stroke="white" stroke-width="6"/>',
 'loss-of-control': '<path d="M36 37 17 16m19 21 22-20M36 37 13 54m23-17 25 20" fill="none" stroke="white" stroke-width="5"/><g fill="white"><circle cx="36" cy="37" r="11"/><circle cx="16" cy="15" r="8"/><circle cx="58" cy="16" r="8"/><circle cx="13" cy="55" r="8"/><circle cx="60" cy="57" r="8"/></g>',
 'bioweapons': '<g fill="none" stroke="white"><path d="M21 8c0 22 30 34 30 56M51 8c0 22-30 34-30 56" stroke-width="7"/><path d="M22 12h28M26 22h20M30 32h12M30 42h12M25 52h22M22 61h28" stroke-width="3"/></g>',
 'cyberattacks': '<path d="m36 8 23 9v22c0 12-14 23-23 27C27 62 13 51 13 39V17Z" fill="white"/><g fill="none" stroke="#172b3a" stroke-width="4"><path d="M35 24v12h14M24 30v16h13v10"/><circle cx="35" cy="23" r="3"/><circle cx="50" cy="36" r="3"/></g>',
 'concentrated-power': '<path d="M11 62h50V50H47V37H39V26h-7v11h-8v13H11Z" fill="white"/><circle cx="35.5" cy="16" r="9" fill="white"/><path d="m9 31 13 5m41-5-13 5M9 14h10m34 0h10" fill="none" stroke="white" stroke-width="3"/>',
 'disempowerment': '<g fill="white"><circle cx="23" cy="18" r="9"/><path d="M10 59V40c0-15 26-15 26 0v19Z"/><path d="M42 10h19v8H42zm0 15h16v8H42zm0 15h12v8H42zm0 15h8v8h-8Z"/></g>',
}
for name, body in icons.items():
 svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none">\n'
 svg += '<defs><pattern id="ruling" width="72" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H72" stroke="white" stroke-width="1.15"/></pattern><pattern id="ink" width="72" height="4" patternUnits="userSpaceOnUse"><path d="M0 3H72" stroke="#172b3a" stroke-width=".65"/></pattern></defs>\n'
 svg += '<path fill="#172b3a" d="M0 0h72v72H0z"/><path fill="url(#ruling)" d="M0 0h72v72H0z"/>'
 svg += body + '<path fill="url(#ink)" d="M0 0h72v72H0z"/></svg>\n'
 (ROOT/'icons'/f'{name}.svg').write_text(svg)
# An original favicon built from the same contour vocabulary, not a replacement logo.
(ROOT/'icons'/'contour.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="5" fill="white"/><g stroke="#172b3a" stroke-width="2"><path d="M3 25C1 16 9 1 16 3s10 9 13 19-11 9-26 3Z"/><path d="M8 23C5 17 11 7 16 8s8 8 9 14-9 5-17 1Z"/><path d="M12 21c-2-3 1-9 4-9s6 6 5 9-6 3-9 0Z"/></g><path d="m4 28 12-11 12-6" stroke="#4b9cd3" stroke-width="2"/><circle cx="16" cy="17" r="3" fill="#4b9cd3"/></svg>')
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" fill="none">\n'
# A family of paths forms a woven figure and then resolves into parallel lines.
for i in range(36):
 y = 19 + i*5.6
 end = 72+i*2.9
 swing = (i-17.5)*2.6
 d = f'M -30 {y:.2f} C 115 {y:.2f} 160 {235-swing:.2f} 310 {216-swing:.2f} C 475 {194-swing:.2f} 357 {12+swing:.2f} 505 {20+swing:.2f} C 663 {25+swing:.2f} 616 {end:.2f} 930 {end:.2f}'
 color = '#286387' if i%6 else '#172b3a'
 svg += f'<path d="{d}" stroke="{color}" stroke-width="1.05"/>\n'
svg += '</svg>\n'
(ROOT/'images'/'alignment-weave.svg').write_text(svg)
print('Created six icons, favicon, and footer weave.')
