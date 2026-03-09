import { useEffect, useState } from 'react'
import { coursesApi } from '../api/client'
import CourseCard from '../components/CourseCard'

export default function CourseList() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setError(null)
      try {
        const { data } = await coursesApi.list({ category: category || undefined, search: search || undefined })
        setCourses(Array.isArray(data) ? data : (data?.content != null ? data.content : []))
      } catch (err) {
        setCourses([])
        setError(err.response?.status === 401 ? null : (err.response?.data?.error || err.message || 'Unable to load courses. Is the backend running?'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [category, search])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Browse courses</h1>
        <p className="text-slate-600 mt-1">Find your next skill to learn.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All categories</option>
          <option value="Programming">Programming</option>
          <option value="Development">Development</option>
          <option value="Design">Design</option>
        </select>
      </div>
      {loading ? (
        <div className="text-slate-500 animate-pulse">Loading courses...</div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">{error}</p>
          <p className="text-sm text-amber-700 mt-2">Make sure the backend is running at the API URL (e.g. with proxy on port 8080).</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-600">
          No courses found.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(courses || []).map((course, idx) => (
            <CourseCard key={course?.id ?? `c-${idx}`} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
