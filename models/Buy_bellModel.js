const mongoose = require('mongoose');
const User = require('./userModel');
const Supplayr = require('./SupplayrModel');

const Buy_bellSchema = new mongoose.Schema(
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
    pay_bell: {
      type: Number,
      required: true,
      default: 0,
    },
    
    payment_method: {
      type: String,
      enum: ['cash', 'check'],
      required: true,
    },
    bank_name: {
      type: String,
      required: function () {
        return this.paymentMethod === 'check';
      },
    },
    check_number: {
      type: String,
      required: function () {
        return this.payment_method === 'check';
      },
    },
    check_date: {
      type: String,
      required: function () {
      return this.payment_method === 'check';
      },
     },
     Entry_date: {
      type: Date,
      default: Date.now,
    },
      Notes: {
      type:String,
      trim: true,
      default:'',
    },
  },
  { timestamps: true }
);

Buy_bellSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name _id' })
      .populate({ path: 'supplayr', select: 'supplayr_name price_on price_pay total_price _id' });
  next();
});

Buy_bellSchema.statics.takeMoney_d = async function (supplayrid, amount) {
  const supplayr_ = await Supplayr.findById(supplayrid);
  if (!supplayr_) {
    throw new Error(`supplayrt with id ${supplayrid} not found`);
  }
  await Supplayr.findByIdAndUpdate(supplayrid,
    { $inc: { price_pay: amount , price_on: -amount , moneyOn_me: -amount} },
    { new: true }
  );
};



Buy_bellSchema.post('save', async function () {
  await this.constructor.takeMoney_d(this.supplayr, this.pay_bell);
  
});

Buy_bellSchema.post('findOneAndUpdate', async function (doc) {
      if (doc && doc.payBell !== undefined) {
        const oldDocument = await this.model.findById(doc._id).exec();
        if (oldDocument) {
          const oldPayBell = oldDocument.pay_bell;
          const newPayBell = doc.pay_bell;
          await doc.constructor.takeMoney_d(doc.supplayr, newPayBell - oldPayBell);
          
        }
      }
    });
 

const Buy_bell = mongoose.model('Buy_bell', Buy_bellSchema);

module.exports = Buy_bell;
