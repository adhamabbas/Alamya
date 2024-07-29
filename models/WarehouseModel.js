const mongoose = require('mongoose');
const Supplayr =require('./SupplayrModel');

const warehouseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    supplayr: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplayr',
      required: true,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
    product_code: {
      type: Number,
      unique: true,
    },
  
    weight: {
      type: Number,
      
    },
    size: {
      type: Number,
    },
  },
  { timestamps: true }
);

warehouseSchema.pre(/^find/, function (next) {
this.populate({ path: 'user', select: 'name -_id' })
    .populate({ path: 'product', select: 'type avg_price wieght _id' })
    .populate({ path: 'supplayr', select: 'supplayr_name _id' });
    next();
  });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;
