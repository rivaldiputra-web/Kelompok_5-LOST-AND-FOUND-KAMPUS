import { prismaClient } from "../src/application/database.js";
import bcrypt from "bcrypt";

export const removeTestUser = async () => {
    await prismaClient.user.deleteMany({
        where: {
            email: "test@kampus.edu"
        }
    });
};

export const createTestUser = async () => {
    await prismaClient.user.create({
        data: {
            nim_nip: "1234567890",
            name: "Test User",
            email: "test@kampus.edu",
            password: await bcrypt.hash("rahasia123", 10),
            role: "user" 
        }
    });
};

export const getTestUser = async () => {
    return prismaClient.user.findUnique({
        where: {
            email: "test@kampus.edu"
        }
    });
};


// items
export const removeTestItems = async () => {
    await prismaClient.item.deleteMany({
        where: {
            OR: [
                { category_id: 9999 },
                { user: { email: "test@kampus.edu" } },
                { user: { email: "admin@kampus.edu" } }
            ]
        }
    });
};

export const createTestCategory = async () => {
    // Pastikan ID 9999 tidak bentrok dengan data asli
    await prismaClient.category.create({
        data: {
            id: 9999,
            name: "Kategori Test"
        }
    });
};

export const removeTestCategory = async () => {
    await prismaClient.category.deleteMany({
        where: {
            id: 9999
        }
    });
};

export const getTestItem = async () => {
    return prismaClient.item.findFirst({
        where: {
            title: "Barang Test Postman"
        }
    });
};

// claims
export const removeTestClaims = async () => {
    await prismaClient.claim.deleteMany({
        where: { 
            OR: [
                { item: { category_id: 9999 } },
                { user: { email: "test@kampus.edu" } },
                { user: { email: "admin@kampus.edu" } }
            ]
        }
    });
};

export const createTestAdmin = async () => {
    await prismaClient.user.create({
        data: {
            nim_nip: "ADMIN999",
            name: "Admin Satpam",
            email: "admin@kampus.edu",
            password: await bcrypt.hash("rahasia123", 10),
            role: "admin"
        }
    });
};

export const removeTestAdmin = async () => {
    await prismaClient.user.deleteMany({
        where: { email: "admin@kampus.edu" }
    });
};

export const removeTestComments = async () => {
    await prismaClient.comment.deleteMany({
        where: {
            OR: [
                { user: { email: "test@kampus.edu" } },
                { user: { email: "admin@kampus.edu" } },
                { item: { category_id: 9999 } }
            ]
        }
    });
};

export const removeTestBoosts = async () => {
    await prismaClient.boost.deleteMany({
        where: {
            OR: [
                { user: { email: "test@kampus.edu" } },
                { user: { email: "admin@kampus.edu" } },
                { item: { category_id: 9999 } }
            ]
        }
    });
};