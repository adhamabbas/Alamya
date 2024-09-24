const mongoose = require('mongoose'); 
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const ExcelJS = require('exceljs');
const Supplayr = require('../models/SupplayrModel');
const Buy = require('../models/BuyModel');
const Buy_bell = require('../models/Buy_bellModel');
const Supplayr_tax = require('../models/Tax_supplayrModel');

// @desc    Get list of Supplayr
// @route   GET /api/v1/supplayrs
// @access  Public
exports.getSupplayrs = factory.getAll(Supplayr);

// @desc    Get specific Supplayr by id
// @route   GET /api/v1/supplayr/:id
// @access  Public
exports.getSupplayr = factory.getOne(Supplayr);

// @desc    Create Supplayr
// @route   POST  /api/v1/supplayr
// @access  Private
exports.createSupplayr = factory.createOne(Supplayr);

// @desc    Update specific Supplayr
// @route   PUT /api/v1/supplayr/:id
// @access  Private
exports.updateSupplayr = factory.updateOne(Supplayr);

// @desc    Delete specific Supplayr
// @route   DELETE /api/v1/supplayr/:id
// @access  Private
exports.deleteSupplayr = factory.deleteOne(Supplayr);

exports.getSupplayrDetails = asyncHandler(async (req, res, next) => {
  const { supplayrId } = req.params;

  // Get all sales for the supplayr
  const bell = await Buy_bell.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  // Get all purchases for the supplayr
  const buys = await Buy.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  const tax = await Supplayr_tax.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  if (!bell && !buys && !tax) {
    return next(new ApiError(`No transactions found for supplier with ID: ${supplayrId}`, 404));
  }

  res.status(200).json({ buys, bell, tax });
});

