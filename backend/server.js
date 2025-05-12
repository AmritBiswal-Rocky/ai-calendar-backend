const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();

// 🔐 Load service account key
const serviceAccount = require('./firebase-service-account.json');

// 🔧 Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// 🧪 Health check route
app.get('/', (req, res) => {
  res.send('✅ Backend server is running');
});

// ✅ Verify Firebase ID token
app.post('/verifyIdToken', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Token verified:', decodedToken.uid);
    res.status(200).json({ uid: decodedToken.uid, email: decodedToken.email });
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
