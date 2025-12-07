
import React, { useEffect, useState } from "react";
import { searchDocuments, getAllDocuments, deleteDocument } from "../services/api";



const CSS = `
/* DocumentsPanel scoped styles (injected) */
.docs-container * { box-sizing: border-box; }
.docs-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
.docs-root {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 32px 20px;
}
.docs-card {
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  padding: 20px;
}
.docs-header {
  display:flex;align-items:center;justify-content:space-between;padding:16px 12px;border-radius:8px;background:white;margin-bottom:18px;
}
.docs-title { display:flex;align-items:center;gap:12px;color:#667eea;font-weight:700;font-size:18px }
.docs-search { position:relative;width:320px }
.docs-search input { width:100%;padding:10px 40px 10px 14px;border-radius:24px;border:2px solid #e0e0e0 }
.docs-search .icon { position:absolute;right:14px;top:50%;transform:translateY(-50%); }

/* library header */
.docs-library-header{display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:2px solid #e0e0e0;margin-bottom:18px}
.docs-library-title{display:flex;align-items:center;gap:12px}
.docs-doccount{background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:6px 12px;border-radius:16px;font-weight:600}
.docs-actions{display:flex;gap:12px;align-items:center}
.docs-view-toggle{display:flex;gap:6px;padding:6px;background:white;border-radius:8px;border:2px solid #e0e0e0}
.docs-view-btn{padding:8px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer}
.docs-view-btn.active{background:#667eea;color:white}
.docs-sort{padding:10px 14px;border-radius:8px;border:2px solid #e0e0e0;background:white}

/* grid */
.docs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.docs-card-item{background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);position:relative;overflow:hidden;cursor:default}
.docs-card-item:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.1)}
.docs-card-item::before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(135deg,#667eea,#764ba2);transform:scaleX(0);transition:transform .25s}
.docs-card-item:hover::before{transform:scaleX(1)}
.docs-icon-wrap{width:56px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;background:linear-gradient(135deg,rgba(102,126,234,0.06),rgba(118,75,162,0.06))}
.docs-file-title{font-weight:600;color:#333;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.docs-meta{display:flex;gap:10px;color:#666;font-size:13px;margin-bottom:8px;flex-wrap:wrap}
.docs-preview{color:#999;font-size:13px;line-height:1.4;min-height:36px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.docs-actions-row{display:flex;gap:8px;margin-top:12px}
.docs-btn{flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-weight:600}
.docs-btn.view{background:linear-gradient(135deg,#667eea,#764ba2);color:white}
.docs-btn.delete{background:#fee;color:#d32f2f;border:1px solid #fdd}

/* list */
.docs-list{display:flex;flex-direction:column;gap:12px}
.docs-list-item{background:white;border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.docs-list-content{flex:1;min-width:0}
.docs-list-title{font-weight:600;color:#333}
.docs-list-details{display:flex;gap:12px;color:#666;font-size:13px;flex-wrap:wrap}
.docs-list-actions{display:flex;gap:8px}

/* modal */
.docs-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999}
.docs-modal{background:white;border-radius:12px;padding:20px;max-width:480px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.28)}
.docs-modal h3{margin-bottom:8px}
.docs-modal p{color:#666;margin-bottom:16px}
.docs-modal-actions{display:flex;gap:10px}

/* responsive tweak */
@media (max-width:640px){
  .docs-search{width:100%}
  .docs-header{flex-direction:column;gap:10px;align-items:flex-start}
}
`;

function injectCSS() {
  if (document.getElementById("docs-panel-styles")) return;
  const s = document.createElement("style");
  s.id = "docs-panel-styles";
  s.innerHTML = CSS;
  document.head.appendChild(s);
}

export default function DocumentsPanel({ onFix }) {
  injectCSS();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("grid"); // 'grid' | 'list'
  const [sort, setSort] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, filename } or null

  const [refreshToggle, setRefreshToggle] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToggle]);

async function fetchDocs() {
  setLoading(true);
  try {
    const data = await getAllDocuments();
    setDocs(Array.isArray(data) ? data : data.documents || []);
  } catch (err) {
    console.error(err);
    setDocs([]);
  } finally {
    setLoading(false);
  }
}

function goFix(doc) {
  if (typeof onFix === "function") {
    onFix(doc);   // sends doc to HomePanel
  }
}


async function handleDelete(id) {
  try {
    await deleteDocument(id);
    setDeleteTarget(null);
    setRefreshToggle((v) => !v);
  } catch (err) {
    alert("Failed to delete: " + err.message);
  }
}

function viewPdf(id) {
  const url = `http://localhost:8080/documents/${id}/file`;
  window.open(url, "_blank");
}

  function fileIcon(filename) {
    const parts = (filename || "").split(".");
    const ext = parts.length ? parts[parts.length - 1].toLowerCase() : "";

    if (ext === "pdf") {
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#d32f2f">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 9.5h1v-1H9v1z"/>
        </svg>
      );
    }

    if (ext === "txt") {
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#1976d2">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
        </svg>
      );
    }

    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#757575">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
      </svg>
    );
  }
  function formatDate(iso) {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  }
