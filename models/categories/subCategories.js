const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'category'
    },
    subCategoryName: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    img: {
        type: String,
        default: "" 
    }
}, { timestamps: true});

const subCategories = mongoose.model('subCategory', subCategorySchema);

module.exports = subCategories;