/**
 * PreviewLayout — used by /preview/:slug inside the builder iframe.
 * Shows real Navbar + Footer around the real page component.
 * No builder frame detection, no custom page outlet — just the real site.
 */
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function PreviewLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
