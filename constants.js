const PORT = 9999;

const GET_PRICE_URL = articul =>
  `https://www.wildberries.by/content/cardpromo?cod1s=${articul}`;
const GET_HTML_URL = articul =>
  `https://www.wildberries.by/catalog/${articul}/detail.aspx?targetUrl=GP`;

// 1 hour
const DATE_DIVIDER = 60 * 60 * 1000;

// 300000 prev. byn ~30.00 new byn
const PRICE_DIVIDER = 10000;

// 4 weeks
const TRACKING_PERIOD = 28 * 24 * 60 * 60 * 1000;

// 1 hour
const UPDATE_PRODUCT_PERIOD = 60 * 60 * 1000;

module.exports = {
  PORT,
  GET_PRICE_URL,
  GET_HTML_URL,
  DATE_DIVIDER,
  TRACKING_PERIOD,
  UPDATE_PRODUCT_PERIOD,
  PRICE_DIVIDER,
};
