const mongoose = require('mongoose');
const Product = require('./ProductModel');
const Warehouse = require('./WarehouseModel');
const Supplayr = require('./SupplayrModel');

const Sell_supplayrSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    supplayr: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplayr',
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
    pay_now: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

Sell_supplayrSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name -_id' })
    .populate({ path: 'product', select: 'type avg_price weight wight_money -_id' })
    .populate({ path: 'supplayr', select: 'supplayr_name priceOn_sell pricePay_sell -_id' });

  next();
});

Sell_supplayrSchema.statics.updateProductWeightS = async function (productId, weightSold) {
  await Product.findByIdAndUpdate(productId, {
    $inc: { wieght: -weightSold },
  });
};

Sell_supplayrSchema.statics.removeFromWarehouse = async function (product_code, weightSold) {
  const product = await Warehouse.findOne({ product_code });
  if (!product) throw new Error('Product not found in warehouse');
  if (product.weight < weightSold) throw new Error('Not enough quantity in warehouse');
  product.weight -= weightSold;
  if (product.weight === 0) {
    await Warehouse.deleteOne({ product_code });
  } else {
    await product.save();
  }
};

Sell_supplayrSchema.statics.AddmoneyAndtakeMoneyS = async function (supplayrId) {
  const result2 = await this.aggregate([
    // Stage 1 : get all Sells in specific Supplayr
    {
      $match: { supplayr: supplayrId },
    },
    // Stage 2: Grouping Sells based on supplayrId and calc Prices, weight
    {
      $group: {
        _id: '$supplayr',
        monyePay: { $sum: '$pay_now' },
        totalMonye: { $sum: '$price_allQuantity' }
      },
    },
  ]);

  if (result2.length > 0) {
    await Supplayr.findByIdAndUpdate(supplayrId, {
      pricePay_sell: result2[0].monyePay,
      totalPrice_sell: result2[0].totalMonye,
    });
    console.log(result2[0].monyePay);
  }
};

Sell_supplayrSchema.statics.takeMoney_ds = async function (supplayrId, monye_all) {
  await Supplayr.findByIdAndUpdate(supplayrId, {
    $inc: { priceOn_sell: +monye_all },
  });
};

Sell_supplayrSchema.statics.takeMoney_bs = async function (supplayrId, monye_Pay) {
  await Supplayr.findByIdAndUpdate(supplayrId, {
    $inc: { priceOn_sell: -monye_Pay },
  });
};


Sell_supplayrSchema.statics.allCalc_ds = async function (supplayrId, monye_all) {
  await Supplayr.findByIdAndUpdate(supplayrId, {
    $inc: { moneyFor_me: +monye_all },
  });
};

Sell_supplayrSchema.statics.allCalc_bs = async function (supplayrId, monye_Pay) {
  await Supplayr.findByIdAndUpdate(supplayrId, {
    $inc: { moneyFor_me: -monye_Pay },
  });
};




Sell_supplayrSchema.post('save', async function () {
  await this.constructor.updateProductWeightS(this.product, this.o_wieght);
  await this.constructor.removeFromWarehouse(this.product_code, this.o_wieght);
  await this.constructor.AddmoneyAndtakeMoneyS(this.supplayr);
  await this.constructor.takeMoney_ds(this.supplayr, this.price_allQuantity);
  await this.constructor.takeMoney_bs(this.supplayr, this.pay_now);
  await this.constructor.allCalc_ds(this.supplayr, this.price_allQuantity);
  await this.constructor.allCalc_bs(this.supplayr, this.pay_now);
});

const Sell_supplayr = mongoose.model('Sell_supplayr', Sell_supplayrSchema);

module.exports = Sell_supplayr;
