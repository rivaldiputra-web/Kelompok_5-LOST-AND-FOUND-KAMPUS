import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

function Admin() {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || "items";

  const [pendingItems, setPendingItems] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedClaimIds, setExpandedClaimIds] = useState(new Set());
  const [selectedClaim, setSelectedClaim] = useState(null);

  const toggleExpandClaim = (claimId) => {
    setExpandedClaimIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };
  
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Load active tab data
  useEffect(() => {
    setSelectedClaim(null);
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "items") {
        const res = await apiRequest("/api/items?status=pending_verification");
        if (res.status) setPendingItems(res.data);
      } else if (activeTab === "claims") {
        const res = await apiRequest("/api/claims?status=pending");
        if (res.status) setPendingClaims(res.data);
      } else if (activeTab === "categories") {
        const res = await apiRequest("/api/categories");
        if (res.status) setCategories(res.data);
      }
    } catch (e) {
      console.error("Gagal memuat data admin:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- ITEM ACTIONS ---
  const handleApproveItem = async (itemId) => {
    try {
      const res = await apiRequest(`/api/items/${itemId}`, {
        method: "PATCH",
        body: { status: "available" }
      });
      if (res.status) {
        Swal.fire("Berhasil", "Barang berhasil diverifikasi dan dipublikasikan.", "success");
        loadData();
      }
    } catch (e) {
      Swal.fire("Gagal", e.message, "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    Swal.fire({
      title: "Hapus Laporan?",
      text: "Laporan barang ini akan dihapus secara permanen.",
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
          Swal.fire("Dihapus!", "Laporan telah berhasil dihapus.", "success");
          loadData();
        } catch (e) {
          Swal.fire("Gagal", e.message, "error");
        }
      }
    });
  };

  // --- CLAIM ACTIONS ---
  const handleProcessClaim = async (claimId, status) => {
    const actionText = status === "approved" ? "Setujui" : "Tolak";
    
    Swal.fire({
      title: `${actionText} Klaim ini?`,
      text: `Masukkan catatan atau alasan ${actionText.toLowerCase()} untuk pembuat klaim:`,
      input: "textarea",
      inputPlaceholder: "Tuliskan catatan di sini...",
      showCancelButton: true,
      confirmButtonText: `Ya, ${actionText}!`,
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (status === "rejected" && (!value || value.trim().length < 5)) {
          return "Catatan penolakan minimal 5 karakter wajib diisi!";
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await apiRequest(`/api/claims/${claimId}`, {
            method: "PATCH",
            body: {
              status: status,
              admin_notes: result.value || ""
            }
          });
          if (res.status) {
            Swal.fire("Berhasil!", `Klaim telah berhasil di-${status.replace(/d$/,'')}.`, "success");
            setSelectedClaim(null);
            loadData();
          }
        } catch (e) {
          Swal.fire("Gagal", e.message, "error");
        }
      }
    });
  };

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await apiRequest("/api/categories", {
        method: "POST",
        body: { name: newCategoryName }
      });
      if (res.status) {
        Swal.fire("Berhasil", "Kategori baru berhasil ditambahkan.", "success");
        setNewCategoryName("");
        loadData();
      }
    } catch (e) {
      Swal.fire("Gagal", e.message, "error");
    }
  };

  return (
    <div className="container mt-2">
      <h2 className="fw-bold text-slate mb-4 text-start">Panel Administrasi</h2>

      {/* Navigasi tab dipindahkan ke sidebar kiri */}

      {/* Loading state */}
      {loading ? (
        <div className="d-flex justify-content-center my-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="tab-content">
          {/* TAB 1: VERIFIKASI BARANG */}
          {activeTab === "items" && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white text-start">
              <h4 className="fw-bold mb-4 text-danger d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                Menunggu Verifikasi Laporan Barang
              </h4>

              <div className="row g-4">
                {pendingItems.length > 0 ? (
                  pendingItems.map((item) => (
                    <div className="col-md-6" key={item.id}>
                      <div className="card border p-3 rounded-4 shadow-sm h-100 d-flex flex-column">
                        <div className="d-flex gap-3">
                          {item.image_path ? (
                            <img
                              src={item.image_path}
                              alt={item.title}
                              className="rounded object-fit-cover"
                              style={{ width: "100px", height: "100px" }}
                            />
                          ) : (
                            <div className="bg-light rounded d-flex align-items-center justify-content-center text-secondary" style={{ width: "100px", height: "100px" }}>
                              <i className="bi bi-image opacity-50 fs-2"></i>
                            </div>
                          )}
                          <div className="flex-grow-1">
                            <span className={`badge rounded-pill mb-1 ${item.type === "lost" ? "bg-danger" : "bg-success"}`}>
                              {item.type === "lost" ? "Barang Hilang" : "Barang Temuan"}
                            </span>
                            <h5 className="fw-bold text-slate mb-1">{item.title}</h5>
                            <small className="text-secondary d-block">Lokasi: <b>{item.location}</b></small>
                            <small className="text-secondary d-block">Pelapor: <b>{item.user?.name}</b></small>
                          </div>
                        </div>
                        
                        <p className="text-secondary small mt-3 flex-grow-1 border-top pt-2 mb-3">
                          {item.description}
                        </p>

                        <div className="d-flex gap-2 mt-auto">
                          <button className="btn btn-success rounded-3 w-50 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" onClick={() => handleApproveItem(item.id)}>
                            <i className="bi bi-check-circle-fill"></i> Setujui
                          </button>
                          <button className="btn btn-danger rounded-3 w-50 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" onClick={() => handleDeleteItem(item.id)}>
                            <i className="bi bi-trash3-fill"></i> Tolak & Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5 text-secondary">
                    <i className="bi bi-check2-all display-3 opacity-20 mb-3 d-block"></i>
                    <p className="fw-semibold">Tidak ada laporan barang baru yang menunggu verifikasi.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERSETUJUAN KLAIM */}
          {activeTab === "claims" && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white text-start">
              <h4 className="fw-bold mb-4 text-warning d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-check-fill text-warning"></i>
                Persetujuan Klaim Barang Temuan
              </h4>

              {pendingClaims.length > 0 ? (
                <div className="table-responsive border rounded-4 shadow-sm">
                  <table className="table table-hover table-striped m-0 align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th className="px-4 py-3 border-0">Barang Temuan</th>
                        <th className="px-4 py-3 border-0">Finder (Penemu)</th>
                        <th className="px-4 py-3 border-0">Claimant (Pengaju)</th>
                        <th className="px-4 py-3 border-0">Bukti Kepemilikan</th>
                        <th className="px-4 py-3 border-0 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingClaims.map((claim) => (
                        <tr key={claim.id} className="transition-3">
                          <td className="px-4 py-3">
                            <div className="fw-bold text-slate">{claim.item?.title}</div>
                            <small className="text-secondary d-flex align-items-center gap-1">
                              <i className="bi bi-geo-alt-fill text-danger"></i> Ditemukan di: {claim.item?.location || "-"}
                            </small>
                          </td>
                          <td className="px-4 py-3 text-secondary small">
                            {claim.item?.user?.name || "Petugas Kampus"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-semibold text-slate">{claim.user?.name}</div>
                            <small className="text-secondary">{claim.user?.nim_nip}</small>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-truncate text-secondary small" style={{ maxWidth: "200px" }}>
                              {claim.proof_description}
                            </div>
                            {claim.proof_image_path && (
                              <span className="badge bg-light-primary text-primary mt-1 small">
                                <i className="bi bi-image me-1"></i> Ada Foto
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              className="btn btn-warning btn-sm rounded-3 py-1.5 px-3 fw-bold shadow-sm d-inline-flex align-items-center gap-1"
                              onClick={() => setSelectedClaim(claim)}
                            >
                              <i className="bi bi-eye-fill"></i> Review & Proses
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 text-secondary">
                  <i className="bi bi-folder-check display-3 opacity-20 mb-3 d-block"></i>
                  <p className="fw-semibold">Tidak ada pengajuan klaim baru yang menunggu persetujuan.</p>
                </div>
              )}

              {/* MODAL DETAIL REVIEW KLAIM */}
              {selectedClaim && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1050 }}>
                  <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 rounded-4 shadow-lg">
                      {/* Modal Header */}
                      <div className="modal-header border-bottom bg-light py-3 px-4 rounded-top-4">
                        <h5 className="modal-title fw-bold text-slate d-flex align-items-center gap-2">
                          <i className="bi bi-clipboard2-check-fill text-warning"></i>
                          Review Laporan Klaim
                        </h5>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setSelectedClaim(null)}
                          aria-label="Close"
                        ></button>
                      </div>

                      {/* Modal Body */}
                      <div className="modal-body p-4 text-start" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                        <div className="row g-4">
                          {/* KIRI: Informasi Barang & Claimant */}
                          <div className="col-md-6">
                            <div className="mb-4">
                              <span className="text-secondary small fw-bold text-uppercase d-block mb-2">Informasi Barang Temuan</span>
                              <div className="p-3 bg-light rounded-3 border">
                                <h6 className="fw-bold text-slate mb-2">{selectedClaim.item?.title}</h6>
                                <div className="small text-secondary mb-1">
                                  <i className="bi bi-person me-2 text-primary"></i>
                                  Finder (Penemu): <b>{selectedClaim.item?.user?.name || "Petugas Kampus"}</b>
                                </div>
                                <div className="small text-secondary mb-1">
                                  <i className="bi bi-geo-alt me-2 text-danger"></i>
                                  Ditemukan di: <b>{selectedClaim.item?.location || "-"}</b>
                                </div>
                                <div className="small text-secondary">
                                  <i className="bi bi-calendar-event me-2 text-success"></i>
                                  Tanggal Pengajuan: <b>{new Date(selectedClaim.created_at).toLocaleDateString("id-ID")}</b>
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="text-secondary small fw-bold text-uppercase d-block mb-2">Informasi Pengaju (Claimant)</span>
                              <div className="p-3 bg-light rounded-3 border">
                                <h6 className="fw-bold text-slate mb-2">{selectedClaim.user?.name}</h6>
                                <div className="small text-secondary mb-1">
                                  <i className="bi bi-card-text me-2 text-primary"></i>
                                  NIM/NIP: <b>{selectedClaim.user?.nim_nip}</b>
                                </div>
                                <div className="small text-secondary mb-1">
                                  <i className="bi bi-envelope me-2 text-secondary"></i>
                                  Email: <b>{selectedClaim.user?.email}</b>
                                </div>
                                <div className="small text-secondary">
                                  <i className="bi bi-telephone me-2 text-success"></i>
                                  WhatsApp: <b>{selectedClaim.user?.phone_number || "Tidak dicantumkan"}</b>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* KANAN: Bukti Kepemilikan & Foto */}
                          <div className="col-md-6">
                            <div className="h-100 d-flex flex-column">
                              <span className="text-secondary small fw-bold text-uppercase d-block mb-2">Bukti Kepemilikan Fisik</span>
                              <div className="p-3 bg-light-warning-subtle rounded-3 border border-warning-subtle flex-grow-1 mb-3">
                                <p className="text-secondary small m-0" style={{ whiteSpace: "pre-line" }}>
                                  {selectedClaim.proof_description}
                                </p>
                              </div>

                              {selectedClaim.proof_image_path && (
                                <div>
                                  <span className="text-secondary small fw-bold text-uppercase d-block mb-2">Foto Lampiran Bukti</span>
                                  <div className="text-center rounded-3 overflow-hidden border bg-light p-2 cursor-pointer" 
                                       onClick={() => Swal.fire({
                                         imageUrl: selectedClaim.proof_image_path,
                                         imageAlt: 'Foto Bukti Kepemilikan',
                                         showCloseButton: true,
                                         showConfirmButton: false,
                                         background: '#fafbfd'
                                       })}
                                  >
                                    <img 
                                      src={selectedClaim.proof_image_path} 
                                      alt="Foto Bukti" 
                                      className="img-fluid rounded-2" 
                                      style={{ maxHeight: "150px", objectFit: "contain" }} 
                                    />
                                    <small className="text-muted d-block mt-1"><i className="bi bi-zoom-in"></i> Klik untuk memperbesar</small>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer / Action Area */}
                      <div className="modal-footer border-top bg-light p-3 px-4 rounded-bottom-4 justify-content-between">
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary rounded-3 py-2 px-4 fw-bold"
                          onClick={() => setSelectedClaim(null)}
                        >
                          Tutup
                        </button>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-danger rounded-3 py-2 px-4 fw-bold d-flex align-items-center gap-2"
                            onClick={() => handleProcessClaim(selectedClaim.id, "rejected")}
                          >
                            <i className="bi bi-x-circle-fill"></i> Tolak Klaim
                          </button>
                          <button 
                            className="btn btn-success rounded-3 py-2 px-4 fw-bold d-flex align-items-center gap-2 shadow-sm"
                            onClick={() => handleProcessClaim(selectedClaim.id, "approved")}
                          >
                            <i className="bi bi-check-circle-fill"></i> Setujui & Kembalikan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KELOLA KATEGORI */}
          {activeTab === "categories" && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white text-start">
              <h4 className="fw-bold mb-4 text-success d-flex align-items-center gap-2">
                <i className="bi bi-tags-fill text-success"></i>
                Kelola Kategori Barang Kampus
              </h4>

              <div className="row g-4">
                {/* Form Add Category */}
                <div className="col-md-4">
                  <div className="card border p-3 rounded-4 shadow-sm bg-light-subtle">
                    <h5 className="fw-bold mb-3 text-slate">Tambah Kategori</h5>
                    <form onSubmit={handleAddCategory}>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary">Nama Kategori Baru</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          placeholder="Contoh: Dokumen / Buku"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-success w-100 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                        <i className="bi bi-plus-lg"></i> Tambah Kategori
                      </button>
                    </form>
                  </div>
                </div>

                {/* Categories Table list */}
                <div className="col-md-8">
                  <div className="card border rounded-4 shadow-sm overflow-hidden">
                    <table className="table table-hover table-striped m-0 align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th className="px-4 py-3 border-0" style={{ width: "80px" }}>ID</th>
                          <th className="px-4 py-3 border-0">Nama Kategori</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => (
                          <tr key={cat.id}>
                            <td className="px-4 py-3 fw-bold text-secondary">#{cat.id}</td>
                            <td className="px-4 py-3 fw-semibold text-slate">{cat.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        .lf-readmore-btn {
          color: #f59e0b;
          font-weight: 700;
          font-size: 12.5px;
          border: none;
          background: none;
          padding: 0;
          margin-left: 6px;
          cursor: pointer;
          transition: color 0.15s ease;
          vertical-align: baseline;
        }
        .lf-readmore-btn:hover {
          color: #d97706;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}

export default Admin;