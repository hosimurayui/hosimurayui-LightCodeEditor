// LightCode v0.2
// src/editor.ts
// エディタ本体

export interface EditorOptions {
    editor: HTMLTextAreaElement;
    lineNumbers: HTMLElement;
    cursorPosition?: HTMLElement;
    onChange?: (content: string) => void;
}

export interface SelectionRange {
    start: number;
    end: number;
}

export interface SearchResult {
    index: number;
    length: number;
    line: number;
    column: number;
}

export class CodeEditor {

    private editor: HTMLTextAreaElement;
    private lineNumbers: HTMLElement;
    private cursorPosition?: HTMLElement;

    private onChange?: (content: string) => void;

    private tabSize: number = 4;
    private useSpaces: boolean = true;

    private wordWrap: boolean = false;
    private readOnly: boolean = false;

    private searchResults: SearchResult[] = [];
    private currentSearchIndex: number = -1;

    private undoStack: string[] = [];
    private redoStack: string[] = [];

    private lastValue: string = "";

    constructor(options: EditorOptions) {

        this.editor = options.editor;
        this.lineNumbers = options.lineNumbers;
        this.cursorPosition =
            options.cursorPosition;

        this.onChange =
            options.onChange;

        this.lastValue =
            this.editor.value;

        this.initialize();
    }

    /* =====================================================
       初期化
    ===================================================== */

    private initialize(): void {

        this.updateLineNumbers();
        this.updateCursorPosition();

        this.editor.addEventListener(
            "input",
            () => {
                this.handleInput();
            }
        );

        this.editor.addEventListener(
            "keydown",
            event => {
                this.handleKeyDown(event);
            }
        );

        this.editor.addEventListener(
            "keyup",
            () => {
                this.updateCursorPosition();
            }
        );

        this.editor.addEventListener(
            "click",
            () => {
                this.updateCursorPosition();
            }
        );

        this.editor.addEventListener(
            "select",
            () => {
                this.updateCursorPosition();
            }
        );

        this.editor.addEventListener(
            "scroll",
            () => {
                this.syncScroll();
            }
        );

        this.editor.addEventListener(
            "paste",
            event => {
                this.handlePaste(event);
            }
        );

        this.editor.addEventListener(
            "cut",
            () => {
                setTimeout(() => {
                    this.handleInput();
                }, 0);
            }
        );
    }

    /* =====================================================
       基本値
    ===================================================== */

    public getValue(): string {
        return this.editor.value;
    }

    public setValue(
        value: string,
        notify: boolean = false
    ): void {

        this.editor.value =
            value;

        this.lastValue =
            value;

        this.undoStack = [];
        this.redoStack = [];

        this.updateLineNumbers();
        this.updateCursorPosition();

        if (notify) {
            this.onChange?.(value);
        }
    }

    public clear(): void {
        this.setValue("");
    }

    public focus(): void {
        this.editor.focus();
    }

    public blur(): void {
        this.editor.blur();
    }

    /* =====================================================
       編集
    ===================================================== */

    private handleInput(): void {

        const current =
            this.editor.value;

        if (current !== this.lastValue) {

            this.undoStack.push(
                this.lastValue
            );

            if (
                this.undoStack.length > 100
            ) {
                this.undoStack.shift();
            }

            this.redoStack = [];

            this.lastValue =
                current;
        }

        this.updateLineNumbers();
        this.updateCursorPosition();

        this.onChange?.(
            current
        );
    }

    /* =====================================================
       キーボード
    ===================================================== */

