var mongoose = require('mongoose');
var BetHistorySchema = new mongoose.Schema({
    game_id: String,
    wallet: String,
    betJar: String,
    // amount: mongoose.Types.Decimal128,
    amount: Number,
    winningJar: String,
    status: Number
});
mongoose.model('BetHistory', BetHistorySchema);

module.exports = mongoose.model('BetHistory');