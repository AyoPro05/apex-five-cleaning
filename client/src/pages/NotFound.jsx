import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="pt-32 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow p-8 sm:p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-5">Page not found</h1>
          <p className="text-gray-600 mt-3">
            The page you are looking for does not exist or may have moved.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  )
}

