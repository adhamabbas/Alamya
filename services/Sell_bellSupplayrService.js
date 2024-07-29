
const factory = require('./handlersFactory');
const Sell_bellSupplayr = require('../models/Sell_bellSupplayrModel');





// @desc    Get list of Sell_bellSupplayr
// @route   GET /api/v1/Sell_bellSupplayrs
// @access  Public
exports.getSell_bellSupplayrs = factory.getAll(Sell_bellSupplayr,'Sell_bellSupplayr');

// @desc    Get specific Sell_bellSupplayr_bell by id
// @route   GET /api/v1/Sell_bellSupplayrs/:id
// @access  Public
exports.getSell_bellSupplayr = factory.getOne(Sell_bellSupplayr,'Supplayr');

// @desc    Create Sell_bellSupplayr_bell
// @route   POST  /api/v1/Sell_bellSupplayrs
// @access  Private
exports.createSell_bellSupplayr = factory.createOne(Sell_bellSupplayr);
// @desc    Update specific Sell_bellSupplayr_bell
// @route   PUT /api/v1/Sell_bellSupplayrs/:id
// @access  Private
exports.updateSell_bellSupplayr = factory.updateOne(Sell_bellSupplayr);

// @desc    Delete specific Sell_bellSupplayr_bell
// @route   DELETE /api/v1/Sell_bellSupplayrs/:id
// @access  Private
exports.deleteSell_bellSupplayr = factory.deleteOne(Sell_bellSupplayr);





