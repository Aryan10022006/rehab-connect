require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

async function createAdminUser() {
  try {
    const adminEmail = 'admin@rehabconnect.com';
    const adminPassword = 'RehabAdmin2025!';
    const adminUsername = 'admin';

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'System Administrator',
      emailVerified: true,
    });

    console.log('✅ Firebase Auth user created:', userRecord.uid);

    // Set custom claims for admin
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'super_admin',
      permissions: ['all']
    });

    console.log('✅ Admin custom claims set');

    // Create admin document in Firestore
    const adminDoc = {
      id: userRecord.uid,
      username: adminUsername,
      email: adminEmail,
      name: 'System Administrator',
      role: 'super_admin',
      permissions: {
        users: { read: true, write: true, delete: true },
        clinics: { read: true, write: true, delete: true },
        reviews: { read: true, write: true, delete: true },
        analytics: { read: true, write: true },
        system: { read: true, write: true, admin: true }
      },
      isActive: true,
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('admins').doc(userRecord.uid).set(adminDoc);
    console.log('✅ Admin document created in Firestore');

    console.log('\n🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Username:', adminUsername);
    console.log('Role: Super Admin');
    console.log('==========================================');
    console.log('\n🔐 ADMIN PANEL ACCESS:');
    console.log('URL: http://localhost:3000/admin');
    console.log('Login with the credentials above');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
