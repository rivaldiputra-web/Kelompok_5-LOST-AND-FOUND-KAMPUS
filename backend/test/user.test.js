import supertest from "supertest";
import { web } from "../src/application/web.js";
import { logger } from "../src/application/logging.js";
import {
    createTestUser, getTestUser, removeTestUser,
    createTestAdmin, removeTestAdmin
} from "./test-util.js";
import bcrypt from "bcrypt";
import { prismaClient } from "../src/application/database.js";

// ========================================================
// TEST: REGISTER USER
// ========================================================
describe('POST /api/auth/register', function () {
    afterEach(async () => {
        await removeTestUser();
    });

    it('should can register new user', async () => {
        const result = await supertest(web)
            .post('/api/auth/register') 
            .send({
                nim_nip: '1234567890',
                name: 'Test User',
                email: 'test@kampus.edu',
                password: 'rahasia123'
            });

        expect(result.status).toBe(201); 
        expect(result.body.data.nim_nip).toBe("1234567890");
        expect(result.body.data.email).toBe("test@kampus.edu");
        expect(result.body.data.password).toBeUndefined(); // Pastikan password tidak dikembalikan di response
    });

    it('should reject if email already registered', async () => {
        await createTestUser(); // Bikin user pertama kali di background

        const result = await supertest(web)
            .post('/api/auth/register')
            .send({
                nim_nip: '0987654321', // NIM beda
                name: 'Test Beda',
                email: 'test@kampus.edu', // Tapi email sama
                password: 'rahasia123'
            });

        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined();
    });
});

// ========================================================
// TEST: LOGIN USER
// ========================================================
describe('POST /api/auth/login', function () {
    beforeEach(async () => {
        await createTestUser();
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can login and get JWT tokens', async () => {
        const result = await supertest(web)
            .post('/api/auth/login')
            .send({
                email: "test@kampus.edu",
                password: "rahasia123"
            });
        expect(result.status).toBe(200);
        expect(result.body.accessToken).toBeDefined(); 
        expect(result.body.data.name).toBe("Test User");
    });

    it('should reject login if password is wrong', async () => {
        const result = await supertest(web)
            .post('/api/auth/login')
            .send({
                email: "test@kampus.edu",
                password: "salahpassword"
            });

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });
});

// ========================================================
// TEST: GET CURRENT USER
// ========================================================
describe('GET /api/users/current', function () {
    let token = "";

    beforeEach(async () => {
        await createTestUser();
        
        // login dulu di background untuk dapat JWT Token
        const loginResponse = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "test@kampus.edu", password: "rahasia123" });
        token = loginResponse.body.accessToken; 
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can get current user with valid token', async () => {
        const result = await supertest(web)
            .get('/api/users/current')
            .set('Authorization', `Bearer ${token}`); // Gunakan Bearer Token

        expect(result.status).toBe(200);
        expect(result.body.data.email).toBe('test@kampus.edu');
        expect(result.body.data.nim_nip).toBe('1234567890');
    });

    it('should reject if token is invalid', async () => {
        const result = await supertest(web)
            .get('/api/users/current')
            .set('Authorization', 'Bearer tokensalah123');

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });
});

// ========================================================
// TEST: UPDATE CURRENT USER
// ========================================================
describe('PATCH /api/users/current', function () {
    let token = "";

    beforeEach(async () => {
        await createTestUser();
        const loginResponse = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "test@kampus.edu", password: "rahasia123" });
        token = loginResponse.body.accessToken;
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can update user name and password', async () => {
        const result = await supertest(web)
            .patch("/api/users/current")
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: "Eko Update",
                password: "rahasialagi"
            });

        expect(result.status).toBe(200);
        expect(result.body.data.name).toBe("Eko Update");

        // Verifikasi ke database apakah password benar-benar terganti
        const userInDb = await getTestUser();
        const isPasswordMatch = await bcrypt.compare("rahasialagi", userInDb.password);
        expect(isPasswordMatch).toBe(true);
    });
});

// ========================================================
// TEST: LOGOUT
// ========================================================
describe('DELETE /api/users/logout', function () {
    let token = "";

    beforeEach(async () => {
        await createTestUser();
        const loginResponse = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "test@kampus.edu", password: "rahasia123" });
        token = loginResponse.body.accessToken;
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can logout and remove refresh token from DB', async () => {
        const result = await supertest(web)
            .delete('/api/users/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(result.status).toBe(200);

        const userInDb = await getTestUser();
        expect(userInDb.refresh_token).toBeNull();
    });
});

