import { clerkClient, getAuth } from '@clerk/express'
import course from '../models/course.js'
import { v2 as cloudinary } from 'cloudinary'
import purchase from '../models/purchase.js'
import user from '../models/user.js'

export const updateRoleToEducator = async (req, res) => {
  const { userId } = getAuth(req)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    })
  }

  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'educator'
      }
    })

    res.json({
      success: true,
      message: 'You can publish a course now'
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

// ================= ADD COURSE =================
export const addCourse = async (req, res) => {
  try {
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // 🔥 SAFETY CHECKS
    if (!req.body.courseData) {
      return res.status(400).json({
        success: false,
        message: 'courseData missing'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail not attached'
      })
    }
    
    // Convert buffer to base64 for Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    // ✅ CLOUDINARY UPLOAD
    const imageUpload = await cloudinary.uploader.upload(
      dataURI,
      {
        folder: 'courses'
      }
    )

    // ✅ SAFE PARSE
    let parsedCourseData
    try {
      parsedCourseData = JSON.parse(req.body.courseData)
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid courseData JSON'
      })
    }

    parsedCourseData.educator = userId
    parsedCourseData.courseThumbnail = imageUpload.secure_url

    // ✅ DB SAVE
    const newCourse = await course.create(parsedCourseData)

    res.json({
      success: true,
      message: 'Course added successfully',
      course: newCourse
    })
  } catch (err) {
    console.error('ADD COURSE ERROR:', err)

    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    })
  }
}
export const getEducatorCourses = async (req, res) => {
  try {
    const { userId } = getAuth(req)
    const educator = userId
    const courses = await course.find({ educator })
    res.json({ success: true, courses })
  } catch (err) {
    res.json({ success: false, message: err.message })
  }
}

export const educatorDashboardData = async (req, res) => {
  try {
    const { userId } = getAuth(req)
    const educator = userId
    const courses = await course.find({ educator })
    const totalCourses = courses.length
    const courseIds = courses.map(course => course._id)

    const purchases = await purchase.find({
      courseId: { $in: courseIds },
      status: 'completed'
    })

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    )

    const enrolledStudentsData = []
    for (const course of courses) {
      const students = await user.find(
        {
          _id: { $in: course.enrolledStudents }
        },
        'name imageUrl'
      )

      students.forEach(student => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student
        })
      })
    }
    res.json({
      success: true,
      dashboardData: { totalEarnings, totalCourses, enrolledStudentsData }
    })
  } catch (err) {
    res.json({ success: false, message: err.message })
  }
}

export const getEnrolledStudentsData = async (req, res) => {
  try {
    const { userId } = getAuth(req)
    const educator = userId
    const courses = await course.find({ educator })
    const courseIds = courses.map(course => course._id)

    const purchases = await purchase
      .find({
        courseId: { $in: courseIds },
        status: 'completed'
      })
      .populate('userId', 'name imageUrl')
      .populate('courseId', 'courseTitle')

    const enrolledStudents = purchases.map(purchase => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseData: purchase.createdAt
    }))
    res.json({ success: true, enrolledStudents })
  } catch (error) {
    res.json({ success: false, message: err.message })
  }
}
