const mongoose = require('mongoose'); 
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ExcelJS = require('exceljs');
const factory = require('./handlersFactory');
const {GoogleSpreadsheet}  = require('google-spreadsheet');
const creds = require('../credentials.json');  // مسار ملف JSON الذي يحتوي على بيانات اعتمادك
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

  if (!bell.length && !sela.length && !tax.length && !chBack.length) {
    return next(new ApiError(`لا توجد معاملات للعميل مع هذا المعرف: ${clientId}`, 404));
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Client Details');

  // Add header for sales section
  const salesHeader = worksheet.addRow(['مبيعات']);
  salesHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  salesHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };

  // Add columns for sales section
  worksheet.addRow([
    'العميل', 'النوع', 'وزن البكرة', 'مقاس', 'سعر', 'المدفوع', 'تاريخ الإنشاء'
  ]);
  sela.forEach(sll => {
    worksheet.addRow([
      sll.clint.clint_name,
      sll.product.type,
      sll.o_wieght,
      sll.size_o,
      sll.price_allQuantity,
      sll.pay_now,
      sll.createdAt.toLocaleString(),
    ]);
  });

  // Set column widths for sales section
  worksheet.columns = [
    { key: 'clint', width: 25 },
    { key: 'product', width: 20 },
    { key: 'o_wieght', width: 20 },
    { key: 'size_o', width: 15 },
    { key: 'price_allQuantity', width: 20 },
    { key: 'pay_now', width: 20 },
    { key: 'createdAt', width: 25 },
  ];

  // Add an empty row to separate sections
  worksheet.addRow([]);

  // Add header for bell section
  const bellHeader = worksheet.addRow(['فواتير']);
  bellHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  bellHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };

  // Add columns for bell section
  worksheet.addRow([
    'العميل', 'مبلغ الفاتورة', 'طريقة الدفع', 'رقم الشيك', 'تاريخ الشيك', 'تاريخ الإنشاء'
  ]);
  bell.forEach(sale => {
    worksheet.addRow([
      sale.clint.clint_name,
      sale.payBell,
      sale.paymentMethod,
      sale.checkNumber,
      sale.checkDate,
      sale.createdAt.toLocaleString(),
    ]);
  });

  // Add an empty row to separate sections
  worksheet.addRow([]);

  // Add header for tax section
  const taxHeader = worksheet.addRow(['الضريبة']);
  taxHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  taxHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };

  // Add columns for tax section
  worksheet.addRow([
    'العميل', 'مبلغ', 'نسبة خصم', 'الضريبة', 'تاريخ الإنشاء'
  ]);
  tax.forEach(t => {
    worksheet.addRow([
      t.clint.clint_name,
      t.amount,
      t.discountRate,
      t.taxRate,
      t.createdAt.toLocaleString(),
    ]);
  });

  // Add an empty row to separate sections
  worksheet.addRow([]);

  // Add header for check back section
  const checkBackHeader = worksheet.addRow(['الشيكات المرتجعة']);
  checkBackHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  checkBackHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F51B5' } };

  // Add columns for check back section
  worksheet.addRow([
    'العميل', 'مبلغ الشيك', 'تاريخ'
  ]);
  chBack.forEach(ch => {
    worksheet.addRow([
      ch.clint.clint_name,
      ch.checkAmount,
      ch.checkDate,
      ch.createdAt.toLocaleString(),
    ]);
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=client_${clientId}_details.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);

  res.end();
});


