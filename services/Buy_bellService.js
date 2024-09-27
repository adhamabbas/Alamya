
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


  exports.exportSupplierChecksToExcel = asyncHandler(async (req, res, next) => {
    const { supplayrId } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(supplayrId)) {
      return next(new ApiError('Invalid supplier ID', 400));
    }
  
    // الحصول على جميع الفواتير الخاصة بالمورد والمدفوعة بواسطة الشيكات
    const buyBell = await Buy_bell.find({
      supplayr: supplayrId,
      payment_method: 'check', // فقط الفواتير المدفوعة بواسطة الشيكات
    }).populate({ path: 'supplayr', select: 'supplayr_name' });
  
    if (!buyBell.length) {
      return next(new ApiError(`No checks found for supplier with ID: ${supplayrId}, 404`));
    }
  
    // إعداد Workbook جديد وورقة عمل
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Supplier Checks');
  
    // إضافة صف الرأس إلى الورقة
    worksheet.addRow(['اسم المورد', 'تاريخ الإدخال', 'تاريخ الشيك', 'المبلغ', 'اسم البنك', 'رقم الشيك', 'الملاحظات']).font = { bold: true };
  
    // تهيئة مصفوفة لتخزين جميع البيانات
    const checkEntries = [];
  
    buyBell.forEach(bell => {
      // التأكد من أن الحقل Entry_date و check_date معرفين
      const entryDate = bell.Entry_date ? new Date(bell.Entry_date) : new Date(); // استخدم تاريخ الإدخال أو التاريخ الحالي
      const checkDate = bell.check_date ? new Date(bell.check_date) : ''; // إذا لم يكن هناك تاريخ شيك، نتركه فارغًا
  
      // إضافة بيانات الشيك إلى المصفوفة
      checkEntries.push([
        bell.supplayr.supplayr_name, // اسم المورد
        entryDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }), // تاريخ الإدخال
        checkDate ? checkDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }) : '', // تاريخ الشيك
        bell.pay_bell, // المبلغ
        bell.bank_name, // اسم البنك
        bell.check_number, // رقم الشيك
        bell.Notes || '' // الملاحظات
      ]);
    });
  
    // إضافة البيانات إلى الورقة
    checkEntries.forEach(entry => worksheet.addRow(entry));
  
    // إعداد حجم الأعمدة
    for (let i = 1; i <= 7; i++) {
      worksheet.getColumn(i).width = 30;
      worksheet.getColumn(i).alignment = { horizontal: 'center' };
    }
  
    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=supplier_${supplayrId}_checks.xlsx`);
  
    // كتابة الملف إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  });