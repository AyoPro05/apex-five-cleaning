import { triggerClientSentryTest } from '../monitoring/sentry'

export default function SentryTest() {
  return (
    <section className="pt-32 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sentry Test</h1>
          <p className="text-gray-600 mb-6">
            Use this page to confirm client error tracking is working. Clicking the button throws an
            unhandled error that should appear in Sentry.
          </p>
          <button
            type="button"
            onClick={triggerClientSentryTest}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            Trigger client test error
          </button>
        </div>
      </div>
    </section>
  )
}

