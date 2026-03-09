import { useState, useEffect } from 'react'

export default function LessonList({ sections = [], currentLessonId, completedIds = [], onSelect }) {
  const safeSections = Array.isArray(sections) ? sections : []
  const [expanded, setExpanded] = useState(() => safeSections.map((s) => s?.id).filter(Boolean))

  useEffect(() => {
    if (safeSections.length === 0) return
    const ids = safeSections.map((s) => s?.id).filter(Boolean)
    setExpanded((prev) => (prev.length === 0 ? ids : prev))
  }, [safeSections.length])

  const toggle = (id) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {safeSections.map((section) => (
        <div key={section?.id ?? section?.title} className="border-b border-slate-200 last:border-0">
          <button
            onClick={() => toggle(section?.id)}
            className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-slate-900 bg-slate-50 hover:bg-slate-100"
          >
            <span>{section?.title ?? 'Section'}</span>
            <span className="text-slate-500">{expanded.includes(section?.id) ? '−' : '+'}</span>
          </button>
          {expanded.includes(section?.id) && (
            <ul className="py-1">
              {(Array.isArray(section?.lessons) ? section.lessons : []).map((lesson, idx) => {
                const isCurrent = lesson?.id === currentLessonId
                const isCompleted = Array.isArray(completedIds) && completedIds.includes(lesson?.id)
                return (
                  <li key={lesson?.id ?? `l-${section?.id}-${idx}`}>
                    <button
                      onClick={() => onSelect(lesson)}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-slate-50 ${
                        isCurrent ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="text-green-600 shrink-0" title="Completed">✓</span>
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <span className="truncate">{lesson?.title ?? 'Lesson'}</span>
                      {(lesson?.durationMinutes != null && lesson.durationMinutes > 0) && (
                        <span className="text-slate-400 text-xs ml-auto shrink-0">
                          {lesson.durationMinutes} min
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
