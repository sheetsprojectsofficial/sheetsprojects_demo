import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  heading: {
    type: String,
    default: 'Our Portfolio'
  },
  subheading: {
    type: String,
    default: 'Explore the wide selection of sheets projects and courses.'
  },
  stats: [{
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    color: {
      type: String,
      enum: ['green', 'red', 'blue', 'yellow', 'purple'],
      default: 'red'
    }
  }]
}, {
  timestamps: true
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio; 