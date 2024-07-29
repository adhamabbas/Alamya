
const asyncHandler = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const ApiError = require('../utils/apiError');
const XLSX = require('xlsx');
const factory = require('./handlersFactory');
const Buy = require('../models/BuyModel');
const Supplayr =require('../models/SupplayrModel');






// @desc    Get list of Buy
// @route   GET /api/v1/Buys
// @access  Public
exports.getBuys = factory.getAll(Buy,'Buy');

// @desc    Get specific Buy by id
// @route   GET /api/v1/Buys/:id
// @access  Public
exports.getBuy = factory.getOne(Buy,'supplayr');

// @desc    Create Buy
// @route   POST  /api/v1/Buys
// @access  Private
exports.createBuy = factory.createOne(Buy);
// @desc    Update specific Buy
// @route   PUT /api/v1/Buys/:id
// @access  Private
exports.updateBuy =  asyncHandler(async (req, res, next) => {
     
    const oldDocument = await Buy.findById(req.params.id);
  
    if (!oldDocument) {
      return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
    }
  
    const payBellChanged = req.body.pay !== undefined && req.body.pay !== oldDocument.pay;
    let oldPayBell = 0;
  
    if (payBellChanged) {
      oldPayBell = oldDocument.pay;
    }
  
    const payBellChanged1 = req.body.price_all !== undefined && req.body.price_all !== oldDocument.price_all;
    let oldPayBell1 = 0;
  
    if (payBellChanged1) {
      oldPayBell1 = oldDocument.price_all;
    }
  
    const document = await Buy.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new ApiError(`No document for this id ${req.params.id}`, 404));
    }
     
    if (payBellChanged) {
      neWbell = req.body.pay;
       await document.constructor.takeMoney_d(document.supplayr,0, neWbell- oldPayBell);
       await document.constructor.allcalc_d(document.supplayr,0, neWbell- oldPayBell);
      }
     
      if (payBellChanged1) {
        newbell = req.body.price_all;
        await document.constructor.takeMoney_d(document.supplayr,newbell - oldPayBell1,0);
         await document.constructor.allcalc_d(document.supplayr,newbell - oldPayBell1,0);
      }
        
    res.status(200).json({ data: document });
  });


// @desc    Delete specific Buy
// @route   DELETE /api/v1/Buys/:id
// @access  Private
exports.deleteBuy = asyncHandler(async (req, res, next) => {
  const oldDocument2 = await Buy.findById(req.params.id);

  if (!oldDocument2) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }
  const supplayr = await Supplayr.findById(oldDocument2.supplayr);
  if (supplayr) {
    const On = oldDocument2.price_all - oldDocument2.pay_bell;
    supplayr.price_pay -= oldDocument2.pay;
    supplayr.price_on -= On ;
    supplayr.total_price -= oldDocument2.price_all;
    await supplayr.save();
}
  
  const document = await Buy.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    
    res.status(204).json({ data: null });
  });




exports.exportToExcel = asyncHandler(async (req, res) => {

  let filter = {};
  if (req.filterObj) {
    filter = req.filterObj;
  }

  // Build query
  const documentsCounts = await Buy.countDocuments();
  const apiFeatures = new ApiFeatures(Buy.find(filter).populate('user').populate('product').populate('supplayr'), req.query)
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
      'اسم المورد': doc.supplayr ? doc.supplayr.supplayr_name : '',
      'تم دفع': doc.pay,
      'سعر الاجمالي ': doc.price_all,
      'كود': doc.product_code,
      'مقاس': doc.size,
      'وزن المنتج': doc.product ? doc.product.weight : '',
      'السعر المتوسط': doc.product ? doc.product.avg_price : '',
      'المبلغ المدفوع': doc.supplayr ? doc.supplayr.price_pay : '',
      'المبلغ الكلي': doc.supplayr ? doc.supplayr.total_price : '',
      'المبلغ المستحق': doc.supplayr ? doc.supplayr.price_on : '',
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
