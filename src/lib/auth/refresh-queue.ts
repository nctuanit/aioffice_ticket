type QueuedRequest = {
  resolve: (accessToken: string) => void
  reject: (error: Error) => void
}

type RefreshExecutor = () => Promise<string>

type RefreshQueue = {
  run: (executor: RefreshExecutor) => Promise<string>
  reset: () => void
  isRefreshing: () => boolean
}

const createRefreshQueue = (): RefreshQueue => {
  let refreshing = false
  let queue: QueuedRequest[] = []

  const reset = () => {
    refreshing = false
    queue = []
  }

  const resolveQueue = (accessToken: string) => {
    const pending = [...queue]
    queue = []
    pending.forEach(({ resolve }) => resolve(accessToken))
  }

  const rejectQueue = (error: Error) => {
    const pending = [...queue]
    queue = []
    pending.forEach(({ reject }) => reject(error))
  }

  const run = async (executor: RefreshExecutor) => {
    if (refreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject })
      })
    }

    refreshing = true

    try {
      const accessToken = await executor()
      resolveQueue(accessToken)
      return accessToken
    } catch (error) {
      const refreshError =
        error instanceof Error ? error : new Error("Unable to refresh session")
      rejectQueue(refreshError)
      throw refreshError
    } finally {
      refreshing = false
    }
  }

  return {
    run,
    reset,
    isRefreshing: () => refreshing,
  }
}

const refreshQueue = createRefreshQueue()

const runRefreshTask = (executor: RefreshExecutor) =>
  refreshQueue.run(executor)

export { createRefreshQueue, runRefreshTask }
