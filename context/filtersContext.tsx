import React, { createContext, useContext, useMemo, useState, ReactNode } from "react"

type FiltersCtx = {
  selectedFilters: string[]
  setSelectedFilters: React.Dispatch<React.SetStateAction<string[]>>
  toggleFilter: (key: string) => void
  clearFilters: () => void
  DEFAULT_FILTER_KEY: "recomendados" 
}

const FiltersContext = createContext<FiltersCtx | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const DEFAULT_FILTER_KEY = "recomendados" as const

  const toggleFilter = (key: string) => {
    if (key === DEFAULT_FILTER_KEY) {
      setSelectedFilters([]) // modo "Recomendados"
      return
    }
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const clearFilters = () => setSelectedFilters([])

  const value = useMemo(
    () => ({ selectedFilters, setSelectedFilters, toggleFilter, clearFilters, DEFAULT_FILTER_KEY }),
    [selectedFilters]
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider")
  return ctx
}
