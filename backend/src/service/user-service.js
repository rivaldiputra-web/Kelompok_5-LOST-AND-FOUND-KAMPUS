import { prismaClient } from "../application/database.js";
import { validate } from "../validation/validation.js"; 
import { 
    registerUserValidation, 
    loginUserValidation, 
    getUserValidation, 
    updateUserValidation, 
    createUserByAdminValidation,
    updateUserByAdminValidation
} from "../validation/user-validation.js";
import bcrypt from "bcrypt";
import { ResponseError } from "../error/response-error.js"; 
import jwt from "jsonwebtoken";

const register = async (request) => {
    const user = validate(registerUserValidation, request);

    // Cek apakah nim_nip atau email sudah terdaftar
    const countUser = await prismaClient.user.count({
        where: {
            OR: [
                { nim_nip: user.nim_nip },
                { email: user.email }
            ]
        }
    });

    if (countUser === 1) {
        throw new ResponseError(400, "NIM/NIP atau Email sudah terdaftar");
    }

    user.password = await bcrypt.hash(user.password, 10);

    return prismaClient.user.create({
        data: user,
        select: {
            id: true,
            nim_nip: true,
            name: true,
            email: true,
            role: true
        }
    });
};

const login = async (request) => {
    const loginRequest = validate(loginUserValidation, request);

    const user = await prismaClient.user.findFirst({
        where: {
            OR: [
                { email: loginRequest.email },
                { nim_nip: loginRequest.email }
            ]
        }
    });

    if (!user) throw new ResponseError(401, "Email/NIM atau password salah");

    const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);
    if (!isPasswordValid) throw new ResponseError(401, "Email/NIM atau password salah");

    // Buat Payload (Data yang disisipkan ke token)
    // JANGAN masukkan password atau data sensitif di sini!
    const payload = {
        userId: user.id.toString(), // Convert BigInt
        role: user.role
    };

    // Generate Access Token 15 menit
    const accessToken = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' } 
    );

    // Generate Refresh Token 7 hari)
    const refreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Simpan Refresh Token ke Database (Untuk keperluan validasi dan Logout)
    await prismaClient.user.update({
        where: { id: user.id },
        data: { refresh_token: refreshToken }
    });

    // Kembalikan kedua token dan data user ke Client
    // Biasanya Refresh Token diletakkan di HTTP-Only Cookie untuk keamanan ekstra (XSS),
    // tapi mengembalikannya di response body juga umum dilakukan untuk SPA/Mobile App.
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: {
            nim_nip: user.nim_nip,
            name: user.name
        }
    };
};

const get = async (userId) => {
    userId = validate(getUserValidation, userId);

    const user = await prismaClient.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            nim_nip: true,
            name: true,
            email: true,
            phone_number: true,
            role: true
        }
    });

    if (!user) {
        throw new ResponseError(404, "User tidak ditemukan");
    }

    return user;
};

const update = async (request) => {
    const user = validate(updateUserValidation, request);

    // Cek apakah user ada
    const totalUserInDatabase = await prismaClient.user.count({
        where: {
            id: user.id
        }
    });

    if (totalUserInDatabase !== 1) {
        throw new ResponseError(404, "User tidak ditemukan");
    }

    // Jika update password, hash ulang
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }

    return prismaClient.user.update({
        where: {
            id: user.id
        },
        data: user,
        select: {
            id: true,
            nim_nip: true,
            name: true,
            email: true,
            phone_number: true
        }
    });
};

const refreshToken = async (tokenData) => {
    if (!tokenData || !tokenData.refreshToken) {
        throw new ResponseError(401, "Refresh token tidak tersedia");
    }

    const incomingToken = tokenData.refreshToken;

    // Cari user di DB yang punya refresh token ini
    const user = await prismaClient.user.findFirst({
        where: { refresh_token: incomingToken }
    });

    if (!user) {
        throw new ResponseError(403, "Refresh token tidak valid atau sudah dibatalkan (Forbidden)");
    }

    // Verifikasi Token menggunakan Secret Key Refresh Token
    try {
        const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Jika valid, buat Access Token BARU
        const payload = {
            userId: user.id.toString(),
            role: user.role
        };

        const newAccessToken = jwt.sign(
            payload, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: '15m' }
        );

        return {
            accessToken: newAccessToken
        };

    } catch (error) {
        // Jika Refresh Token expired atau rusak
        throw new ResponseError(403, "Refresh token kadaluarsa atau tidak valid, silakan login ulang");
    }
};

const logout = async (userId) => {
    // Hapus refresh token dari database agar tidak bisa digunakan lagi
    return prismaClient.user.update({
        where: { id: parseInt(userId, 10) },
        data: { refresh_token: null },
        select: { id: true }
    });
};

// hanya admin
const getAllUsers = async () => {
    return prismaClient.user.findMany({
        select: {
            id: true,
            nim_nip: true,
            name: true,
            email: true,
            role: true,
            phone_number: true,
            created_at: true
        }
    });
};

const createUser = async (request) => {
    const user = validate(createUserByAdminValidation, request);

    const countUser = await prismaClient.user.count({
        where: { OR: [{ nim_nip: user.nim_nip }, { email: user.email }] }
    });

    if (countUser === 1) {
        throw new ResponseError(400, "NIM/NIP atau Email sudah terdaftar");
    }

    user.password = await bcrypt.hash(user.password, 10);
    user.role = request.role || 'user'; 

    return prismaClient.user.create({
        data: user,
        select: { id: true, name: true, role: true }
    });
};

const updateUser = async (userId, request) => {
    const userUpdateData = validate(updateUserByAdminValidation, request);

    const checkUser = await prismaClient.user.findUnique({
        where: { id: userId }
    });

    if (!checkUser) throw new ResponseError(404, "User tidak ditemukan");

    if (userUpdateData.password) {
        userUpdateData.password = await bcrypt.hash(userUpdateData.password, 10);
    }

    // Admin bisa merubah role user lain
    if (request.role) {
        userUpdateData.role = request.role;
    }

    return prismaClient.user.update({
        where: { id: userId },
        data: userUpdateData,
        select: { id: true, name: true, role: true }
    });
};

const deleteUser = async (userId) => {
    const checkUser = await prismaClient.user.findUnique({
        where: { id: userId }
    });

    if (!checkUser) throw new ResponseError(404, "User tidak ditemukan");

    return prismaClient.user.delete({
        where: { id: userId }
    });
};

export default {
    register,
    login,
    get,
    update,
    refreshToken,
    logout,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
}