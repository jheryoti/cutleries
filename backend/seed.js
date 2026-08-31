/**
 * Firestore Schema Seeder
 * Run once to populate your database with the correct structure.
 * Usage: node backend/seed.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');  // fixed filename

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://cutleries-default-rtdb.firebaseio.com',
});

const db = admin.firestore();
db.settings({ databaseId: 'default' });

async function seed() {
  console.log('🌱 Seeding Firestore...');

  // ─── USERS ────────────────────────────────────────────────────────────────
  // Created automatically on signup, but this defines the schema.
  // Collection: users/{uid}
  await db.collection('users').doc('sample_user_uid').set({
    uid: 'sample_user_uid',
    fullName: 'Amara Okafor',
    email: 'amara.okafor@curator.ng',
    phone: '+2348001234567',
    photoURL: '',
    memberTier: 'platinum',        // 'standard' | 'gold' | 'platinum'
    rating: 4.9,
    walletBalance: 12450,          // in Naira (integer kobo or Naira — pick one, stay consistent)
    savedAddresses: [
      {
        label: 'Home',
        address: '45 Glover Road, Ikoyi, Lagos',
        apartment: 'Apt 4B, Blue Water Towers',
        isDefault: true,
      },
    ],
    paymentMethods: [
      {
        type: 'card',
        last4: '4242',
        brand: 'Mastercard',
        isDefault: true,
      },
    ],
    notificationsEnabled: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ─── CATEGORIES ───────────────────────────────────────────────────────────
  // Collection: categories/{id}
  const categories = [
    { id: 'suya',        label: 'Suya',        icon: '🔥', order: 1 },
    { id: 'restaurants', label: 'Restaurants', icon: '🍽️', order: 2 },
    { id: 'drinks',      label: 'Drinks',      icon: '🍹', order: 3 },
    { id: 'ice_cream',   label: 'Ice Cream',   icon: '🍦', order: 4 },
    { id: 'bakery',      label: 'Bakery',      icon: '🎂', order: 5 },
    { id: 'noodles',     label: 'Noodles',     icon: '🍜', order: 6 },
  ];
  for (const cat of categories) {
    await db.collection('categories').doc(cat.id).set(cat);
  }

  // ─── VENDORS ──────────────────────────────────────────────────────────────
  // Collection: vendors/{id}
  const vendors = [
    {
      id: 'vendor_1',
      name: 'The Lagos Grill House',
      cuisine: 'Authentic Suya & Afro-Fusion Cuisine',
      categoryId: 'suya',
      rating: 4.8,
      reviewCount: 320,
      deliveryTimeMin: 25,
      deliveryTimeMax: 35,
      distanceKm: 1.2,
      deliveryFee: 800,
      isFeatured: true,
      badge: 'Featured',
      tag: 'Live Tracking',
      imageURL: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
      isOpen: true,
      location: new admin.firestore.GeoPoint(6.4550, 3.3841),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: 'vendor_2',
      name: 'Urban Bistro & Co.',
      cuisine: 'Gourmet Burgers & Craft Shakes',
      categoryId: 'restaurants',
      rating: 4.5,
      reviewCount: 210,
      deliveryTimeMin: 15,
      deliveryTimeMax: 20,
      distanceKm: 2.4,
      deliveryFee: 0,
      isFeatured: false,
      badge: null,
      tag: 'Fast Delivery',
      imageURL: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      isOpen: true,
      location: new admin.firestore.GeoPoint(6.4281, 3.4219),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: 'vendor_3',
      name: "Ocean's Finest Sushi",
      cuisine: 'Authentic Japanese, Victoria Island',
      categoryId: 'restaurants',
      rating: 4.9,
      reviewCount: 180,
      deliveryTimeMin: 30,
      deliveryTimeMax: 40,
      distanceKm: 3.1,
      deliveryFee: 1200,
      isFeatured: true,
      badge: "Chef's Special",
      tag: null,
      imageURL: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
      isOpen: true,
      location: new admin.firestore.GeoPoint(6.4295, 3.4112),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];
  for (const vendor of vendors) {
    const { id, ...data } = vendor;
    await db.collection('vendors').doc(id).set(data);
  }

  // ─── MENU ITEMS ───────────────────────────────────────────────────────────
  // Collection: vendors/{vendorId}/menuItems/{itemId}
  const menuItems = [
    // Vendor 1 — Lagos Grill House
    { vendorId: 'vendor_1', id: 'item_a1', category: 'Appetizers', name: 'Spicy Suya Skewers',    description: 'Traditional spice-rubbed beef, grilled to perfection with red onions.', price: 4500,  imageURL: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80', isFeatured: false, isAvailable: true },
    { vendorId: 'vendor_1', id: 'item_a2', category: 'Appetizers', name: "Mama's Peppered Snail", description: 'Jumbo snails slow-cooked in a fiery habanero and bell pepper sauce.',    price: 7200,  imageURL: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80', isFeatured: false, isAvailable: true },
    { vendorId: 'vendor_1', id: 'item_m1', category: 'Mains',      name: 'Pounded Yam & Egusi',   description: 'Fluffy pounded yam served with rich melon seed soup and assorted meats.',  price: 8500,  imageURL: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80', isFeatured: true,  isAvailable: true },
    { vendorId: 'vendor_1', id: 'item_m2', category: 'Mains',      name: 'Point & Kill Catfish',  description: 'Whole catfish grilled over open flame with signature spice blend.',         price: 12000, imageURL: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80', isFeatured: true,  isAvailable: true },
    { vendorId: 'vendor_1', id: 'item_s1', category: 'Sides',      name: 'Fried Plantains',       description: 'Sweet ripe plantains fried to golden perfection.',                         price: 1500,  imageURL: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80', isFeatured: false, isAvailable: true },
    { vendorId: 'vendor_1', id: 'item_d1', category: 'Desserts',   name: 'Chin Chin',             description: 'Crispy fried dough snack with a hint of coconut.',                         price: 1200,  imageURL: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=80', isFeatured: false, isAvailable: true },
    // Vendor 2 — Urban Bistro
    { vendorId: 'vendor_2', id: 'item_b1', category: 'Mains',      name: 'Truffle Umami Burger',  description: 'Wagyu beef patty with truffle aioli and caramelised onions.',               price: 12500, imageURL: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', isFeatured: true,  isAvailable: true },
    { vendorId: 'vendor_2', id: 'item_b2', category: 'Drinks',     name: 'Craft Mango Shake',     description: 'Fresh mango blended with vanilla ice cream and a hint of cardamom.',        price: 3200,  imageURL: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80', isFeatured: false, isAvailable: true },
  ];
  for (const item of menuItems) {
    const { vendorId, id, ...data } = item;
    await db.collection('vendors').doc(vendorId).collection('menuItems').doc(id).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────
  // Collection: orders/{orderId}
  await db.collection('orders').doc('order_sample_1').set({
    orderId: 'order_sample_1',
    orderNumber: '728491',
    userId: 'sample_user_uid',
    vendorId: 'vendor_1',
    vendorName: 'The Lagos Grill House',
    items: [
      { menuItemId: 'item_m1', name: 'Pounded Yam & Egusi', price: 8500, qty: 1, note: 'Extra meat please' },
      { menuItemId: 'item_a1', name: 'Spicy Suya Skewers',  price: 4500, qty: 2, note: '' },
    ],
    subtotal: 17500,
    deliveryFee: 800,
    serviceFee: 150,
    discount: 0,
    total: 18450,
    promoCode: null,
    paymentMethod: 'wallet',       // 'wallet' | 'card' | 'bank'
    paymentStatus: 'paid',         // 'pending' | 'paid' | 'failed'
    status: 'delivered',           // 'pending' | 'confirmed' | 'cooking' | 'in_transit' | 'delivered' | 'cancelled'
    deliveryAddress: {
      label: 'Home',
      address: '45 Glover Road, Ikoyi, Lagos',
      apartment: 'Apt 4B, Blue Water Towers',
    },
    rider: {
      name: 'Tunde O.',
      vehicle: 'White Honda Super Cub',
      rating: 4.9,
      phone: '+2348001112233',
      photoURL: '',
    },
    estimatedDeliveryMins: 30,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ─── TRANSACTIONS ─────────────────────────────────────────────────────────
  // Collection: transactions/{transactionId}
  const transactions = [
    { userId: 'sample_user_uid', type: 'debit',  category: 'food_order',  title: 'Payment to Glovo',      amount: 2100,  status: 'completed', reference: 'TRX-0001' },
    { userId: 'sample_user_uid', type: 'credit', category: 'topup',       title: 'Top up via Transfer',   amount: 5000,  status: 'success',   reference: 'TRX-0002' },
    { userId: 'sample_user_uid', type: 'debit',  category: 'transport',   title: 'Payment to Bolt',       amount: 1450,  status: 'completed', reference: 'TRX-0003' },
    { userId: 'sample_user_uid', type: 'debit',  category: 'food_order',  title: 'Urban Bistro Order',    amount: 8200,  status: 'completed', reference: 'TRX-0004' },
    { userId: 'sample_user_uid', type: 'credit', category: 'topup',       title: 'Card Top Up',           amount: 20000, status: 'success',   reference: 'TRX-0005' },
    { userId: 'sample_user_uid', type: 'debit',  category: 'transfer',    title: 'Sent to @Tayo_Design',  amount: 2000,  status: 'completed', reference: 'TRX-0006' },
  ];
  for (const tx of transactions) {
    await db.collection('transactions').add({
      ...tx,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // ─── RIDERS ───────────────────────────────────────────────────────────────
  // Collection: riders/{riderId}
  await db.collection('riders').doc('rider_1').set({
    name: 'Tunde O.',
    phone: '+2348001112233',
    vehicle: 'White Honda Super Cub',
    plateNumber: 'LND-123-XY',
    rating: 4.9,
    totalDeliveries: 842,
    isAvailable: true,
    currentLocation: new admin.firestore.GeoPoint(6.4450, 3.3900),
    photoURL: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Firestore seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
