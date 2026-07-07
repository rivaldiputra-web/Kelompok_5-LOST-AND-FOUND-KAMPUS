import userService from "../service/user-service.js";

const register = async (req, res, next) => {
    try {
        const result = await userService.register(req.body);
        res.status(201).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e); 
    }
};

const login = async (req, res, next) => {
    try {
        const result = await userService.login(req.body);
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Melindungi dari CSRF namun tetap mengizinkan cookie terkirim saat navigasi link
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Hari
        });

        res.status(200).json({
            status: true,
            accessToken: result.accessToken,
            data: result.user
        });
    } catch (e) {
        next(e);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        // Ambil token langsung dari Cookie yang dikirim oleh browser
       const tokenDariCookie = req.cookies.refreshToken;

       const result = await userService.refreshToken({ 
            refreshToken: tokenDariCookie 
        });
        
        res.status(200).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const get = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        const result = await userService.get(userId);
        
        res.status(200).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.user.id; // Dari Middleware Autentikasi
        // Gabungkan ID dari token ke dalam request body agar Service tahu user mana yang di-update
        const request = req.body;
        request.id = userId; 

        const result = await userService.update(request);
        
        res.status(200).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const logout = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        await userService.logout(userId);
        
        res.clearCookie('refreshToken'); 

        res.status(200).json({
            status: true,
            data: "Logout berhasil"
        });
    } catch (e) {
        next(e);
    }
};


const getAllUsers = async (req, res, next) => {
    try {
        const result = await userService.getAllUsers();
        res.status(200).json({ status: true, data: result });
    } catch (e) {
        next(e);
    }
};

const createUser = async (req, res, next) => {
    try {
        const result = await userService.createUser(req.body);
        res.status(201).json({ status: true, data: result });
    } catch (e) {
        next(e);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId); 
        const result = await userService.updateUser(userId, req.body);
        res.status(200).json({ status: true, data: result });
    } catch (e) {
        next(e);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        await userService.deleteUser(userId);
        res.status(200).json({ status: true, data: "User berhasil dihapus" });
    } catch (e) {
        next(e);
    }
};
export default {
    register,
    login,
    refreshToken,
    get,
    update,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    logout
};