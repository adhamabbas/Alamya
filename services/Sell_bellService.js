const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const ExcelJS = require('exceljs');
const check_back = require('../models/ReturnCheckModel'); // Model for ReturnedCheck
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


  

  
  exports.exportChecksToExcel = asyncHandler(async (req, res, next) => {
    // الحصول على جميع العملاء
    const allClients = await Clint.find();
  
    if (!allClients.length) {
      return next(new ApiError('No clients found', 404));
    }
  
    // إعداد Workbook جديد
    const workbook = new ExcelJS.Workbook();
  
    for (const client of allClients) {
      // الحصول على جميع الفواتير الخاصة بالعميل
      const bell = await Sell_bell.find({
        clint: client._id,
        paymentMethod: 'check' // فقط الفواتير المدفوعة بواسطة الشيكات
      }).populate({ path: 'clint', select: 'clint_name' });
  
      // الحصول على الشيكات المرتدة الخاصة بالعميل
      const chBack = await check_back.find({ clint: client._id })
        .populate({ path: 'clint', select: 'clint_name money_on' });
  
      if (!bell.length && !chBack.length) {
        continue; // الانتقال للعميل التالي إذا لم يكن هناك بيانات
      }
  
      // إنشاء ورقة عمل جديدة لكل عميل
      const worksheet = workbook.addWorksheet(client.clint_name || 'عميل');
  
      // تهيئة مصفوفة لتخزين جميع البيانات للترتيب حسب التاريخ
      const allEntries = [];
  
      // تجميع بيانات الفواتير
      const seenCheckNumbers = new Set(); // لتتبع الشيكات المتشابهة
  
      bell.forEach(bl => {
        const isReturnedCheck = chBack.some(ch => ch.num === bl.checkNumber);
      // التحقق إذا كان الشيك مرتدًا
  
        // إذا كان الشيك مرتدًا، نضيفه مرة واحدة فقط بتاريخ ارتداد الشيك
        if (isReturnedCheck && !seenCheckNumbers.has(bl.checkNumber)) {
          const returnedCheck = chBack.find(ch => ch.num === bl.checkNumber);
  
          allEntries.push({
            type: 'checkBack',
            date: returnedCheck.createdAt,
            row: [
              client.clint_name, // إضافة اسم العميل هنا
              returnedCheck.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
              returnedCheck.amount,
              returnedCheck.bank_name,
              returnedCheck.num,
              returnedCheck.date,
              'شيك مرتد'
            ],
            color: 'FFFF0000' // اللون الأحمر لتمييز الشيكات المرتدة
          });
  
          seenCheckNumbers.add(bl.checkNumber); // إضافة رقم الشيك إلى القائمة
        } else if (!isReturnedCheck) {
          
          allEntries.push({
            type: 'bell',
            date: bl.checkDate, // استخدام تاريخ الشيك لترتيب الشيكات
            row: [
              client.clint_name, // إضافة اسم العميل هنا
              bl.checkDate,
              bl.payBell,
              bl.bankName,
              bl.checkNumber,
              bl.checkDate,
              bl.Notes || ''
            ],
            color: 'FFFFA500' // اللون البرتقالي للتحصيلات
          });
        }
      });
  
      // إضافة بيانات الشيكات المرتدة التي لم تظهر بعد
      chBack.forEach(ch => {

        if (!seenCheckNumbers.has(ch.num)) {
          allEntries.push({
            type: 'checkBack',
            date: ch.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
            row: [
              client.clint_name, // إضافة اسم العميل هنا
              ch.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
              ch.amount,
              ch.bank_name,
              ch.num,
              ch.date,
              'شيك مرتد'
            ],
            color: 'FF3F51B5' // اللون الأزرق للشيكات المرتدة
          });
        }
      });
  
      // ترتيب جميع الإدخالات حسب تاريخ الشيك من الأقرب إلى الأبعد
      allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
  
      // إضافة صف الرأس إلى الورقة
      worksheet.addRow(['اسم العميل', 'التاريخ', 'المبلغ', 'اسم البنك', 'رقم الشيك', 'تاريخ الشيك', 'الملاحظات']).font = { bold: true };
  
      // إضافة البيانات المرتبة إلى الورقة
      allEntries.forEach(entry => {
        const row = worksheet.addRow(entry.row);
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: entry.color }
        };
        row.alignment = { horizontal: 'center' };
      });
  
      // إضافة الرصيد المتبقي في نهاية الجدول
      const finalRow = worksheet.addRow(['', '', '', '', '', 'الرصيد المتبقي:']);
      finalRow.font = { bold: true };
      finalRow.alignment = { horizontal: 'right' };
  
      const finalBalanceRow = worksheet.addRow(['', '', '', '', '', client.money_on]);
      finalBalanceRow.font = { bold: true, color: { argb: 'FF000000' } };
      finalBalanceRow.alignment = { horizontal: 'right' };
  
      // إعداد حجم الأعمدة
      for (let i = 1; i <= 7; i++) {
        worksheet.getColumn(i).width = 30;
        worksheet.getColumn(i).alignment = { horizontal: 'center' };
      }
    }
  
    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=all_clients_details.xlsx`);
  
    // كتابة الملف إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  });