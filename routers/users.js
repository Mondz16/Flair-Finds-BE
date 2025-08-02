const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash');
    res.send(userList);
})

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user)
        return res.status(404).json({success: false, message: 'The user with the given ID was not found.'});

    res.status(200).send(user);
})

router.get('/get/count', async (req, res) => {
    const userCount = await User.countDocuments();  

    if(!userCount)
        return res.status(500).json({success: false, message: 'The user count cannot be retrieved.'});

    res.send({userCount: userCount});
});

router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email});
    if(!user) {
        return res.status(400).send('The user with the given email was not found.');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
        const token = jwt.sign({
            userId: user.id,
            isAdmin: user.isAdmin
        }, process.env.SECRET, 
        { expiresIn: '1d'});

        res.status(200).send({
            userId: user.email,
            token: token,
            isAdmin: user.isAdmin,
        });
    }
    else {
        res.status(400).send('The password is incorrect.');
    }
})

router.post('/', async (req, res) => {
    const existingUsername = await User.find({ name: req.body.name });
    if(existingUsername.length > 0)
        return res.status(400).json({success: false, message: 'The user with the given name already exists.'});

    const existingEmail = await User.find({ email: req.body.email });
    if(existingEmail.length > 0)
        return res.status(400).json({success: false, message: 'The user with the given email already exists.'});

    const passwordHash = bcrypt.hashSync(req.body.passwordHash, 10);

    let newUser = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: passwordHash,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country
    });

    newUser = await newUser.save();

    if(!newUser)
        return res.status(500).json({success: false, message: 'The user cannot be created.'});

    res.send(newUser);
});

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if(user) {
            return res.status(200).json({success: true, message: 'The user is deleted.'});
        } else {
            return res.status(404).json({success: false, message: 'User not found.'});
        }
    }).catch(err => {
        return res.status(400).json({success: false, error: err.message});
    });
});

module.exports = router;