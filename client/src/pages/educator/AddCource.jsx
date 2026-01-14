import React, { useRef, useState, useEffect } from 'react'
import uniqid from 'uniqid'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { assets } from '../../assets/assets'
import { useAuth } from '@clerk/clerk-react'

function AddCource () {
  const quillRef = useRef(null)
  const editorRef = useRef(null)
  const { getToken } = useAuth()

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)

  const [chapters, setChapters] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [currentChapterId, setCurrentChapterId] = useState(null)

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false
  })

  /* ================= Quill Init ================= */
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow'
      })
    }
  }, [])

  /* ================= Chapter ================= */
  const handleChapter = () => {
    setChapters(prev => [
      ...prev,
      {
        id: uniqid(),
        chapterTitle: `Chapter ${prev.length + 1}`,
        chapterContent: [],
        collapsed: false
      }
    ])
  }

  const removeChapter = id => {
    setChapters(prev => prev.filter(ch => ch.id !== id))
  }

  /* ================= Lecture ================= */
  const addLecture = () => {
    setChapters(prev =>
      prev.map(ch =>
        ch.id === currentChapterId
          ? {
              ...ch,
              chapterContent: [
                ...ch.chapterContent,
                { ...lectureDetails, id: uniqid() }
              ]
            }
          : ch
      )
    )

    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false
    })

    setShowPopup(false)
  }

  /* ================= Submit ================= */
  const handleSubmit = async e => {
    e.preventDefault()

    if (!image) {
      alert('Please upload a course thumbnail')
      return
    }

    // ✅ SYNTAX FIXED
    const formattedChapters = chapters.map((ch, chIndex) => ({
      chapterId: ch.id,
      chapterOrder: chIndex + 1,
      chapterTitle: ch.chapterTitle,
      chapterContent: ch.chapterContent.map((lec, lecIndex) => ({
        lectureId: lec.id,
        lectureTitle: lec.lectureTitle,
        lectureDuration: Number(lec.lectureDuration),
        lectureUrl: lec.lectureUrl,
        isPreviewFree: lec.isPreviewFree,
        lectureOrder: lecIndex + 1
      }))
    }))

    const formData = new FormData()

    formData.append(
      'courseData',
      JSON.stringify({
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice,
        discount,
        courseContent: formattedChapters
      })
    )

    formData.append('image', image)

    try {
      const token = await getToken()

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/educator/add-course`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add course')
      }

      alert('Course added successfully 🎉')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg space-y-4"
      >
        <h2 className="text-xl font-semibold">Add New Course</h2>

        {/* Title */}
        <div>
          <label className="font-medium">Course Title</label>
          <input
            value={courseTitle}
            onChange={e => setCourseTitle(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-medium">Course Description</label>
          <div
            ref={editorRef}
            className="border rounded h-32 overflow-y-auto"
          />
        </div>

        {/* Price + Discount */}
        <div className="flex gap-6">
          <div>
            <label className="font-medium">Price (₹)</label>
            <input
              type="number"
              value={coursePrice}
              onChange={e => setCoursePrice(Number(e.target.value))}
              className="border p-2 rounded w-40"
            />
          </div>

          <div>
            <label className="font-medium">Discount (%)</label>
            <input
              type="number"
              value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="border p-2 rounded w-32"
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="font-medium">Course Thumbnail</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files[0])}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Add Chapter */}
        <div
          onClick={handleChapter}
          className="bg-blue-50 hover:bg-blue-100 transition p-2 rounded cursor-pointer text-center font-medium"
        >
          + Add Chapter
        </div>

        {/* Chapters */}
        <div className="max-h-[320px] overflow-y-auto space-y-3 pr-2">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="border rounded">
              <div className="flex justify-between items-center p-3">
                <span
                  className="font-semibold cursor-pointer"
                  onClick={() =>
                    setChapters(prev =>
                      prev.map(ch =>
                        ch.id === chapter.id
                          ? { ...ch, collapsed: !ch.collapsed }
                          : ch
                      )
                    )
                  }
                >
                  Chapter {index + 1}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <img
                    src={assets.cross_icon}
                    alt=""
                    className="w-4 cursor-pointer"
                    onClick={() => removeChapter(chapter.id)}
                  />
                </div>
              </div>

              {!chapter.collapsed && (
                <div className="p-3 space-y-1">
                  {chapter.chapterContent.map((lec, i) => (
                    <div key={lec.id} className="text-sm">
                      {i + 1}. {lec.lectureTitle} ({lec.lectureDuration} mins)
                    </div>
                  ))}

                  <div
                    onClick={() => {
                      setCurrentChapterId(chapter.id)
                      setShowPopup(true)
                    }}
                    className="inline-block bg-gray-100 p-2 rounded cursor-pointer mt-2"
                  >
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="bg-black text-white py-2.5 rounded w-full">
          Add Course
        </button>

        {/* Lecture Popup */}
        {showPopup && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-xl w-80 shadow-2xl relative">
              <h3 className="font-semibold mb-3">Add Lecture</h3>

              <input
                placeholder="Lecture Title"
                value={lectureDetails.lectureTitle}
                onChange={e =>
                  setLectureDetails({
                    ...lectureDetails,
                    lectureTitle: e.target.value
                  })
                }
                className="border p-2 w-full mb-2"
              />

              <input
                type="number"
                placeholder="Duration (min)"
                value={lectureDetails.lectureDuration}
                onChange={e =>
                  setLectureDetails({
                    ...lectureDetails,
                    lectureDuration: e.target.value
                  })
                }
                className="border p-2 w-full mb-2"
              />

              <input
                placeholder="Video URL"
                value={lectureDetails.lectureUrl}
                onChange={e =>
                  setLectureDetails({
                    ...lectureDetails,
                    lectureUrl: e.target.value
                  })
                }
                className="border p-2 w-full mb-2"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lectureDetails.isPreviewFree}
                  onChange={e =>
                    setLectureDetails({
                      ...lectureDetails,
                      isPreviewFree: e.target.checked
                    })
                  }
                />
                Free Preview
              </label>

              <button
                onClick={addLecture}
                className="bg-blue-500 text-white w-full p-2 rounded mt-3"
              >
                Add Lecture
              </button>

              <img
                src={assets.cross_icon}
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 w-4 cursor-pointer"
                alt=""
              />
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default AddCource
