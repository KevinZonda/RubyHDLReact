import { EditorView } from "@uiw/react-codemirror";

export const RubyGrammarHighlight = {
    start: [
        {
            regex: /#(.*)/,
            token: "comment"
        },
        {
            regex: /VAR|INCLUDE|IF|THEN|ELSE|IN|END|LET/,
            token: "keyword"
        },
        {
            regex: /\$[a-zA-Z]*/,
            token: "keyword"
        },
        {
            regex: /"(.*)"/,
            token: "string"
        },
        {
            regex: /`[^`]*`/,
            token: "atom"
        },
        {
            regex: /<[^>]*>/,
            token: "number"
        },
        {
            regex: /\b[0-9]+\b/,
            token: "number"
        }
    ],
}

export const handleHashComment = (view: EditorView) => {
    const { state } = view;
    const selection = state.selection.main;

    // Identify the first and last lines covered by the selection (or cursor)
    const startLine = state.doc.lineAt(selection.from);
    const endLine = state.doc.lineAt(selection.to);

    // Gather each relevant line
    const lines = [];
    for (let l = startLine.number; l <= endLine.number; l++) {
        lines.push(state.doc.line(l));
    }

    // Check whether every line is already commented
    const allCommented = lines.every(line => line.text.trimStart().startsWith("#"));

    // Build the list of changes
    const changes = lines.map(line => {
        if (allCommented) {
            // Remove the first "#" character in the line
            const hashIndex = line.text.indexOf("#");
            return {
                from: line.from + hashIndex,
                to: line.from + hashIndex + 1,
                insert: ""
            };
        } else {
            // Add a "#" at the beginning of the line
            return {
                from: line.from,
                to: line.from,
                insert: "#"
            };
        }
    });

    // Apply the changes
    view.dispatch({ changes });
    return true;
}

export const downloadTextAsFile = (text: string, filename: string) => {
    downloadHrefAsFile(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`, filename);
}


export const downloadHrefAsFile = (href: string, filename: string) => {
    const element = document.createElement("a");
    element.href = href;
    element.download = filename;
    element.click();
}