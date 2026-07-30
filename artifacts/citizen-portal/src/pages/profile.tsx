import { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, MapPin, Building, Shield, Save, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile();
  const { user: clerkUser } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || clerkUser?.firstName || "",
        lastName: profile.lastName || clerkUser?.lastName || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
      });
    }
  }, [profile, clerkUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfileMutation.mutateAsync({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });

      toast({
        title: "Profile Updated",
        description: "Your profile details have been saved successfully to the database.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error?.message || "Failed to update profile details. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Manage your personal details and civic identity." />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  const roleLabel = profile?.role === "admin" || profile?.role === "super_admin" ? "Administrator" : "Citizen";
  const avatarUrl = profile?.avatarUrl || clerkUser?.imageUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View and update your registered citizen details."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="col-span-1 border shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-md">
                <AvatarImage src={avatarUrl} alt="User Avatar" />
                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                  {profile?.firstName?.[0] || clerkUser?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl font-bold font-serif">
              {profile?.firstName || clerkUser?.firstName} {profile?.lastName || clerkUser?.lastName}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}
            </CardDescription>
            <div className="pt-3">
              <Badge variant={profile?.role === "admin" || profile?.role === "super_admin" ? "default" : "secondary"}>
                <Shield className="w-3 h-3 mr-1" />
                {roleLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 border-t text-sm space-y-3 text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium">
                <User className="w-4 h-4 text-primary" /> Citizen ID
              </span>
              <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[140px]">
                {profile?.id ? profile.id.slice(0, 8) + "..." : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Account Status
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="col-span-1 md:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
            <CardDescription>Update your personal information stored in the citizen portal database.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address (Clerk Authentication)
                </Label>
                <Input
                  id="email"
                  value={profile?.email || clerkUser?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 555-0199"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Residential Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 123 Civic Ave"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-medium flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground" /> City / Ward
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Metro City"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
