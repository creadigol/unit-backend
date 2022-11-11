var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

// var VerifyToken = require(__root + 'auth/VerifyToken');

router.use(bodyParser.urlencoded({ extended: true }));
var BetHistory = require('BetHistory');

// CREATES A NEW USER
router.post('/', function(req, res) {
    BetHistory.create({
            name: req.body.name,
            wallet: req.body.wallet,
            token: req.body.token,
            balance: req.body.balance
        },
        function(err, history) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(history);
        });
});

// RETURNS ALL THE USERS IN THE DATABASE
router.get('/', function(req, res) {
    BetHistory.find({}, function(err, history) {
        if (err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(history);
    });
});

// GETS A SINGLE USER FROM THE DATABASE
router.get('/:id', function(req, res) {
    BetHistory.findById(req.params.id, function(err, history) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!history) return res.status(404).send("No user found.");
        res.status(200).send(history);
    });
});

// DELETES A USER FROM THE DATABASE
router.delete('/:id', function(req, res) {
    BetHistory.findByIdAndRemove(req.params.id, function(err, history) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User: " + history._id + " was deleted.");
    });
});

// UPDATES A SINGLE USER IN THE DATABASE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route
router.put('/:id', /* VerifyToken, */ function(req, res) {
    BetHistory.findByIdAndUpdate(req.params.id, req.body, { new: true }, function(err, history) {
        if (err) return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(history);
    });
});


module.exports = router;