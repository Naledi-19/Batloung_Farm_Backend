const model=require('../models/reportModel');const {validDate,check}=require('../utils/helpers');
exports.topFruits=async(req,res)=>res.json(await model.topFruits());
exports.revenue=async(req,res)=>{
 const start=validDate(req.query.start,'start'),end=validDate(req.query.end,'end');
 check(start<=end,'start must be on or before end');
 res.json({start,end,...await model.revenue(start,end)});
};
exports.topVendor=async(req,res)=>res.json(await model.topVendor());
exports.stock=async(req,res)=>res.json(await model.inventory());
exports.outstanding=async(req,res)=>res.json(await model.outstanding());
