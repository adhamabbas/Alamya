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
  
    // إعداد Workbook جديد وورقة عمل واحدة
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('شيكات العملاء');
  
    // إضافة صف الرأس إلى الورقة
    worksheet.addRow(['اسم العميل', 'تاريخ الإدخال', 'تاريخ الشيك', 'المبلغ', 'اسم البنك', 'رقم الشيك', 'الملاحظات']).font = { bold: true };
  
    const allEntries = []; // تهيئة مصفوفة لتخزين جميع البيانات للترتيب حسب التاريخ
  
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
  
      // تجميع بيانات الفواتير
      const seenCheckNumbers = new Set(); // لتتبع الشيكات المتشابهة
  
      bell.forEach(bl => {
        const isReturnedCheck = chBack.some(ch => ch.num === bl.checkNumber);
      
        // إذا كان الشيك مرتدًا ولم تتم إضافته سابقًا
        if (isReturnedCheck && !seenCheckNumbers.has(bl.checkNumber)) {
          const returnedCheck = chBack.find(ch => ch.num === bl.checkNumber);
      
          allEntries.push({
            type: 'checkBack',
            date: returnedCheck.createdAt, // استخدام تاريخ ارتداد الشيك
            row: [
              client.clint_name, // إضافة اسم العميل
              returnedCheck.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }), // تاريخ ارتداد الشيك
              '', // لا يوجد تاريخ شيك
              returnedCheck.amount,
              returnedCheck.bank_name,
              returnedCheck.num,
              'شيك مرتد'
            ],
            color: 'FFFF0000' // اللون الأحمر للشيكات المرتدة
          });
      
          // إضافة رقم الشيك إلى قائمة الشيكات التي تمت معالجتها
          seenCheckNumbers.add(bl.checkNumber);
        } 
        // إذا لم يكن الشيك مرتدًا ولم تتم إضافته سابقًا
        else if (!isReturnedCheck && !seenCheckNumbers.has(bl.checkNumber)) {
          const entryDate = bl.Entry_date ? new Date(bl.Entry_date) : new Date(); // تاريخ الإدخال أو التاريخ الحالي
          const checkDate = bl.checkDate ? new Date(bl.checkDate) : ''; // إذا لم يكن هناك تاريخ شيك، اتركه فارغًا
      
          allEntries.push({
            type: 'bell',
            date: entryDate, // استخدام تاريخ الإدخال
            row: [
              client.clint_name, // إضافة اسم العميل
              entryDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }), // عرض تاريخ الإدخال
              checkDate ? checkDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }) : '', // عرض تاريخ الشيك إذا كان موجودًا
              bl.payBell,
              bl.bankName,
              bl.checkNumber,
              bl.Notes || ''
            ],
            color: '013220' // اللون البرتقالي للتحصيلات
          });
      
          // إضافة رقم الشيك إلى قائمة الشيكات التي تمت معالجتها
          seenCheckNumbers.add(bl.checkNumber);
        }
      });
  
      // إضافة بيانات الشيكات المرتدة التي لم تظهر بعد
      chBack.forEach(ch => {
        if (!seenCheckNumbers.has(ch.num)) {
          allEntries.push({
            type: 'checkBack',
            date: ch.createdAt, // استخدام تاريخ ارتداد الشيك
            row: [
              client.clint_name, // إضافة اسم العميل هنا
              ch.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }), // عرض تاريخ الإدخال (ارتداد الشيك)
              '', // لا يوجد تاريخ شيك هنا
              ch.amount,
              ch.bank_name,
              ch.num,
              'شيك مرتد'
            ],
            color: 'FF0000' // اللون الأزرق للشيكات المرتدة
          });
  
          seenCheckNumbers.add(ch.num); // إضافة رقم الشيك لمنع التكرار
        }
      });
    }
  
    // ترتيب جميع الإدخالات حسب تاريخ الإدخال من الأقدم إلى الأحدث
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
  
    // إضافة البيانات المرتبة إلى الورقة
    allEntries.forEach(entry => {
      const row = worksheet.addRow(entry.row);
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: entry.color }
      };
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.alignment = { horizontal: 'center' };
    });
  
    // إعداد حجم الأعمدة
    for (let i = 1; i <= 7; i++) {
      worksheet.getColumn(i).width = 30;
      worksheet.getColumn(i).alignment = { horizontal: 'center' };
    }
  
    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=all_clients_details.xlsx`);
  
    // كتابة الملف إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  });