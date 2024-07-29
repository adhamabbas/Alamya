const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const Tax_clint = require('../models/Tax_clintModel');
const Clint = require('../models/ClintModel');





// @desc    Get list of Tax_clint
// @route   GET /api/v1/Tax_clints
// @access  Public
exports.getTax_clints = factory.getAll(Tax_clint,'Tax_clint');

// @desc    Get specific Tax_clint by id
// @route   GET /api/v1/Tax_clint/:id
// @access  Public
exports.getTax_clint = factory.getOne(Tax_clint,'clint');

// @desc    Create Tax_clint
// @route   POST  /api/v1/Tax_clint
// @access  Private
exports.createTax_clint = factory.createOne(Tax_clint);
// @desc    Update specific Tax_clint
// @route   PUT /api/v1/Tax_clint/:id
// @access  Private
exports.updateTax_clint = factory.updateOne(Tax_clint);

// @desc    Delete specific Tax_clint
// @route   DELETE /api/v1/Tax_clint/:id
// @access  Private
exports.deleteTax_clint = asyncHandler(async (req, res, next) => {
    // Find the document before deletion
    const oldDocument = await Tax_clint.findById(req.params.id);

    if (!oldDocument) {
      return next(new ApiError(`No document for this id ${req.params.id}`, 404));
    }
      // Reverse the financial changes
    const clint = await Clint.findById(oldDocument.clint);
    if (clint) {
      clint.money_pay -= oldDocument.discountAmount;
      clint.money_on -= oldDocument.taxAmount;
      clint.total_monye -= oldDocument.netAmount;
      clint.disCount = (clint.disCount || 0) - 1;
      await clint.save();
    }

    // Delete the document
    const document = await Tax_clint.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    
    res.status(204).json({ data: null });
  });
