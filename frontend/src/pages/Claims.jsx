import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

function Claims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("my-claims"); // "my-claims" atau "incoming-claims"
  const [expandedClaimIds, setExpandedClaimIds] = useState(new Set());

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

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/claims?size=100");
      if (res.status) {
        setClaims(res.data);
      }
    } catch (e) {
      console.error("Gagal memuat klaim:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClaim = async (claimId) => {
    Swal.fire({
      title: "Batalkan Klaim?",
      text: "Pengajuan klaim Anda akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Batalkan!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiRequest(`/api/claims/${claimId}`, { method: "DELETE" });
          Swal.fire("Dibatalkan!", "Klaim berhasil dihapus.", "success");
          loadClaims();
        } catch (e) {
          Swal.fire("Gagal", e.message, "error");
        }
      }
    });
  };

  // Saring klaim yang diajukan oleh saya sendiri
  const myClaims = claims.filter((c) => c.user_id === parseInt(user.id, 10));

  // Saring klaim dari orang lain yang masuk pada barang temuan saya
  const incomingClaims = claims.filter((c) => c.item?.user_id === parseInt(user.id, 10) && c.user_id !== parseInt(user.id, 10));

  return (
    <div className="container mt-2">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 text-start">
        <div>
          <h2 className="fw-bold text-slate m-0">Pengelolaan Klaim Anda</h2>
          <p className="text-secondary small m-0">Lacak histori pengajuan klaim Anda atau periksa klaim mahasiswa lain atas temuan Anda.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1" onClick={loadClaims}>
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Sub Tabs Toggle */}
      <div className="d-flex gap-2 mb-4 bg-white p-1.5 rounded-3 shadow-sm border border-light" style={{ width: "fit-content" }}>
        <button
          className={`btn px-4 py-2 rounded-3 fw-bold border-0 transition-3 ${
            activeSubTab === "my-claims" ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"
          }`}
          onClick={() => setActiveSubTab("my-claims")}
        >
          Klaim Saya ({myClaims.length})
        </button>
        <button
          className={`btn px-4 py-2 rounded-3 fw-bold border-0 transition-3 ${
            activeSubTab === "incoming-claims" ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"
          }`}
          onClick={() => setActiveSubTab("incoming-claims")}
        >
          Klaim Masuk ({incomingClaims.length})
        </button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center my-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white text-start">
          {activeSubTab === "my-claims" ? (
            /* MY CLAIMS SUB-TAB */
            <div>
              <h5 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-person-fill text-primary"></i>
                Daftar Klaim yang Saya Ajukan
              </h5>
              
              <div className="row g-4">
                {myClaims.length > 0 ? (
                  myClaims.map((claim) => (
                    <div className="col-md-6" key={claim.id}>
                      <div className="card border p-3 rounded-4 shadow-sm h-100 d-flex flex-column">
                        <div className="border-bottom pb-2 mb-3">
                          <span className="text-secondary small fw-bold text-uppercase">Nama Barang Temuan</span>
                          <h5 className="fw-bold text-slate mb-1">{claim.item?.title}</h5>
                          <small className="text-secondary d-block">Tanggal Pengajuan: {new Date(claim.created_at).toLocaleDateString("id-ID")}</small>
                        </div>
                        
                        <div className="flex-grow-1 mb-3">
                          <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Bukti Kepemilikan yang Saya Kirim</span>
                          <p className="text-secondary small bg-light p-3 rounded-3 border-start border-primary border-3 mb-2">
                            {claim.proof_description.length > 120 && !expandedClaimIds.has(claim.id) ? (
                              <>
                                {claim.proof_description.substring(0, 120)}...
                                <button 
                                  type="button" 
                                  className="lf-readmore-btn"
                                  onClick={() => toggleExpandClaim(claim.id)}
                                >
                                  Lihat Selengkapnya
                                </button>
                              </>
                            ) : (
                              <>
                                {claim.proof_description}
                                {claim.proof_description.length > 120 && (
                                  <button 
                                    type="button" 
                                    className="lf-readmore-btn"
                                    onClick={() => toggleExpandClaim(claim.id)}
                                  >
                                    Sembunyikan
                                  </button>
                                )}
                              </>
                            )}
                          </p>
                          {claim.proof_image_path && (
                            <div className="mt-2 text-center rounded-3 overflow-hidden border bg-light p-1" style={{ maxHeight: "150px", maxWidth: "200px" }}>
                              <img 
                                src={claim.proof_image_path} 
                                alt="Foto Bukti" 
                                className="img-fluid rounded-2" 
                                style={{ maxHeight: "140px", objectFit: "contain", cursor: "pointer" }} 
                                onClick={() => Swal.fire({
                                  imageUrl: claim.proof_image_path,
                                  imageAlt: 'Foto Bukti Kepemilikan',
                                  showCloseButton: true,
                                  showConfirmButton: false,
                                  background: '#fafbfd'
                                })}
                              />
                            </div>
                          )}
                        </div>

                        {/* Admin Notes if processed */}
                        {claim.admin_notes && (
                          <div className="mb-3 p-3 rounded-3 bg-light-warning-subtle border border-warning-subtle">
                            <span className="text-warning small fw-bold text-uppercase d-block mb-1"><i className="bi bi-chat-left-quote-fill me-1"></i>Catatan Admin</span>
                            <p className="text-secondary small m-0">{claim.admin_notes}</p>
                          </div>
                        )}

                        <div className="d-flex align-items-center justify-content-between mt-auto border-top pt-3">
                          <div>
                            <span className="text-secondary small me-2">Status:</span>
                            <span className={`badge px-3 py-2 text-capitalize ${
                              claim.status === "approved" ? "bg-light-success text-success" :
                              claim.status === "rejected" ? "bg-light-danger text-danger" : "bg-light-warning text-warning"
                            }`}>
                              {claim.status}
                            </span>
                          </div>
                          
                          {claim.status === "pending" && (
                            <button className="btn btn-outline-danger btn-sm rounded-3 py-1.5 px-3 fw-bold d-flex align-items-center gap-1" onClick={() => handleDeleteClaim(claim.id)}>
                              <i className="bi bi-x-lg"></i> Batalkan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5 text-secondary">
                    <i className="bi bi-file-earmark-x display-4 opacity-20 mb-3 d-block"></i>
                    <p className="fw-semibold">Anda belum pernah mengajukan klaim barang.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* INCOMING CLAIMS SUB-TAB */
            <div>
              <h5 className="fw-bold mb-4 text-success d-flex align-items-center gap-2">
                <i className="bi bi-box-arrow-in-down-left text-success"></i>
                Klaim Mahasiswa Lain atas Temuan Saya
              </h5>

              <div className="row g-4">
                {incomingClaims.length > 0 ? (
                  incomingClaims.map((claim) => (
                    <div className="col-md-6" key={claim.id}>
                      <div className="card border p-3 rounded-4 shadow-sm h-100 d-flex flex-column">
                        <div className="border-bottom pb-2 mb-3">
                          <span className="text-secondary small fw-bold text-uppercase">Nama Barang Temuan Anda</span>
                          <h5 className="fw-bold text-slate mb-1">{claim.item?.title}</h5>
                          <small className="text-secondary d-block">Ditemukan di: <b>{claim.item?.location}</b></small>
                        </div>

                        <div className="border-bottom pb-2 mb-3 bg-light p-2.5 rounded-3">
                          <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Pengklaim (Pemilik Asli)</span>
                          <h6 className="fw-bold text-slate m-0">{claim.user?.name} ({claim.user?.nim_nip})</h6>
                          {claim.status === "approved" ? (
                            <div className="mt-2 text-primary small">
                              <div><i className="bi bi-envelope-fill me-1"></i>Email: {claim.user?.email}</div>
                              <div><i className="bi bi-telephone-fill me-1"></i>WhatsApp: {claim.user?.phone_number || "Tidak dicantumkan"}</div>
                            </div>
                          ) : (
                            <small className="text-muted d-block mt-1"><i className="bi bi-info-circle me-1"></i>Kontak akan terbuka jika disetujui Admin.</small>
                          )}
                        </div>

                        <div className="flex-grow-1 mb-3">
                          <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Alasan/Bukti Kepemilikan</span>
                          <p className="text-secondary small bg-light p-3 rounded-3 border-start border-success border-3 mb-2">
                            {claim.proof_description.length > 120 && !expandedClaimIds.has(claim.id) ? (
                              <>
                                {claim.proof_description.substring(0, 120)}...
                                <button 
                                  type="button" 
                                  className="lf-readmore-btn"
                                  onClick={() => toggleExpandClaim(claim.id)}
                                >
                                  Lihat Selengkapnya
                                </button>
                              </>
                            ) : (
                              <>
                                {claim.proof_description}
                                {claim.proof_description.length > 120 && (
                                  <button 
                                    type="button" 
                                    className="lf-readmore-btn"
                                    onClick={() => toggleExpandClaim(claim.id)}
                                  >
                                    Sembunyikan
                                  </button>
                                )}
                              </>
                            )}
                          </p>
                          {claim.proof_image_path && (
                            <div className="mt-2 text-center rounded-3 overflow-hidden border bg-light p-1" style={{ maxHeight: "150px", maxWidth: "200px" }}>
                              <img 
                                src={claim.proof_image_path} 
                                alt="Foto Bukti" 
                                className="img-fluid rounded-2" 
                                style={{ maxHeight: "140px", objectFit: "contain", cursor: "pointer" }} 
                                onClick={() => Swal.fire({
                                  imageUrl: claim.proof_image_path,
                                  imageAlt: 'Foto Bukti Kepemilikan',
                                  showCloseButton: true,
                                  showConfirmButton: false,
                                  background: '#fafbfd'
                                })}
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-auto border-top pt-3">
                          <span className="text-secondary small me-2">Status Klaim:</span>
                          <span className={`badge px-3 py-2 text-capitalize ${
                            claim.status === "approved" ? "bg-light-success text-success" :
                            claim.status === "rejected" ? "bg-light-danger text-danger" : "bg-light-warning text-warning"
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5 text-secondary">
                    <i className="bi bi-shield-exclamation display-4 opacity-20 mb-3 d-block"></i>
                    <p className="fw-semibold">Belum ada pengklaim lain yang mengajukan bukti kepemilikan atas temuan Anda.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        .lf-readmore-btn {
          color: #6366f1;
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
          color: #4338ca;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}

export default Claims;
