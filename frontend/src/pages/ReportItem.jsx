import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiRequest } from "../utils/api";

function ReportItem() {
  const navigate = useNavigate();
  const locationObj = useLocation();
  const queryParams = new URLSearchParams(locationObj.search);
  const urlType = queryParams.get("type") === "found" ? "found" : "lost";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    location: "",
    date_time: "",
    image_path: "",
    description: "",
    type: urlType
  });

  // Sync state if URL type param changes
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      type: urlType
    }));
  }, [urlType]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await apiRequest("/api/categories");
        if (result.status) {
          setCategories(result.data);
        }
      } catch (e) {
        console.error("Gagal mengambil kategori:", e);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: "Ukuran File Terlalu Besar",
        text: "Batas maksimal ukuran file adalah 5MB.",
        icon: "error",
        confirmButtonColor: "#4F46E5"
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const result = await apiRequest("/api/upload", {
        method: "POST",
        body: formData
      });

      if (result.status && result.data && result.data.url) {
        setForm(prev => ({
          ...prev,
          image_path: result.data.url
        }));
      }
    } catch (err) {
      Swal.fire({
        title: "Gagal Mengunggah",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#4F46E5"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({
      ...prev,
      image_path: ""
    }));
  };

  const handleCancelForm = () => {
    Swal.fire({
      title: "Batalkan Pengisian?",
      text: "Semua data formulir laporan ini akan dikosongkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Kosongkan",
      cancelButtonText: "Lanjutkan Isi Laporan",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        setForm({
          category_id: "",
          title: "",
          location: "",
          date_time: "",
          image_path: "",
          description: "",
          type: form.type
        });
      }
    });
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!form.category_id || !form.title || !form.location || !form.date_time || !form.description || !form.type) {
      Swal.fire({
        title: "Peringatan",
        text: "Harap isi semua kolom bertanda bintang (*)",
        icon: "warning",
        confirmButtonColor: "#4F46E5"
      });
      return;
    }

    const reportTypeName = form.type === "lost" ? "kehilangan barang" : "temuan barang";
    const confirmSubmit = await Swal.fire({
      title: "Konfirmasi Kirim Laporan",
      text: `Apakah Anda yakin ingin mengirim laporan ${reportTypeName} ini?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4F46E5",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Kirim!",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (!confirmSubmit.isConfirmed) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: parseInt(form.category_id, 10),
        date_time: new Date(form.date_time).toISOString()
      };

      const result = await apiRequest("/api/items", {
        method: "POST",
        body: payload
      });

      if (result.status) {
        Swal.fire({
          title: "Laporan Terkirim!",
          text: `Laporan ${reportTypeName} Anda telah berhasil disimpan dan sedang menunggu verifikasi admin.`,
          icon: "success",
          confirmButtonColor: "#4F46E5"
        });
        
        // Reset form but retain current type selection
        setForm({
          category_id: "",
          title: "",
          location: "",
          date_time: "",
          image_path: "",
          description: "",
          type: form.type
        });
        
        navigate("/");
      }
    } catch (error) {
      Swal.fire({
        title: "Gagal Melapor",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#4F46E5"
      });
    } finally {
      setLoading(false);
    }
  };

  const isLost = form.type === "lost";

  // Clean, modern inputs style
  const inputStyle = {
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    padding: "11px 16px",
    fontSize: "14.5px",
    color: "#1F2937",
    background: "#FFFFFF",
    transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out"
  };

  return (
    <div className="container py-3">
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: "16px" }}>
        
        {/* Card Header */}
        <div className="px-4 py-4 bg-white border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-3 bg-light text-primary" style={{ width: "44px", height: "44px" }}>
              <i className="bi bi-file-earmark-text-fill fs-4 text-primary"></i>
            </div>
            <div className="text-start">
              <h4 className="fw-bold mb-0 text-slate" style={{ letterSpacing: "-0.5px" }}>Formulir Laporan Barang</h4>
              <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Laporkan barang hilang atau barang temuan di lingkungan kampus</p>
            </div>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold text-uppercase" style={{ fontSize: "10.5px", letterSpacing: "0.5px" }}>
            Layanan Akademik
          </span>
        </div>

        {/* Card Body */}
        <div className="card-body p-4 p-md-5 bg-white">
          <form onSubmit={submitReport} className="text-start">
            
            {/* Tipe Laporan Dropdown */}
            <div className="mb-4">
              <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                Pilih Tipe Laporan <span className="text-danger">*</span>
              </label>
              <select
                className="form-select fw-semibold text-slate"
                style={inputStyle}
                name="type"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="lost">Saya Kehilangan Barang (Mencari Barang)</option>
                <option value="found">Saya Menemukan Barang (Melaporkan Temuan)</option>
              </select>
            </div>

            {/* Nama Barang */}
            <div className="mb-4">
              <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                Nama Barang <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control text-slate"
                style={inputStyle}
                placeholder={isLost ? "Contoh: Kunci Motor Vario Hitam" : "Contoh: TWS Putih di Lab Telekomunikasi"}
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Kategori & Lokasi */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                  Kategori Barang <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select text-slate"
                  style={inputStyle}
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                  {isLost ? "Lokasi Hilang / Terakhir Terlihat" : "Lokasi Penemuan Barang"} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control text-slate"
                  style={inputStyle}
                  placeholder={isLost ? "Contoh: Kantin FEB / Gd. Elektro Lt. 2" : "Contoh: Masjid Kampus / Halte Depan"}
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Waktu & Foto */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                  {isLost ? "Tanggal & Estimasi Waktu Hilang" : "Tanggal & Waktu Ditemukan"} <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-control text-slate"
                  style={inputStyle}
                  name="date_time"
                  value={form.date_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                  Foto Fisik Barang <span className="text-muted fw-normal">(opsional)</span>
                </label>

                {!form.image_path ? (
                  <div
                    className="position-relative d-flex flex-column align-items-center justify-content-center border"
                    style={{
                      height: "85px",
                      borderRadius: "10px",
                      borderStyle: "dashed",
                      borderColor: "#CBD5E1",
                      background: "#F8FAFC",
                      cursor: uploading ? "wait" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="file"
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      style={{ cursor: uploading ? "wait" : "pointer" }}
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <span className="spinner-border text-primary spinner-border-sm mb-1" role="status" />
                    ) : (
                      <i className="bi bi-cloud-arrow-up text-secondary mb-1" style={{ fontSize: "20px" }}></i>
                    )}
                    <span className="fw-semibold text-secondary" style={{ fontSize: "12px" }}>
                      {uploading ? "Mengunggah..." : "Klik untuk unggah foto"}
                    </span>
                  </div>
                ) : (
                  <div
                    className="d-flex align-items-center gap-3 border px-3 py-2"
                    style={{
                      height: "85px",
                      borderRadius: "10px",
                      background: "#ECFDF5",
                      borderColor: "#A7F3D0",
                    }}
                  >
                    <img
                      src={form.image_path}
                      alt="Preview"
                      style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center gap-1 fw-bold text-success" style={{ fontSize: "12px" }}>
                        <i className="bi bi-check-circle-fill"></i>
                        <span>Berhasil diunggah</span>
                      </div>
                      <span style={{ fontSize: "10.5px", color: "#6B7280" }}>Tekan ikon sampah untuk menghapus</span>
                    </div>
                    <button
                      type="button"
                      className="btn p-1 flex-shrink-0"
                      style={{ color: "#EF4444", border: "none", background: "transparent", lineHeight: 1 }}
                      onClick={handleRemoveImage}
                      title="Hapus foto"
                    >
                      <i className="bi bi-trash3-fill" style={{ fontSize: "16px" }}></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Deskripsi */}
            <div className="mb-5">
              <label className="form-label fw-bold mb-1.5 text-slate" style={{ fontSize: "13.5px" }}>
                Deskripsi & Ciri Spesifik Barang <span className="text-danger">*</span>
              </label>
              <textarea
                rows="4"
                className="form-control text-slate"
                style={{ ...inputStyle, resize: "none" }}
                placeholder={isLost 
                  ? "Contoh: Dompet kulit cokelat Braun Buffel, isinya KTM atas nama Ahmad Fauzi, SIM C, dan struk belanja." 
                  : "Contoh: Ditemukan botol minum Corkcicle biru toska di meja belajar perpustakaan lt. 2. Keadaan masih bagus."
                }
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            {/* Buttons (Batal & Kirim) */}
            <div className="row g-3">
              <div className="col-sm-4 col-md-3">
                <button
                  type="button"
                  className="btn w-100 fw-bold btn-outline-secondary py-2.5"
                  style={{ borderRadius: "10px", fontSize: "14px" }}
                  onClick={handleCancelForm}
                  disabled={loading || uploading}
                >
                  Batal
                </button>
              </div>
              <div className="col-sm-8 col-md-9">
                <button
                  type="submit"
                  className="btn w-100 py-2.5 d-flex justify-content-center align-items-center gap-2 fw-bold text-white shadow-sm"
                  style={{
                    borderRadius: "10px",
                    background: loading || uploading
                      ? "#818CF8"
                      : "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
                    border: "none",
                    fontSize: "14.5px",
                    letterSpacing: "0.2px",
                    transition: "all 0.2s ease",
                  }}
                  disabled={loading || uploading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Mengirim Laporan...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i>
                      Kirim Laporan {isLost ? "Kehilangan" : "Penemuan"}
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default ReportItem;
