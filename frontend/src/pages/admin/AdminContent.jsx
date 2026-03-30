import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { BookOpen, Save, ArrowLeft, Link2, Check, FileText } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminContent() {
  const { token } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    try {
      const [chRes, prRes] = await Promise.all([
        axios.get(`${API}/admin/chapters`, { headers }),
        axios.get(`${API}/admin/products-settings`, { headers }),
      ]);
      setChapters(chRes.data.chapters);
      setProducts(prRes.data.products);
    } catch { toast.error("Failed to load content"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveChapter = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/chapters/${editing}`, { content: editContent }, { headers });
      toast.success(`Chapter ${editing} saved!`);
      setEditing(null);
      fetchData();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleSavePdf = async (productKey, pdfUrl) => {
    setPdfSaving(productKey);
    try {
      await axios.put(`${API}/admin/products-settings/${productKey}`, { pdf_url: pdfUrl }, { headers });
      toast.success("PDF URL saved!");
    } catch { toast.error("Failed to save"); }
    finally { setPdfSaving(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;
  }

  if (editing) {
    const ch = chapters.find((c) => c.chapter_number === editing);
    return (
      <div data-testid="admin-chapter-editor">
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1B3A6B] mb-4 transition-colors"
          data-testid="editor-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chapters
        </button>

        <Card className="border-0 shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">
            Chapter {ch?.chapter_number}: {ch?.title}
          </h2>
          <p className="text-xs text-slate-400 mb-4">{ch?.description}</p>

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={20}
            className="w-full border border-slate-200 rounded-lg p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-y"
            placeholder="Paste or type chapter content here..."
            data-testid="editor-textarea"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditing(null)} data-testid="editor-cancel">Cancel</Button>
            <Button
              onClick={handleSaveChapter}
              disabled={saving}
              className="bg-[#1B3A6B] hover:bg-[#152e56] text-white gap-1"
              data-testid="editor-save"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Content"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="admin-content">
      <h1 className="text-xl font-bold text-[#0F172A] mb-4">Content Manager</h1>

      {/* Chapters */}
      <h2 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        Guide Chapters ({chapters.length})
      </h2>
      <Card className="border-0 shadow-sm mb-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="admin-chapters-table">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 hidden md:table-cell">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch, i) => (
                <tr key={ch.chapter_number} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-3 font-bold text-[#1B3A6B]">{ch.chapter_number}</td>
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{ch.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">{ch.description}</td>
                  <td className="px-4 py-3">
                    {ch.has_content ? (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <Check className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => { setEditing(ch.chapter_number); setEditContent(ch.content); }}
                      data-testid={`edit-chapter-${ch.chapter_number}`}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Products PDF URLs */}
      <h2 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Product PDF URLs ({products.length})
      </h2>
      <Card className="border-0 shadow-sm" data-testid="admin-products-pdf">
        <div className="divide-y divide-slate-100">
          {products.map((p) => (
            <ProductPdfRow
              key={p.product_key}
              product={p}
              saving={pdfSaving === p.product_key}
              onSave={(url) => handleSavePdf(p.product_key, url)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProductPdfRow({ product, saving, onSave }) {
  const [url, setUrl] = useState(product.pdf_url);

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`product-pdf-${product.product_key}`}>
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-sm font-medium text-[#0F172A]">{product.product_name}</p>
        <p className="text-[10px] text-slate-400">₹{product.price}</p>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Paste Google Drive / Cloudinary PDF URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-9 h-9 text-xs"
            data-testid={`pdf-url-input-${product.product_key}`}
          />
        </div>
        <Button
          size="sm"
          className="h-9 bg-[#1B3A6B] hover:bg-[#152e56] text-white text-xs gap-1"
          disabled={saving}
          onClick={() => onSave(url)}
          data-testid={`pdf-save-${product.product_key}`}
        >
          <Save className="h-3 w-3" />
          {saving ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
