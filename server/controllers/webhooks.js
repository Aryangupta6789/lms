import { Webhook } from 'svix'
import user from '../models/user.js'
import connectDB from '../configs/mongodb.js'
import Stripe from 'stripe'
import purchase from '../models/purchase.js'
import course from '../models/course.js'

export const clerkWebhooks = async (req, res) => {
  console.log('🔥 CLERK WEBHOOK HIT 🔥')

  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    const payload = req.body.toString('utf8')
    const event = whook.verify(payload, {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    })

    await connectDB()

    const { data, type } = event
    console.log('EVENT:', type)

    switch (type) {
      case 'user.created':
        await user.create({
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url
        })
        break

      case 'user.updated':
        await user.findByIdAndUpdate(data.id, {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url
        })
        break

      case 'user.deleted':
        await user.findByIdAndDelete(data.id)
        break
    }

    // ✅ ONE response only
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('CLERK WEBHOOK ERROR:', err)
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

const stripeInstace = new Stripe(process.env.STRIPE_SECRET_KEY )
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripeInstace.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).send(`webhook error ${err.message}`)
  }

  switch (event.type) {
  case 'payment_intent.succeeded':{
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id

    const session = await stripeInstace.checkout.sessions.list({
      payment_intent:paymentIntentId
    })
    const {purchaseId} = session.data[0].metadata

    const purchaseData = await purchase.findById(purchaseId)
    const userData = await user.findById(purchaseData.userId)
    const courseData = await course.findById(purchaseData.courseId.toString())

    courseData.enrolledStudents.push(userData)
    await courseData.save()

    userData.enrolledCourses.push(courseData._id)
    await userData.save()

    purchaseData.status = 'completed'
    await purchaseData.save()
    break;
  }

  case 'payment_intent.payment_failed':{
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id

    const session = await stripeInstace.checkout.sessions.list({
      payment_intent:paymentIntentId
    })
    const {purchaseId} = session.data[0].metadata
    const purchaseData = await purchase.findById(purchaseId)
    purchaseData.status = 'failed'
    await purchaseData.save()
    break;
  }

  // ... handle other event types

  default:
    console.log(`Unhandled event type ${event.type}`);
}

// Return a response to acknowledge receipt of the event
res.json({ received: true });

}
