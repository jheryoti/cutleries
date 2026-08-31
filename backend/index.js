require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes    = require('./routes/auth');
const vendorRoutes  = require('./routes/vendors');
const orderRoutes   = require('./routes/orders');
const walletRoutes  = require('./routes/wallet');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth',    authRoutes);
app.use('/vendors', vendorRoutes);
app.use('/orders',  orderRoutes);
app.use('/wallet',  walletRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend listening on port ${PORT} (available on your local network).`));
