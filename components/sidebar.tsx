"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Upload,
  Search,
  Shield,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  Truck,
  Activity,
  ClipboardList,
  Zap,
  Home,
} from "lucide-react"

const navigation = {
  exporter: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Document Upload", href: "/document-upload", icon: Upload },
    { name: "HS Code Copilot", href: "/hs-code-copilot", icon: Search },
    { name: "Invoice Validator", href: "/invoice-validator", icon: Shield },
    { name: "BOE Validator", href: "/boe-validator", icon: FileText },

    { name: "Compliance Reports", href: "/compliance-reports", icon: BarChart3 },
    { name: "Audit Trail", href: "/audit-trail", icon: ClipboardList },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  ca: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Client Management", href: "/client-management", icon: Users },
    { name: "Audit Reports", href: "/audit-reports", icon: FileText },
    { name: "Compliance Analytics", href: "/compliance-analytics", icon: BarChart3 },
    { name: "Document Review", href: "/document-review", icon: Shield },
    { name: "Audit Trail", href: "/audit-trail", icon: ClipboardList },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  forwarder: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Shipment Tracking", href: "/shipment-tracking", icon: Truck },
    { name: "Document Validation", href: "/document-validation", icon: Shield },
    { name: "ERP Integration", href: "/erp-integration", icon: Database },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Audit Trail", href: "/audit-trail", icon: ClipboardList },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "User Management", href: "/user-management", icon: Users },
    { name: "System Health", href: "/system-health", icon: Activity },
    { name: "API Management", href: "/api-management", icon: Zap },
    { name: "Analytics", href: "/admin-analytics", icon: BarChart3 },
    { name: "Audit Trail", href: "/audit-trail", icon: ClipboardList },
    { name: "Settings", href: "/admin-settings", icon: Settings },
  ],
}

export function Sidebar() {
  const [userRole, setUserRole] = useState<string>("")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "exporter"
    const auth = localStorage.getItem("isAuthenticated") === "true"
    setUserRole(role)
    setIsAuthenticated(auth)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    localStorage.removeItem("userCompany")
    router.push("/")
  }

  const handleHome = () => {
    router.push("/")
  }

  if (!isAuthenticated || pathname === "/") {
    return null
  }

  const currentNavigation = navigation[userRole as keyof typeof navigation] || navigation.exporter

  return (
    <div
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Export</h2>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {currentNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn("w-full justify-start", isCollapsed && "px-2")}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        {!isCollapsed && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
            <p className="text-xs text-gray-500">Role-based access</p>
          </div>
        )}
        <Button variant="ghost" onClick={handleHome} className={cn("w-full justify-start", isCollapsed && "px-2")}>
          <Home className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Home"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn("w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50", isCollapsed && "px-2")}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  )
}
