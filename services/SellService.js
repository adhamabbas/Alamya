
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const XLSX = require('xlsx');
const factory = require('./handlersFactory');
const Sell = require('../models/sellModel');
const Clint = require('../models/ClintModel');




// @desc    Get list of Sell
// @route   GET /api/v1/Sells
// @access  Public
exports.getSells = factory.getAll(Sell,'Sell');

// @desc    Get specific Sell by id
// @route   GET /api/v1/Sells/:id
// @access  Public
exports.getSell = factory.getOne(Sell,'clint');

// @desc    Create Sell
// @route   POST  /api/v1/Sells
// @access  Private
exports.createSell = factory.createOne(Sell);
// @desc    Update specific Sell
// @route   PUT /api/v1/Sells/:id
// @access  Private
exports.updateSell =  asyncHandler(async (req, res, next) => {
     
  const oldDocument = await Sell.findById(req.params.id);

  if (!oldDocument) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }

  const payBellChanged = req.body.pay_now !== undefined && req.body.pay_now !== oldDocument.pay_now;
  let oldPayBell = 0;

  if (payBellChanged) {
    oldPayBell = oldDocument.pay_now;
  }

  const payBellChanged1 = req.body.price_allQuantity !== undefined && req.body.price_allQuantity !== oldDocument.price_allQuantity;
  let oldPayBell1 = 0;

  if (payBellChanged1) {
    oldPayBell1 = oldDocument.price_allQuantity;
  }

  const document = await Sell.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
   
  if (payBellChanged) {
    neWbell = req.body.pay_now;
     await document.constructor.takeMoney_ds(document.clint,0, neWbell- oldPayBell);
  
    }
   
    if (payBellChanged1) {
      newbell = req.body.price_allQuantity;
      await document.constructor.takeMoney_ds(document.clint,newbell - oldPayBell1,0);
       
    }
      
  res.status(200).json({ data: document });
});
// @desc    Delete specific Sell
// @route   DELETE /api/v1/Sells/:id
// @access  Private
exports.deleteSell = asyncHandler(async (req, res, next) => {
  const oldDocument1 = await Sell.findById(req.params.id);

  if (!oldDocument1) {
    return next(new ApiError(`No document found for this ID: ${req.params.id}`, 404));
  }
  const clint = await Clint.findById(oldDocument1.clint);
  if (clint) {
    const on = oldDocument1.price_allQuantity - oldDocument1.pay_now;
    clint.money_pay -= oldDocument1.pay_now;
    clint.money_on -= on ;
    clint.total_monye -= oldDocument1.price_allQuantity;
    await clint.save();
}
  
  const document = await Sell.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    
    res.status(204).json({ data: null });
  });

exports.printExcel_Sell =  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Build query
    const documentsCounts = await Sell.countDocuments();
    const apiFeatures = new ApiFeatures(Sell.find(filter).populate('user').populate('product').populate('clint'), req.query)
      .paginate(documentsCounts)
      .filter()
      .search('Clint')
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
        'اسم العميل': doc.clint ? doc.clint.clint_name : '',
        'تم دفع':doc.pay_now,
        'سعر الاجمالي ':doc.price_allQuantity,
        'كود':doc.product_code,
        'مقاس': doc.size_o,
        'وزن الخروج': doc.o_wieght,
        'المبلغ اجمالي المدفوع': doc.clint ? doc.clint.money_pay : '',
        'المبلغ الكلي': doc.clint ? doc.clint.total_monye : '',
        'المبلغ المستحق': doc.clint ? doc.clint.money_on : '',
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




