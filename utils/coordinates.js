const { check } = require('./helpers');

// Keeping coordinates together prevents a valid latitude with an unknown longitude.
function coordinates(body) {
  const latitude = body.latitude;
  const longitude = body.longitude;
  const missing = value => value === undefined || value === null || value === '';
  if (missing(latitude) && missing(longitude)) return [null, null];
  check(!missing(latitude) && !missing(longitude), 'latitude and longitude must both be provided or both be empty');
  check(typeof latitude === 'number' || (typeof latitude === 'string' && latitude.trim() !== ''), 'latitude must be a number');
  check(typeof longitude === 'number' || (typeof longitude === 'string' && longitude.trim() !== ''), 'longitude must be a number');
  const lat = Number(latitude);
  const lng = Number(longitude);
  check(Number.isFinite(lat) && lat >= -90 && lat <= 90, 'latitude must be between -90 and 90');
  check(Number.isFinite(lng) && lng >= -180 && lng <= 180, 'longitude must be between -180 and 180');
  return [Number(lat.toFixed(7)), Number(lng.toFixed(7))];
}
module.exports = { coordinates };
