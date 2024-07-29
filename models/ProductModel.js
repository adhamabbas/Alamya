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
      default:0,
    },
    wieght: {
      type: Number,
      required: true,
      default:0,
    },

  },
  { timestamps: true }
);


const Product = mongoose.model('Product', productSchema);

module.exports = Product;