async function handleSearchKey(e) {
  if (e.key === "Enter") {
    try {
      setLoading(true);
      const results = await searchDocuments(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }
}

useEffect(() => {
  if (searchTerm.trim() === "") {
    setSearchResults(null);
  }
}, [searchTerm]);


const baseList = searchResults !== null ? searchResults : docs;

const sorted = [...baseList].sort((a, b) => {
  if (sort === "recent")
    return new Date(b.uploadedAt) - new Date(a.uploadedAt);
  if (sort === "oldest")
    return new Date(a.uploadedAt) - new Date(b.uploadedAt);
  if (sort === "az")
    return (a.filename || "").localeCompare(b.filename || "");
  if (sort === "za")
    return (b.filename || "").localeCompare(a.filename || "");
  return 0;
});

  return (
    <div className="docs-root docs-container">
      <div className="docs-card">
        <div className="docs-header">

          <div className="docs-search">
            <input
              placeholder="Search documents..."
              value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKey}
            />
            <span className="icon">🔍</span>
          </div>
        </div>

        <div className="docs-library-header">
          <div className="docs-library-title">
            <h2 style={{ margin: 0, color: "#333" }}>Document Library</h2>
           <div className="docs-doccount">
             {(searchResults !== null ? searchResults.length : docs.length)} documents
           </div>
           </div>

          <div className="docs-actions">
            <select
              className="docs-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Sort by: Recent</option>
              <option value="az">Sort by: Name A-Z</option>
              <option value="za">Sort by: Name Z-A</option>
              <option value="oldest">Sort by: Oldest</option>
              <option value="size">Sort by: File Size</option>
            </select>

            <div className="docs-view-toggle" role="tablist">
              <button
                className={`docs-view-btn ${view === "grid" ? "active" : ""}`}
                onClick={() => setView("grid")}
              >
                ⬚
              </button>
              <button
                className={`docs-view-btn ${view === "list" ? "active" : ""}`}
                onClick={() => setView("list")}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Empty states */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>Loading documents...</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            No documents found
          </div>
        ) : view === "grid" ? (
          <div className="docs-grid">
            {sorted.map((d) => (
              <div key={d.id} className="docs-card-item">
                <div className="docs-icon-wrap">{fileIcon(d.filename)}</div>
                <div className="docs-file-title">{d.filename}</div>
                <div className="docs-meta">
                  <div>📅 {formatDate(d.uploadedAt)}</div>
                  <div>📄 {approxSize(d.contentText)}</div>
                </div>
                <div className="docs-preview">{d.contentText}</div>

                <div className="docs-actions-row">
                  <button className="docs-btn view" onClick={() => viewPdf(d.id)}>
                                         View
                                         </button>
<button className="docs-btn view" onClick={() => goFix(d)}>
  Fix
</button>

                  <button
                    className="docs-btn delete"
                    onClick={() => setDeleteTarget({ id: d.id, filename: d.filename })}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="docs-list">
            {sorted.map((d) => (
              <div key={d.id} className="docs-list-item">
                <div className="docs-list-icon">{fileIcon(d.filename)}</div>
                <div className="docs-list-content">
                  <div className="docs-list-title">{d.filename}</div>
                  <div className="docs-list-details">
                    <div>📅 {formatDate(d.uploadedAt)}</div>
                    <div>📄 {approxSize(d.contentText)}</div>
                    <div className="docs-list-preview">{(d.description || "").slice(0, 120)}</div>
                  </div>
                </div>

                <div className="docs-list-actions">
                <button className="docs-btn view" onClick={() => viewPdf(d.id)}>
                        View
                        </button>
                        <button className="docs-btn view" onClick={() => goFix(d)}>
                          Fix
                        </button>

                  <button className="docs-btn delete" onClick={() => setDeleteTarget({ id: d.id, filename: d.filename })}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="docs-modal-overlay">
          <div className="docs-modal">
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ width: 64, height: 64, borderRadius: 64, background: "#fee", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>🗑️</div>
              <h3>Delete "{deleteTarget.filename}"?</h3>
              <p>This action cannot be undone. Are you sure you want to delete this document?</p>
            </div>
            <div className="docs-modal-actions">
              <button className="docs-btn" onClick={() => setDeleteTarget(null)} style={{ background: "#f5f5f5", color: "#333" }}>
                Cancel
              </button>
              <button className="docs-btn" onClick={() => handleDelete(deleteTarget.id)} style={{ background: "#d32f2f", color: "white" }}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Helper UI functions below --- */

function approxSize(text) {
  if (!text) return "0 KB";
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


function openDocument(doc) {
  const w = window.open("", "_blank");
  if (!w) return alert("Pop-up blocked. Allow popups to view documents.");
  const html = `
    <html>
      <head><title>${escapeHtml(doc.filename)}</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif;padding:18px;white-space:pre-wrap;">${escapeHtml(doc.contentText || '')}</body>
    </html>
  `;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\n/g, "<br/>");
}
