var mongoose = require('mongoose');
var AdminSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    token: String
});
mongoose.model('Admin', AdminSchema);

module.exports = mongoose.model('Admin');