type SessionExpiredListener = () => void

const sessionExpiredListeners = new Set<SessionExpiredListener>()

const subscribeSessionExpired = (listener: SessionExpiredListener) => {
  sessionExpiredListeners.add(listener)

  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

const notifySessionExpired = () => {
  sessionExpiredListeners.forEach((listener) => listener())
}

export { notifySessionExpired, subscribeSessionExpired }
