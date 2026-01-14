import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'course',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default:'pending'
  }
},{timestamps:true}
)

const purchase = mongoose.models.purchase || mongoose.model('purchase', purchaseSchema)
export default purchase
