"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  Layers,
  Database,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Volume2,
  Globe,
  HelpCircle,
  X,
  Save,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import {
  fetchExploreMaterials,
  createExploreMaterial,
  updateExploreMaterial,
  deleteExploreMaterial,
  syncSeedExploreMaterials,
} from "@/lib/api";
import type { ExploreMaterial, BilingualTerm, MiniQuizQuestion } from "@/lib/explore-data.config";
import ExploreViewerModal from "@/components/explore/ExploreViewerModal";

const MODEL_OPTIONS = [
  { id: "human_heart", label: "Tim người 3D (KHTN 8 - Bài 31, 32 KNTT)" },
  { id: "fluid_pressure", label: "Áp suất chất lỏng (KHTN 8 - Bài 16 KNTT)" },
  { id: "archimedes_buoyancy", label: "Lực Archimedes & Sự nổi (KHTN 8 - Bài 17 KNTT)" },
  { id: "crystal_nacl", label: "Mạng tinh thể muối NaCl (KHTN 7 - Bài 10 KNTT)" },
  { id: "solar_eclipse", label: "Nhật thực & Nguyệt thực (KHTN 6 - Bài 53 KNTT)" },
  { id: "electric_circuit", label: "Mạch điện kín & Dòng điện (KHTN 8 - Bài 22 KNTT)" },
  { id: "chromosome", label: "Nhiễm sắc thể kép chữ X (Sinh 9 - Bài 8 KNTT)" },
  { id: "molecule_ethene", label: "Etilen C2H4 & Liên kết đôi (Hóa 9 - Bài 37 KNTT)" },
  { id: "atom", label: "Nguyên tử Rutherford - Bohr (KHTN 7)" },
  { id: "molecule_h2o", label: "Phân tử nước H2O (KHTN 7)" },
  { id: "solar_system", label: "Hệ Mặt Trời & 8 Hành tinh (KHTN 6)" },
  { id: "plant_cell", label: "Tế bào thực vật & Lục lạp (KHTN 6)" },
  { id: "earth_layers", label: "Cấu tạo Trái Đất & Lõi Magma (Địa 6)" },
  { id: "light_prism", label: "Lăng kính quang học & Tán sắc (KHTN 7)" },
  { id: "magnetic_field", label: "Từ trường nam châm thẳng (KHTN 8)" },
  { id: "molecule_methane", label: "Phân tử Metan CH4 Tứ diện (KHTN 8/9)" },
  { id: "states_of_matter", label: "3 trạng thái Rắn - Lỏng - Khí (KHTN 6)" },
  { id: "dna", label: "Chuỗi xoắn kép ADN (Sinh 9)" },
  { id: "torus", label: "Vòng xuyến Torus (Vật lý 9)" },
  { id: "sphere", label: "Khối cầu cơ bản" },
];

