import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// ─── Shared cell styles ───────────────────────────────────────────────────────

/** Inline styles applied to every generated <td>/<th> */
const CELL_BASE = [
  "border:1px solid #cbd5e1",
  "padding:8px 10px",
  "word-break:break-word",
  "overflow-wrap:break-word",
  "white-space:normal",
  "vertical-align:top",
  "min-width:60px",
].join(";");

const CELL_HEADER = `${CELL_BASE};background:#f1f5f9;font-weight:600;text-align:left`;
const CELL_BODY   = CELL_BASE;

const TABLE_STYLE = [
  "border-collapse:collapse",
  "width:100%",
  "table-layout:fixed",
  "word-break:break-word",
].join(";");

// ─── DOM helper: create a <td> or <th> ───────────────────────────────────────

function makeCell(isHeader: boolean): HTMLTableCellElement {
  const td = document.createElement(isHeader ? "th" : "td");
  td.style.cssText = isHeader ? CELL_HEADER : CELL_BODY;
  td.innerHTML = "\u00a0"; // non-breaking space — keeps cell focusable/editable
  return td;
}

// ─── DOM helper: create a <tr> with `cols` data cells ────────────────────────

function makeDataRow(cols: number): HTMLTableRowElement {
  const tr = document.createElement("tr");
  for (let i = 0; i < cols; i++) tr.appendChild(makeCell(false));
  return tr;
}

// ─── DOM helper: max column count across all rows in a table ─────────────────

function getMaxCols(table: HTMLTableElement): number {
  return Math.max(1, ...Array.from(table.rows).map((r) => r.cells.length));
}

// ─── DOM helper: column index of a cell (uses .cells, not .children) ─────────

function getCellColIndex(cell: HTMLTableCellElement): number {
  const row = cell.parentElement as HTMLTableRowElement | null;
  return Array.from(row?.cells ?? []).indexOf(cell);
}

// ─── DOM helper: walk up to nearest <table> ───────────────────────────────────

function findTable(node: Node | null): HTMLTableElement | null {
  let el = node instanceof Element ? node : node?.parentElement;
  while (el) {
    if (el.tagName === "TABLE") return el as HTMLTableElement;
    el = el.parentElement;
  }
  return null;
}

// ─── DOM helper: walk up to nearest <td> or <th> ─────────────────────────────

function findCell(node: Node | null): HTMLTableCellElement | null {
  let el = node instanceof Element ? node : node?.parentElement;
  while (el) {
    if (el.tagName === "TD" || el.tagName === "TH") return el as HTMLTableCellElement;
    el = el.parentElement;
  }
  return null;
}

// ─── DOM helper: find the first non-header body row ──────────────────────────
// Handles both flat tables (rows directly in <table>) and sectioned tables.

function firstBodyRow(table: HTMLTableElement): HTMLTableRowElement | null {
  for (const row of Array.from(table.rows)) {
    const parent = row.parentElement;
    if (!parent) continue;
    if (parent.tagName === "THEAD") continue; // skip header section
    return row;
  }
  return null;
}

// ─── Table Picker ─────────────────────────────────────────────────────────────

