
const asyncHandler = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const factory = require('./handlersFactory');
const Warehouse = require('../models/WarehouseModel');





// @desc    Get list of Warehouse
// @route   GET /api/v1/Warehouses
// @access  Public
exports.getWarehouses = factory.getAll(Warehouse,'Warehouse');

// @desc    Get specific Warehouse by id
// @route   GET /api/v1/Warehouses/:id
// @access  Public
exports.getWarehouse = factory.getOne(Warehouse,'Supplayr');

// @desc    Create Warehouse
// @route   POST  /api/v1/Warehouses
// @access  Private
exports.createWarehouse = factory.createOne(Warehouse);
// @desc    Update specific Warehouse
// @route   PUT /api/v1/Warehouses/:id
// @access  Private
exports.updateWarehouse = factory.updateOne(Warehouse);

// @desc    Delete specific Warehouse
// @route   DELETE /api/v1/Warehouses/:id
// @access  Private
exports.deleteWarehouse = factory.deleteOne(Warehouse);


/*exports.printExcel =  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Build query
    const documentsCounts = await Warehouse.countDocuments();
    const apiFeatures = new ApiFeatures(Warehouse.find(filter).populate('user').populate('product').populate('supplayr'), req.query)
      .paginate(documentsCounts)
      .filter()
      .search('Supplayr')
      .limitFields()
      .sort();
  
    // Execute query
    const { mongooseQuery } = apiFeatures;
    const documents = await mongooseQuery;
  
    // Convert to Excel
    const workbook = XLSX.utils.book_new();
    const worksheetData = documents.map(doc => {
      const docObj = doc.toObject();
      return {
        'اسم المستخدم': doc.user ? doc.user.name : '',
        'اسم المنتج': doc.product ? doc.product.name : '',
        'كود':doc.product_code,
        'مقاس': doc.size,
        'وزن البكرة ':doc.weight,
        'وزن المنتج': doc.product ? doc.product.weight : '',
        'السعر المتوسط': doc.product ? doc.product.avg_price : '',
        'تاريخ الإنشاء': doc.createdAt,
        'تاريخ التحديث': doc.updatedAt,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
  
    // Send Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
  });*/

 
const categorizeProduct = (productName) => {
  if (productName.includes('فلوت فاخر')) {
    return 'فلوت فاخر';
  } else if (productName.includes('تيست معالج')) {
    return 'تيست معالج';
  } else if (productName.includes('فلوت عادي')) {
    return 'فلوت عادي';
  } else if (productName.includes('توب كرافت')) {
    return 'توب كرافت';
  } else {
    return null;
  }
};

  
  
  
  

 const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
const factory = require('./handlersFactory');
const Warehouse = require('../models/WarehouseModel');

// دالة تصنيف المنتج
const categorizeProduct = (productName) => {
  if (productName.includes('فلوت فاخر')) {
    return 'فلوت فاخر';
  } else if (productName.includes('تيست معالج')) {
    return 'تيست معالج';
  } else if (productName.includes('فلوت عادي')) {
    return 'فلوت عادي';
  } else if (productName.includes('توب كرافت')) {
    return 'توب كرافت';
  } else {
    return null;
  }
};

