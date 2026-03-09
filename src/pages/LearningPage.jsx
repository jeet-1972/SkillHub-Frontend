import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { coursesApi, videosApi, progressApi } from '../api/client'
import VideoPlayer from '../components/VideoPlayer'
import LessonList from '../components/LessonList'

/** Extract YouTube video ID from watch URL, youtu.be, or embed URL. Returns null if invalid. */
function getVideoIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v') || null
      const embedMatch = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embedMatch) return embedMatch[1]
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0].split('?')[0]
      return id && id.length === 11 ? id : null
    }
    const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (vMatch) return vMatch[1]
    return null
  } catch {
    return null
  }
}

export default function LearningPage() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const lessonParam = searchParams.get('lesson')

  const [sections, setSections] = useState([])
  const [progress, setProgress] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [videoDetail, setVideoDetail] = useState(null)
  const [videoProgress, setVideoProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  const flatLessons = useMemo(() => {
    const list = []
    ;(Array.isArray(sections) ? sections : []).forEach((sec) => {
      const lessons = Array.isArray(sec?.lessons) ? sec.lessons : []
      lessons.forEach((les) => list.push({ ...(les && typeof les === 'object' ? les : {}), sectionTitle: sec?.title }))
    })
    return list
  }, [sections])

  const currentIndex = useMemo(
    () => flatLessons.findIndex((l) => l.id === currentLesson?.id),
    [flatLessons, currentLesson?.id]
  )
  const prevLesson = useMemo(() => {
    if (videoDetail?.previousVideoId && flatLessons.length) {
      const found = flatLessons.find((l) => l.id === videoDetail.previousVideoId)
      if (found) return found
    }
    return currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  }, [flatLessons, currentIndex, videoDetail?.previousVideoId])
  const nextLesson = useMemo(() => {
    if (videoDetail?.nextVideoId && flatLessons.length) {
      const found = flatLessons.find((l) => l.id === videoDetail.nextVideoId)
      if (found) return found
    }
    return currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null
  }, [flatLessons, currentIndex, videoDetail?.nextVideoId])
  const hasPrev = !!prevLesson
  const hasNext = !!nextLesson

  useEffect(() => {
    const load = async () => {
      try {
        const [secRes, progRes] = await Promise.all([
          coursesApi.getSections(courseId),
          progressApi.getCourseProgress(courseId),
        ])
        setSections(Array.isArray(secRes.data) ? secRes.data : [])
        setProgress(progRes.data ?? null)
        const allLessons = (Array.isArray(secRes.data) ? secRes.data : []).flatMap((s) => (Array.isArray(s?.lessons) ? s.lessons : []))
        let initial = allLessons[0]
        if (lessonParam) {
          const found = allLessons.find((l) => String(l.id) === lessonParam)
          if (found) initial = found
        } else if (progRes.data?.lastWatchedLessonId != null) {
          const found = allLessons.find((l) => l?.id === progRes.data.lastWatchedLessonId)
          if (found) initial = found
        }
        if (initial) {
          setCurrentLesson(initial)
          const videoId = initial?.id ?? initial?.videoId
          if (videoId != null) progressApi.watching({ lessonId: videoId }).catch(() => {})
        }
      } catch {
        setSections([])
        setProgress(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, lessonParam])

  useEffect(() => {
    if (!currentLesson?.id) {
      setVideoDetail(null)
      setVideoProgress(null)
      return
    }
    const loadVideoDetail = async () => {
      try {
        const [detailRes, progRes] = await Promise.all([
          videosApi.get(currentLesson.id),
          progressApi.getVideoProgress(currentLesson.id),
        ])
        setVideoDetail(detailRes.data)
        setVideoProgress(progRes.data)
      } catch {
        setVideoDetail(null)
        setVideoProgress(null)
      }
    }
    loadVideoDetail()
  }, [currentLesson?.id])

  const selectLesson = async (lesson) => {
    if (!lesson) return
    setCurrentLesson(lesson)
    try {
      const id = lesson?.id ?? lesson?.videoId
      if (id != null) await progressApi.watching({ lessonId: id })
    } catch {}
  }

  const markComplete = async (lesson) => {
    const target = lesson ?? currentLesson
    if (!target?.id && !target?.videoId) return
    try {
      const id = target?.id ?? target?.videoId
      const { data } = await progressApi.complete(id)
      setProgress(data)
      setVideoProgress((prev) => (prev ? { ...prev, isCompleted: true } : { lastPositionSeconds: 0, isCompleted: true }))
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading course...</div>
      </div>
    )
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-600">No content in this course yet.</p>
      </div>
    )
  }

  const effectiveLesson = currentLesson && flatLessons.some((l) => (l?.id ?? l?.videoId) === (currentLesson?.id ?? currentLesson?.videoId))
    ? currentLesson
    : flatLessons[0] ?? null
  const displayLesson = effectiveLesson ?? currentLesson

  const videoId = getVideoIdFromUrl(displayLesson?.youtubeUrl ?? videoDetail?.youtubeUrl)
  const isLocked = videoDetail?.locked === true
  const startPositionSeconds = videoProgress?.lastPositionSeconds ?? 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {isLocked ? (
            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
              <p className="text-slate-600 font-medium">
                {videoDetail?.unlockReason ?? 'Complete previous video'}
              </p>
            </div>
          ) : (
            <VideoPlayer
              videoId={videoId}
              title={displayLesson?.title ?? 'Video'}
              startPositionSeconds={startPositionSeconds}
            />
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{displayLesson?.title ?? 'Lesson'}</h2>
            <button
              onClick={() => displayLesson && markComplete(displayLesson)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              Mark as complete
            </button>
          </div>
          <div className="flex gap-2">
            <button
              disabled={!hasPrev}
              onClick={() => prevLesson && selectLesson(prevLesson)}
              className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={!hasNext}
              onClick={() => nextLesson && selectLesson(nextLesson)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-24">
            {progress != null && (
              <div className="p-4 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-700">Your progress</p>
                <div className="h-2 mt-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Number(progress?.percentage) || 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{Number(progress?.percentage) ?? 0}% complete</p>
              </div>
            )}
            <LessonList
              sections={sections}
              currentLessonId={displayLesson?.id ?? displayLesson?.videoId ?? currentLesson?.id}
              completedIds={Array.isArray(progress?.completedLessonIds) ? progress.completedLessonIds : []}
              onSelect={selectLesson}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
