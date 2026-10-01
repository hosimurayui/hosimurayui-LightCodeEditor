// LightCode v0.2
// src/main.ts
// メインアプリケーション

type FileType = "html" | "css" | "javascript" | "typescript" | "json" | "text";

interface EditorFile {
    id: number;
    name: string;
    content: string;
    language: FileType;
    modified: boolean;
}

interface EditorState {
    files: EditorFile[];
    activeFileId: number | null;
    nextFileId: number;
    theme: "dark" | "light";
    sidebarVisible: boolean;
    statusMessage: string;
}

const state: EditorState = {
    files: [],
    activeFileId: null,
    nextFileId: 1,
    theme: "dark",
    sidebarVisible: true,
    statusMessage: "準備完了"
};

const app = document.getElementById("app");

if (!app) {
    throw new Error("LightCode: #app が見つかりません。");
}

/* =========================================================
   HTML
========================================================= */

app.innerHTML = `
<div class="lightcode">

    <header class="topbar">
        <div class="brand">
            <span class="brand-icon">LC</span>
            <span class="brand-name">LightCode</span>
        </div>

        <nav class="menu">
            <button id="newFileButton">新規</button>
            <button id="openFileButton">開く</button>
            <button id="saveFileButton">保存</button>
            <button id="saveAsButton">名前を付けて保存</button>
        </nav>

        <div class="topbar-right">
            <button id="themeButton">テーマ</button>
            <button id="sidebarButton">サイドバー</button>
        </div>
    </header>

    <main class="workspace">

        <aside id="sidebar" class="sidebar">

            <div class="sidebar-title">
                <span>EXPLORER</span>
                <button id="addFileButton">＋</button>
            </div>

            <div id="fileList" class="file-list"></div>

        </aside>

        <section class="editor-area">

            <div id="tabs" class="tabs"></div>

            <div class="editor-container">

                <div id="lineNumbers" class="line-numbers">1</div>

                <textarea
                    id="editor"
                    class="editor"
                    spellcheck="false"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    placeholder="ここにコードを入力..."
                ></textarea>

            </div>

            <footer class="statusbar">

                <span id="statusMessage">
                    準備完了
                </span>

                <span class="status-spacer"></span>

                <span id="cursorPosition">
                    Ln 1, Col 1
                </span>

                <span id="languageStatus">
                    Plain Text
                </span>

                <span id="encodingStatus">
                    UTF-8
                </span>

            </footer>

        </section>

    </main>

    <input
        id="fileInput"
        type="file"
        hidden
        multiple
    />

</div>
`;

/* =========================================================
   DOM
========================================================= */

const editor = document.getElementById("editor") as HTMLTextAreaElement;
const lineNumbers = document.getElementById("lineNumbers") as HTMLDivElement;
const fileList = document.getElementById("fileList") as HTMLDivElement;
const tabs = document.getElementById("tabs") as HTMLDivElement;
const statusMessage = document.getElementById("statusMessage") as HTMLSpanElement;
const cursorPosition = document.getElementById("cursorPosition") as HTMLSpanElement;
const languageStatus = document.getElementById("languageStatus") as HTMLSpanElement;
const sidebar = document.getElementById("sidebar") as HTMLElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;

const newFileButton = document.getElementById("newFileButton") as HTMLButtonElement;
const openFileButton = document.getElementById("openFileButton") as HTMLButtonElement;
const saveFileButton = document.getElementById("saveFileButton") as HTMLButtonElement;
const saveAsButton = document.getElementById("saveAsButton") as HTMLButtonElement;
const themeButton = document.getElementById("themeButton") as HTMLButtonElement;
const sidebarButton = document.getElementById("sidebarButton") as HTMLButtonElement;
const addFileButton = document.getElementById("addFileButton") as HTMLButtonElement;

/* =========================================================
   CSS
========================================================= */

const style = document.createElement("style");

