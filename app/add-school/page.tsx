"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, School, MapPin, Phone, Mail, ImageIcon, LogIn, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

const schoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  contact: z.string().regex(/^\d{10,15}$/, "Contact must be 10-15 digits"),
  email_id: z.string().email("Please enter a valid email address"),
  image: z.any().optional(),
})

type SchoolFormData = z.infer<typeof schoolSchema>

export default function AddSchoolPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsAuthLoading(false)

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add schools.",
          variant: "destructive",
        })
        router.push("/auth/login")
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push("/auth/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, toast])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      contact: "",
      email_id: "",
      image: undefined,
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue("image", file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: SchoolFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add schools.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      let imageUrl = null

      if (data.image && data.image instanceof File) {
        const fileExt = data.image.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("schoolImages").upload(fileName, data.image)

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError.message)
          toast({
            title: "Upload Error",
            description: `Failed to upload image: ${uploadError.message}`,
            variant: "destructive",
          })
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("schoolImages").getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const { error: insertError } = await supabase.from("schools").insert({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        contact: Number.parseInt(data.contact),
        email_id: data.email_id,
        image: imageUrl,
        created_by: user.id,
      })

      if (insertError) {
        console.error("[v0] Insert error:", insertError.message)
        toast({
          title: "Database Error",
          description: `Failed to add school: ${insertError.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success!",
        description: "School has been added successfully.",
      })

      reset()
      setImagePreview(null)
    } catch (error) {
      console.error("[v0] Submission error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>You need to be logged in to add schools to the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login to Continue
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/schools">
                <School className="mr-2 h-4 w-4" />
                View Schools Instead
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">Add New School</h1>
          <p className="text-muted-foreground text-pretty">Register a new educational institution in our database</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm text-primary">
            <Shield className="h-4 w-4" />
            Logged in as {user.email}
          </div>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <School className="h-5 w-5 text-primary" />
              School Information
            </CardTitle>
            <CardDescription>Please fill in all the required details about the school</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  School Name *
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter school name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="text-sm text-destructive animate-in slide-in-from-left-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address *
                </Label>
                <Textarea
                  id="address"
                  {...register("address")}
                  placeholder="Enter complete address"
                  className="min-h-[80px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {errors.address && (
                  <p className="text-sm text-destructive animate-in slide-in-from-left-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City *
                  </Label>
                  <Input
                    id="city"
                    {...register("city")}
                    placeholder="Enter city"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive animate-in slide-in-from-left-1">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State *
                  </Label>
                  <Input
                    id="state"
                    {...register("state")}
                    placeholder="Enter state"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive animate-in slide-in-from-left-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Number *
                  </Label>
                  <Input
                    id="contact"
                    {...register("contact")}
                    placeholder="Enter contact number"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.contact && (
                    <p className="text-sm text-destructive animate-in slide-in-from-left-1">{errors.contact.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_id" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email_id"
                    type="email"
                    {...register("email_id")}
                    placeholder="Enter email address"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.email_id && (
                    <p className="text-sm text-destructive animate-in slide-in-from-left-1">
                      {errors.email_id.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  School Image (Optional)
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors duration-200">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="School preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null)
                          setValue("image", undefined)
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="image"
                          className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                        >
                          Click to upload
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-all duration-200 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Adding School...
                    </>
                  ) : (
                    <>
                      <School className="mr-2 h-4 w-4" />
                      Add School
                    </>
                  )}
                </Button>

                <Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial bg-transparent">
                  <Link href="/schools">View All Schools</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
