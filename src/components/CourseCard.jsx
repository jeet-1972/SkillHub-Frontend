import { useState } from 'react'
import { Link } from 'react-router-dom'

const PLACEHOLDER_THUMB = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#e2e8f0" width="320" height="180"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Course</text></svg>'
)

export default function CourseCard({ course }) {
  const [thumbError, setThumbError] = useState(false)
  const priceText = course?.price == null || Number(course?.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`
  const thumbSrc = (course?.thumbnailUrl && !thumbError) ? course.thumbnailUrl : PLACEHOLDER_THUMB

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <Link to={`/courses/${course?.id}`} className="block flex-1">
        <div className="aspect-video bg-slate-200">
          <img
            src={thumbSrc}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">{course?.category || 'Course'}</span>
          <h2 className="font-semibold text-slate-900 mt-1 line-clamp-2">{course?.title ?? 'Course'}</h2>
          <p className="text-sm text-slate-500 mt-1">{course?.instructorName ?? ''}</p>
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{course?.shortDescription ?? ''}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{priceText}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link
          to={`/courses/${course?.id}`}
          className="block w-full py-2 text-center text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
        >
          View course
        </Link>
      </div>
    </div>
  )
}
