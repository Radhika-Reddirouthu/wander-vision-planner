import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Loader2, 
  MapPin, 
  Star, 
  IndianRupee, 
  Clock, 
  Utensils, 
  Car, 
  Info,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlaceIdentifierProps {
  onBack: () => void;
}

const PlaceIdentifier = ({ onBack }: PlaceIdentifierProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [isLoadingImageAnalysis, setIsLoadingImageAnalysis] = useState(false);
  const [showDetailedItinerary, setShowDetailedItinerary] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target?.result as string;
        setUploadedImage(imageBase64);
        setImageAnalysis(null);
        setShowDetailedItinerary(false);
        
        // Analyze the image with Gemini Vision
        setIsLoadingImageAnalysis(true);
        try {
          const { data, error } = await supabase.functions.invoke('identify-place', {
            body: { imageBase64 }
          });
          if (error) throw error;
          setImageAnalysis(data);
        } catch (error) {
          console.error('Error analyzing image:', error);
        } finally {
          setIsLoadingImageAnalysis(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShowItinerary = () => {
    setShowDetailedItinerary(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <Button 
            onClick={onBack}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center bg-gradient-nature bg-clip-text text-transparent flex items-center justify-center gap-3">
              <Camera className="w-8 h-8 text-nature" />
              AI Place Detective
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              Upload any photo to instantly discover location details, travel insights, and recommendations
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Image Upload Section */}
            <div className="text-center">
              <Label htmlFor="image-upload" className="text-lg font-semibold mb-4 block">
                Upload Your Photo
              </Label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-nature rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Click to upload an image</p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPG, PNG, WebP formats
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>

            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Uploaded Image</h3>
                <div className="relative inline-block">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded location" 
                    className="max-w-full max-h-96 rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoadingImageAnalysis && (
              <div className="text-center p-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-nature" />
                <h3 className="text-lg font-medium mb-2">Analyzing your image...</h3>
                <p className="text-muted-foreground">Our AI is identifying the location and gathering travel insights</p>
              </div>
            )}

            {/* Analysis Results */}
            {imageAnalysis && !imageAnalysis.error && (
              <div className="space-y-6">
                {/* Place Identification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Location Identified
                      {imageAnalysis.confidence === 'high' ? (
                        <Badge className="bg-green-500 text-white flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          High Confidence
                        </Badge>
                      ) : imageAnalysis.confidence === 'medium' ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Medium Confidence
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Low Confidence
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-lg">{imageAnalysis.identifiedPlace}</h4>
                        <p className="text-muted-foreground">
                          {imageAnalysis.city && `${imageAnalysis.city}, `}
                          {imageAnalysis.state && `${imageAnalysis.state}, `}
                          {imageAnalysis.country}
                        </p>
                      </div>
                      <div className="text-right">
                        {imageAnalysis.confidence !== 'high' && (
                          <p className="text-sm text-muted-foreground">
                            AI is not very sure about this identification
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {imageAnalysis.description && (
                      <p className="text-sm text-muted-foreground bg-accent/20 p-3 rounded-lg">
                        {imageAnalysis.description}
                      </p>
                    )}

                    {imageAnalysis.historicalSignificance && (
                      <div>
                        <h5 className="font-medium mb-2">Historical Significance</h5>
                        <p className="text-sm text-muted-foreground">
                          {imageAnalysis.historicalSignificance}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Travel Info */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Best Time to Visit */}
                  {imageAnalysis.bestTimeToVisit && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Best Time to Visit
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          {imageAnalysis.bestTimeToVisit.months?.join(', ')}
                        </p>
                        {imageAnalysis.bestTimeToVisit.reason && (
                          <p className="text-xs text-muted-foreground">
                            {imageAnalysis.bestTimeToVisit.reason}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Budget Estimate */}
                  {imageAnalysis.estimatedBudget && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-primary" />
                          Estimated Budget
                        </h4>
                        <p className="text-sm font-medium">{imageAnalysis.estimatedBudget.budget}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Weather Info */}
                  {imageAnalysis.weatherInfo && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" />
                          Current Weather
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {imageAnalysis.weatherInfo}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Nearby Attractions */}
                {imageAnalysis.nearbyAttractions && imageAnalysis.nearbyAttractions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-adventure" />
                        Nearby Attractions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {imageAnalysis.nearbyAttractions.slice(0, 4).map((attraction: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <h5 className="font-medium">{attraction.name}</h5>
                            <p className="text-sm text-muted-foreground mb-1">{attraction.distance}</p>
                            <p className="text-xs text-muted-foreground">{attraction.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Local Cuisine */}
                  {imageAnalysis.localCuisine && imageAnalysis.localCuisine.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Utensils className="w-5 h-5 text-nature" />
                          Local Cuisine
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {imageAnalysis.localCuisine.map((dish: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {dish}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Transportation */}
                  {imageAnalysis.transportationOptions && imageAnalysis.transportationOptions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Car className="w-5 h-5 text-primary" />
                          Transportation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {imageAnalysis.transportationOptions.map((option: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Important Tips */}
                {imageAnalysis.importantTips && imageAnalysis.importantTips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-adventure" />
                        Important Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {imageAnalysis.importantTips.map((tip: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Itinerary Button */}
                {!showDetailedItinerary && imageAnalysis.suggestedItinerary && (
                  <div className="text-center">
                    <Button 
                      onClick={handleShowItinerary}
                      className="bg-nature hover:bg-nature/90 text-nature-foreground px-8 py-3"
                    >
                      Show Detailed Itinerary
                    </Button>
                  </div>
                )}

                {/* Detailed Itinerary */}
                {showDetailedItinerary && imageAnalysis.suggestedItinerary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Suggested Itinerary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {imageAnalysis.suggestedItinerary.map((day: any, dayIndex: number) => (
                            <div key={dayIndex} className="border rounded-lg p-4">
                              <h4 className="font-medium mb-3 text-primary">Day {day.day}</h4>
                              <div className="space-y-2">
                                {day.activities.map((activity: any, activityIndex: number) => (
                                  <div key={activityIndex} className="flex justify-between items-center p-2 bg-accent/20 rounded">
                                    <div>
                                      <h5 className="font-medium text-sm">{activity.activity}</h5>
                                      <p className="text-xs text-muted-foreground">
                                        Duration: {activity.duration}
                                      </p>
                                    </div>
                                    <Badge variant="outline">
                                      {activity.cost}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {/* Budget Breakdown */}
                      {imageAnalysis.estimatedBudget?.breakdown && (
                        <div className="mt-6 p-4 bg-accent/20 rounded-lg">
                          <h4 className="font-medium mb-3">Budget Breakdown</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>Accommodation:</span>
                              <span>{imageAnalysis.estimatedBudget.breakdown.accommodation}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Food:</span>
                              <span>{imageAnalysis.estimatedBudget.breakdown.food}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Activities:</span>
                              <span>{imageAnalysis.estimatedBudget.breakdown.activities}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transport:</span>
                              <span>{imageAnalysis.estimatedBudget.breakdown.transport}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Error State or Low Confidence */}
            {imageAnalysis && (imageAnalysis.error || imageAnalysis.confidence === 'low') && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertCircle className="w-5 h-5" />
                    {imageAnalysis.error ? "Analysis Failed" : "Uncertain Identification"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {imageAnalysis.error ? (
                    <p className="text-orange-600 dark:text-orange-400">
                      {imageAnalysis.error} Please try uploading a clearer image with more recognizable landmarks or features.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-orange-600 dark:text-orange-400">
                        I'm not very sure about the exact location, but based on what I can see in the image, here are some similar places and general recommendations:
                      </p>
                      
                      {/* Show whatever data we have */}
                      {imageAnalysis.identifiedPlace && (
                        <div>
                          <h4 className="font-medium">Possible Location: {imageAnalysis.identifiedPlace}</h4>
                          {imageAnalysis.description && (
                            <p className="text-sm text-muted-foreground mt-1">{imageAnalysis.description}</p>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Try uploading a photo with more distinctive landmarks, signs, or architectural features for better identification.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlaceIdentifier;