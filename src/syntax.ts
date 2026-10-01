// LightCode v0.2
// src/syntax.ts

export type Language =
    | "html"
    | "css"
    | "javascript"
    | "typescript"
    | "json"
    | "text";

export class SyntaxHighlighter {

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    public highlight(
        code: string,
        language: Language
    ): string {

        const escaped =
            this.escapeHtml(code);

        switch (language) {

            case "html":
                return this.highlightHTML(
                    escaped
                );

            case "css":
                return this.highlightCSS(
                    escaped
                );

            case "javascript":
            case "typescript":
                return this.highlightJS(
                    escaped
                );

            case "json":
                return this.highlightJSON(
                    escaped
                );

            default:
                return escaped;
        }
    }

    private highlightHTML(
        code: string
    ): string {

        let result = code;

        result = result.replace(
            /(&lt;!--[\s\S]*?--&gt;)/g,
            `<span class="syntax-comment">$1</span>`
        );

        result = result.replace(
            /(&lt;\/?)([a-zA-Z][\w-]*)/g,
            `$1<span class="syntax-tag">$2</span>`
        );

        result = result.replace(
            /(\s)([a-zA-Z_:][\w:.-]*)(=)/g,
            `$1<span class="syntax-attribute">$2</span>$3`
        );

        result = result.replace(
            /(&quot;.*?&quot;|&#39;.*?&#39;)/g,
            `<span class="syntax-string">$1</span>`
        );

        result = result.replace(
            /(&lt;|&gt;|\/&gt;)/g,
            `<span class="syntax-bracket">$1</span>`
        );

        return result;
    }

    private highlightJS(
        code: string
    ): string {

        let result = code;

        result = result.replace(
            /(\/\/.*)$/gm,
            `<span class="syntax-comment">$1</span>`
        );

        result = result.replace(
            /(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g,
            `<span class="syntax-string">$1</span>`
        );

        const keywords =
            [
                "const",
                "let",
                "var",
                "function",
                "return",
                "if",
                "else",
                "for",
                "while",
                "class",
                "extends",
                "new",
                "import",
                "export",
                "from",
                "as",
                "interface",
                "type",
                "public",
                "private",
                "protected",
                "async",
                "await",
                "throw",
                "try",
                "catch",
                "switch",
                "case",
                "break",
                "continue",
                "true",
                "false",
                "null",
                "undefined"
            ];

        const keywordPattern =
            new RegExp(
                `\\b(${keywords.join("|")})\\b`,
                "g"
            );

        result = result.replace(
            keywordPattern,
            `<span class="syntax-keyword">$1</span>`
        );

        result = result.replace(
            /\b(\d+(?:\.\d+)?)\b/g,
            `<span class="syntax-number">$1</span>`
        );

        return result;
    }

    private highlightCSS(
        code: string
    ): string {

        let result = code;

        result = result.replace(
            /(\/\*[\s\S]*?\*\/)/g,
            `<span class="syntax-comment">$1</span>`
        );

        result = result.replace(
            /([.#]?[a-zA-Z_-][\w-]*)(\s*\{)/g,
            `<span class="syntax-selector">$1</span>$2`
        );

        result = result.replace(
            /([a-zA-Z-]+)(\s*:)/g,
            `<span class="syntax-property">$1</span>$2`
        );

        result = result.replace(
            /(&quot;.*?&quot;|&#39;.*?&#39;)/g,
            `<span class="syntax-string">$1</span>`
        );

        result = result.replace(
            /\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms)?\b/g,
            `<span class="syntax-number">$1$2</span>`
        );

        return result;
    }

    private highlightJSON(
        code: string
    ): string {

        let result = code;

        result = result.replace(
            /(&quot;.*?&quot;)(\s*:)/g,
            `<span class="syntax-property">$1</span>$2`
        );

        result = result.replace(
            /(&quot;.*?&quot;)/g,
            `<span class="syntax-string">$1</span>`
        );

        result = result.replace(
            /\b(true|false|null)\b/g,
            `<span class="syntax-keyword">$1</span>`
        );

        result = result.replace(
            /\b-?\d+(?:\.\d+)?\b/g,
            `<span class="syntax-number">$&</span>`
        );

        return result;
    }
}
