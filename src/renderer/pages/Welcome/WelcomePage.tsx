import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Shield, ArrowRight } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUIStore } from '../../stores/uiStore'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { config, loadConfig, updateConfig } = useSettingsStore()
  const { addToast } = useUIStore()
  const [step, setStep] = useState(0)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    // If already completed welcome, skip to dashboard
    if (config && (config as any).firstRun === false) {
      navigate('/', { replace: true })
    }
  }, [config, navigate])

  const handleComplete = async () => {
    await updateConfig({ ...(config || {}), firstRun: false } as any)
    addToast('Welcome to CleanSweep!', 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {step === 0 && (
          <div className="text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to CleanSweep
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The cross-platform desktop cleaner that keeps your Mac or Windows PC running smoothly.
            </p>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Safety First</h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 mb-8">
              <p>CleanSweep is designed with your data safety in mind:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Files are moved to Quarantine before deletion</li>
                <li>You can restore files from Quarantine anytime</li>
                <li>Whitelist protects important folders</li>
                <li>Smart detection prevents system file removal</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Start Using CleanSweep
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
