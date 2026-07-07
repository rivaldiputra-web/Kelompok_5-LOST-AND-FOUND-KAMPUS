import categoryService from "../service/category-service.js";

const create = async (req, res, next) => {
  try {
    const result = await categoryService.create(req.body);
    res.status(201).json({
      status: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await categoryService.get(categoryId);
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
    const categoryId = parseInt(req.params.categoryId);
    const result = await categoryService.update(categoryId, req.body);
    res.status(200).json({
      status: true,
      data: result
    });
  } catch (e) {
    next(e);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await categoryService.list();
    res.status(200).json({
      status: true,
      data: result
    });
  } catch (e) {
    next(e);
  }
};

export default {
  create,
  get,
  update,
  list,
};
