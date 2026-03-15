import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ReactNode } from "react"
import { ServerErrorResponse } from "../utils/axios-instance";
import { toast } from "sonner";

const TEN_MINUTES = 10 * 60 * 1000;

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TEN_MINUTES,
    },
    mutations: {
      onError: (error: AxiosError<ServerErrorResponse>) => {
        const axiosError = error
        const message = axiosError.response.data.message
        toast.error(message)
      }
    }
  }
});

type TanstackQueryProviderProps = {
 children: ReactNode;
}

export default function TanstackQueryProvider({children}: TanstackQueryProviderProps) {
  return (
   <QueryClientProvider client={queryClient}>
    {children}
   </QueryClientProvider>
  )
}
