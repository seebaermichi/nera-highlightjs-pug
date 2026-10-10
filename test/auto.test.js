import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'
import hljs from 'highlight.js'
import pug from '../src/languages/pug.js'

const markupDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'markup/pug')

hljs.registerLanguage('pug', pug)

// Generic patterns (a word at line start, `.class`, `(…)`) carry no
// relevance, so other languages and prose must not be detected as Pug.
const notPug = {
    prose: `This is a paragraph of plain text.
It spans several lines, and some of them
start with words like if, each or block.`,
    javascript: `import fs from 'fs'

export function read(file) {
    const text = fs.readFileSync(file, 'utf-8')
    if (text.length > 0) {
        return text.split('\\n')
    }
    return []
}`,
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Page</title>
  </head>
  <body class="home">
    <p>Hello <em>world</em></p>
  </body>
</html>`,
    css: `.container {
  display: grid;
  gap: 1rem;
}
#main a:hover {
  color: red;
}`,
    yaml: `name: Nera
folders:
  plugins: ./plugins
lang: en`,
    markdown: `# Heading

Some *emphasis* and a [link](https://example.com).

- one
- two`,
    python: `def greet(name):
    if name:
        print(f"Hello {name}")
    else:
        print("Hello")`,
    ruby: `class Greeter
  def greet
    puts "Hello #{@name}, it is #{Time.now.year}"
  end
end`,
    coffeescript: `greet = (name) ->
  console.log "Hello #{name}"
for item in list
  greet item.title`,
    haml: `%section.container
  %h1= post.title
  %p
    = post.body`,
}

describe('highlightAuto', () => {
    it.each(Object.entries(notPug))('does not choose Pug for %s', (name, code) => {
        expect(hljs.highlightAuto(code).language).not.toBe('pug')
    })

    // Best effort: whole templates with `extends`, `include`, `mixin` or
    // `each` are detected; short snippets usually are not, and need their
    // language named (as a ```pug fence does).
    it.each([
        'theme-layouts-layout',
        'theme-mixins-header',
        'theme-mixins-footer',
        'theme-mixins-section',
        'theme-pages-default',
        'theme-pages-home',
        'nera-js-org-tag-your-content-0',
    ])('chooses Pug for %s', (name) => {
        const code = fs.readFileSync(path.join(markupDir, `${name}.txt`), 'utf-8')
        expect(hljs.highlightAuto(code).language).toBe('pug')
    })
})
