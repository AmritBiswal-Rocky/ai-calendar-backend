const admin = require('firebase-admin');

// Load your service account key JSON
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'your-user-id-here';

admin.auth().createCustomToken(uid)
  .then((customToken) => {
    console.log("✅ Custom Firebase Token:", customToken);
  })
  .catch((error) => {
    console.error('❌ Error creating custom token:', error);
  });