// ========================================================
// TEST: REFRESH TOKEN (POST /api/auth/refresh)
// ========================================================
describe('POST /api/auth/refresh', function () {
    beforeEach(async () => {
        await createTestUser();
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should return new access token with valid refresh token cookie', async () => {
        // Login dan tangkap cookie Set-Cookie dari response
        const loginResult = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "test@kampus.edu", password: "rahasia123" });

        const cookies = loginResult.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const result = await supertest(web)
            .post('/api/auth/refresh')
            .set('Cookie', cookies);

        expect(result.status).toBe(200);
        expect(result.body.data.accessToken).toBeDefined();
    });

    it('should reject if refresh token cookie is missing', async () => {
        const result = await supertest(web)
            .post('/api/auth/refresh');

        expect(result.status).toBe(401);
    });
});

// ========================================================
// TEST: ADMIN USER MANAGEMENT
// ========================================================
describe('Admin User Management', function () {
    let adminToken = "";
    let targetUserId;

    beforeEach(async () => {
        await removeTestAdmin();
        await removeTestUser();

        await createTestUser();
        await createTestAdmin();

        const adminLogin = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "admin@kampus.edu", password: "rahasia123" });
        adminToken = adminLogin.body.accessToken;

        const testUser = await getTestUser();
        targetUserId = Number(testUser.id);
    });

    afterEach(async () => {
        await removeTestAdmin();
        await removeTestUser();
    });

    // GET /api/users
    describe('GET /api/users', () => {
        it('should allow admin to get all users', async () => {
            const result = await supertest(web)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data).toBeInstanceOf(Array);
            expect(result.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should block regular user from getting all users', async () => {
            const userLogin = await supertest(web)
                .post('/api/auth/login')
                .send({ email: "test@kampus.edu", password: "rahasia123" });
            const userToken = userLogin.body.accessToken;

            const result = await supertest(web)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(403);
        });
    });

    // POST /api/users (admin create user)
    describe('POST /api/users', () => {
        afterEach(async () => {
            await prismaClient.user.deleteMany({
                where: { email: "baru@kampus.edu" }
            });
        });

        it('should allow admin to create new user with role', async () => {
            const result = await supertest(web)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nim_nip: "NIM2026NEW",
                    name: "User Baru Admin",
                    email: "baru@kampus.edu",
                    password: "rahasia123",
                    role: "user"
                });

            expect(result.status).toBe(201);
            expect(result.body.data.name).toBe("User Baru Admin");
            expect(result.body.data.role).toBe("user");
        });

        it('should reject if email is already registered', async () => {
            const result = await supertest(web)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nim_nip: "NIM2026DUP",
                    name: "Duplikat User",
                    email: "test@kampus.edu", // Email sudah ada
                    password: "rahasia123"
                });

            expect(result.status).toBe(400);
        });
    });

    // PATCH /api/users/:userId (admin update user)
    describe('PATCH /api/users/:userId', () => {
        it('should allow admin to update user name', async () => {
            const result = await supertest(web)
                .patch(`/api/users/${targetUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: "Nama Diubah Admin" });

            expect(result.status).toBe(200);
            expect(result.body.data.name).toBe("Nama Diubah Admin");
        });

        it('should allow admin to change user role', async () => {
            const result = await supertest(web)
                .patch(`/api/users/${targetUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: "admin" });

            expect(result.status).toBe(200);
            expect(result.body.data.role).toBe("admin");
        });

        it('should return 404 if user does not exist', async () => {
            const result = await supertest(web)
                .patch('/api/users/9999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: "User Hantu" });

            expect(result.status).toBe(404);
        });
    });

    // DELETE /api/users/:userId (admin delete user)
    describe('DELETE /api/users/:userId', () => {
        it('should allow admin to delete a user', async () => {
            const result = await supertest(web)
                .delete(`/api/users/${targetUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);

            const inDb = await prismaClient.user.findUnique({
                where: { id: targetUserId }
            });
            expect(inDb).toBeNull();
        });

        it('should return 404 if user does not exist', async () => {
            const result = await supertest(web)
                .delete('/api/users/9999999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(404);
        });
    });
});