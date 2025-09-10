import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import schedule from 'node-schedule'

// --- Routes
import authRoutes from './routes/auth.js';
import academyRoutes from './routes/academies.js';
import academyRequestsRoutes from './routes/academyRequests.js';
import matchRoutes from './routes/matches.js';
import playerRequestsRoutes from './routes/playerRequests.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import debugRoutes from './routes/debug.js';
import jobRoutes from './routes/jobs.js';
import jobApplicationRoutes from './routes/jobApplications.js';

// --- Models
import User from './models/User.js'
import Academy from './models/Academy.js'
import Match from './models/Match.js'
import Job from './models/Job.js'

const app = express()

// --- Middleware
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true, limit: "5mb" }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  })
)

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// --- API routes
app.use('/api/auth', authRoutes)
app.use('/api/academies', academyRoutes)
app.use('/api/academy-requests', academyRequestsRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/playerRequests', playerRequestsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/job-applications', jobApplicationRoutes)

// --- Health check
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, uptime: process.uptime() })
)

// --- 404 + error handlers
app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, _next) => {
  console.error('🔥 Server Error:', err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

const PORT = 4000

async function start() {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      console.error('❌ Missing MONGODB_URI in .env')
      process.exit(1)
    }

    await mongoose.connect(uri, { autoIndex: true })
    console.log('✅ MongoDB connected')

    // --- Schedule cleanup of finished matches older than 15 minutes
    schedule.scheduleJob('*/1 * * * *', async () => {
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const result = await Match.deleteMany({
          status: 'finished',
          updatedAt: { $lt: fifteenMinutesAgo }
        });
        if (result.deletedCount > 0) {
          console.log(`🗑️ Cleaned up ${result.deletedCount} finished matches older than 15 minutes`);
        }
      } catch (error) {
        console.error('❌ Error cleaning up finished matches:', error);
      }
    });
    console.log('✅ Scheduled cleanup job for finished matches');

    // --- Seed admin if none
    const adminEmail = 'admin@dwarly.eg'
    const adminPass = 'DWARLY-Admin#2025'
    let admin = await User.findOne({ email: adminEmail })
    if (!admin) {
      // ⚡ Pass raw password → will be hashed by User.js pre("save")
      admin = await User.create({
        name: 'DWARLY Admin',
        email: adminEmail,
        password: adminPass,
        role: 'admin',
      })
      console.log('✅ Seeded admin:', adminEmail)
    }

    // --- Seed sample academies if none
    const countA = await Academy.countDocuments()
    if (countA === 0) {
      await Academy.insertMany([
        {
          name: 'TUT Academy',
          nameAr: 'أكاديمية توت',
          location: 'Nasr City, Cairo',
          phone: '+20 100 000 1111',
          rating: 4.2,
          verified: true,
        },
        {
          name: 'Volition Academy',
          nameAr: 'فوليشن',
          location: 'Heliopolis, Cairo',
          phone: '+20 120 222 3333',
          rating: 4.7,
          verified: true,
        },
      ])
      console.log('✅ Seeded sample academies')
    }

    // --- Seed sample jobs if none
    const countJ = await Job.countDocuments()
    if (countJ === 0) {
      const academies = await Academy.find()
      if (academies.length > 0) {
        await Job.insertMany([
          {
            academy: academies[0]._id,
            title: 'Youth Coach - U12-U16',
            description: 'We are looking for an experienced youth coach to lead our U12-U16 teams. The ideal candidate should have coaching experience with young players and a passion for developing talent.',
            location: 'Nasr City, Cairo',
            type: 'full-time',
            ageGroup: 'U12-U16',
            salary: '6000-8000 EGP',
            requirements: ['Coaching License', '2+ years experience', 'English speaking'],
            status: 'active',
            createdBy: admin._id
          },
          {
            academy: academies[1]._id,
            title: 'Assistant Coach',
            description: 'Join our coaching staff as an assistant coach. You will work closely with the head coach to develop training programs and support player development.',
            location: 'Heliopolis, Cairo',
            type: 'part-time',
            ageGroup: 'U10-U14',
            salary: '3000-4000 EGP',
            requirements: ['Basic coaching knowledge', 'Team player', 'Flexible schedule'],
            status: 'active',
            createdBy: admin._id
          },
          {
            academy: academies[0]._id,
            title: 'Goalkeeper Coach',
            description: 'Specialized goalkeeper coach needed to train our goalkeepers across all age groups. Experience with modern goalkeeping techniques required.',
            location: 'Nasr City, Cairo',
            type: 'contract',
            ageGroup: 'All ages',
            salary: 'Negotiable',
            requirements: ['Goalkeeper coaching certification', '5+ years experience', 'Professional background'],
            status: 'active',
            createdBy: admin._id
          }
        ])
        console.log('✅ Seeded sample jobs')
      }
    }

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    )
  } catch (err) {
    console.error('❌ Startup error:', err)
    process.exit(1)
  }
}

start()
