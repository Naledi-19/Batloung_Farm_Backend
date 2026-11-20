const test=require('node:test');
const assert=require('node:assert/strict');
const h=require('../utils/helpers');
test('IDs and text validated',()=>{
 assert.equal(h.id('23'),23);
 assert.throws(()=>h.id('oops'),/positive integer/);
 assert.equal(h.text(' apple ','fruit_name',80),'apple');
});
test('money uses exact cents',()=>{
 assert.equal(h.money('12.30','price'),1230);
 assert.equal(h.decimal(1230),'12.30');
 assert.throws(()=>h.money('1.234','price'),/two decimals/);
});
test('items reject duplicate fruit-package entries and missing entries',()=>{
 const item={fruit_id:1,packaging_size:'LARGE',quantity:2};
 assert.throws(()=>h.validateItems([item,item]),/Duplicate/);
 assert.throws(()=>h.validateItems([]),/1-100/);
 assert.deepEqual(h.validateItems([item]),[item]);
});
test('dates validated',()=>{
 assert.equal(h.validDate('2026-11-14','start'),'2026-11-14');
 assert.throws(()=>h.validDate('2026-02-30','start'),/real date/);
});

test('payment methods preserve legacy values and normalize aliases',()=>{
 assert.equal(h.paymentMethod('ECOCASH'),'ECOCASH');
 assert.equal(h.paymentMethod('MPESA'),'MPESA');
 assert.equal(h.paymentMethod('CARD_BANK'),'CARD_BANK');
 assert.equal(h.paymentMethod('M-PESA'),'MPESA');
 assert.equal(h.paymentMethod('BANK-CARD'),'CARD_BANK');
 assert.equal(h.paymentMethod('MOBILE_MONEY'),'MOBILE_MONEY');
 assert.equal(h.paymentMethod(undefined),'CREDIT');
 assert.throws(()=>h.paymentMethod('INVALID'),/payment_method/);
});
