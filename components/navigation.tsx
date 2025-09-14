"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { School, Menu, Home, Eye, Plus, LogIn, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const publicNavigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "View Schools",
    href: "/schools",
    icon: Eye,
  },
]

const protectedNavigationItems = [
  {
    name: "Add School",
    href: "/add-school",
    icon: Plus,
  },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    setIsOpen(false)
  }

  const navigationItems = user ? [...publicNavigationItems, ...protectedNavigationItems] : publicNavigationItems

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-primary/10 rounded-lg">
              <School className="h-6 w-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">SchoolHub</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.name}
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </Button>
                )
              })}
            </nav>

            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-border">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{user.email?.split("@")[0]}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 bg-transparent"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <Button asChild variant="outline" size="sm" className="flex items-center space-x-1 bg-transparent">
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="flex items-center space-x-2 pb-4 border-b border-border">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <School className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">SchoolHub</h2>
                    <p className="text-sm text-muted-foreground">Management System</p>
                  </div>
                </div>

                {!isLoading && (
                  <div className="pb-4 border-b border-border">
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">{user.email}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2 bg-transparent"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center space-x-2 bg-transparent"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/auth/login">
                          <LogIn className="h-4 w-4" />
                          <span>Login to Add Schools</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                )}

                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Button
                        key={item.name}
                        asChild
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "justify-start space-x-3 h-12 transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href={item.href}>
                          <Icon className="h-5 w-5" />
                          <span className="text-base">{item.name}</span>
                        </Link>
                      </Button>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
