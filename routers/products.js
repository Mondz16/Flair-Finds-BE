const {Product} = require('../models/product');
const {Category} = require('../models/category');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('Invalid Image Type');
    if(isValid) {
      uploadError = null;
    }
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, fileName + '-' + Date.now() + '.' + extension);
  }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`, async (req, res) => {
    let filter = {};
    if(req.query.categories) {
        filter = { category: req.query.categories.split(',')};
    }

    const productList = await Product.find(filter).populate('category');

    if(!productList)
        res.status(500).json({success: false, message: 'The product list cannot be retrieved.'});

    res.send(productList);
});

router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if(!product)
        return res.status(404).json({success: false, message: 'The product with the given ID was not found.'});

    res.status(200).send(product);
})

router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments();

    if(!productCount)
        return res.status(500).json({success: false, message: 'The product count cannot be retrieved.'});
    
    res.send({productCount: productCount});
})

router.get('/get/featured/:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const featuredProducts = await Product.find({ isFeatured: true }).limit(+count).populate('category');

    if(!featuredProducts)
        return res.status(500).json({success: false, message: 'The featured products cannot be retrieved.'});

    res.send(featuredProducts);
})

router.post(`/`, uploadOptions.single('image') , async (req, res) => {
    const category = await Category.findById(req.body.category);
    if(!category)
        return res.status(400).send('Invalid category');

    const file = req.file;
    if(!file)
        return res.status(400).send('No image in the request');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/${fileName}`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: basePath,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numOfReviews: req.body.numOfReviews,
        isFeatured: req.body.isFeatured
    });

    product = await product.save();
    if(!product)
        return res.status(404).json({success: false, message: 'The product cannot be created.'});

    res.status(200).send(product);
});

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('Invalid product ID');

    const category = await Category.findById(req.body.category);
    if(!category)
        return res.status(400).send('Invalid category');

    const checkProduct = await Product.findById(req.params.id);
    if(!checkProduct)
        return res.status(404).json({success: false, message: 'The product with the given ID was not found.'});

    const file = req.file;
    let imagePath;

    if(file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/${fileName}`;
        imagePath = basePath;
    }else {
        imagePath = checkProduct.image;
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            images: req.body.images,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numOfReviews: req.body.numOfReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true }   
    );

    if(!product)
        return res.status(404).json({success: false, message: 'The product cannot be updated.'});

    res.status(200).send(product);
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('Invalid product ID');

    const files = req.files;
    let imagesPaths = [];

    if(files){
        files.map(file => {
            imagesPaths.push(`${req.protocol}://${req.get('host')}/public/uploads/${file.filename}`);
        })
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths,
        },
        { new: true }   
    );

    if(!product)
        return res.status(404).json({success: false, message: 'The product cannot be updated.'});

    res.status(200).send(product);
})

router.delete('/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('Invalid product ID');

    const product = await Product.findByIdAndDelete(req.params.id);

    if(product) {
        return res.status(200).json({success: true, message: 'The product is deleted.'});
    } else {
        return res.status(404).json({success: false, message: 'Product not found.'});
    }
})

module.exports = router;