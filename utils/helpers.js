"use strict";
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; this.name = 'HttpError'; }
}
function check(condition, message, status=400) {
  if (!condition) throw new HttpError(status, message);
}
function required(body, keys) {
  check(body && typeof body==='object' && !Array.isArray(body), 'A JSON object is required');
  for (const key of keys) check(body[key]!==undefined && body[key]!==null && body[key]!=='', `${key} is required`);
}
function id(value, field='id') {
  const x=Number(value);
  check((typeof value==='string' && /^\d+$/.test(value)) || (typeof value==='number' && Number.isInteger(value)),`${field} must be a positive integer`);
  check(Number.isSafeInteger(x)&&x>0,`${field} must be a positive integer`);
  return x;
}
function text(value, field, maximum) {
  check(typeof value==='string',`${field} must be text`);
  const trimmed=value.trim();
  check(trimmed.length>0 && trimmed.length<=maximum,`${field} must contain 1-${maximum} characters`);
  return trimmed;
}
// All monetary amounts use integer cents internally, avoiding floating point totals.
function money(value, field, allowZero=false) {
  const s=typeof value==='number' || typeof value==='string' ? String(value).trim() : '';
  check(/^\d+(?:\.\d{1,2})?$/.test(s),`${field} must be a positive amount with up to two decimals`);
  const [whole,minor='']=s.split('.');
  const amount=Number(whole)*100+Number(minor.padEnd(2,'0'));
  check(Number.isSafeInteger(amount) && (allowZero?amount>=0:amount>0) && amount<=99999999999,
    `${field} must be ${allowZero?'nonnegative':'positive'} and fit DECIMAL(10,2)`);
  return amount;
}
function cents(value) {return money(value,'database amount',true);}
function decimal(c) {
  check(Number.isSafeInteger(c)&&c>=0,'Invalid money amount');
  return (c/100).toFixed(2);
}
function validDate(value,field) {
  check(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value),`${field} must have format YYYY-MM-DD`);
  const d=new Date(value+'T00:00:00Z');
  check(!Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===value,`${field} is not a real date`);
  return value;
}
function validateItems(value, purchase=false) {
  check(Array.isArray(value)&&value.length>0&&value.length<=100,'items must be an array of 1-100 entries');
  const seen=new Set();
  return value.map((item,i)=>{
    required(item,['fruit_id','packaging_size','quantity',...(purchase?['unit_cost']:[])]);
    const fruit_id=id(item.fruit_id,`items[${i}].fruit_id`);
    const packaging_size=item.packaging_size;
    check(['SMALL','MEDIUM','LARGE'].includes(packaging_size),`items[${i}].packaging_size must be SMALL, MEDIUM or LARGE`);
    const quantity=id(item.quantity,`items[${i}].quantity`);
    check(quantity<=1000000,`items[${i}].quantity is too large`);
    const unique=`${fruit_id}:${packaging_size}`;
    check(!seen.has(unique),`Duplicate fruit and packaging size: ${unique}`);
    seen.add(unique);
    return {fruit_id,packaging_size,quantity,...(purchase?{unit_cost:money(item.unit_cost,`items[${i}].unit_cost`)}:{})};
  });
}
// Keep the original mobile-money value for historical records.
const PAYMENT_METHODS = Object.freeze([
  'CASH', 'MOBILE_MONEY', 'CREDIT', 'MPESA', 'ECOCASH', 'CARD_BANK'
]);
function paymentMethod(value) {
  const aliases = { 'M-PESA': 'MPESA', 'BANK-CARD': 'CARD_BANK' };
  const normalized = aliases[value] || value || 'CREDIT';
  check(PAYMENT_METHODS.includes(normalized),
    'payment_method must be CASH, MOBILE_MONEY, CREDIT, MPESA, ECOCASH or CARD_BANK');
  return normalized;
}
module.exports={HttpError,check,required,id,text,money,cents,decimal,validDate,validateItems,paymentMethod,PAYMENT_METHODS};
