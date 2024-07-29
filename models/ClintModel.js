const mongoose = require('mongoose');


const clintSchema = new mongoose.Schema(
  {
    
    clint_name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },

    money_on: {
      type: Number,
      required: true,
      default:0,
    },
    money_pay: {
      type: Number,
      required: true,
      default:0,
    },
    total_monye: {
      type: Number,
      required: true,
      default:0,
    },
    disCount: {
      type: Number,
      required: true,
      default:0,
    },
    

  },
  { timestamps: true }
);


const Clint = mongoose.model('Clint', clintSchema);

module.exports = Clint ;
