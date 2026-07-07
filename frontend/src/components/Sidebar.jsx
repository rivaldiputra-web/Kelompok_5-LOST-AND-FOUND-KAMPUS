import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Sidebar({ setPage, currentPage, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || "items";

  const today = new Date();
  const tanggal = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleTabClick = (tabName) => {
    setPage("admin");
    navigate(`/admin?tab=${tabName}`);
  };

  const handleGoDashboard = () => {
    setPage("dashboard");
    navigate("/dashboard");
  };

  const handleGoHome = () => {
    setPage("users");
    navigate("/");
  };

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header with Toggle button only */}
      <div className="sidebar-header d-flex align-items-center justify-content-end py-1">
        <button
          className="hamburger-btn border-0 rounded-3 d-flex align-items-center justify-content-center text-white"
          onClick={() => setCollapsed(!collapsed)}
          style={{ width: "32px", height: "32px" }}
        >
          <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
        </button>
      </div>

      <hr className="sidebar-line opacity-20" />

      {/* Unified Admin Sidebar Menu */}
      <div className="menu-list d-flex flex-column gap-2">
        {/* Dashboard */}
        <button
          className={`menu-btn border-0 rounded-3 d-flex align-items-center gap-3 text-start py-3 px-3 transition-3 ${
            currentPage === "dashboard" ? "active" : ""
          }`}
          onClick={handleGoDashboard}
        >
          <i className="bi bi-grid-1x2-fill fs-5 text-info"></i>
          {!collapsed && <span className="fw-semibold">Dashboard</span>}
        </button>

        {/* Verifikasi Barang */}
        <button
          className={`menu-btn border-0 rounded-3 d-flex align-items-center gap-3 text-start py-3 px-3 transition-3 ${
            currentPage === "admin" && activeTab === "items" ? "active" : ""
          }`}
          onClick={() => handleTabClick("items")}
        >
          <i className="bi bi-patch-check-fill fs-5"></i>
          {!collapsed && <span className="fw-semibold">Verifikasi Barang</span>}
        </button>

        {/* Persetujuan Klaim */}
        <button
          className={`menu-btn border-0 rounded-3 d-flex align-items-center gap-3 text-start py-3 px-3 transition-3 ${
            currentPage === "admin" && activeTab === "claims" ? "active" : ""
          }`}
          onClick={() => handleTabClick("claims")}
        >
          <i className="bi bi-file-earmark-text-fill fs-5 text-warning"></i>
          {!collapsed && <span className="fw-semibold">Persetujuan Klaim</span>}
        </button>

        {/* Kelola Kategori */}
        <button
          className={`menu-btn border-0 rounded-3 d-flex align-items-center gap-3 text-start py-3 px-3 transition-3 ${
            currentPage === "admin" && activeTab === "categories" ? "active" : ""
          }`}
          onClick={() => handleTabClick("categories")}
        >
          <i className="bi bi-tags-fill fs-5 text-success"></i>
          {!collapsed && <span className="fw-semibold">Kelola Kategori</span>}
        </button>

        <hr className="sidebar-line opacity-20 my-2" />

        {/* Kembali ke Beranda */}
        <button
          className="menu-btn border-0 rounded-3 d-flex align-items-center gap-3 text-start py-3 px-3 transition-3 text-sky"
          onClick={handleGoHome}
        >
          <i className="bi bi-arrow-left-circle-fill fs-5"></i>
          {!collapsed && <span className="fw-semibold">Kembali ke Feed</span>}
        </button>
      </div>

    </div>
  );
}

export default Sidebar;
