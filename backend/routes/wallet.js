const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const verifyToken = require('../middleware/verifyToken');

// GET /wallet/balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ walletBalance: doc.data().walletBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /wallet/topup
router.post('/topup', verifyToken, async (req, res) => {
  const { amount, method } = req.body; // method: 'bank' | 'card'
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({
      walletBalance: admin.firestore.FieldValue.increment(amount),
    });

    const reference = `TRX-TOPUP-${Date.now()}`;
    await db.collection('transactions').add({
      userId: req.user.uid,
      type: 'credit',
      category: 'topup',
      title: `Top up via ${method === 'bank' ? 'Bank Transfer' : 'Card'}`,
      amount,
      status: 'success',
      reference,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Wallet topped up', reference });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /wallet/send — send money to another user by username/uid
router.post('/send', verifyToken, async (req, res) => {
  const { recipientUsername, amount } = req.body;
  const senderId = req.user.uid;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    // Find recipient by username (stored as fullName or a username field)
    const recipientSnap = await db
      .collection('users')
      .where('username', '==', recipientUsername)
      .limit(1)
      .get();

    if (recipientSnap.empty) return res.status(404).json({ error: 'Recipient not found' });

    const recipientDoc = recipientSnap.docs[0];
    const recipientId = recipientDoc.id;

    if (recipientId === senderId) return res.status(400).json({ error: 'Cannot send to yourself' });

    // Check sender balance
    const senderDoc = await db.collection('users').doc(senderId).get();
    if (senderDoc.data().walletBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const reference = `TRX-SEND-${Date.now()}`;
    const batch = db.batch();

    // Deduct from sender
    batch.update(db.collection('users').doc(senderId), {
      walletBalance: admin.firestore.FieldValue.increment(-amount),
    });

    // Credit recipient
    batch.update(db.collection('users').doc(recipientId), {
      walletBalance: admin.firestore.FieldValue.increment(amount),
    });

    await batch.commit();

    // Log both transactions
    await Promise.all([
      db.collection('transactions').add({
        userId: senderId,
        type: 'debit',
        category: 'transfer',
        title: `Sent to @${recipientUsername}`,
        amount,
        status: 'completed',
        reference,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      db.collection('transactions').add({
        userId: recipientId,
        type: 'credit',
        category: 'transfer',
        title: `Received from @${req.user.email}`,
        amount,
        status: 'success',
        reference,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);

    res.json({ message: 'Transfer successful', reference });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /wallet/transactions — fetch transaction history for logged-in user
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection('transactions')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
