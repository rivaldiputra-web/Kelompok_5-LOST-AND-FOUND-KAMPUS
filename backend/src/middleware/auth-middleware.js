import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    // Ambil token dari header Authorization
    const authHeader = req.get("Authorization");

    // Jika header tidak ada tolak request
    if (!authHeader) {
        return res.status(401).json({
            errors: "Unauthorized: Token tidak disediakan"
        }).end();
    }

    // Format header "Bearer <token_string>"
    // spasi dan ambil tokennya saja
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            errors: "Unauthorized: Format token salah"
        }).end();
    }

    try {
        // Verifikasi token menggunakan Secret Key
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Jika valid, sisipkan payload token ke dalam object request (req)
        req.user = {
            id: decoded.userId, 
            role: decoded.role
        };

        next();
    } catch (error) {
        // Jika token expired (kadaluarsa) atau dimanipulasi (invalid signature)
        // frontend harus memanggil endpoint /refresh-token
        return res.status(401).json({
            errors: "Unauthorized: Token kadaluarsa atau tidak valid"
        }).end();
    }
};

export const adminMiddleware = async (req, res, next) => {
    
    if (!req.user) {
        return res.status(401).json({
            errors: "Unauthorized: Anda belum login"
        }).end();
    }

    // Cek apakah role-nya admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            errors: "Forbidden: Anda tidak memiliki akses (Bukan Admin)"
        }).end();
    }

    next(); 
};
