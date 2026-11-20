const model=require('../models/stockModel');const {check}=require('../utils/helpers');
exports.list=async(req,res)=>res.json(await model.all());
exports.low=async(req,res)=>{
 const threshold=Number(req.query.threshold ?? process.env.LOW_STOCK_THRESHOLD ?? 5);
 check(Number.isSafeInteger(threshold)&&threshold>=0,'threshold must be a nonnegative integer');
 res.json(await model.low(threshold));
};
