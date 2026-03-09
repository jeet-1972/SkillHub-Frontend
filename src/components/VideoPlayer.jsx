const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/
const EMBED_BASE = 'https://www.youtube-nocookie.com/embed'

export default function VideoPlayer({ videoId, title, startPositionSeconds = 0 }) {
  const idStr = videoId != null ? String(videoId).trim() : ''
  const validId = idStr && YOUTUBE_ID_REGEX.test(idStr)
  const start = startPositionSeconds > 0 ? Math.floor(startPositionSeconds) : 0
  const embedUrl = validId
    ? `${EMBED_BASE}/${idStr}?rel=0&modestbranding=1${start > 0 ? `&start=${start}` : ''}`
    : null

  return (
    <div className="space-y-2">
      <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            Select a lesson to play
          </div>
        )}
      </div>
      {embedUrl && (
        <p className="text-xs text-slate-500">
          If the video shows &quot;Video unavailable&quot;, it may be restricted by the uploader. Use the Next button to continue.
        </p>
      )}
    </div>
  )
}
