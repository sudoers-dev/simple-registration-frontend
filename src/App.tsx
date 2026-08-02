import { useState } from "react"
import { RegistrationForm } from "@/components/RegistrationForm"
import { RegistrationChart } from "@/components/RegistrationChart"
import { RegistrantsList } from "@/components/RegistrantsList"

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Registration Dashboard</h1>
      </header>

      {/* Main two-column layout */}
      <div className="flex h-[calc(100vh-57px)] overflow-hidden">

        {/* Left — Registration Form */}
        <aside className="w-[420px] shrink-0 border-r overflow-y-auto p-6">
          <RegistrationForm onSubmit={() => setRefreshKey((n) => n + 1)} />
        </aside>

        {/* Right — Chart + Table */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Chart strip */}
          <div className="border-b p-6 shrink-0">
            <RegistrationChart refreshKey={refreshKey} />
          </div>

          {/* Table — fills remaining height */}
          <div className="flex-1 overflow-y-auto p-6">
            <RegistrantsList refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
