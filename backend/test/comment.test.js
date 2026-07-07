import supertest from "supertest";
import { prismaClient } from "../src/application/database.js";
import { web } from "../src/application/web.js";
import {
    createTestUser, removeTestUser,
    createTestAdmin, removeTestAdmin,
    createTestCategory, removeTestCategory,
    removeTestItems, removeTestComments
} from "./test-util.js";

describe('Comment API Tests', () => {
    let userToken = "";
    let adminToken = "";
    let testItemId;

    beforeEach(async () => {
        await removeTestComments();
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

        const adminLogin = await supertest(web).post('/api/auth/login').send({
            email: "admin@kampus.edu",
            password: "rahasia123"
        });
        adminToken = adminLogin.body.accessToken;

        // Buat item hilang (langsung berstatus 'searching', tanpa perlu verifikasi admin)
        const itemResult = await supertest(web)
            .post('/api/items')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                category_id: 9999,
                type: "lost",
                title: "Tas Ransel Hitam",
                description: "Hilang di perpustakaan",
                location: "Perpustakaan Pusat",
                date_time: "2026-05-22T10:00:00.000Z"
            });
        testItemId = itemResult.body.data.id;
    });

    afterEach(async () => {
        await removeTestComments();
        await removeTestItems();
        await removeTestCategory();
        await removeTestAdmin();
        await removeTestUser();
    });

    // ========================================================
    // TEST: CREATE COMMENT (POST /api/items/:itemId/comments)
    // ========================================================
    describe('POST /api/items/:itemId/comments', () => {
        it('should can create a comment', async () => {
            const result = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Apakah ini tasmu? Saya melihat yang mirip di kantin." });

            expect(result.status).toBe(201);
            expect(result.body.data.text).toBe("Apakah ini tasmu? Saya melihat yang mirip di kantin.");
            expect(result.body.data.user.name).toBe("Test User");
        });

        it('should reject if item is not found', async () => {
            const result = await supertest(web)
                .post('/api/items/9999999/comments')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Komentar untuk item yang tidak ada" });

            expect(result.status).toBe(404);
        });

        it('should reject if text is empty', async () => {
            const result = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "" });

            expect(result.status).toBe(400);
        });

        it('should reject if not authenticated', async () => {
            const result = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .send({ text: "Komentar tanpa token" });

            expect(result.status).toBe(401);
        });
    });

    // ========================================================
    // TEST: LIST COMMENTS (GET /api/public/items/:itemId/comments)
    // ========================================================
    describe('GET /api/public/items/:itemId/comments', () => {
        beforeEach(async () => {
            await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Komentar pertama dari user" });
            await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ text: "Komentar balasan dari admin" });
        });

        it('should can list comments without authentication', async () => {
            const result = await supertest(web)
                .get(`/api/public/items/${testItemId}/comments`);

            expect(result.status).toBe(200);
            expect(result.body.data).toBeInstanceOf(Array);
            expect(result.body.data.length).toBe(2);
            expect(result.body.data[0].text).toBe("Komentar pertama dari user");
        });

        it('should return 404 if item does not exist', async () => {
            const result = await supertest(web)
                .get('/api/public/items/9999999/comments');

            expect(result.status).toBe(404);
        });
    });

    // ========================================================
    // TEST: UPDATE COMMENT (PATCH /api/comments/:commentId)
    // ========================================================
    describe('PATCH /api/comments/:commentId', () => {
        let userCommentId;
        let adminCommentId;

        beforeEach(async () => {
            const userComment = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Komentar awal user" });
            userCommentId = userComment.body.data.id;

            const adminComment = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ text: "Komentar dari admin" });
            adminCommentId = adminComment.body.data.id;
        });

        it('should can update own comment', async () => {
            const result = await supertest(web)
                .patch(`/api/comments/${userCommentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Komentar sudah diperbarui" });

            expect(result.status).toBe(200);
            expect(result.body.data.text).toBe("Komentar sudah diperbarui");
        });

        it('should reject if non-owner tries to update', async () => {
            // User biasa mencoba update komentar milik admin
            const result = await supertest(web)
                .patch(`/api/comments/${adminCommentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Mencoba ubah komentar admin" });

            expect(result.status).toBe(403);
        });

        it('should return 404 if comment does not exist', async () => {
            const result = await supertest(web)
                .patch('/api/comments/9999999')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Komentar hantu" });

            expect(result.status).toBe(404);
        });
    });

    // ========================================================
    // TEST: DELETE COMMENT (DELETE /api/comments/:commentId)
    // ========================================================
    describe('DELETE /api/comments/:commentId', () => {
        let userCommentId;
        let adminCommentId;

        beforeEach(async () => {
            const userComment = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ text: "Komentar user untuk dihapus" });
            userCommentId = userComment.body.data.id;

            const adminComment = await supertest(web)
                .post(`/api/items/${testItemId}/comments`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ text: "Komentar admin untuk dihapus" });
            adminCommentId = adminComment.body.data.id;
        });

        it('should can delete own comment', async () => {
            const result = await supertest(web)
                .delete(`/api/comments/${userCommentId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(200);

            const inDb = await prismaClient.comment.findUnique({
                where: { id: userCommentId }
            });
            expect(inDb).toBeNull();
        });

        it('should allow admin to delete any comment', async () => {
            // Admin menghapus komentar milik user biasa
            const result = await supertest(web)
                .delete(`/api/comments/${userCommentId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(result.status).toBe(200);
        });

        it('should reject if non-owner non-admin tries to delete', async () => {
            // User biasa mencoba menghapus komentar milik admin
            const result = await supertest(web)
                .delete(`/api/comments/${adminCommentId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(403);
        });

        it('should return 404 if comment does not exist', async () => {
            const result = await supertest(web)
                .delete('/api/comments/9999999')
                .set('Authorization', `Bearer ${userToken}`);

            expect(result.status).toBe(404);
        });
    });
});
