require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas!');
  console.log('Connection state:', mongoose.connection.readyState);
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Failed to connect to MongoDB Atlas');
  console.error('Error:', err.message);
  
  if (err.message.includes('authentication failed')) {
    console.error('\n💡 Solution: Check username/password in MongoDB Atlas');
  } else if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
    console.error('\n💡 Solution: Check Network Access whitelist in MongoDB Atlas');
  } else if (err.message.includes('bad auth')) {
    console.error('\n💡 Solution: Verify database user credentials');
  }
  
  process.exit(1);
});
