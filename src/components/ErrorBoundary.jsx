import { Component } from 'react'
import { Link } from 'react-router-dom'

function ErrorFallback({ error }) {
  const isDev = import.meta.env.DEV
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <p className="text-slate-600 mb-4">Something went wrong. Please try again.</p>
      {isDev && error && (
        <pre className="mb-4 p-3 bg-slate-100 text-left text-xs text-red-700 rounded overflow-auto max-w-full max-h-32">
          {error.message}
        </pre>
      )}
      <Link
        to="/courses"
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
      >
        Back to courses
      </Link>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info?.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.locationKey !== this.props.locationKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
