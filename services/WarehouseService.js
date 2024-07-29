
const asyncHandler = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const XLSX = require('xlsx');
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


exports.printExcel =  asyncHandler(async (req, res) => {
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
  });



