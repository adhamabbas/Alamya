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

  // Get all sales for the supplayr
  const bell = await Buy_bell.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  // Get all purchases for the supplayr
  const buys = await Buy.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  const tax = await Supplayr_tax.find({ supplayr: supplayrId })
    .populate({ path: 'supplayr', select: 'supplayr_name' });

  if (!bell.length && !buys.length && !tax.length) {
    return next(new ApiError(`No transactions found for supplier with ID: ${supplayrId}`, 404));
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Supplier Details');

  // Add header for buys section
  const buysHeader = worksheet.addRow(['']);
  buysHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  buysHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };

  // Add columns for buys section
  worksheet.addRow([
    'المورد', 'النوع', 'وزن البكرة', 'مقاس', 'سعر', 'المدفوع', 'تاريخ الإنشاء'
  ]);
  buys.forEach(by => {
    worksheet.addRow([
      by.supplayr.supplayr_name,
      by.product.type,
      by.E_wieght,
      by.size,
      by.price_all,
      by.pay,
      by.createdAt.toLocaleString(),
    ]);
  });

  // Set column widths for buys section
  worksheet.columns = [
    { key: 'supplayr', width: 40 },
    { key: 'product', width: 20 },
    { key: 'E_wieght', width: 20 },
    { key: 'size', width: 15 },
    { key: 'price_all', width: 20 },
    { key: 'pay', width: 20 },
    { key: 'createdAt', width: 30 },
  ];

  // Add an empty row to separate sections
  worksheet.addRow([]);

  // Add header for bell section
  const bellHeader = worksheet.addRow(['']);
  bellHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  bellHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };

  // Add columns for bell section
  worksheet.addRow([
    'المورد', 'مبلغ الفاتورة', 'طريقة الدفع', 'رقم الشيك', 'تاريخ الشيك','اسم البنك', 'تاريخ الإنشاء'
  ]);
  bell.forEach(bay => {
    worksheet.addRow([
      bay.supplayr.supplayr_name,
      bay.pay_bell,
      bay.payment_method,
      bay.check_number,
      bay.check_date,
      bay.bank_name,
      bay.createdAt.toLocaleString(),
    ]);
  });

  // Set column widths for bell section
  worksheet.columns = [
    { key: 'supplayr', width: 40 },
    { key: 'pay_bell', width: 20 },
    { key: 'payment_method', width: 20 },
    { key: 'check_number', width: 20 },
    { key: 'check_date', width: 20 },
    { key: 'bank_name', width: 20 },
    { key: 'createdAt', width: 30 },
  ];

  // Add an empty row to separate sections
  worksheet.addRow([]);

  // Add header for tax section
  const taxHeader = worksheet.addRow(['']);
  taxHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  taxHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };

  // Add columns for tax section
  worksheet.addRow([
    'المورد', 'مبلغ', 'نسبة خصم', 'الضريبة', 'تاريخ الإنشاء'
  ]);
  tax.forEach(t => {
    worksheet.addRow([
      t.supplayr.supplayr_name,
      t.amount,
      t.discountRate,
      t.taxRate,
      t.createdAt.toLocaleString(),
    ]);
  });

  // Set column widths for tax section
  worksheet.columns = [
    { key: 'supplayr', width: 40 },
    { key: 'amount', width: 20 },
    { key: 'discountRate', width: 20 },
    { key: 'taxRate', width: 20 },
    { key: 'createdAt', width: 30 },
  ];

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=supplier_${supplayrId}_details.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);

  res.end();
});
