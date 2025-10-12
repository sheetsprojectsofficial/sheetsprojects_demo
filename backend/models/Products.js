import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  sections: {
    type: Number,
    required: true
  },
  materials: {
    type: Number,
    required: true
  },
  price: {
    type: String,
    required: true
  }
});

const productsSchema = new mongoose.Schema({
  heading: {
    type: String,
    default: 'Access Pre-Recorded'
  },
  headingHighlight: {
    type: String,
    default: 'Lectures Anytime, Anywhere!'
  },
  subheading: {
    type: String,
    default: 'Explore the best Pre-Recorded Modules from Cirque Valley, designed to make learning easier, more flexible, and deeply insightful for you. Learn at your own pace, anytime, anywhere!'
  },
  products: [productSchema]
}, {
  timestamps: true
});

const Products = mongoose.model('Products', productsSchema);

export default Products; 