// var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
// var config = require('../config'); // get our config file
var Admin = require('./admin/Admin');

function VerifyToken(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.headers['x-access-token'];
    var email = req.headers['email'];

    if (!token)
        return res.status(200).send({ status: false, error: 'No token provided.' });


    Admin.findOne({ email: email, token: token }, function(err, user) {
        if (err) return res.status(200).send({ status: false, error: 'Failed to authenticate token.' });

        if (!user) return res.status(200).send({
            status: false,
            error: 'Failed to authenticate token.'
        });

        next();

    });
    
}

module.exports = VerifyToken;
