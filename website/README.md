# Carolina AI Alignment website

A static single-page site with local fonts and artwork. No npm dependencies or build step.

From the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory website
```

Open [localhost:4173](http://localhost:4173/).

Click the header logo to switch between the two supplied candidates. Choice is stored only in your browser. The hero retains all six existing WebGL print animations and honors reduced-motion preferences.

See [the style guide](../STYLE_GUIDE.md) for future page design, assets, typography, copy rules, and source references. Exact artwork prompts are in [image-prompts.md](../design/website-rebrand/round-02/image-prompts.md).

Run animation control checks with `node website/tests/animation-controls.test.cjs` from the repository root. Verify actual rendering and responsiveness in a browser; the control tests use a stub GL context.
