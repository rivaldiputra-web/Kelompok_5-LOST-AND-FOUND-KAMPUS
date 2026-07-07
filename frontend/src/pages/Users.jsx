import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

const timeAgo = (dateString) => {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const avatarColors = [
  "linear-gradient(135deg,#6366f1,#4338ca)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#ef4444,#dc2626)",
  "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#06b6d4,#0891b2)",
];
const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

function PostCard({ item, user, handleClaim, handleDeleteItem, setSelectedItem, navigate }) {
  const [boosted, setBoosted] = useState(item.is_boosted_by_me || false);
  const [boostCount, setBoostCount] = useState(item.boost_count || 0);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(item.comment_count || 0);
  const [showShareToast, setShowShareToast] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync state with item props changes (e.g. on search or refresh)
  useEffect(() => {
    setBoosted(item.is_boosted_by_me || false);
    setBoostCount(item.boost_count || 0);
    setCommentCount(item.comment_count || 0);
  }, [item.is_boosted_by_me, item.boost_count, item.comment_count]);

  // Fetch comments when comments expanded
  useEffect(() => {
    if (commentsExpanded) {
      const fetchComments = async () => {
        try {
          const res = await apiRequest(`/api/public/items/${item.id}/comments`);
          if (res.status) {
            setComments(res.data);
          }
        } catch (e) {
          console.error("Gagal mengambil tanggapan:", e);
        }
      };
      fetchComments();
    }
  }, [commentsExpanded, item.id]);

  const handleToggleBoost = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const res = await apiRequest(`/api/items/${item.id}/boost`, { method: "POST" });
      if (res.status) {
        setBoosted(res.data.boosted);
        if (typeof res.data.boost_count === 'number') {
          setBoostCount(res.data.boost_count);
        } else {
          setBoostCount(prev => res.data.boosted ? prev + 1 : Math.max(0, prev - 1));
        }
      }
    } catch (e) {
      console.error("Gagal memberikan dukungan:", e);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/p/${item.slug || item.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      })
      .catch(err => console.error("Gagal menyalin link:", err));
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    
    try {
      const res = await apiRequest(`/api/items/${item.id}/comments`, {
        method: "POST",
        body: { text: newCommentText }
      });

      if (res.status) {
        setComments(prev => [...prev, res.data]);
        setCommentCount(prev => prev + 1);
        setNewCommentText("");
      }
    } catch (e) {
      console.error("Gagal mengirim tanggapan:", e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await apiRequest(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.status) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Gagal menghapus komentar:", e);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await apiRequest(`/api/comments/${commentId}`, {
        method: "PATCH",
        body: { text: editCommentText }
      });
      if (res.status) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: res.data.text } : c));
        setEditingCommentId(null);
        setEditCommentText("");
      }
    } catch (e) {
      console.error("Gagal mengedit komentar:", e);
    }
  };

  const isReportedByMe = user && item.user_id === parseInt(user.id, 10);
  const isAdmin = user && user.role === "admin";
  const showClaimButton = item.type === "found" && item.status === "available" && !isReportedByMe;
  const showDeleteButton = isReportedByMe || isAdmin;
  const firstLetter = item.user?.name ? item.user.name.charAt(0).toUpperCase() : "U";
  const isLost = item.type === "lost";

  return (
    <article className="lf-card lf-post w-100 text-start overflow-hidden">
      <div className={`lf-post-accent ${isLost ? "lf-post-accent--lost" : "lf-post-accent--found"}`}></div>

      {/* Card Header */}
      <div className="p-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2.5">
          <div className="lf-avatar"
               style={{
                 background: isLost ? "linear-gradient(135deg, #fb7185, #e11d48)" : "linear-gradient(135deg, #34d399, #059669)"
               }}>
            {firstLetter}
          </div>
          <div>
            <h6 className="m-0 fw-bold lf-name">{item.user?.name || "Anonim"}</h6>
            <small className="lf-meta-time">
              {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className={`lf-badge ${isLost ? "lf-badge--lost" : "lf-badge--found"}`}>
            {isLost ? "Barang Hilang" : "Barang Temuan"}
          </span>

          {showDeleteButton && (
            <div className="dropdown post-options-dropdown">
              <button
                className="lf-icon-btn"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-three-dots"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end lf-dropdown">
                <li>
                  <button
                    className="dropdown-item lf-dropdown-item-danger"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <i className="bi bi-trash3-fill"></i> Hapus Laporan
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Card Title & Category */}
      <div className="px-3 pb-1">
        <span className="lf-tag">
          <i className="bi bi-tag-fill"></i> {item.category?.name}
        </span>
        <h5 
          className="fw-bold lf-post-title m-0 mt-2 lf-clickable-title"
          onClick={() => setSelectedItem(item)}
          title="Klik untuk melihat detail"
        >
          {item.title}
        </h5>
      </div>

      {/* Card Body (Description) */}
      <div className="px-3 py-2">
        <p className="lf-description mb-3">
          {item.description.length > 150 && !isExpanded ? (
            <>
              {item.description.substring(0, 150)}...
              <button 
                type="button" 
                className="lf-readmore-btn"
                onClick={() => setIsExpanded(true)}
              >
                Lihat Selengkapnya
              </button>
            </>
          ) : (
            <>
              {item.description}
              {item.description.length > 150 && (
                <button 
                  type="button" 
                  className="lf-readmore-btn"
                  onClick={() => setIsExpanded(false)}
                >
                  Sembunyikan
                </button>
              )}
            </>
          )}
        </p>

        <div className="lf-spec-box">
          <div className="lf-spec-row"><i className="bi bi-geo-alt-fill text-danger"></i><span><b>Lokasi:</b> {item.location}</span></div>
          <div className="lf-spec-row">
            <i className="bi bi-clock-fill text-primary"></i>
            <span><b>Waktu:</b> {new Date(item.date_time).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="lf-spec-row">
            <i className="bi bi-shield-exclamation text-info"></i>
            <span><b>Status:</b> <span className="text-capitalize fw-bold lf-status">{item.status.replace(/_/g, ' ')}</span></span>
          </div>
        </div>
      </div>

      {/* Image Section */}
      {item.image_path && (
        <div 
          className="lf-image-wrap lf-clickable-image"
          onClick={() => setSelectedItem(item)}
          title="Klik untuk melihat detail"
        >
          <img
            src={item.image_path}
            alt={item.title}
            className="lf-image"
          />
        </div>
      )}

      {/* Interaction Bar */}
      <div className="lf-interaction-bar d-flex align-items-stretch px-2 py-1">
        <button
          className={`lf-ibar-btn flex-fill ${boosted ? "lf-ibar-btn--boosted" : ""}`}
          onClick={handleToggleBoost}
        >
          <i className={`bi ${boosted ? "bi-heart-fill lf-heart-active" : "bi-heart"}`}></i>
          <span>Bantu Up</span>
          {boostCount > 0 && <span className={`lf-count-pill ${boosted ? "lf-count-pill--red" : ""}`}>{boostCount}</span>}
        </button>

        <div className="lf-ibar-sep"></div>

        <button
          className={`lf-ibar-btn flex-fill ${commentsExpanded ? "lf-ibar-btn--active" : ""}`}
          onClick={() => setCommentsExpanded(!commentsExpanded)}
        >
          <i className={`bi ${commentsExpanded ? "bi-chat-text-fill" : "bi-chat-text"}`}></i>
          <span>Diskusi</span>
          {commentCount > 0 && <span className={`lf-count-pill ${commentsExpanded ? "lf-count-pill--blue" : ""}`}>{commentCount}</span>}
        </button>

        <div className="lf-ibar-sep"></div>

        <div className="flex-fill position-relative">
          <button
            className="lf-ibar-btn w-100 h-100"
            onClick={handleShare}
          >
            <i className="bi bi-share"></i>
            <span>Bagikan</span>
          </button>
          {showShareToast && (
            <div className="lf-share-toast">
              <i className="bi bi-check2-circle"></i> Tersalin!
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {commentsExpanded && (
        <div className="lf-comments-section px-3 pt-3 pb-2 text-start">
          <div className="lf-comments-list d-flex flex-column gap-2 mb-3">
            {comments.map((comment) => {
              const isMyComment = user && comment.user_id === parseInt(user.id, 10);
              const isAdminUser = user && user.role === "admin";
              const isEditing = editingCommentId === comment.id;

              return (
                <div key={comment.id} className="d-flex gap-2 align-items-start">
                  <div className="lf-avatar-xs" style={{ background: getAvatarColor(comment.user?.name) }}>
                    {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="lf-comment-bubble flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold lf-comment-name">{comment.user?.name || "Anonim"}</span>
                      <div className="d-flex align-items-center gap-1">
                        <span className="lf-comment-time">{timeAgo(comment.created_at)}</span>
                        {isMyComment && !isEditing && (
                          <button
                            className="lf-comment-action-btn"
                            title="Edit komentar"
                            onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        )}
                        {(isMyComment || isAdminUser) && !isEditing && (
                          <button
                            className="lf-comment-action-btn lf-comment-action-btn--danger"
                            title="Hapus komentar"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="lf-comment-edit-wrap">
                        <input
                          type="text"
                          className="lf-comment-input lf-comment-input--edit"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditComment(comment.id);
                            if (e.key === "Escape") { setEditingCommentId(null); setEditCommentText(""); }
                          }}
                          autoFocus
                        />
                        <div className="d-flex gap-1 mt-1">
                          <button className="lf-edit-save-btn" onClick={() => handleEditComment(comment.id)}>
                            <i className="bi bi-check-lg"></i> Simpan
                          </button>
                          <button className="lf-edit-cancel-btn" onClick={() => { setEditingCommentId(null); setEditCommentText(""); }}>
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="m-0 lf-comment-text">{comment.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && (
              <div className="lf-comments-empty">
                <i className="bi bi-chat-square-dots"></i>
                <span>Belum ada diskusi. Jadilah yang pertama!</span>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handlePostComment} className="lf-comment-form">
            <div className="lf-avatar-xs" style={{ background: user ? getAvatarColor(user.name) : "linear-gradient(135deg,#94a3b8,#64748b)" }}>
              {user ? user.name.charAt(0).toUpperCase() : "G"}
            </div>
            <input
              type="text"
              className="lf-comment-input flex-grow-1"
              placeholder={user ? "Tulis tanggapan atau petunjuk..." : "Masuk untuk menulis tanggapan..."}
              disabled={!user}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="lf-comment-send"
              disabled={!user || !newCommentText.trim()}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      )}

      {/* Actions */}
      {showClaimButton && (
        <div className="p-3 lf-post-footer">
          <button
            className="lf-btn lf-btn-primary w-100"
            onClick={() => handleClaim(item.id, item.title)}
          >
            <i className="bi bi-shield-check"></i> Ajukan Klaim
          </button>
        </div>
      )}

      {isReportedByMe && (
        <div className="p-3 lf-post-footer d-flex justify-content-center">
          <div className="lf-self-badge w-100">
            <i className="bi bi-person-check-fill"></i> Laporan Anda
          </div>
        </div>
      )}
    </article>
  );
}

function Users() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);


  const [selectedItem, setSelectedItem] = useState(null);

  const handleCloseModal = () => {
    setSelectedItem(null);
    if (slug) {
      navigate("/");
    }
  };

  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const size = 5; // Muat 5 item per scroll

  // Filters State
  const [filters, setFilters] = useState({
    q: "",
    category_id: "",
    type: "",
    status: ""
  });

  const [activeFilters, setActiveFilters] = useState({
    q: "",
    category_id: "",
    type: "",
    status: ""
  });

  const [sortBy, setSortBy] = useState("created_at");

  const loaderRef = useRef(null);



  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await apiRequest("/api/categories");
        if (result.status) setCategories(result.data);
      } catch (e) {
        console.error("Gagal mengambil kategori:", e);
      }
    };
    fetchCategories();
  }, []);

  // Fetch shared item if slug parameter exists
  useEffect(() => {
    if (slug) {
      const fetchSharedItem = async () => {
        try {
          const endpoint = user ? `/api/items/${slug}` : `/api/public/items/${slug}`;
          const res = await apiRequest(endpoint);
          if (res.status) {
            setSelectedItem(res.data);
          }
        } catch (e) {
          console.error("Gagal mengambil detail barang yang dibagikan:", e);
        }
      };
      fetchSharedItem();
    }
  }, [slug, user]);

  // Fetch items (reset = true akan mengosongkan list lama saat ganti filter)
  const fetchItems = async (pageNumber, reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const endpointPrefix = user ? "/api/items" : "/api/public/items";
      let query = `${endpointPrefix}?page=${pageNumber}&size=${size}&sort_by=${sortBy}`;
      if (activeFilters.q) query += `&q=${encodeURIComponent(activeFilters.q)}`;
      if (activeFilters.category_id) query += `&category_id=${activeFilters.category_id}`;
      if (activeFilters.type) query += `&type=${activeFilters.type}`;
      if (activeFilters.status) query += `&status=${activeFilters.status}`;

      const result = await apiRequest(query);
      if (result.status) {
        const newItems = result.data;
        if (reset) {
          setItems(newItems);
        } else {
          setItems((prev) => {
            const existingKeys = new Set(prev.map((i) => `${i.type}-${i.id}`));
            return [...prev, ...newItems.filter((i) => !existingKeys.has(`${i.type}-${i.id}`))];
          });
        }

        if (newItems.length < size) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (e) {
      console.error("Gagal memuat barang:", e);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  // Trigger ulang dari awal saat filter aktif atau pengurutan berubah
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchItems(1, true);
  }, [activeFilters, sortBy]);

  // Observer untuk mendeteksi scroll mencapai dasar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchItems(nextPage);
        }
      },
      { threshold: 0.5 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loaderRef, page, hasMore, loading]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = (e) => {
    if (e) e.preventDefault();
    setActiveFilters(filters);
  };

  const resetFilters = () => {
    const reset = { q: "", category_id: "", type: "", status: "" };
    setFilters(reset);
    setActiveFilters(reset);
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");

  const handleQuickPostClick = () => {
    if (!user) {
      Swal.fire({
        title: "Perlu Masuk Akun",
        text: "Anda harus login terlebih dahulu untuk dapat membuat laporan barang.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Masuk Sekarang",
        cancelButtonText: "Batal"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }
    // Arahkan ke form laporkan barang secara default (hilang)
    navigate("/report?type=lost");
  };

  const handleCreateReportRedirect = (type) => {
    if (!user) {
      Swal.fire({
        title: "Perlu Masuk Akun",
        text: `Anda harus login terlebih dahulu untuk dapat membuat laporan barang ${type === "lost" ? "hilang" : "temuan"}.`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Masuk Sekarang",
        cancelButtonText: "Batal"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }
    navigate(`/report?type=${type}`);
  };

  const handleDeleteItem = async (itemId) => {
    Swal.fire({
      title: "Hapus Laporan?",
      text: "Laporan barang ini akan dihapus secara permanen dari sistem.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiRequest(`/api/items/${itemId}`, { method: "DELETE" });
          Swal.fire("Terhapus!", "Laporan barang berhasil dihapus.", "success");
          // Reset list dari halaman 1
          setActiveFilters({ ...activeFilters });
        } catch (e) {
          Swal.fire("Gagal", e.message, "error");
        }
      }
    });
  };

  const handleClaim = async (itemId, itemTitle) => {
    if (!user) {
      Swal.fire({
        title: "Perlu Masuk Akun",
        text: "Anda harus login terlebih dahulu untuk mengajukan klaim kepemilikan barang.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Masuk Sekarang",
        cancelButtonText: "Batal"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    Swal.fire({
      title: `Ajukan Klaim: ${itemTitle}`,
      html: `
        <div class="text-start">
          <label class="form-label fw-bold mb-1" style="font-size: 13px;">Deskripsi Bukti Kepemilikan <span class="text-danger">*</span></label>
          <textarea id="swal-proof-desc" class="form-control mb-3 shadow-none" rows="4" placeholder="Tuliskan detail ciri khusus barang, waktu/lokasi kemungkinan hilang, atau detail nota..." style="font-size: 13.5px; border-radius: 8px; border: 1px solid #cbd5e1;"></textarea>
          
          <label class="form-label fw-bold mb-1" style="font-size: 13px;">Foto Bukti (Opsional)</label>
          <input type="file" id="swal-proof-file" class="form-control shadow-none" accept="image/*" style="font-size: 13px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 6px 12px;">
          <small class="text-muted d-block mt-1" style="font-size: 11px;">Unggah foto barang saat Anda gunakan, foto nota pembelian, atau bukti fisik lainnya.</small>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Kirim Klaim",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3b82f6",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const proofDescription = document.getElementById("swal-proof-desc").value;
        const fileInput = document.getElementById("swal-proof-file");
        const file = fileInput.files[0];

        if (!proofDescription || proofDescription.trim().length < 10) {
          Swal.showValidationMessage("Deskripsi bukti minimal 10 karakter");
          return false;
        }

        let proof_image_path = null;

        if (file) {
          try {
            const formData = new FormData();
            formData.append("image", file);
            
            const uploadRes = await apiRequest("/api/upload", {
              method: "POST",
              body: formData
            });

            if (uploadRes.status && uploadRes.data && uploadRes.data.url) {
              proof_image_path = uploadRes.data.url;
            } else {
              Swal.showValidationMessage("Gagal mengunggah foto bukti");
              return false;
            }
          } catch (uploadErr) {
            Swal.showValidationMessage(`Gagal mengunggah foto: ${uploadErr.message}`);
            return false;
          }
        }

        try {
          const result = await apiRequest("/api/claims", {
            method: "POST",
            body: {
              item_id: itemId,
              proof_description: proofDescription,
              proof_image_path: proof_image_path
            }
          });
          return result;
        } catch (error) {
          Swal.showValidationMessage(`Gagal: ${error.message}`);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && result.value.status) {
        Swal.fire("Klaim Diajukan!", "Pengajuan klaim Anda telah berhasil dikirim. Harap tunggu persetujuan dari Admin.", "success");
        // Reload list
        setActiveFilters({ ...activeFilters });
      }
    });
  };

  return (
    <div className="container-fluid mt-2 lf-page">
      <div className="row g-4 justify-content-center">
        {/* KOLOM TENGAH: NEWS FEED & FILTER */}
        <div className="col-12 col-lg-8" style={{ maxWidth: "700px" }}>

          <div className="w-100 text-start mb-3 lf-header">
            <span className="lf-eyebrow">
              <i className="bi bi-broadcast"></i> Linimasa Kampus
            </span>
            <h2 className="fw-bold m-0 lf-title">Kabar Barang Hilang &amp; Temuan</h2>
            <p className="text-secondary small m-0 mt-1">
              Pantau laporan terbaru dari seluruh civitas kampus, lalu bantu temukan kembali barang yang hilang.
            </p>
          </div>

          {/* KOTAK PINTASAN PEMBUAT POSTINGAN */}
          <div className="lf-card lf-composer mb-3 p-3 text-start">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="lf-avatar"
                   style={{
                     background: user ? "linear-gradient(135deg, #6366f1, #4338ca)" : "linear-gradient(135deg, #94a3b8, #64748b)"
                   }}>
                {user ? user.name.charAt(0).toUpperCase() : "G"}
              </div>
              <button
                onClick={handleQuickPostClick}
                className="lf-composer-input flex-grow-1"
              >
                {user ? `Ada barang hilang atau temuan baru, ${user.name.split(" ")[0]}?` : "Ingin melaporkan barang hilang atau temuan?"}
              </button>
            </div>
            <div className="lf-divider"></div>
            <div className="d-flex justify-content-around align-items-center pt-2">
              <button
                onClick={() => handleCreateReportRedirect("lost")}
                className="lf-action-link lf-action-link--lost"
              >
                <i className="bi bi-exclamation-circle-fill"></i> Laporkan Hilang
              </button>
              <div className="lf-vdivider"></div>
              <button
                onClick={() => handleCreateReportRedirect("found")}
                className="lf-action-link lf-action-link--found"
              >
                <i className="bi bi-box-seam-fill"></i> Laporkan Temuan
              </button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="lf-card p-3 mb-4 w-100">
            <form onSubmit={applyFilters} className="row g-2 align-items-end">
              <div className="col-12 col-md-4">
                <label className="lf-label">Cari barang</label>
                <div className="lf-input-group">
                  <i className="bi bi-search lf-input-icon"></i>
                  <input
                    type="text"
                    className="lf-input"
                    placeholder="Nama, ciri, atau lokasi..."
                    name="q"
                    value={filters.q}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div className="col-6 col-md-3">
                <label className="lf-label">Kategori</label>
                <select className="lf-select" name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-2">
                <label className="lf-label">Tipe</label>
                <select className="lf-select" name="type" value={filters.type} onChange={handleFilterChange}>
                  <option value="">Semua Tipe</option>
                  <option value="lost">Hilang</option>
                  <option value="found">Temuan</option>
                </select>
              </div>

              <div className="col-12 col-md-3 d-flex gap-2">
                <button type="submit" className="lf-btn lf-btn-primary w-50">
                  <i className="bi bi-funnel-fill"></i> Cari
                </button>
                <button type="button" className="lf-btn lf-btn-ghost w-50" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </form>

            {hasActiveFilters && (
              <div className="lf-filter-chips mt-3">
                {activeFilters.q && <span className="lf-chip"><i className="bi bi-search"></i> "{activeFilters.q}"</span>}
                {activeFilters.category_id && (
                  <span className="lf-chip">
                    <i className="bi bi-tag-fill"></i> {categories.find((c) => String(c.id) === String(activeFilters.category_id))?.name || "Kategori"}
                  </span>
                )}
                {activeFilters.type && (
                  <span className="lf-chip">
                    <i className={`bi ${activeFilters.type === "lost" ? "bi-exclamation-circle-fill" : "bi-box-seam-fill"}`}></i>
                    {activeFilters.type === "lost" ? "Hilang" : "Temuan"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* TAB TREN FILTER */}
          <div className="lf-sort-tabs-container mb-4">
            <div className="lf-sort-tabs-wrapper p-1 rounded-pill d-flex position-relative align-items-center w-100">
              {/* Sliding background */}
              <div 
                className="lf-sort-active-bg position-absolute rounded-pill"
                style={{
                  width: "calc(50% - 8px)",
                  height: "calc(100% - 8px)",
                  top: "4px",
                  left: sortBy === "created_at" ? "4px" : "calc(50% + 4px)",
                  transition: "left 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: 1
                }}
              >
                {/* Indigo Gradient Layer (Terbaru) */}
                <div 
                  className="position-absolute w-100 h-100 top-0 start-0 rounded-pill"
                  style={{
                    background: "linear-gradient(135deg, var(--lf-primary), var(--lf-primary-dark))",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
                    opacity: sortBy === "created_at" ? 1 : 0,
                    transition: "opacity 0.32s ease",
                  }}
                />
                {/* Red/Orange Gradient Layer (Mendesak) */}
                <div 
                  className="position-absolute w-100 h-100 top-0 start-0 rounded-pill"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #e11d48)",
                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.35)",
                    opacity: sortBy === "boosts" ? 1 : 0,
                    transition: "opacity 0.32s ease",
                  }}
                />
              </div>
              
              <button
                className={`btn w-50 px-2 py-2.5 rounded-pill fw-bold border-0 lf-sort-btn-pill d-flex align-items-center justify-content-center ${
                  sortBy === "created_at" ? "text-white active" : "text-secondary"
                }`}
                onClick={() => setSortBy("created_at")}
                style={{ zIndex: 2, transition: "color 0.25s", fontSize: "13px" }}
              >
                Terbaru
              </button>
              <button
                className={`btn w-50 px-2 py-2.5 rounded-pill fw-bold border-0 lf-sort-btn-pill d-flex align-items-center justify-content-center ${
                  sortBy === "boosts" ? "text-white active" : "text-secondary"
                }`}
                onClick={() => setSortBy("boosts")}
                style={{ zIndex: 2, transition: "color 0.25s", fontSize: "13px" }}
              >
                Mendesak
              </button>
            </div>
          </div>

          {/* LINIMASA FEED */}
          <div className="d-flex flex-column gap-3 w-100">
            {items.map((item) => (
              <PostCard
                key={`${item.type}-${item.id}`}
                item={item}
                user={user}
                handleClaim={handleClaim}
                handleDeleteItem={handleDeleteItem}
                setSelectedItem={setSelectedItem}
                navigate={navigate}
              />
            ))}

            {hasMore && (
              <div ref={loaderRef} className="d-flex justify-content-center my-4 py-2 w-100">
                <div className="lf-spinner" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="text-center py-5 lf-end-marker">
                <i className="bi bi-check2-circle display-4 mb-2 d-block"></i>
                <p className="fw-semibold small m-0">Anda telah mencapai ujung berita barang kampus.</p>
              </div>
            )}

            {items.length === 0 && !loading && (
              <div className="text-center py-5 lf-empty w-100">
                <i className="bi bi-newspaper display-3 mb-3 d-block"></i>
                <p className="fw-semibold m-0">Tidak ada kiriman berita barang saat ini.</p>
              </div>
            )}
          </div>

        </div>

        {/* KOLOM KANAN: GUEST WIDGET */}
        {/* {!user && (
          <div className="col-12 col-lg-4 d-none d-lg-block lf-sidebar" style={{ maxWidth: "380px" }}>
            <div className="lf-card lf-guest-card p-4 mb-4 text-center">
              <div className="lf-guest-icon">
                <i className="bi bi-person-fill-lock"></i>
              </div>
              <h5 className="fw-bold lf-name mb-2">Portal Lost &amp; Found</h5>
              <p className="text-secondary small mb-4">Silakan masuk ke akun Anda untuk dapat melapor barang baru atau mengklaim bukti temuan.</p>
              <button onClick={() => navigate("/login")} className="lf-btn lf-btn-primary w-100">
                <i className="bi bi-box-arrow-in-right"></i> Masuk / Daftar
              </button>
            </div>
          </div>
        )} */}
      </div>

      {/* Pop-up Modal Detail Laporan */}
      {selectedItem && (
        <div className="modal fade show d-block lf-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content lf-modal">
              {/* Modal Header */}
              <div className="modal-header lf-modal-header px-4 py-3">
                <h5 className="modal-title fw-bold lf-name m-0">
                  <i className="bi bi-info-circle-fill lf-icon-accent"></i> Detail Laporan Barang
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={handleCloseModal} aria-label="Close"></button>
              </div>
              {/* Modal Body */}
              <div className="modal-body p-4 text-start">
                <div className="row g-4">
                  {/* Left column: Image */}
                  <div className="col-12 col-md-5">
                    {selectedItem.image_path ? (
                      <img
                        src={selectedItem.image_path}
                        alt={selectedItem.title}
                        className="lf-modal-image"
                      />
                    ) : (
                      <div className="lf-modal-noimage">
                        <i className="bi bi-image"></i>
                        <span className="small fw-semibold">Tidak ada foto barang</span>
                      </div>
                    )}
                  </div>

                  {/* Right column: Details */}
                  <div className="col-12 col-md-7 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2.5">
                        <span className={`lf-badge ${selectedItem.type === "lost" ? "lf-badge--lost" : "lf-badge--found"}`}>
                          {selectedItem.type === "lost" ? "Barang Hilang" : "Barang Temuan"}
                        </span>
                        <span className="lf-tag">
                          <i className="bi bi-tag-fill"></i> {selectedItem.category?.name}
                        </span>
                      </div>

                      <h4 className="fw-bold lf-post-title mb-2">{selectedItem.title}</h4>
                      <p className="text-secondary small mb-3">
                        Dilaporkan oleh <b>{selectedItem.user?.name || "Anonim"}</b> pada {new Date(selectedItem.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>

                      <p className="lf-description mb-3" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {selectedItem.description}
                      </p>
                    </div>

                    {/* Spec box */}
                    <div className="lf-spec-box mb-1">
                      <div className="lf-spec-row"><i className="bi bi-geo-alt-fill text-danger"></i><span><b>Lokasi:</b> {selectedItem.location}</span></div>
                      <div className="lf-spec-row">
                        <i className="bi bi-clock-fill text-primary"></i>
                        <span><b>Waktu:</b> {new Date(selectedItem.date_time).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="lf-spec-row">
                        <i className="bi bi-shield-exclamation text-info"></i>
                        <span><b>Status:</b> <span className="text-capitalize fw-bold lf-status">{selectedItem.status.replace(/_/g, ' ')}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Modal Footer */}
              <div className="modal-footer lf-modal-footer px-4 py-3 d-flex justify-content-end gap-2">
                <button type="button" className="lf-btn lf-btn-ghost px-4" onClick={handleCloseModal}>Tutup</button>

                {/* Claim Button inside modal */}
                {selectedItem.type === "found" && selectedItem.status === "available" && !(user && selectedItem.user_id === parseInt(user.id, 10)) && (
                  <button
                    type="button"
                    className="lf-btn lf-btn-primary px-4"
                    onClick={() => {
                      handleCloseModal(); // Close modal first
                      handleClaim(selectedItem.id, selectedItem.title);
                    }}
                  >
                    <i className="bi bi-shield-check"></i> Ajukan Klaim Kepemilikan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lf-page {
          --lf-bg: #f5f6fb;
          --lf-ink: #1e2433;
          --lf-muted: #6b7385;
          --lf-primary: #6366f1;
          --lf-primary-dark: #4338ca;
          --lf-lost: #e11d48;
          --lf-lost-bg: #fff1f2;
          --lf-found: #059669;
          --lf-found-bg: #ecfdf5;
          --lf-border: #eceef5;
          --lf-radius: 18px;
          color: var(--lf-ink);
        }

        .lf-card {
          background: #ffffff;
          border: 1px solid var(--lf-border);
          border-radius: var(--lf-radius);
          box-shadow: 0 1px 2px rgba(30, 36, 51, 0.04), 0 8px 24px -16px rgba(30, 36, 51, 0.12);
        }

        /* Header */
        .lf-header { padding: 4px 4px 0; }
        .lf-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--lf-primary-dark);
          background: rgba(99, 102, 241, 0.1);
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 8px;
        }
        .lf-title {
          font-size: 1.65rem;
          letter-spacing: -0.01em;
          color: var(--lf-ink);
        }

        /* Composer */
        .lf-avatar {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .lf-composer-input {
          border: none;
          text-align: left;
          background: var(--lf-bg);
          color: var(--lf-muted);
          border-radius: 999px;
          padding: 11px 18px;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .lf-composer-input:hover {
          background: #ebedf7;
          color: var(--lf-ink);
        }
        .lf-divider { height: 1px; background: var(--lf-border); margin: 0; }
        .lf-vdivider { width: 1px; height: 22px; background: var(--lf-border); }

        .lf-action-link {
          background: none;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 10px;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .lf-action-link--lost { color: var(--lf-lost); }
        .lf-action-link--found { color: var(--lf-found); }
        .lf-action-link:hover { background: var(--lf-bg); }
        .lf-action-link i { font-size: 1.05rem; }

        /* Filter bar */
        .lf-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--lf-muted);
          margin-bottom: 6px;
        }
        .lf-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .lf-input-icon {
          position: absolute;
          left: 14px;
          color: var(--lf-muted);
          font-size: 14px;
          pointer-events: none;
        }
        .lf-input, .lf-select {
          width: 100%;
          background: var(--lf-bg);
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          color: var(--lf-ink);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .lf-input { padding-left: 38px; }
        .lf-input:focus, .lf-select:focus {
          outline: none;
          background: #fff;
          border-color: var(--lf-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .lf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13.5px;
          font-weight: 700;
          transition: transform 0.08s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
          cursor: pointer;
        }
        .lf-btn-primary {
          background: linear-gradient(135deg, var(--lf-primary), var(--lf-primary-dark));
          color: #fff;
          box-shadow: 0 4px 12px -4px rgba(99, 102, 241, 0.5);
        }
        .lf-btn-primary:hover { box-shadow: 0 6px 16px -4px rgba(99, 102, 241, 0.6); transform: translateY(-1px); color: #fff; }
        .lf-btn-ghost {
          background: var(--lf-bg);
          color: var(--lf-ink);
        }
        .lf-btn-ghost:hover { background: #e9ebf5; color: var(--lf-ink); }

        .lf-filter-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .lf-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--lf-bg);
          color: var(--lf-primary-dark);
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 999px;
        }

        /* Post card */
        .lf-post { position: relative; padding-left: 4px; }
        .lf-post-accent {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 4px;
        }
        .lf-post-accent--lost { background: linear-gradient(180deg, #fb7185, #e11d48); }
        .lf-post-accent--found { background: linear-gradient(180deg, #34d399, #059669); }

        .lf-name { color: var(--lf-ink); font-size: 14px; }
        .lf-meta-time { color: var(--lf-muted); font-size: 11px; }

        .lf-badge {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
        }
        .lf-badge--lost { background: var(--lf-lost-bg); color: var(--lf-lost); }
        .lf-badge--found { background: var(--lf-found-bg); color: var(--lf-found); }
        .lf-badge--sm { font-size: 9px; padding: 4px 10px; }

        .lf-icon-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          border: none;
          background: var(--lf-bg);
          color: var(--lf-muted);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .lf-icon-btn:hover { background: #e9ebf5; color: var(--lf-ink); }

        .lf-dropdown {
          border: none;
          border-radius: 12px;
          box-shadow: 0 8px 24px -8px rgba(30,36,51,0.2);
          min-width: 150px;
          padding: 6px;
        }
        .lf-dropdown-item-danger {
          display: flex; align-items: center; gap: 8px;
          color: var(--lf-lost);
          font-weight: 600;
          font-size: 13px;
          border-radius: 8px;
          padding: 8px 10px;
        }
        .lf-dropdown-item-danger:hover { background: var(--lf-lost-bg); color: var(--lf-lost); }

        .lf-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--lf-bg);
          color: var(--lf-muted);
          font-size: 10.5px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 999px;
          border: 1px solid var(--lf-border);
        }

        .lf-post-title { font-size: 18px; color: var(--lf-ink); letter-spacing: -0.01em; }
        .lf-description { font-size: 14.5px; line-height: 1.6; color: #424a5e; }
        .lf-readmore-btn {
          color: var(--lf-primary);
          font-weight: 700;
          font-size: 13.5px;
          border: none;
          background: none;
          padding: 0;
          margin-left: 6px;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .lf-readmore-btn:hover {
          color: var(--lf-primary-dark);
          text-decoration: underline !important;
        }

        .lf-spec-box {
          background: var(--lf-bg);
          border: 1px solid var(--lf-border);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 13px;
        }
        .lf-spec-row { display: flex; align-items: baseline; gap: 10px; }
        .lf-spec-row i { width: 16px; text-align: center; }
        .lf-status { color: var(--lf-primary-dark); }

        .lf-image-wrap {
          width: 100%;
          max-height: 280px;
          overflow: hidden;
          background: var(--lf-bg);
          border-top: 1px solid var(--lf-border);
          border-bottom: 1px solid var(--lf-border);
        }
        .lf-image { width: 100%; height: 100%; object-fit: cover; max-height: 280px; display: block; }

        .lf-post-footer { border-top: 1px solid var(--lf-border); background: #fafbfd; }

        .lf-clickable-title {
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .lf-clickable-title:hover {
          color: var(--lf-primary) !important;
          text-decoration: underline;
        }
        .lf-clickable-image {
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .lf-clickable-image:hover {
          opacity: 0.95;
        }

        /* Interaction Bar */
        .lf-interaction-bar {
          background: #fafbfd;
          border-top: 1px solid var(--lf-border);
          border-bottom: 1px solid var(--lf-border);
          gap: 0;
        }
        .lf-ibar-sep {
          width: 1px;
          background: var(--lf-border);
          margin: 6px 0;
        }
        .lf-ibar-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          background: none;
          color: var(--lf-muted);
          font-size: 13px;
          font-weight: 600;
          padding: 10px 8px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }
        .lf-ibar-btn:hover {
          background: var(--lf-bg);
          color: var(--lf-ink);
          transform: translateY(-1px);
        }
        .lf-ibar-btn--boosted {
          color: #e11d48 !important;
        }
        .lf-ibar-btn--boosted i {
          filter: drop-shadow(0 0 4px rgba(225, 29, 72, 0.4));
        }
        .lf-ibar-btn--active {
          color: var(--lf-primary) !important;
        }
        .lf-count-pill {
          font-size: 10.5px;
          font-weight: 700;
          background: var(--lf-border);
          color: var(--lf-muted);
          padding: 1px 7px;
          border-radius: 999px;
          min-width: 20px;
          text-align: center;
          transition: background 0.15s, color 0.15s;
        }
        .lf-count-pill--red { background: #fff1f2; color: #e11d48; }
        .lf-count-pill--blue { background: #eef2ff; color: var(--lf-primary-dark); }
        .lf-heart-active {
          animation: heartPop 0.25s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .lf-share-toast {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #1e2433;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 999px;
          white-space: nowrap;
          pointer-events: none;
          animation: toastIn 0.2s ease-out, toastOut 0.3s ease-in 1.7s forwards;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastOut {
          to { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        }

        /* Comments Section */
        .lf-comments-section {
          background: #f8fafc;
          border-bottom: 1px solid var(--lf-border);
          animation: fadeIn 0.2s ease-out;
        }
        .lf-avatar-xs {
          width: 30px; height: 30px;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lf-comment-bubble {
          background: #fff;
          border: 1px solid #eceef5;
          border-radius: 14px;
          padding: 9px 12px;
          box-shadow: 0 1px 3px rgba(30,36,51,0.05);
        }
        .lf-comment-name {
          font-size: 12.5px;
          color: var(--lf-ink);
        }
        .lf-comment-time {
          font-size: 10px;
          color: var(--lf-muted);
        }
        .lf-comment-text {
          font-size: 13px;
          color: #424a5e;
          line-height: 1.5;
        }
        .lf-comments-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--lf-muted);
          font-size: 12.5px;
          padding: 12px 0;
        }
        .lf-comments-empty i { font-size: 1.1rem; opacity: 0.5; }

        /* Comment action buttons (edit/delete) */
        .lf-comment-action-btn {
          width: 22px; height: 22px;
          border: none;
          background: none;
          border-radius: 6px;
          color: var(--lf-muted);
          font-size: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s, background 0.15s, color 0.15s;
        }
        .lf-comment-bubble:hover .lf-comment-action-btn {
          opacity: 1;
        }
        .lf-comment-action-btn:hover {
          background: var(--lf-bg);
          color: var(--lf-primary);
        }
        .lf-comment-action-btn--danger:hover {
          background: var(--lf-lost-bg);
          color: var(--lf-lost);
        }

        /* Inline edit mode */
        .lf-comment-edit-wrap { display: flex; flex-direction: column; gap: 4px; }
        .lf-comment-input--edit {
          padding: 6px 12px;
          font-size: 13px;
          border-radius: 10px;
        }
        .lf-edit-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 12px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--lf-primary), var(--lf-primary-dark));
          color: #fff;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .lf-edit-save-btn:hover { opacity: 0.88; }
        .lf-edit-cancel-btn {
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 12px;
          border: 1px solid var(--lf-border);
          border-radius: 8px;
          background: var(--lf-bg);
          color: var(--lf-muted);
          cursor: pointer;
          transition: background 0.15s;
        }
        .lf-edit-cancel-btn:hover { background: #e9ebf5; color: var(--lf-ink); }
        .lf-comment-form {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--lf-border);
          margin-top: 4px;
        }
        .lf-comment-input {
          flex-grow: 1;
          border: 1px solid var(--lf-border);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 13px;
          background: #fff;
          color: var(--lf-ink);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .lf-comment-input:focus {
          border-color: var(--lf-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .lf-comment-send {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, var(--lf-primary), var(--lf-primary-dark));
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 3px 8px -2px rgba(99, 102, 241, 0.45);
        }
        .lf-comment-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .lf-comment-send:not(:disabled):hover {
          transform: scale(1.08);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lf-self-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: var(--lf-bg);
          color: var(--lf-muted);
          font-weight: 700;
          font-size: 12px;
          border: 1px dashed #d6dae6;
          border-radius: 12px;
          padding: 0 14px;
          min-width: 160px;
        }

        /* Spinner */
        .lf-spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--lf-border);
          border-top-color: var(--lf-primary);
          border-radius: 50%;
          animation: lf-spin 0.8s linear infinite;
        }
        .lf-spinner-sm { width: 22px; height: 22px; border-width: 2px; }
        @keyframes lf-spin { to { transform: rotate(360deg); } }

        .lf-end-marker { color: #b7bdcc; }
        .lf-end-marker i { color: var(--lf-found); }
        .lf-empty { color: #b7bdcc; }

        /* Sidebar */
        .lf-guest-card { border-top: 4px solid var(--lf-primary); }
        .lf-guest-icon {
          width: 56px; height: 56px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99, 102, 241, 0.1);
          color: var(--lf-primary);
          font-size: 1.5rem;
        }
        .lf-icon-accent { color: var(--lf-primary); }

        .lf-stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 600;
        }
        .lf-stat-row--lost { background: var(--lf-lost-bg); color: var(--lf-lost); }
        .lf-stat-row--found { background: var(--lf-found-bg); color: var(--lf-found); }
        .lf-stat-row--claim { background: #eef2ff; color: var(--lf-primary-dark); }
        .lf-stat-value {
          font-weight: 800;
          font-size: 14px;
          padding: 4px 12px;
          border-radius: 999px;
          color: #fff;
        }
        .lf-stat-value--lost { background: var(--lf-lost); }
        .lf-stat-value--found { background: var(--lf-found); }
        .lf-stat-value--claim { background: var(--lf-primary); }

        .lf-activity-item { padding: 12px 0; }
        .lf-activity-item--border { border-bottom: 1px solid var(--lf-border); }
        .lf-activity-title {
          font-size: 13.5px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Modal */
        .lf-modal-backdrop {
          background: rgba(30, 36, 51, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1050;
        }
        .lf-modal {
          border: none;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 60px -24px rgba(30,36,51,0.4);
        }
        .lf-modal-header, .lf-modal-footer { background: #fbfbfe; border-color: var(--lf-border) !important; }
        .lf-modal-image {
          width: 100%;
          border-radius: 14px;
          object-fit: cover;
          max-height: 300px;
          border: 1px solid var(--lf-border);
        }
        .lf-modal-noimage {
          width: 100%; height: 220px;
          border-radius: 14px;
          background: var(--lf-bg);
          border: 1px dashed #d6dae6;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px;
          color: var(--lf-muted);
        }
        .lf-modal-noimage i { font-size: 2rem; opacity: 0.4; }

        /* Custom Sort Tabs */
        .lf-sort-tabs-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .lf-sort-tabs-wrapper {
          background: #f1f5f9;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          max-width: 440px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        .lf-sort-btn-pill {
          transition: all 0.25s ease;
          outline: none !important;
          box-shadow: none !important;
        }
        .lf-sort-btn-pill:hover:not(.active) {
          color: var(--lf-ink) !important;
        }

        @media (max-width: 991px) {
          .lf-title { font-size: 1.35rem; }
        }
      `}</style>
    </div>
  );
}

export default Users;