style.textContent = `
* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family:
        "Segoe UI",
        "Yu Gothic UI",
        Meiryo,
        sans-serif;
}

body {
    background: #111111;
    color: #eeeeee;
}

button {
    font-family: inherit;
}

.lightcode {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #111111;
}

.topbar {
    height: 46px;
    min-height: 46px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #2b2b2b;
    background: #181818;
    padding: 0 10px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 150px;
}

.brand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #303030;
    font-size: 11px;
    font-weight: bold;
}

.brand-name {
    font-size: 14px;
    font-weight: 600;
}

.menu {
    display: flex;
    gap: 3px;
}

.menu button,
.topbar-right button,
.sidebar-title button {
    border: 0;
    color: #cccccc;
    background: transparent;
    border-radius: 5px;
    cursor: pointer;
}

.menu button {
    padding: 7px 10px;
    font-size: 12px;
}

.menu button:hover,
.topbar-right button:hover,
.sidebar-title button:hover {
    background: #292929;
    color: #ffffff;
}

.topbar-right {
    margin-left: auto;
    display: flex;
    gap: 4px;
}

.topbar-right button {
    padding: 7px 9px;
    font-size: 12px;
}

.workspace {
    flex: 1;
    min-height: 0;
    display: flex;
}

.sidebar {
    width: 230px;
    min-width: 230px;
    border-right: 1px solid #2b2b2b;
    background: #161616;
    display: flex;
    flex-direction: column;
}

.sidebar.hidden {
    display: none;
}

.sidebar-title {
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    color: #999999;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .5px;
}

.sidebar-title button {
    margin-left: auto;
    width: 25px;
    height: 25px;
    font-size: 18px;
}

.file-list {
    overflow-y: auto;
    padding: 4px 5px;
}

.file-item {
    height: 32px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 8px;
    border-radius: 4px;
    color: #bbbbbb;
    cursor: pointer;
    font-size: 13px;
}

.file-item:hover {
    background: #242424;
}

.file-item.active {
    background: #2c2c2c;
    color: #ffffff;
}

.file-icon {
    width: 17px;
    text-align: center;
    opacity: .8;
}

.file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.modified-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #bbbbbb;
}

.editor-area {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.tabs {
    height: 36px;
    min-height: 36px;
    display: flex;
    overflow-x: auto;
    border-bottom: 1px solid #2b2b2b;
    background: #191919;
}

.tab {
    min-width: 120px;
    max-width: 190px;
    height: 36px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 10px;
    border-right: 1px solid #2b2b2b;
    color: #999999;
    cursor: pointer;
    font-size: 12px;
}

.tab:hover {
    background: #222222;
}

.tab.active {
    background: #111111;
    color: #ffffff;
}

.tab-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tab-close {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    color: #888888;
}

.tab-close:hover {
    background: #333333;
    color: #ffffff;
}

.editor-container {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
    background: #101010;
}

.line-numbers {
    width: 55px;
    min-width: 55px;
    padding: 12px 10px 12px 0;
    text-align: right;
    color: #555555;
    background: #101010;
    font-family:
        Consolas,
        "Cascadia Code",
        monospace;
    font-size: 14px;
    line-height: 21px;
    user-select: none;
    overflow: hidden;
}

.editor {
    flex: 1;
    width: 100%;
    height: 100%;
    resize: none;
    outline: none;
    border: 0;
    padding: 12px 16px;
    background: #101010;
    color: #eeeeee;
    font-family:
        Consolas,
        "Cascadia Code",
        "Courier New",
        monospace;
    font-size: 14px;
    line-height: 21px;
    tab-size: 4;
    white-space: pre;
    overflow: auto;
}

.editor::selection {
    background: #3a3a3a;
}

.statusbar {
    height: 24px;
    min-height: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 10px;
    background: #181818;
    border-top: 1px solid #2b2b2b;
    color: #888888;
    font-size: 11px;
}

.status-spacer {
    flex: 1;
}

@media (max-width: 700px) {
    .sidebar {
        width: 180px;
        min-width: 180px;
    }

    .brand {
        width: 110px;
    }

    .brand-name {
        display: none;
    }

    .menu button {
        padding: 6px;
    }

    .topbar-right button {
        padding: 6px;
    }
}
`;

document.head.appendChild(style);

/* =========================================================
   Utility
========================================================= */

function getLanguage(name: string): FileType {
    const lower = name.toLowerCase();

    if (lower.endsWith(".html") || lower.endsWith(".htm")) {
        return "html";
    }

    if (lower.endsWith(".css")) {
        return "css";
    }

    if (lower.endsWith(".js") || lower.endsWith(".mjs")) {
        return "javascript";
    }

    if (lower.endsWith(".ts")) {
        return "typescript";
    }

    if (lower.endsWith(".json")) {
        return "json";
    }

    return "text";
}

function getLanguageName(language: FileType): string {
    switch (language) {
        case "html":
            return "HTML";

        case "css":
            return "CSS";

        case "javascript":
            return "JavaScript";

        case "typescript":
            return "TypeScript";

        case "json":
            return "JSON";

        default:
            return "Plain Text";
    }
}

function getFileIcon(language: FileType): string {
    switch (language) {
        case "html":
            return "◇";

        case "css":
            return "#";

        case "javascript":
            return "JS";

        case "typescript":
            return "TS";

        case "json":
            return "{}";

        default:
            return "T";
    }
}

