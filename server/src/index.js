import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import schedule from 'node-schedule'

// --- Routes
import authRoutes from './routes/auth.js'
import academyRoutes from './routes/academies.js'
import academyRequestsRoutes from './routes/academyRequests.js'
import matchRoutes from './routes/matches.js'
import playerRequestsRoutes from './routes/playerRequests.js'
import adminRoutes from './routes/admin.js'
import userRoutes from './routes/user.js'
import debugRoutes from './routes/debug.js'
import jobRoutes from './routes/jobs.js'
import jobApplicationRoutes from './routes/jobApplications.js'
import JobApplication from './models/JobApplication.js'
import { deleteCloudinaryFile, extractPublicIdFromUrl } from './utils/cloudinary.js'

// --- Models
import User from './models/User.js'
import Academy from './models/Academy.js'
import Match from './models/Match.js'
import Job from './models/Job.js'

const app = express()
// Ensure correct secure cookie behavior behind proxies (Railway)
app.set('trust proxy', 1)

// --- Middleware
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true, limit: "5mb" }))
app.use(cookieParser())
app.use(morgan('dev'))

// --- CORS setup
const allowedOrigins = [
  "https://dwarly.vercel.app",
  "https://dwarly-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true) // allow Postman/curl
      // Allow Vercel preview subdomains
      const isVercelPreview = /https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
      if (allowedOrigins.includes(origin) || isVercelPreview) {
        return callback(null, true)
      } else {
        console.warn("❌ Blocked CORS request from:", origin)
        return callback(new Error("Not allowed by CORS"), false)
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// Handle preflight requests
app.options("*", cors())

// --- Static file serving removed - all files now stored on Cloudinary

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

// --- Railway port
const PORT = process.env.PORT || 4000

async function start() {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      console.error('❌ Missing MONGODB_URI in .env')
      process.exit(1)
    }

    await mongoose.connect(uri, { autoIndex: true })
    console.log('✅ MongoDB connected')

    // --- Cleanup job
    schedule.scheduleJob('*/1 * * * *', async () => {
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
        const result = await Match.deleteMany({
          status: 'finished',
          updatedAt: { $lt: fifteenMinutesAgo }
        })
        if (result.deletedCount > 0) {
          console.log(`🗑️ Cleaned up ${result.deletedCount} finished matches older than 15 minutes`)
        }
      } catch (error) {
        console.error('❌ Error cleaning up finished matches:', error)
      }
    })
    console.log('✅ Scheduled cleanup job for finished matches')

    // --- Orphaned CV Cleanup job (handle records marked as deleted but still have CV data)
    schedule.scheduleJob('*/5 * * * *', async () => {
      try {
        const orphanedApplications = await JobApplication.find({
          cvDeleted: true,
          cvUrl: { $exists: true, $ne: null }
        })

        for (const application of orphanedApplications) {
          try {
            // Delete CV from Cloudinary
            const publicId = extractPublicIdFromUrl(application.cvUrl)
            if (publicId) {
              await deleteCloudinaryFile(publicId)
              console.log('Orphaned CV deleted from Cloudinary:', publicId)
            }
            
            // Remove CV fields from database
            await JobApplication.findByIdAndUpdate(
              application._id,
              { 
                $unset: { cvUrl: "", cvFileName: "" }
              }
            )
            
            console.log('Orphaned CV data cleaned for application:', application._id)
          } catch (error) {
            console.error('Error cleaning orphaned CV for application', application._id, ':', error)
          }
        }

        if (orphanedApplications.length > 0) {
          console.log(`🗑️ Cleaned up ${orphanedApplications.length} orphaned CV records`)
        }
      } catch (error) {
        console.error('❌ Error cleaning up orphaned CVs:', error)
      }
    })
    console.log('✅ Scheduled cleanup job for orphaned CVs')

    // --- Hidden Applications Cleanup job (delete applications hidden from academy after 5 days)
    schedule.scheduleJob('0 2 * * *', async () => { // Run daily at 2 AM
      try {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        const hiddenApplications = await JobApplication.find({
          hiddenFromAcademy: true,
          hiddenAt: { $lte: fiveDaysAgo }
        })

        for (const application of hiddenApplications) {
          try {
            // Delete CV from Cloudinary if it still exists
            if (application.cvUrl) {
              const publicId = extractPublicIdFromUrl(application.cvUrl)
              if (publicId) {
                await deleteCloudinaryFile(publicId)
                console.log('CV deleted from Cloudinary during final cleanup:', publicId)
              }
            }
            
            // Delete the entire application from database
            await JobApplication.findByIdAndDelete(application._id)
            console.log('Hidden application permanently deleted:', application._id)
          } catch (error) {
            console.error('Error deleting hidden application', application._id, ':', error)
          }
        }

        if (hiddenApplications.length > 0) {
          console.log(`🗑️ Permanently deleted ${hiddenApplications.length} hidden applications after 5 days`)
        }
      } catch (error) {
        console.error('❌ Error cleaning up hidden applications:', error)
      }
    })
    console.log('✅ Scheduled cleanup job for hidden applications (5 days)')

    // --- Seed admin
    const adminEmail = 'admin@dwarly.eg'
    const adminPass = 'DWARLY-Admin#2025'
    let admin = await User.findOne({ email: adminEmail })
    if (!admin) {
      admin = await User.create({
        name: 'DWARLY Admin',
        email: adminEmail,
        password: adminPass, // hashed by User.js pre("save")
        role: 'admin',
      })
      console.log('✅ Seeded admin:', adminEmail)
    }

    // --- Seed academies
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

    // --- Seed jobs
    const countJ = await Job.countDocuments()
    if (countJ === 0) {
      const academies = await Academy.find()
      if (academies.length > 0) {
        await Job.insertMany([
          {
            academy: academies[0]._id,
            title: 'Youth Coach - U12-U16',
            description: 'We are looking for an experienced youth coach...',
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
            description: 'Join our coaching staff as an assistant coach...',
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
            description: 'Specialized goalkeeper coach needed...',
            location: 'Nasr City, Cairo',
            type: 'contract',
            ageGroup: 'All ages',
            salary: 'Negotiable',
            requirements: ['Goalkeeper coaching certification', '5+ years experience'],
            status: 'active',
            createdBy: admin._id
          }
        ])
        console.log('✅ Seeded sample jobs')
      }
    }

    // --- Start server (✅ fixed to 0.0.0.0 for Railway)
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Startup error:', err)
    process.exit(1)
  }
}

start()
