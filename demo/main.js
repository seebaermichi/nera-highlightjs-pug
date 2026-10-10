// The demo page's script, bundled into demo/demo.js by `npm run build`:
// highlight.js (common languages, which include JavaScript and XML) plus
// the grammar from src/, so the page always shows the current grammar and
// loads nothing from third parties.
import hljs from 'highlight.js/lib/common'
import pug from '../src/languages/pug.js'

hljs.registerLanguage('pug', pug)

const THEMES = ['github', 'github-dark', 'atom-one-dark']
const app = document.getElementById('app')
const select = document.getElementById('theme')

// Hovering a token shows its scope, e.g. `selector-class` or `title.function`.
const labelScopes = (root) => {
    root.querySelectorAll('[class^="hljs-"], [class*=" hljs-"]').forEach((el) => {
        el.title = [...el.classList].map((name) => name.replace(/^hljs-/, '').replace(/_$/, '')).join('.')
    })
}

const setTheme = (name) => {
    app.classList.remove(...THEMES.map((theme) => `t-${theme}`))
    app.classList.add(`t-${name}`)
    select.value = name
}

let initial = matchMedia('(prefers-color-scheme: dark)').matches ? 'github-dark' : 'github'
try {
    const saved = localStorage.getItem('pug-demo-theme')
    if (THEMES.includes(saved)) {
        initial = saved
    }
} catch {
    // Storage blocked: keep the system default.
}
setTheme(initial)

select.addEventListener('change', () => {
    setTheme(select.value)
    try {
        localStorage.setItem('pug-demo-theme', select.value)
    } catch {
        // Storage blocked: the choice lasts until reload.
    }
})

document.querySelectorAll('pre code.language-pug:not(#output)').forEach((el) => hljs.highlightElement(el))
labelScopes(document)

const input = document.getElementById('input')
const output = document.getElementById('output')
const render = () => {
    output.innerHTML = hljs.highlight(input.value, { language: 'pug' }).value
    labelScopes(output)
}
input.addEventListener('input', render)
render()

document.getElementById('hljs-version').textContent = hljs.versionString

// The package version, read at runtime so a release does not change demo.js.
fetch('../package.json')
    .then((response) => response.json())
    .then(({ version }) => {
        document.getElementById('pkg-version').textContent = ` ${version}`
    })
    .catch(() => {})
