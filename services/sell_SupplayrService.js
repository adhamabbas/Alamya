
const asyncHandler = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const XLSX = require('xlsx');
const factory = require('./handlersFactory');
const Sell_supplayr = require('../models/sell_SupplayrModel');






// @desc    Get list of Sell_supplayr
// @route   GET /api/v1/Sell_supplayrs
// @access  Public
exports.getSell_supplayrs = factory.getAll(Sell_supplayr,'Product');

// @desc    Get specific Sell_supplayr by id
// @route   GET /api/v1/Sell_supplayrs/:id
// @access  Public
exports.getSell_supplayr = factory.getOne(Sell_supplayr,'Supplayr');

// @desc    Create Sell_supplayr
// @route   POST  /api/v1/Sell_supplayrs
// @access  Private
exports.createSell_supplayr = factory.createOne(Sell_supplayr);
// @desc    Update specific Sell_supplayr
// @route   PUT /api/v1/Sell_supplayrs/:id
// @access  Private
exports.updateSell_supplayr = factory.updateOne(Sell_supplayr);

// @desc    Delete specific Sell_supplayr
// @route   DELETE /api/v1/Sell_supplayrs/:id
// @access  Private
exports.deleteSell_supplayr = factory.deleteOne(Sell_supplayr);

exports.printExcel_Sell_supplayr =  (Sell_supplayr, modelName = 'Supplayr') => asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Build query
    const documentsCounts = await Sell_supplayr.countDocuments();
    const apiFeatures = new ApiFeatures(Sell_supplayr.find(filter).populate('user').populate('product').populate('supplayr'), req.query)
      .paginate(documentsCounts)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();
  
    // Execute query
    const { mongooseQuery } = apiFeatures;
    const documents = await mongooseQuery;
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
    // Convert to Excel
    const workbook = XLSX.utils.book_new();
    const worksheetData = documents.map(doc => {
      const docObj = doc.toObject();
      return {
        'اسم المستخدم': doc.user ? doc.user.name : '',
        'اسم المنتج': doc.product ? doc.product.name : '',
        'اسم المورد': doc.supplayr ? doc.supplayr.supplayr_name : '',
        'تم دفع':doc.pay_now,
        'سعر الاجمالي ':doc.price_allQuantity,
        'كود':doc.product_code,
        'مقاس': doc.size_o,
        'وزن الخروج': doc.o_wieght,
        'المبلغ اجمالي المدفوع': doc.supplayr ? doc.supplayr.pricePay_sell : '',
        'المبلغ الكلي': doc.supplayr ? doc.supplayr.totalPrice_sell : '',
        'المبلغ المستحق': doc.supplayr ? doc.supplayr.priceOn_sell : '',
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
  });