function getActiveFile(): EditorFile | null {
    if (state.activeFileId === null) {
        return null;
    }

    return (
        state.files.find(
            file => file.id === state.activeFileId
        ) ?? null
    );
}

function setStatus(message: string): void {
    state.statusMessage = message;
    statusMessage.textContent = message;
}

/* =========================================================
   Line Numbers
========================================================= */

function updateLineNumbers(): void {
    const lineCount =
        editor.value.split("\n").length;

    const numbers: string[] = [];

    for (let i = 1; i <= lineCount; i++) {
        numbers.push(String(i));
    }

    lineNumbers.textContent =
        numbers.join("\n");
}

/* =========================================================
   Cursor
========================================================= */

function updateCursorPosition(): void {
    const position = editor.selectionStart;

    const beforeCursor =
        editor.value.substring(0, position);

    const lines =
        beforeCursor.split("\n");

    const line =
        lines.length;

    const column =
        lines[lines.length - 1].length + 1;

    cursorPosition.textContent =
        `Ln ${line}, Col ${column}`;
}

/* =========================================================
   Editor
========================================================= */

function loadActiveFile(): void {
    const file = getActiveFile();

    if (!file) {
        editor.value = "";
        languageStatus.textContent =
            "Plain Text";

        updateLineNumbers();
        updateCursorPosition();
        return;
    }

    editor.value = file.content;

    languageStatus.textContent =
        getLanguageName(file.language);

    updateLineNumbers();
    updateCursorPosition();

    document.title =
        `${file.name} - LightCode`;
}

function updateActiveFile(): void {
    const file = getActiveFile();

    if (!file) {
        return;
    }

    file.content = editor.value;
    file.modified = true;

    updateLineNumbers();
    updateCursorPosition();
    renderTabs();
    renderFileList();

    setStatus("変更あり");

    saveWorkspace();
}

/* =========================================================
   Files
========================================================= */

function createFile(
    name = "untitled.ts",
    content = ""
): EditorFile {
    const file: EditorFile = {
        id: state.nextFileId++,
        name,
        content,
        language: getLanguage(name),
        modified: false
    };

    state.files.push(file);
    state.activeFileId = file.id;

    return file;
}

function newFile(): void {
    const file = createFile();

    loadActiveFile();
    renderTabs();
    renderFileList();

    setStatus(`${file.name} を作成しました`);
}

function activateFile(id: number): void {
    const file =
        state.files.find(item => item.id === id);

    if (!file) {
        return;
    }

    state.activeFileId = id;

    loadActiveFile();
    renderTabs();
    renderFileList();

    setStatus(`${file.name} を開きました`);
}

function closeFile(id: number): void {
    const index =
        state.files.findIndex(file => file.id === id);

    if (index === -1) {
        return;
    }

    const file = state.files[index];

    if (file.modified) {
        const result = confirm(
            `${file.name} には保存されていない変更があります。\n閉じますか？`
        );

        if (!result) {
            return;
        }
    }

    state.files.splice(index, 1);

    if (state.files.length === 0) {
        createFile();
    } else if (state.activeFileId === id) {
        const nextIndex =
            Math.min(index, state.files.length - 1);

        state.activeFileId =
            state.files[nextIndex].id;
    }

    loadActiveFile();
    renderTabs();
    renderFileList();

    setStatus(`${file.name} を閉じました`);

    saveWorkspace();
}

/* =========================================================
   File List
========================================================= */

function renderFileList(): void {
    fileList.innerHTML = "";

    for (const file of state.files) {
        const item =
            document.createElement("div");

        item.className =
            "file-item" +
            (file.id === state.activeFileId
                ? " active"
                : "");

        const icon =
            document.createElement("span");

        icon.className =
            "file-icon";

        icon.textContent =
            getFileIcon(file.language);

        const name =
            document.createElement("span");

        name.className =
            "file-name";

        name.textContent =
            file.name;

        item.appendChild(icon);
        item.appendChild(name);

        if (file.modified) {
            const dot =
                document.createElement("span");

            dot.className =
                "modified-dot";

            item.appendChild(dot);
        }

        item.addEventListener(
            "click",
            () => activateFile(file.id)
        );

        fileList.appendChild(item);
    }
}

/* =========================================================
   Tabs
========================================================= */

