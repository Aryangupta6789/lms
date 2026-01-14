import express, { application } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './configs/mongodb.js'
import connectCloudinary from './configs/cloudinary.js'
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import courseRouter from './routes/courseRoute.js'
import userRouter from './routes/userRoute.js'

dotenv.config()

const app = express()

/* =======================
   DATABASE & CLOUDINARY
======================= */
await connectDB()
await connectCloudinary()

/* =======================
   CORS
======================= */
const allowedOrigins = ['http://localhost:5173'] // Add your deployed frontend URL here when you have one

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In development, allow localhost
      // In production, you might want to switch to specific domains
      // For now, we are allowing localhost and the user's specific deployments if added
      // Or just allow all for this stage if debugging is priority:
      callback(null, true) 
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
  })
)

// Stripe webhook FIRST (raw body)
app.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
)

// Clerk webhook
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

/* =======================
   NORMAL MIDDLEWARES
======================= */
app.use(express.json())
app.use(clerkMiddleware())

/* =======================
   ROUTES
======================= */
app.get('/', (req, res) => {
  res.send('API working 🚀')
})

app.use('/educator', educatorRouter)

app.use('/course', courseRouter)

app.use('/user', userRouter)


/* =======================
   EXPORT (NO LISTEN)
======================= */
const PORT = process.env.PORT || 5000

if (!process.env.VERCEL) {
    app.listen(PORT, ()=>{
      console.log(`Server is running on port ${PORT}`)
    })
}

export default app
