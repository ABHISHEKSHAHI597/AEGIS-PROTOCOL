/**
 * Facility Model
 * Campus facilities with map coordinates and details
 */
import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Library', 'Cafeteria', 'Lab', 'Sports', 'Hostel', 'Admin', 'Classroom', 'Parking', 'Medical', 'Other'],
    },
    description: {
      type: String,
      default: '',
    },
    building: {
      type: String,
      trim: true,
    },
    buildingCode: {
      type: String,
      trim: true,
      sparse: true,
    },
    floorMapImage: {
      type: String,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    // Coordinates for campus map (percentage: 0-100) – for overlay maps
    mapX: { type: Number, default: 50 },
    mapY: { type: Number, default: 50 },
    // Geo coordinates for interactive map (Leaflet) and routing
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    campus: {
      type: String,
      enum: ['north', 'south', ''],
      default: '',
    },
    // Opening hours (e.g. "9 AM - 5 PM", "24/7")
    hours: {
      type: String,
      default: '',
    },
    amenities: [String],
    contact: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Facility', facilitySchema);