exports.exportClientDetailsToGoogleSheet = asyncHandler(async (req, res, next) => {
  const { clientId } = req.params;

  // قم بتحميل جدول البيانات باستخدام معرّف Google Sheets
  const doc = new GoogleSpreadsheet('1AelZU5Uqq3r_422OMQdMH2JtkHX20NitwBK4QXdNnWs');
  
  // المصادقة باستخدام بيانات الاعتماد
    
  await doc.useServiceAccountAuth(JSON.stringify({
    client_email: "elalmia@lunar-clone-426314-v1.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCI6Ad2mtjh7XoS\nQY6a0OMJby5I4GwkEbS3WNyVW6fPcgESsfU8JoAxqgB5vD915UxeYZCLyzzf3zyU\n1DYSOx4Jzyxwndot8yzz93cnWJ6bV+1g2EaFOCMYgGaViiamTtLUdStmY7wvhA3i\nwg12kTpo3TdLJBncmbdNmtOfdQVR7x+HiqDEaAErksMwlr71V8rzbfxfCczVxMDV\nPIY29DUnQxzqzFJ1WT2HDxpmCeO9rO50aAmrEmjoG6w67VtmGSnBdr5X14gRzcHB\nlcAk8dr0yEw/qcRwtpNykoF/T4lqdQ46Wjt+iuH9k4rKVN7gjpCjZ4+DdaBLqwqH\nleEP/dDZAgMBAAECggEAAZN3biDbUTYbf+UzzlBY/YvDXJdPmPzml7uLTIfeom3f\nGWQL9rpaiVfTtt/ZJ8Y91Xjp9R+f+4bIt7QXf3W63PHyD186oTYWfoqxTmlmTm0A\nc7gBqQWld8h9bDuUwgWpxsRzihn1uZYbiWovXzEatK7WDl4jxkbM73Tr4NiaX1NT\nht3kfsjGfNLrC1jTrFK6JFNcJBlv4r8hf1HoLe8o0mBjtgGLRljDSUAFk7fE9/2V\nevydDucIJE1NFVrP+vly/vyqhpDn7sslnz0MWcUg/ZvSTWf2Wi44b7iDGqk0dJdw\nkR0LlkwkwNleHHJoF1h0BWbumzQSpNzyKZfgv6euwQKBgQC8iRjlOVNQtac/d4pB\nq5ZUxPoEmuR5Ghkc3WeP09hKPFnA12Isi2z7tyhnWDzQ9hRZnPoUVPSLH3l9l70z\nT+7vs5v+ublDv0P4WEbujt47G0TjEeALL+4QxKLBCgQoZfwV7AnpGx+oafBa9DS+\nf93Eiz8Fo6Bwxm+owKCmjPyFuQKBgQC55WmvxthVdIs1ltrobawyuUSpNeBZL0nE\nBD/h5SyX21mTudDD1iC0bhboWP7fhaGd/wNlhvK9nydwKH3MThMpvM3D5i3XkgyB\nKHlSfNrrn8HGLVeFzC9nTJ67Dh8B35K4swUT0fnS6v0AXFIPu7tpjdVeT4KUPEO8\nza4CDf80IQKBgQCAd+b34y0LdQxm6dzSzMoeLy6yTp1ai9cK3S9BSTg7tY3vIpSq\nB8OWbgLhELY4KUZKnfWmPxF3b1YIp4nr2g7VVQz58LH2IPF+2yBSVBXILtes5rRE\nyz8sO+EvKtUUdhHlGjbSmYHj73QxdfAu0tBZqgyimhGsZvsVAVU2yCEWOQKBgEcA\n4UVKZgb95M4rOKHegg89xIP9GBv4e+xq0xutNUMrfSN3rc2fVA6WnhlRJMirefen\nF90Hll/nEmE8lhAbIiam/tD8cjYMisoqc2yWU+f7tT/EwdFRFCoYkehQlHdatefm\nOOJBKXLuXoRsvstToVnH2t+S7wU/n3/V78jJH9kBAoGATdDdXBhY7jahdP9gX5hQ\nOKC6O4rmhp5bwX72hGqAoGD8zDhgCNBEyZYVYbugvRDjWaL6JjUHBp1WSm3nsxI0\nnEK8Zd8uVai1oaGWok4TbxTSH6MRBhTAK9T212ZJktZhUKmpu5a4NRdD0B93CGDZ\n13AfaQu19ayYt0LFbAR8BfY=\n-----END PRIVATE KEY-----\n",
  }));

  
  // تحميل معلومات جدول البيانات
  await doc.loadInfo();
  
  // اختيار الورقة التي تريد الكتابة فيها (يمكنك استخدام الاسم أو الفهرس)
  const sheet = doc.sheetsByTitle[clientId];
 // مثلا الورقة الأولى

  // جلب بيانات العميل
  const bell = await Sell_bell.find({ clint: clientId }).populate({ path: 'clint', select: 'clint_name' });
  const sela = await Sell.find({ clint: clientId }).populate({ path: 'clint', select: 'clint_name' });
  const tax = await clint_tax.find({ clint: clientId }).populate({ path: 'clint', select: 'clint_name' });
  const chBack = await check_back.find({ clint: clientId }).populate({ path: 'clint', select: 'clint_name' });

  if (!bell.length && !sela.length && !tax.length && !chBack.length) {
    return next(new ApiError(`No transactions found for client with ID: ${clientId}`, 404));
  }

  // كتابة بيانات المبيعات إلى Google Sheets
  await sheet.addRow(['مبيعات']);
  await sheet.addRow(['العميل', 'النوع', 'وزن البكرة', 'مقاس', 'سعر', 'المدفوع', 'تاريخ الإنشاء']);
  sela.forEach(async (sll) => {
    await sheet.addRow([
      sll.clint.clint_name,
      sll.product.type,
      sll.o_wieght,
      sll.size_o,
      sll.price_allQuantity,
      sll.pay_now,
      sll.createdAt.toLocaleString(),
    ]);
  });

  // إضافة صف فارغ للفصل بين الأقسام
  await sheet.addRow([]);

  // كتابة بيانات الفواتير إلى Google Sheets
  await sheet.addRow(['فواتير']);
  await sheet.addRow(['العميل', 'مبلغ الفاتورة', 'طريقة الدفع', 'رقم الشيك', 'تاريخ الشيك', 'تاريخ الإنشاء']);
  bell.forEach(async (sale) => {
    await sheet.addRow([
      sale.clint.clint_name,
      sale.payBell,
      sale.paymentMethod,
      sale.checkNumber,
      sale.checkDate,
      sale.createdAt.toLocaleString(),
    ]);
  });

  // إضافة صف فارغ للفصل بين الأقسام
  await sheet.addRow([]);

  // كتابة بيانات الضرائب إلى Google Sheets
  await sheet.addRow(['الضريبة']);
  await sheet.addRow(['العميل', 'مبلغ', 'نسبة خصم', 'الضريبة', 'تاريخ الإنشاء']);
  tax.forEach(async (t) => {
    await sheet.addRow([
      t.clint.clint_name,
      t.amount,
      t.discountRate,
      t.taxRate,
      t.createdAt.toLocaleString(),
    ]);
  });

  // إضافة صف فارغ للفصل بين الأقسام
  await sheet.addRow([]);

  // كتابة بيانات الشيكات المرتجعة إلى Google Sheets
  await sheet.addRow(['الشيكات المرتجعة']);
  await sheet.addRow(['العميل', 'مبلغ الشيك', 'تاريخ']);
  chBack.forEach(async (ch) => {
    await sheet.addRow([
      ch.clint.clint_name,
      ch.checkAmount,
      ch.checkDate,
      ch.createdAt.toLocaleString(),
    ]);
  });
  

  res.status(200).json({ message: "تم تصدير بيانات العميل إلى Google Sheets بنجاح" });
});