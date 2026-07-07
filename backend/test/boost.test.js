import supertest from "supertest";
import { web } from "../src/application/web.js";
import {
    createTestUser, removeTestUser,
    createTestAdmin, removeTestAdmin,
    createTestCategory, removeTestCategory,
    removeTestItems, removeTestBoosts
} from "./test-util.js";

describe('Boost API Tests', () => {
    let userToken = "";
    let testItemId;

    beforeEach(async () => {
        await removeTestBoosts();
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();

        await createTestUser();
        await createTestAdmin();
        await createTestCategory();

        const userLogin = await supertest(web).post('/api/auth/login').send({
            email: "test@kampus.edu",
            password: "rahasia123"
        });
        userToken = userLogin.body.accessToken;

        // Buat item hilang (status 'searching', tidak butuh verifikasi admin)
        const itemResult = await supertest(web)
            .post('/api/items')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                category_id: 9999,
                type: "lost",
                title: "Laptop Dell XPS Hitam",
                description: "Hilang di ruang kuliah 301",
                location: "Ruang 301 Gedung C",
                date_time: "2026-05-22T10:00:00.000Z"
            });
        testItemId = itemResult.body.data.id;
    });

    afterEach(async () => {
        await removeTestBoosts();
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();
    });

    // ========================================================
    // TEST: TOGGLE BOOST (POST /api/items/:itemId/boost)
    // ========================================================
    describe('POST /api/items/:itemId/boost', () => {
        it('should add boost on first toggle', async () => {
            const result = await supertest(web)
                .post(`/api/items/${testItemId}/boost`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data.boosted).toBe(true);
            expect(result.body.data.boost_count).toBe(1);
        });

        it('should remove boost on second toggle (un-boost)', async () => {
            // Toggle pertama: tambah boost
            await supertest(web)
                .post(`/api/items/${testItemId}/boost`)
                .set('Authorization', `Bearer ${userToken}`);

            // Toggle kedua: hapus boost
            const result = await supertest(web)
                .post(`/api/items/${testItemId}/boost`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data.boosted).toBe(false);
            expect(result.body.data.boost_count).toBe(0);
        });

        it('should count boosts from multiple users independently', async () => {
            const adminLogin = await supertest(web).post('/api/auth/login').send({
                email: "admin@kampus.edu",
                password: "rahasia123"
            });
            const adminToken = adminLogin.body.accessToken;

            await supertest(web)
                .post(`/api/items/${testItemId}/boost`)
                .set('Authorization', `Bearer ${userToken}`);

            const result = await supertest(web)
                .post(`/api/items/${testItemId}/boost`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
            expect(result.body.data.boost_count).toBe(2);
        });

        it('should return 404 if item does not exist', async () => {
            const result = await supertest(web)
                .post('/api/items/9999999/boost')
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(404);
        });

        it('should reject if not authenticated', async () => {
            const result = await supertest(web)
                .post(`/api/items/${testItemId}/boost`);

            expect(result.status).toBe(401);
        });
    });
});
