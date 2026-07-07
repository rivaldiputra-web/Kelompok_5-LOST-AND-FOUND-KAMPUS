import { prismaClient } from "../application/database.js";
import { validate } from "../validation/validation.js";
import { 
    createCategoryValidation, 
    getCategoryValidation, 
    updateCategoryValidation 
} from "../validation/category-validation.js";
import { ResponseError } from "../error/response-error.js";

const create = async (request) => {
    const category = validate(createCategoryValidation, request);

    // Cek apakah nama kategori sudah ada agar tidak duplikat
    const countCategory = await prismaClient.category.count({
        where: { name: category.name }
    });

    if (countCategory > 0) {
        throw new ResponseError(400, "Nama kategori sudah ada");
    }

    return prismaClient.category.create({
        data: category
    });
};

const get = async (categoryId) => {
    categoryId = validate(getCategoryValidation, categoryId);

    const category = await prismaClient.category.findUnique({
        where: { id: categoryId }
    });

    if (!category) {
        throw new ResponseError(404, "Kategori tidak ditemukan");
    }

    return category;
};

const update = async (categoryId, request) => {
    categoryId = validate(getCategoryValidation, categoryId);
    const category = validate(updateCategoryValidation, request);

    const categoryInDb = await prismaClient.category.count({
        where: { id: categoryId }
    });

    if (categoryInDb !== 1) {
        throw new ResponseError(404, "Kategori tidak ditemukan");
    }

    return prismaClient.category.update({
        where: { id: categoryId },
        data: category
    });
};

const list = async () => {
    return prismaClient.category.findMany();
};

export default {
    create,
    get,
    update,
    list
};