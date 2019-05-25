const mongoose = require("mongoose");

// Product Schema
const ProductSchema = mongoose.Schema({
  articul: {
    type: Number,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  imageLink: {
    type: String,
    required: true,
    trim: true
  },
  history: {
    type: Array,
    required: true
  },
  startTracking: {
    type: Date,
    required: false
  },
  users: {
    type: Array,
    required: false
  }
});

const Product = (module.exports = mongoose.model(
  process.env.BD_PROD,
  ProductSchema
));
