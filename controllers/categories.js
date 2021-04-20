const categorySchema = require('../models/categories/categories');
const subCategorySchema = require('../models/categories/subCategories');

const categoryValidator = require('../validators/categories.validators');
const _ = require('underscore');
module.exports = {

    addCategorySubCategory: async (req, res, next) => {
        try {
            let { category, subCategory } = await categoryValidator.addCategory().validateAsync(req.body);
            let addCategoryData = await categorySchema.create({
                categoryName: category,
                status: true
            });
            let addSubcategory = await subCategorySchema.create({
                subCategoryName: subCategory,
                categoryId: addCategoryData._id,
                status: true
            });
            return res.json({
                code: 200,
                data: { addCategoryData, addSubcategory },
                message: "Added Category and subcategory successfully !!",
                error: null
            });
        } catch (err) {
            next(err);
        }
    },

    addSubCategory: async (req, res, next) => {
        try {
            let { categoryId, subCategory } = await categoryValidator.addSubCategory().validateAsync(req.body);
            let addSubcategory = await subCategorySchema.create({
                subCategoryName: subCategory,
                categoryId,
                status: true
            });
            return res.json({
                code: 200,
                data: addSubcategory,
                message: "Added Subcategory successfully !!",
                error: null
            });
        } catch (err) {
            next(err);
        }
    },

    listAllCategories: async (req, res, next) => {
        try {
            let { skip, limit } = await categoryValidator.listCategories().validateAsync(req.body);
            let categoriesData = await categorySchema.find({
                isDeleted: false
            })
            .skip(skip)
            .limit(limit)
            .lean();
            return res.json({
                code: 200,
                data: categoriesData,
                message: "Categories fetched successfully",
                error: null
            });
        } catch (err) {
            next(err);
        }
    },

    listAllSubCategories: async (req, res, next) => {
        try {
            let { skip, limit, categoryId } = await categoryValidator.listSubcategories().validateAsync(req.body);
            let subCategoriesData = await subCategorySchema.find({
                categoryId,
                isDeleted: false
            })
            .skip(skip)
            .limit(limit)
            .lean();
            return res.json({
                code: 200,
                data: subCategoriesData,
                message: "Sub categories fetched successfully",
                error: null
            });
        } catch (err) {
            next(err);
        }
    },

    listAllCategoriesSubCategories: async (req, res, next) => {
        try {
            let { skip, limit } = await categoryValidator.listCategoriesSubCategories().validateAsync(req.body);
            let categoriesData = await categorySchema.find({
                isDeleted: false
            })
            .skip(skip)
            .limit(limit)
            .lean();
            let dataArr = [];
            for (let i = 0; i < categoriesData.length; i++) {
                let category = categoriesData[i];
                let obj = {
                    category: category.categoryName,
                    categoryId: category._id,
                    status: category.status,
                    subCategories: []
                };
                let subCategoriesData = await subCategorySchema.find({
                    categoryId: category._id,
                    isDeleted: false
                }, {_id: 1, subCategoryName: 1}).lean();
                obj.subCategories = subCategoriesData;
                dataArr.push(obj);
            };
            return res.json({
                code: 200,
                data: dataArr,
                message: "Categories and sub categories fetched successfully",
                error: null
            });
        } catch (err) {
            next(err);
        }
    },

    getOneCategory: async (req, res, next) => {
        try {
            let { categoryId } = await categoryValidator.getOneCategory().validateAsync(req.query);
            let category = await categorySchema.findOne({
                _id: categoryId
            }).lean();
            return res.json({
                code: 200,
                data: category,
                message: "Fetched data successfully",
                error: null
            });
        } catch (err) {
            next(err);
        }
    }
}