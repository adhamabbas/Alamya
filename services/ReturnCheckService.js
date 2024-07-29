const asyncHandler = require('express-async-handler');
const ReturnedCheck = require('../models/ReturnCheckModel');
const Clint = require('../models/ClintModel');
const ApiError = require('../utils/apiError');

// إنشاء شيك مرتجع
exports.createReturnedCheck = asyncHandler(async (req, res, next) => {
  const { clint, amount ,user,num ,date} = req.body;

  // تحقق من وجود العميل باستخدام المعرف
  const clint_ = await Clint.findById(clint);
  if (!clint_) {
    return next(new ApiError('Client not found', 404));
  }

  // تحقق من أن المبلغ هو رقم صالح
  if (isNaN(amount)) {
    return next(new ApiError('Invalid amount value', 400));
  }

  // إنشاء الشيك المرتجع
  const returnedCheck = await ReturnedCheck.create({ clint, amount ,user, num ,date});

  await Clint.findByIdAndUpdate(clint, {
    $inc: { money_pay: -amount, money_on: amount },
  });

  res.status(201).json({ data: returnedCheck });
});

// الحصول على جميع الشيكات المرتجعة
exports.getAllReturnedChecks = asyncHandler(async (req, res) => {
  const returnedChecks = await ReturnedCheck.find().populate('clint').populate('user');
  res.status(200).json({ results: returnedChecks.length, data: returnedChecks });
});