exports.printProductComparisonExcel = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.filterObj) {
    filter = req.filterObj;
  }

  const sizes = Array.from({ length: Math.floor((190 - 50) / 5) + 1 }, (v, i) => 50 + i * 5);

  // جلب المستندات من قاعدة البيانات مع التحقق من الحقول
  const documents = await Warehouse.find(filter)
    .populate({ path: 'user', select: 'name -_id' })
    .populate({ path: 'product', select: 'type avg_price weight product_code _id' }) // تأكد من أن 'product_code' هو الحقل الصحيح
    .populate({ path: 'supplayr', select: 'supplayr_name _id' });

  // إنشاء عدادات التصنيف
  const categoryCounts = {
    'فلوت فاخر': sizes.map(() => ({ count: 0, codes: [] })),
    'تيست معالج': sizes.map(() => ({ count: 0, codes: [] })),
    'فلوت عادي': sizes.map(() => ({ count: 0, codes: [] })),
    'توب كرافت': sizes.map(() => ({ count: 0, codes: [] })),
  };

  // توزيع المستندات حسب المقاس والفئة الرئيسية
  documents.forEach(doc => {
    const mainCategory = categorizeProduct(doc.product.type);
    if (mainCategory) {
      const sizeIndex = sizes.indexOf(doc.size);
      if (sizeIndex !== -1) {
        categoryCounts[mainCategory][sizeIndex].count += 1;
        // التأكد من وجود 'product_code' قبل إضافته
        if (doc.product.product_code) {
          categoryCounts[mainCategory][sizeIndex].codes.push(doc.product.product_code);
        }
      }
    }
  });

  // إنشاء ملف Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Product Comparison');

  // إضافة عناوين الأعمدة
  worksheet.columns = [
    { header: 'المقاس', key: 'size', width: 10 },
    { header: 'فلوت فاخر', key: 'flot_fakhr', width: 15 },
    { header: 'كود فلوت فاخر', key: 'flot_fakhr_codes', width: 30 },
    { header: 'تيست معالج', key: 'test_moaleg', width: 15 },
    { header: 'كود تيست معالج', key: 'test_moaleg_codes', width: 30 },
    { header: 'فلوت عادي', key: 'flot_adi', width: 15 },
    { header: 'كود فلوت عادي', key: 'flot_adi_codes', width: 30 },
    { header: 'توب كرافت', key: 'top_karft', width: 15 },
    { header: 'كود توب كرافت', key: 'top_karft_codes', width: 30 }
  ];

  // تنسيق العناوين (Bold & Color)
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
  worksheet.getRow(1).border = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } }
  };
  worksheet.getRow(1).alignment = { horizontal: 'center' };

  // إضافة البيانات
  sizes.forEach((size, index) => {
    const row = worksheet.addRow({
      size: size,
      flot_fakhr: categoryCounts['فلوت فاخر'][index].count,
      flot_fakhr_codes: categoryCounts['فلوت فاخر'][index].codes.length > 0 ? categoryCounts['فلوت فاخر'][index].codes.join('_') : 'لا توجد أكواد',
      test_moaleg: categoryCounts['تيست معالج'][index].count,
      test_moaleg_codes: categoryCounts['تيست معالج'][index].codes.length > 0 ? categoryCounts['تيست معالج'][index].codes.join('_') : 'لا توجد أكواد',
      flot_adi: categoryCounts['فلوت عادي'][index].count,
      flot_adi_codes: categoryCounts['فلوت عادي'][index].codes.length > 0 ? categoryCounts['فلوت عادي'][index].codes.join('_') : 'لا توجد أكواد',
      top_karft: categoryCounts['توب كرافت'][index].count,
      top_karft_codes: categoryCounts['توب كرافت'][index].codes.length > 0 ? categoryCounts['توب كرافت'][index].codes.join('_') : 'لا توجد أكواد'
    });
    row.font = { bold: true, color: { argb: '000000' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0DE89' } };
    row.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };
    row.alignment = { horizontal: 'center' };
  });

  // إضافة صف المجموع
  worksheet.addRow({
    size: 'المجموع',
    flot_fakhr: categoryCounts['فلوت فاخر'].reduce((a, b) => a + b.count, 0),
    flot_fakhr_codes: '',
    test_moaleg: categoryCounts['تيست معالج'].reduce((a, b) => a + b.count, 0),
    test_moaleg_codes: '',
    flot_adi: categoryCounts['فلوت عادي'].reduce((a, b) => a + b.count, 0),
    flot_adi_codes: '',
    top_karft: categoryCounts['توب كرافت'].reduce((a, b) => a + b.count, 0),
    top_karft_codes: ''
  });

  // تنسيق صف المجموع
  const lastRow = worksheet.lastRow;
  lastRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  lastRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '000000' } };
  lastRow.border = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } }
  };
  lastRow.alignment = { horizontal: 'center' };

  // تجميد الصف الأول
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // إعداد الاستجابة وإرسال ملف Excel
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=product_comparison.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});
