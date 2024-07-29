const mongoose = require('mongoose');


const supplayrSchema = new mongoose.Schema(
  {
    
    supplayr_name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },

    price_on: {
      type: Number,
      required: true,
      default:0,
    },

    price_pay: {
      type: Number,
      required: true,
      default:0,
    },
    
    total_price: {
      type: Number,
      required: true,
      default:0,
    },
    
    priceOn_sell: {
      type: Number,
      required: true,
      default:0,
    },

    pricePay_sell: {
      type: Number,
      required: true,
      default:0,
    },
    
    totalPrice_sell: {
      type: Number,
      required: true,
      default:0,
    },
    moneyOn_me: {
      type: Number,
      required: true,
      default:0,
    },
    
    moneyFor_me: {
      type: Number,
      required: true,
      default:0,
    },
    dis_count: {
      type: Number,
      required: true,
      default:0,
    },
  },
  { timestamps: true }
);


const Supplayr = mongoose.model('Supplayr', supplayrSchema);

module.exports = Supplayr ;
