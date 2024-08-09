const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
    avg_price: {
      type: Number,
      required: true,
      default: 0,
    },
    wieght: {
      type: Number,
      required: true,
      default: 0,
    },
    wight_money: {
      type: Number,
      default: 0,  // تعيين قيمة ابتدائية
    }
  },
  { timestamps: true }
);

// قبل حفظ المستند، نقوم بحساب wight_money
productSchema.pre('save', function(next) {
  this.wight_money = this.avg_price * this.wieght;
  next();
});

// إذا تم تحديث المستند، نقوم بتحديث wight_money
productSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // إذا تم تحديث avg_price أو wieght، نقوم بحساب wight_money مرة أخرى
  if (update.avg_price !== undefined || update.wieght !== undefined) {
    const product = await this.model.findOne(this.getQuery());
    const new_avg_price = update.avg_price !== undefined ? update.avg_price : product.avg_price;
    const new_wieght = update.wieght !== undefined ? update.wieght : product.wieght;

    this.set({ wight_money: new_avg_price * new_wieght });
  }
  
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
