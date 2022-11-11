var mongoose = require('mongoose');
var TransactionHistorySchema = new mongoose.Schema({
    wallet: String,
    amount: Number,
    status: String,
    created_at : { type : Date, default: Date.now }
});
mongoose.model('TransactionHistory', TransactionHistorySchema);

module.exports = mongoose.model('TransactionHistory');