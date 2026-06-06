export function useFxRate() {
  return {
    rate: 1600,
    updatedAt: undefined as string | undefined,
    isLoading: false,
    update: {
      mutate: (_rate: number) => {},
      mutateAsync: async (_rate: number) => {},
      isPending: false,
    },
  };
}
