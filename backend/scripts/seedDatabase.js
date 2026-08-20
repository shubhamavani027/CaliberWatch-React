const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Watch = require('../models/Watch');
const Order = require('../models/Order');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Watch.deleteMany({});
    await Order.deleteMany({});

    // Seed Watches
    const watches = await Watch.insertMany([
      // Luxury Watches
      {
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop',
        title: 'Rolex Submariner Pro',
        description: 'Professional dive watch with precision automatic movement and sapphire crystal',
        price: 747917,
        category: 'luxury',
        brand: 'Rolex',
        rating: 5,
        reviews: 128,
        stock: 5,
      },
      {
        image: 'https://images.unsplash.com/photo-1579409967389-1e1398ae2e00?w=500&h=500&fit=crop',
        title: 'Omega Seamaster',
        description: 'Swiss luxury timepiece with chronograph and ceramic bezel',
        price: 539500,
        category: 'luxury',
        brand: 'Omega',
        rating: 5,
        reviews: 95,
        stock: 7,
      },
      {
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=500&fit=crop',
        title: 'Tag Heuer Carrera',
        description: 'Swiss precision chronograph with stainless steel bracelet',
        price: 431600,
        category: 'luxury',
        brand: 'Tag Heuer',
        rating: 5,
        reviews: 87,
        stock: 4,
      },
      // Sports Watches
      {
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop',
        title: 'Garmin Fenix 7X',
        description: 'Multi-GNSS sports watch with advanced training metrics and 11-day battery',
        price: 66317,
        category: 'sports',
        brand: 'Garmin',
        rating: 5,
        reviews: 342,
        stock: 15,
      },
      {
        image: 'https://images.unsplash.com/photo-1579409967389-1e1398ae2e00?w=500&h=500&fit=crop',
        title: 'Suunto 9 Peak',
        description: 'Ultra-durable sports watch with true ambient light display',
        price: 49717,
        category: 'sports',
        brand: 'Suunto',
        rating: 5,
        reviews: 234,
        stock: 12,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Apple Watch Ultra',
        description: 'Rugged action watch with always-on Retina display and emergency SOS',
        price: 66317,
        category: 'sports',
        brand: 'Apple',
        rating: 5,
        reviews: 512,
        stock: 20,
      },
      // Casual Watches
      {
        image: 'https://images.unsplash.com/photo-1569495282631-e3a5ad0a4b83?w=500&h=500&fit=crop',
        title: 'Titan Classic Steel',
        description: 'Elegant stainless steel casual watch with minimalist design',
        price: 49717,
        category: 'casual',
        brand: 'Titan',
        rating: 4.8,
        reviews: 156,
        stock: 25,
      },
      {
        image: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=500&h=500&fit=crop',
        title: 'Titan Gold Plated',
        description: 'Premium gold-plated casual watch with sapphire crystal',
        price: 120350,
        category: 'casual',
        brand: 'Titan',
        rating: 4.9,
        reviews: 203,
        stock: 18,
      },
      {
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        title: 'Tommy Hilfiger Classic',
        description: 'Casual analog watch with genuine leather strap and water resistance',
        price: 41500,
        category: 'casual',
        brand: 'Tommy Hilfiger',
        rating: 4.7,
        reviews: 298,
        stock: 22,
      },
      {
        image: 'https://images.unsplash.com/photo-1533052923ff5a82f5b814ec10631e8e38d4e0ee?w=500&h=500&fit=crop',
        title: 'Police Analog Watch',
        description: 'Classic police watch with stainless steel case and durable design',
        price: 48970,
        category: 'casual',
        brand: 'Police',
        rating: 4.6,
        reviews: 145,
        stock: 19,
      },
      // Smartwatches
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Samsung Galaxy Watch 6',
        description: 'Advanced smartwatch with AMOLED display, health tracking, and 40+ apps',
        price: 24817,
        category: 'smartwatch',
        brand: 'Samsung',
        rating: 4.9,
        reviews: 892,
        stock: 30,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Fitbit Sense 2',
        description: 'Health and fitness smartwatch with EDA sensor and stress management tools',
        price: 24817,
        category: 'smartwatch',
        brand: 'Fitbit',
        rating: 4.7,
        reviews: 567,
        stock: 28,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Wear OS by Google',
        description: 'Universal smartwatch platform with Google Assistant and fitness tracking',
        price: 20667,
        category: 'smartwatch',
        brand: 'Google',
        rating: 4.8,
        reviews: 445,
        stock: 26,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Xiaomi Mi Watch Ultra',
        description: 'Premium smartwatch with titanium case and dual-frequency GPS',
        price: 28967,
        category: 'smartwatch',
        brand: 'Xiaomi',
        rating: 4.8,
        reviews: 634,
        stock: 24,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Huawei Watch 4 Pro',
        description: 'Chinese premium smartwatch with eSIM, ECG, and SpO2 monitoring',
        price: 33117,
        category: 'smartwatch',
        brand: 'Huawei',
        rating: 4.7,
        reviews: 521,
        stock: 21,
      },
      // Additional Luxury Watches
      {
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop',
        title: 'Patek Philippe Nautilus',
        description: 'Ultra-luxury Swiss timepiece with integrated bracelet and date window',
        price: 1327917,
        category: 'luxury',
        brand: 'Patek Philippe',
        rating: 5,
        reviews: 76,
        stock: 2,
      },
      {
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop',
        title: 'Cartier Ballon Bleu',
        description: 'Iconic luxury watch with distinctive cabochon crown and sapphire crown',
        price: 597600,
        category: 'luxury',
        brand: 'Cartier',
        rating: 5,
        reviews: 64,
        stock: 3,
      },
      // Additional Sports Watches
      {
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop',
        title: 'Coros Apex Pro',
        description: 'AMOLED sports watch with training load tracking and 25-day battery life',
        price: 49717,
        category: 'sports',
        brand: 'Coros',
        rating: 4.9,
        reviews: 456,
        stock: 16,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Garmin Epix Gen 2',
        description: 'Premium AMOLED sports watch with advanced mapping and training features',
        price: 74617,
        category: 'sports',
        brand: 'Garmin',
        rating: 4.9,
        reviews: 523,
        stock: 13,
      },
      // Additional Casual Watches
      {
        image: 'https://images.unsplash.com/photo-1569495282631-e3a5ad0a4b83?w=500&h=500&fit=crop',
        title: 'Citizen Eco-Drive',
        description: 'Solar-powered casual watch with date display and water resistance',
        price: 29050,
        category: 'casual',
        brand: 'Citizen',
        rating: 4.8,
        reviews: 789,
        stock: 28,
      },
      {
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        title: 'Seiko 5 Sports',
        description: 'Japanese automatic watch with day-date display and water resistance to 100m',
        price: 22825,
        category: 'casual',
        brand: 'Seiko',
        rating: 4.7,
        reviews: 654,
        stock: 32,
      },
      // Additional Smartwatches
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Garmin Venu 3',
        description: 'Premium smartwatch with AMOLED display and advanced health monitoring',
        price: 37267,
        category: 'smartwatch',
        brand: 'Garmin',
        rating: 4.9,
        reviews: 712,
        stock: 19,
      },
      {
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        title: 'Amazfit GTR 4',
        description: 'Sleek smartwatch with 14-day battery life and comprehensive fitness tracking',
        price: 14857,
        category: 'smartwatch',
        brand: 'Amazfit',
        rating: 4.6,
        reviews: 423,
        stock: 35,
      },
    ]);

    console.log('✅ Watches seeded:', watches.length);

    // Seed Users
    const users = await User.insertMany([
      {
        name: 'abc',
        email: 'abc@abc.com',
        password: await bcrypt.hash('123', 10),
      },
      {
        name: 'meet',
        email: 'meet@gmail.com',
        password: await bcrypt.hash('meet123', 10),
      },
      {
        name: 'smit',
        email: 'smit@gmail.com',
        password: await bcrypt.hash('smit123', 10),
      },
      {
        name: 'xyz',
        email: 'xyz@xyz.com',
        password: await bcrypt.hash('123', 10),
      },
      {
        name: 'parth',
        email: 'parth@gmail.com',
        password: await bcrypt.hash('123', 10),
      },
      {
        name: 'raj',
        email: 'raj@gmail.com',
        password: await bcrypt.hash('1818', 10),
      },
    ]);

    console.log('✅ Users seeded:', users.length);

    // Seed Admin (role-based)
    const adminUser = await User.create({
      name: 'Tirth',
      email: 'tirthkumbhani11@gmail.com',
      password: await bcrypt.hash('tirth11', 10),
      role: 'admin',
    });

    console.log('✅ Admin user seeded:', adminUser.email);

    // Seed Orders (sample data)
    const orders = await Order.insertMany([
      {
        user: users[0]._id,
        userEmail: 'abc@abc.com',
        fullName: 'meet',
        phone: '9316666919',
        shippingAddress: {
          addressLine1: 'abc charnbia',
          addressLine2: 'creoss',
          city: 'surat',
          state: 'gurjart',
          zip: '392166',
          country: 'India',
        },
        items: [
          {
            watch: watches[6]._id,
            title: watches[6].title,
            price: watches[6].price,
            quantity: 1,
          },
        ],
        subtotal: 1000,
        shipping: 10,
        total: 1010,
        status: 'Delivered',
      },
      {
        user: users[3]._id,
        userEmail: 'xyz@xyz.com',
        fullName: 'xyz',
        phone: '966556656',
        shippingAddress: {
          addressLine1: 'demo',
          addressLine2: 'demo',
          city: 'surat',
          state: 'gujarat',
          zip: '200010',
          country: 'India',
        },
        items: [
          {
            watch: watches[7]._id,
            title: watches[7].title,
            price: watches[7].price,
            quantity: 1,
          },
        ],
        subtotal: 1450,
        shipping: 10,
        total: 1460,
        status: 'Delivered',
      },
    ]);

    console.log('✅ Orders seeded:', orders.length);

    console.log('✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

