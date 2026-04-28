import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useAuth } from '../../features/auth/components/AuthContext'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { user, isAuthenticated } = useAuth()

  const quickLinks = [
    { name: 'Browse Events', href: '/events' },
    { name: 'Help', href: '/help' },
  ]

  const organizerLinks = [
    { name: 'Create Event', href: '/events/create', requiresAuth: true, requiresOrganizer: true },
    { name: 'Dashboard', href: '/organizer/dashboard', requiresAuth: true, requiresOrganizer: true },
  ]

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ]

  return (
    <footer className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">EventHub</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your platform for discovering and hosting amazing events.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organizer & Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-4">
              For Organizers
            </h3>
            <ul className="space-y-3 mb-6">
              {organizerLinks
                .filter((link) => {
                  if (link.requiresAuth && !isAuthenticated) return false
                  if (link.requiresOrganizer && user?.role !== 'ORGANIZER') return false
                  return true
                })
                .map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
            </ul>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {currentYear} EventHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
