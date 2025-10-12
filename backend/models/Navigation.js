import mongoose from 'mongoose';

const navigationItemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  href: { type: String, required: true },
  visible: { type: Boolean, default: true },
  active: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
});

const navigationSchema = new mongoose.Schema({
  items: [navigationItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Navigation = mongoose.model('Navigation', navigationSchema);

export default Navigation; 