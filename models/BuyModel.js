const mongoose = require('mongoose');
const User = require('./userModel');
const Product = require('./ProductModel');
const Supplayr = require('./SupplayrModel');
const Warehouse = require('./WarehouseModel');

const BuySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    supplayr: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplayr',
    },
    size: {
      type: Number,
      required: true,
    },
    E_wieght: {
      type: Number,
      required: true,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
    product_code: {
      type: Number,
      required: true,
    },
    price_Kilo: {
      type: Number,
      required: true,
    },
    price_all: {
      type: Number,
      required: true,
    },
    pay: {
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

BuySchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name -_id' })
    .populate({ path: 'product', select: 'type avg_price wieght _id' })
    .populate({ path: 'supplayr', select: 'supplayr_name price_pay price_on total_price _id ' });

  next();
});

BuySchema.statics.updateWarehouse = async function (user,supplayr, product, product_code, E_wieght, size) {
  const existingWarehouse = await Warehouse.findOne({ product_code });
  if (existingWarehouse) {
    await Warehouse.findByIdAndUpdate(existingWarehouse._id, {
      weight: E_wieght,
      size
    }, { new: true, runValidators: true });
  } else {
    await Warehouse.create({ user,supplayr, product, product_code, weight: E_wieght, size });
  }
};

BuySchema.statics.calcAveragePrice = async function (productId) {
  const result = await this.aggregate([
    {
     $match: { product: mongoose.Types.ObjectId(productId) },
    },
    {
      $group: {
        _id: '$product',
        avg_price: { $avg: '$price_Kilo' },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      avg_price: result[0].avg_price.toFixed(2),
    });
  }
};

BuySchema.statics.updateProductWeight = async function (productId, weightBuy) {
  await Product.findByIdAndUpdate(productId, {
    $inc: { wieght: +weightBuy },
  });
};


BuySchema.statics.takeMoney_d = async function (supplayrId,priceall,pricePay) {
  const Po = priceall - pricePay ;
  await Supplayr.findByIdAndUpdate(supplayrId, {
    $inc: { price_on: +Po ,total_price:+priceall , price_pay: +pricePay},
  });
};



BuySchema.statics.allcalc_d = async function (supplayrId,price_all,price_Pay) {
  const mOn = price_all - price_Pay ;
  await Supplayr.findByIdAndUpdate(supplayrId, {
    $inc: { moneyOn_me: + mOn },
  });
};



BuySchema.post('save', async function () {
  await this.constructor.updateWarehouse(this.user, this.supplayr,this.product, this.product_code, this.E_wieght, this.size);
  await this.constructor.calcAveragePrice(this.product);
  await this.constructor.updateProductWeight(this.product, this.E_wieght);
  await this.constructor.takeMoney_d(this.supplayr,this.price_all,this.pay);
  await this.constructor.allcalc_d(this.supplayr, this.price_all,this.pay);
});

BuySchema.post('findOneAndUpdate', async function (doc) {
  if (doc && doc.pay !== undefined) {
    const oldDocument = await this.model.findById(doc._id).exec();
    if (oldDocument) {
      const oldPayBell = oldDocument.pay;
      const newPayBell = doc.pay;
      await doc.constructor.takeMoney_d(doc.supplayr,0 ,newPayBell - oldPayBell);
      await doc.constructor.allcalc_d(doc.supplayr,0,newPayBell - oldPayBell);
    }
  }
  if (doc && doc.price_all !== undefined) {
    const oldDocument = await this.model.findById(doc._id).exec();
    if (oldDocument) {
      const oldPayBell2 = oldDocument.price_all;
      const newPayBell2 = doc.price_all;
      await doc.constructor.takeMoney_d(doc.supplayr,newPayBell2 - oldPayBell2,0);
      await doc.constructor.allcalc_d(doc.supplayr,newPayBell2 - oldPayBell2,0);
    }
  }
});

const Buy = mongoose.model('Buy', BuySchema);

module.exports = Buy;
