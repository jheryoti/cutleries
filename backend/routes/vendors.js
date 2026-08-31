const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /vendors — fetch all vendors (optionally filter by categoryId)
router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query;
    let query = db.collection('vendors').where('isOpen', '==', true);
    if (categoryId) query = query.where('categoryId', '==', categoryId);
    const snap = await query.get();
    const vendors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vendors/:id — single vendor
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('vendors').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vendors/:id/menu — fetch menu items grouped by category
router.get('/:id/menu', async (req, res) => {
  try {
    const snap = await db
      .collection('vendors')
      .doc(req.params.id)
      .collection('menuItems')
      .where('isAvailable', '==', true)
      .get();

    const grouped = {};
    snap.docs.forEach((d) => {
      const item = { id: d.id, ...d.data() };
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vendors/categories/all
router.get('/categories/all', async (req, res) => {
  try {
    const snap = await db.collection('categories').orderBy('order').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