exports.exportSupplayrDetailsToExcel = asyncHandler(async (req, res, next) => {
  const { supplayrId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(supplayrId)) {
    return next(new ApiError('Invalid supplier ID', 400));
  }

  // الحصول على جميع المبيعات والمشتريات والضرائب للمورد
  const bell = await Buy_bell.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  const buys = await Buy.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  const tax = await Supplayr_tax.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  if (!bell.length && !buys.length && !tax.length) {
    return next(new ApiError(`No transactions found for supplier with ID: ${supplayrId}, 404`));
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(buys[0]?.supplayr.supplayr_name || 'عميل');

  // تهيئة مصفوفة لتخزين جميع البيانات للترتيب حسب التاريخ
  const allEntries = [];
  
  const money = buys[0]?.supplayr.price_on ;
  // خريطة لتجميع المشتريات حسب التاريخ والنوع
  const buysMap = {};

  // تجميع بيانات المشتريات
  buys.forEach(by => {
    const entryDate = by.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' });
    const productType = by.product.type;
    const PricKilo = by.price_Kilo;
     const notes = by.Notes;
    // إنشاء مفتاح فريد لكل تاريخ ونوع منتج
    const key = `${entryDate}-${productType}`;

    if (!buysMap[key]) {
      buysMap[key] = {
        date: by.Entry_date,
        type: productType,
        totalWeight: 0,
        totalPrice: 0,
        PriceKilo:PricKilo,
        Note:notes,
      };
    }

    // جمع الوزن والسعر لنفس التاريخ والنوع
    buysMap[key].totalWeight += by.E_wieght;
    buysMap[key].totalPrice += by.price_all;
  });

  // إضافة المشتريات المجمعة إلى المصفوفة
  Object.values(buysMap).forEach(buy => {
    allEntries.push({
      type: 'buy',
      date: buy.date,
      row: [
        buy.date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
        buy.type,
        buy.totalWeight,
        buy.PriceKilo,
        buy.totalPrice,
        buy.Note,
        'مشتريات',
      ],
      color: 'FF4CAF50' // اللون الأخضر للمشتريات
    });
  });

  // تجميع بيانات الفواتير
  bell.forEach(bl => {
    allEntries.push({
      type: 'bell',
      date: bl.Entry_date,
      row: [
        bl.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
        bl.payment_method,
        bl.pay_bell,
        bl.bank_name,
        bl.check_number,
        bl.Notes,
        'فواتير',
      ],
      color: 'FFFF9800' // اللون البرتقالي للفواتير
    });
  });

  // تجميع بيانات الضرائب
  tax.forEach(t => {
    allEntries.push({
      type: 'tax',
      date: t.entryDate,
      row: [
        t.entryDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
        t.amount,
        t.taxRate,
        t.discountRate,
        t.Bell_num,
        t.Company_name,
        t.Notes,
        'ضرائب',
      ],
      color: 'FFF44336' // اللون الأحمر للضرائب
    });
  });

  // ترتيب جميع الإدخالات حسب التاريخ
  allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // إضافة صف الرأس إلى الورقة
  worksheet.addRow(['التاريخ', 'الصنف', 'الكمية', 'السعر', 'القيمة','اسم شركة','الملاحظات']);

  // إضافة البيانات المرتبة إلى الورقة
  allEntries.forEach(entry => {
    const row = worksheet.addRow(entry.row);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: entry.color } };
  });
 
 
  const finalRow = worksheet.addRow(['', '', '', '', 'الرصيد المتبقي:']);
  finalRow.font = { bold: true };
  finalRow.alignment = { horizontal: 'right' };

  const finalBalanceRow = worksheet.addRow(['', '', '', '', money]);
  finalBalanceRow.font = { bold: true, color: { argb: 'FF000000' } };
  finalBalanceRow.alignment = { horizontal: 'right' };

  for (let i = 1; i <= 8; i++) {
    worksheet.getColumn(i).width = 30;
    worksheet.getColumn(i).alignment = { horizontal: 'center' };
  }
  // إعداد رؤوس الاستجابة
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=supplier_${supplayrId}_details.xlsx`);

  // كتابة الملف إلى الاستجابة
  await workbook.xlsx.write(res);
  res.end();
});


//export Supplayr Cheack 
exports.exportSupplayrCheakToExcel = asyncHandler(async (req, res, next) => {
  const { supplayrId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(supplayrId)) {
    return next(new ApiError('Invalid supplier ID', 400));
  }

  // الحصول على جميع المبيعات والمشتريات للمورد باستخدام الشيكات فقط
const bell = await Buy_bell.find({ 
  supplayr: supplayrId,
  payment_method: 'check' // فقط الفواتير المدفوعة بواسطة الشيكات
})
.populate({ path: 'supplayr', select: 'supplayr_name' });

if (!bell.length) {
  return next(new ApiError(`No transactions found for supplier with ID: ${supplayrId}, 404`));
}

// باقي الكود يظل كما هو

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(bell[0]?.supplayr.supplayr_name || 'عميل');

  // تهيئة مصفوفة لتخزين جميع البيانات للترتيب حسب التاريخ
  const allEntries = [];
  
  const money = bell[0]?.supplayr.price_on ;
  
  // تجميع بيانات الفواتير
  bell.forEach(bl => {
    allEntries.push({
      type: 'bell',
      date: bl.Entry_date,
      row: [
        bl.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
        bl.pay_bell,
        bl.bank_name,
        bl.check_number,
        bl.check_date,
        bl.Notes,
      ],
      color: '808080' // اللون للفواتير
    });
  });

  

  // ترتيب جميع الإدخالات حسب التاريخ
  allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // إضافة صف الرأس إلى الورقة
  worksheet.addRow(['التاريخ', 'المبلغ', 'اسم البنك', 'رقم الشيك', 'تاريخ الشيك','الملاحظات']);

  // إضافة البيانات المرتبة إلى الورقة
  allEntries.forEach(entry => {
    const row = worksheet.addRow(entry.row);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: entry.color } };
  });
 
 
  const finalRow = worksheet.addRow(['', '', '', '', 'الرصيد المتبقي:']);
  finalRow.font = { bold: true };
  finalRow.alignment = { horizontal: 'right' };

  const finalBalanceRow = worksheet.addRow(['', '', '', '', money]);
  finalBalanceRow.font = { bold: true, color: { argb: 'FF000000' } };
  finalBalanceRow.alignment = { horizontal: 'right' };

  for (let i = 1; i <= 6; i++) {
    worksheet.getColumn(i).width = 30;
    worksheet.getColumn(i).alignment = { horizontal: 'center' };
  }
  // إعداد رؤوس الاستجابة
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=supplier_${supplayrId}_details.xlsx`);

  // كتابة الملف إلى الاستجابة
  await workbook.xlsx.write(res);
  res.end();
});