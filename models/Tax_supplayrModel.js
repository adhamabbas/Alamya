const mongoose = require('mongoose');
const Supplayr = require('./SupplayrModel');
const User = require('./userModel');

const tax_supplayrSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    supplayr: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplayr',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    taxRate: {
      type: Number,
      default:0,
    },
    discountRate: {
      type: Number,
      default:0,
    },
    netAmount: {
      type: Number,
      
    },
    taxAmount: {
      type: Number,
      
    },
    discountAmount: {
      type: Number,
      
    },
    Notes: {
      type:String,
      trim: true,
      default:'',
      
    },
  },
  { timestamps: true }
);


tax_supplayrSchema.pre(/^find/, function (next) {
    this.populate({ path: 'user', select: 'name _id' })
       .populate({ path: 'supplayr', select: 'supplayr_name price_on price_pay total_price _id dis_count' });
  
    next();
  });

tax_supplayrSchema.pre('save', async function (next) {
  const tax = this;
  
  // Calculate the tax and discount amounts
  tax.taxAmount = Math.floor(tax.amount * (tax.taxRate / 100));
  tax.discountAmount = Math.floor(tax.amount * (tax.discountRate / 100));
  tax.netAmount =  tax.taxAmount - tax.discountAmount;
  
  // Update the client's financials
  const supplayr = await Supplayr.findById(tax.supplayr);
  if (supplayr) {
    supplayr.price_pay += tax.netAmount;
    supplayr.price_on -= tax.netAmount;
    supplayr.total_price -= tax.netAmount;
    supplayr.moneyOn_me -= tax.netAmount;
    supplayr.dis_count = (supplayr.dis_count || 0) + 1;
   
    await supplayr.save();
  }

  next();
});

/*tax_supplayrSchema.post('findOneAndDelete', async function (doc, next) {
  if (doc) {
    // Reverse the financial changes
    const supplayr = await Supplayr.findById(doc.supplayr);
    if (supplayr) {
      supplayr.price_pay -= doc.netAmount;
      supplayr.price_on += doc.netAmount;
      supplayr.total_price += doc.netAmount;
      supplayr.moneyOn_me += doc.netAmount;
      supplayr.dis_count = (supplayr.dis_count || 0) - 1;
      await supplayr.save();
    }
  }
  next();
});*/

const Tax_supplayr = mongoose.model('Tax_supplayr', tax_supplayrSchema);

module.exports = Tax_supplayr;
