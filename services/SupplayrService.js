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

  // إنشاء ورقة لكل نوع من المعاملات
  const buysWorksheet = workbook.addWorksheet('مشتريات');
  const bellWorksheet = workbook.addWorksheet('فواتير');
  const taxWorksheet = workbook.addWorksheet('ضرائب');

  // تهيئة مصفوفة لتخزين جميع البيانات للترتيب حسب التاريخ
  const buysEntries = [];
  const bellEntries = [];
  const taxEntries = [];

  const money = buys[0]?.supplayr.price_on;

  // تجميع بيانات المشتريات
  buys.forEach(by => {
    buysEntries.push([
      by.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
      by.product.type,
      by.E_wieght,
      by.price_Kilo,
      by.price_all,
      by.Notes
    ]);
  });

  // تجميع بيانات الفواتير
  bell.forEach(bl => {
    bellEntries.push([
      bl.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
      bl.payment_method,
      bl.pay_bell,
      bl.bank_name,
      bl.check_number,
      bl.Notes
    ]);
  });

  // تجميع بيانات الضرائب
  tax.forEach(t => {
    taxEntries.push([
      t.entryDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
      t.amount,
      t.taxRate,
      t.discountRate,
      t.Bell_num,
      t.Company_name,
      t.Notes
    ]);
  });

  // إضافة صف الرأس إلى كل ورقة
  buysWorksheet.addRow(['التاريخ', 'الصنف', 'الكمية', 'سعر الكيلو', 'القيمة', 'الملاحظات']);
  bellWorksheet.addRow(['التاريخ', 'طريقة الدفع', 'المبلغ', 'اسم البنك', 'رقم الشيك', 'الملاحظات']);
  taxWorksheet.addRow(['التاريخ', 'المبلغ', 'نسبة الضريبة', 'نسبة الخصم', 'رقم الفاتورة', 'اسم الشركة', 'الملاحظات']);

  // إضافة البيانات إلى كل ورقة
  buysEntries.forEach(entry => buysWorksheet.addRow(entry));
  bellEntries.forEach(entry => bellWorksheet.addRow(entry));
  taxEntries.forEach(entry => taxWorksheet.addRow(entry));

  // إعداد عرض الأعمدة والمحاذاة
  [buysWorksheet, bellWorksheet, taxWorksheet].forEach(worksheet => {
    for (let i = 1; i <= 7; i++) {
      worksheet.getColumn(i).width = 20;
      worksheet.getColumn(i).alignment = { horizontal: 'center' };
    }
  });

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