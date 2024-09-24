const mongoose = require('mongoose');
const User = require('./userModel');
const Product = require('./ProductModel');
const Clint = require('./ClintModel');
const Sell = require('./sellModel');
const Warehouse = require('./WarehouseModel');

const ReturnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    clint: {
      type: mongoose.Schema.ObjectId,
      ref: 'Clint',
    },
    sell: {
      type: mongoose.Schema.ObjectId,
      ref: 'Sell',
    },
    o_wieght: {
      type: Number,
      required: true,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
    size_o: {
      type: Number,
      required: true,
    },
    product_code: {
      type: Number,
      required: true,
    },
    priceForKilo: {
      type: Number,
      required: true,
    },
    price_allQuantity: {
      type: Number,
      required: true,
    },
    refund_amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

ReturnSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name -_id' })
    .populate({ path: 'product', select: 'type avg_price weight wight_money _id' })
    .populate({ path: 'clint', select: 'clint_name money_pay money_on -_id' })

  next();
});

ReturnSchema.statics.updateProductWeightR = async function (productId, weightReturned) {
  await Product.findByIdAndUpdate(productId, {
    $inc: { wieght: weightReturned },
  });
};

ReturnSchema.statics.addToWarehouse = async function (product_code, weightReturned,size_o2,product2,user2) {
  const product1 = await Warehouse.findOne({ product_code });
  if (!product1) {
    // إذا لم يكن المنتج موجودًا في المخزن، نقوم بإضافته
    const newProduct = new Warehouse({
      product_code: product_code,
      weight: weightReturned,
      size:size_o2,
      user:user2,
      product:product2,
      supplayr:"66a1f4aa1502d5461f330455",

    });
    await newProduct.save();
  } else {
    // إذا كان المنتج موجودًا، نقوم بتحديث الوزن
    product.weight += weightReturned;
    await product.save();
  }
};

ReturnSchema.statics.updateClientFinancials = async function (clintId, refundAmount,priceAllQuantity) {
  await Clint.findByIdAndUpdate(clintId, {
    $inc: { money_pay: -refundAmount, money_on: -priceAllQuantity, total_monye: -priceAllQuantity },
  });
};

ReturnSchema.statics.deleteSellRecord = async function (sellId) {
  await Sell.findByIdAndDelete(sellId);
};

ReturnSchema.post('save', async function () {
  await this.constructor.updateProductWeightR(this.product, this.o_wieght);
  await this.constructor.addToWarehouse(this.product_code, this.o_wieght,this.size_o,this.product,this.user);
  await this.constructor.updateClientFinancials(this.clint, this.refund_amount , this.price_allQuantity);
  await this.constructor.deleteSellRecord(this.sell);
});

const Return = mongoose.model('Return', ReturnSchema);

module.exports = Return;