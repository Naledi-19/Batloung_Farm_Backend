const r=require('express').Router();
const c=require('../controllers/reportController');
const w=require('../utils/asyncHandler');


r.get('/top-fruits',w(c.topFruits));
r.get('/revenue',w(c.revenue));
r.get('/top-vendor',w(c.topVendor));
r.get('/stock',w(c.stock));
r.get('/outstanding',w(c.outstanding));


module.exports=r;
