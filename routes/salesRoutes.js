const r=require('express').Router();
const c=require('../controllers/salesController');
const w=require('../utils/asyncHandler');


r.get('/',w(c.list));
r.get('/:id',w(c.get));
r.post('/',w(c.create));
r.post('/:id/payments',w(c.addPayment));

module.exports=r;
