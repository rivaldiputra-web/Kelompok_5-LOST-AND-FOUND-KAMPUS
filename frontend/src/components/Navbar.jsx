import { handleLogout } from "../utils/api";
import Swal from "sweetalert2";

function Navbar({ user, setPage, currentPage, showSidebar }) {
  const performLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Sesi Anda akan diakhiri.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Logout!",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const handleNavClick = (pageName) => {
    setPage(pageName);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-glass sticky-top py-2 px-4" style={{ zIndex: 100 }}>
      <div className="container-fluid p-0">
        {/* BRAND */}
        <a 
          className="navbar-brand fw-bold d-flex align-items-center gap-2 text-gradient cursor-pointer m-0" 
          onClick={() => handleNavClick("users")}
          style={{ fontSize: "20px", cursor: "pointer", userSelect: "none" }}
        >
          <i className="bi bi-geo-alt-fill text-primary animate-pulse"></i>
          <span style={{ letterSpacing: "-0.5px" }}>Lost & Found</span>
        </a>

        {/* TOGGLE BUTTON MOBILE */}
        <button 
          className="navbar-toggler border-0 p-1" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarContent" 
          aria-controls="navbarContent" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ width: "24px", height: "24px" }}></span>
        </button>

        {/* NAV CONTENT */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* TABS TENGAH */}
          <ul className="navbar-nav mx-auto nav-tabs-custom mb-2 mb-lg-0 mt-2 mt-lg-0 gap-1 gap-lg-2">
            <li className="nav-item">
              <a 
                className={`nav-link fw-semibold cursor-pointer px-3 py-2 text-slate ${currentPage === "users" ? "active" : ""}`}
                onClick={() => handleNavClick("users")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-house-door-fill me-2"></i>
                Beranda (Feed)
              </a>
            </li>
            
            {user && (
              <>
                <li className="nav-item">
                  <a 
                    className={`nav-link fw-semibold cursor-pointer px-3 py-2 text-slate ${currentPage === "report" ? "active" : ""}`}
                    onClick={() => handleNavClick("report")}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-file-earmark-plus-fill me-2"></i>
                    Lapor Barang
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    className={`nav-link fw-semibold cursor-pointer px-3 py-2 text-slate ${currentPage === "my-reports" ? "active" : ""}`}
                    onClick={() => handleNavClick("my-reports")}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-clock-history me-2"></i>
                    Laporan Saya
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    className={`nav-link fw-semibold cursor-pointer px-3 py-2 text-slate ${currentPage === "claims" ? "active" : ""}`}
                    onClick={() => handleNavClick("claims")}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-shield-check me-2"></i>
                    Klaim Saya
                  </a>
                </li>
              </>
            )}
          </ul>

          {/* USER PROFILE / LOGIN KANAN */}
          <div className="navbar-right-box d-flex align-items-center gap-3 ms-lg-0 ms-auto pt-2 pt-lg-0">
            {user ? (
              <div className="d-flex align-items-center gap-3">
                {/* User Profile Dropdown */}
                <div className="dropdown">
                  <button 
                    className="btn btn-link p-0 text-decoration-none dropdown-toggle border-0 shadow-none d-flex align-items-center gap-2 bg-light px-3 py-1.5 rounded-pill border"
                    type="button" 
                    id="userProfileDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white bg-primary shadow-sm" style={{ width: "32px", height: "32px", fontSize: "12px", fontWeight: "bold" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-start d-none d-sm-block">
                      <h6 className="m-0 fw-bold text-dark leading-none" style={{ fontSize: "13px", lineHeight: "1.1" }}>
                        {user.name.split(" ")[0]}
                      </h6>
                      <small className="text-secondary opacity-75 d-block" style={{ fontSize: "10px", marginTop: "1px" }}>
                        {user.nim_nip}
                      </small>
                    </div>
                  </button>
                  
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2 py-2" aria-labelledby="userProfileDropdown" style={{ minWidth: "180px" }}>
                    <li>
                      <button className="dropdown-item py-2 d-flex align-items-center gap-2 fw-medium text-slate bg-transparent border-0 text-start w-100" onClick={() => handleNavClick("profile")}>
                        <i className="bi bi-person-circle fs-5 text-primary"></i>
                        Profil Saya
                      </button>
                    </li>
                    {user.role === "admin" && (
                      <li>
                        <button className="dropdown-item py-2 d-flex align-items-center gap-2 fw-medium text-slate bg-transparent border-0 text-start w-100" onClick={() => handleNavClick("admin")}>
                          <i className="bi bi-shield-lock fs-5 text-warning"></i>
                          Admin Panel
                        </button>
                      </li>
                    )}
                    <li><hr className="dropdown-divider opacity-10 my-2" /></li>
                    <li>
                      <button className="dropdown-item py-2 d-flex align-items-center gap-2 fw-medium text-danger bg-transparent border-0 text-start w-100" onClick={performLogout}>
                        <i className="bi bi-box-arrow-right fs-5"></i>
                        Keluar (Logout)
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Login Button for Guest */
              <button
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm text-white transition-3"
                onClick={() => handleNavClick("login")}
              >
                <i className="bi bi-box-arrow-in-right"></i>
                Masuk / Daftar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;