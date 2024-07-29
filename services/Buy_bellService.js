
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const factory = require('./handlersFactory');
const Buy_bell = require('../models/Buy_bellModel');
const Supplayr =require('../models/SupplayrModel');





// @desc    Get list of Buy
// @route   GET /api/v1/Buys
// @access  Public
exports.getBuy_bells = factory.getAll(Buy_bell,'Buy_bell');

// @desc    Get specific Buy_bell by id
// @route   GET /api/v1/Buys/:id
// @access  Public
exports.getBuy_bell = factory.getOne(Buy_bell,'supplayr');

// @desc    Create Buy_bell
// @route   POST  /api/v1/Buys
// @access  Private
exports.createBuy_bell = factory.createOne(Buy_bell);
// @desc    Update specific Buy_bell
// @route   PUT /api/v1/Buys/:id
// @access  Private
exports.updateBuy_bell =  asyncHandler(async (req, res, next) => {
  const oldDocument = await Buy_bell.findById(req.params.id);

  if (!oldDocument) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }

  const payBellChanged = req.body.pay_bell !== undefined && req.body.pay_bell !== oldDocument.pay_bell;
  
  let oldPayBell = 0;

  if (payBellChanged) {
    oldPayBell = oldDocument.pay_bell;
  }
 

  const document = await Buy_bell.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }

  if (payBellChanged) {
    const newPayBell = req.body.pay_bell;
    await document.constructor.takeMoney_d(document.supplayr,newPayBell - oldPayBell);
  }



  res.status(200).json({ data: document });
});

// @desc    Delete specific Buy_bell
// @route   DELETE /api/v1/Buys/:id
// @access  Private
exports.deleteBuy_bell = asyncHandler(async (req, res, next) => {
  const oldDocument = await Buy_bell.findById(req.params.id);

  if (!oldDocument) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }
  const supplayr = await Supplayr.findById(oldDocument.supplayr);
  if (supplayr) {
    supplayr.price_pay -= oldDocument.pay_bell;
    supplayr.price_on += oldDocument.pay_bell;
    await supplayr.save();
}
  
  const document = await Buy_bell.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    
    res.status(204).json({ data: null });
  });


