const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const verifyToken = require('../middleware/verifyToken');

// POST /orders — create a new order
router.post('/', verifyToken, async (req, res) => {
  const { vendorId, vendorName, items, deliveryAddress, paymentMethod, promoCode } = req.body;
  const userId = req.user.uid;

  try {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = req.body.deliveryFee || 0;
    const serviceFee = 150;
    const discount = 0; // promo logic can go here later
    const total = subtotal + deliveryFee + serviceFee - discount;

    // Deduct from wallet if payment method is wallet
    if (paymentMethod === 'wallet') {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const balance = userDoc.data().walletBalance;
      if (balance < total) return res.status(400).json({ error: 'Insufficient wallet balance' });
      await userRef.update({ walletBalance: admin.firestore.FieldValue.increment(-total) });
    }

    const orderNumber = Math.floor(700000 + Math.random() * 99999).toString();

    const orderRef = await db.collection('orders').add({
      orderNumber,
      userId,
      vendorId,
      vendorName,
      items,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      total,
      promoCode: promoCode || null,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'confirmed',
      deliveryAddress,
      rider: null,
      estimatedDeliveryMins: 30,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log transaction
    await db.collection('transactions').add({
      userId,
      type: 'debit',
      category: 'food_order',
      title: `Order from ${vendorName}`,
      amount: total,
      status: 'completed',
      reference: `TRX-${orderNumber}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ orderId: orderRef.id, orderNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/user — fetch all orders for the logged-in user
router.get('/user', verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/:id — single order (for tracking screen)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('orders').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    if (doc.data().userId !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /orders/:id/status — update order status (admin/rider use)
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'cooking', 'in_transit', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    await db.collection('orders').doc(req.params.id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