    private handleKeyDown(
        event: KeyboardEvent
    ): void {

        const ctrl =
            event.ctrlKey ||
            event.metaKey;

        /* ---------------------------------------------
           Ctrl + Z
        --------------------------------------------- */

        if (
            ctrl &&
            !event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {
            event.preventDefault();
            this.undo();
            return;
        }

        /* ---------------------------------------------
           Ctrl + Shift + Z
        --------------------------------------------- */

        if (
            ctrl &&
            event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {
            event.preventDefault();
            this.redo();
            return;
        }

        /* ---------------------------------------------
           Ctrl + Y
        --------------------------------------------- */

        if (
            ctrl &&
            event.key.toLowerCase() === "y"
        ) {
            event.preventDefault();
            this.redo();
            return;
        }

        /* ---------------------------------------------
           Home
        --------------------------------------------- */

        if (
            event.key === "Home" &&
            !ctrl
        ) {
            this.handleHomeKey(event);
            return;
        }

        /* ---------------------------------------------
           Tab
        --------------------------------------------- */

        if (event.key === "Tab") {

            event.preventDefault();

            if (event.shiftKey) {
                this.removeIndent();
            } else {
                this.insertIndent();
            }

            return;
        }

        /* ---------------------------------------------
           Enter
        --------------------------------------------- */

        if (
            event.key === "Enter"
        ) {
            this.handleEnterKey(event);
            return;
        }

        /* ---------------------------------------------
           Backspace
        --------------------------------------------- */

        if (
            event.key === "Backspace"
        ) {
            this.handleBackspace(event);
            return;
        }

        /* ---------------------------------------------
           Ctrl + /
        --------------------------------------------- */

        if (
            ctrl &&
            event.key === "/"
        ) {
            event.preventDefault();
            this.toggleComment();
            return;
        }

        /* ---------------------------------------------
           Ctrl + D
        --------------------------------------------- */

        if (
            ctrl &&
            event.key.toLowerCase() === "d"
        ) {
            event.preventDefault();
            this.duplicateLine();
            return;
        }

        /* ---------------------------------------------
           Alt + ArrowUp
        --------------------------------------------- */

        if (
            event.altKey &&
            event.key === "ArrowUp"
        ) {
            event.preventDefault();
            this.moveLineUp();
            return;
        }

        /* ---------------------------------------------
           Alt + ArrowDown
        --------------------------------------------- */

        if (
            event.altKey &&
            event.key === "ArrowDown"
        ) {
            event.preventDefault();
            this.moveLineDown();
            return;
        }

        /* ---------------------------------------------
           Ctrl + A
        --------------------------------------------- */

        if (
            ctrl &&
            event.key.toLowerCase() === "a"
        ) {
            this.updateCursorPosition();
            return;
        }
    }

    /* =====================================================
       Enter
    ===================================================== */

    private handleEnterKey(
        event: KeyboardEvent
    ): void {

        if (this.readOnly) {
            return;
        }

        event.preventDefault();

        const position =
            this.editor.selectionStart;

        const before =
            this.editor.value.substring(
                0,
                position
            );

        const lines =
            before.split("\n");

        const currentLine =
            lines[lines.length - 1];

        const indentation =
            currentLine.match(
                /^[ \t]*/
            )?.[0] ?? "";

        let extraIndent = "";

        const trimmed =
            currentLine.trimEnd();

        if (
            trimmed.endsWith("{") ||
            trimmed.endsWith("[") ||
            trimmed.endsWith("(")
        ) {
            extraIndent =
                this.getIndentString();
        }

        const insert =
            "\n" +
            indentation +
            extraIndent;

        this.replaceSelection(
            insert
        );
    }

    /* =====================================================
       Backspace
    ===================================================== */

    private handleBackspace(
        event: KeyboardEvent
    ): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        if (start !== end) {
            return;
        }

        if (start === 0) {
            return;
        }

        const before =
            this.editor.value.substring(
                0,
                start
            );

        const lineStart =
            before.lastIndexOf("\n") + 1;

        const lineText =
            before.substring(
                lineStart
            );

        const indent =
            lineText.match(
                /^[ \t]*/
            )?.[0] ?? "";

        if (
            indent.length > 0 &&
            lineText.trim().length === 0
        ) {

            event.preventDefault();

            const removeCount =
                Math.min(
                    this.tabSize,
                    indent.length
                );

            const newStart =
                start - removeCount;

            this.editor.setSelectionRange(
                newStart,
                start
            );

            this.replaceSelection("");

            return;
        }
    }

    /* =====================================================
       Home
    ===================================================== */

    private handleHomeKey(
        event: KeyboardEvent
    ): void {

        event.preventDefault();

        const position =
            this.editor.selectionStart;

        const lineStart =
            this.getLineStart(position);

        const lineEnd =
            this.getLineEnd(position);

        const line =
            this.editor.value.substring(
                lineStart,
                lineEnd
            );

        const firstNonSpace =
            line.search(/\S/);

        const target =
            firstNonSpace === -1
                ? lineEnd
                : lineStart + firstNonSpace;

        if (position === target) {
            this.editor.setSelectionRange(
                lineStart,
                lineStart
            );
        } else {
            this.editor.setSelectionRange(
                target,
                target
            );
        }

        this.updateCursorPosition();
    }

    /* =====================================================
       Tab
    ===================================================== */

    private insertIndent(): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        if (
            start !== end
        ) {

            this.indentSelection();

            return;
        }

        const indent =
            this.getIndentString();

        this.replaceSelection(
            indent
        );
    }

