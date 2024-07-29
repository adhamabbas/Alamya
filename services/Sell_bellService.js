const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const Sell_bell = require('../models/Sell_bellModel');
const Clint = require('../models/ClintModel');

// @desc    Get list of Sell
// @route   GET /api/v1/Sells
// @access  Public
exports.getSell_bells = factory.getAll(Sell_bell, 'Sell_bell');

// @desc    Get specific Sell_bell by id
// @route   GET /api/v1/Sells/:id
// @access  Public
exports.getSell_bell = factory.getOne(Sell_bell, 'clint');

// @desc    Create Sell_bell
// @route   POST /api/v1/Sells
// @access  Private
exports.createSell_bell = factory.createOne(Sell_bell);

// @desc    Update specific Sell_bell
// @route   PUT /api/v1/Sells/:id
// @access  Private
exports.updateSell_bell = asyncHandler(async (req, res, next) => {
  const oldDocument = await Sell_bell.findById(req.params.id);

  if (!oldDocument) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }

  const payBellChanged = req.body.payBell !== undefined && req.body.payBell !== oldDocument.payBell;
  let oldPayBell = 0;

  if (payBellChanged) {
    oldPayBell = oldDocument.payBell;
  }

  const document = await Sell_bell.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }

  if (payBellChanged) {
    const newPayBell = req.body.payBell;
    await document.constructor.takeMoney_d(document.clint, newPayBell - oldPayBell);
  }

  res.status(200).json({ data: document });
});

// @desc    Delete specific Sell_bell
// @route   DELETE /api/v1/Sells/:id
// @access  Private
exports.deleteSell_bell = asyncHandler(async (req, res, next) => {
  const oldDocument = await Sell_bell.findById(req.params.id);

  if (!oldDocument) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }
  const clint = await Clint.findById(oldDocument.clint);
  if (clint) {
    clint.money_pay -= oldDocument.payBell;
    clint.money_on += oldDocument.payBell;
    await clint.save();
}
  
  const document = await Sell_bell.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    
    res.status(204).json({ data: null });
  });