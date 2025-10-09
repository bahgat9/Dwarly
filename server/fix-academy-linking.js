// Fix Academy Linking Script
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Academy from './src/models/Academy.js';

async function fixAcademyLinking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find users with role 'academy' but no academyId
    const academyUsers = await User.find({ 
      role: 'academy', 
      academyId: { $exists: false } 
    });
    
    console.log(`Found ${academyUsers.length} academy users without academyId`);

    for (const user of academyUsers) {
      console.log(`Processing user: ${user.name} (${user.email})`);
      
      // Try to find academy by name
      let academy = null;
      
      if (user.academyName) {
        academy = await Academy.findOne({
          $or: [
            { name: new RegExp(user.academyName, 'i') },
            { nameAr: new RegExp(user.academyName, 'i') }
          ]
        });
      }
      
      if (!academy && user.name) {
        // Try to find academy by user name
        academy = await Academy.findOne({
          $or: [
            { name: new RegExp(user.name, 'i') },
            { nameAr: new RegExp(user.name, 'i') }
          ]
        });
      }
      
      if (academy) {
        // Link user to academy
        user.academyId = academy._id;
        user.academyName = academy.name;
        await user.save();
        console.log(`✅ Linked user ${user.name} to academy ${academy.name}`);
      } else {
        console.log(`❌ Could not find academy for user ${user.name}`);
      }
    }

    // Also check for users with academyId but wrong academy
    const usersWithAcademy = await User.find({ 
      role: 'academy', 
      academyId: { $exists: true } 
    });
    
    console.log(`\nChecking ${usersWithAcademy.length} users with academyId...`);
    
    for (const user of usersWithAcademy) {
      const academy = await Academy.findById(user.academyId);
      if (!academy) {
        console.log(`❌ User ${user.name} has invalid academyId: ${user.academyId}`);
        // Try to find correct academy
        let correctAcademy = null;
        
        if (user.academyName) {
          correctAcademy = await Academy.findOne({
            $or: [
              { name: new RegExp(user.academyName, 'i') },
              { nameAr: new RegExp(user.academyName, 'i') }
            ]
          });
        }
        
        if (correctAcademy) {
          user.academyId = correctAcademy._id;
          user.academyName = correctAcademy.name;
          await user.save();
          console.log(`✅ Fixed user ${user.name} to academy ${correctAcademy.name}`);
        }
      } else {
        console.log(`✅ User ${user.name} correctly linked to academy ${academy.name}`);
      }
    }

    console.log('\n✅ Academy linking fix completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing academy linking:', error);
    process.exit(1);
  }
}

fixAcademyLinking();