export default function TeacherExploreManager() {
  const { token } = useAuth();
  const { locale } = useLang();

  // Data states
  const [materials, setMaterials] = useState<ExploreMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSource, setDataSource] = useState<string>("database");
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTextbook, setFilterTextbook] = useState("all");

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<ExploreMaterial | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form Modal (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<"basic" | "model" | "terms">("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete confirm
  const [deletingItem, setDeletingItem] = useState<ExploreMaterial | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    title: "",
    titleEn: "",
    slug: "",
    description: "",
    descriptionEn: "",
    category: "natural_science",
    grade: "8",
    subject: "physics",
    textbook: "Kết Nối Tri Thức",
    modelType: "fluid_pressure",
    type: "3d_model",
    tags: "",
    aiPromptContext: "",
    bilingualTerms: [] as BilingualTerm[],
  });

  // Load materials from Database
  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await fetchExploreMaterials();
      if (res.data) {
        setMaterials(res.data);
        setDataSource(res.source || "database");
      }
    } catch (err) {
      console.error("Failed to load materials from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        !search.trim() ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.titleEn.toLowerCase().includes(search.toLowerCase()) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));

      const matchGrade = filterGrade === "all" || m.grade === filterGrade || m.grade === "all";
      const matchSubject = filterSubject === "all" || m.subject === filterSubject;
      const matchTextbook =
        filterTextbook === "all" ||
        (m.textbook && m.textbook.toLowerCase().includes(filterTextbook.toLowerCase()));

      return matchSearch && matchGrade && matchSubject && matchTextbook;
    });
  }, [materials, search, filterGrade, filterSubject, filterTextbook]);

  // Open Create Form
  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormTab("basic");
    setFormData({
      title: "",
      titleEn: "",
      slug: "",
      description: "",
      descriptionEn: "",
      category: "natural_science",
      grade: "8",
      subject: "physics",
      textbook: "Kết Nối Tri Thức",
      modelType: "fluid_pressure",
      type: "3d_model",
      tags: "KHTN 8, Kết Nối Tri Thức, 3D STEM",
      aiPromptContext: "",
      bilingualTerms: [
        {
          termVi: "",
          termEn: "",
          phonetics: "",
          partOfSpeech: "n.",
          definitionVi: "",
          definitionEn: "",
          exampleEn: "",
          exampleVi: "",
        },
      ],
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (item: ExploreMaterial) => {
    setFormMode("edit");
    setEditingId(item.id);
    setFormTab("basic");
    setFormData({
      title: item.title,
      titleEn: item.titleEn,
      slug: item.slug,
      description: item.description,
      descriptionEn: item.descriptionEn,
      category: item.category,
      grade: item.grade,
      subject: item.subject,
      textbook: item.textbook,
      modelType: item.modelType,
      type: item.type,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      aiPromptContext: item.aiPromptContext || "",
      bilingualTerms: Array.isArray(item.bilingualTerms) && item.bilingualTerms.length > 0
        ? [...item.bilingualTerms]
        : [
            {
              termVi: "",
              termEn: "",
              phonetics: "",
              partOfSpeech: "n.",
              definitionVi: "",
              definitionEn: "",
              exampleEn: "",
              exampleVi: "",
            },
          ],
    });
    setIsFormOpen(true);
  };

  // Save (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài học!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
        bilingualTerms: formData.bilingualTerms.filter((t) => t.termVi.trim() && t.termEn.trim()),
      };

      if (formMode === "create") {
        await createExploreMaterial(payload, token || undefined);
        setNotification({ type: "success", text: "Đã thêm học liệu mới vào Database thành công!" });
      } else if (editingId) {
        await updateExploreMaterial(editingId, payload, token || undefined);
        setNotification({ type: "success", text: "Đã cập nhật học liệu trong Database thành công!" });
      }

      setIsFormOpen(false);
      await loadMaterials();
    } catch (err: any) {
      console.error("Save error:", err);
      setNotification({ type: "error", text: err.message || "Có lỗi xảy ra khi lưu vào Database" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteExploreMaterial(deletingItem.id, token || undefined);
      setNotification({ type: "success", text: `Đã xóa học liệu "${deletingItem.title}" khỏi Database!` });
      setDeletingItem(null);
      await loadMaterials();
    } catch (err: any) {
      console.error("Delete error:", err);
      setNotification({ type: "error", text: err.message || "Không thể xóa học liệu" });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Sync / Seed DB
  const handleSyncSeed = async () => {
    if (!confirm("Bạn có muốn đồng bộ lại toàn bộ 21+ bài học chuẩn GDPT 2018 (Kết Nối Tri Thức) vào Database Neon PostgreSQL không?")) return;
    setIsSyncing(true);
    try {
      const res = await syncSeedExploreMaterials(token || undefined);
      setNotification({
        type: "success",
        text: res.message || "Đã đồng bộ cơ sở dữ liệu thành công!",
      });
      await loadMaterials();
    } catch (err: any) {
      console.error("Sync error:", err);
      setNotification({ type: "error", text: err.message || "Đồng bộ thất bại" });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Helper for adding new bilingual term row
  const addTermRow = () => {
    setFormData((prev) => ({
      ...prev,
      bilingualTerms: [
        ...prev.bilingualTerms,
        {
          termVi: "",
          termEn: "",
          phonetics: "",
          partOfSpeech: "n.",
          definitionVi: "",
          definitionEn: "",
          exampleEn: "",
          exampleVi: "",
        },
      ],
    }));
  };

  const removeTermRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bilingualTerms: prev.bilingualTerms.filter((_, i) => i !== index),
    }));
  };

  const updateTermField = (index: number, field: keyof BilingualTerm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      bilingualTerms: prev.bilingualTerms.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-lg border ${
              notification.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-rose-500/15 border-rose-500/40 text-rose-400"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/80 border border-border/70 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-500">
              <Database className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-foreground">
              Kho Học Liệu 3D & Song Ngữ (Database PostgreSQL)
            </h3>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                dataSource === "database"
                  ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                  : "border-amber-500/50 text-amber-500 bg-amber-500/10"
              }`}
            >
              {dataSource === "database" ? "Neon PostgreSQL Live" : "Local Config"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Quản lý, thêm mới bài giảng mô phỏng 3D, từ vựng song ngữ và xóa học liệu trực tiếp từ cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSeed}
            disabled={isSyncing}
            className="rounded-xl text-xs font-semibold gap-1.5"
            title="Đồng bộ danh sách học liệu chuẩn KNTT vào Database"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ chuẩn KNTT"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md text-xs font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm học liệu 3D mới</span>
          </Button>

          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs gap-1">
            <a href="/explore" target="_blank">
              <span>Xem trang Khám phá</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bài, từ khóa, tag..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          />
        </div>

        {/* Grade filter */}
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Tất cả khối lớp (K-9)</option>
          <option value="6">Lớp 6</option>
          <option value="7">Lớp 7</option>
          <option value="8">Lớp 8 (KHTN 8 Mới)</option>
          <option value="9">Lớp 9 (KHTN 9 Mới)</option>
        </select>

        {/* Subject filter */}
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Tất cả môn học</option>
          <option value="physics">Vật lý (KHTN)</option>
          <option value="chemistry">Hóa học (KHTN)</option>
          <option value="biology">Sinh học (KHTN)</option>
          <option value="math">Toán học & Hình học</option>
          <option value="stem">STEM & Kỹ thuật</option>
          <option value="history_geo">Lịch sử & Địa lý</option>
        </select>

        {/* Textbook filter */}
        <select
          value={filterTextbook}
          onChange={(e) => setFilterTextbook(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Tất cả bộ sách</option>
          <option value="Kết Nối Tri Thức">Kết Nối Tri Thức Với Cuộc Sống</option>
          <option value="Cánh Diều">Cánh Diều</option>
          <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
        </select>
      </div>

      {/* Materials Table / List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Danh sách học liệu trong Database ({filteredMaterials.length} / {materials.length})
          </span>
          {isLoading && <span className="text-primary animate-pulse">Đang tải dữ liệu từ PostgreSQL...</span>}
        </div>

        {filteredMaterials.length === 0 && !isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Không tìm thấy học liệu phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-border/60 overflow-x-auto">
            {filteredMaterials.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 font-bold text-xs uppercase">
                    {item.modelType ? item.modelType.slice(0, 3) : "3D"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-foreground text-sm hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <Badge variant="secondary" className="text-[10px] py-0 px-2">
                        {item.grade === "all" ? "Tất cả lớp" : `Lớp ${item.grade}`}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] py-0 px-2 border-primary/30 text-primary">
                        {item.subjectLabelVi || item.subject}
                      </Badge>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-md">
                        {item.textbook || "KNTT"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.titleEn} • {item.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Mô hình 3D: <code className="text-cyan-600 dark:text-cyan-400">{item.modelType}</code></span>
                      <span>Từ vựng: {item.bilingualTerms?.length || 0} từ</span>
                      <span>Lượt xem: {item.viewsCount}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewMaterial(item);
                      setIsPreviewOpen(true);
                    }}
                    className="h-8 px-2.5 rounded-lg text-xs gap-1 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                    title="Xem thử 3D & Flashcard"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem 3D</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(item)}
                    className="h-8 px-2.5 rounded-lg text-xs gap-1 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Sửa</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingItem(item)}
                    className="h-8 px-2 rounded-lg text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    title="Xóa khỏi Database"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D Preview Modal */}
      <ExploreViewerModal
        material={previewMaterial}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-foreground flex items-center gap-2 text-rose-500">
              <Trash2 className="h-5 w-5" />
              <span>Xác nhận xóa học liệu</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa bài học{" "}
              <strong className="text-foreground">"{deletingItem.title}"</strong> khỏi cơ sở dữ liệu PostgreSQL không? Hành động này sẽ xóa vĩnh viễn và không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingItem(null)}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-neutral-950 border border-neutral-800 text-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>
                    {formMode === "create" ? "Thêm Học Liệu 3D Mới vào Database" : `Chỉnh Sửa Học Liệu (${formData.title})`}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Lưu trữ trực tiếp vào cơ sở dữ liệu PostgreSQL Neon, hiển thị tức thì trên Kho học liệu.
                </p>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center px-5 border-b border-neutral-800 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormTab("basic")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  formTab === "basic"
                    ? "border-blue-500 text-blue-400 bg-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                1. Thông tin bài giảng
              </button>
              <button
                type="button"
                onClick={() => setFormTab("model")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  formTab === "model"
                    ? "border-cyan-500 text-cyan-400 bg-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                2. Cấu hình Mô hình 3D
              </button>
              <button
                type="button"
                onClick={() => setFormTab("terms")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  formTab === "terms"
                    ? "border-emerald-500 text-emerald-400 bg-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                3. Từ vựng song ngữ ({formData.bilingualTerms.length})
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: BASIC INFO */}
              {formTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Tiêu đề tiếng Việt (*)</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="VD: Cấu tạo Tim người và Hệ tuần hoàn máu 3D"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Tiêu đề tiếng Anh</label>
                      <input
                        type="text"
                        value={formData.titleEn}
                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                        placeholder="VD: 3D Human Heart & Circulatory Anatomy"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Khối lớp (*)</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="6">Lớp 6</option>
                        <option value="7">Lớp 7</option>
                        <option value="8">Lớp 8 (KHTN 8)</option>
                        <option value="9">Lớp 9 (KHTN 9)</option>
                        <option value="all">Tất cả khối lớp</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Môn học (*)</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="physics">Vật lý (KHTN)</option>
                        <option value="chemistry">Hóa học (KHTN)</option>
                        <option value="biology">Sinh học (KHTN)</option>
                        <option value="math">Toán học & Hình học</option>
                        <option value="stem">STEM & Kỹ thuật</option>
                        <option value="history_geo">Lịch sử & Địa lý</option>
                        <option value="science">Khoa học tổng hợp</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Bộ sách GDPT 2018</label>
                      <select
                        value={formData.textbook}
                        onChange={(e) => setFormData({ ...formData, textbook: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Kết Nối Tri Thức">Kết Nối Tri Thức Với Cuộc Sống</option>
                        <option value="Cánh Diều">Cánh Diều</option>
                        <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Mô tả bài giảng (Tiếng Việt)</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tóm tắt nội dung bài học, mục tiêu cần đạt..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Từ khóa tìm kiếm (Tags, cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="VD: Tim người, Tuần hoàn, KHTN 8, Kết Nối Tri Thức"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: 3D MODEL CONFIG */}
              {formTab === "model" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Chọn Mô hình 3D tương tác (*)</label>
                    <select
                      value={formData.modelType}
                      onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-900 border border-cyan-500/40 text-cyan-300 focus:outline-none focus:border-cyan-400 font-semibold"
                    >
                      {MODEL_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Mô hình được kết xuất trực tiếp bằng WebGL / Three.js với tương tác xoay 360 độ, phóng to thu nhỏ và chế độ khung dây.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Định dạng học liệu</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="3d_model">Mô hình 3D / XR Giải phẫu</option>
                      <option value="virtual_lab">Thí nghiệm ảo 3D</option>
                      <option value="sandbox">Môi trường Sandbox STEM</option>
                      <option value="quiz">Trắc nghiệm 3D</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Gợi ý bối cảnh Trợ lý AI (Nora AI Prompt Context)</label>
                    <textarea
                      rows={3}
                      value={formData.aiPromptContext}
                      onChange={(e) => setFormData({ ...formData, aiPromptContext: e.target.value })}
                      placeholder="VD: Bạn là Nora AI - Gia sư Sinh học 8 bộ sách Kết Nối Tri Thức. Học sinh đang quan sát mô hình Tim người..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: BILINGUAL TERMS */}
              {formTab === "terms" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Danh sách Thuật ngữ Song ngữ & Flashcard 3D</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Nhập phiên âm IPA và phát âm chuẩn để tự động xuất thẻ Flashcard 3D.
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={addTermRow}
                      className="h-7 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Thêm từ vựng</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.bilingualTerms.map((term, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-900/70 space-y-2.5 relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeTermRow(idx)}
                          className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-rose-400 p-1"
                          title="Xóa từ vựng này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400">Từ tiếng Việt (*)</label>
                            <input
                              type="text"
                              value={term.termVi}
                              onChange={(e) => updateTermField(idx, "termVi", e.target.value)}
                              placeholder="VD: Tâm thất trái"
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-emerald-400 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400">Từ tiếng Anh (*)</label>
                            <input
                              type="text"
                              value={term.termEn}
                              onChange={(e) => updateTermField(idx, "termEn", e.target.value)}
                              placeholder="VD: Left Ventricle"
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-cyan-300 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400">Phiên âm IPA</label>
                            <input
                              type="text"
                              value={term.phonetics || ""}
                              onChange={(e) => updateTermField(idx, "phonetics", e.target.value)}
                              placeholder="VD: /ˈvɛn.trɪ.kəl/"
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-400">Định nghĩa khoa học (Tiếng Việt)</label>
                          <textarea
                            rows={2}
                            value={term.definitionVi}
                            onChange={(e) => updateTermField(idx, "definitionVi", e.target.value)}
                            placeholder="Giải thích ngắn gọn khái niệm theo SGK..."
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-neutral-200"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400">Câu ví dụ tiếng Anh</label>
                            <input
                              type="text"
                              value={term.exampleEn || ""}
                              onChange={(e) => updateTermField(idx, "exampleEn", e.target.value)}
                              placeholder="VD: The left ventricle pumps oxygen-rich blood..."
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-cyan-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400">Dịch nghĩa câu ví dụ</label>
                            <input
                              type="text"
                              value={term.exampleVi || ""}
                              onChange={(e) => updateTermField(idx, "exampleVi", e.target.value)}
                              placeholder="VD: Tâm thất trái bơm máu giàu oxy vào động mạch chủ..."
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-neutral-300"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-neutral-800 flex items-center justify-between pt-4">
                <div className="text-[11px] text-neutral-400">
                  {formMode === "create" ? "Tạo mới học liệu trong Database" : "Cập nhật học liệu đang chọn"}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? "Đang lưu..." : "Lưu vào Cơ sở dữ liệu"}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
