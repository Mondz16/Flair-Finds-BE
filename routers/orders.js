const { populate } = require('dotenv');
const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name');

    if(!orderList)
        return res.status(500).json({success: false, message: 'The order list cannot be retrieved.'});
    res.send(orderList);
});

router.get('/:id', async (req, res) => {
    const orders = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({'path': 'orderItems', populate: {'path': 'product', populate: 'category'}});

    if(!orders)
        return res.status(404).json({success: false, message: 'The order with the given ID was not found.'});

    res.status(200).send(orders);
})

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        {new: true}
    );

    if(!order)
        return res.status(404).send({success: false, message: 'The order cannot be updated.'});

    res.status(200).send(order);
})

router.delete('/:id', (req, res) => {
    Order.findByIdAndDelete(req.params.id).then( async order => {
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndDelete(orderItem);
            })
            return res.status(200).json({success: true, message: 'The order is deleted.'});
        } else {
            return res.status(404).json({success: false, message: 'The order with the given ID was not found.'});
        }
    }).catch(err => {
        return res.status(500).json({success: false, message: err.message});
    });
})

router.post(`/`, async (req, res) => {
    const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();
        if(!newOrderItem)
            return res.status(500).send('The order item cannot be created.');

        return newOrderItem._id;
    }));

    const totalPrices = await Promise.all(orderItemsIds.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const price = orderItem.product.price * orderItem.quantity
        return price;
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0)

    let order = new Order({
        orderItems: orderItemsIds,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    });

    order = await order.save();

    if(!order)  
        return res.status(404).json({success: false, message: 'The order cannot be created.'});

    res.status(200).send(order);
});

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);

    if(!totalSales)
        return res.status(500).json({success: false, message: 'The total sales cannot be calculated.'});

    res.send({totalSales: totalSales.pop().totalSales});
})

router.get('/get/userorders/:userid', async (req,res) => {
    const userOrders = await Order.find({user: req.params.userid}).
    populate(
        {path: 'orderItems', populate: { path: 'product', populate: 'category'}
    }).sort({'dateOrdered': -1});

    if(!userOrders)
        return res.status(500).json({success: false, message: 'The user orders cannot be retrieved.'});

    res.status(200).send(userOrders);
})

module.exports = router;