function renderTabs(): void {
    tabs.innerHTML = "";

    for (const file of state.files) {
        const tab =
            document.createElement("div");

        tab.className =
            "tab" +
            (file.id === state.activeFileId
                ? " active"
                : "");

        const name =
            document.createElement("span");

        name.className =
            "tab-name";

        name.textContent =
            file.modified
                ? `${file.name} •`
                : file.name;

        const close =
            document.createElement("span");

        close.className =
            "tab-close";

        close.textContent =
            "×";

        name.addEventListener(
            "click",
            () => activateFile(file.id)
        );

        tab.appendChild(name);
        tab.appendChild(close);

        close.addEventListener(
            "click",
            event => {
                event.stopPropagation();
                closeFile(file.id);
            }
        );

        tab.addEventListener(
            "click",
            () => activateFile(file.id)
        );

        tabs.appendChild(tab);
    }
}

/* =========================================================
   Open
========================================================= */

function openFiles(): void {
    fileInput.value = "";
    fileInput.click();
}

fileInput.addEventListener(
    "change",
    async () => {
        const files =
            Array.from(fileInput.files ?? []);

        if (files.length === 0) {
            return;
        }

        for (const selectedFile of files) {
            const content =
                await selectedFile.text();

            const existing =
                state.files.find(
                    file =>
                        file.name ===
                        selectedFile.name
                );

            if (existing) {
                existing.content = content;
                existing.modified = false;
                existing.language =
                    getLanguage(selectedFile.name);

                state.activeFileId =
                    existing.id;
            } else {
                createFile(
                    selectedFile.name,
                    content
                );
            }
        }

        loadActiveFile();
        renderTabs();
        renderFileList();

        setStatus(
            `${files.length} 個のファイルを開きました`
        );

        saveWorkspace();
    }
);

/* =========================================================
   Save
========================================================= */

