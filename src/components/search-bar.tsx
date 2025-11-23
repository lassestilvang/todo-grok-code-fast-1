"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showClearButton?: boolean
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  showClearButton = true,
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onChange("")
  }

  return (
    <motion.div
      className={cn(
        "relative flex items-center",
        className
      )}
      animate={{
        scale: isFocused ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Search Icon */}
      <div className="absolute left-3 flex items-center pointer-events-none">
        <Search
          className={cn(
            "h-4 w-4 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      {/* Input */}
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "pl-10 pr-10 transition-all duration-200",
          isFocused && "ring-2 ring-primary/20"
        )}
        autoFocus={autoFocus}
      />

      {/* Clear Button */}
      <AnimatePresence>
        {showClearButton && value && (
          <motion.div
            className="absolute right-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Fuzzy search utility function
export function fuzzySearch<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string
): T[] {
  if (!searchTerm.trim()) return items

  const term = searchTerm.toLowerCase().trim()

  return items
    .map((item) => {
      const text = getSearchableText(item).toLowerCase()
      const score = getFuzzyMatchScore(text, term)
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}

// Simple fuzzy matching algorithm
function getFuzzyMatchScore(text: string, term: string): number {
  if (!term) return 1
  if (!text) return 0

  const textLower = text.toLowerCase()
  const termLower = term.toLowerCase()

  // Exact match gets highest score
  if (textLower === termLower) return 100

  // Starts with term gets high score
  if (textLower.startsWith(termLower)) return 80

  // Contains term gets medium score
  if (textLower.includes(termLower)) return 60

  // Fuzzy match - check if all characters of term appear in order
  let textIndex = 0
  let termIndex = 0
  let matches = 0

  while (textIndex < textLower.length && termIndex < termLower.length) {
    if (textLower[textIndex] === termLower[termIndex]) {
      matches++
      termIndex++
    }
    textIndex++
  }

  if (matches === termLower.length) {
    // All characters matched, score based on how close they are
    return 40 + (matches / termLower.length) * 20
  }

  return 0
}