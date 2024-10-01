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
    const discountChanged = req.body.discountAmount !== undefined && req.body.discountAmount !== oldDocument.discountAmount;
    const taxChanged = req.body.taxAmount !== undefined && req.body.taxAmount !== oldDocument.taxAmount;
    const netChanged = req.body.netAmount !== undefined && req.body.netAmount !== oldDocument.netAmount;
  
    // حفظ القيم القديمة لحساب الفرق
    let oldDiscount = 0;
    let oldTax = 0;
    let oldNet = 0;
  
    if (discountChanged) {
      oldDiscount = oldDocument.discountAmount;
    }
    if (taxChanged) {
      oldTax = oldDocument.taxAmount;
    }
    if (netChanged) {
      oldNet = oldDocument.netAmount;
    }
  
    // تحديث الوثيقة في قاعدة البيانات
    const document = await Tax_supplayr.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    if (!document) {
      return next(new ApiError(`No document for this id ${req.params.id}, 404`));
    }
  
    // إذا كان هناك تغيير، حساب الفرق وتحديث حساب المورد
    if (discountChanged || taxChanged || netChanged) {
      const newDiscount = req.body.discountAmount || oldDocument.discountAmount;
      const newTax = req.body.taxAmount || oldDocument.taxAmount;
      const newNet = req.body.netAmount || oldDocument.netAmount;
  
      // حساب الفرق لكل من الحقول
      const discountDifference = newDiscount - oldDiscount;
      const taxDifference = newTax - oldTax;
      const netDifference = newNet - oldNet;
  
      // جلب المورد وتحديث حسابه بناءً على الفرق
      const supplayr = await Supplayr.findById(document.supplayr);
      if (supplayr) {
        supplayr.price_pay -= netDifference;
        supplayr.price_on += netDifference;
        supplayr.total_price += netDifference;
        supplayr.moneyOn_me += netDifference;
        supplayr.dis_count = (supplayr.dis_count || 0) - (discountDifference !== 0 ? 1 : 0); // تحديث العداد إذا كان هناك تغيير في الخصم
        await supplayr.save();
      }
    }
  
    // إعادة الاستجابة مع الوثيقة المحدثة
    res.status(200).json({ data: document });
  });