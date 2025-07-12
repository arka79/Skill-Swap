import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

// Import User model
import User from './models/User.js';

const promoteToAdmin = async (email, secretKey) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Verify secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      console.error('❌ Invalid secret key!');
      console.log('Please use the correct ADMIN_SECRET_KEY from config.env');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User with email "${email}" not found!`);
      console.log('Please register the user first through the application.');
      process.exit(1);
    }

    // Check if already admin
    if (user.isAdmin) {
      console.log(`✅ User "${user.name}" is already an admin!`);
      process.exit(0);
    }

    // Promote to admin
    user.isAdmin = true;
    await user.save();

    console.log(`✅ Successfully promoted "${user.name}" (${email}) to admin!`);
    console.log('You can now log in and access the admin panel.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node promoteAdmin.js <email> <secretKey>');
  console.log('Example: node promoteAdmin.js user@example.com your_super_secure_admin_key_2024');
  process.exit(1);
}

const [email, secretKey] = args;
promoteToAdmin(email, secretKey); 