const mongoose = require('mongoose');
const User = require('./userModel');
const Supplayr =require('./SupplayrModel');

const Sell_bellSupplayrSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      supplayr: {
        type: mongoose.Schema.ObjectId,
        ref: 'Supplayr',
      },
      payBell:{
        type: Number,
        required: true,
        default:0,
      },
      paymentMethod: {
        type: String,
        enum: ['cash', 'check'],
        required: true,
      },
      checkNumber: {
        type: String,
        required: function () {
          return this.payment_method === 'check';
        },
      },
      checkDate: {
        type: Date,
        required: function () {
          return this.payment_method === 'check';
        },
      },
    },
    { timestamps: true }
  );
  
  Sell_bellSupplayrSchema.pre(/^find/, function (next) {
    this.populate({ path: 'user', select: 'name -_id' })
      .populate({ path: 'supplayr', select: 'supplayr_name money_pay money_on total_monye -_id' });
  
    next();
  });


  Sell_bellSupplayrSchema.statics.takeMoney_d = async function(supplayrId,priceall) {
    await Supplayr.findByIdAndUpdate(supplayrId, {
       $inc:{money_pay: +priceall},
    });
  };
  
  Sell_bellSupplayrSchema.statics.takeMoney_b = async function(supplayrId,pricePay) {
    await Supplayr.findByIdAndUpdate(supplayrId, {
       $inc:{money_on: -pricePay},
    });
  };

  Sell_bellSupplayrSchema.post('save', async function () {
     await this.constructor.takeMoney_d(this.clint,this.payBell);
     await this.constructor.takeMoney_b(this.clint,this.payBell);
    
   });

  const Sell_bellSupplayr = mongoose.model('Sell_bellSupplayr', Sell_bellSupplayrSchema);

module.exports = Sell_bellSupplayr ;
