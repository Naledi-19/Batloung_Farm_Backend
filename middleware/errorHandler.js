const { HttpError } = require('../utils/helpers');
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  if (err instanceof HttpError) return res.status(err.status).json({message:err.message});
  if (['ECONNREFUSED','ETIMEDOUT','ENOTFOUND','PROTOCOL_CONNECTION_LOST','ER_CON_COUNT_ERROR'].includes(err.code)) return res.status(503).json({message:'Database temporarily unavailable'});
  if (err.type==='entity.parse.failed') return res.status(400).json({message:'Invalid JSON request body'});
  if (err.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Record already exists'});
  if (err.code==='ER_ROW_IS_REFERENCED_2') return res.status(409).json({message:'Record is used in another transaction and cannot be deleted'});
  if (err.code==='ER_NO_REFERENCED_ROW_2') return res.status(400).json({message:'Referenced record not found'});
  if (err.code==='ER_CHECK_CONSTRAINT_VIOLATED' || err.code==='ER_DATA_TOO_LONG' || err.code==='WARN_DATA_TRUNCATED') return res.status(400).json({message:'Invalid record values'});
  res.status(500).json({message:'Unexpected server error'});
};
