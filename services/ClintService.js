const mongoose = require('mongoose'); 
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ExcelJS = require('exceljs');
const factory = require('./handlersFactory');
const Clint = require('../models/ClintModel');
const Sell = require('../models/sellModel');
const Sell_bell = require('../models/Sell_bellModel');
const clint_tax = require('../models/Tax_clintModel');
const check_back = require('../models/ReturnCheckModel');

// @desc    Get list of Clint
// @route   GET /api/v1/Clints
// @access  Public
exports.getClints = factory.getAll(Clint);

// @desc    Get specific Clint by id
// @route   GET /api/v1/Clint/:id
// @access  Public
exports.getClint = factory.getOne(Clint);

// @desc    Create Clint
// @route   POST  /api/v1/Clint
// @access  Private
exports.createClint = factory.createOne(Clint);

// @desc    Update specific Clint
// @route   PUT /api/v1/Clint/:id
// @access  Private
exports.updateClint = factory.updateOne(Clint);

// @desc    Delete specific Clint
// @route   DELETE /api/v1/Clint/:id
// @access  Private
exports.deleteClint = factory.deleteOne(Clint);

exports.getClientDetails = asyncHandler(async (req, res, next) => {
  const { clientId } = req.params;

  // Get all sales for the client
  const bell = await Sell_bell.find({ clint: clientId })
    .populate({ path: 'clint', select: 'clint_name' });

  // Get all purchases for the client
  const sela = await Sell.find({ clint: clientId })
    .populate({ path: 'clint', select: 'clint_name' });

  const tax = await clint_tax.find({ clint: clientId })
    .populate({ path: 'clint', select: 'clint_name' });
  
  const chBack = await check_back.find({ clint: clientId })
    .populate({ path: 'clint', select: 'clint_name' });

  if (!bell && !sela && !tax && !chBack) {
    return next(new ApiError(`No transactions found for client with ID: ${clientId}`, 404));
  }

  res.status(200).json({ sela, bell, chBack, tax });
});

