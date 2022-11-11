var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    name: String,
    wallet: String,
    token: String,
    balance: Number
    // balance: mongoose.Types.Decimal128
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');