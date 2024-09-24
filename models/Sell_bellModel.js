const mongoose = require('mongoose');
const User = require('./userModel');
const Clint = require('./ClintModel');

const Sell_bellSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    clint: {
      type: mongoose.Schema.ObjectId,
      ref: 'Clint',
      required: true,
    },
    payBell: {
      type: Number,
      required: true,
      default: 0,
    },
    
    paymentMethod: {
      type: String,
      enum: ['cash', 'check'],
      required: true,
    },

    bankName: {
      type: String,
      required: function () {
        return this.paymentMethod === 'check';
      },
    },
    
    checkNumber: {
      type: String,
      required: function () {
        return this.paymentMethod === 'check';
      },
    },
    checkDate: {
      type: String,
      required: function () {
        return this.paymentMethod === 'check';
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

Sell_bellSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name _id' })
      .populate({ path: 'clint', select: 'clint_name money_on money_pay total_monye _id' });
  next();
});

Sell_bellSchema.statics.takeMoney_d = async function (clint, priceall) {
  const clint_ = await Clint.findById(clint);
  if (!clint_) {
    throw new Error(`Client with id ${clint} not found`);
  }
  await Clint.findByIdAndUpdate(clint,
    { $inc: { money_pay: priceall , money_on: -priceall } },
    { new: true }
  );
};

Sell_bellSchema.post('save', async function () {
  await this.constructor.takeMoney_d(this.clint, this.payBell);
});

Sell_bellSchema.post('findOneAndUpdate', async function (doc) {
  if (doc && doc.payBell !== undefined) {
    const oldDocument = await this.model.findById(doc._id).exec();
    if (oldDocument) {
      const oldPayBell = oldDocument.payBell;
      const newPayBell = doc.payBell;
      await doc.constructor.takeMoney_d(doc.clint, newPayBell - oldPayBell);
    }
  }
});

const Sell_bell = mongoose.model('Sell_bell', Sell_bellSchema);

module.exports = Sell_bell;
