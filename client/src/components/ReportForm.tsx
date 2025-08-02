import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, MapPin, Crosshair, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255, "Title too long"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  userLocation: { lat: number; lng: number } | null;
  onSuccess: () => void;
}

export default function ReportForm({ userLocation, onSuccess }: ReportFormProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [locationMethod, setLocationMethod] = useState<"current" | "manual">("current");

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      latitude: userLocation?.lat || 0,
      longitude: userLocation?.lng || 0,
      address: "",
      isAnonymous: false,
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormData & { photos: File[] }) => {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photos') {
          formData.append(key, String(value));
        }
      });
      
      // Append photos
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await fetch('/api/issues', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue Reported Successfully",
        description: "Thank you for helping improve your community!",
      });
      form.reset();
      setPhotos([]);
      setPhotoPreviewUrls([]);
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = 3 - photos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    setPhotos([...photos, ...filesToAdd]);

    // Create preview URLs
    const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviewUrls);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          
          // Reverse geocode to get address (in real app, would use a geocoding service)
          form.setValue("address", `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          
          toast({
            title: "Location Updated",
            description: "Current location has been set.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your current location.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const onSubmit = (data: ReportFormData) => {
    if (!data.latitude || !data.longitude) {
      toast({
        title: "Location Required",
        description: "Please set a location for your report.",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate({ ...data, photos });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Report New Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="roads">🛣️ Roads (potholes, obstructions)</SelectItem>
                      <SelectItem value="lighting">💡 Lighting (broken or flickering lights)</SelectItem>
                      <SelectItem value="water">💧 Water Supply (leaks, low pressure)</SelectItem>
                      <SelectItem value="cleanliness">🗑️ Cleanliness (overflowing bins, garbage)</SelectItem>
                      <SelectItem value="safety">🛡️ Public Safety (open manholes, exposed wiring)</SelectItem>
                      <SelectItem value="obstructions">⚠️ Obstructions (fallen trees, debris)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Provide detailed information about the issue, including location specifics and any safety concerns"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <div>
              <FormLabel>Photos (Up to 3)</FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-civic-blue transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Click to upload photos or drag and drop</p>
                <p className="text-xs text-gray-500 mb-4">Maximum 3 photos, 5MB each</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={photos.length >= 3}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={photos.length >= 3}
                >
                  Choose Photos
                </Button>
              </div>

              {/* Photo Previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <FormLabel>Location</FormLabel>
              <div className="flex gap-3 mb-3">
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex-1 bg-civic-blue hover:bg-blue-700"
                >
                  <Crosshair className="w-4 h-4 mr-2" />
                  Use Current Location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // In real app, this would open a map picker modal
                    toast({
                      title: "Feature Coming Soon",
                      description: "Map picker will be available in the next update.",
                    });
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Pick on Map
                </Button>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {form.watch("address") || "Location not set"}
                </p>
                <p className="text-xs text-gray-500">
                  Coordinates: {form.watch("latitude")?.toFixed(6) || "0"}, {form.watch("longitude")?.toFixed(6) || "0"}
                </p>
              </div>
            </div>

            {/* Anonymous Reporting */}
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Report anonymously
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-civic-blue hover:bg-blue-700"
                disabled={reportMutation.isPending}
              >
                {reportMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setPhotos([]);
                  setPhotoPreviewUrls([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
