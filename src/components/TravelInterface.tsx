import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Users, 
  User, 
  Camera, 
  Sparkles, 
  Calendar,
  Plane,
  Mountain,
  Briefcase,
  Upload,
  Mail
} from "lucide-react";
import heroImage from "@/assets/hero-travel.jpg";
import ChatBot from "./ChatBot";

const TravelInterface = () => {
  const [tripType, setTripType] = useState("");
  const [groupType, setGroupType] = useState("");
  const [currentView, setCurrentView] = useState("main");
  const [emails, setEmails] = useState([""]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-sunset bg-clip-text text-transparent">
              Wanderlust Awaits
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-white/90">
              Discover your perfect adventure with personalized travel experiences
            </p>
          </div>
        </div>

        {/* Main Options */}
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Your Trip */}
            <Card className="group cursor-pointer hover:shadow-ocean transition-all duration-500 hover:scale-105 bg-gradient-to-br from-card via-card to-accent/5">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-elegant">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Plan Your Trip</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Choose your destination, trip type, and get personalized itineraries with perfect timing recommendations
                </p>
                <Button 
                  onClick={() => setCurrentView("plan")}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 py-3"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Surprise Me */}
            <Card className="group cursor-pointer hover:shadow-adventure transition-all duration-500 hover:scale-105 bg-gradient-to-br from-card via-card to-adventure/5">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-adventure rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-elegant">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Surprise Me</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Get seasonal recommendations based on your budget and preferences for unexpected adventures
                </p>
                <Button 
                  onClick={() => setCurrentView("surprise")}
                  className="w-full bg-adventure hover:bg-adventure/90 text-adventure-foreground transition-all duration-300 py-3"
                >
                  Discover
                </Button>
              </CardContent>
            </Card>

            {/* Identify Place */}
            <Card className="group cursor-pointer hover:shadow-nature transition-all duration-500 hover:scale-105 bg-gradient-to-br from-card via-card to-nature/5">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-nature rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-elegant">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Identify Place</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Upload an image and discover comprehensive travel information about that location
                </p>
                <Button 
                  onClick={() => setCurrentView("identify")}
                  className="w-full bg-nature hover:bg-nature/90 text-nature-foreground transition-all duration-300 py-3"
                >
                  Upload Photo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <ChatBot />
      </div>
    );
  }

  if (currentView === "plan") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Button 
            onClick={() => setCurrentView("main")}
            variant="outline" 
            className="mb-8"
          >
            ← Back to Home
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center bg-gradient-ocean bg-clip-text text-transparent">
                Plan Your Perfect Trip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Trip Type Selection */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">What type of trip are you planning?</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    variant={tripType === "leisure" ? "default" : "outline"}
                    onClick={() => setTripType("leisure")}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                  >
                    <Plane className="w-6 h-6" />
                    <span>Leisure</span>
                  </Button>
                  <Button
                    variant={tripType === "explore" ? "default" : "outline"}
                    onClick={() => setTripType("explore")}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                  >
                    <Mountain className="w-6 h-6" />
                    <span>Explore</span>
                  </Button>
                  <Button
                    variant={tripType === "workation" ? "default" : "outline"}
                    onClick={() => setTripType("workation")}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                  >
                    <Briefcase className="w-6 h-6" />
                    <span>Workation</span>
                  </Button>
                </div>
              </div>

              {tripType && (
                <>
                  {/* Group Type Selection */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Are you traveling solo or in a group?</Label>
                    <RadioGroup value={groupType} onValueChange={setGroupType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="solo" id="solo" />
                        <Label htmlFor="solo" className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Solo Trip</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="group" id="group" />
                        <Label htmlFor="group" className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Group Trip</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Destination Input */}
                  <div>
                    <Label htmlFor="destination" className="text-lg font-semibold mb-4 block">
                      Where would you like to go?
                    </Label>
                    <Input 
                      id="destination" 
                      placeholder="Enter your desired destination..." 
                      className="text-lg p-4"
                    />
                  </div>

                  {/* Group Email Collection */}
                  {groupType === "group" && (
                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Group Member Email Addresses</Label>
                      <div className="space-y-3">
                        {emails.map((email, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <Input
                              placeholder={`Email ${index + 1}`}
                              value={email}
                              onChange={(e) => updateEmail(index, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        ))}
                        <Button 
                          onClick={addEmailField}
                          variant="outline"
                          className="w-full"
                        >
                          + Add Another Email
                        </Button>
                      </div>
                      <div className="mt-4 p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-secondary-foreground">
                          📧 We'll send a Google Form to all group members to collect their preferences for accommodations, activities, and travel style.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Solo Trip Form Link */}
                  {groupType === "solo" && (
                    <div className="p-6 bg-gradient-ocean rounded-lg text-white">
                      <h4 className="font-semibold mb-2">Personalize Your Solo Adventure</h4>
                      <p className="mb-4 text-white/90">
                        Complete our personality quiz to get a customized itinerary and accommodation recommendations.
                      </p>
                      <Button 
                        variant="secondary"
                        className="bg-white text-primary hover:bg-white/90"
                      >
                        Take Personality Quiz →
                      </Button>
                    </div>
                  )}

                  {/* Timing Recommendation Section */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
                    <h4 className="font-semibold mb-2 text-primary">📅 Best Time to Visit Recommendations</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Based on your destination, we'll analyze seasonal patterns, events, and your calendar to suggest optimal travel dates.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-card rounded border">
                        <span className="font-medium text-nature">🌸 Peak Season:</span>
                        <p className="text-muted-foreground">Best weather, higher prices</p>
                      </div>
                      <div className="p-3 bg-card rounded border">
                        <span className="font-medium text-adventure">🍂 Off-Peak:</span>
                        <p className="text-muted-foreground">Lower prices, fewer crowds</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-ocean text-white text-lg py-4">
                    Create My Itinerary with Perfect Timing
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <ChatBot />
      </div>
    );
  }

  if (currentView === "surprise") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Button 
            onClick={() => setCurrentView("main")}
            variant="outline" 
            className="mb-8"
          >
            ← Back to Home
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center bg-gradient-adventure bg-clip-text text-transparent">
                Surprise Me with Amazing Destinations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <Label htmlFor="budget" className="text-lg font-semibold mb-4 block">
                    What's your budget range?
                  </Label>
                  <Input 
                    id="budget" 
                    placeholder="e.g., $2000 - $5000" 
                    className="text-lg p-4"
                  />
                </div>
                <div>
                  <Label htmlFor="season" className="text-lg font-semibold mb-4 block">
                    Preferred season?
                  </Label>
                  <Input 
                    id="season" 
                    placeholder="e.g., Summer, Winter, Any" 
                    className="text-lg p-4"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preferences" className="text-lg font-semibold mb-4 block">
                  Any specific preferences? (Optional)
                </Label>
                <Textarea 
                  id="preferences"
                  placeholder="Beach, mountains, culture, adventure, food, etc."
                  className="min-h-24"
                />
              </div>

              <Button className="w-full bg-gradient-adventure text-white text-lg py-4">
                🎲 Surprise Me with Destinations!
              </Button>

              {/* Sample Results */}
              <div className="mt-8 p-6 border rounded-lg bg-muted/30">
                <h4 className="font-semibold mb-4 text-adventure">🌟 Sample Seasonal Recommendations</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-card rounded border">
                    <Badge className="mb-2 bg-nature text-nature-foreground">Spring Perfect</Badge>
                    <h5 className="font-medium">Japan Cherry Blossom Tour</h5>
                    <p className="text-sm text-muted-foreground">Tokyo, Kyoto, Osaka • 10 days</p>
                  </div>
                  <div className="p-4 bg-card rounded border">
                    <Badge className="mb-2 bg-adventure text-adventure-foreground">Summer Vibes</Badge>
                    <h5 className="font-medium">Greek Island Hopping</h5>
                    <p className="text-sm text-muted-foreground">Santorini, Mykonos • 8 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <ChatBot />
      </div>
    );
  }

  if (currentView === "identify") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Button 
            onClick={() => setCurrentView("main")}
            variant="outline" 
            className="mb-8"
          >
            ← Back to Home
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center bg-gradient-nature bg-clip-text text-transparent">
                Identify Your Dream Destination
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Upload a photo and let AI discover travel information about that place
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                {uploadedImage ? (
                  <div className="space-y-4">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded destination" 
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <Button 
                      onClick={() => setUploadedImage(null)}
                      variant="outline"
                    >
                      Upload Different Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div>
                      <Label htmlFor="image-upload" className="text-lg font-semibold cursor-pointer">
                        Click to upload or drag and drop
                      </Label>
                      <p className="text-muted-foreground">PNG, JPG up to 10MB</p>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {uploadedImage && (
                <>
                  <Button className="w-full bg-gradient-nature text-white text-lg py-4">
                    🔍 Identify This Place with AI
                  </Button>

                  {/* Sample AI Results */}
                  <div className="mt-8 p-6 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-4 text-nature">🤖 AI Analysis Results</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-card rounded border">
                        <h5 className="font-medium text-nature">📍 Location Identified</h5>
                        <p className="text-sm">Santorini, Greece - Oia Village</p>
                      </div>
                      <div className="p-4 bg-card rounded border">
                        <h5 className="font-medium text-adventure">💰 Estimated Budget</h5>
                        <p className="text-sm">$3,500 - $5,000 for 7 days (luxury experience)</p>
                      </div>
                      <div className="p-4 bg-card rounded border">
                        <h5 className="font-medium text-primary">📅 Best Time to Visit</h5>
                        <p className="text-sm">April-June, September-October</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <ChatBot />
      </div>
    );
  }

  return null;
};

export default TravelInterface;