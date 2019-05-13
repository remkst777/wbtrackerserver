const fetch = require("node-fetch");
const _ = require("lodash");
const moment = require("moment");
const nodemailer = require("nodemailer");

const {
  GET_PRICE_URL,
  GET_HTML_URL,
  DATE_DIVIDER,
  PRICE_DIVIDER,
} = require("./constants");

const getStartOfDay = day => {
  return moment(day)
    .startOf("day")
    .format("LL");
};

const getHMTime = time => moment(time).format("H:mm");

const getGroupedByDaysHistory = (history, timezoneDiff) => {
  const recoveredHistory = history.map(x => [
    x[0],
    x[1] * DATE_DIVIDER - timezoneDiff
  ]);
  return _.groupBy(recoveredHistory, x => getStartOfDay(x[1]));
};

const getDayListFromHistory = (history, timezoneDiff) => {
  const groupedByDaysHistory = getGroupedByDaysHistory(history, timezoneDiff);
  return Object.keys(groupedByDaysHistory);
};

const getStatForDay = (history, day, timezoneDiff) => {
  const dayStat = getGroupedByDaysHistory(history, timezoneDiff)[day];

  return {
    values: dayStat.map(x => x[0]),
    times: dayStat.map(x => getHMTime(x[1]))
  };
};

// stat for period:
// 2 graphs where control points are days (with average price and min)

const getStatForPeriod = (history, period, timezoneDiff) => {
  const groupedByDaysHistory = getGroupedByDaysHistory(history, timezoneDiff);

  const days = Object.keys(groupedByDaysHistory).slice(-period);

  const statForPeriod = days.map(x => groupedByDaysHistory[x]);

  const averageValues = statForPeriod.map(x =>
    roundValue(_.meanBy(x, y => y[0]))
  );

  const minValues = statForPeriod.map(x =>
    roundValue(_.minBy(x, y => y[0])[0])
  );

  return { averageValues, minValues, days };
};

const getCurrentPrice = async articul => {
  const info = await fetch(GET_PRICE_URL(articul), {
    headers: { "x-requested-with": "XMLHttpRequest" },
    method: "POST"
  });

  const infoJson = await info.json();

  const price = infoJson.Value.promoInfo.PriceWithCouponAndDiscount;
  const date = Date.now();

  return [roundValue(price / PRICE_DIVIDER), roundValue(date / DATE_DIVIDER)];
};

const getProductInfo = async articul => {
  const promise2 = async () => {
    const info = await fetch(GET_HTML_URL(articul));

    const infoText = await info.text();

    const image = await infoText
      .replace(/(\r\n|\n|\r)/gm, "")
      .match(/<img(.*?)>/gm)
      .filter(x => !x.match(/style="(.*?)"/) && x.includes(articul))[0];

    const [imageLink, name] = image
      .match(/"(.*?)"/gm)
      .map(x => x.replace(/"/g, ""));

    return {
      imageLink: `https:${imageLink}`,
      name
    };
  };

  const result = await Promise.all([getCurrentPrice(articul), promise2()]);

  return {
    history: [result[0]],
    ...result[1]
  };
};

const roundValue = value => Math.round(value);

const sendEmail = (email, articul, costLower, actualCost, name) => {
  const message = {
    subject: "Wildberries Tracker: цена на Ваш товар снижена!",
    html: `Вы воспользовались приложением Wildberries Tracker. Отслеживаемый Вами товар с артикулом ${articul} (${name}) был снижен в цене на ${costLower}%. Актуальная стоимость: ${actualCost}BYN`
  };

  const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_SERVICE_USER,
      pass: process.env.MAIL_SERVICE_PASSWORD
    }
  });

  transporter.sendMail({
    from: process.env.MAIL_SERVICE,
    to: email,
    subject: message.subject,
    html: message.html
  });
};

module.exports = {
  getProductInfo,
  getCurrentPrice,
  getDayListFromHistory,
  getGroupedByDaysHistory,
  getStatForDay,
  sendEmail,
  getStatForPeriod
};
