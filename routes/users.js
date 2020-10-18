const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const verify = require('../middleware/verify');

//-----------MODEL-----------//
const User = require('../models/user');

//-----------METHODS-----------//
const findUsername = (req) => {
    return User.findOne({username: req});
};

const findEmail = (req) => {
  return User.findOne({ email: req });
};

//-----------SIGN UP-----------//
router.post('/signup', async (req, res) => {

    const isUsernameTaken = await findUsername(req.body.username);
    if (isUsernameTaken) {
        return res.send({error: {status: 409, message: "Username taken."}})
    } 

    const registeredEmail = await findEmail(req.body.email);
    if (registeredEmail) {
        return res.send({error: {status: 409, message: "Email already registered."}})
    }

    let newUser;

    try {
        const salt = await bcrypt.genSalt(12);
        const seasonedPassword = await bcrypt.hash(req.body.password, salt);

        newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: seasonedPassword
        });

        await newUser.save();

    } catch (error) {
        res.status(500).send({error: "Could not create account."})
    } 
    finally {

        const payload = {
            user: {
                id: newUser._id
            }
        }

        let date = new Date();
        let time = date.getTime();

        jwt.sign(payload, process.env.ACTKN_SECRET, {expiresIn: 60}, async (err, actkn) => {
            if (!err) {
                date.setTime(time + 60000);
                console.log({date: date});
                res
                  .cookie("actkn", actkn, {
                    domain: "*",
                    secure: false,
                    httpOnly: true,
                    expires: date
                  })
            }
        })

        jwt.sign(payload, process.env.RFTKN_SECRET, {expiresIn: 180}, async (err, rftkn) => {
            if (!err) {
                let rdate = date;
                rdate.setTime(time + (3*60000));
                console.log({rdate: rdate})

                res.cookie("rftkn", rftkn, {
                    domain: "*",
                    secure: false,
                    httpOnly: true, 
                    expires: rdate
                }).status(201).send({msg: "success!"})
            }
        })

    }

});

router.post('/login', verify, async (req, res) => {
    res.send({msg: "verified!"})
})

module.exports = router;
