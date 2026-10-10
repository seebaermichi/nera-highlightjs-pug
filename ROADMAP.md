# ROADMAP — `@nera-static/highlightjs-pug`

A [Pug](https://pugjs.org) grammar for [highlight.js](https://highlightjs.org), published as a 3rd-party language package. Usable with any highlight.js setup; `@nera-static/plugin-code-blocks` registers it by default, so Nera sites get Pug highlighting with zero config.

**This file is the single source of truth for this package. Extend it; never start a parallel document.** Why the package exists and why it has this name is decided in `../nera-plugin-code-blocks/ROADMAP.md` (D12); do not repeat that discussion here, refer to it. Each slice below is sized for one session, worked in a session started in **this** folder. Tick the checkboxes and add a dated `**Done YYYY-MM-DD**` note with anything learned. The next session reads this file first and continues where the last one stopped.

Written 2026-10-09. The repository starts with this file as its first commit; no `package.json` and no code yet.

---

## The problem

highlight.js has no Pug grammar, neither in core nor in its 3rd-party list, and no longer merges new languages into core (code-blocks ROADMAP, D12). The only npm package, `highlightjs-pug` 0.0.2, is a stripped HAML copy that highlights `.class` and `#id` only. Nera templates are Pug, and nera.js.org alone has 24 ```` ```pug ```` blocks.

## The goal

```js
import hljs from 'highlight.js/lib/core'
import pug from '@nera-static/highlightjs-pug'

hljs.registerLanguage('pug', pug)
hljs.highlight('a.btn(href=url) #{ label }', { language: 'pug' }).value
```

highlights tag, class, attribute name, JavaScript value and interpolation, with highlight.js's standard scopes, so every existing highlight.js theme colors it without extra CSS.

---

## Verified facts (2026-10-09)

- **highlight.js 11.12.0** is current. A language is a function `(hljs) => definition`, registered with `hljs.registerLanguage(name, fn)`. Sub-languages (`subLanguage: 'javascript'`) work when that language is registered too; `highlight.js` (full build) has `javascript`, `xml`, `css`, `markdown`.
- **3rd-party quick start** (`extra/3RD_PARTY_QUICK_START.md` in highlight.js): grammar in `src/languages/<name>.js`, markup tests in `test/markup/<name>/`, `package.json`, LICENSE, README, and a `dist/` folder filled by `npm run build` (their template builds ESM, CJS and a CDN file with Rollup; `dist/` is committed). A CDN-style `dist/<name>.min.js` can also be built from a highlight.js clone with the grammar in its `extra/` folder (`npm run build-cdn`). Tests can run in their core suite with `ONLY_EXTRA=true npm run test-markup`. Repos must not live under the highlight.js organisation. Listing: a PR adding the package to `SUPPORTED_LANGUAGES.md`.
- **No naming rule** in the quick start; its examples are `highlightjs-<language>`.
- **`@nera-static/highlightjs-pug`** returned 404 on npm (free). It does not start with `@nera-static/plugin-`, so Nera core never loads it as a plugin.
- **Fleet conventions** (workspace `CLAUDE.md`): ESM, Node ≥ 20, eslint with 4 spaces / no semicolons / single quotes, vitest, husky `pre-commit` lint and `pre-push` tests, CI `test.yml` + OIDC `publish.yml`, lockfile committed. The fleet has **no build step**; this package needs a small one for `dist/` (D3).

---

## Decisions

### D1 — Package shape
- `src/languages/pug.js`: the grammar, ESM, `export default function pug(hljs) { … }`.
- `package.json` `exports`: `"."` → `./src/languages/pug.js` (Node and bundlers, no build needed), `"./dist/*"` → `./dist/*`.
- `name: 'Pug'`, `aliases: ['jade']`, `case_insensitive: false`. Registered as `pug`.
- `peerDependencies: { "highlight.js": "^11.0.0" }`; dev dependency on the same for tests. No runtime dependencies.

### D2 — Scopes (so any highlight.js theme works)

| Pug | Example | Scope |
| --- | --- | --- |
| tag at line start | `header`, `a` | `name` (as in the XML grammar) |
| class / id shorthand | `.container`, `#main` | `selector-class`, `selector-id` |
| attribute name | `href=` | `attr` |
| attribute value | `post.href`, `'nav--main'` | `subLanguage: javascript` |
| keywords | `extends`, `block`, `append`, `prepend`, `include`, `mixin`, `if`, `else if`, `else`, `unless`, `each … in`, `for`, `while`, `case`, `when`, `default`, `yield` | `keyword` |
| include / extends path | `../layouts/layout` | `string` |
| mixin declaration / call | `mixin card(title)`, `+linkListNav(…)` | `title.function` |
| mixin parameters (added slice 1) | `(title, ...items)` in a declaration | `params` (as JavaScript's grammar) |
| mixin arguments (added slice 1) | `+card('Hello', 1)` | `subLanguage: javascript` |
| `&attributes` (added slice 1) | `div&attributes(obj)` | `keyword`, argument JavaScript |
| interpolated tag name (added slice 1) | `#{ tag }.card` | `subst`, as interpolation |
| code line | `- const x = 1` | `subLanguage: javascript`; the `-` as `operator` (added slice 2, like `=`) |
| buffered output | `p= title`, `p!= html` | `=`/`!=` as `operator`, rest JavaScript |
| interpolation | `#{ post.title }`, `!{ html }`, `#[em text]` | `subst`, JavaScript inside |
| comments | `// visible`, `//- hidden` | `comment` |
| doctype | `doctype html` | `meta` |
| piped text | `\| text` | `\|` as `punctuation`, text plain |
| filters | `:markdown-it` | `meta` (body plain) |
| block expansion | `li: a(href=x) Link` | `:` as `punctuation` |
| literal HTML line (added slice 2) | `<!DOCTYPE html>` | `subLanguage: xml` (plain text when XML is not registered) |
| escaped interpolation (added slice 2) | `\#{ x }`, `\#[ x ]` | plain text |

highlight.js matches patterns, not indentation. Multi-line text blocks after `tag.`, filter bodies and multi-line comments are therefore only partly covered: the first line is right, indented continuation lines may be read as tags. Document this in the README; do not try to emulate indentation.

### D3 — `dist/` and the build
- Node and bundler users use `src/` directly (D1). `dist/` is for the browser: `dist/pug.min.js` (registers itself on a global `hljs`, as highlight.js's CDN builds do) and `dist/pug.es.min.js`.
- Built with a small dev-only script (Rollup or esbuild + terser, decide in slice 3), `npm run build`, output committed as the quick start asks. CI checks that `dist/` is up to date.
- If the build turns out to be more than a few lines, ship 1.0.0 with `src/` only and add `dist/` in a minor; decide with the user.

### D4 — Tests
- Markup fixtures in highlight.js's format: `test/markup/pug/<case>.txt` (input) + `<case>.expect.txt` (expected HTML). A vitest test reads every pair, highlights with the full `highlight.js` build plus this grammar, and compares.
- Cases from real code: the ```` ```pug ```` blocks in `../nera-website/pages` (en version; de/es are the same code) and `../../nera-websites/michael-becker-berlin.de/themes/technical/views/`. Plus targeted cases per D2 row, and the D2 limits (text block, filter) to pin current behaviour.
- `hljs.highlightAuto` must not pick Pug for plain prose or other languages: keep `relevance` low on generic patterns (tags, classes) and give `extends`/`block`/`mixin`/`#{…}` the weight. One test with a few non-Pug samples.
- Optional, before the listing PR: run the fixtures in highlight.js's own suite (`ONLY_EXTRA=true npm run test-markup` from a clone).

---

## Slices

Each slice ends with `npx vitest run && npm run lint` green, the checkboxes ticked, a dated note, and a commit on `main`. Nothing is published before slice 4.

### Slice 0 — Repository scaffold
- [x] `package.json` per D1 (`0.0.0`, `"type": "module"`, `engines.node >=20`, `files: ["src", "dist", "CHANGELOG.md"]`, `publishConfig.access: public`, `repository` → `seebaermichi/nera-highlightjs-pug`, keywords `highlight.js`, `highlightjs`, `pug`, `jade`, `syntax-highlighting`), `LICENSE` (MIT, 2026), `CHANGELOG.md` (`## [Unreleased]`), `README.md` stub.
- [x] Copy `eslint.config.js`, `.gitignore`, `.github/workflows/test.yml` and `publish.yml`, `.husky/` plus `prepare: husky` from `../nera-plugin-images`. In `test.yml`, drop the cheerio comment; check whether Node 18 can come back into the matrix (no cheerio here).
- [x] Dev: `highlight.js`, `vitest`, `eslint`, `husky`. `npm install` with npm ≥ 10.9 (Node 22), lockfile in the scaffold commit, before any workflow that runs `npm ci` (workspace `CLAUDE.md`, ordering rule 1).
- [x] Fixture runner (D4) with one trivial case, so slice 1 only adds cases.
- [x] Do **not** create the GitHub repo yet.

**Done 2026-10-10.** Scaffold, lockfile and a fixture runner (`test/markup.test.js`) with one case; the grammar is a stub that only knows tags. Learned:
- **Node 18 cannot come back** into the CI matrix: vitest 5 declares `^22.12.0 || ^24 || >=26` and eslint 10 `^20.19.0 || …`. The fleet runs vitest 5 on Node 20 in CI anyway (works in practice, as `nera-plugin-images` shows), so the matrix stays `[20, 22]`. The grammar has no runtime dependencies and no Node floor of its own; `engines.node >=20` documents the tooling.
- The fleet `.gitignore` ignores `dist/`; that block is removed here, since `dist/` is committed (D3).
- The runner compares `hljs.highlight(input).value` with `<case>.expect.txt` after `trim()`, as highlight.js's own `test/markup` does. `WRITE_EXPECT=1 npx vitest run` writes the expect files from the current grammar; review that diff by eye, it is the actual test.
- `npm install -D` does not run `prepare`; run `npm run prepare` once so `core.hooksPath` points at `.husky/_`.

### Slice 1 — Core grammar
- [x] Tags, class/id shorthand, attributes with JavaScript values (incl. multi-line attribute lists), keywords, include/extends paths, mixins, comments, doctype, piped text, block expansion (D2).
- [x] Fixtures for each, then all real snippets from nera.js.org.

**Done 2026-10-10.** 21 fixtures: one per D2 row (tags, class/id, attributes incl. multi-line, space-separated and `!=`, keywords, blocks, include, mixins, comments, doctype, piped text, block expansion, `&attributes`, interpolated tag name) plus all 8 English nera.js.org blocks (`nera-js-org-*`; de/es carry the same code). Interpolation in text already works, since the tag line needed it; slice 2 adds its edge cases. Learned:
- **Never match `\s` inside a line mode.** Contained modes win over the parent's `end` at the same position, so a `\s+` swallows the newline before `$` can end the line, and the next line is never classified. Line-level whitespace is `[ \t]`; only the attribute list (which may span lines) uses `\s`.
- **A sub-language mode adds no relevance of its own** (`core.js`: `if (!top.skip && !top.subLanguage) relevance += top.relevance`); its `relevance` only gates whether JavaScript's relevance is added. So keyword lines are a `match` carrying the weight, which `starts` a `relevance: 0` JavaScript mode for the rest of the line.
- Attribute values are JavaScript with nested `()`, `[]`, `{}` and strings as contained modes, so a `,` or `)` inside them does not end the value. highlight.js highlights each fragment separately; the result looks right but carries several `language-javascript` spans, and a regex literal with parentheses splits across them (cosmetic). Interpolation only nests `{}` and strings, which keeps `#{ t('x') }` in one fragment.
- A value ends at a top-level `,` or `)`, or where whitespace is followed by `name=`. A space-separated **boolean** attribute after a value (`a(href=x disabled)`) is therefore read as part of the value; with commas (the common style) it is an `attr`. Ternaries such as `class=a ? 'b' : undefined` stay one value.
- `//` is a comment only at line start; `span.t // Blog` is text, as in Pug.

### Slice 2 — JavaScript and interpolation
- [x] `-` code lines, `=`/`!=` output, `#{}`/`!{}`/`#[]` interpolation in text and attribute strings, filters as `meta`.
- [x] Fixtures from the field-test site's `themes/technical/views/` (layouts, mixins, components). Write the D2 limits down as fixtures.
- [x] `highlightAuto` test (D4).

**Done 2026-10-10.** 47 markup fixtures (all 16 field-test views as `theme-*`, the D2 limits as `limits-*`), a `highlightAuto` test and a `highlight.js/lib/core` + `javascript` test (acceptance 2); 67 tests. Every line of every theme view starts with the right token (acceptance 1, first lines). Learned:
- **Interpolation in attribute strings does not exist in Pug ≥ 2** (`a(href='#{url}')` is literal); attribute values are JavaScript, so template literals (`` `/${ lang }/` ``) are the way, and they get JavaScript's `string`/`subst`. Nothing to add.
- **Relevance, as tuned:** generic patterns score 0 — tags, classes, ids, strings, `if`/`else`/`for … in`/`case`, `|`, `=`, `#{` in general. Weight goes to Pug-specific signals: `extends`/`include`/`mixin`/`doctype` 10, `&attributes` 10, `each … in` 5, `//-` 3, a text that *opens* with `#{`/`!{` 3 (in Ruby and CoffeeScript `#{` sits inside quotes), `tag(name=` 3, `#[` 2, `+mixin(` 2, `- const|let|var` 2. With `for … in` and every `#{` weighted, CoffeeScript was detected as Pug; the test now has Ruby and CoffeeScript samples.
- **Positive detection is best effort.** Whole templates with `extends`/`include`/`mixin` are detected; shorter or attribute-heavy ones lose to `dns` (it scores every parenthesis), `stylus` or `routeros`. 25 of 47 fixtures are detected. Not an acceptance criterion: a ```` ```pug ```` fence names its language. The test pins the 7 that are detected so a change in weights shows up.
- No regex lookbehind in the grammar (older Safari); weights sit on a non-sub-language outer mode with the JavaScript in an inner mode.

### Slice 3 — `dist/` and README
- [x] Build per D3, CI check that `dist/` matches.
- [x] README: install, Node/ESM use, browser/CDN use, the scope table, the limits, link to nera.js.org and to `@nera-static/plugin-code-blocks`.
- [x] Field check: install the packed tarball into the code-blocks plugin (or the field-test site's local plugin) and look at the Pug blocks of nera.js.org in the browser with a common highlight.js theme.

**Done 2026-10-10.** Learned and decided:
- **Build: esbuild alone** (D3's "Rollup or esbuild + terser"): one dev dependency, `scripts/build.js` is ~30 lines, and esbuild minifies itself. `pug.min.js` is built from a two-line stdin entry (`import pug …; hljs.registerLanguage("pug", pug)`) as an IIFE, so it leaks no global; `pug.es.min.js` is the ESM build. Both ~3.7 kB. The banner carries **no version**, or every `npm version` would make `dist/` stale. Output is byte-identical on Node 20 and 22. `test/dist.test.js` checks that both files highlight exactly like `src/` (the IIFE run in a `vm` context with a global `hljs`); `test.yml` runs `npm run build && git diff --exit-code -- dist`. `publish.yml` stays the fleet copy: the tagged commit is on `main`, which `test.yml` already checked.
- **Field check, adapted:** `@nera-static/plugin-code-blocks` has no code yet, and the field-test site has no Pug blocks (its local `plugins/code-blocks` highlights with the full highlight.js build, so it would only need `registerLanguage`). So the `npm pack` tarball (7.9 kB: `src/`, `dist/`, README, CHANGELOG, LICENSE) was unpacked, and its `dist/pug.min.js` loaded in Chrome next to highlight.js 11.12.0 from jsDelivr, with all 8 nera.js.org blocks and the hardest theme views, under the `github` and `atom-one-dark` themes. All 21 blocks highlighted, nothing visibly wrong on first lines; in both themes tags, classes, attributes, keywords and interpolation are distinct colors.
- README: the code-blocks plugin is named without a link while it has no repo; **add the link when it is public** (slice 4 or the code-blocks release). Its ROADMAP item "color the scopes highlightjs-pug uses" should add `params`, `punctuation` and `keyword` to its list (slice 4 below).

### Slice 4 — Release and listing
Follow `../nera-plugin-images/ROADMAP.md` slice 8, **confirming every outward step with the user**:
- [x] GitHub repo `seebaermichi/nera-highlightjs-pug` (public), push, private vulnerability reporting, `protect-main` ruleset, secret-scanning push protection, Dependabot config (fleet copy). **Done 2026-10-10**, confirmed by the user (`gh repo create --public` is refused by Claude Code's auto-mode classifier until the user confirms in chat). Homepage nera.js.org. Enabled via `gh api` and verified: private vulnerability reporting, Dependabot alerts + automated security fixes, secret scanning + push protection, `protect-main` (`non_fast_forward` + `deletion`, `~DEFAULT_BRANCH`, no bypass; copied from plugin-images). `test.yml` green on Node 20 and 22, including the `dist/` check.
- [x] 1.0.0 bootstrap publish by hand (the user runs `npm publish`), Trusted Publisher, then a real **1.0.1 via CI within two days** so the Trusted Publisher validates. **Done 2026-10-10.** The user ran `npm publish` (again a `0.0.0-stage` placeholder from staged publishing, harmless; `latest` correct) and added the Trusted Publisher (`publish.yml`, permissions `npm publish` + `npm stage publish`). The registry's 1.0.0 shasum `e1fa36be…` matches the tarball smoke-tested in a clean project. `v1.0.0` on `975f33f`: its CI run passed OIDC and failed with `cannot publish over … 1.0.0`, as expected. **1.0.1** carries a real fix found by probing edge cases: block expansion after `when`/`default` (`when 0: p none`, an example from Pug's own `case` docs) was highlighted as JavaScript; fixture `case-block-expansion`. `v1.0.1` on `3e35b19`: CI publish green, on npm with SLSA provenance, a few minutes after the run (staged publishing). npm warns that it normalizes `repository.url` to `git+https://…`, as for every fleet package; cosmetic.
- [x] Live demo page (added 2026-10-10 at the user's request, after a private preview artifact). **Done**: `demo/` on GitHub Pages (`main`, root; legacy Jekyll build, so `/` shows the README), https://seebaermichi.github.io/nera-highlightjs-pug/demo/. `npm run build` bundles highlight.js (`lib/common`) + the grammar from `src/` into `demo/demo.js` (~170 kB) and writes three stock themes, scoped per `.t-<name>` class, into `demo/themes.css`; IBM Plex is self-hosted (copied from `nera-website`, with `OFL.txt`), so the page makes **no third-party requests** (the `privacy-*` rules of `nera check` would flag Google Fonts or a CDN). The package version is fetched at runtime from `../package.json`, so a release does not change the bundle. `test.yml` checks `dist` and `demo` are up to date. Not in the npm tarball (`files`). README links it; released as **1.0.2** (patch, via CI).
- [ ] PR to `highlightjs/highlight.js` adding the package to `SUPPORTED_LANGUAGES.md` (row format as the existing 3rd-party entries). Wait for the user's go before opening it.
- [ ] Not a Nera plugin, so **not** in `generator/PLUGINS.md` or the nera.js.org plugin catalog. Mention it in the code-blocks README instead.
- [x] Code-blocks ROADMAP slice 4: tick the Pug item, add the dependency there. Extend its "color the scopes" item with `params`, `punctuation` and `keyword` (D2 rows added in slices 1–2). **Done 2026-10-10** (`nera-plugin-code-blocks` `f343a75`): Pug item ticked; the dependency itself is a new open item there, since that repo has no `package.json` yet. The scope list got `params` plus the JavaScript scopes `property`, `title.class`, `regexp`; `punctuation`, `keyword` and `meta` were left out, because the field-test site's CSS already colors them.
- [ ] Link `@nera-static/plugin-code-blocks` from this README once its repo is public.
- [x] Workspace `CLAUDE.md`: add the folder to the workspace layout and to the non-plugin members of the `@nera-static` scope. **Done 2026-10-10**; update its "1.0.0 prepared" wording once released.

---

## Semver notes
**Major:** a scope from D2 changes for an existing construct (themes and sites style these), the registered name or aliases change, or the `exports` paths change. **Minor:** a new construct is highlighted, `dist/` is added. **Patch:** a wrong highlight is fixed. Note in the CHANGELOG when highlighting of existing snippets visibly changes.

## Not in scope
- Indentation-aware parsing (D2 limits).
- Highlighting filter bodies in their own language (`:markdown-it` content as Markdown).
- A Shiki/TextMate grammar.

## Acceptance criteria
1. Every ```` ```pug ```` block on nera.js.org and every view in the field-test site's theme highlights without visibly wrong tokens on their first lines; known limits are covered by fixtures and the README.
2. Works with the full `highlight.js` build and with `highlight.js/lib/core` plus `javascript` registered.
3. `highlightAuto` does not choose Pug for the non-Pug samples.
4. Listed in highlight.js's `SUPPORTED_LANGUAGES.md`.
