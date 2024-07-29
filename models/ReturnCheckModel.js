const mongoose = require('mongoose');
const Clint = require('./ClintModel');

const ReturnedCheckSchema = new mongoose.Schema(
  {

   user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    clint: {
      type: mongoose.Schema.ObjectId,
      ref: 'Clint',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
     num:{
       type:Number,
     },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } 
);
ReturnedCheckSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name -_id' })
      .populate({ path: 'clint', select: 'clint_name money_pay money_on _id' });

  next();
});


const ReturnedCheck = mongoose.model('ReturnedCheck', ReturnedCheckSchema);

module.exports = ReturnedCheck;
