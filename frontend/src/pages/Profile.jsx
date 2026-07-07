import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

function Profile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [form, setForm] = useState({
    nim_nip: "",
    name: "",
    email: "",
    phone_number: "",
    password: ""
  });

  // Load user data into form on mount
  useEffect(() => {
    if (user) {
      setForm({
        nim_nip: user.nim_nip || "",
        name: user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        password: "" // Keep password field empty by default
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.nim_nip) {
      Swal.fire("Peringatan", "Nama, Email, dan NIM/NIP wajib diisi.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nim_nip: form.nim_nip,
        name: form.name,
        email: form.email,
        phone_number: form.phone_number
      };
      
      // Only include password if the user wants to change it
      if (form.password.trim() !== "") {
        payload.password = form.password;
      }

      const result = await apiRequest("/api/users/current", {
        method: "PATCH",
        body: payload
      });

      if (result.status) {
        // Sync context state
        setUser(result.data);
        Swal.fire({
          title: "Profil Diperbarui!",
          text: "Data profil Anda berhasil disimpan secara aman.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        // Clear password field
        setForm(prev => ({ ...prev, password: "" }));
      }
    } catch (error) {
      Swal.fire("Gagal Memperbarui", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Title banner */}
      <div className="w-100 text-start mb-4">
        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-2 fw-semibold">
          <i className="bi bi-person-fill-gear me-1"></i> Pengaturan Akun
        </span>
        <h2 className="fw-bold m-0 text-dark">Profil Saya</h2>
        <p className="text-secondary small m-0 mt-1">
          Kelola informasi profil, nomor WhatsApp, dan ubah password akun Anda secara aman.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-6 text-start">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <i className="bi bi-card-heading text-primary"></i> Detail Informasi Akun
            </h5>
            <hr className="mt-0 mb-4 opacity-10" />

            <form onSubmit={handleUpdateProfile}>
              {/* NIM / NIP */}
              <div className="mb-3 text-start">
                <label className="form-label fw-bold text-secondary small">NIM / NIP *</label>
                <input
                  type="text"
                  className="form-control rounded-3 py-2.5 bg-light"
                  name="nim_nip"
                  value={form.nim_nip}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Name */}
              <div className="mb-3 text-start">
                <label className="form-label fw-bold text-secondary small">Nama Lengkap *</label>
                <input
                  type="text"
                  className="form-control rounded-3 py-2.5"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-3 text-start">
                <label className="form-label fw-bold text-secondary small">Alamat Email *</label>
                <input
                  type="email"
                  className="form-control rounded-3 py-2.5"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="mb-3 text-start">
                <label className="form-label fw-bold text-secondary small">Nomor Telepon (WhatsApp)</label>
                <input
                  type="text"
                  className="form-control rounded-3 py-2.5"
                  placeholder="Contoh: 081234567890"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleInputChange}
                />
              </div>

              {/* Password */}
              <div className="mb-4 text-start">
                <label className="form-label fw-bold text-secondary small">
                  Password Baru <span className="text-muted fw-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  className="form-control rounded-3 py-2.5"
                  placeholder="Masukkan password baru..."
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill"></i>
                    Simpan Perubahan Profil
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
// Force dev server HMR cache refresh