exports.exportClientDetailsToExcel = asyncHandler(async (req, res, next) => {
  // جلب جميع العملاء
  const clients = await Clint.find();

  if (!clients.length) {
    return next(new ApiError('No clients found', 404));
  }

  // إنشاء ملف Excel جديد
  const workbook = new ExcelJS.Workbook();

  // لكل عميل، نقوم بإنشاء ورقة جديدة وتعبئة بياناته
  for (const client of clients) {
    // جلب بيانات العميل مثل الفواتير، الضرائب، والمبيعات
    const bell = await Sell_bell.find({ clint: client._id })
      .populate({ path: 'clint', select: 'clint_name money_on' });

    const sela = await Sell.find({ clint: client._id })
      .populate({ path: 'clint', select: 'clint_name money_on' });

    const tax = await clint_tax.find({ clint: client._id })
      .populate({ path: 'clint', select: 'clint_name money_on' });

    const chBack = await check_back.find({ clint: client._id })
      .populate({ path: 'clint', select: 'clint_name money_on' });

    // إذا لم يكن هناك معاملات للعميل، نتخطاه
    if (!bell.length && !sela.length && !tax.length && !chBack.length) {
      continue;
    }

    // إنشاء ورقة جديدة لكل عميل باستخدام اسمه
    const worksheet = workbook.addWorksheet(client.clint_name || 'عميل');

    // إعداد بيانات المبيعات
    const allEntries = [];
    const money = sela[0]?.clint.money_on;

    const salesMap = {};

    sela.forEach(sll => {
      const entryDate = sll.entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' });
      const productType = sll.product.type;
      const PriceForKilo = sll.priceForKilo;
      const Note = sll.Notes;
      const key = `${entryDate}-${productType}`;

      if (!salesMap[key]) {
        salesMap[key] = {
          date: sll.entry_date,
          type: productType,
          totalWeight: 0,
          totalPrice: 0,
          PriceforKilo: PriceForKilo,
          Notes: Note,
        };
      }

      salesMap[key].totalWeight += sll.o_wieght;
      salesMap[key].totalPrice += sll.allForall;
    });

    Object.values(salesMap).forEach(sale => {
      allEntries.push({
        type: 'sale',
        date: sale.date,
        row: [
          sale.date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
          sale.type,
          sale.totalWeight,
          sale.PriceforKilo,
          sale.totalPrice,
          sale.Notes,
          'مبيعات',
        ],
        color: 'FF4CAF50',
      });
    });

    // تجميع بيانات الفواتير
    bell.forEach(bl => {
      allEntries.push({
        type: 'bell',
        date: bl.createdAt,
        row: [
          bl.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
          bl.paymentMethod,
          bl.payBell,
          bl.bankName,
          bl.checkNumber,
          bl.Notes,
          'تحصيلات',
        ],
        color: 'FFFF9800',
      });
    });

    // تجميع بيانات الضرائب
    tax.forEach(t => {
      allEntries.push({
        type: 'tax',
        date: t.createdAt,
        row: [
          t.entryDate.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
          t.amount,
          t.taxRate,
          t.discountRate,
          t.netAmount,
          t.bell_num,
          t.company_name,
          t.Notes,
          'فواتير ضريبية',
        ],
        color: 'FFF44336',
      });
    });

    // تجميع بيانات الشيكات المرتدة
    chBack.forEach(ch => {
      allEntries.push({
        type: 'checkBack',
        date: ch.createdAt,
        row: [
          ch.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
          '',
          ch.amount,
          ch.num,
          'شيك مرتد',
        ],
        color: 'FF3F51B5',
      });
    });

    // ترتيب الإدخالات حسب التاريخ
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // إضافة صف الرأس إلى الورقة
    worksheet.addRow(['التاريخ', 'الصنف', 'الكمية', 'السعر', 'القيمة', 'رقم الفاتورة', 'الملاحظات']);

    // إضافة البيانات المرتبة إلى الورقة
    allEntries.forEach(entry => {
      const row = worksheet.addRow(entry.row);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: entry.color } };
    });

    // إضافة الصف الأخير لرصيد العميل
    const finalRow = worksheet.addRow(['', '', '', '', 'الرصيد المتبقي:']);
    finalRow.font = { bold: true };
    finalRow.alignment = { horizontal: 'right' };

    const finalBalanceRow = worksheet.addRow(['', '', '', '', money]);
    finalBalanceRow.font = { bold: true, color: { argb: 'FF000000' } };
    finalBalanceRow.alignment = { horizontal: 'right' };

    // تعديل عرض الأعمدة والمحاذاة
    for (let i = 1; i <= 8; i++) {
      worksheet.getColumn(i).width = 30;
      worksheet.getColumn(i).alignment = { horizontal: 'center' };
    }
  }

  // إعداد رؤوس الاستجابة
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=clients_details.xlsx`);

  // كتابة الملف إلى الاستجابة
  await workbook.xlsx.write(res);
  res.end();
});



/*exports.exportClintCheakToExcel = asyncHandler(async (req, res, next) => {
  const { clientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return next(new ApiError('Invalid supplier ID', 400));
  }

  // الحصول على جميع المبيعات والمشتريات للمورد باستخدام الشيكات فقط
const bell = await Sell_bell.find({ 
  clint: clientId,
  paymentMethod: 'check' // فقط الفواتير المدفوعة بواسطة الشيكات
})
.populate({ path: 'clint', select: 'clint_name' });

const chBack = await check_back.find({ clint: clientId })
    .populate({ path: 'clint', select: 'clint_name money_on' });

if (!bell.length &&!chBack.length) {
  return next(new ApiError(`No transactions found for supplier with ID: ${clientId}, 404`));
}

// باقي الكود يظل كما هو

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(bell[0]?.clint.clint_name || 'عميل');

  // تهيئة مصفوفة لتخزين جميع البيانات للترتيب حسب التاريخ
  const allEntries = [];
  
   money = bell[0]?.clint.money_on; ;
  
  // تجميع بيانات الفواتير
  bell.forEach(bl => {
    allEntries.push({
      type: 'bell',
      date: bl.Entry_date,
      row: [
        bl.Entry_date.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
        bl.payBell,
        bl.bankName,
        bl.checkNumber,
        bl.checkDate,
        bl.Notes,
      ],
      color: '808080' // اللون البرتقالي للتحصيلات
    });
  });
 
  chBack.forEach(ch => {
    allEntries.push({
      type: 'checkBack',
      date: ch.createdAt,
      row: [
        ch.createdAt.toLocaleDateString('ar-EG', { dateStyle: 'short' }),
        ch.amount,
        ch.bank_name,
        ch.date,
        ch.num,
        'شيك مرتد',
      ],
      color: 'FF3F51B5' // اللون الأزرق للشيكات المرتدة
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
  res.setHeader('Content-Disposition', `attachment; filename=supplier_${clientId}_details.xlsx`);

  // كتابة الملف إلى الاستجابة
  await workbook.xlsx.write(res);
  res.end();
});*/