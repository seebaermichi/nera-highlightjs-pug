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
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        {
            scope: 'string',
            begin: '`',
            end: '`',
            contains: [
                hljs.BACKSLASH_ESCAPE,
                {
                    scope: 'subst',
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

    const ATTRIBUTES = {
        begin: /\(/,
        end: /\)/,
        relevance: 0,
        contains: [
            { scope: 'attr', match: /[^\s(),=!'"`]+/, relevance: 0 },
            ATTRIBUTE_VALUE,
        ],
    }

    // `(…)` holding JavaScript after a keyword or a name: mixin arguments,
    // `&attributes(…)`.
    const callWithArguments = (name, scope) => ({
        begin: [name, /\(/],
        beginScope: { 1: scope },
        end: /\)/,
        excludeEnd: true,
        ...JS,
        contains: NESTED,
    })

    const CLASS = { scope: 'selector-class', match: /\.[\w-]+/, relevance: 0 }
    const ID = { scope: 'selector-id', match: /#[\w-]+/, relevance: 0 }
    // Text after a tag or a `|`, up to the end of the line.
    const TEXT = {
        begin: /(?=\S)/,
        end: /$/,
        relevance: 0,
        contains: [INTERPOLATION],
    }

    // The parts of a tag, in the order Pug allows them: name or `#{…}` or
    // `+mixin(args)`, then classes, ids and `(attributes)` in any order.
    const TAG_PARTS = [
        { scope: 'name', match: /[A-Za-z_][\w-]*(?::[\w-]+)*/, relevance: 0 },
        INTERPOLATION,
        callWithArguments(/\+[\w$-]+/, 'title.function'),
        { scope: 'title.function', match: /\+[\w$-]+/, relevance: 0 },
        CLASS,
        ID,
        callWithArguments(/&attributes/, 'keyword'),
        ATTRIBUTES,
    ]

    const TAG_LINE = {
        begin: /^[ \t]*(?=[A-Za-z_.+]|#[\w{-])/,
        end: /$/,
        relevance: 0,
        contains: [
            ...TAG_PARTS,
            // `li: a(href=x)` — block expansion, another tag follows.
            { match: [/:/, /[ \t]+/], scope: { 1: 'punctuation' } },
            { match: /[ \t]+/, starts: TEXT },
        ],
    }

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
                match: [INDENT, /(?:each|for)/, /[ \t]+/, /[\w$]+(?:[ \t]*,[ \t]*[\w$]+)?/, /[ \t]+/, /in/, /[ \t]*/],
                scope: { 2: 'keyword', 6: 'keyword' },
                relevance: 5,
                starts: { end: /$/, ...JS },
            },
            keywordLine(/(?:block(?:[ \t]+(?:append|prepend))?|append|prepend)(?![\w-])/, 5),
            keywordLine(/(?:else[ \t]+if|if|unless|while|case|when)(?![\w-])/, 1, JS),
            keywordLine(/(?:else|default|yield)(?![\w-])/, 1),
            {
                match: [INDENT, /\|/],
                scope: { 2: 'punctuation' },
                relevance: 0,
                starts: { end: /$/, relevance: 0, contains: [INTERPOLATION] },
            },
            TAG_LINE,
        ],
    }
}
