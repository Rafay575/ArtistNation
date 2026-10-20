const orderModel = require('../models/order');

exports.getMyOrders = async (req, res, next) => {
  try {
    const fanId = req.fan.id;        // from fanAuth middleware
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const data = await orderModel.getOrdersByFan(fanId, { page, limit, status, startDate, endDate });
    res.json(data);
  } catch (err) {
    next(err);
  }
};