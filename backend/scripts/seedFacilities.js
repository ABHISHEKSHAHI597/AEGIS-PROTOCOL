/**
 * Seed campus facilities for map and listing
 * Includes North & South campus buildings from campus maps
 * Run: node scripts/seedFacilities.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facility from '../models/Facility.js';

dotenv.config();

// North campus center (example coords – adjust to real campus)
const NORTH_CENTER = { lat: 28.54, lng: 77.17 };
// South campus center
const SOUTH_CENTER = { lat: 28.532, lng: 77.168 };

function north(latOff, lngOff) {
  return { latitude: NORTH_CENTER.lat + latOff * 0.002, longitude: NORTH_CENTER.lng + lngOff * 0.002, campus: 'north' };
}
function south(latOff, lngOff) {
  return { latitude: SOUTH_CENTER.lat + latOff * 0.002, longitude: SOUTH_CENTER.lng + lngOff * 0.002, campus: 'south' };
}

const facilities = [
  // —— North Campus (from NorthCampusMap) ——
  { name: 'Students Activity Centre', type: 'Other', description: 'Student activities and events', building: 'SAC', floor: 'G', location: 'North Campus', hours: '9 AM - 8 PM', amenities: ['Events', 'Clubs'], ...north(0, 0) },
  { name: 'Sports Complex (North)', type: 'Sports', description: 'Gym, courts, playground', building: 'F12', floor: 'G', location: 'North Campus', hours: '6 AM - 10 PM', amenities: ['Gym', 'Courts'], ...north(0.02, 0.01) },
  { name: 'Playground', type: 'Sports', description: 'Playing courts and open ground', building: null, floor: null, location: 'North Campus', hours: '6 AM - 8 PM', ...north(0.015, -0.01) },
  { name: 'Catalyst & I-HUB Office', type: 'Admin', description: 'Innovation hub and startup office', building: 'I-HUB', floor: 'G', location: 'North Campus', hours: '9 AM - 6 PM', ...north(-0.01, 0.015) },
  { name: 'Community Centre', type: 'Other', description: 'Community events and gatherings', building: 'CC', floor: 'G', location: 'North Campus', hours: '8 AM - 8 PM', ...north(-0.005, -0.005) },
  { name: 'Fountain Park', type: 'Other', description: 'Central fountain and park', building: null, floor: null, location: 'North Campus', hours: '24/7', ...north(-0.008, 0.008) },
  { name: 'RSS', type: 'Other', description: 'Research or support facility', building: 'RSS', floor: 'G', location: 'North Campus', hours: '9 AM - 5 PM', ...north(0.01, 0.02) },
  { name: 'ST1', type: 'Other', description: 'North campus building ST1', building: 'ST1', floor: 'G', location: 'North Campus', hours: '8 AM - 6 PM', ...north(0.018, -0.015) },
  { name: 'ST2', type: 'Other', description: 'North campus building ST2', building: 'ST2', floor: 'G', location: 'North Campus', hours: '8 AM - 6 PM', ...north(0.02, -0.008) },
  { name: 'ESS North', type: 'Other', description: 'Essential services', building: 'ESS', floor: 'G', location: 'North Campus', hours: '24/7', ...north(-0.012, 0.01) },
  { name: 'Park North', type: 'Other', description: 'Green park area', building: null, floor: null, location: 'North Campus', hours: '24/7', ...north(-0.02, 0) },
  { name: 'Playing Courts North', type: 'Sports', description: 'Outdoor playing courts', building: null, floor: null, location: 'North Campus', hours: '6 AM - 8 PM', ...north(0.012, 0.018) },

  // —— South Campus (from SouthCampusMap) ——
  { name: 'Engineering Complex', type: 'Classroom', description: 'Engineering departments and labs', building: 'Eng Complex', floor: '1-3', location: 'South Campus', hours: '8 AM - 6 PM', amenities: ['Labs', 'Classrooms'], ...south(0, 0) },
  { name: 'Library (South)', type: 'Library', description: 'South campus library', building: 'Library', floor: '1-2', location: 'South Campus', hours: '8 AM - 10 PM', amenities: ['WiFi', 'AC', 'Study Rooms'], ...south(0.015, 0.01) },
  { name: 'Bulbul Canteen', type: 'Cafeteria', description: 'Student canteen', building: 'Bulbul', floor: 'G', location: 'South Campus', hours: '7 AM - 9 PM', amenities: ['Vegetarian', 'Beverages'], ...south(0.008, -0.008) },
  { name: 'Canteen South', type: 'Cafeteria', description: 'Dining hall', building: 'Canteen', floor: 'G', location: 'South Campus', hours: '7 AM - 9 PM', ...south(0.01, -0.005) },
  { name: 'Medical Unit', type: 'Medical', description: 'Campus medical facility', building: 'Medical Unit', floor: 'G', location: 'South Campus', hours: '8 AM - 8 PM', amenities: ['First Aid', 'Doctor'], ...south(-0.01, 0.012) },
  { name: 'Chandra Hostel', type: 'Hostel', description: 'Chandra hostel block', building: 'Chandra', floor: '1-4', location: 'South Campus', hours: '24/7', ...south(-0.02, -0.01) },
  { name: 'Taal Hostel', type: 'Hostel', description: 'Taal hostel block', building: 'Taal', floor: '1-4', location: 'South Campus', hours: '24/7', ...south(-0.018, -0.015) },
  { name: 'Guest House', type: 'Other', description: 'Campus guest house', building: 'Guest House', floor: 'G', location: 'South Campus', hours: '24/7', ...south(0.02, 0.015) },
  { name: 'Uhl Guest House', type: 'Other', description: 'Uhl guest house', building: 'Uhl', floor: 'G', location: 'South Campus', hours: '24/7', ...south(0.018, 0.02) },
  { name: 'Cricket Ground', type: 'Sports', description: 'Cricket ground', building: null, floor: null, location: 'South Campus', hours: '6 AM - 8 PM', ...south(0.012, -0.018) },
  { name: 'Football Ground', type: 'Sports', description: 'Football ground', building: null, floor: null, location: 'South Campus', hours: '6 AM - 8 PM', ...south(0.008, -0.022) },
  { name: 'Badminton Court', type: 'Sports', description: 'Badminton courts', building: null, floor: null, location: 'South Campus', hours: '6 AM - 10 PM', ...south(-0.005, -0.012) },
  { name: 'Mech Workshop', type: 'Lab', description: 'Mechanical engineering workshop', building: 'D1', floor: 'G', location: 'South Campus', hours: '9 AM - 5 PM', ...south(-0.015, 0.005) },
  { name: 'Stable Complex', type: 'Other', description: 'Stable and animal facility', building: 'Stable', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.022, 0) },
  { name: 'Small Animal Research Facility', type: 'Lab', description: 'Research facility', building: 'B9', floor: 'G', location: 'South Campus', hours: '9 AM - 5 PM', ...south(0.005, 0.02) },
  { name: 'Project Staff Residence', type: 'Hostel', description: 'Staff residence', building: 'C42', floor: '1-2', location: 'South Campus', hours: '24/7', ...south(0.022, 0.008) },
  { name: 'Bamboo Block A', type: 'Other', description: 'Bamboo block A', building: 'Bamboo A', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.025, -0.01) },
  { name: 'Bamboo Block B', type: 'Other', description: 'Bamboo block B', building: 'Bamboo B', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.028, -0.005) },
  { name: 'Bamboo Block C', type: 'Other', description: 'Bamboo block C', building: 'Bamboo C', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.03, 0) },
  { name: 'ESS South', type: 'Other', description: 'Essential services South', building: 'ESS', floor: 'G', location: 'South Campus', hours: '24/7', ...south(-0.008, -0.008) },
  { name: 'F.R.C', type: 'Other', description: 'F.R.C building', building: 'FRC', floor: 'G', location: 'South Campus', hours: '9 AM - 5 PM', ...south(-0.025, 0.015) },
  { name: 'Admin A1', type: 'Admin', description: 'Administration block A1', building: 'A1', floor: '1-2', location: 'South Campus', hours: '9 AM - 5 PM', ...south(-0.02, 0.01) },
  { name: 'Admin A2', type: 'Admin', description: 'Administration block A2', building: 'A2', floor: '1-2', location: 'South Campus', hours: '9 AM - 5 PM', ...south(-0.018, 0.012) },
  { name: 'Block A3', type: 'Classroom', description: 'Academic block A3', building: 'A3', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.016, 0.008) },
  { name: 'Block A4', type: 'Classroom', description: 'Academic block A4', building: 'A4', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.014, 0.006) },
  { name: 'Block A5', type: 'Classroom', description: 'Academic block A5', building: 'A5', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.012, 0.004) },
  { name: 'Block A6', type: 'Classroom', description: 'Academic block A6', building: 'A6', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.002, 0.014) },
  { name: 'Block A7', type: 'Classroom', description: 'Academic block A7', building: 'A7', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.004, 0.012) },
  { name: 'Block A8', type: 'Classroom', description: 'Academic block A8', building: 'A8', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.02, 0.005) },
  { name: 'Block B8', type: 'Classroom', description: 'Academic block B8', building: 'B8', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.018, 0.002) },
  { name: 'Block D3', type: 'Classroom', description: 'Block D3', building: 'D3', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.006, 0.006) },
  { name: 'Block D4', type: 'Classroom', description: 'Block D4', building: 'D4', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.002, 0.01) },
  { name: 'Block D5', type: 'Classroom', description: 'Block D5', building: 'D5', floor: '1-2', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.006, 0.012) },
  { name: 'G1', type: 'Other', description: 'Building G1', building: 'G1', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.012, -0.002) },
  { name: 'G2', type: 'Other', description: 'Building G2', building: 'G2', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.01, -0.006) },
  { name: 'G3', type: 'Other', description: 'Building G3', building: 'G3', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.008, -0.01) },
  { name: 'G4', type: 'Other', description: 'Building G4', building: 'G4', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.006, -0.014) },
  { name: 'S1', type: 'Other', description: 'Building S1', building: 'S1', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(-0.014, 0) },
  { name: 'C41', type: 'Other', description: 'Building C41', building: 'C41', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.012, 0.018) },
  { name: 'C42', type: 'Other', description: 'Building C42', building: 'C42', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.02, 0.01) },
  { name: 'C43', type: 'Other', description: 'Building C43', building: 'C43', floor: 'G', location: 'South Campus', hours: '8 AM - 6 PM', ...south(0.022, 0.012) },
  { name: 'Construction Office', type: 'Admin', description: 'Construction office', building: 'Construction', floor: 'G', location: 'South Campus', hours: '9 AM - 5 PM', ...south(0.015, -0.018) },
  { name: 'WTP', type: 'Other', description: 'Water treatment', building: 'WTP', floor: 'G', location: 'South Campus', hours: '24/7', ...south(0.008, -0.022) },
  { name: 'STP', type: 'Other', description: 'Sewage treatment', building: 'STP', floor: 'G', location: 'South Campus', hours: '24/7', ...south(-0.018, -0.012) },
];

// Add mapX, mapY for legacy overlay (percentage) from lat/lng relative to campus bounds
function addMapCoords(f) {
  const isNorth = f.campus === 'north';
  const lat = f.latitude;
  const lng = f.longitude;
  const ref = isNorth ? NORTH_CENTER : SOUTH_CENTER;
  const mapX = 50 + (lng - ref.lng) * 2500;
  const mapY = 50 - (lat - ref.lat) * 2500;
  return { ...f, mapX: Math.max(5, Math.min(95, mapX)), mapY: Math.max(5, Math.min(95, mapY)) };
}

const facilitiesWithMap = facilities.map(addMapCoords);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Facility.deleteMany({});
    await Facility.insertMany(facilitiesWithMap);
    console.log('Facilities seeded successfully:', facilitiesWithMap.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
