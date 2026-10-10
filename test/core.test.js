import { describe, it, expect } from 'vitest'
import core from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import pug from '../src/languages/pug.js'

// The minimal setup: highlight.js core with JavaScript, without the XML
// grammar that the full build brings along.
const hljs = core.newInstance()
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('pug', pug)

describe('with highlight.js/lib/core', () => {
    it('highlights tag, class, attribute, JavaScript and interpolation', () => {
        expect(hljs.highlight('a.btn(href=url) #{ label }', { language: 'pug' }).value).toBe(
            '<span class="hljs-name">a</span><span class="hljs-selector-class">.btn</span>'
            + '(<span class="hljs-attr">href</span>=<span class="language-javascript">url</span>) '
            + '<span class="hljs-subst">#{<span class="language-javascript"> label </span>}</span>',
        )
    })

    it('registers the jade alias', () => {
        expect(hljs.getLanguage('jade').name).toBe('Pug')
    })

    it('leaves literal HTML as plain text when XML is not registered', () => {
        expect(hljs.highlight('<p class="x">Hi</p>', { language: 'pug' }).value)
            .toBe('&lt;p class=&quot;x&quot;&gt;Hi&lt;/p&gt;')
    })
})
