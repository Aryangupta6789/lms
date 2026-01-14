import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AddContext'
import Loading from '../../components/student/Loading'

const MyCourses = () => {
  const { currency, educatorCourses } = useContext(AppContext)
  const [courses, setCourses] = useState(null)

  useEffect(() => {
    if (educatorCourses) {
      setCourses(educatorCourses)
    }
  }, [educatorCourses])

  return courses ? (
    <div className="h-screen flex flex-col md:p-8 p-4 pt-8">
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium">My Courses</h2>

        <div className="w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="table-auto w-full">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">All Courses</th>
                <th className="px-4 py-3 font-semibold">Earnings</th>
                <th className="px-4 py-3 font-semibold">Students</th>
                <th className="px-4 py-3 font-semibold">Published On</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-500">
              {courses.map(course => (
                <tr
                  key={course._id}
                  className="border-b border-gray-500/20"
                >
                  {/* Course */}
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img
                      src={course.courseThumbnail}
                      alt={course.courseTitle}
                      className="w-16 rounded"
                    />
                    <span className="hidden md:block truncate">
                      {course.courseTitle}
                    </span>
                  </td>

                  {/* Earnings */}
                  <td className="px-4 py-3">
                    {currency}{' '}
                    {Math.floor(
                      course.enrolledStudents.length *
                        (course.coursePrice -
                          (course.coursePrice * course.discount) / 100)
                    )}
                  </td>

                  {/* Students */}
                  <td className="px-4 py-3">
                    {course.enrolledStudents.length}
                  </td>

                  {/* Published Date */}
                  <td className="px-4 py-3">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  )
}

export default MyCourses
