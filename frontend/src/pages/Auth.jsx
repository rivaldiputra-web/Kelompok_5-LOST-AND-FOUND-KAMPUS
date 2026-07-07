import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest, setAccessToken } from "../utils/api";

function Auth() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [registerForm, setRegisterForm] = useState({
    nim_nip: "",
    name: "",
    email: "",
    password: "",
    phone_number: ""
  });

  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value
    });
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      Swal.fire("Peringatan", "Email/NIM dan Password wajib diisi", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: loginForm
      });
      if (result.status) {
        setAccessToken(result.accessToken);
        
        // Memuat profil pengguna lengkap (termasuk role & id) langsung setelah login sukses
        const profileRes = await apiRequest("/api/users/current");
        if (profileRes.status) {
          Swal.fire("Berhasil", `Selamat datang kembali, ${profileRes.data.name}!`, "success");
          login(result.accessToken, profileRes.data);
          navigate("/");
        }
      }
    } catch (error) {
      Swal.fire("Gagal Login", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.nim_nip || !registerForm.name || !registerForm.email || !registerForm.password) {
      Swal.fire("Peringatan", "Kolom dengan tanda bintang (*) wajib diisi", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest("/api/auth/register", {
        method: "POST",
        body: registerForm
      });
      if (result.status) {
        Swal.fire("Registrasi Berhasil", "Silakan login menggunakan akun baru Anda", "success");
        setIsLogin(true);
      }
    } catch (error) {
      Swal.fire("Gagal Registrasi", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <div className="auth-card shadow-lg p-5 rounded-4 text-center">
        {true && (
          <div className="text-start mb-3">
            <button 
              onClick={() => navigate("/")} 
              className="btn btn-link p-0 text-decoration-none text-secondary small d-flex align-items-center gap-1.5 fw-semibold border-0 transition-3"
              style={{ fontSize: "12px" }}
            >
              <i className="bi bi-arrow-left"></i> Kembali ke Beranda
            </button>
          </div>
        )}
        <h2 className="fw-bold mb-2 auth-title text-gradient">Lost & Found</h2>
        <p className="text-secondary mb-4 small">Sistem Pelaporan Barang Hilang & Temuan Kampus</p>

        {/* Tab Buttons */}
        <div className="d-flex justify-content-center gap-2 mb-4 bg-light p-1 rounded-3">
          <button
            className={`btn w-50 py-2 rounded-3 transition-3 ${isLogin ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"}`}
            onClick={() => setIsLogin(true)}
          >
            Masuk
          </button>
          <button
            className={`btn w-50 py-2 rounded-3 transition-3 ${!isLogin ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"}`}
            onClick={() => setIsLogin(false)}
          >
            Daftar
          </button>
        </div>

        {isLogin ? (
          /* LOGIN FORM */
          <form onSubmit={submitLogin}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control rounded-3"
                id="loginEmail"
                placeholder="Email atau NIM/NIP"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
              />
              <label htmlFor="loginEmail"><i className="bi bi-person-fill me-2 text-secondary"></i>Email atau NIM/NIP</label>
            </div>
            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control rounded-3"
                id="loginPassword"
                placeholder="Password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
              <label htmlFor="loginPassword"><i className="bi bi-lock-fill me-2 text-secondary"></i>Password</label>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 py-3 rounded-3 fw-bold btn-submit shadow-sm d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={submitRegister}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control rounded-3"
                id="regNPM"
                placeholder="NPM / NIP"
                name="nim_nip"
                value={registerForm.nim_nip}
                onChange={handleRegisterChange}
                required
              />
              <label htmlFor="regNPM"><i className="bi bi-card-text me-2 text-secondary"></i>NIM / NIP *</label>
            </div>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control rounded-3"
                id="regName"
                placeholder="Nama Lengkap"
                name="name"
                value={registerForm.name}
                onChange={handleRegisterChange}
                required
              />
              <label htmlFor="regName"><i className="bi bi-person-fill me-2 text-secondary"></i>Nama Lengkap *</label>
            </div>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control rounded-3"
                id="regEmail"
                placeholder="name@example.com"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                required
              />
              <label htmlFor="regEmail"><i className="bi bi-envelope-fill me-2 text-secondary"></i>Email Kampus *</label>
            </div>
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control rounded-3"
                id="regPassword"
                placeholder="Password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
              />
              <label htmlFor="regPassword"><i className="bi bi-lock-fill me-2 text-secondary"></i>Password *</label>
            </div>
            <div className="form-floating mb-4">
              <input
                type="text"
                className="form-control rounded-3"
                id="regPhone"
                placeholder="Nomor Telepon"
                name="phone_number"
                value={registerForm.phone_number}
                onChange={handleRegisterChange}
              />
              <label htmlFor="regPhone"><i className="bi bi-telephone-fill me-2 text-secondary"></i>Nomor HP (WhatsApp)</label>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 py-3 rounded-3 fw-bold btn-submit shadow-sm d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Mendaftar...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill"></i>
                  Daftar Akun
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;
