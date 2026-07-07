import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import Dashboard from "../pages/Dashboard";
import ReportItem from "../pages/ReportItem";
import Users from "../pages/Users";
import Admin from "../pages/Admin";
import Auth from "../pages/Auth";
import Claims from "../pages/Claims";
import Profile from "../pages/Profile"; // refreshed
import MyReports from "../pages/MyReports";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageKey = (pathname) => {
    if (pathname === "/" || pathname === "/feed") return "users";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/report")) return "report";
    if (pathname.startsWith("/my-reports")) return "my-reports";
    if (pathname.startsWith("/claims")) return "claims";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/profile")) return "profile";
    return "users";
  };

  const page = getPageKey(location.pathname);
  
  // SIDEBAR HANYA UNTUK ADMIN PADA HALAMAN ADMIN & DASHBOARD
  const showSidebar =
    user &&
    user.role === "admin" &&
    (page === "admin" || page === "dashboard");

  // HILANGKAN NAVBAR HANYA UNTUK ADMIN DI HALAMAN DASHBOARD & ADMIN PANEL
  const showNavbar =
    !(user && user.role === "admin" && (page === "dashboard" || page === "admin")) &&
    (user !== null || (page !== "users" && page !== "profile"));

  const setPage = (pageName) => {
    if (pageName === "users") navigate("/");
    else navigate(`/${pageName}`);
  };

  return (
    <div className="app-wrapper">
      {/* Navbar */}
      {showNavbar && <Navbar user={user} setPage={setPage} currentPage={page} showSidebar={showSidebar} />}

      <div className="main-layout-wrapper">
        {/* Sidebar */}
        {showSidebar && <Sidebar setPage={setPage} currentPage={page} user={user} />}

        {/* Content */}
        <div className={`content-area-wrapper ${!showSidebar ? "no-sidebar" : ""}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, login, authLoading } = useAuth();
  const navigate = useNavigate();

  const [lostUsers, setLostUsers] = useState([]);
  const [foundUsers, setFoundUsers] = useState([]);

  const fetchRecentItems = async () => {
    try {
      const endpointPrefix = user ? "/api/items" : "/api/public/items";
      const lostRes = await apiRequest(`${endpointPrefix}?type=lost&size=5`);
      const foundRes = await apiRequest(`${endpointPrefix}?type=found&size=5`);
      if (lostRes.status) setLostUsers(lostRes.data);
      if (foundRes.status) setFoundUsers(foundRes.data);
    } catch (e) {
      console.error("Gagal memuat aktivitas terbaru:", e);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchRecentItems();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "100vh", background: "#f8fafc" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-secondary fw-semibold">Memuat Sistem...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public auth screen (full-screen, no navbar/sidebar) */}
      <Route element={<PublicRoute restricted={true} />}>
        <Route path="/login" element={<Auth />} />
      </Route>

      {/* Screens under Main Layout */}
      <Route element={<MainLayout />}>
        {/* Public Feed */}
        <Route path="/" element={<Users />} />
        <Route path="/share/p/:slug" element={<Users />} />
        <Route path="/users" element={<Navigate to="/" replace />} />

        {/* Protected user screens */}
        <Route element={<ProtectedRoute />}>
          <Route path="/report" element={<ReportItem />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Protected admin screen */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard lostUsers={lostUsers} foundUsers={foundUsers} />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
