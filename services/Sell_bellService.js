const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const xlsx = require('xlsx');
const ReturnedCheck = require('../models/ReturnCheckModel'); // Model for ReturnedCheck
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


  

  
  // دالة لإنشاء ملف إكسيل مع تمييز الشيكات المرتدة
  exports.exportChecksToExcel = asyncHandler(async (req, res) => {
    // البحث عن جميع الشيكات المرتدة من نموذج ReturnedCheck
    const returnedChecks = await ReturnedCheck.find().select('num');
  
    // استخراج أرقام الشيكات المرتدة
    const returnedCheckNumbers = returnedChecks.map(check => check.num);
  
    // البحث عن جميع الشيكات في نموذج Sell_bell
    const checks = await Sell_bell.find({ paymentMethod: 'check' })
      .populate({ path: 'user', select: 'name _id' })
      .populate({ path: 'clint', select: 'clint_name _id' })
      .select('clint bankName checkNumber checkDate payBell');
  
    // التحقق إذا كانت هناك أي شيكات
    if (checks.length === 0) {
      return res.status(404).json({ message: 'لا توجد أي شيكات للعملاء.' });
    }
  
    // تجهيز بيانات الإكسيل
    const data = [['Client Name', 'Bank Name', 'Check Number', 'Check Date', 'Check Amount']]; // عنوان الأعمدة
  
    checks.forEach(check => {
      const isReturned = returnedCheckNumbers.includes(check.checkNumber); // التحقق إذا كان الشيك مرتدًا
      const row = [
        check.clint.clint_name,
        check.bankName,
        check.checkNumber,
        check.checkDate,
        check.payBell
      ];
  
      // إضافة معلومات الشيك إلى البيانات
      data.push({
        row,
        isReturned, // تحديد إذا كان الشيك مرتدًا لتلوينه لاحقًا
      });
    });
  
    // إنشاء ورقة العمل
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([]);
  
    // كتابة البيانات إلى ورقة العمل
    data.forEach((item, index) => {
      xlsx.utils.sheet_add_aoa(ws, [item.row], { origin: -1 });
  
      // إذا كان الشيك مرتدًا، نقوم بتلوين الصف
      if (item.isReturned) {
        const range = `A${index + 1}:E${index + 1}`;
        ws[range].s = {
          fill: {
            fgColor: { rgb: 'FF0000' }, // تلوين بالخلفية الحمراء
          },
        };
      }
    });
  
    // إضافة الورقة إلى المصنف
    xlsx.utils.book_append_sheet(wb, ws, 'Checks');
  
    // كتابة الملف
    const filePath = 'checks_report.xlsx';
    xlsx.writeFile(wb, filePath);
  
    // إرسال ملف الإكسيل كاستجابة
    res.download(filePath, 'checks_report.xlsx', (err) => {
      if (err) {
        console.error('خطأ أثناء تحميل الملف:', err);
        res.status(500).json({ message: 'حدث خطأ أثناء تحميل الملف.' });
      }
    });
  });
  
 