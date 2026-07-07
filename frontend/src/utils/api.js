const BASE_URL = "http://localhost:3000";

let accessToken = localStorage.getItem("accessToken") || null;
let currentUser = null;
let onLogoutCallback = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
    accessToken = token;
    if (token) {
        localStorage.setItem("accessToken", token);
    } else {
        localStorage.removeItem("accessToken");
    }
};

export const getCurrentUser = () => currentUser;
export const setCurrentUser = (user) => {
    currentUser = user;
};

export const setOnLogout = (callback) => {
    onLogoutCallback = callback;
};

// Wrapper untuk Fetch API yang menangani otentikasi otomatis dan token refresh
export const apiRequest = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    
    options.headers = options.headers || {};
    if (accessToken) {
        options.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    if (!(options.body instanceof FormData) && typeof options.body === "object") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.body);
    }
    
    // Hapus header Content-Type jika body adalah FormData agar browser men-set boundaries otomatis
    if (options.body instanceof FormData) {
        delete options.headers["Content-Type"];
    }

    options.credentials = "include"; // Sangat penting agar HttpOnly cookie dapat dikirimkan/diterima

    let response = await fetch(url, options);

    // Jika Access Token expired (401) dan bukan pada halaman login/register
    if (response.status === 401 && endpoint !== "/api/auth/login" && endpoint !== "/api/auth/register") {
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
            // Coba ulangi request asli dengan Token Baru
            options.headers["Authorization"] = `Bearer ${accessToken}`;
            response = await fetch(url, options);
        } else {
            // Jika refresh token kadaluarsa atau dibatalkan di DB, lakukan logout
            handleLogout();
            throw new Error("Sesi login Anda berakhir. Silakan masuk kembali.");
        }
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors || data.message || "Gagal menghubungi server");
    }
    return data;
};

const attemptTokenRefresh = async () => {
    try {
        const url = `${BASE_URL}/api/auth/refresh`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status && result.data && result.data.accessToken) {
                setAccessToken(result.data.accessToken);
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Gagal memperbarui token (CORS/Network):", e);
        return false;
    }
};

export const handleLogout = async () => {
    try {
        if (accessToken) {
            await fetch(`${BASE_URL}/api/users/logout`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                credentials: "include"
            });
        }
    } catch (e) {
        console.error("Gagal memanggil API logout di server:", e);
    } finally {
        setAccessToken(null);
        setCurrentUser(null);
        if (onLogoutCallback) {
            onLogoutCallback();
        } else {
            window.location.reload();
        }
    }
};
