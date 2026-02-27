import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: 'calendar'
  },
  color: {
    type: String,
    default: '#0EA5E9'
  },
  image: {
    type: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  eventCount: {
    type: Number,
    default: 0
  },
  metadata: {
    title: {
      type: String,
      maxlength: [70, 'Meta title cannot exceed 70 characters']
    },
    description: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
  },
  translations: {
    am: {
      name: String,
      description: String
    },
    om: {
      name: String,
      description: String
    },
    ti: {
      name: String,
      description: String
    },
    ko: {
      name: String,
      description: String
    }
  }
}, {
  timestamps: true
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
