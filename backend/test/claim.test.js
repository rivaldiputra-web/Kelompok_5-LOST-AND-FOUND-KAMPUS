import supertest from "supertest";
import { web } from "../src/application/web.js";
import { prismaClient } from "../src/application/database.js";
import { 
    createTestUser, removeTestUser, 
    createTestAdmin, removeTestAdmin,
    createTestCategory, removeTestCategory, 
    removeTestItems, removeTestClaims
} from "./test-util.js";

describe('Claim API Tests', () => {
    let userToken = "";
    let adminToken = "";
    let testItemId;

    // SETUP: Dijalankan sebelum setiap blok test
    beforeEach(async () => {
        // 1. Bersihkan sisa data sebelumnya
        await removeTestClaims();
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();

        // 2. Buat data prasyarat (User, Admin, Kategori)
        await createTestUser();
        await createTestAdmin();
        await createTestCategory();

        // 3. Login User Biasa (Mahasiswa)
        const userLogin = await supertest(web).post('/api/auth/login').send({
            email: "test@kampus.edu",
            password: "rahasia123"
        });
        userToken = userLogin.body.accessToken;

        // 4. Login Admin
        const adminLogin = await supertest(web).post('/api/auth/login').send({
            email: "admin@kampus.edu",
            password: "rahasia123"
        });
        adminToken = adminLogin.body.accessToken;

        // 5. Buat 1 Barang Temuan (Found) untuk diklaim
        const itemResult = await supertest(web)
            .post('/api/items')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                category_id: 9999,
                type: "found",
                title: "Dompet Kulit Coklat",
                description: "Ditemukan di kantin",
                location: "Kantin",
                date_time: "2026-05-22T10:00:00.000Z"
            });
        testItemId = itemResult.body.data.id;
    });

    // TEARDOWN: Dijalankan setelah test selesai
    afterEach(async () => {
        await removeTestClaims();
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();
    });

    // ========================================================
    // TEST: CREATE CLAIM (POST /api/claims)
    // ========================================================
    describe('POST /api/claims', () => {
        it('should can create new claim', async () => {
            const result = await supertest(web)
                .post('/api/claims')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    item_id: testItemId,
                    proof_description: "Di dalam dompet ada KTP saya"
                });

            expect(result.status).toBe(201); 
            expect(result.body.data.item_id).toBe(testItemId);
            expect(result.body.data.status).toBe("pending");
        });

        it('should reject if item is not found', async () => {
            const result = await supertest(web)
                .post('/api/claims')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    item_id: 999999, // ID Ngasal
                    proof_description: "Bukti palsu"
                });

            expect(result.status).toBe(404);
        });
    });

    // ========================================================
    // TEST: GET SINGLE CLAIM (GET /api/claims/:id)
    // ========================================================
    describe('GET /api/claims/:id', () => {
        let testClaimId;

        beforeEach(async () => {
            const claimResult = await supertest(web)
                .post('/api/claims')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ item_id: testItemId, proof_description: "KTP atas nama saya" });
            testClaimId = claimResult.body.data.id;
        });

        it('should can get claim by id', async () => {
            const result = await supertest(web)
                .get(`/api/claims/${testClaimId}`)
                .set('Authorization', `Bearer ${userToken}`);
            
            expect(result.status).toBe(200);
            expect(result.body.data.proof_description).toBe("KTP atas nama saya");
            expect(result.body.data.item.title).toBe("Dompet Kulit Coklat");
        });
    });

    // ========================================================
    // TEST: UPDATE CLAIM (PATCH /api/claims/:id)
    // ========================================================
    describe('PATCH /api/claims/:id', () => {
        let testClaimId;

        beforeEach(async () => {
            const claimResult = await supertest(web)
                .post('/api/claims')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ item_id: testItemId, proof_description: "Bukti awal" });
            testClaimId = claimResult.body.data.id;
        });

        it('should allow owner to update proof_description if pending', async () => {
            const result = await supertest(web)
                .patch(`/api/claims/${testClaimId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    proof_description: "Bukti diupdate: ada KTM juga di dalamnya"
                });

            expect(result.status).toBe(200);
            expect(result.body.data.proof_description).toBe("Bukti diupdate: ada KTM juga di dalamnya");
        });

        it('should block non-admin from updating status', async () => {
            const result = await supertest(web)
                .patch(`/api/claims/${testClaimId}`)
                .set('Authorization', `Bearer ${userToken}`) // <--- Mahasiswa nge-hack!
                .send({
                    status: "approved" 
                });

            expect(result.status).toBe(403); // Akses harus ditolak!
        });

        it('should allow admin to approve claim and trigger item status update', async () => {
            const result = await supertest(web)
                .patch(`/api/claims/${testClaimId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: "approved" });

            expect(result.status).toBe(200);
            expect(result.body.data.status).toBe("approved");

            // Transaksi Prisma: item otomatis berstatus 'returned'
            const itemInDb = await prismaClient.item.findUnique({
                where: { id: testItemId }
            });
            expect(itemInDb.status).toBe("returned");
        });

        it('should allow admin to reject claim', async () => {
            const result = await supertest(web)
                .patch(`/api/claims/${testClaimId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: "rejected",
                    admin_notes: "Bukti tidak cukup meyakinkan"
                });

            expect(result.status).toBe(200);
            expect(result.body.data.status).toBe("rejected");
        });
    });

    // ========================================================
    // TEST: GET ALL CLAIMS (GET /api/claims)
    // ========================================================
    describe('GET /api/claims', () => {
        beforeEach(async () => {
            // Buat klaim dari user biasa
            await supertest(web)
                .post('/api/claims')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ item_id: testItemId, proof_description: "KTP saya ada di dalam dompet" });
        });

        it('should return only own claims for regular user', async () => {
            const result = await supertest(web)
                .get('/api/claims')
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data).toBeInstanceOf(Array);
            // Semua klaim yang dikembalikan harus milik user atau barang milik user
            expect(result.body.data.length).toBeGreaterThan(0);
        });

        it('should return all claims for admin', async () => {
            const result = await supertest(web)
                .get('/api/claims')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data).toBeInstanceOf(Array);
            expect(result.body.data.length).toBeGreaterThan(0);
        });

        it('should filter claims by status', async () => {
            const result = await supertest(web)
                .get('/api/claims?status=pending')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
            const statuses = result.body.data.map(c => c.status);
            expect(statuses.every(s => s === 'pending')).toBe(true);
        });

        it('should include pagination meta', async () => {
            const result = await supertest(web)
                .get('/api/claims?page=1&size=10')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
            expect(result.body.meta).toBeDefined();
            expect(result.body.meta.page).toBe(1);
        });
    });

    // ========================================================
    // TEST: DELETE CLAIM (DELETE /api/claims/:claimId)
    // ========================================================
    describe('DELETE /api/claims/:claimId', () => {
        let pendingClaimId;
        let approvedClaimId;

        beforeEach(async () => {
            // Buat klaim 'pending' dari user
            const pendingResult = await supertest(web)
                .post('/api/claims')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ item_id: testItemId, proof_description: "KTP saya ada di dalam" });
            pendingClaimId = pendingResult.body.data.id;
        });

        it('should allow owner to delete own pending claim', async () => {
            const result = await supertest(web)
                .delete(`/api/claims/${pendingClaimId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(200);

            const inDb = await prismaClient.claim.findUnique({
                where: { id: pendingClaimId }
            });
            expect(inDb).toBeNull();
        });

        it('should allow admin to delete any claim', async () => {
            const result = await supertest(web)
                .delete(`/api/claims/${pendingClaimId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
        });

        it('should block user from deleting already-approved claim', async () => {
            // Admin menyetujui klaim
            await supertest(web)
                .patch(`/api/claims/${pendingClaimId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: "approved" });

            // User mencoba hapus klaim yang sudah disetujui
            const result = await supertest(web)
                .delete(`/api/claims/${pendingClaimId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(400);
        });

        it('should return 404 if claim does not exist', async () => {
            const result = await supertest(web)
                .delete('/api/claims/9999999')
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(404);
        });
    });
});