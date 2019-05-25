const express = require("express");

const router = express.Router();

const ProductsModel = require("../models/productsModel");

const {
  getProductInfo,
  getCurrentPrice,
  getStatForPeriod,
  getDayListFromHistory,
  sendEmail,
  getStatForDay
} = require("../utils");

const { UPDATE_PRODUCT_PERIOD, TRACKING_PERIOD } = require("../constants");

router.post("/get-daystat", (req, res) => {
  try {
    const { day, articul, timezoneDiff } = req.body;

    ProductsModel.find({ articul }, (err, x) => {
      if (err || !x[0])
        return res.status(500).send({ message: "Ошибка сервера..." });

      res.status(200).send({
        message: "Ок",
        info: {
          articul: x[0].articul,
          imageLink: x[0].imageLink,
          name: x[0].name,
          stat: getStatForDay(x[0].history, day, timezoneDiff)
        }
      });
    });
  } catch (err) {
    res.status(500).send({ message: "Ошибка сервера..." });
  }
});

router.post("/get-periodstat", (req, res) => {
  try {
    const { period, articul, timezoneDiff } = req.body;

    ProductsModel.find({ articul }, (err, x) => {
      if (err) return res.status(500).send({ message: "Ошибка сервера..." });

      res.status(200).send({
        message: "Ок",
        info: {
          articul: x[0].articul,
          imageLink: x[0].imageLink,
          name: x[0].name,
          stat: getStatForPeriod(x[0].history, period, timezoneDiff)
        }
      });
    });
  } catch (err) {
    res.status(500).send({ message: "Ошибка сервера..." });
  }
});

router.post("/get-list-of-products", async (req, res) => {
  try {
    const { articulList, timezoneDiff } = req.body;

    ProductsModel.find()
      .where("articul")
      .in(articulList)
      .exec((err, data) => {
        if (err) return res.status(500).send({ message: "Ошибка сервера..." });

        const list = data.map(x => ({
          articul: x.articul,
          imageLink: x.imageLink,
          name: x.name,
          days: getDayListFromHistory(x.history, timezoneDiff)
        }));

        res.status(200).send({ message: "Ок", list });
      });
  } catch (err) {
    res.status(500).send({ message: "Ошибка сервера..." });
  }
});

router.post("/finish-tracking", async (req, res) => {
  try {
    const { articul, email } = req.body;

    const productsInBD = await ProductsModel.find({ articul });

    const updatedUsers = productsInBD[0].users.filter(x => x !== email);

    ProductsModel.findByIdAndUpdate(
      productsInBD[0]._id,
      { users: updatedUsers },
      { new: true },
      err => {
        if (err) return res.status(500).send({ message: "Ошибка сервера" });
        res.status(200).send({ message: "Удалено!" });
      }
    );
  } catch (err) {
    res.status(500).send({ message: "Ошибка сервера..." });
  }
});

router.post("/start-tracking", async (req, res) => {
  try {
    const { articul, email } = req.body;

    const productsInBD = await ProductsModel.find({
      articul
    });

    // if such item is tracked - update tracking period
    if (productsInBD[0]) {
      const updatedUsers = productsInBD[0].users;

      if (email && !productsInBD[0].users.includes(email)) {
        updatedUsers.push(email);
      }

      ProductsModel.findByIdAndUpdate(
        productsInBD[0]._id,
        { startTracking: Date.now(), users: updatedUsers },
        { new: true },
        (err, data) => {
          if (err)
            return res.status(500).send({ message: "Ошибка сервера..." });

          const item = {
            name: data.name,
            articul: data.articul,
            imageLink: data.imageLink
          };

          res.status(200).send({ message: "Трек период обновлен!", item });
        }
      );

      return null;
    }

    // else - add new item to BD
    const productInfo = await getProductInfo(articul);

    const newProduct = new ProductsModel({
      articul,
      startTracking: Date.now(),
      users: [email],
      ...productInfo
    });

    newProduct.save((err, data) => {
      if (err) return res.status(500).send({ message: "Ошибка сервера..." });

      const item = {
        name: data.name,
        articul: data.articul,
        imageLink: data.imageLink
      };

      res.status(200).send({ message: "Добавлен новый трек!", item });
    });
  } catch (error) {
    res.status(500).send({ message: "Товар отсутствует или недоступен!" });
  }
});

router.get("/update-data/66/66/66/66/66", async (req, res) => {
  try {
    const products = await ProductsModel.find();

    const DateNow = Date.now();

    products.forEach(async x => {
      // CHECKING: if tracking is valid
      if (+x.startTracking + TRACKING_PERIOD < DateNow) return null;

      const currentPrice = await getCurrentPrice(x.articul);

      ProductsModel.findByIdAndUpdate(
        x._id,
        { history: [...x.history, currentPrice] },
        { new: true },
        () => null
      );

      const prevCost = x.history[x.history.length - 1][0];
      const actualCost = currentPrice[0];

      // to notify users about cost lowering
      if (actualCost < prevCost) {
        const costLower = Math.round((1 - actualCost / prevCost) * 100);

        x.users.map(email => {
          sendEmail(email, x.articul, costLower, actualCost, x.name);
        });
      }
    });

    res.status(200).send({ message: "Ок" });
  } catch (err) {
    res.status(500).send({ message: "Ошибка сервера..." });
  }
});

module.exports = router;
