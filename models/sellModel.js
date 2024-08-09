const mongoose = require('mongoose');
const User = require('./userModel');
const Product = require('./ProductModel');
const Clint = require('./ClintModel');
const Warehouse = require('./WarehouseModel');

const SellSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    clint: {
      type: mongoose.Schema.ObjectId,
      ref: 'Clint',
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
    code_out: {
      type: String,
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
    taxRate: {
      type: Number,
      required: true,
    },
    discountRate: {
      type: Number,
      required: true,
    },
    netAmount: {
      type: Number,
      
    },
    allForall: {
      type: Number,
      
    },
    taxAmount: {
      type: Number,
    
    },
    pay_now: {
      type: Number,
      required: true,
      default: 0,
    },
    Notes: {
      type:String,
      trim: true,
      default:'',
    },
  },
  { timestamps: true }
);

SellSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name -_id' })
    .populate({ path: 'product', select: 'type avg_price weight wight_money _id' })
    .populate({ path: 'clint', select: 'clint_name money_pay money_on _id' });

  next();
});

SellSchema.pre('save', async function (next) {
  const tax = this;
  
  // Calculate the tax and discount amounts
  tax.taxAmount = tax.price_allQuantity * (tax.taxRate / 100);
  tax.discountAmount = tax.price_allQuantity * (tax.discountRate / 100);
  tax.netAmount =  tax.taxAmount - tax.discountAmount;
  tax.allForall = tax.price_allQuantity + tax.netAmount ;

  const clint = await Clint.findById(tax.clint);
  if (clint) {
    clint.total_monye += tax.allForall;
    clint.money_on+=  (tax.allForall - tax.pay_now);
    clint.disCount = (clint.disCount || 0) + 1;
    await clint.save();
    }
  
  
  next();
});

SellSchema.statics.updateProductWeightS = async function (productId, weightSold) {
  await Product.findByIdAndUpdate(productId, {
    $inc: { weight: -weightSold },
  });
};

SellSchema.statics.removeFromWarehouse = async function (product_code) {
  const product = await Warehouse.findOne({ product_code });
  if (!product) throw new Error('Product not found in warehouse');

  // إزالة المنتج بالكامل من المخزون
  await Warehouse.deleteOne({ product_code });
};

/*SellSchema.statics.AddmoneyAndtakeMoneyS = async function (clintId) {
  const result2 = await this.aggregate([
    {
      $match: { clint: clintId },
    },
    {
      $group: {
        _id: '$clint',
        monyePay: { $sum: '$pay_now' },
        totalMonye: { $sum: '$price_allQuantity' }
      },
    },
  ]);

  if (result2.length > 0) {
    await Clint.findByIdAndUpdate(clintId, {
      money_pay: result2[0].monyePay,
      total_monye: result2[0].totalMonye,
    });
  }
};*/

SellSchema.statics.takeMoney_ds = async function (clintId,monyePay) {

  await Clint.findByIdAndUpdate(clintId, {
    $inc: {  money_pay: +monyePay },
  });
};



SellSchema.post('save', async function () {
  await this.constructor.updateProductWeightS(this.product, this.o_wieght);
  await this.constructor.removeFromWarehouse(this.product_code);
  await this.constructor.takeMoney_ds(this.clint, this.pay_now);
});

// تعديل بحيث لا يتم أي تغيير في المخزن عند استخدام update
SellSchema.post('findOneAndUpdate', async function (doc) {
  if (doc && doc.pay_now !== undefined) {
    const oldDocument = await this.model.findById(doc._id).exec();
    if (oldDocument) {
      const oldPayBell = oldDocument.pay_now;
      const newPayBell = doc.pay_now;
      await doc.constructor.takeMoney_ds(doc.clint,0 ,newPayBell - oldPayBell);
    }
  }
  if (doc && doc.price_allQuantity !== undefined) {
    const oldDocument = await this.model.findById(doc._id).exec();
    if (oldDocument) {
      const oldPayBell2 = oldDocument.price_allQuantity;
      const newPayBell2 = doc.price_allQuantity;
      await doc.constructor.takeMoney_ds(doc.clint,newPayBell2 - oldPayBell2,0);
    }
  }
});

const Sell = mongoose.model('Sell', SellSchema);

module.exports = Sell;
