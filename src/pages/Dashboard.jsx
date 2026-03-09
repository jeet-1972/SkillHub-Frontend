import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { enrollmentsApi, progressApi } from '../api/client'

export default function Dashboard() {
  const [enrollments, setEnrollments] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [enrRes, progRes] = await Promise.all([
          enrollmentsApi.myEnrollments(),
          progressApi.getAll(),
        ])
        setEnrollments(Array.isArray(enrRes.data) ? enrRes.data : [])
        setProgress(Array.isArray(progRes.data) ? progRes.data : [])
      } catch {
        setEnrollments([])
        setProgress([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getProgressForCourse = (courseId) => (Array.isArray(progress) ? progress : []).find((p) => p?.courseId === courseId)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse text-slate-500">Loading your courses...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Learning</h1>
      {(Array.isArray(enrollments) ? enrollments : []).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-600 mb-4">You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(enrollments) ? enrollments : []).map((e) => {
            const prog = getProgressForCourse(e?.courseId)
            const resumeUrl = prog?.lastWatchedLessonId
              ? `/course/${e?.courseId}/learn?lesson=${prog.lastWatchedLessonId}`
              : `/course/${e?.courseId}/learn`
            return (
              <DashboardCourseCard key={e?.id ?? e?.courseId} enrollment={e} prog={prog} resumeUrl={resumeUrl} />
            )
          })}
        </div>
      )}
    </div>
  )
}

const PLACEHOLDER_THUMB = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#e2e8f0" width="320" height="180"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Course</text></svg>'
)

function DashboardCourseCard({ enrollment: e, prog, resumeUrl }) {
  const [thumbError, setThumbError] = useState(false)
  const thumbSrc = (e?.thumbnailUrl && !thumbError) ? e.thumbnailUrl : PLACEHOLDER_THUMB
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/courses/${e?.courseId}`} className="block">
        <div className="aspect-video bg-slate-200">
          <img
            src={thumbSrc}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
        </div>
        <div className="p-4">
          <h2 className="font-semibold text-slate-900 line-clamp-2">{e?.courseTitle ?? 'Course'}</h2>
          <p className="text-sm text-slate-500 mt-1">{e?.instructorName ?? ''}</p>
          {prog != null && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${Number(prog.percentage) ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{Number(prog.percentage) ?? 0}% complete</p>
            </div>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link
          to={resumeUrl}
          className="block w-full py-2 text-center text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg"
        >
          {prog?.lastWatchedLessonId ? 'Resume' : 'Go to course'}
        </Link>
      </div>
    </div>
  )
}
