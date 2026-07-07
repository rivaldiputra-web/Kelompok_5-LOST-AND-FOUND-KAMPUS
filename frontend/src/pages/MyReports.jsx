import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

function MyReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all, lost, found
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, active, completed

  useEffect(() => {
    if (user) {
      fetchMyItems();
    }
  }, [user]);

  const fetchMyItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await apiRequest(`/api/items?user_id=${user.id}`);
      if (result.status) {
        setMyItems(result.data);
      }
    } catch (e) {
      console.error("Gagal mengambil riwayat laporan:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId, itemTitle) => {
    Swal.fire({
      title: "Hapus Laporan?",
      text: `Apakah Anda yakin ingin menghapus laporan "${itemTitle}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await apiRequest(`/api/items/${itemId}`, { method: "DELETE" });
          if (res.status) {
            Swal.fire({
              title: "Terhapus!",
              text: "Laporan barang Anda telah berhasil dihapus.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false
            });
            setMyItems(prev => prev.filter(item => item.id !== itemId));
            if (selectedItem && selectedItem.id === itemId) {
              setSelectedItem(null);
            }
          }
        } catch (error) {
          Swal.fire("Gagal Menghapus", error.message, "error");
        }
      }
    });
  };

  // Helper functions for badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_verification":
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2.5 py-1.5 rounded-pill fw-bold">Menunggu Verifikasi</span>;
      case "available":
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 rounded-pill fw-bold">Tersedia</span>;
      case "searching":
        return <span className="badge bg-info-subtle text-info border border-info-subtle px-2.5 py-1.5 rounded-pill fw-bold">Pencarian Aktif</span>;
      case "returned":
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 rounded-pill fw-bold">Dikembalikan</span>;
      case "resolved":
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 rounded-pill fw-bold">Selesai</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2.5 py-1.5 rounded-pill fw-bold">{status}</span>;
    }
  };

  // Filtering Logic
  const filteredItems = myItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.location.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === "pending") {
      matchesStatus = item.status === "pending_verification";
    } else if (statusFilter === "active") {
      matchesStatus = item.status === "available" || item.status === "searching";
    } else if (statusFilter === "completed") {
      matchesStatus = item.status === "returned" || item.status === "resolved";
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate quick stats
  const totalReports = myItems.length;
  const pendingReports = myItems.filter(item => item.status === "pending_verification").length;
  const activeReports = myItems.filter(item => item.status === "available" || item.status === "searching").length;
  const completedReports = myItems.filter(item => item.status === "returned" || item.status === "resolved").length;

  return (
    <div className="container py-4">
      
      {/* Title Header */}
      <div className="w-100 text-start mb-4">
        <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill mb-2 fw-semibold">
          <i className="bi bi-clock-history me-1.5"></i> Aktivitas Saya
        </span>
        <h2 className="fw-bold m-0 text-dark">Laporan Saya</h2>
        <p className="text-secondary small m-0 mt-1">
          Pantau riwayat verifikasi, status penemuan, dan klaim dari laporan barang hilang atau temuan yang telah Anda kirimkan.
        </p>
      </div>

      {/* Quick Statistics Widget */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 text-start bg-white h-100">
            <small className="text-muted fw-semibold">Total Laporan</small>
            <h3 className="fw-bolder m-0 mt-1 text-slate">{totalReports}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 text-start bg-white h-100">
            <small className="text-muted fw-semibold">Menunggu Verifikasi</small>
            <h3 className="fw-bolder m-0 mt-1 text-warning">{pendingReports}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 text-start bg-white h-100">
            <small className="text-muted fw-semibold">Aktif / Pencarian</small>
            <h3 className="fw-bolder m-0 mt-1 text-info">{activeReports}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 text-start bg-white h-100">
            <small className="text-muted fw-semibold">Telah Selesai</small>
            <h3 className="fw-bolder m-0 mt-1 text-success">{completedReports}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Control Area */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-light-subtle text-secondary" style={{ borderRadius: "8px 0 0 8px" }}>
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 border-light-subtle text-slate"
                style={{ borderRadius: "0 8px 8px 0", fontSize: "14px" }}
                placeholder="Cari laporan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter Selector */}
          <div className="col-6 col-md-4 text-start">
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted fw-bold text-nowrap d-none d-lg-inline" style={{ fontSize: "12px" }}>Tipe Barang:</small>
              <select
                className="form-select border-light-subtle text-slate"
                style={{ borderRadius: "8px", fontSize: "13.5px" }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Semua Tipe</option>
                <option value="lost">Barang Hilang</option>
                <option value="found">Barang Temuan</option>
              </select>
            </div>
          </div>

          {/* Status Filter Selector */}
          <div className="col-6 col-md-4 text-start">
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted fw-bold text-nowrap d-none d-lg-inline" style={{ fontSize: "12px" }}>Status:</small>
              <select
                className="form-select border-light-subtle text-slate"
                style={{ borderRadius: "8px", fontSize: "13.5px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Verifikasi</option>
                <option value="active">Aktif / Publik</option>
                <option value="completed">Telah Selesai</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Listing */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center my-5 py-5 bg-white rounded-3 shadow-sm">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary fw-semibold">Memuat data laporan...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-3 shadow-sm border border-dashed p-4">
          <i className="bi bi-file-earmark-x-fill text-muted opacity-40 display-3 mb-3 d-block"></i>
          <h5 className="fw-bold text-slate">Tidak Ada Laporan Ditemukan</h5>
          <p className="text-muted small mb-0">Laporan yang Anda cari tidak tersedia atau belum dibuat.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredItems.map((item) => {
            const isLost = item.type === "lost";
            return (
              <div className="col-12" key={item.id}>
                <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white hover-shadow transition-2">
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 text-start">
                      
                      {/* Image and Content Specs */}
                      <div className="d-flex align-items-start gap-3">
                        <div className="flex-shrink-0">
                          {item.image_path ? (
                            <img
                              src={item.image_path}
                              alt={item.title}
                              style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "8px" }}
                            />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center bg-light text-secondary rounded-3" style={{ width: "70px", height: "70px" }}>
                              <i className="bi bi-image text-muted fs-4"></i>
                            </div>
                          )}
                        </div>
                        
                        <div className="overflow-hidden">
                          <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`badge ${isLost ? "bg-danger-subtle text-danger border border-danger-subtle" : "bg-success-subtle text-success border border-success-subtle"} px-2.5 py-1 rounded-pill fw-bold`} style={{ fontSize: "10px", letterSpacing: "0.2px" }}>
                              {isLost ? "Barang Hilang" : "Barang Temuan"}
                            </span>
                            <span className="text-secondary small fw-medium text-nowrap">
                              <i className="bi bi-tag-fill me-1"></i> {item.category?.name}
                            </span>
                          </div>
                          
                          <h5 className="fw-bold text-slate mb-1 text-truncate" style={{ fontSize: "16px" }} title={item.title}>
                            {item.title}
                          </h5>
                          
                          <div className="d-flex flex-wrap gap-x-3 gap-y-1 text-secondary small" style={{ fontSize: "12.5px" }}>
                            <span>
                              <i className="bi bi-geo-alt-fill text-danger me-1"></i> {item.location}
                            </span>
                            <span>
                              <i className="bi bi-calendar-event me-1"></i> {new Date(item.date_time).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Action Buttons */}
                      <div className="d-flex flex-row flex-md-column align-items-center align-items-md-end justify-content-between justify-content-md-center gap-2 border-top border-top-md-0 pt-3 pt-md-0 w-100 w-md-auto">
                        <div className="mb-md-1.5">
                          {getStatusBadge(item.status)}
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary fw-semibold px-3 py-1.5"
                            style={{ borderRadius: "8px", fontSize: "12.5px" }}
                            onClick={() => setSelectedItem(item)}
                          >
                            Tinjau Detail
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger px-2.5 py-1.5"
                            style={{ borderRadius: "8px" }}
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            title="Hapus Laporan"
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL (MATCHING MAIN FEED DESIGN) */}
      {selectedItem && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-start">
              
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold text-slate">Detail Laporan Barang</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedItem(null)} aria-label="Close"></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  {/* Photo Section */}
                  <div className="col-md-5">
                    {selectedItem.image_path ? (
                      <img
                        src={selectedItem.image_path}
                        alt={selectedItem.title}
                        className="img-fluid rounded-3 shadow-sm w-100"
                        style={{ height: "260px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center bg-light text-secondary rounded-3 border" style={{ height: "260px" }}>
                        <i className="bi bi-image text-muted display-4 mb-2"></i>
                        <span className="small text-muted">Tidak ada foto terlampir</span>
                      </div>
                    )}
                  </div>

                  {/* Specification Section */}
                  <div className="col-md-7">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className={`badge ${selectedItem.type === "lost" ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"} px-2.5 py-1.5 rounded-pill fw-bold`} style={{ fontSize: "10.5px" }}>
                        {selectedItem.type === "lost" ? "Barang Hilang" : "Barang Temuan"}
                      </span>
                      <span className="badge bg-light text-secondary border px-2.5 py-1.5 rounded-pill fw-bold" style={{ fontSize: "10.5px" }}>
                        <i className="bi bi-tag-fill me-1"></i> {selectedItem.category?.name}
                      </span>
                    </div>

                    <h4 className="fw-bold text-slate mb-3">{selectedItem.title}</h4>
                    
                    {/* Meta Spec rows */}
                    <div className="p-3 bg-light rounded-3 mb-4">
                      <div className="d-flex align-items-start gap-2 mb-2 pb-2 border-bottom" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                        <i className="bi bi-geo-alt-fill text-danger mt-0.5"></i>
                        <span className="small text-slate">
                          <strong>Lokasi:</strong> {selectedItem.location}
                        </span>
                      </div>
                      <div className="d-flex align-items-start gap-2 mb-2 pb-2 border-bottom" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                        <i className="bi bi-calendar-event-fill text-primary mt-0.5"></i>
                        <span className="small text-slate">
                          <strong>Waktu Laporan:</strong> {new Date(selectedItem.date_time).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <i className="bi bi-info-circle-fill text-success mt-0.5"></i>
                        <span className="small text-slate text-capitalize">
                          <strong>Status:</strong> {selectedItem.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-start">
                      <h6 className="fw-bold text-slate mb-1">Ciri & Deskripsi Lengkap:</h6>
                      <p className="text-secondary small leading-relaxed" style={{ whiteSpace: "pre-line" }}>
                        {selectedItem.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top-0 bg-light p-3">
                <button type="button" className="btn btn-secondary px-4 fw-semibold" style={{ borderRadius: "8px", fontSize: "13.5px" }} onClick={() => setSelectedItem(null)}>
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4 fw-semibold d-flex align-items-center gap-1.5"
                  style={{ borderRadius: "8px", fontSize: "13.5px" }}
                  onClick={() => handleDeleteItem(selectedItem.id, selectedItem.title)}
                >
                  <i className="bi bi-trash3-fill"></i> Hapus Laporan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MyReports;
