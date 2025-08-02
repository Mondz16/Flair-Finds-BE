const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
    const categoryList = await Category.find();
    if(!categoryList)
        res.status(500).json({success: false, message: 'The category list cannot be retrieved.'});

    res.status(200).send(categoryList);
});

router.get('/:id', async (req, res) => {
    let category = await Category.findById(req.params.id);

    if(category) {
        res.status(200).json(category);
    }
    else{
        res.status(404).json({success: false, message: 'The category with the given ID was not found.'});
    }
})

router.put('/:id', async (req , res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
    )

    if(category) {
        res.status(200).send({message: 'The category is updated successfully.', category: category});
    }
    else{
        res.status(404).send({message: 'The category cannot be updated.'});
    }
})

router.post(`/`, async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    });

    category = await category.save();
    if(!category)
        return res.status(404).json({success: false, message: 'The category cannot be created.'});

    res.send(category);
});

router.delete('/:id', (req, res) => {
    Category.findByIdAndDelete(req.params.id).then(category => {
        if(category) {
            return res.status(200).json({success: true, message: 'The category is deleted.'});
        } else {
            return res.status(404).json({success: false, message: 'Category not found.'});
        }
    }).catch(err => {
        return res.status(400).json({success: false, error: err.message});
    })
})


module.exports = router;