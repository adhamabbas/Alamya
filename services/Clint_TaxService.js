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
//exports.updateTax_clint = factory.updateOne(Tax_clint);

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


  exports.updateTax_clint = asyncHandler(async (req, res, next) => {
    // جلب الوثيقة القديمة
    const oldDocument = await Tax_clint.findById(req.params.id);
  
    if (!oldDocument) {
      return next(new ApiError(`No document found for this ID: ${req.params.id}, 404`));
    }
  
    // التحقق من التغييرات في الحقول
    const discountChanged = req.body.discountRate !== undefined && req.body.discountRate !== oldDocument.discountRate;
    const taxChanged = req.body.taxRate !== undefined && req.body.taxRate !== oldDocument.taxRate;
    const amountChang = req.body.amount !== undefined && req.body.amount !== oldDocument.amount;

  
    // حفظ القيم القديمة لحساب الفرق
    let oldDiscount = 0;
    let oldTax = 0;
    let oldAmount =0;
  
    if (discountChanged) {
      oldDiscount = oldDocument.discountAmount;
    }
    if (taxChanged) {
      oldTax = oldDocument.taxAmount;
    }
   
    if (amountChang) {
      oldAmount = oldDocument.amount;
    }
    // تحديث الوثيقة في قاعدة البيانات
    const document = await Tax_clint.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    if (!document) {
      return next(new ApiError(`No document for this id ${req.params.id}, 404`));
    }
  
    // إذا كان هناك تغيير، حساب الفرق وتحديث حساب العميل
    if (discountChanged || taxChanged || amountChang ) {
      const newDiscount = req.body.discountRate || oldDocument.discountRate;
      const newTax = req.body.taxRate || oldDocument.taxRate;
      const newamount =req.body.amount || oldDocument.amount
      
       const disamount = ((newDiscount/100)* newamount);
       const taxamount =((newTax/100)* newamount) ;
      // حساب الفرق لكل من الحقول
      const discountDifference = disamount - oldDiscount;
      const taxDifference = taxamount - oldTax;
      const netDifference = taxamount - disamount;
  
      // جلب العميل وتحديث حسابه بناءً على الفرق
      const clint = await Clint.findById(document.clint);
      if (clint) {
        clint.money_pay -= discountDifference;
        clint.money_on += taxDifference;
        clint.total_monye += netDifference;
        await clint.save();
      }
      
    }
  
    // إعادة الاستجابة مع الوثيقة المحدثة
    res.status(200).json({ data: document });
  });