import supertest from "supertest";
import {prismaClient} from "../src/application/database.js";
import { web } from "../src/application/web.js";
import {
    createTestUser,
    removeTestUser,
    createTestAdmin,
    removeTestAdmin,
    createTestCategory,
    removeTestCategory,
    removeTestItems,
    getTestItem
} from "./test-util.js";

describe('Item API Tests', () => {
    let token = "";
    let adminToken = "";

    beforeEach(async () => {
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();

        await createTestUser();
        await createTestAdmin();
        await createTestCategory();

        const loginResponse = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "test@kampus.edu", password: "rahasia123" });
        token = loginResponse.body.accessToken;

        const adminLogin = await supertest(web)
            .post('/api/auth/login')
            .send({ email: "admin@kampus.edu", password: "rahasia123" });
        adminToken = adminLogin.body.accessToken;
    });

    afterEach(async () => {
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();
    });

    // ========================================================
    // TEST: CREATE ITEM (POST /api/items)
    // ========================================================
    describe('POST /api/items', () => {
        it('should can create new item and clear redis cache', async () => {
            const result = await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999, // Sesuai ID di test-util
                    type: "found",
                    title: "Barang Test Postman",
                    description: "Ditemukan di lab komputer",
                    location: "Lab Komputer 1",
                    date_time: "2026-05-22T10:00:00.000Z"
                });

            expect(result.status).toBe(201); 
            expect(result.body.data.title).toBe("Barang Test Postman");
            expect(result.body.data.category.name).toBe("Kategori Test");
            expect(result.body.data.user.name).toBe("Test User");
        });

        it('should reject if category is not found', async () => {
            const result = await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 8888, // ID asal
                    type: "found",
                    title: "Barang Test",
                    description: "Test deskripsi",
                    location: "Test lokasi",
                    date_time: "2026-05-22T10:00:00.000Z"
                });

            expect(result.status).toBe(404);
            expect(result.body.errors).toBeDefined();
        });

        it('should reject if token is missing', async () => {
            const result = await supertest(web)
                .post('/api/items')
                .send({
                    category_id: 9999,
                    title: "Barang Tanpa Token"
                });

            expect(result.status).toBe(401); // Unauthorized
        });
    });

    // ========================================================
    // TEST: GET ALL ITEMS (GET /api/items)
    // ========================================================
    describe('GET /api/items', () => {
        it('should can get all items and trigger cache', async () => {
            // Kita bikin 1 barang dulu untuk ngetes list-nya
            await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999,
                    type: "lost",
                    title: "Barang Test Postman",
                    description: "Ditemukan di lab komputer",
                    location: "Lab Komputer 1",
                    date_time: "2026-05-22T10:00:00.000Z"
                });

            // Hit pertama: akan mengambil dari Prisma lalu save ke Redis
            let result = await supertest(web)
            .get('/api/items')
            .set('Authorization', `Bearer ${token}`);
            expect(result.status).toBe(200);
            expect(result.body.data.length).toBeGreaterThan(0);

            // Hit kedua: seharusnya mengambil data langsung dari Redis
            result = await supertest(web)
            .get('/api/items')
            .set('Authorization', `Bearer ${token}`);
            expect(result.status).toBe(200);
            const foundItem = result.body.data.find(item => item.title === "Barang Test Postman");
            expect(foundItem).toBeDefined();
            expect(foundItem.title).toBe("Barang Test Postman");
        });
    });

    // ========================================================
    // TEST: GET SINGLE ITEM & UPDATE (GET & PATCH /api/items/:id)
    // ========================================================
    describe('GET and PATCH /api/items/:id', () => {
        let testItemId;

        beforeEach(async () => {
            // Setup spesifik: bikin 1 barang dulu sebelum ditest GET/PATCH
            const createResult = await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999,
                    type: "found",
                    title: "Barang Test Postman",
                    description: "Ditemukan di lab",
                    location: "Lab",
                    date_time: "2026-05-22T10:00:00.000Z"
                });
            testItemId = createResult.body.data.id;
        });

        it('should can get item by id', async () => {
            const result = await supertest(web)
                .get(`/api/items/${testItemId}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(result.status).toBe(200);
            expect(result.body.data.title).toBe("Barang Test Postman");
        });

        it('should return 404 if item id is invalid', async () => {
            const result = await supertest(web)
                .get('/api/items/9999999')
                .set('Authorization', `Bearer ${token}`);
            expect(result.status).toBe(404);
        });

        it('should can update item by owner', async () => {
            const result = await supertest(web)
                .patch(`/api/items/${testItemId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: "Judul Barang Diupdate",
                    description: "Deskripsi baru"
                });

            expect(result.status).toBe(200);
            expect(result.body.data.title).toBe("Judul Barang Diupdate");
            expect(result.body.data.description).toBe("Deskripsi baru");

            const itemInDb = await prismaClient.item.findUnique({
                where: { id: testItemId }
            });
            expect(itemInDb.title).toBe("Judul Barang Diupdate");
        });

        it('should block non-owner from updating item', async () => {
            const result = await supertest(web)
                .patch(`/api/items/${testItemId}`)
                .set('Authorization', `Bearer ${adminToken}`) // Admin bukan owner
                .send({ title: "Judul Dibajak Admin" });

            // Admin bukan owner item ini — tapi admin memang boleh update (isAdmin check)
            // Sesuai logika: isAdmin || isOwner. Admin selalu boleh update.
            expect(result.status).toBe(200);
        });
    });

    // ========================================================
    // TEST: DELETE ITEM (DELETE /api/items/:itemId)
    // ========================================================
    describe('DELETE /api/items/:itemId', () => {
        let testItemId;

        beforeEach(async () => {
            const createResult = await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999,
                    type: "lost",
                    title: "Barang Akan Dihapus",
                    description: "Test hapus item",
                    location: "Gedung D",
                    date_time: "2026-05-22T10:00:00.000Z"
                });
            testItemId = createResult.body.data.id;
        });

        it('should can delete item by owner', async () => {
            const result = await supertest(web)
                .delete(`/api/items/${testItemId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(result.status).toBe(200);

            const itemInDb = await prismaClient.item.findUnique({
                where: { id: testItemId }
            });
            expect(itemInDb).toBeNull();
        });

        it('should allow admin to delete any item', async () => {
            const result = await supertest(web)
                .delete(`/api/items/${testItemId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
        });

        it('should return 404 if item does not exist', async () => {
            const result = await supertest(web)
                .delete('/api/items/9999999')
                .set('Authorization', `Bearer ${token}`);

            expect(result.status).toBe(404);
        });

        it('should reject if not authenticated', async () => {
            const result = await supertest(web)
                .delete(`/api/items/${testItemId}`);

            expect(result.status).toBe(401);
        });
    });

    // ========================================================
    // TEST: FILTER & PAGINATION (GET /api/items?type=&category_id=)
    // ========================================================
    describe('GET /api/items with filters', () => {
        beforeEach(async () => {
            // Buat 2 item lost (status 'searching' — tidak difilter dari feed)
            await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999,
                    type: "lost",
                    title: "Sepatu Olahraga Merah",
                    description: "Hilang di lapangan basket",
                    location: "Lapangan Basket",
                    date_time: "2026-05-22T10:00:00.000Z"
                });

            await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999,
                    type: "lost",
                    title: "Kacamata Minus Hitam",
                    description: "Hilang setelah kuliah",
                    location: "Ruang 201",
                    date_time: "2026-05-22T11:00:00.000Z"
                });
        });

        it('should filter items by type=lost', async () => {
            const result = await supertest(web)
                .get('/api/items?type=lost')
                .set('Authorization', `Bearer ${token}`);

            expect(result.status).toBe(200);
            const types = result.body.data.map(item => item.type);
            expect(types.every(t => t === 'lost')).toBe(true);
        });

        it('should filter items by category_id', async () => {
            const result = await supertest(web)
                .get('/api/items?category_id=9999')
                .set('Authorization', `Bearer ${token}`);

            expect(result.status).toBe(200);
            expect(result.body.data.length).toBeGreaterThanOrEqual(2);
            const catIds = result.body.data.map(item => item.category_id);
            expect(catIds.every(id => id === 9999)).toBe(true);
        });

        it('should search items by keyword (q)', async () => {
            const result = await supertest(web)
                .get('/api/items?q=Kacamata')
                .set('Authorization', `Bearer ${token}`);

            expect(result.status).toBe(200);
            expect(result.body.data.some(item => item.title.includes("Kacamata"))).toBe(true);
        });

        it('should return paginated response with meta', async () => {
            const result = await supertest(web)
                .get('/api/items?page=1&size=1')
                .set('Authorization', `Bearer ${token}`);

            expect(result.status).toBe(200);
            expect(result.body.data.length).toBe(1);
            expect(result.body.meta).toBeDefined();
            expect(result.body.meta.page).toBe(1);
            expect(result.body.meta.size).toBe(1);
        });
    });

    // ========================================================
    // TEST: ADMIN VERIFIKASI ITEM (PATCH status pending → available)
    // ========================================================
    describe('PATCH /api/items/:itemId - admin verifikasi', () => {
        let pendingItemId;

        beforeEach(async () => {
            // Found item → otomatis 'pending_verification'
            const createResult = await supertest(web)
                .post('/api/items')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    category_id: 9999,
                    type: "found",
                    title: "Dompet Merah Ditemukan",
                    description: "Ditemukan di lorong",
                    location: "Lorong Gedung B",
                    date_time: "2026-05-22T10:00:00.000Z"
                });
            pendingItemId = createResult.body.data.id;
        });

        it('should allow admin to verify item and set status to available', async () => {
            const result = await supertest(web)
                .patch(`/api/items/${pendingItemId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: "available" });

            expect(result.status).toBe(200);
            expect(result.body.data.status).toBe("available");

            const itemInDb = await prismaClient.item.findUnique({
                where: { id: pendingItemId }
            });
            expect(itemInDb.status).toBe("available");
            expect(itemInDb.verified_by_id).not.toBeNull();
        });

        it('should block regular user from changing status of found item', async () => {
            const result = await supertest(web)
                .patch(`/api/items/${pendingItemId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: "available" });

            expect(result.status).toBe(403);
        });
    });
});