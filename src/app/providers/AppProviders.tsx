import type { PropsWithChildren } from "react"

import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import { queryClient } from "@/lib/query-client"

const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <Toaster position="top-right" richColors closeButton />
  </QueryClientProvider>
)

export { AppProviders }
