import { useEffect, useState } from 'react'

const PLACEHOLDER_THUMB = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#e2e8f0" width="320" height="180"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Course</text></svg>')
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { coursesApi, enrollmentsApi } from '../api/client'
export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')
  const [thumbError, setThumbError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await coursesApi.getDetail(id)
        setCourse(data)
        if (user) {
          try {
            const res = await coursesApi.isEnrolled(id)
            setEnrolled(res.data === true)
          } catch {
            setEnrolled(false)
          }
        }
      } catch {
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setEnrolling(true)
    setError('')
    try {
      const res = await enrollmentsApi.enroll(Number(id))
      if (res.data.enrolled) {
        setEnrolled(true)
        navigate(`/course/${id}/learn`)
      }
    } catch (err) {
      if (err.response?.status === 402 && err.response?.data?.checkoutUrl) {
        window.location.href = err.response.data.checkoutUrl
        return
      }
      setError(err.response?.data?.error || 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse text-slate-500">{loading ? 'Loading...' : 'Course not found.'}</div>
      </div>
    )
  }

  const priceText = course?.price == null || Number(course?.price) === 0 ? 'Free' : `$${Number(course?.price).toFixed(2)}`
  const curriculum = Array.isArray(course?.curriculum) ? course.curriculum : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-slate-900">{course?.title ?? 'Course'}</h1>
          <p className="text-slate-600 mt-2">{course?.description ?? ''}</p>
          {course?.whatYouLearn && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">What you'll learn</h2>
              <div className="mt-2 text-slate-600 whitespace-pre-line">{course.whatYouLearn}</div>
            </div>
          )}
          {curriculum.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Curriculum</h2>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {curriculum.map((sec, i) => (
                  <div key={sec?.id ?? i} className="px-4 py-3 flex justify-between items-center">
                    <span className="font-medium text-slate-800">{sec?.title ?? 'Section'}</span>
                    <span className="text-sm text-slate-500">
                      {sec?.lessonCount ?? 0} lesson{(sec?.lessonCount ?? 0) !== 1 ? 's' : ''}
                      {sec?.totalMinutes != null && sec.totalMinutes > 0 ? ` · ${sec.totalMinutes} min` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>{course?.totalLessons ?? 0} lessons</span>
            <span>{course?.totalDurationMinutes || 0} min total</span>
            <span>Instructor: {course?.instructorName ?? ''}</span>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="aspect-video bg-slate-200">
              <img
                src={course?.thumbnailUrl && !thumbError ? course.thumbnailUrl : PLACEHOLDER_THUMB}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setThumbError(true)}
              />
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-slate-900">{priceText}</p>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              {enrolled ? (
                <button
                  onClick={() => navigate(`/course/${id}/learn`)}
                  className="w-full mt-4 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
                >
                  Go to course
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full mt-4 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {enrolling ? 'Processing...' : 'Get Course'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
