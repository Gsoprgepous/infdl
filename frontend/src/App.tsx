import React, { useEffect } from 'react'
import { Feed } from './components/Feed'
import { MyCity } from './components/MyCity'
import { Profile } from './components/Profile'
import { Calibration } from './components/Calibration'
import { useCityStore } from './store/useCityStore'

function App() {
  const { city, loadState, triggerDay, intervene, selectAgent, fetchFinale } = useCityStore()

  useEffect(() => {
    loadState()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Feed feed={city.feed} onTrigger={() => triggerDay()} />
        </div>

        <div className="space-y-6">
          <MyCity city={city} />
          <Profile agent={city.agents.find((a) => a.id === city.selectedAgentId)!} onIntervene={(action) => intervene(city.selectedAgentId, action)} />
          <Calibration onSubmit={(score) => useCityStore.getState().evaluateCalibration(score)} />
        </div>
      </div>
    </div>
  )
}

export default App
