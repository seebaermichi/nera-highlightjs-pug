# @nera-static/highlightjs-pug

A [Pug](https://pugjs.org) (formerly Jade) grammar for [highlight.js](https://highlightjs.org) 11. It highlights tags, classes and ids, attributes with JavaScript values, keywords, mixins, interpolation and comments, using highlight.js's standard scopes, so every highlight.js theme colors it without extra CSS.

```pug
extends ../layouts/layout

block content
  //- Pug keeps its own comments out of the HTML
  ul.posts
    each post in app.posts
      li: a(href=post.href, class=post.featured ? 'featured' : undefined) #{ post.title }
  +pagination(meta.pagination)
```

📖 Built for [Nera](https://nera.js.org), whose templates are Pug; the upcoming `@nera-static/plugin-code-blocks` registers it for Nera sites with no setup. It works the same with any highlight.js setup.

## 🚀 Installation

```bash
npm install @nera-static/highlightjs-pug highlight.js
```

`highlight.js` 11 is a peer dependency. The grammar has no other dependencies.

## Usage

### Node and bundlers

```js
import hljs from 'highlight.js'
import pug from '@nera-static/highlightjs-pug'

hljs.registerLanguage('pug', pug)

hljs.highlight('a.btn(href=url) #{ label }', { language: 'pug' }).value
```

The grammar also registers the alias `jade`, so ```` ```jade ```` blocks work too.

Attribute values, code lines and interpolation are highlighted as JavaScript, and lines of literal HTML (`<!DOCTYPE html>`) as XML. With the full `highlight.js` build both are there. With `highlight.js/lib/core`, register them yourself; whatever is not registered stays plain text:

```js
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import pug from '@nera-static/highlightjs-pug'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('pug', pug)
```

### Browser

`dist/pug.min.js` registers itself on the global `hljs`, like highlight.js's own CDN language files. Load it after highlight.js:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12.0/styles/github.min.css">
<script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12.0/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@nera-static/highlightjs-pug@1/dist/pug.min.js"></script>
<script>hljs.highlightAll()</script>
```

Then mark your blocks with `<pre><code class="language-pug">`. `dist/pug.es.min.js` is the same grammar as an ES module, for `<script type="module">`:

```js
import hljs from 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12.0/es/highlight.min.js'
import pug from 'https://cdn.jsdelivr.net/npm/@nera-static/highlightjs-pug@1/dist/pug.es.min.js'

hljs.registerLanguage('pug', pug)
```

## Scopes

| Pug | Example | Scope |
| --- | --- | --- |
| tag | `header`, `a` | `name` |
| class / id shorthand | `.container`, `#main` | `selector-class`, `selector-id` |
| attribute name | `href=` | `attr` |
| attribute value | `post.href`, `'nav--main'` | JavaScript |
| keywords | `extends`, `block`, `append`, `prepend`, `include`, `mixin`, `if`, `else if`, `else`, `unless`, `each … in`, `for … in`, `while`, `case`, `when`, `default`, `yield`, `&attributes` | `keyword` |
| include / extends path | `../layouts/layout` | `string` |
| mixin declaration / call | `mixin card(title)`, `+card('Hi')` | `title.function`; parameters `params`; arguments JavaScript |
| code line | `- const x = 1` | `-` as `operator`, rest JavaScript |
| buffered output | `p= title`, `p!= html` | `=` / `!=` as `operator`, rest JavaScript |
| interpolation | `#{ post.title }`, `!{ html }`, `#[em text]`, `#{ tag }.card` | `subst`, JavaScript or a tag inside |
| comments | `// visible`, `//- hidden` | `comment` |
| doctype | `doctype html` | `meta` |
| piped text | `\| text` | `\|` as `punctuation` |
| filters | `:markdown-it` | `meta` |
| block expansion | `li: a(href=x) Link` | `:` as `punctuation` |
| literal HTML line | `<!DOCTYPE html>` | XML |

Text, block names, escaped interpolation (`\#{ x }`) and `//` after a tag (`span // text`) stay plain, as Pug treats them as text.

## Limits

highlight.js matches patterns line by line and does not track indentation. Pug constructs whose meaning comes from indentation are therefore only right on their first line:

- **Text blocks** after `p.` or `script.`: each continuation line is read as a new line of Pug, so its first word looks like a tag.
- **Filter bodies** under `:markdown-it` and the like: the same. The body is not highlighted in the filter's language.
- **Multi-line comments** (`//-` followed by an indented block): only the marker line is a comment.
- **Code blocks** (`-` alone, JavaScript on the indented lines below): only the `-` line is code.

Two smaller ones: a space-separated boolean attribute after a value (`a(href=x disabled)`) is read as part of the value (with commas, `a(href=x, disabled)`, it is an attribute), and a regex literal containing parentheses inside an attribute value is split into several fragments. Both are cosmetic.

**Auto-detection** (`hljs.highlightAuto`) is best effort. Generic patterns such as a word at the start of a line or `.class` carry no weight, so prose and other languages are not taken for Pug. Whole templates with `extends`, `include`, `mixin` or `each` are usually detected; short snippets often are not, so name the language: ```` ```pug ````, or `class="language-pug"`.

## Compatibility

- highlight.js 11.
- `src/` is plain ES2018 without dependencies; Node.js 20 or later for the package tooling. `dist/` runs in every browser highlight.js 11 supports.

## 🧪 Development

```bash
npx vitest run
npm run lint
npm run build   # rebuild dist/ after changing src/, and commit it
```

The tests are markup fixtures in highlight.js's format: `test/markup/pug/<case>.txt` is the input, `<case>.expect.txt` the expected HTML. `WRITE_EXPECT=1 npx vitest run` rewrites the expect files from the current grammar; review that diff before committing it. CI fails when `dist/` was not rebuilt.

## 📦 License

MIT
