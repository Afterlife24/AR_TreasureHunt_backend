const mongoose = require('mongoose');
const { Schema } = mongoose;

const arContentSchema = new Schema({
  // Content type and ownership
  type: { type: String },
  ownerUserId: { type: String },

  // Geospatial location (GeoJSON Point)
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },

  // Altitude (meters above sea level)
  altitude: { type: Number },

  // AR transform data
  localOffsetPosition: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  localOffsetRotationEuler: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  localScale: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },

  // World position and rotation (Euler angles)
  worldPosition: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  worldRotationEuler: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },

  // Marker anchor data
  markerLocalOffset: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  useMarkerAnchor: { type: Boolean, default: false },

  // Trigger and visibility
  triggerRadiusMeters: { type: Number },
  visibility: { type: String },
  heading: { type: Number },

  // Content payload
  content: { type: Schema.Types.Mixed },

  // CDN asset URLs
  markerImageUrl: { type: String, required: true },
  clueRenderImageUrl: { type: String, required: true },

  // Soft delete flag
  isDeleted: { type: Boolean, default: false },

  // Additional metadata from contentJson (flexible)
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true // createdAt, updatedAt
});

// 2dsphere index for geospatial queries
arContentSchema.index({ location: '2dsphere' });

// Compound index for efficient filtered queries
arContentSchema.index({ isDeleted: 1, location: '2dsphere' });

module.exports = mongoose.model('ArContent', arContentSchema);
