export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Room Expense Tracker</h1>

        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Project Structure</h2>
            <p className="text-blue-800">
              This is a full-stack application with separate frontend and backend services.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Frontend (React + Vite)</h3>
              <p className="text-gray-700 text-sm mb-2">
                Located in: <code className="bg-gray-100 px-2 py-1 rounded">frontend/</code>
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                <div>cd frontend</div>
                <div>npm install</div>
                <div>npm run dev</div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Runs on: http://localhost:5173</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Backend (Node.js + Express)</h3>
              <p className="text-gray-700 text-sm mb-2">
                Located in: <code className="bg-gray-100 px-2 py-1 rounded">backend/</code>
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                <div>cd backend</div>
                <div>npm install</div>
                <div>npm run dev</div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Runs on: http://localhost:5000</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h3 className="font-semibold text-yellow-900 mb-2">Authentication Setup</h3>
            <p className="text-yellow-800 text-sm mb-2">
              Create a <code className="bg-yellow-100 px-2 py-1 rounded">.env</code> file in the backend directory:
            </p>
            <div className="bg-white p-3 rounded text-sm font-mono border border-yellow-200">
              <div>ADMIN_USERNAME=expense_admin</div>
              <div>ADMIN_PASSWORD=@Expense123</div>
              <div>JWT_SECRET=your_secret_key_here</div>
              <div>DATABASE_URL=your_database_url</div>
            </div>
            <p className="text-yellow-700 text-sm mt-2">
              See <code className="bg-yellow-100 px-2 py-1 rounded">backend/AUTH_SETUP.md</code> for detailed
              instructions.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
              <li>Set up your database (PostgreSQL)</li>
              <li>
                Configure environment variables in <code className="bg-gray-100 px-1 rounded">backend/.env</code>
              </li>
              <li>Install dependencies for both frontend and backend</li>
              <li>Start the backend server first</li>
              <li>Start the frontend development server</li>
              <li>Navigate to the frontend URL and login</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
