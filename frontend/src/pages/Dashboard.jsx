import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

// --- SUB-COMPONENT: DONUT CHART (SVG) ---
function DonutChart({ statusCounts }) {
  const { available, returned, pending } = statusCounts;
  const total = available + returned + pending;
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (total === 0) {
    return (
      <div className="text-center py-5 text-secondary">
        <i className="bi bi-pie-chart display-4 opacity-50 mb-2 d-block"></i>
        <p className="small m-0">Tidak ada data untuk grafik</p>
      </div>
    );
  }

  const data = [
    { name: "Tersedia", value: available, color: "#3b82f6", gradId: "gradBlue" },
    { name: "Dikembalikan", value: returned, color: "#10b981", gradId: "gradGreen" },
    { name: "Verifikasi", value: pending, color: "#ef4444", gradId: "gradRed" }
  ].filter(d => d.value > 0);

  const radius = 38;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100">
      <div className="position-relative" style={{ width: "160px", height: "160px" }}>
        <svg width="160" height="160" viewBox="0 0 100 100" className="w-100 h-100">
          <defs>
            <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          {data.map((item, idx) => {
            const percent = (item.value / total) * 100;
            const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += percent;

            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={`url(#${item.gradId})`}
                strokeWidth={isHovered ? strokeWidth + 2.5 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
                style={{
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  filter: isHovered ? "drop-shadow(0px 3px 5px rgba(0,0,0,0.12))" : "none"
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div 
          className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none"
          style={{ width: "90px" }}
        >
          {hoveredIndex !== null ? (
            <>
              <h4 className="m-0 fw-bold" style={{ color: data[hoveredIndex].color, fontSize: "18px" }}>
                {data[hoveredIndex].value}
              </h4>
              <p className="m-0 text-secondary fw-bold" style={{ fontSize: "8.5px", letterSpacing: "0.5px" }}>
                {data[hoveredIndex].name.toUpperCase()}
              </p>
            </>
          ) : (
            <>
              <h3 className="m-0 fw-bold text-dark" style={{ fontSize: "20px" }}>{total}</h3>
              <p className="m-0 text-muted fw-semibold" style={{ fontSize: "8px", letterSpacing: "0.5px" }}>TOTAL LAPOR</p>
            </>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="d-flex gap-2.5 justify-content-center mt-3 flex-wrap">
        {data.map((item, idx) => (
          <div 
            key={idx} 
            className="d-flex align-items-center gap-1 cursor-pointer"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ opacity: hoveredIndex !== null && hoveredIndex !== idx ? 0.55 : 1, transition: "opacity 0.2s" }}
          >
            <span className="rounded-circle d-inline-block" style={{ width: "8px", height: "8px", backgroundColor: item.color }}></span>
            <span className="fw-semibold text-secondary" style={{ fontSize: "11px" }}>
              {item.name} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: WEEKLY TREND AREA CHART (SVG) ---
function WeeklyTrendChart({ weeklyTrend }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (weeklyTrend.length === 0) {
    return (
      <div className="text-center py-5 text-secondary">
        <i className="bi bi-graph-up display-4 opacity-50 mb-2 d-block"></i>
        <p className="small m-0">Tidak ada data tren mingguan</p>
      </div>
    );
  }

  const maxVal = Math.max(...weeklyTrend.map(d => Math.max(d.lost, d.found)), 5);
  
  const width = 450;
  const height = 180;
  const paddingX = 35;
  const paddingY = 25;
  
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  
  const pointsX = weeklyTrend.map((_, idx) => paddingX + (idx * chartWidth) / (weeklyTrend.length - 1));
  const pointsYLost = weeklyTrend.map(d => height - paddingY - (d.lost / maxVal) * chartHeight);
  const pointsYFound = weeklyTrend.map(d => height - paddingY - (d.found / maxVal) * chartHeight);

  const lostLinePath = pointsX.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${pointsYLost[i]}`).join(" ");
  const foundLinePath = pointsX.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${pointsYFound[i]}`).join(" ");

  const lostAreaPath = `${lostLinePath} L ${pointsX[pointsX.length - 1]} ${height - paddingY} L ${pointsX[0]} ${height - paddingY} Z`;
  const foundAreaPath = `${foundLinePath} L ${pointsX[pointsX.length - 1]} ${height - paddingY} L ${pointsX[0]} ${height - paddingY} Z`;

  return (
    <div className="w-100 position-relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lostAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="foundAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + ratio * chartHeight;
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx} opacity="0.12">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
              <text x={paddingX - 8} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontWeight="bold">{val}</text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={lostAreaPath} fill="url(#lostAreaGrad)" />
        <path d={foundAreaPath} fill="url(#foundAreaGrad)" />

        {/* Lines */}
        <path d={lostLinePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={foundLinePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover interactive columns */}
        {weeklyTrend.map((d, idx) => {
          const x = pointsX[idx];
          const isHovered = hoveredIdx === idx;

          return (
            <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Invisible touch target bar */}
              <rect
                x={x - chartWidth / 12}
                y={paddingY}
                width={chartWidth / 6}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: "pointer" }}
              />
              
              {/* Highlight vertical line */}
              {isHovered && (
                <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
              )}

              {/* Data points */}
              <circle
                cx={x}
                cy={pointsYLost[idx]}
                r={isHovered ? 5.5 : 3.5}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={isHovered ? 2 : 1}
                style={{ transition: "r 0.1s, stroke-width 0.1s" }}
              />
              <circle
                cx={x}
                cy={pointsYFound[idx]}
                r={isHovered ? 5.5 : 3.5}
                fill="#10b981"
                stroke="#fff"
                strokeWidth={isHovered ? 2 : 1}
                style={{ transition: "r 0.1s, stroke-width 0.1s" }}
              />

              {/* X Axis Labels */}
              <text
                x={x}
                y={height - paddingY + 15}
                fill="#64748b"
                fontSize="9"
                fontWeight={isHovered ? "bold" : "normal"}
                textAnchor="middle"
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div 
          className="card shadow border-0 p-2 text-start position-absolute rounded-3"
          style={{
            top: "-15px",
            left: `${pointsX[hoveredIdx] + 15}px`,
            transform: hoveredIdx > 3 ? "translateX(-115%)" : "none",
            zIndex: 10,
            fontSize: "11px",
            minWidth: "125px",
            background: "rgba(255, 255, 255, 0.98)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            backdropFilter: "blur(4px)"
          }}
        >
          <div className="fw-bold mb-1 border-bottom pb-1 text-dark" style={{ fontSize: "10.5px" }}>
            {weeklyTrend[hoveredIdx].date} ({weeklyTrend[hoveredIdx].day})
          </div>
          <div className="d-flex align-items-center justify-content-between gap-3 text-danger">
            <span style={{ fontSize: "10px" }}><span className="rounded-circle d-inline-block me-1" style={{ width: "6px", height: "6px", backgroundColor: "#ef4444" }}></span>Barang Hilang:</span>
            <span className="fw-bold">{weeklyTrend[hoveredIdx].lost}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between gap-3 text-success">
            <span style={{ fontSize: "10px" }}><span className="rounded-circle d-inline-block me-1" style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }}></span>Barang Temuan:</span>
            <span className="fw-bold">{weeklyTrend[hoveredIdx].found}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
function Dashboard({ lostUsers, foundUsers }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Normal Dashboard state ---
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalClaims: 0
  });
  const [loading, setLoading] = useState(true);

  // --- Admin Specific Dashboard state ---
  const [adminStats, setAdminStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalClaims: 0,
    pendingClaimsCount: 0,
    successRate: 0,
    statusCounts: { available: 0, returned: 0, pending: 0 },
    categoryData: [],
    weeklyTrend: []
  });
  const [adminLoading, setAdminLoading] = useState(true);

  // Process data helper for admin stats
  const processAdminData = (items, claims) => {
    const lostItems = items.filter(item => item.type === "lost");
    const foundItems = items.filter(item => item.type === "found");
    
    const available = items.filter(item => item.status === "available").length;
    const returned = items.filter(item => item.status === "returned" || item.status === "resolved").length;
    const pending = items.filter(item => item.status === "pending_verification").length;
    
    const total = available + returned + pending;
    const successRate = total > 0 ? Math.round((returned / total) * 100) : 0;
    
    const pendingClaimsCount = claims.filter(c => c.status === "pending").length;
    
    const categoryCounts = {};
    items.forEach(item => {
      const catName = item.category?.name || "Lainnya";
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    const daysName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const weeklyMap = {};
    
    // Last 7 days init
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toDateString();
      weeklyMap[dateString] = {
        day: daysName[d.getDay()],
        date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        lost: 0,
        found: 0
      };
    }
    
    items.forEach(item => {
      const itemDate = new Date(item.created_at).toDateString();
      if (weeklyMap[itemDate]) {
        if (item.type === "lost") {
          weeklyMap[itemDate].lost += 1;
        } else if (item.type === "found") {
          weeklyMap[itemDate].found += 1;
        }
      }
    });
    
    const weeklyTrend = Object.values(weeklyMap);
    
    return {
      totalLost: lostItems.length,
      totalFound: foundItems.length,
      totalClaims: claims.length,
      pendingClaimsCount,
      successRate,
      statusCounts: { available, returned, pending },
      categoryData,
      weeklyTrend
    };
  };

  // Fetch Normal stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const endpointPrefix = user ? "/api/items" : "/api/public/items";
        const lostRes = await apiRequest(`${endpointPrefix}?type=lost&size=1`);
        const foundRes = await apiRequest(`${endpointPrefix}?type=found&size=1`);
        
        let claimsCount = 0;
        if (user) {
          try {
            const claimsRes = await apiRequest("/api/claims?size=1");
            if (claimsRes.status && claimsRes.meta) {
              claimsCount = claimsRes.meta.total_items;
            }
          } catch (e) {
            console.error("Gagal mengambil statistik klaim:", e);
          }
        }

        setStats({
          totalLost: lostRes.status && lostRes.meta ? lostRes.meta.total_items : 0,
          totalFound: foundRes.status && foundRes.meta ? foundRes.meta.total_items : 0,
          totalClaims: claimsCount
        });
      } catch (error) {
        console.error("Gagal mengambil statistik dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  // Fetch Admin Stats
  useEffect(() => {
    if (user && user.role === "admin") {
      const fetchAdminStats = async () => {
        try {
          setAdminLoading(true);
          const itemsRes = await apiRequest("/api/items?size=100");
          const claimsRes = await apiRequest("/api/claims?size=100");
          
          if (itemsRes.status && claimsRes.status) {
            const processed = processAdminData(itemsRes.data, claimsRes.data);
            setAdminStats(processed);
          }
        } catch (error) {
          console.error("Gagal mengambil data statistik admin:", error);
        } finally {
          setAdminLoading(false);
        }
      };
      
      fetchAdminStats();
    }
  }, [user]);

  const totalReports = stats.totalLost + stats.totalFound;

  // --- RENDER 1: ADMIN SPECIFIC ANALYTICS DASHBOARD ---
  if (user && user.role === "admin") {
    return (
      <div className="container-fluid py-4" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <style>{`
          .admin-banner {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.3);
            position: relative;
            overflow: hidden;
          }
          .admin-card {
            border: 1px solid rgba(226, 232, 240, 0.7);
            border-radius: 16px;
            background-color: #ffffff;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .admin-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.08);
            border-color: rgba(99, 102, 241, 0.25);
          }
          .badge-alert {
            background-color: #fff1f2;
            color: #ef4444;
            border: 1px solid #fecdd3;
          }
          .glow-btn {
            background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
            transition: all 0.2s ease;
          }
          .glow-btn:hover {
            opacity: 0.92;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
          }
          .icon-pill {
            width: 46px;
            height: 46px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .transition-3 {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-shadow-sm:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px -3px rgba(0, 0, 0, 0.06);
          }
          .task-card-danger {
            border: 1px solid #fecdd3 !important;
            background-color: #fff1f2 !important;
            color: #991b1b;
          }
          .task-card-warning {
            border: 1px solid #fde68a !important;
            background-color: #fef9c3 !important;
            color: #854d0e;
          }
          .task-card-success {
            border: 1px solid #bbf7d0 !important;
            background-color: #f0fdf4 !important;
            color: #166534;
          }
        `}</style>

        {/* Elegant Page Header */}
        <div className="mb-4 text-start">
          <h2 className="fw-bold text-slate mb-1" style={{ letterSpacing: "-0.5px" }}>Analitik & Statistik Kampus</h2>
          <p className="text-secondary small m-0">Pantau tren pelaporan, verifikasi barang, dan persetujuan klaim secara terintegrasi.</p>
        </div>

        {adminLoading ? (
          <div className="d-flex justify-content-center my-5 py-5">
            <div className="spinner-border text-indigo" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Metrik Utama Grid */}
            <div className="row g-3 mb-4">
              {/* Lost Items */}
              <div className="col-md-3">
                <div className="admin-card p-3 h-100 d-flex align-items-center gap-3">
                  <div className="icon-pill bg-light-danger text-danger">
                    <i className="bi bi-search fs-4"></i>
                  </div>
                  <div className="text-start">
                    <h3 className="fw-bold m-0 text-slate">{adminStats.totalLost}</h3>
                    <p className="text-secondary small m-0 fw-semibold">Barang Hilang</p>
                  </div>
                </div>
              </div>

              {/* Found Items */}
              <div className="col-md-3">
                <div className="admin-card p-3 h-100 d-flex align-items-center gap-3">
                  <div className="icon-pill bg-light-success text-success">
                    <i className="bi bi-box-seam fs-4"></i>
                  </div>
                  <div className="text-start">
                    <h3 className="fw-bold m-0 text-slate">{adminStats.totalFound}</h3>
                    <p className="text-secondary small m-0 fw-semibold">Barang Temuan</p>
                  </div>
                </div>
              </div>

              {/* Total Claims */}
              <div className="col-md-3">
                <div className="admin-card p-3 h-100 d-flex align-items-center gap-3">
                  <div className="icon-pill bg-light-info text-info">
                    <i className="bi bi-shield-check fs-4"></i>
                  </div>
                  <div className="text-start">
                    <h3 className="fw-bold m-0 text-slate">{adminStats.totalClaims}</h3>
                    <p className="text-secondary small m-0 fw-semibold">Klaim Pengajuan</p>
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="col-md-3">
                <div className="admin-card p-3 h-100 d-flex align-items-center gap-3">
                  <div className="icon-pill bg-light-primary text-primary">
                    <i className="bi bi-trophy-fill fs-4"></i>
                  </div>
                  <div className="text-start">
                    <h3 className="fw-bold m-0 text-slate">{adminStats.successRate}%</h3>
                    <p className="text-secondary small m-0 fw-semibold">Rasio Selesai</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks and Alerts for Admin */}
            <div className="row g-3 mb-4 text-start">
              <div className="col-12">
                <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <h5 className="fw-bold text-slate m-0 d-flex align-items-center gap-2">
                      <i className="bi bi-shield-fill-exclamation text-primary"></i>
                      Pusat Tindakan Admin (Tugas Tertunda)
                    </h5>
                    {(adminStats.statusCounts.pending > 0 || adminStats.pendingClaimsCount > 0) && (
                      <span className="badge bg-danger rounded-pill px-2.5 py-1.5 fw-bold small">
                        {adminStats.statusCounts.pending + adminStats.pendingClaimsCount} Tindakan
                      </span>
                    )}
                  </div>
                  
                  <div className="d-flex flex-column gap-3">
                    {adminStats.statusCounts.pending > 0 && (
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-4 transition-3 hover-shadow-sm task-card-danger">
                        <div className="d-flex align-items-center gap-3">
                          <div className="icon-pill bg-white text-danger flex-shrink-0 shadow-sm">
                            <i className="bi bi-exclamation-octagon-fill fs-5"></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0.5" style={{ color: "#991b1b" }}>Verifikasi Laporan Barang Baru</h6>
                            <p className="small m-0 text-secondary">Terdapat <b>{adminStats.statusCounts.pending}</b> laporan barang temuan baru yang memerlukan persetujuan verifikasi agar tayang di feed publik.</p>
                          </div>
                        </div>
                        <button className="btn btn-danger btn-sm rounded-3 py-2 px-3 fw-bold shadow-sm d-flex align-items-center gap-1 flex-shrink-0" onClick={() => navigate("/admin?tab=items")}>
                          <i className="bi bi-check-circle"></i> Tinjau Laporan
                        </button>
                      </div>
                    )}
                    
                    {adminStats.pendingClaimsCount > 0 && (
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-4 transition-3 hover-shadow-sm task-card-warning">
                        <div className="d-flex align-items-center gap-3">
                          <div className="icon-pill bg-white text-warning flex-shrink-0 shadow-sm">
                            <i className="bi bi-clipboard2-check-fill fs-5"></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0.5" style={{ color: "#854d0e" }}>Persetujuan Klaim Kepemilikan</h6>
                            <p className="small m-0 text-secondary">Terdapat <b>{adminStats.pendingClaimsCount}</b> pengajuan klaim baru dari mahasiswa yang menunggu pemeriksaan bukti fisik.</p>
                          </div>
                        </div>
                        <button className="btn btn-warning btn-sm rounded-3 py-2 px-3 fw-bold text-dark shadow-sm d-flex align-items-center gap-1 flex-shrink-0" onClick={() => navigate("/admin?tab=claims")}>
                          <i className="bi bi-eye"></i> Tinjau Klaim
                        </button>
                      </div>
                    )}

                    {adminStats.statusCounts.pending === 0 && adminStats.pendingClaimsCount === 0 && (
                      <div className="d-flex align-items-center gap-3 p-4 rounded-4 task-card-success">
                        <div className="icon-pill bg-white text-success flex-shrink-0 shadow-sm">
                          <i className="bi bi-check-circle-fill fs-4"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0.5" style={{ color: "#166534" }}>Semua Tugas Selesai!</h6>
                          <p className="small m-0 text-secondary opacity-90">Luar biasa! Tidak ada laporan baru yang perlu diverifikasi atau klaim kepemilikan yang perlu diproses saat ini.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="row g-4 mb-4 text-start">
              {/* Tren Laporan Mingguan */}
              <div className="col-lg-8 col-md-12">
                <div className="card admin-card p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-slate m-0">Tren Laporan Mingguan</h5>
                      <p className="text-secondary small m-0">Sebaran laporan hilang vs temuan selama 7 hari terakhir</p>
                    </div>
                    <div className="d-flex gap-2">
                      <span className="badge rounded-pill bg-danger-subtle text-danger px-2.5 py-1.5 small fw-semibold" style={{ fontSize: "10px" }}>
                        ● Hilang
                      </span>
                      <span className="badge rounded-pill bg-success-subtle text-success px-2.5 py-1.5 small fw-semibold" style={{ fontSize: "10px" }}>
                        ● Temuan
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-center">
                    <WeeklyTrendChart weeklyTrend={adminStats.weeklyTrend} />
                  </div>
                </div>
              </div>

              {/* Status Laporan */}
              <div className="col-lg-4 col-md-12">
                <div className="card admin-card p-4 h-100">
                  <div className="mb-3">
                    <h5 className="fw-bold text-slate m-0">Status Sebaran Barang</h5>
                    <p className="text-secondary small m-0">Presentase barang berdasarkan status verifikasi</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-center h-100 mt-2">
                    <DonutChart statusCounts={adminStats.statusCounts} />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Statistics */}
            <div className="row g-4 text-start">
              <div className="col-12">
                <div className="card admin-card p-4">
                  <h5 className="fw-bold text-slate mb-3">Kategori Paling Sering Dilaporkan</h5>
                  <div className="row g-3">
                    {adminStats.categoryData.length > 0 ? (
                      adminStats.categoryData.map((cat, idx) => {
                        const maxVal = Math.max(...adminStats.categoryData.map(c => c.value), 1);
                        const percent = Math.round((cat.value / maxVal) * 100);
                        return (
                          <div className="col-md-6" key={idx}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold text-slate small">{cat.name}</span>
                              <span className="badge bg-light text-dark fw-bold border" style={{ fontSize: "11px" }}>{cat.value} Barang</span>
                            </div>
                            <div className="progress rounded-pill" style={{ height: "8px" }}>
                              <div 
                                className="progress-bar rounded-pill bg-primary" 
                                role="progressbar" 
                                style={{ width: `${percent}%`, transition: "width 0.8s ease-in-out" }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12 text-center py-4 text-secondary">
                        <p className="small m-0">Belum ada data kategori barang.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- RENDER 2: REGULAR CAMPUS USER STATS DASHBOARD ---
  return (
    <div className="container mt-2">
      {/* Welcome banner */}
      <div className="welcome-banner p-5 mb-5 rounded-4 shadow-sm text-start text-white position-relative overflow-hidden bg-gradient-primary">
        <div className="welcome-content position-relative z-index-2">
          <h1 className="fw-bold mb-2">Halo, {user ? user.name : "Pengguna"}!</h1>
          <p className="opacity-75 lead mb-0">Selamat datang di Portal Lost & Found Kampus. Laporkan barang hilang atau barang temuan Anda secara praktis.</p>
        </div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
      </div>

      <h3 className="fw-bold text-slate mb-4">Statistik Laporan</h3>

      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4 mb-5">
          {/* Card Barang Hilang */}
          <div className={user ? "col-md-4" : "col-md-6"}>
            <div className="dashboard-card p-4 rounded-4 shadow-sm border-0 h-100 bg-white text-center position-relative">
              <div className="card-icon-wrapper rounded-circle mx-auto mb-3 bg-light-danger text-danger d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-search fs-3"></i>
              </div>
              <h2 className="fw-bold text-danger display-5 m-0">{stats.totalLost}</h2>
              <p className="text-secondary fw-semibold mb-0 mt-2">Laporan Barang Hilang</p>
            </div>
          </div>

          {/* Card Barang Temuan */}
          <div className={user ? "col-md-4" : "col-md-6"}>
            <div className="dashboard-card p-4 rounded-4 shadow-sm border-0 h-100 bg-white text-center position-relative">
              <div className="card-icon-wrapper rounded-circle mx-auto mb-3 bg-light-success text-success d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-box-seam fs-3"></i>
              </div>
              <h2 className="fw-bold text-success display-5 m-0">{stats.totalFound}</h2>
              <p className="text-secondary fw-semibold mb-0 mt-2">Laporan Barang Temuan</p>
            </div>
          </div>

          {/* Card Pengajuan Klaim */}
          {user && (
            <div className="col-md-4">
              <div className="dashboard-card p-4 rounded-4 shadow-sm border-0 h-100 bg-white text-center position-relative">
                <div className="card-icon-wrapper rounded-circle mx-auto mb-3 bg-light-info text-info d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                  <i className="bi bi-shield-check fs-3"></i>
                </div>
                <h2 className="fw-bold text-info display-5 m-0">{stats.totalClaims}</h2>
                <p className="text-secondary fw-semibold mb-0 mt-2">Pengajuan Klaim</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aktivitas Terbaru */}
      <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
        <h4 className="fw-bold text-slate mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-activity text-primary"></i>
          Aktivitas Laporan Terbaru
        </h4>

        <div className="activities-list d-flex flex-column gap-3">
          {/* Barang Hilang Terbaru */}
          {lostUsers.slice(0, 3).map((item) => (
            <div key={`lost-${item.id}`} className="activity-item d-flex align-items-center justify-content-between p-3 rounded-3 border-start border-danger border-4 bg-light-danger-subtle">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-exclamation-circle-fill text-danger fs-4"></i>
                <div className="text-start">
                  <h6 className="m-0 fw-bold">{item.title}</h6>
                  <small className="text-secondary">Dilaporkan hilang di <b>{item.location}</b> oleh {item.user?.name}</small>
                </div>
              </div>
              <span className="badge bg-danger rounded-pill px-3 py-2 text-capitalize">{item.status.replace(/_/g, ' ')}</span>
            </div>
          ))}

          {/* Barang Temuan Terbaru */}
          {foundUsers.slice(0, 3).map((item) => (
            <div key={`found-${item.id}`} className="activity-item d-flex align-items-center justify-content-between p-3 rounded-3 border-start border-success border-4 bg-light-success-subtle">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-check-circle-fill text-success fs-4"></i>
                <div className="text-start">
                  <h6 className="m-0 fw-bold">{item.title}</h6>
                  <small className="text-secondary">Ditemukan di <b>{item.location}</b> oleh {item.user?.name}</small>
                </div>
              </div>
              <span className="badge bg-success rounded-pill px-3 py-2 text-capitalize">{item.status.replace(/_/g, ' ')}</span>
            </div>
          ))}

          {totalReports === 0 && !loading && (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-folder2-open display-4 opacity-50 mb-3 d-block"></i>
              <p className="fw-semibold">Belum ada aktivitas laporan terbaru.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;