function TablePicker({
  onInsert,
  onClose,
}: {
  onInsert: (rows: number, cols: number) => void;
  onClose: () => void;
}) {
  const MAX = 8;
  const [hover, setHover] = useState<[number, number]>([0, 0]);

  return (
    <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 mt-1 top-full left-0">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {hover[0] > 0 && hover[1] > 0
          ? `${hover[0]} × ${hover[1]} table`
          : "Select table size"}
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
              className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${
                active
                  ? "bg-blue-500 border-blue-600"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Floating context toolbar ─────────────────────────────────────────────────

interface ToolbarProps {
  position: { top: number; left: number };
  onAddRowAbove: () => void;
  onAddRowBelow: () => void;
  onDeleteRow: () => void;
  onAddColLeft: () => void;
  onAddColRight: () => void;
  onDeleteCol: () => void;
  onDeleteTable: () => void;
}

function TableContextToolbar(p: ToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl flex items-center gap-0.5 p-1"
      style={{ top: p.position.top, left: p.position.left }}
      onMouseDown={(e) => e.preventDefault()} // keep editor focused
    >
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 border-r mr-1">
        Table
      </span>
      <TB label="↑+ row"   title="Add row above"     onClick={p.onAddRowAbove}  red={false} />
      <TB label="↓+ row"   title="Add row below"     onClick={p.onAddRowBelow}  red={false} />
      <TB label="✕ row"    title="Delete row"        onClick={p.onDeleteRow}    red />
      <span className="w-px h-5 bg-slate-200 mx-0.5" />
      <TB label="←+ col"   title="Add column left"   onClick={p.onAddColLeft}   red={false} />
      <TB label="→+ col"   title="Add column right"  onClick={p.onAddColRight}  red={false} />
      <TB label="✕ col"    title="Delete column"     onClick={p.onDeleteCol}    red />
      <span className="w-px h-5 bg-slate-200 mx-0.5" />
      <TB label="🗑 table" title="Delete entire table" onClick={p.onDeleteTable} red />
    </div>
  );
}

function TB({ label, title, onClick, red }: { label: string; title: string; onClick: () => void; red: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
        red
          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
          : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Quill Editor (dynamic import) ───────────────────────────────────────────

const QuillEditor = dynamic(
  async () => {
    const { default: ReactQuill, Quill } = await import("react-quill-new");
    const { default: ImageResize } = await import("quill-image-resize-module-react");
    (window as any).Quill = Quill;
    Quill.register("modules/imageResize", ImageResize);
    return function ForwardedReactQuill(props: any) {
      return <ReactQuill {...props} />;
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 text-slate-400">
        Loading editor…
      </div>
    ),
  },
);

// ─── Main component ───────────────────────────────────────────────────────────

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const quillRef  = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Always holds the latest onChange so callbacks never go stale
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const [showPicker, setShowPicker] = useState(false);
  const [tableCtx, setTableCtx] = useState<{ position: { top: number; left: number } } | null>(null);

  // ── Read editor HTML ────────────────────────────────────────────────────────

  const editorHtml = useCallback(
    () => quillRef.current?.getEditor?.()?.root?.innerHTML ?? "",
    [],
  );

  // ── Detect cursor inside a table → show context toolbar ────────────────────

  const updateCtx = useCallback(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) { setTableCtx(null); return; }
    const sel = editor.getSelection();
    if (!sel)   { setTableCtx(null); return; }
    const [leaf] = editor.getLeaf(sel.index);
    const table = findTable(leaf?.domNode ?? null);
    if (!table) { setTableCtx(null); return; }
    const rect = table.getBoundingClientRect();
    setTableCtx({ position: { top: rect.top - 42, left: rect.left } });
  }, []);

  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;
    editor.on("selection-change", updateCtx);
    return () => editor.off("selection-change", updateCtx);
  }, [updateCtx]);

  // ── Cursor context helper ───────────────────────────────────────────────────

  const getCtx = useCallback(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return null;
    const sel = editor.getSelection();
    if (!sel) return null;
    const [leaf] = editor.getLeaf(sel.index);
    const table = findTable(leaf?.domNode ?? null);
    const cell  = findCell(leaf?.domNode ?? null);
    if (!table || !cell) return null;
    return { table, cell };
  }, []);

  // ── Insert a brand-new table ────────────────────────────────────────────────
  //
  // WHY DOM-FIRST instead of dangerouslyPasteHTML("<table><thead>…"):
  //   Quill's HTML→Delta parser treats the <thead>/<tbody> opening tags as
  //   consumed characters, causing it to count one fewer cell in the first row.
  //   Building the table as real DOM elements and serialising with .outerHTML
  //   produces a clean flat <table><tr><td> string that Quill parses correctly.

  const insertTable = useCallback((rows: number, cols: number) => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;

    // Build table as real DOM nodes
    const table = document.createElement("table");
    table.style.cssText = TABLE_STYLE;

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        // First row is styled as a visual header row (still a plain <td>)
        const cell = document.createElement("td");
        cell.style.cssText = r === 0 ? CELL_HEADER : CELL_BODY;
        cell.innerHTML = "\u00a0";
        tr.appendChild(cell);
      }
      table.appendChild(tr);
    }

    // Serialise to clean flat HTML — no <thead>/<tbody> wrappers
    const html = table.outerHTML + "<p><br></p>";

    const range = editor.getSelection(true);
    editor.clipboard.dangerouslyPasteHTML(
      range ? range.index : editor.getLength(),
      html,
    );
  }, []);

  // ── Row operations ──────────────────────────────────────────────────────────

  const addRowAbove = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { table, cell } = ctx;
    const row    = cell.parentElement as HTMLTableRowElement;
    const parent = row.parentElement!; // <tbody> | <thead> | <table>
    const cols   = getMaxCols(table);
    const newRow = makeDataRow(cols);

    if (parent.tagName === "THEAD") {
      // Cannot insert above the header — put it as the first body row instead
      const fbr = firstBodyRow(table);
      if (fbr) fbr.parentElement!.insertBefore(newRow, fbr);
      else table.appendChild(newRow);
    } else {
      parent.insertBefore(newRow, row);
    }
    onChangeRef.current(editorHtml());
  }, [getCtx, editorHtml]);

  const addRowBelow = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { table, cell } = ctx;
    const row    = cell.parentElement as HTMLTableRowElement;
    const parent = row.parentElement!;
    const cols   = getMaxCols(table);
    const newRow = makeDataRow(cols);

    if (parent.tagName === "THEAD") {
      // Put the new row as the first body row
      const fbr = firstBodyRow(table);
      if (fbr) fbr.parentElement!.insertBefore(newRow, fbr);
      else table.appendChild(newRow);
    } else {
      parent.insertBefore(newRow, row.nextSibling);
    }
    onChangeRef.current(editorHtml());
  }, [getCtx, editorHtml]);

  const deleteRow = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { table, cell } = ctx;
    if (table.rows.length <= 1) return; // must keep at least 1 row
    const row    = cell.parentElement as HTMLTableRowElement;
    const parent = row.parentElement as HTMLTableSectionElement;
    // Don't delete the only header row
    if (parent.tagName === "THEAD" && parent.rows.length <= 1) return;
    parent.removeChild(row);
    onChangeRef.current(editorHtml());
  }, [getCtx, editorHtml]);

  // ── Column operations ───────────────────────────────────────────────────────

  const addColLeft = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { table, cell } = ctx;
    const colIdx = getCellColIndex(cell);
    Array.from(table.rows).forEach((row) => {
      const inHeader = row.parentElement?.tagName === "THEAD";
      const newCell  = makeCell(inHeader);
      // Insert before the cell at colIdx; fall back to append if row is short
      row.insertBefore(newCell, row.cells[colIdx] ?? null);
    });
    onChangeRef.current(editorHtml());
  }, [getCtx, editorHtml]);

  const addColRight = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { table, cell } = ctx;
    const colIdx = getCellColIndex(cell);
    Array.from(table.rows).forEach((row) => {
      const inHeader = row.parentElement?.tagName === "THEAD";
      const newCell  = makeCell(inHeader);
      row.insertBefore(newCell, row.cells[colIdx + 1] ?? null);
    });
    onChangeRef.current(editorHtml());
  }, [getCtx, editorHtml]);

  const deleteCol = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { table, cell } = ctx;
    if ((table.rows[0]?.cells.length ?? 0) <= 1) return; // keep ≥ 1 column
    const colIdx = getCellColIndex(cell);
    Array.from(table.rows).forEach((row) => {
      if (row.cells[colIdx]) row.deleteCell(colIdx);
    });
    onChangeRef.current(editorHtml());
  }, [getCtx, editorHtml]);

  const deleteTable = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.table.parentElement?.removeChild(ctx.table);
    onChangeRef.current(editorHtml());
    setTableCtx(null);
  }, [getCtx, editorHtml]);

  // ── Quill modules ───────────────────────────────────────────────────────────

  const modules = useMemo(
    () => ({
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
        modules: ["Resize", "DisplaySize", "Toolbar"],
      },
    }),
    [],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-md mb-8 pb-10" ref={wrapperRef}>
      {/* ── Global styles injected into the Quill editor ── */}
      <style jsx global>{`
        /* Images */
        .ql-editor img {
          max-width: 100%;
          height: auto;
        }

        /*
         * Tables
         * - overflow-x: auto on the wrapper prevents the table from bursting
         *   the layout when a cell contains a very long unbreakable string.
         * - table-layout: fixed distributes columns evenly regardless of content.
         * - word-break / overflow-wrap on cells keeps long text inside the cell.
         */
        .ql-editor {
          overflow-x: auto;
        }
        .ql-editor table {
          border-collapse: collapse !important;
          table-layout: fixed !important;
          width: 100% !important;
          margin: 8px 0;
          word-break: break-word;
        }
        .ql-editor td,
        .ql-editor th {
          border: 1px solid #cbd5e1 !important;
          padding: 8px 10px !important;
          min-width: 60px !important;
          max-width: 400px;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
          vertical-align: top;
        }
        .ql-editor th {
          background: #f1f5f9 !important;
          font-weight: 600 !important;
          text-align: left !important;
        }

        /* Quill forces white-space:pre-wrap on the editor root — override for
           table cells so long content wraps instead of expanding the cell. */
        .ql-editor td *,
        .ql-editor th * {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
        }
      `}</style>

      {/* Floating table context toolbar (appears when cursor is inside a table) */}
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

      {/* "Insert Table" button lives above the Quill toolbar */}
      <div className="relative flex items-center gap-1 px-2 py-1 bg-[#f0f0f0] border border-[#ccc] border-b-0 rounded-t-md">
        <button
          type="button"
          title="Insert Table"
          onClick={(e) => { e.preventDefault(); setShowPicker((p) => !p); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            showPicker
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          {/* Table icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="14" height="14" rx="1.5" />
            <line x1="1" y1="5.5"  x2="15" y2="5.5"  />
            <line x1="1" y1="10.5" x2="15" y2="10.5" />
            <line x1="5.5"  y1="1" x2="5.5"  y2="15" />
            <line x1="10.5" y1="1" x2="10.5" y2="15" />
          </svg>
          Insert Table
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <TablePicker
              onInsert={insertTable}
              onClose={() => setShowPicker(false)}
            />
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
