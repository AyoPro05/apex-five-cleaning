import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchKnowledge } from '../data/websiteContent'

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const matches = searchKnowledge(query, 8)
    setResults(matches)
  }, [query])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSelect = (item) => {
    if (item.link) {
      navigate(item.link)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, pricing, contact, FAQ..."
            className="flex-1 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {query.trim() && (
            <>
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No results for &quot;{query}&quot;
                </div>
              ) : (
                <ul className="py-2">
                  {results.map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => handleSelect(item)}
                        className="w-full text-left px-4 py-3 hover:bg-teal-50 transition flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-teal-600 text-sm">{item.topic}</span>
                        <span className="text-gray-600 text-sm line-clamp-2">{item.answer}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              Type to search services, pricing, booking, contact info...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
