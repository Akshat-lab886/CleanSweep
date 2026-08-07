import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'

// Eager load for initial render
import Dashboard from './pages/Dashboard/Dashboard'

// Lazy load other pages
const CleanerHome = React.lazy(() => import('./pages/Cleaner/CleanerHome'))
const DuplicatesHome = React.lazy(() => import('./pages/Duplicates/DuplicatesHome'))
const OrganizerHome = React.lazy(() => import('./pages/Organizer/OrganizerHome'))
const DiskAnalyzer = React.lazy(() => import('./pages/Disk/DiskAnalyzer'))
const AppsHome = React.lazy(() => import('./pages/Apps/AppsHome'))
const SchedulerHome = React.lazy(() => import('./pages/Scheduler/SchedulerHome'))
const QuarantineHome = React.lazy(() => import('./pages/Quarantine/QuarantineHome'))
const SettingsHome = React.lazy(() => import('./pages/Settings/SettingsHome'))
const WelcomePage = React.lazy(() => import('./pages/Welcome/WelcomePage'))

function AppRouter() {
  return (
    <Routes>
      <Route path="/welcome" element={
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          <WelcomePage />
        </Suspense>
      } />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="cleaner" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <CleanerHome />
          </Suspense>
        } />
        <Route path="duplicates" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <DuplicatesHome />
          </Suspense>
        } />
        <Route path="organizer" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <OrganizerHome />
          </Suspense>
        } />
        <Route path="disk" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <DiskAnalyzer />
          </Suspense>
        } />
        <Route path="apps" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <AppsHome />
          </Suspense>
        } />
        <Route path="scheduler" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <SchedulerHome />
          </Suspense>
        } />
        <Route path="quarantine" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <QuarantineHome />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <SettingsHome />
          </Suspense>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
