import supertest from "supertest";
import { web } from "../src/application/web.js";
import { prismaClient } from "../src/application/database.js";
import { 
    createTestAdmin, 
    removeTestAdmin,
    createTestCategory, 
    removeTestCategory 
} from "./test-util.js";

describe('Category API Tests', () => {
    let adminToken = "";

    //  Eksekusi sebelum setiap blok tes
    beforeEach(async () => {
        // Bersihkan data sebelum mulai
        await removeTestCategory();
        // Hapus juga kategori khusus yang akan kita buat di dalam tes POST
        await prismaClient.category.deleteMany({ where: { name: "Alat Tulis" } });
        await removeTestAdmin();

        // Buat akun admin untuk testing
        await createTestAdmin();

        // Login untuk mendapatkan token
        const adminLogin = await supertest(web).post('/api/auth/login').send({
            email: "admin@kampus.edu",
            password: "rahasia123"
        });
        adminToken = adminLogin.body.accessToken;
    });

    // TEARDOWN: Eksekusi setelah setiap blok tes selesai
    afterEach(async () => {
        await removeTestCategory();
        await prismaClient.category.deleteMany({ where: { name: "Alat Tulis" } });
        await removeTestAdmin();
    });

    // ========================================================
    // TEST: CREATE CATEGORY (POST /api/categories)
    // ========================================================
    describe('POST /api/categories', () => {
        it('should can create new category', async () => {
            const result = await supertest(web)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: "Alat Tulis"
                });

            expect(result.status).toBe(201); 
            expect(result.body.data.name).toBe("Alat Tulis");
            expect(result.body.data.id).toBeDefined();
        });

        it('should reject if category name already exists', async () => {
            // Buat kategori pertama
            await supertest(web)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: "Alat Tulis" });

            // Coba buat kategori kedua dengan nama yang persis sama
            const result = await supertest(web)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: "Alat Tulis" });

            expect(result.status).toBe(400);
            expect(result.body.errors).toBeDefined();
        });

        it('should reject if request is invalid', async () => {
            const result = await supertest(web)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: "" }); // Nama kosong

            expect(result.status).toBe(400);
        });
    });

    // ========================================================
    // TEST: GET SINGLE CATEGORY (GET /api/categories/:id)
    // ========================================================
    describe('GET /api/categories/:id', () => {
        beforeEach(async () => {
            // Buat 1 kategori menggunakan fungsi utility (ID: 9999, Name: "Kategori Test")
            await createTestCategory();
        });

        it('should can get category by id', async () => {
            const result = await supertest(web)
                .get('/api/categories/9999')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(result.status).toBe(200);
            expect(result.body.data.name).toBe("Kategori Test");
        });

        it('should return 404 if category id is not found', async () => {
            const result = await supertest(web)
                .get('/api/categories/888888') // ID Ngasal
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(result.status).toBe(404);
        });
    });

    // ========================================================
    // TEST: UPDATE CATEGORY (PATCH /api/categories/:id)
    // ========================================================
    describe('PATCH /api/categories/:id', () => {
        beforeEach(async () => {
            await createTestCategory();
        });

        it('should can update category name', async () => {
            const result = await supertest(web)
                .patch('/api/categories/9999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: "Kategori Diupdate"
                });

            expect(result.status).toBe(200);
            expect(result.body.data.name).toBe("Kategori Diupdate");

            // Verifikasi langsung ke database
            const categoryInDb = await prismaClient.category.findUnique({
                where: { id: 9999 }
            });
            expect(categoryInDb.name).toBe("Kategori Diupdate");
        });

        it('should reject update if category id is not found', async () => {
            const result = await supertest(web)
                .patch('/api/categories/888888')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: "Kategori Hantu"
                });

            expect(result.status).toBe(404);
        });
    });

    // ========================================================
    // TEST: GET ALL CATEGORIES (GET /api/categories)
    // ========================================================
    describe('GET /api/categories', () => {
        beforeEach(async () => {
            await createTestCategory();
        });

        it('should can get all categories', async () => {
            const result = await supertest(web)
                .get('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data).toBeInstanceOf(Array);
            expect(result.body.data.length).toBeGreaterThan(0);
        });
    });
});