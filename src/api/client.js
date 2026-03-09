import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api'

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh')
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      if (refreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }
      originalRequest._retry = true
      refreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.accessToken
        setAccessToken(newToken)
        onRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        accessToken = null
        const path = typeof window !== 'undefined' && window.location ? window.location.pathname : ''
        const onProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/course/')
        if (onProtectedRoute) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

export const coursesApi = {
  list: (params) => api.get('/courses', { params }),
  getDetail: (id) => api.get(`/courses/${id}`),
  getSections: (id) => api.get(`/courses/${id}/sections`),
  getTree: (courseId) => api.get(`/courses/${courseId}/tree`),
  getFirstVideo: (courseId) => api.get(`/courses/${courseId}/first-video`),
  isEnrolled: (courseId) => api.get(`/courses/${courseId}/enrolled`),
}

export const lessonsApi = {
  get: (lessonId) => api.get(`/lessons/${lessonId}`),
}

export const videosApi = {
  get: (videoId) => api.get(`/videos/${videoId}`),
}

export const enrollmentsApi = {
  enroll: (courseId) => api.post('/enrollments', { courseId }),
  myEnrollments: () => api.get('/enrollments'),
}

export const progressApi = {
  complete: (lessonId) => api.post('/progress/complete', { lessonId }),
  watching: (idOrBody) => {
    const body = typeof idOrBody === 'object' && idOrBody !== null && 'lessonId' in idOrBody
      ? idOrBody
      : { lessonId: idOrBody }
    return api.post('/progress/watching', body)
  },
  getCourseProgress: (courseId) => api.get(`/progress/courses/${courseId}`),
  getVideoProgress: (videoId) => api.get(`/progress/videos/${videoId}`),
  upsertVideoProgress: (videoId, body) => api.post(`/progress/videos/${videoId}`, body),
  getAll: () => api.get('/progress'),
}

export const paymentsApi = {
  checkout: (courseId) => api.post('/payments/checkout', { courseId }),
}
