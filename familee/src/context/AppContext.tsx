import { createContext, useContext, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { AuthResult } from "@workspace/api-client-react";

interface AppContextType {
  user: AuthResult | null;
  isLoading: boolean;
  refetchUser: () => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  isLoading: true,
  refetchUser: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  return (
    <AppContext.Provider
      value={{
        user: user || null,
        isLoading,
        refetchUser: refetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
