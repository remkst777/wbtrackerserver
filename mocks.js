const ProductsModel = require("./models/productsModel");
const { DATE_DIVIDER } = require("./constants");

const createFakeTracking = number => {
  const yy = Array(number).fill();

  yy.forEach(x => {
    const yy1 = [];
    const yy2 = Math.round(Date.now() / DATE_DIVIDER);

    // history for 28 days (24 times per day)
    for (let i = 0; i < 24 * 28; i++) {
      yy1.push([Math.round(100 + Math.random() * 100), yy2 - i]);
    }

    const history = yy1.reverse();

    const newProduct = new ProductsModel({
      articul: Math.round(Math.random() * 1000000),
      startTracking: Date.now(),
      name: `name_${Math.random()}`,
      imageLink: "//img1.wbstatic.net/tm/new/7340000/7340333-1.jpg",
      history
    });

    newProduct.save(err => console.log(err));
  });
};

module.exports = { createFakeTracking };
