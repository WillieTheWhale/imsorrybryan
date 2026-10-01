# Carolina AI Alignment — website design system

This guide describes the single-page rebuild completed October 1, 2026. The live implementation is in `website/`. Use this system when adding pages; preserve its typography, generous spacing, and restraint.

## Direction

The reference is [Institute for Progress](https://ifp.org/): heavy uppercase sans-serif headlines, serif editorial headings, asymmetric columns, thin rules, scientific illustration, and striped monochrome iconography. The implementation and all new graphics are original. The six-scene Carolina print animation from the earlier website remains the hero.

The page is white, with cool blue fields and subtle UNC details. Never introduce beige, decorative gradient backgrounds, rounded card grids, pill labels, floating shadows, oversized navigation, or generic AI stock imagery. Do not add filler eyebrows, slogans, section descriptions, or duplicated invitations.

## Copy and content

The source of visible copy is [Carolina AI Alignment](https://www.carolinaaialignment.com/), retrieved October 1, 2026. The original links are preserved. The public contact address was recovered from the source site's Contact control and is linked in the footer.

Use existing copy, edited only for hierarchy and repetition. The redundant labels “Why AI safety,” “Our flagship program,” and “What we think about” do not accompany already descriptive headings. Accessibility labels and artwork alternative text may describe controls or images; they must not become promotional copy.

The Oct 2 application deadline and Oct 7 event are source content, not rolling dates. Update them from the organization's confirmed schedule when they change. Do not automatically invent replacement events or deadlines. Risk statements are carried over from the source; the editorial illustrations are conceptual metaphors and do not add factual claims.

## Typography

Actual WOFF2 files downloaded from the public [IFP font directory](https://ifp.org/wp-content/themes/institute-for-progress/assets/fonts/soehne-buch.woff2) are self-hosted under `website/assets/fonts/`.

| Role | Font | Weight | Treatment |
| --- | --- | --- | --- |
| Main headline | Söhne Extra Fett | 900 | Uppercase, 36–76px desktop, tight .99 line height, −.025em tracking |
| Navigation, body, links | Söhne Buch | 400 | Sentence case, generally 14–20px |
| Emphasis | Söhne Kräftig | 500 | Sparingly, for functional labels |
| Small topic titles | Söhne Extra Fett | 900 | Uppercase, 13–15px |
| Section headings | Tiempos Text Regular | 400 | Sentence case, 26–48px, 1.15 line height |
| Optional inline italics | Tiempos Text Italic | 400 | Only when editorially necessary |

Do not substitute generic serif italics for every second heading line. Do not synthesize font weights. Font loading uses `font-display: swap`, with Söhne regular and extra-bold preloaded. The files are commercial typefaces; their provenance is documented here, and a suitable web license should be confirmed before public deployment. This task delivered a local preview.

## Color

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#ffffff` | Main background |
| `--ink` | `#172b3a` | Text, icon ink |
| `--muted` | `#4e606c` | Secondary body copy |
| `--line` | `#c3ced4` | Fine rules |
| `--blue` | `#4b9cd3` | Carolina blue accents |
| `--blue-light` | `#b7d7ec` | Mission heading field |
| `--blue-pale` | `#e5f0f6` | Fellowship text field |
| Accent ink | `#eb613f` | Vermilion-orange paths in editorial artwork |
| Accessible accent | `#c04b2b` | Small application-link arrows |
| Footer field | `#d7e9f4` | Woven-line invitation |
| Animation paper | `#f9fbfc` | Cool white screenprint ground |

Never put small white text on Carolina blue. Use navy on the light blue fields. Links gain a darker blue hover color; focus rings remain visible.

## Page geometry

- Slim 76px masthead, 70px on phones. No sticky overlay, announcement above the artwork, or extra margin before the hero.
- Hero animation runs edge to edge, 330–580px tall on desktop. Preserve all six scenes, their geometric construction, texture, timing, and print-wipe transitions. The revised palette removes warm paper, yellow, and violet.
- Main headline and short introduction occupy a two-column band beneath the animation with 68px above and 76px below the copy. On phones they stack, with 44px above, 52px below, and a 34px gap.
- The event is one compact linked strip with date, existing event title, and RSVP.
- The middle section begins after an 80px white gap (52px on phones), then splits 50/50. Mission on the left, fellowship on the right, separated by a 1px rule. The mission heading has a full-column blue field. The fellowship image and text form a single square-edged editorial panel.
- The six risk topics use a three-column grid with 96px of section space above, 100px below, 48px above each topic, and thin horizontal rules. Body copy uses 1.65 line height, with 16px between paragraphs. No boxed cards. Two columns below 700px; one column with side-mounted icons below 380px.
- The invitation is approximately 220px tall, followed by a roughly 78px metadata footer. Do not turn it into a second navigation sitemap.
- Horizontal gutter: `clamp(24px, 4.3vw, 80px)`. Phones use 24px, or 18px below 380px. Prefer this shared alignment to isolated arbitrary margins.

## Images and graphics

The current illustrations are the second-round ImageGen screenprints in `website/assets/images/`:

- `circuit-tracing-v2`: a woven blue optical field with one vermilion path passing through its loops. The concept remains informed by [Anthropic's circuit-tracing research](https://www.anthropic.com/research/tracing-thoughts-language-model).
- `objective-landscape-v2`: two unequal flat blue contour fields, linked by an orange trajectory ending in an off-center orange disc. The concept remains informed by [DeepMind's explanation of specification gaming](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/).

**Required aesthetic:** 1960s Swiss concrete graphic art and experimental mathematical book covers, executed as flat two-ink silkscreen prints. Saturated Carolina-blue linework, small vermilion-orange accents, neutral white paper, geometric asymmetry, and controlled optical line rhythm. Texture belongs to the ink edges and paper tooth. There is no represented lighting, no rendered physical material, no perspective, no shadows, and no gradients. Form comes from the spacing of flat printed lines.

Earlier glass-panel and sculpted-terrain studies were rejected and removed. Do not reuse their 3D scientific-model direction. Do not fall back to broad terms such as “premium editorial” or “scientific illustration” without naming and describing an actual art style.

Exact generation prompts and tool provenance are in `design/website-rebrand/round-02/image-prompts.md`. Both were made with the built-in ImageGen tool. Original PNGs are retained; the live site loads quality-90 WebP derivatives. The images render at their full 3:2 aspect ratio without cropping. Do not hotlink generated assets or depend on Codex attachment paths.

The warm accent is concentrated in the artwork and echoed in small application-link arrows; keep the existing blue fields. Do not spread warm color over large website backgrounds. These visual metaphors do not add factual claims or new promotional copy.

Six original 72-unit SVG icons combine scientific silhouettes and horizontal print ruling. Their display size is 58–66px. Decorative icons have empty alt text. The favicon uses the same contour vocabulary, not a third proposed logo.

The footer uses an original family of 36 Bezier threads that cross and converge. It is an abstract alignment/weaving motif. Its source, along with the six icons, is reproducible with `python3 design/website-rebrand/build-graphics.py`. Keep it decorative, crisp, and subordinate to links.

## Logo comparison

The two supplied images are preserved intact as `caia-hand.png` and `caia-contour.png`, with optimized WebP equivalents. CSS frames their original whitespace without changing their artwork. The wide contour logo is the default. Clicking the logo toggles the two candidates in the same header slot; Enter and Space work through a native button. The selection persists in the local browser under `caia-logo`. There is no analytics, assignment, or statistical A/B-testing service.

Maintain the header's height while comparing the two different aspect ratios. The hand logo is naturally narrower. Accessible labels identify the alternate option, and an unobtrusive live region announces the selection.

## Motion and access

Keep the existing shader, NC geometry, neural-network geometry, and print transitions. The animation pauses when offscreen or the document is hidden. Reduced-motion preference opens on the Old Well still. There is no visible pause control.

If WebGL cannot initialize, show the static objective-landscape image. Links and page copy must work without JavaScript. Retain the skip link, semantic landmarks, sequential headings, descriptive link names, visible keyboard focus, image dimensions, and lazy loading below the hero.

## Adding pages

Reuse `styles.css` tokens, the compact masthead, headline hierarchy, link style, image treatment, and compact footer. Use the existing nav destinations as local anchors until real pages exist. A new article should have a clear title, necessary metadata only, a readable text column, and relevant original artwork. Do not invent staff, programs, reports, publication dates, or research claims to populate layouts.

## Running and checking

No build system or install step is required. From the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory website
```

Open `http://localhost:4173/`. ES modules require HTTP; do not open the HTML as a `file:` URL. The existing server on port 4173 was reused during this rebuild.

Animation control regression checks:

```sh
node website/tests/animation-controls.test.cjs
```

The test stubs WebGL to check six-scene selection, reduced-motion startup, resize while paused, and preference changes. Real WebGL rendering is checked in the browser. Also inspect desktop and phone layouts, logo toggle/persistence, keyboard use, asset loading, overflow, anchor links, and browser errors after changes.

The active website is `website/`. The design directory retains only the current artwork prompts and the source script for the footer and risk icons.
