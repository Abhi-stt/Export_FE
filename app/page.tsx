"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, FileText, BarChart3, Users, Sparkles, CheckCircle, Globe, ArrowRight, Play, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

// Demo credentials that match the backend database
const DEMO_CREDENTIALS = {
  exporter: { email: "user@export.com", password: "user123", role: "exporter" },
  ca: { email: "ca@export.com", password: "ca123", role: "ca" },
  forwarder: { email: "forwarder@export.com", password: "forwarder123", role: "forwarder" },
  admin: { email: "admin@export.com", password: "admin123", role: "admin" },
}

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedDemo, setSelectedDemo] = useState("")
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const router = useRouter()
  const { toast } = useToast()

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus()
  }, [])

  const checkBackendStatus = async () => {
    try {
      // Use apiClient which handles environment variables automatically
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health`.replace('/api/health', '/health'))
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Backend is online:', data)
        setBackendStatus('online')
      } else {
        console.log('❌ Backend health check failed:', response.status)
        setBackendStatus('offline')
      }
    } catch (error) {
      console.error('❌ Backend connection error:', error)
      setBackendStatus('offline')
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('🔄 Starting login process...')
      console.log('📝 Login data:', { email })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('📡 Backend response status:', response.status)

      const data = await response.json()
      console.log('📄 Backend response data:', data)

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('userRole', data.data.user.role)
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userEmail', data.data.user.email)
        localStorage.setItem('userName', data.data.user.name)
        localStorage.setItem('userCompany', data.data.user.company)

        console.log('✅ Login successful - Role:', data.data.user.role)
        console.log('💾 Stored userRole in localStorage:', localStorage.getItem('userRole'))
        console.log('🔑 JWT Token stored:', data.data.token ? 'Yes' : 'No')

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.data.user.name}!`,
          variant: "default",
        })

        router.push("/dashboard")
      } else {
        // Show detailed error information
        console.error('❌ Backend login failed:', data)
        console.error('📊 Response status:', response.status)
        console.error('📄 Response data:', data)
        
        let errorMessage = "Login failed. Please check your credentials."
        if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        } else if (response.status === 401) {
          errorMessage = "Invalid email or password."
        } else if (response.status === 404) {
          errorMessage = "User not found."
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later."
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        })
        
        // Don't redirect on backend failure - let user try again
        return
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      
      let errorMessage = "Backend is not available. Please try again when server is running."
      if (
        error instanceof Error &&
        error.name === 'TypeError' &&
        error.message.includes('fetch')
      ) {
        errorMessage = "Cannot connect to server. Please make sure the backend is running."
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Don't redirect on error - let user try again
      return
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    console.log('🔍 handleRegister function called');
    console.log('📝 Form data:', { email, password, confirmPassword, fullName, company, role });
    
    if (!email || !password || !confirmPassword || !fullName || !company || !role) {
      console.log('❌ Validation failed - missing required fields');
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed - passwords do not match');
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed - invalid email format');
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('❌ Validation failed - password too short');
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    console.log('✅ All validations passed, starting registration...');
    setIsLoading(true)

    try {
      console.log('🔄 Starting registration process...')
      console.log('📝 Registration data:', { 
        name: fullName, 
        email, 
        company, 
        role,
        phone: "+91 98765 43210" // Default phone for demo
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          phone: "+91 98765 43210", // Default phone for demo
          company,
          role,
        }),
      })

      console.log('📡 Backend response status:', response.status)

      const data = await response.json()
      console.log('📄 Backend response data:', data)

      if (response.ok && data.success) {
        // Store token and user data from backend
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('userRole', data.data.user.role)
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userEmail', data.data.user.email)
        localStorage.setItem('userName', data.data.user.name)
        localStorage.setItem('userCompany', data.data.user.company)

        console.log('✅ Registration successful - Role:', data.data.user.role)
        console.log('💾 Stored userRole in localStorage:', localStorage.getItem('userRole'))
        console.log('🔑 JWT Token stored:', data.data.token ? 'Yes' : 'No')

        toast({
          title: "Registration Successful! 🎉",
          description: `Welcome, ${data.data.user.name}! Your account has been saved to the database.`,
          variant: "default",
        })

        // Redirect to dashboard with the correct role
        console.log('🔄 Redirecting to dashboard with role:', data.data.user.role)
        router.push("/dashboard")
      } else {
        // Show detailed error information
        console.error('❌ Backend registration failed:', data)
        console.error('📊 Response status:', response.status)
        console.error('📄 Response data:', data)
        
        let errorMessage = "Registration failed. Please try again."
        if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        } else if (response.status === 400) {
          errorMessage = "Invalid registration data. Please check your information."
        } else if (response.status === 409) {
          errorMessage = "An account with this email already exists."
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later."
        }
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        })
        
        // Don't redirect on backend failure - let user try again
        return
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
      
      let errorMessage = "Backend is not available. Please try again when server is running."
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        "message" in error &&
        typeof (error as { name: unknown }).name === "string" &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        if (
          (error as { name: string }).name === "TypeError" &&
          (error as { message: string }).message.includes("fetch")
        ) {
          errorMessage = "Cannot connect to server. Please make sure the backend is running."
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Don't redirect on error - let user try again
      return
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (demoRole: string) => {
    const creds = DEMO_CREDENTIALS[demoRole as keyof typeof DEMO_CREDENTIALS]
    setEmail(creds.email)
    setPassword(creds.password)
    setSelectedDemo(demoRole)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI Export Compliance</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" })}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Export
              <span className="text-blue-600 block">Compliance Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your export documentation with intelligent HS Code suggestions, automated validation, and
              comprehensive compliance monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Export Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage export documentation, ensure compliance, and streamline your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered HS Code Suggestions</CardTitle>
                <CardDescription>
                  Get intelligent HS Code recommendations based on product descriptions and industry standards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Automated Document Validation</CardTitle>
                <CardDescription>
                  Validate invoices, BOEs, and other export documents with AI-powered error detection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Compliance Analytics</CardTitle>
                <CardDescription>
                  Track compliance scores, identify risks, and generate comprehensive reports.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure access for exporters, CAs, forwarders, and administrators with custom permissions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Shipment Tracking</CardTitle>
                <CardDescription>
                  Track shipments in real-time with document status and compliance monitoring.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Upload, organize, and manage all your export documents in one secure platform.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Authentication Section */}
      <section id="auth" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of exporters who trust our platform for their compliance needs.
            </p>
          </div>

          {/* Single Form with Tabs */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Access Your Account</CardTitle>
              <CardDescription className="text-center">
                Sign in to your existing account or create a new one to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {/* Demo Credentials */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Quick Demo Login:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials('admin')}
                        className="text-xs"
                      >
                        Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials('ca')}
                        className="text-xs"
                      >
                        CA
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials('forwarder')}
                        className="text-xs"
                      >
                        Forwarder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials('exporter')}
                        className="text-xs"
                      >
                        Exporter
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  {backendStatus === 'checking' && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking server connection...
                    </div>
                  )}
                  
                  {backendStatus === 'offline' && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span>❌ Cannot connect to server. Please ensure the backend is running on port 5000.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={checkBackendStatus}
                          className="ml-2 text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {backendStatus === 'online' && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✅ Connected to server
                    </div>
                  )}
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-company">Company</Label>
                    <Input
                      id="register-company"
                      placeholder="Enter your company name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exporter">Exporter</SelectItem>
                        <SelectItem value="ca">Customs Agent (CA)</SelectItem>
                        <SelectItem value="forwarder">Freight Forwarder</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() => {
                      console.log('🔘 Create Account button clicked!');
                      handleRegister();
                    }}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">AI Export Compliance</span>
            </div>
            <p className="text-gray-400">
              © 2024 AI Export Compliance Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
