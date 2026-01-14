import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AddContext'
import Loading from '../../components/student/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import YouTube from 'react-youtube'
import { useAuth } from '@clerk/clerk-react'


const CourseDetails = () => {
  const { getToken } = useAuth()

  const { id } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [playerData, setPlayerData] = useState(null)
  const [openSections, setOpenSections] = useState({})

  const { allCourses, calculateRating, calculateChapterTime } =
    useContext(AppContext)

  const toggleSection = index => {
    setOpenSections(prev => ({ ...prev, [index]: !prev[index] }))
  }

  useEffect(() => {
    if (!id || !allCourses) return
    const findCourse = allCourses.find(course => course._id === id)
    setCourseData(findCourse || null)
  }, [id, allCourses])

  if (!courseData) return <Loading />

  const rating = calculateRating(courseData)
  const rounded = Math.floor(rating)
  const originalPrice = courseData.coursePrice
  const discountPercent = courseData.discount || 0

  const discountedPrice = (
    originalPrice -
    (originalPrice * discountPercent) / 100
  ).toFixed(2)

  const rawHtml = courseData.courseDescription || ''
  const excerpt =
    rawHtml.length > 200 ? rawHtml.slice(0, 200).trim() + '...' : rawHtml

    const handleEnroll = async () => {
  try {
    const token = await getToken()

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/user/purchase`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: courseData._id
        })
      }
    )

    const data = await res.json()

    if (data.success) {
      window.location.href = data.session_url
    } else {
      alert(data.message || 'Payment failed')
    }
  } catch (err) {
    console.error(err)
    alert('Something went wrong')
  }
}

  return (
    <>
    <div className='relative flex md:flex-row flex-col-reverse gap-10 items-start justify-between md:px-36 px-6 md:pt-28 pt-20 text-left'>
      {/* gradient overlay */}
      <div className='absolute top-0 left-0 w-full h-[500px] z-[1] bg-gradient-to-b from-cyan-100/70' />

      {/* LEFT */}
      <div className='max-w-xl z-[2] relative text-gray-600 w-full'>
        <h1 className='md:text-3xl text-xl font-semibold text-gray-800'>
          {courseData.courseTitle}
        </h1>

        <p
          className='pt-4 md:text-base text-sm text-gray-700'
          dangerouslySetInnerHTML={{ __html: excerpt }}
        />

        {/* rating */}
        <div className='flex flex-wrap items-center gap-2 pt-3 pb-1 text-sm'>
          <p className='font-medium text-gray-800'>{rating.toFixed(1)}</p>

          <div className='flex'>
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < rounded ? assets.star : assets.star_blank}
                className='w-3.5 h-3.5'
                alt='star'
              />
            ))}
          </div>

          <p className='text-blue-600'>
            ({courseData.courseRatings.length}{' '}
            {courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})
          </p>

          <p className='text-gray-500'>
            {courseData.enrolledStudents.length}{' '}
            {courseData.enrolledStudents.length > 1 ? 'students' : 'student'}
          </p>
        </div>

        <p className='text-sm'>
          Course by <span className='text-blue-600 underline'>GreatStack</span>
        </p>

        {/* COURSE STRUCTURE */}
        <div className='pt-8 text-gray-800'>
          <h2 className='text-xl font-semibold'>Course Structure</h2>

          <div className='pt-5'>
            {courseData.courseContent.map((chapter, index) => (
              <div
                key={index}
                className='mb-3 rounded border border-gray-300 bg-white overflow-hidden'
              >
                {/* chapter header */}
                <div
                  className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'
                  onClick={() => toggleSection(index)}
                >
                  <div className='flex items-center gap-2'>
                    <img
                      src={assets.down_arrow_icon}
                      alt='arrow'
                      className={`w-4 h-4 transform transition-transform ${
                        openSections[index] ? 'rotate-180' : ''
                      }`}
                    />
                    <p className='font-medium md:text-base text-sm'>
                      {chapter.chapterTitle}
                    </p>
                  </div>

                  <p className='text-xs md:text-sm text-gray-600'>
                    {chapter.chapterContent.length} lectures •{' '}
                    {calculateChapterTime(chapter)}
                  </p>
                </div>

                {/* lectures */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openSections[index] ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <ul className='list-none pl-4 md:pl-10 pr-4 py-2 text-gray-600'>
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className='py-1'>
                        <div className='flex items-start gap-2'>
                          <img
                            src={assets.play_icon}
                            alt='play'
                            className='w-4 h-4 mt-1'
                          />

                          <div className='flex justify-between w-full gap-4 text-xs md:text-sm text-gray-800'>
                            <p>{lecture.lectureTitle}</p>

                            <div className='flex gap-3 shrink-0'>
                              {lecture.isPreviewFree && (
                                <p className='text-green-600 font-medium cursor-pointer'
                                onClick={()=>{
                                  setPlayerData({
                                    videoId: lecture.lectureUrl.split('/').pop()
                                  })
                                }}>
                                  Preview
                                </p>
                              )}
                              <p className='text-blue-500'>
                                {humanizeDuration(
                                  lecture.lectureDuration * 60 * 1000,
                                  { units: ['h', 'm'] }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className='py-20'>
          <h3 className='text-xl font-semibold text-gray-800 mb-4'>
            Course Description
          </h3>

          <div
            className='
      text-gray-700 
      text-sm md:text-base 
      leading-7 
      space-y-4

      [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-gray-900
      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900
      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-800

      [&_p]:mb-4

      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
      [&_li]:mb-2

      [&_strong]:font-semibold [&_strong]:text-gray-900
      [&_a]:text-blue-600 [&_a]:underline
    '
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription
            }}
          />
        </div>
      </div>

      {/* RIGHT SIDE COURSE CARD */}
      <div className='z-[2] relative w-full md:w-[420px]'>
        <div className='bg-white shadow-lg rounded-lg overflow-hidden sticky top-28'>
          {/* Thumbnail */}
          {
            playerData?
            <YouTube videoId={playerData.videoId} opts={{playerVars:{
              autoplay:1
            }}} iframeClassName='w-full aspect-video'/>

            :
            <img
              src={courseData.courseThumbnail}
              alt='course thumbnail'
              className='w-full h-48 object-cover'
            />

          }

          <div className='p-5 space-y-4'>
            {/* limited offer */}
            {courseData.discount > 0 && (
              <div className='flex items-center gap-2'>
                <img
                  className='w-4'
                  src={assets.time_left_clock_icon}
                  alt='time left'
                />
                <p className='text-red-500 text-sm'>
                  <span className='font-medium'>Limited time</span> offer!
                </p>
              </div>
            )}

            {/* price */}
            <div className='flex items-end gap-2'>
              <p className='text-3xl font-semibold text-gray-800'>
                ${discountedPrice}
              </p>

              {courseData.discount > 0 && (
                <>
                  <p className='line-through text-gray-400'>
                    ${courseData.coursePrice}
                  </p>
                  <p className='text-green-600 font-medium text-sm'>
                    {courseData.discount}% off
                  </p>
                </>
              )}
            </div>

            {/* buttons */}
            <div className='flex flex-col gap-3'>
              <button className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition'
              onClick={handleEnroll}>
                Enroll Now
              </button>

              <button className='w-full border border-gray-300 py-2 rounded hover:bg-gray-100 transition'>
                Add to Wishlist
              </button>
            </div>

            {/* course info */}
            <div className='border-t pt-4 space-y-2 text-sm text-gray-600'>
              <p>✔ {courseData.enrolledStudents.length} students enrolled</p>
              <p>✔ Full lifetime access</p>
              <p>✔ Access on mobile & desktop</p>
              <p>✔ Certificate of completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
      <Footer />
      </>
  )
}

export default CourseDetails
