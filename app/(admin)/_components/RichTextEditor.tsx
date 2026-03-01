import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// ─── Table Picker ─────────────────────────────────────────────────────────────

function TablePicker({ onInsert, onClose }: { onInsert: (rows: number, cols: number) => void; onClose: () => void }) {
    const MAX = 8;
    const [hover, setHover] = useState<[number, number]>([0, 0]);
    return (
        <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 mt-1 top-full left-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {hover[0] > 0 && hover[1] > 0 ? `${hover[0]} × ${hover[1]} table` : "Select table size"}
            </p>
            <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}
                onMouseLeave={() => setHover([0, 0])}
            >
                {Array.from({ length: MAX * MAX }).map((_, idx) => {
                    const row = Math.floor(idx / MAX) + 1;
                    const col = (idx % MAX) + 1;
                    const active = row <= hover[0] && col <= hover[1];
                    return (
                        <div
                            key={idx}
                            onMouseEnter={() => setHover([row, col])}
                            onClick={() => { onInsert(row, col); onClose(); }}
                            className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${active ? "bg-blue-500 border-blue-600" : "bg-slate-100 border-slate-200 hover:bg-slate-200"}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ─── Table Context Toolbar ────────────────────────────────────────────────────
// Appears as a small floating toolbar when cursor is inside a <table>

interface TableContextToolbarProps {
    position: { top: number; left: number };
    onAddRowAbove: () => void;
    onAddRowBelow: () => void;
    onDeleteRow: () => void;
    onAddColLeft: () => void;
    onAddColRight: () => void;
    onDeleteCol: () => void;
    onDeleteTable: () => void;
}

function TableContextToolbar({ position, onAddRowAbove, onAddRowBelow, onDeleteRow, onAddColLeft, onAddColRight, onDeleteCol, onDeleteTable }: TableContextToolbarProps) {
    return (
        <div
            className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl flex items-center gap-0.5 p-1"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()} // prevent blur
        >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 border-r mr-1">Table</span>

            {/* Row actions */}
            <CtxBtn title="Add row above" onClick={onAddRowAbove} icon="↑+" color="blue" />
            <CtxBtn title="Add row below" onClick={onAddRowBelow} icon="↓+" color="blue" />
            <CtxBtn title="Delete row" onClick={onDeleteRow} icon="✕ row" color="red" />

            <span className="w-px h-5 bg-slate-200 mx-0.5" />

            {/* Column actions */}
            <CtxBtn title="Add column left" onClick={onAddColLeft} icon="←+" color="blue" />
            <CtxBtn title="Add column right" onClick={onAddColRight} icon="→+" color="blue" />
            <CtxBtn title="Delete column" onClick={onDeleteCol} icon="✕ col" color="red" />

            <span className="w-px h-5 bg-slate-200 mx-0.5" />

            {/* Delete table */}
            <CtxBtn title="Delete entire table" onClick={onDeleteTable} icon="🗑 table" color="red" />
        </div>
    );
}

function CtxBtn({ title, onClick, icon, color }: { title: string; onClick: () => void; icon: string; color: "blue" | "red" }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors whitespace-nowrap
                ${color === "red"
                    ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                    : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"}`}
        >
            {icon}
        </button>
    );
}

// ─── Quill Editor (dynamic import) ───────────────────────────────────────────

const QuillEditor = dynamic(async () => {
    const { default: ReactQuill, Quill } = await import("react-quill-new");
    const { default: ImageResize } = await import("quill-image-resize-module-react");

    (window as any).Quill = Quill;
    Quill.register("modules/imageResize", ImageResize);

    return function ForwardedReactQuill(props: any) {
        return <ReactQuill {...props} />;
    };
}, { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-50 text-slate-400">Loading editor...</div> });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Walk up from a DOM node to find a <table> ancestor */
function getTableFromNode(node: Node | null): HTMLTableElement | null {
    let el = node instanceof Element ? node : node?.parentElement;
    while (el) {
        if (el.tagName === "TABLE") return el as HTMLTableElement;
        el = el.parentElement;
    }
    return null;
}

/** Get the <td>/<th> that contains a DOM node */
function getCellFromNode(node: Node | null): HTMLTableCellElement | null {
    let el = node instanceof Element ? node : node?.parentElement;
    while (el) {
        if (el.tagName === "TD" || el.tagName === "TH") return el as HTMLTableCellElement;
        el = el.parentElement;
    }
    return null;
}

/** Get column index of a cell */
function getCellIndex(cell: HTMLTableCellElement): number {
    return Array.from(cell.parentElement?.children ?? []).indexOf(cell);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const quillRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; });
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [tableCtx, setTableCtx] = useState<{ position: { top: number; left: number } } | null>(null);

    /** Get the current HTML content of the editor */
    const editor_html = useCallback(() => {
        return quillRef.current?.getEditor?.()?.root?.innerHTML ?? "";
    }, []);

    // ── Detect cursor-in-table and show context toolbar ──
    const updateTableCtx = useCallback(() => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) { setTableCtx(null); return; }

        const sel = editor.getSelection();
        if (!sel) { setTableCtx(null); return; }

        // Get the DOM node at the selection
        const [leaf] = editor.getLeaf(sel.index);
        const domNode: Node | null = leaf?.domNode ?? null;
        const table = getTableFromNode(domNode);

        if (!table) {
            setTableCtx(null);
            return;
        }

        // Position the toolbar above the table
        const rect = table.getBoundingClientRect();
        setTableCtx({ position: { top: rect.top - 40, left: rect.left } });
    }, []);

    useEffect(() => {
        // Listen to selection changes in the quill editor
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;
        editor.on("selection-change", updateTableCtx);
        return () => editor.off("selection-change", updateTableCtx);
    });

    // ── Insert a blank table ──
    const insertTable = useCallback((rows: number, cols: number) => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;

        let tableHtml = `<table style="border-collapse:collapse;width:100%;"><thead><tr>`;
        for (let c = 0; c < cols; c++) {
            tableHtml += `<th style="border:1px solid #cbd5e1;padding:8px 10px;background:#f1f5f9;font-weight:600;text-align:left;"> </th>`;
        }
        tableHtml += `</tr></thead><tbody>`;
        for (let r = 0; r < rows - 1; r++) {
            tableHtml += `<tr>`;
            for (let c = 0; c < cols; c++) {
                tableHtml += `<td style="border:1px solid #cbd5e1;padding:8px 10px;"> </td>`;
            }
            tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table><p><br></p>`;

        const range = editor.getSelection(true);
        editor.clipboard.dangerouslyPasteHTML(range ? range.index : editor.getLength(), tableHtml);
    }, []);

    // ── Helpers to get current table + cell from editor selection ──
    const getCtx = useCallback(() => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return null;
        const sel = editor.getSelection();
        if (!sel) return null;
        const [leaf] = editor.getLeaf(sel.index);
        const domNode: Node | null = leaf?.domNode ?? null;
        const table = getTableFromNode(domNode);
        const cell = getCellFromNode(domNode);
        if (!table || !cell) return null;
        return { table, cell };
    }, []);

    // ── Row operations ──
    const addRowAbove = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const { cell } = ctx;
        const row = cell.parentElement as HTMLTableRowElement;
        const colCount = row.cells.length;
        const newRow = document.createElement("tr");
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement("td");
            td.style.cssText = "border:1px solid #cbd5e1;padding:8px 10px;";
            td.innerHTML = " ";
            newRow.appendChild(td);
        }
        row.parentElement?.insertBefore(newRow, row);
        onChangeRef.current(editor_html());
    }, [getCtx, editor_html]);

    const addRowBelow = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const { cell } = ctx;
        const row = cell.parentElement as HTMLTableRowElement;
        const colCount = row.cells.length;
        const newRow = document.createElement("tr");
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement("td");
            td.style.cssText = "border:1px solid #cbd5e1;padding:8px 10px;";
            td.innerHTML = " ";
            newRow.appendChild(td);
        }
        row.parentElement?.insertBefore(newRow, row.nextSibling);
        onChangeRef.current(editor_html());
    }, [getCtx, editor_html]);

    const deleteRow = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const { table, cell } = ctx;
        const row = cell.parentElement as HTMLTableRowElement;
        const tbody = row.parentElement;
        if (table.rows.length <= 1) return;
        tbody?.removeChild(row);
        onChangeRef.current(editor_html());
    }, [getCtx, editor_html]);

    // ── Column operations ──
    const addColLeft = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const { table, cell } = ctx;
        const colIdx = getCellIndex(cell);
        Array.from(table.rows).forEach(row => {
            const isHeader = row.cells[colIdx]?.tagName?.toLowerCase() === "th";
            const newCell = document.createElement(isHeader ? "th" : "td");
            newCell.style.cssText = isHeader
                ? "border:1px solid #cbd5e1;padding:8px 10px;background:#f1f5f9;font-weight:600;"
                : "border:1px solid #cbd5e1;padding:8px 10px;";
            newCell.innerHTML = " ";
            row.insertBefore(newCell, row.cells[colIdx]);
        });
        onChangeRef.current(editor_html());
    }, [getCtx, editor_html]);

    const addColRight = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const { table, cell } = ctx;
        const colIdx = getCellIndex(cell);
        Array.from(table.rows).forEach(row => {
            const isHeader = row.cells[colIdx]?.tagName?.toLowerCase() === "th";
            const newCell = document.createElement(isHeader ? "th" : "td");
            newCell.style.cssText = isHeader
                ? "border:1px solid #cbd5e1;padding:8px 10px;background:#f1f5f9;font-weight:600;"
                : "border:1px solid #cbd5e1;padding:8px 10px;";
            newCell.innerHTML = " ";
            row.insertBefore(newCell, row.cells[colIdx + 1] ?? null);
        });
        onChangeRef.current(editor_html());
    }, [getCtx, editor_html]);

    const deleteCol = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const { table, cell } = ctx;
        const colIdx = getCellIndex(cell);
        if (table.rows[0]?.cells.length <= 1) return;
        Array.from(table.rows).forEach(row => {
            if (row.cells[colIdx]) row.deleteCell(colIdx);
        });
        onChangeRef.current(editor_html());
    }, [getCtx, editor_html]);

    const deleteTable = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.table.parentElement?.removeChild(ctx.table);
        onChangeRef.current(editor_html());
        setTableCtx(null);
    }, [getCtx, editor_html]);

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
                [{ align: [] }],
                [{ color: [] }, { background: [] }],
                ["link", "image"],
                ["clean"],
            ],
        },
        imageResize: {
            parchment: { image: { attribute: ["width", "height"] } },
            modules: ["Resize", "DisplaySize", "Toolbar"]
        }
    }), []);

    return (
        <div className="bg-white rounded-md mb-8 pb-10" ref={wrapperRef}>
            <style jsx global>{`
                .ql-editor img { max-width: 100%; height: auto; }
                .ql-editor table { border-collapse: collapse !important; width: 100%; margin: 8px 0; }
                .ql-editor td, .ql-editor th { border: 1px solid #cbd5e1 !important; padding: 8px 10px !important; min-width: 50px; }
                .ql-editor th { background: #f1f5f9 !important; font-weight: 600 !important; }
            `}</style>

            {/* Table Context Toolbar (floating) */}
            {tableCtx && (
                <TableContextToolbar
                    position={tableCtx.position}
                    onAddRowAbove={addRowAbove}
                    onAddRowBelow={addRowBelow}
                    onDeleteRow={deleteRow}
                    onAddColLeft={addColLeft}
                    onAddColRight={addColRight}
                    onDeleteCol={deleteCol}
                    onDeleteTable={deleteTable}
                />
            )}

            {/* Custom Table Insert Button */}
            <div className="relative flex items-center gap-1 px-2 py-1 bg-[#f0f0f0] border border-[#ccc] border-b-0 rounded-t-md">
                <button
                    type="button"
                    title="Insert Table"
                    onClick={(e) => { e.preventDefault(); setShowTablePicker(p => !p); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors
                        ${showTablePicker ? "bg-blue-100 text-blue-700 border border-blue-300" : "text-slate-600 hover:bg-slate-200"}`}
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="14" height="14" rx="1.5" />
                        <line x1="1" y1="5.5" x2="15" y2="5.5" />
                        <line x1="1" y1="10.5" x2="15" y2="10.5" />
                        <line x1="5.5" y1="1" x2="5.5" y2="15" />
                        <line x1="10.5" y1="1" x2="10.5" y2="15" />
                    </svg>
                    Insert Table
                </button>

                {showTablePicker && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowTablePicker(false)} />
                        <TablePicker onInsert={insertTable} onClose={() => setShowTablePicker(false)} />
                    </>
                )}
            </div>

            <QuillEditor
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ height: "300px" }}
                modules={modules}
            />
        </div>
    );
}