function saveFile(): void {
    const file = getActiveFile();

    if (!file) {
        setStatus("保存するファイルがありません");
        return;
    }

    file.content = editor.value;
    file.modified = false;

    const blob =
        new Blob(
            [file.content],
            {
                type: "text/plain;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = file.name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    renderTabs();
    renderFileList();

    setStatus(
        `${file.name} を保存しました`
    );

    saveWorkspace();
}

function saveAs(): void {
    const file = getActiveFile();

    if (!file) {
        return;
    }

    const name =
        prompt(
            "ファイル名を入力してください",
            file.name
        );

    if (!name) {
        return;
    }

    file.name = name;
    file.language = getLanguage(name);
    file.content = editor.value;
    file.modified = false;

    saveFile();
}

/* =========================================================
   Workspace Storage
========================================================= */

function saveWorkspace(): void {
    try {
        localStorage.setItem(
            "lightcode-workspace",
            JSON.stringify(state)
        );
    } catch {
        console.warn(
            "LightCode: workspace保存に失敗しました。"
        );
    }
}

function loadWorkspace(): void {
    try {
        const saved =
            localStorage.getItem(
                "lightcode-workspace"
            );

        if (!saved) {
            createFile(
                "main.ts",
                `// LightCodeへようこそ

function main(): void {
    console.log("Hello, LightCode!");
}

main();
`
            );

            return;
        }

        const data =
            JSON.parse(saved) as EditorState;

        if (
            !data ||
            !Array.isArray(data.files)
        ) {
            createFile();
            return;
        }

        state.files =
            data.files;

        state.activeFileId =
            data.activeFileId;

        state.nextFileId =
            data.nextFileId || 1;

        state.theme =
            data.theme || "dark";

        state.sidebarVisible =
            data.sidebarVisible !== false;

        if (state.files.length === 0) {
            createFile();
        }

    } catch {
        state.files = [];
        createFile();

        setStatus(
            "保存データを読み込めませんでした"
        );
    }
}

/* =========================================================
   Theme
========================================================= */

function toggleTheme(): void {
    state.theme =
        state.theme === "dark"
            ? "light"
            : "dark";

    if (state.theme === "light") {
        applyLightTheme();
        setStatus("ライトテーマ");
    } else {
        applyDarkTheme();
        setStatus("ダークテーマ");
    }

    saveWorkspace();
}

function applyDarkTheme(): void {
    document.body.style.background =
        "#111111";

    document.body.style.color =
        "#eeeeee";

    editor.style.background =
        "#101010";

    editor.style.color =
        "#eeeeee";

    lineNumbers.style.background =
        "#101010";

    lineNumbers.style.color =
        "#555555";

    sidebar.style.background =
        "#161616";

    sidebar.style.borderColor =
        "#2b2b2b";
}

function applyLightTheme(): void {
    document.body.style.background =
        "#f5f5f5";

    document.body.style.color =
        "#202020";

    editor.style.background =
        "#ffffff";

    editor.style.color =
        "#202020";

    lineNumbers.style.background =
        "#f5f5f5";

    lineNumbers.style.color =
        "#999999";

    sidebar.style.background =
        "#eeeeee";

    sidebar.style.borderColor =
        "#d0d0d0";
}

/* =========================================================
   Sidebar
========================================================= */

function toggleSidebar(): void {
    state.sidebarVisible =
        !state.sidebarVisible;

    sidebar.classList.toggle(
        "hidden",
        !state.sidebarVisible
    );

    saveWorkspace();
}

/* =========================================================
   Keyboard
========================================================= */

function handleKeyboard(
    event: KeyboardEvent
): void {
    const ctrl =
        event.ctrlKey || event.metaKey;

    if (ctrl && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveFile();
        return;
    }

    if (
        ctrl &&
        event.key.toLowerCase() === "o"
    ) {
        event.preventDefault();
        openFiles();
        return;
    }

    if (
        ctrl &&
        event.key.toLowerCase() === "n"
    ) {
        event.preventDefault();
        newFile();
        return;
    }

    if (
        ctrl &&
        event.key.toLowerCase() === "w"
    ) {
        event.preventDefault();

        if (state.activeFileId !== null) {
            closeFile(
                state.activeFileId
            );
        }

        return;
    }

    if (
        ctrl &&
        event.key.toLowerCase() === "b"
    ) {
        event.preventDefault();
        toggleSidebar();
        return;
    }

    if (
        event.key === "Tab" &&
        document.activeElement === editor
    ) {
        event.preventDefault();

        const start =
            editor.selectionStart;

        const end =
            editor.selectionEnd;

        editor.setRangeText(
            "    ",
            start,
            end,
            "end"
        );

        updateActiveFile();
    }
}

/* =========================================================
   Editor Events
========================================================= */

editor.addEventListener(
    "input",
    () => {
        updateActiveFile();
    }
);

editor.addEventListener(
    "keyup",
    () => {
        updateCursorPosition();
    }
);

editor.addEventListener(
    "click",
    () => {
        updateCursorPosition();
    }
);

editor.addEventListener(
    "scroll",
    () => {
        lineNumbers.scrollTop =
            editor.scrollTop;
    }
);

editor.addEventListener(
    "keydown",
    event => {
        handleKeyboard(event);
    }
);

/* =========================================================
   Buttons
========================================================= */

newFileButton.addEventListener(
    "click",
    () => newFile()
);

addFileButton.addEventListener(
    "click",
    () => newFile()
);

openFileButton.addEventListener(
    "click",
    () => openFiles()
);

saveFileButton.addEventListener(
    "click",
    () => saveFile()
);

saveAsButton.addEventListener(
    "click",
    () => saveAs()
);

themeButton.addEventListener(
    "click",
    () => toggleTheme()
);

sidebarButton.addEventListener(
    "click",
    () => toggleSidebar()
);

/* =========================================================
   Drag & Drop
========================================================= */

editor.addEventListener(
    "dragover",
    event => {
        event.preventDefault();
    }
);

editor.addEventListener(
    "drop",
    async event => {
        event.preventDefault();

        const files =
            Array.from(
                event.dataTransfer?.files ?? []
            );

        if (files.length === 0) {
            return;
        }

        for (const droppedFile of files) {
            const content =
                await droppedFile.text();

            createFile(
                droppedFile.name,
                content
            );
        }

        loadActiveFile();
        renderTabs();
        renderFileList();

        setStatus(
            `${files.length} 個のファイルを追加しました`
        );

        saveWorkspace();
    }
);

/* =========================================================
   Before Unload
========================================================= */

window.addEventListener(
    "beforeunload",
    event => {
        const hasModifiedFile =
            state.files.some(
                file => file.modified
            );

        if (hasModifiedFile) {
            event.preventDefault();
            event.returnValue = "";
        }

        saveWorkspace();
    }
);

/* =========================================================
   Auto Save
========================================================= */

setInterval(
    () => {
        const file = getActiveFile();

        if (!file) {
            return;
        }

        file.content =
            editor.value;

        saveWorkspace();
    },
    3000
);

/* =========================================================
   Initialization
========================================================= */

function initialize(): void {
    loadWorkspace();

    loadActiveFile();

    renderTabs();

    renderFileList();

    sidebar.classList.toggle(
        "hidden",
        !state.sidebarVisible
    );

    if (state.theme === "light") {
        applyLightTheme();
    } else {
        applyDarkTheme();
    }

    updateLineNumbers();

    updateCursorPosition();

    setStatus(
        "LightCode v0.2 起動完了"
    );

    console.log(
        "%cLightCode v0.2",
        "font-weight:bold;font-size:18px"
    );

    console.log(
        "LightCode TypeScript Edition"
    );
}

initialize();
