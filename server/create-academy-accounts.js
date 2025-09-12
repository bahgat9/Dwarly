#!/usr/bin/env node

/**
 * Utility script to create academy accounts for existing academies
 * Run this script to create User accounts with role 'academy' for all existing Academy entities
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import Academy from './src/models/Academy.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAcademyAccounts() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ Missing MONGODB_URI in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Get all academies
    const academies = await Academy.find();
    console.log(`📋 Found ${academies.length} academies`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const academy of academies) {
      // Check if academy account already exists
      const existingAccount = await User.findOne({ 
        role: 'academy', 
        academyId: academy._id 
      });

      if (existingAccount) {
        console.log(`⏭️  Skipping ${academy.name} - account already exists`);
        skippedCount++;
        continue;
      }

      // Create academy account
      const email = `${academy.name.toLowerCase().replace(/\s+/g, '')}@dwarly.eg`;
      const password = 'DWARLY-Academy#2025'; // Default password

      try {
        const academyUser = await User.create({
          name: academy.name,
          email: email,
          password: password,
          phone: academy.phone || '',
          role: 'academy',
          academyId: academy._id,
          academyName: academy.name
        });

        console.log(`✅ Created account for ${academy.name}:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Academy ID: ${academy._id}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create account for ${academy.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${createdCount} accounts`);
    console.log(`   Skipped: ${skippedCount} accounts (already exist)`);
    console.log(`   Total academies: ${academies.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
createAcademyAccounts();
