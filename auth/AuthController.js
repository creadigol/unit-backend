var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

const { check, validationResult } = require('express-validator');

// var VerifyToken = require('./VerifyToken');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
var User = require('./user/User');
var Admin = require('./admin/Admin');
var TransectionHistory = require('./transactionHistory/TransactionHistory');

/** 
 * Configure JWT
 */
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');
var config = require('../config');

router.post('/checkWalletBalance', [
    check('wallet', 'Please add wallet address').exists()
], function(req, res) {

    const { wallet } = req.body;

    User.findOne({ wallet: wallet }, function(err, user) {
        if (err) return res.status(500).send('Error on the server.');

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        if (!user) {
            var token = jwt.sign({ id: wallet }, config.secret);
            let newName = (Math.random() + 1).toString(36).substring(7);
            User.create({
                    name: newName,
                    wallet: wallet,
                    balance: 0,
                    token: token
                },
                function(err, user) {
                    if (err) return res.status(500).send("There was a problem registering the user`.");

                    // create a token
                    return res.status(200).send({
                        status: true,
                        msg: 'Login Success',
                        token: token,
                        data: {
                            user_id: user._id,
                            name: newName,
                            balance: 0
                        }
                    });

                });

        } else {

            var token = jwt.sign({ id: user._id }, config.secret);

            User.findByIdAndUpdate(user._id, { token: token }, { new: true }, function(err, newUser) {
                if (err) return res.status(500).send(err);
                return res.status(200).send({
                    status: true,
                    msg: 'Login Success',
                    token: token,
                    data: {
                        user_id: newUser._id,
                        name: newUser.name,
                        balance: newUser.balance
                    }
                });

            });

        }

    });
   
});


router.post('/updateWalletBalance', [
    check('wallet', 'Please add wallet address').exists(),
    check('amount', 'Amount').exists()
], function(req, res) {

    const { wallet, amount } = req.body;

    User.findOne({ wallet: wallet }, function(err, user) {
        if (err) return res.status(500).send('Error on the server.');

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        if (!user) {
            return res.status(200).send({
                status: false,
                msg: 'Invalid Wallet Address',
            });
        } else {

            const updatedBalance = Number(user.balance)+Number(amount);

            User.findByIdAndUpdate(user._id, { balance: updatedBalance }, { new: true }, function(err, newUser) {
                if (err) return res.status(500).send(err);

                const status = (Number(amount) > 0)?"deposit":"withdraw";
                TransectionHistory.create({ wallet: wallet, amount: Math.abs(Number(amount)), status: status });


                return res.status(200).send({
                    status: true,
                    msg: 'balance updated Successfully'
                });

            });

        }

    });
   
});


router.post('/lastToptenWinner', [
    check('game_id', 'Please add gameId').exists()
], function(req, res) {

    const { game_id } = req.body;

    User.findOne({ 'game_id': game_id }).sort({amount: -1}).limit(10, function(err, user) {
        if (err) return res.status(500).send('Error on the server.');

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        if (!user) {
            return res.status(200).send({
                status: false,
                msg: 'Invalid Game Id',
            });
        } else {

            console.log("user")
            console.log(user)
            return res.status(200).send({
                status: false,
                msg: 'Invalid Wallet Address',
                data: user
            });
            // const updatedBalance = Number(user.balance)+Number(amount);

            // User.findByIdAndUpdate(user._id, { balance: updatedBalance }, { new: true }, function(err, newUser) {
            //     if (err) return res.status(500).send(err);
            //     return res.status(200).send({
            //         status: true,
            //         msg: 'balance updated Successfully'
            //     });

            // });

        }

    });

});

router.post('/getTrasectionHistory', [
    check('wallet', 'Wallet address').exists()
], function(req, res) {

    const { wallet } = req.body;

    TransectionHistory.find({ 'wallet': wallet }, function(err, transection) {
        if (err) return res.status(500).send('Error on the server.');

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        if (!transection) {
            return res.status(200).send({
                status: false,
                msg: 'Empty data',
                data: []
            });
        } else {
            return res.status(200).send({
                status: false,
                msg: 'success',
                data: transection
            });

        }

    });

});



router.post('/login', [
    check('email', 'Please add email address').exists(),
    check('password', 'Please add password').exists()
], function(req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({status:false, errors: errors.array() });
    }

    const { email, password } = req.body;

    Admin.findOne({ email: email }, async function(err, user) {
        if (err) return res.status(200).send({ status:false, error: 'Error on the server.'});

        if (!user) {
            res.status(200).json({ status:false, error: "Invalid email and password" });
            // const salt = await bcrypt.genSalt(10);
            // // now we set user password to hashed password
            // const incPassword = await bcrypt.hash(password, salt);

            // var token = jwt.sign({ id: email }, config.secret);
            // Admin.create({
            //         name: "admin",
            //         email: email,
            //         password: incPassword,
            //         token: token
            //     },
            //     function(err, user) {
            //         if (err) return res.status(500).send("There was a problem registering the user`.");

            //         // create a token
            //         return res.status(200).send({
            //             status: true,
            //             msg: 'Login Success',
            //             token: token,
            //             data: {
            //                 user_id: user._id
            //             }
            //         });

            //     });

        } else {

            const validPassword = await bcrypt.compare(password, user.password);
            if (validPassword) {

                var token = jwt.sign({ id: user._id }, config.secret);

                Admin.findByIdAndUpdate(user._id, { token: token }, { new: true }, function(err, newUser) {
                    if (err) return res.status(500).send(err);
                    return res.status(200).send({
                        status: true,
                        msg: 'Login Success',
                        token: token,
                        data: {
                            user_id: newUser._id
                        }
                    });

                });
            } else {
              res.status(200).json({ status:false, error: "Invalid Password" });
            }
        }

    });
   
});

// router.post('/updateUserBalance', (req, res) => {
//     user.update({ wallet: "7ejtMZgZg6wed4VsAAXBt7stEYbCAAHWvKmiM36TosDh"}, { $inc: { balance: 10 } });
// });


// router.post('/me', VerifyToken, function(req, res, next) {

//     User.findById(req.user_id, { password: 0 }, function(err, user) {
//         if (err) return res.status(500).send("There was a problem finding the user.");
//         if (!user) return res.status(404).send("No user found.");
//         res.status(200).send(user);
//     });

// });

module.exports = router;