    private removeIndent(): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        if (
            start !== end
        ) {

            this.unindentSelection();

            return;
        }

        const position =
            this.editor.selectionStart;

        const lineStart =
            this.getLineStart(
                position
            );

        const before =
            this.editor.value.substring(
                lineStart,
                position
            );

        if (
            before.length === 0
        ) {
            return;
        }

        const spaces =
            this.countIndentAtEnd(
                before
            );

        if (spaces === 0) {
            return;
        }

        const remove =
            Math.min(
                this.tabSize,
                spaces
            );

        this.editor.setSelectionRange(
            position - remove,
            position
        );

        this.replaceSelection("");
    }

    private getIndentString(): string {

        if (this.useSpaces) {
            return " ".repeat(
                this.tabSize
            );
        }

        return "\t";
    }

    /* =====================================================
       選択範囲インデント
    ===================================================== */

    private indentSelection(): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        const value =
            this.editor.value;

        const blockStart =
            this.getLineStart(start);

        const blockEnd =
            this.getLineEnd(end);

        const block =
            value.substring(
                blockStart,
                blockEnd
            );

        const indent =
            this.getIndentString();

        const lines =
            block.split("\n");

        const result =
            lines
                .map(line => indent + line)
                .join("\n");

        this.editor.setRangeText(
            result,
            blockStart,
            blockEnd,
            "select"
        );

        this.editor.setSelectionRange(
            start + indent.length,
            end + indent.length * lines.length
        );

        this.handleInput();
    }

    private unindentSelection(): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        const blockStart =
            this.getLineStart(start);

        const blockEnd =
            this.getLineEnd(end);

        const block =
            this.editor.value.substring(
                blockStart,
                blockEnd
            );

        const lines =
            block.split("\n");

        let removedBeforeStart = 0;
        let removedCount = 0;

        const result =
            lines
                .map(
                    (line, index) => {

                        const count =
                            this.getIndentCount(
                                line
                            );

                        const remove =
                            Math.min(
                                this.tabSize,
                                count
                            );

                        if (index === 0) {
                            removedBeforeStart =
                                remove;
                        }

                        removedCount +=
                            remove;

                        return line.substring(
                            remove
                        );
                    }
                )
                .join("\n");

        this.editor.setRangeText(
            result,
            blockStart,
            blockEnd,
            "select"
        );

        this.editor.setSelectionRange(
            Math.max(
                blockStart,
                start - removedBeforeStart
            ),
            Math.max(
                blockStart,
                end - removedCount
            )
        );

        this.handleInput();
    }

    /* =====================================================
       コメント
    ===================================================== */

    public toggleComment(): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        const blockStart =
            this.getLineStart(start);

        const blockEnd =
            this.getLineEnd(end);

        const block =
            this.editor.value.substring(
                blockStart,
                blockEnd
            );

        const lines =
            block.split("\n");

        const nonEmpty =
            lines.filter(
                line => line.trim().length > 0
            );

        const shouldRemove =
            nonEmpty.length > 0 &&
            nonEmpty.every(
                line =>
                    line.trimStart()
                        .startsWith("//")
            );

        const result =
            lines.map(line => {

                const leading =
                    line.match(/^\s*/)?.[0] ?? "";

                const rest =
                    line.substring(
                        leading.length
                    );

                if (shouldRemove) {

                    if (
                        rest.startsWith("// ")
                    ) {
                        return (
                            leading +
                            rest.substring(3)
                        );
                    }

                    if (
                        rest.startsWith("//")
                    ) {
                        return (
                            leading +
                            rest.substring(2)
                        );
                    }

                    return line;
                }

                if (
                    line.trim().length === 0
                ) {
                    return line;
                }

                return (
                    leading +
                    "// " +
                    rest
                );
            }).join("\n");

        this.editor.setRangeText(
            result,
            blockStart,
            blockEnd,
            "select"
        );

        this.handleInput();
    }

    /* =====================================================
       行複製
    ===================================================== */

    public duplicateLine(): void {

        const position =
            this.editor.selectionStart;

        const start =
            this.getLineStart(
                position
            );

        const end =
            this.getLineEnd(
                position
            );

        const line =
            this.editor.value.substring(
                start,
                end
            );

        const insert =
            "\n" + line;

        this.editor.setRangeText(
            insert,
            end,
            end,
            "end"
        );

        this.handleInput();
    }

    /* =====================================================
       行移動
    ===================================================== */

    public moveLineUp(): void {

        const position =
            this.editor.selectionStart;

        const start =
            this.getLineStart(
                position
            );

        if (start === 0) {
            return;
        }

        const previousStart =
            this.getLineStart(
                start - 1
            );

        const end =
            this.getLineEnd(
                position
            );

        const previousLine =
            this.editor.value.substring(
                previousStart,
                start - 1
            );

        const currentLine =
            this.editor.value.substring(
                start,
                end
            );

        const replacement =
            currentLine +
            "\n" +
            previousLine;

        this.editor.setRangeText(
            replacement,
            previousStart,
            end,
            "select"
        );

        this.handleInput();
    }

    public moveLineDown(): void {

        const position =
            this.editor.selectionStart;

        const start =
            this.getLineStart(
                position
            );

        const end =
            this.getLineEnd(
                position
            );

        if (
            end >= this.editor.value.length
        ) {
            return;
        }

        const nextEnd =
            this.getLineEnd(
                end + 1
            );

        const currentLine =
            this.editor.value.substring(
                start,
                end
            );

        const nextLine =
            this.editor.value.substring(
                end + 1,
                nextEnd
            );

        const replacement =
            nextLine +
            "\n" +
            currentLine;

        this.editor.setRangeText(
            replacement,
            start,
            nextEnd,
            "select"
        );

        this.handleInput();
    }

    /* =====================================================
       Undo / Redo
    ===================================================== */

    public undo(): void {

        if (
            this.undoStack.length === 0
        ) {
            return;
        }

        const current =
            this.editor.value;

        const previous =
            this.undoStack.pop();

        if (previous === undefined) {
            return;
        }

        this.redoStack.push(
            current
        );

        this.editor.value =
            previous;

        this.lastValue =
            previous;

        this.updateLineNumbers();
        this.updateCursorPosition();

        this.onChange?.(
            previous
        );
    }

    public redo(): void {

        if (
            this.redoStack.length === 0
        ) {
            return;
        }

        const current =
            this.editor.value;

        const next =
            this.redoStack.pop();

        if (next === undefined) {
            return;
        }

        this.undoStack.push(
            current
        );

        this.editor.value =
            next;

        this.lastValue =
            next;

        this.updateLineNumbers();
        this.updateCursorPosition();

        this.onChange?.(
            next
        );
    }

    /* =====================================================
       検索
    ===================================================== */

    public search(
        query: string
    ): SearchResult[] {

        this.searchResults = [];
        this.currentSearchIndex = -1;

        if (!query) {
            return [];
        }

        const text =
            this.editor.value;

        let index = 0;

        while (true) {

            index =
                text.indexOf(
                    query,
                    index
                );

            if (index === -1) {
                break;
            }

            const before =
                text.substring(
                    0,
                    index
                );

            const lines =
                before.split("\n");

            const line =
                lines.length;

            const column =
                lines[lines.length - 1]
                    .length + 1;

            this.searchResults.push({
                index,
                length: query.length,
                line,
                column
            });

            index +=
                Math.max(
                    query.length,
                    1
                );
        }

        return [
            ...this.searchResults
        ];
    }

    public findNext(
        query: string
    ): SearchResult | null {

        const results =
            this.search(query);

        if (
            results.length === 0
        ) {
            return null;
        }

        this.currentSearchIndex =
            0;

        const result =
            results[
                this.currentSearchIndex
            ];

        this.selectRange(
            result.index,
            result.index +
            result.length
        );

        return result;
    }

    public findNextExisting(): SearchResult | null {

        if (
            this.searchResults.length === 0
        ) {
            return null;
        }

        this.currentSearchIndex =
            (
                this.currentSearchIndex + 1
            ) %
            this.searchResults.length;

        const result =
            this.searchResults[
                this.currentSearchIndex
            ];

        this.selectRange(
            result.index,
            result.index +
            result.length
        );

        return result;
    }

    public findPreviousExisting(): SearchResult | null {

        if (
            this.searchResults.length === 0
        ) {
            return null;
        }

        this.currentSearchIndex--;

        if (
            this.currentSearchIndex < 0
        ) {
            this.currentSearchIndex =
                this.searchResults.length - 1;
        }

        const result =
            this.searchResults[
                this.currentSearchIndex
            ];

        this.selectRange(
            result.index,
            result.index +
            result.length
        );

        return result;
    }

    /* =====================================================
       置換
    ===================================================== */

    public replace(
        search: string,
        replacement: string
    ): boolean {

        if (!search) {
            return false;
        }

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        const selected =
            this.editor.value.substring(
                start,
                end
            );

        if (
            selected === search
        ) {
            this.editor.setRangeText(
                replacement,
                start,
                end,
                "end"
            );

            this.handleInput();

            return true;
        }

        const index =
            this.editor.value.indexOf(
                search
            );

        if (index === -1) {
            return false;
        }

        this.editor.setRangeText(
            replacement,
            index,
            index + search.length,
            "end"
        );

        this.handleInput();

        return true;
    }

    public replaceAll(
        search: string,
        replacement: string
    ): number {

        if (!search) {
            return 0;
        }

        const value =
            this.editor.value;

        let count = 0;
        let index = 0;

        while (true) {

            index =
                value.indexOf(
                    search,
                    index
                );

            if (index === -1) {
                break;
            }

            count++;

            index +=
                search.length;
        }

        if (count === 0) {
            return 0;
        }

        this.editor.value =
            value.split(search)
                .join(replacement);

        this.handleInput();

        return count;
    }

    /* =====================================================
       選択
    ===================================================== */

    public getSelection(): string {

        return this.editor.value.substring(
            this.editor.selectionStart,
            this.editor.selectionEnd
        );
    }

    public getSelectionRange(): SelectionRange {

        return {
            start:
                this.editor.selectionStart,

            end:
                this.editor.selectionEnd
        };
    }

    public selectAll(): void {
        this.editor.select();
        this.updateCursorPosition();
    }

    public selectRange(
        start: number,
        end: number
    ): void {

        this.editor.focus();

        this.editor.setSelectionRange(
            start,
            end
        );

        this.updateCursorPosition();
    }

    public replaceSelection(
        text: string
    ): void {

        const start =
            this.editor.selectionStart;

        const end =
            this.editor.selectionEnd;

        this.editor.setRangeText(
            text,
            start,
            end,
            "end"
        );

        this.handleInput();
    }

    /* =====================================================
       行番号
    ===================================================== */

    public updateLineNumbers(): void {

        const value =
            this.editor.value;

        const count =
            value.split("\n").length;

        let result = "";

        for (
            let i = 1;
            i <= count;
            i++
        ) {
            result +=
                i.toString();

            if (
                i < count
            ) {
                result += "\n";
            }
        }

        this.lineNumbers.textContent =
            result;
    }

    /* =====================================================
       カーソル
    ===================================================== */

    public updateCursorPosition(): void {

        if (!this.cursorPosition) {
            return;
        }

        const position =
            this.editor.selectionStart;

        const before =
            this.editor.value.substring(
                0,
                position
            );

        const lines =
            before.split("\n");

        const line =
            lines.length;

        const column =
            lines[lines.length - 1]
                .length + 1;

        const selected =
            this.editor.selectionEnd -
            this.editor.selectionStart;

        if (selected > 0) {

            this.cursorPosition.textContent =
                `Ln ${line}, Col ${column} ` +
                `(${selected} selected)`;

        } else {

            this.cursorPosition.textContent =
                `Ln ${line}, Col ${column}`;
        }
    }

    /* =====================================================
       スクロール
    ===================================================== */

    private syncScroll(): void {

        this.lineNumbers.scrollTop =
            this.editor.scrollTop;

        this.lineNumbers.scrollLeft =
            0;
    }

    /* =====================================================
       行処理
    ===================================================== */

    private getLineStart(
        position: number
    ): number {

        const index =
            this.editor.value.lastIndexOf(
                "\n",
                position - 1
            );

        return index === -1
            ? 0
            : index + 1;
    }

    private getLineEnd(
        position: number
    ): number {

        const index =
            this.editor.value.indexOf(
                "\n",
                position
            );

        return index === -1
            ? this.editor.value.length
            : index;
    }

    /* =====================================================
       インデント計算
    ===================================================== */

    private getIndentCount(
        line: string
    ): number {

        const match =
            line.match(
                /^[ \t]*/
            );

        if (!match) {
            return 0;
        }

        let count = 0;

        for (
            const character of match[0]
        ) {

            if (
                character === "\t"
            ) {
                count +=
                    this.tabSize;
            } else {
                count++;
            }
        }

        return count;
    }

    private countIndentAtEnd(
        text: string
    ): number {

        const match =
            text.match(
                /[ \t]+$/
            );

        if (!match) {
            return 0;
        }

        return this.getIndentCount(
            match[0]
        );
    }

    /* =====================================================
       貼り付け
    ===================================================== */

    private handlePaste(
        event: ClipboardEvent
    ): void {

        if (this.readOnly) {
            event.preventDefault();
            return;
        }

        const clipboard =
            event.clipboardData;

        if (!clipboard) {
            return;
        }

        const text =
            clipboard.getData(
                "text/plain"
            );

        if (!text) {
            return;
        }

        event.preventDefault();

        const normalized =
            text.replace(
                /\r\n/g,
                "\n"
            );

        this.replaceSelection(
            normalized
        );
    }

    /* =====================================================
       設定
    ===================================================== */

    public setTabSize(
        size: number
    ): void {

        if (
            !Number.isFinite(size)
        ) {
            return;
        }

        if (
            size < 1 ||
            size > 16
        ) {
            return;
        }

        this.tabSize =
            Math.floor(size);
    }

    public getTabSize(): number {
        return this.tabSize;
    }

    public setUseSpaces(
        enabled: boolean
    ): void {
        this.useSpaces =
            enabled;
    }

    public setWordWrap(
        enabled: boolean
    ): void {

        this.wordWrap =
            enabled;

        this.editor.style.whiteSpace =
            enabled
                ? "pre-wrap"
                : "pre";
    }

    public isWordWrapEnabled(): boolean {
        return this.wordWrap;
    }

    public setReadOnly(
        enabled: boolean
    ): void {

        this.readOnly =
            enabled;

        this.editor.readOnly =
            enabled;
    }

    public isReadOnly(): boolean {
        return this.readOnly;
    }

    /* =====================================================
       行取得
    ===================================================== */

    public getLine(
        lineNumber: number
    ): string | null {

        if (
            lineNumber < 1
        ) {
            return null;
        }

        const lines =
            this.editor.value.split("\n");

        if (
            lineNumber > lines.length
        ) {
            return null;
        }

        return lines[
            lineNumber - 1
        ];
    }

    public getLineCount(): number {

        return this.editor.value
            .split("\n")
            .length;
    }

    /* =====================================================
       ファイルサイズ
    ===================================================== */

    public getCharacterCount(): number {
        return this.editor.value.length;
    }

    public getByteSize(): number {

        return new Blob([
            this.editor.value
        ]).size;
    }

    /* =====================================================
       インデックス
    ===================================================== */

    public getCurrentLineNumber(): number {

        const position =
            this.editor.selectionStart;

        return (
            this.editor.value
                .substring(0, position)
                .split("\n")
                .length
        );
    }

    public getCurrentColumn(): number {

        const position =
            this.editor.selectionStart;

        const start =
            this.getLineStart(
                position
            );

        return position - start + 1;
    }

    /* =====================================================
       行へ移動
    ===================================================== */

    public goToLine(
        lineNumber: number,
        column: number = 1
    ): boolean {

        if (
            lineNumber < 1
        ) {
            return false;
        }

        const lines =
            this.editor.value.split("\n");

        if (
            lineNumber > lines.length
        ) {
            return false;
        }

        let position = 0;

        for (
            let i = 0;
            i < lineNumber - 1;
            i++
        ) {
            position +=
                lines[i].length + 1;
        }

        position +=
            Math.max(
                0,
                Math.min(
                    column - 1,
                    lines[lineNumber - 1].length
                )
            );

        this.selectRange(
            position,
            position
        );

        this.editor.focus();

        return true;
    }

    /* =====================================================
       行削除
    ===================================================== */

    public deleteCurrentLine(): void {

        const position =
            this.editor.selectionStart;

        const start =
            this.getLineStart(
                position
            );

        let end =
            this.getLineEnd(
                position
            );

        if (
            end <
            this.editor.value.length
        ) {
            end++;
        } else if (
            start > 0
        ) {
            end = start;
        }

        this.editor.setRangeText(
            "",
            start,
            end,
            "start"
        );

        this.handleInput();
    }

    /* =====================================================
       空白削除
    ===================================================== */

    public trimTrailingWhitespace(): number {

        const original =
            this.editor.value;

        const lines =
            original.split("\n");

        let removed = 0;

        const result =
            lines.map(line => {

                const trimmed =
                    line.replace(
                        /[ \t]+$/,
                        ""
                    );

                removed +=
                    line.length -
                    trimmed.length;

                return trimmed;

            }).join("\n");

        if (
            removed > 0
        ) {
            this.editor.value =
                result;

            this.handleInput();
        }

        return removed;
    }

    /* =====================================================
       全体インデント
    ===================================================== */

    public formatIndentation(): void {

        const lines =
            this.editor.value
                .split("\n");

        let level = 0;

        const result =
            lines.map(line => {

                const trimmed =
                    line.trim();

                if (
                    trimmed.length === 0
                ) {
                    return "";
                }

                if (
                    /^[}\])]/.test(trimmed)
                ) {
                    level =
                        Math.max(
                            0,
                            level - 1
                        );
                }

                const output =
                    this.getIndentString()
                        .repeat(level) +
                    trimmed;

                if (
                    /[{[(]$/.test(trimmed)
                ) {
                    level++;
                }

                return output;

            }).join("\n");

        this.editor.value =
            result;

        this.handleInput();
    }

    /* =====================================================
       公開状態
    ===================================================== */

    public getState() {

        return {
            value:
                this.editor.value,

            cursor:
                this.editor.selectionStart,

            selectionStart:
                this.editor.selectionStart,

            selectionEnd:
                this.editor.selectionEnd,

            tabSize:
                this.tabSize,

            useSpaces:
                this.useSpaces,

            wordWrap:
                this.wordWrap,

            readOnly:
                this.readOnly
        };
    }
}
