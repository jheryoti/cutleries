const express = require('express');
const router = express.Router();
const { db, admin, auth } = require('../config/firebase');
const verifyToken = require('../middleware/verifyToken');

// In-memory OTP store: { phone -> { otp, expiresAt } }
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/send-phone-otp
// Generates OTP, creates/gets Firebase user for phone, stores OTP, returns custom token flow
router.post('/send-phone-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  try {
    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(phone, { otp, expiresAt });

    // Log OTP to backend console (in production, send via SMS provider like Termii/Twilio)
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);

    // In production replace console.log with your SMS provider:
    // await sendSms(phone, `Your Cutleries OTP is: ${otp}`);

    res.json({ message: 'OTP sent', sessionInfo: phone }); // sessionInfo = phone as session key
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/verify-phone-otp
// Verifies OTP, creates Firebase user if needed, returns custom token
router.post('/verify-phone-otp', async (req, res) => {
  const { sessionInfo: phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Missing phone or code' });

  const record = otpStore.get(phone);
  if (!record) return res.status(400).json({ error: 'OTP not found. Request a new one.' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }
  if (record.otp !== code) return res.status(400).json({ error: 'Invalid OTP code.' });

  otpStore.delete(phone);

  try {
    // Get or create Firebase user for this phone number
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByPhoneNumber(phone);
    } catch {
      userRecord = await admin.auth().createUser({ phoneNumber: phone });
    }

    // Generate a custom token the client can use to sign in
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    res.json({ customToken, uid: userRecord.uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/register — create user doc after Firebase Auth signup
router.post('/register', verifyToken, async (req, res) => {
  const { fullName, phone } = req.body;
  const { uid, email } = req.user;
  try {
    const userRef = db.collection('users').doc(uid);
    const existing = await userRef.get();
    if (existing.exists) return res.status(200).json({ message: 'User already exists' });
    await userRef.set({
      uid, fullName, email, phone: phone || '',
      photoURL: '', memberTier: 'standard', rating: 0,
      walletBalance: 0, savedAddresses: [], paymentMethods: [],
      notificationsEnabled: true, createdAt: new Date().toISOString(),
    });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/send-email-verification — send Firebase email verification link
router.post('/send-email-verification', verifyToken, async (req, res) => {
  try {
    const link = await auth.generateEmailVerificationLink(req.user.email);
    // In production send via your email provider (SendGrid, etc.)
    // For now we return the link so you can test it
    res.json({ message: 'Verification link generated', link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/verify-phone — verify Firebase phone ID token and link to user
router.post('/verify-phone', verifyToken, async (req, res) => {
  try {
    // Phone is already verified by Firebase on the client side via signInWithPhoneNumber
    // This endpoint just updates the user doc with the verified phone
    const { phone } = req.body;
    await db.collection('users').doc(req.user.uid).update({ phone, phoneVerified: true });
    res.json({ message: 'Phone verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
