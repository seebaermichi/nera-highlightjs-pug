/*
Language: Pug
Description: Pug (formerly Jade), the indentation-based HTML template language.
Author: Michael Becker
Website: https://pugjs.org
Category: template
*/

/** @type {import('highlight.js').LanguageFn} */
export default function pug(hljs) {
    // Every Pug statement starts at the beginning of a line, after its
    // indentation. highlight.js does not track indentation, so each line
    // is classified on its own (see the README for what that misses).
    const INDENT = /^[ \t]*/

    // JavaScript as a sub-language. Its relevance is not added to Pug's, so
    // JavaScript-heavy snippets are not mistaken for Pug by highlightAuto.
    const JS = { subLanguage: 'javascript', relevance: 0 }

    // Strings and brackets inside an expression, so that a `,` `)` or `}`
    // inside them does not end the expression early.
    const STRINGS = [
        hljs.inherit(hljs.APOS_STRING_MODE, { relevance: 0 }),
        hljs.inherit(hljs.QUOTE_STRING_MODE, { relevance: 0 }),
        {
            scope: 'string',
            relevance: 0,
            begin: '`',
            end: '`',
            contains: [
                hljs.BACKSLASH_ESCAPE,
                {
                    scope: 'subst',
                    relevance: 0,
                    begin: /\$\{/,
                    end: /\}/,
                    contains: [],
                },
            ],
        },
    ]
    const BRACES = { begin: /\{/, end: /\}/, ...JS, contains: ['self', ...STRINGS] }
    const NESTED = [
        ...STRINGS,
        { begin: /\(/, end: /\)/, ...JS, contains: ['self', ...STRINGS] },
        { begin: /\[/, end: /\]/, ...JS, contains: ['self', ...STRINGS] },
        BRACES,
    ]
    // The JavaScript between `{` and `}` of an interpolation: only a string
    // or another `{…}` can hide the closing `}`.
    const INTERPOLATED_JS = { begin: /(?=[^}])/, end: /(?=\})/, ...JS, contains: [...STRINGS, BRACES] }
    STRINGS[2].contains[1].contains = [INTERPOLATED_JS]

    // `#{ … }` and `!{ … }`: escaped and unescaped interpolation.
    const INTERPOLATION = {
        scope: 'subst',
        relevance: 0,
        begin: /[#!]\{/,
        end: /\}/,
        contains: [INTERPOLATED_JS],
    }

    // An attribute value ends at a `,` or `)` outside brackets, or where
    // the next whitespace-separated `name=` starts.
    const ATTRIBUTE_VALUE = {
        begin: /\s*!?=\s*/,
        end: /(?=\s*[,)]|\s+[\w@:.[\]-]+\s*!?=(?!=))/,
        excludeBegin: true,
        ...JS,
        contains: NESTED,
    }

    const ATTRIBUTE_LIST = [
        { scope: 'attr', match: /[^\s(),=!'"`]+/, relevance: 0 },
        ATTRIBUTE_VALUE,
    ]
    const ATTRIBUTES = { begin: /\(/, end: /\)/, relevance: 0, contains: ATTRIBUTE_LIST }
    // `img(src=…`: a list that opens with `name=` is typical of Pug, and is
    // the only attribute list that counts for auto-detection.
    const ATTRIBUTES_WITH_VALUE = {
        begin: [/\(/, /[\w@:.-]+(?=\s*!?=[^=])/],
        beginScope: { 2: 'attr' },
        end: /\)/,
        relevance: 3,
        contains: ATTRIBUTE_LIST,
    }

    // `(…)` holding JavaScript after a name: mixin arguments,
    // `&attributes(…)`. The outer mode carries the relevance, since a
    // sub-language mode adds none of its own.
    const callWithArguments = (name, scope, relevance) => ({
        begin: [name, /\(/],
        beginScope: { 1: scope },
        end: /\)/,
        relevance,
        contains: [{ begin: /(?=[^)])/, end: /(?=\))/, ...JS, contains: NESTED }],
    })

    const CLASS = { scope: 'selector-class', match: /\.[\w-]+/, relevance: 0 }
    const ID = { scope: 'selector-id', match: /#[\w-]+/, relevance: 0 }
    // `\#{` and `\#[` are literal text.
    const ESCAPE = { match: /\\[#!][{[]/, relevance: 0 }

    // `#[em text]`: tag interpolation, a whole tag inside text. Its parts
    // are added below, once TAG_PARTS exists.
    const TAG_INTERPOLATION = { scope: 'subst', begin: /#\[/, end: /\]/, relevance: 2, contains: [] }
    const TEXT_PARTS = [ESCAPE, INTERPOLATION, TAG_INTERPOLATION]

    // Text after a tag or a `|`, up to the end of the line.
    const TEXT = {
        begin: /(?=\S)/,
        end: /$/,
        relevance: 0,
        contains: TEXT_PARTS,
    }

    // `p= expr` and `p!= expr`: buffered output, JavaScript to the line end.
    const OUTPUT = { match: [/!?=/, /[ \t]*/], scope: { 1: 'operator' }, relevance: 0, starts: { end: /$/, ...JS } }

    // The parts of a tag, in the order Pug allows them: name or `#{…}` or
    // `+mixin(args)`, then classes, ids and `(attributes)` in any order.
    const TAG_PARTS = [
        { scope: 'name', match: /[A-Za-z_][\w-]*(?::[\w-]+)*/, relevance: 0 },
        INTERPOLATION,
        callWithArguments(/\+[\w$-]+/, 'title.function', 2),
        { scope: 'title.function', match: /\+[\w$-]+/, relevance: 0 },
        CLASS,
        ID,
        callWithArguments(/&attributes/, 'keyword', 10),
        ATTRIBUTES_WITH_VALUE,
        ATTRIBUTES,
    ]

    // `li: a(href=x)` — block expansion, another tag follows.
    const BLOCK_EXPANSION = { match: [/:/, /[ \t]+/], scope: { 1: 'punctuation' }, relevance: 0 }

    // A tag and what follows it on its line.
    const TAG_REST = [
        ...TAG_PARTS,
        BLOCK_EXPANSION,
        OUTPUT,
        // `h3 #{ title }`: text that opens with an interpolation is typical
        // of Pug; in Ruby or CoffeeScript, `#{` sits inside quotes.
        { match: /[ \t]+(?=[#!]\{)/, relevance: 3, starts: TEXT },
        { match: /[ \t]+/, relevance: 0, starts: TEXT },
    ]

    const TAG_LINE = {
        begin: /^[ \t]*(?=[A-Za-z_.+]|#[\w{-])/,
        end: /$/,
        relevance: 0,
        contains: TAG_REST,
    }

    // `when 1: p one`, `default: p none` — a case branch may end in block
    // expansion. Its value ends at a `: ` outside brackets and strings.
    const CASE_BRANCH = {
        contains: [
            { begin: /(?=[^:\s])/, end: /(?=:[ \t]|$)/, ...JS, contains: NESTED },
            { ...BLOCK_EXPANSION, starts: { end: /$/, relevance: 0, contains: TAG_REST } },
        ],
    }

    TAG_INTERPOLATION.contains = [
        ...TAG_PARTS,
        { match: /[ \t]+/, starts: { end: /(?=\])/, relevance: 0, contains: TEXT_PARTS } },
    ]

    // A keyword at the start of a line. The keyword carries the relevance;
    // what follows it is a separate mode (`starts`), since a sub-language
    // mode adds no relevance of its own.
    const keywordLine = (keywords, relevance, starts) => ({
        match: [INDENT, keywords, /[ \t]*/],
        scope: { 2: 'keyword' },
        relevance,
        ...(starts && { starts: { end: /$/, relevance: 0, ...starts } }),
    })

    return {
        name: 'Pug',
        aliases: ['jade'],
        case_insensitive: false,
        contains: [
            // `//` is a comment only at the start of a line;
            // after a tag it is text (`span // Blog`).
            { match: [INDENT, /\/\/-.*/], scope: { 2: 'comment' }, relevance: 3 },
            { match: [INDENT, /\/\/.*/], scope: { 2: 'comment' }, relevance: 0 },
            {
                match: [INDENT, /doctype(?:[ \t].*)?$/],
                scope: { 2: 'meta' },
                relevance: 10,
            },
            keywordLine(/(?:extends|include)(?![\w-])/, 10, {
                contains: [
                    { scope: 'meta', match: /:[\w-]+/ },
                    { scope: 'string', match: /[^\s:](?:.*\S)?/ },
                ],
            }),
            {
                match: [INDENT, /mixin/, /[ \t]+/, /[\w$-]+/],
                scope: { 2: 'keyword', 4: 'title.function' },
                relevance: 10,
                starts: {
                    end: /$/,
                    relevance: 0,
                    contains: [{ scope: 'params', begin: /\(/, end: /\)/, excludeBegin: true, excludeEnd: true }],
                },
            },
            {
                match: [INDENT, /each/, /[ \t]+/, /[\w$]+(?:[ \t]*,[ \t]*[\w$]+)?/, /[ \t]+/, /in/, /[ \t]*/],
                scope: { 2: 'keyword', 6: 'keyword' },
                relevance: 5,
                starts: { end: /$/, ...JS },
            },
            {
                match: [INDENT, /for/, /[ \t]+/, /[\w$]+(?:[ \t]*,[ \t]*[\w$]+)?/, /[ \t]+/, /in/, /[ \t]*/],
                scope: { 2: 'keyword', 6: 'keyword' },
                relevance: 0,
                starts: { end: /$/, ...JS },
            },
            keywordLine(/(?:block(?:[ \t]+(?:append|prepend))?|append|prepend)(?![\w-])/, 5),
            keywordLine(/(?:when|default)(?![\w-])/, 0, CASE_BRANCH),
            keywordLine(/(?:else[ \t]+if|if|unless|while|case)(?![\w-])/, 0, JS),
            keywordLine(/(?:else|yield)(?![\w-])/, 0),
            {
                match: [INDENT, /\|/],
                scope: { 2: 'punctuation' },
                relevance: 0,
                starts: { end: /$/, relevance: 0, contains: TEXT_PARTS },
            },
            // `- const x = 1`: unbuffered code.
            {
                match: [INDENT, /-/, /[ \t]+/, /(?:const|let|var)(?=[ \t])/],
                scope: { 2: 'operator', 4: 'keyword' },
                relevance: 2,
                starts: { end: /$/, ...JS },
            },
            {
                match: [INDENT, /-(?=[ \t]|$)/, /[ \t]*/],
                scope: { 2: 'operator' },
                relevance: 0,
                starts: { end: /$/, ...JS },
            },
            // `= expr` and `!= expr` at the start of a line.
            {
                match: [INDENT, /!?=/, /[ \t]*/],
                scope: { 2: 'operator' },
                relevance: 0,
                starts: { end: /$/, ...JS },
            },
            // `:markdown-it(attributes)`: a filter. Its body, on the indented
            // lines below, is not highlighted (see the README).
            {
                match: [INDENT, /:[\w-]+(?::[\w-]+)*/],
                scope: { 2: 'meta' },
                relevance: 0,
                starts: { end: /$/, relevance: 0, contains: [ATTRIBUTES] },
            },
            // `<!DOCTYPE html>`: a line of literal HTML.
            { begin: /^[ \t]*(?=<)/, end: /$/, subLanguage: 'xml', relevance: 0 },
            TAG_LINE,
        ],
    }
}
