const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const Tax_supplayr = require('../models/Tax_supplayrModel');
const Supplayr = require('../models/SupplayrModel');





// @desc    Get list of Tax_supplayr
// @route   GET /api/v1/Tax_supplayrs
// @access  Public
exports.getTax_supplayrs = factory.getAll(Tax_supplayr,'Tax_supplayr');

// @desc    Get specific Tax_supplayr by id
// @route   GET /api/v1/Tax_supplayr/:id
// @access  Public
exports.getTax_supplayr = factory.getOne(Tax_supplayr,'supplayr');

// @desc    Create Tax_supplayr
// @route   POST  /api/v1/Tax_supplayr
// @access  Private
exports.createTax_supplayr = factory.createOne(Tax_supplayr);
// @desc    Update specific Tax_supplayr
// @route   PUT /api/v1/Tax_supplayr/:id
// @access  Private
exports.updateTax_supplayr = factory.updateOne(Tax_supplayr);

// @desc    Delete specific Tax_supplayr
// @route   DELETE /api/v1/Tax_supplayr/:id
// @access  Private
exports.deleteTax_supplayr = asyncHandler(async (req, res, next) => {
    // Find the document before deletion
    const oldDocument = await Tax_supplayr.findById(req.params.id);

    if (!oldDocument) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
      // Reverse the financial changes
       const supplayr = await Supplayr.findById(oldDocument.supplayr);
        if (supplayr) {
          supplayr.price_pay -= oldDocument.netAmount;
          supplayr.price_on += oldDocument.netAmount;
          supplayr.total_price += oldDocument.netAmount;
          supplayr.moneyOn_me += oldDocument.netAmount;
          supplayr.dis_count = (supplayr.dis_count || 0) - 1;
          await supplayr.save();
     }

    // Delete the document
    const document = await Tax_supplayr.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    
    res.status(204).json({ data: null });
  });


  exports.updateTax_supplayr = asyncHandler(async (req, res, next) => {
    // جلب الوثيقة القديمة
    const oldDocument = await Tax_supplayr.findById(req.params.id);

    if (!oldDocument) {
      return next(new ApiError(`No document found for this ID: ${req.params.id}, 404`));
    }

    // التحقق من التغييرات في الحقول
    const discountChanged = req.body.discountRate !== undefined && req.body.discountRate !== oldDocument.discountRate;
    const taxChanged = req.body.taxRate !== undefined && req.body.taxRate !== oldDocument.taxRate;
    const amountChanged = req.body.amount !== undefined && req.body.amount !== oldDocument.amount;

    // حفظ القيم القديمة لحساب الفرق
    let oldDiscount = oldDocument.discountAmount;
    let oldTax = oldDocument.taxAmount;
    let oldAmount = oldDocument.amount;

    // إذا كان هناك تغيير، حساب القيم الجديدة
    let newDiscount = oldDocument.discountRate;
    let newTax = oldDocument.taxRate;
    let newAmount = oldDocument.amount;

    if (discountChanged) {
      newDiscount = req.body.discountRate;
    }
    if (taxChanged) {
      newTax = req.body.taxRate;
    }
    if (amountChanged) {
      newAmount = req.body.amount;
    }

    // حساب قيم الخصم والضرائب الجديدة
    const newDiscountAmount = (newDiscount / 100) * newAmount;
    const newTaxAmount = (newTax / 100) * newAmount;
    const newNetAmount = newTaxAmount - newDiscountAmount;

    // تحديث الوثيقة في قاعدة البيانات
    const document = await Tax_supplayr.findByIdAndUpdate(req.params.id, {
      ...req.body,
      discountAmount: newDiscountAmount,
      taxAmount: newTaxAmount,
      netAmount: newNetAmount
    }, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new ApiError(`No document for this id ${req.params.id}, 404`));
    }

    // حساب الفرق في القيم
    const discountDifference = newDiscountAmount - oldDiscount;
    const taxDifference = newTaxAmount - oldTax;
    const netDifference = newNetAmount - (oldTax - oldDiscount);

    // جلب المورد وتحديث حسابه بناءً على الفرق
    const supplayr = await Supplayr.findById(document.supplayr);
    if (supplayr) {
        supplayr.price_pay -= netDifference;
        supplayr.price_on += netDifference;
        supplayr.total_price += netDifference;
        supplayr.moneyOn_me += netDifference;
        supplayr.dis_count = (supplayr.dis_count || 0) + (discountDifference !== 0 ? 1 : 0); // تحديث العداد إذا كان هناك تغيير في الخصم
        await supplayr.save();
    }

    // إعادة الاستجابة مع الوثيقة المحدثة
    res.status(200).json({ data: document });
});