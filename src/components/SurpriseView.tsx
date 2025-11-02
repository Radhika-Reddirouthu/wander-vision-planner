import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  MapPin, 
  Heart, 
  Star, 
  Calendar, 
  DollarSign,
  Sparkles,
  ThumbsUp,
  Clock,
  Utensils,
  Hotel,
  Car,
  Shield,
  Backpack,
  IndianRupee,
  Plane,
  Users,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SurpriseViewProps {
  onBackToMain: () => void;
}

interface Destination {
  name: string;
  location: string;
  image: string;
  matchReason: string;
  seasonalAdvantage: string;
  highlights: string[];
  perfectFor: string;
  estimatedBudget: string;
  personalityMatch: number;
  tags: string[];
}

interface Itinerary {
  destination: string;
  duration: string;
  bestTimeToVisit: string;
  overview: string;
  itinerary: Array<{
    day: number;
    title: string;
    activities: Array<{
      time: string;
      activity: string;
      description: string;
      location: string;
      duration: string;
      cost: string;
    }>;
    hotels?: Array<{
      name: string;
      rating?: string;
      location: string;
      category: string;
      pricePerNight: string;
      amenities?: string[];
      imageUrl?: string;
    }>;
  }>;
  accommodation: {
    type: string;
    suggestions: string[];
    priceRange: string;
  };
  foodExperiences: Array<{
    type: string;
    recommendations: string[];
    avgCost: string;
  }>;
  transportation: {
    howToReach: string;
    localTransport: string;
    estimatedCost: string;
  };
  budgetBreakdown: {
    accommodation: string;
    food: string;
    activities: string;
    transport: string;
    total: string;
  };
  safetyTips: string[];
  packingTips: string[];
  outboundFlights?: Array<{
    airline: string;
    flightNumber: string;
    price: string;
    departure: string;
    departureTime: string;
    arrival: string;
    arrivalTime: string;
    duration: string;
    stops: string;
    availability?: string;
    bookingRecommendation?: string;
  }>;
  returnFlights?: Array<{
    airline: string;
    flightNumber: string;
    price: string;
    departure: string;
    departureTime: string;
    arrival: string;
    arrivalTime: string;
    duration: string;
    stops: string;
    availability?: string;
    bookingRecommendation?: string;
  }>;
  flightOptions?: Array<{
    airline: string;
    flightNumber: string;
    price: string;
    departure: string;
    departureTime: string;
    arrival: string;
    arrivalTime: string;
    duration: string;
    stops: string;
  }>;
  sourceAirport?: string;
  destinationAirport?: string;
  bookingTips?: string[];
}

const SurpriseView: React.FC<SurpriseViewProps> = ({ onBackToMain }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [budget, setBudget] = useState("");
  const [likedDestination, setLikedDestination] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  
  // Trip details form state
  const [showTripDetailsForm, setShowTripDetailsForm] = useState(false);
  const [tripType, setTripType] = useState("leisure");
  const [groupType, setGroupType] = useState("solo");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [stayType, setStayType] = useState("hotel");
  const [needsFlights, setNeedsFlights] = useState(false);
  const [sourceLocation, setSourceLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<{[key: number]: number}>({});
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<number | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<number | null>(null);
  const [sameHotelForAllDays, setSameHotelForAllDays] = useState(false);
  const [globalHotelSelection, setGlobalHotelSelection] = useState<number | null>(null);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSurpriseDestinations();
    }
  }, [user]);

  const fetchSurpriseDestinations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('Fetching surprise destinations for user:', user.id);
      const { data, error } = await supabase.functions.invoke('surprise-destinations', {
        body: { 
          userId: user.id,
          budget: budget || "₹30,000 - ₹80,000"
        }
      });

      if (error) {
        console.error('Surprise destinations error:', error);
        throw error;
      }
      
      console.log('Surprise destinations response:', data);
      setDestinations(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching surprise destinations:', error);
      alert('Error fetching destinations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeDestination = async (destinationName: string) => {
    setLikedDestination(destinationName);
    setIsGeneratingItinerary(true);

    try {
      const { data, error } = await supabase.functions.invoke('surprise-destinations', {
        body: { 
          userId: user?.id,
          budget: budget || "₹30,000 - ₹80,000",
          generateItinerary: true,
          destination: destinationName
        }
      });

      if (error) throw error;
      setItinerary(data.itinerary);
      setShowTripDetailsForm(true); // Show form after itinerary is generated
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const handleTripDetailsSubmit = async () => {
    if (!departDate || !returnDate) {
      alert("Please select travel dates");
      return;
    }
    if (needsFlights && !sourceLocation) {
      alert("Please enter your departure city");
      return;
    }
    
    // Fetch flights if needed
    if (needsFlights && sourceLocation && likedDestination) {
      setIsLoadingFlights(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-flight-suggestions', {
          body: {
            sourceLocation,
            destination: likedDestination,
            departDate,
            returnDate,
            returnLocation: returnLocation || sourceLocation,
            budget: budget || "₹30,000 - ₹80,000",
            groupSize: groupType === "family" || groupType === "friends" ? "4" : "1"
          }
        });
        if (error) throw error;
        
        if (data?.outboundFlights || data?.flightOptions) {
          setItinerary((prev: any) => ({
            ...prev,
            outboundFlights: data.outboundFlights,
            returnFlights: data.returnFlights,
            flightOptions: data.flightOptions,
            sourceAirport: data.sourceAirport,
            destinationAirport: data.destinationAirport,
            bookingTips: data.bookingTips
          }));
        }
      } catch (e) {
        console.error('Flight fetch failed:', e);
      } finally {
        setIsLoadingFlights(false);
      }
    }
    
    setShowTripDetailsForm(false);
  };

  const handleHotelSelection = (dayIndex: number, hotelIndex: number) => {
    if (sameHotelForAllDays) {
      setGlobalHotelSelection(hotelIndex);
      const newSelections: {[key: number]: number} = {};
      itinerary.itinerary?.forEach((_: any, idx: number) => {
        newSelections[idx] = hotelIndex;
      });
      setSelectedHotels(newSelections);
    } else {
      setSelectedHotels(prev => ({
        ...prev,
        [dayIndex]: hotelIndex
      }));
    }
  };

  const allHotelsSelected = () => {
    if (!itinerary?.itinerary) return false;
    const daysWithHotels = itinerary.itinerary.filter((day: any) => day.hotels && day.hotels.length > 0);
    return daysWithHotels.every((_: any, idx: number) => selectedHotels[idx] !== undefined);
  };

  const allFlightsSelected = () => {
    if (!needsFlights) return true;
    const outboundFlights = itinerary?.outboundFlights || itinerary?.flightOptions || [];
    const returnFlights = itinerary?.returnFlights || [];
    return selectedOutboundFlight !== null && 
           (returnFlights.length === 0 || selectedReturnFlight !== null);
  };

  const handleRefreshSuggestions = () => {
    setLikedDestination(null);
    setItinerary(null);
    setShowTripDetailsForm(false);
    fetchSurpriseDestinations();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Button onClick={onBackToMain} variant="outline" className="mb-8">
            ← Back to Home
          </Button>
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Finding Your Perfect Destinations...</h2>
            <p className="text-muted-foreground">Analyzing your preferences to create personalized recommendations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <Button onClick={onBackToMain} variant="outline">
            ← Back to Home
          </Button>
          <Button onClick={handleRefreshSuggestions} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            New Suggestions
          </Button>
        </div>

        {!itinerary ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-adventure bg-clip-text text-transparent mb-4">
                🎲 Surprise Me!
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Personalized destinations based on your travel personality
              </p>
              
              <div className="max-w-md mx-auto mb-8">
                <Label htmlFor="budget" className="text-lg font-semibold mb-4 block">
                  What's your budget range?
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="budget"
                    placeholder="e.g., ₹30,000 - ₹80,000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="text-lg p-4 pl-10"
                  />
                </div>
                <Button 
                  onClick={fetchSurpriseDestinations}
                  className="mt-4 bg-gradient-adventure text-white"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Get Personalized Suggestions
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {destinations.map((destination, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card via-card to-adventure/5">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <CardTitle className="text-2xl text-foreground">{destination.name}</CardTitle>
                        <p className="text-muted-foreground flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {destination.location}
                        </p>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        {destination.personalityMatch}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-adventure" />
                        Why This Matches You
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {destination.matchReason}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-nature" />
                        Perfect Timing
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {destination.seasonalAdvantage}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Highlights</h4>
                      <div className="flex flex-wrap gap-2">
                        {destination.highlights.slice(0, 3).map((highlight, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Perfect for:</span>
                        <span className="text-sm text-adventure font-medium">{destination.perfectFor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Budget:</span>
                        <span className="text-sm font-medium">{destination.estimatedBudget}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {destination.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleLikeDestination(destination.name)}
                      className="w-full bg-gradient-adventure text-white hover:scale-105 transition-all duration-300"
                      disabled={isGeneratingItinerary}
                    >
                      {isGeneratingItinerary && likedDestination === destination.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating Your Itinerary...
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          I Love This Place!
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-adventure bg-clip-text text-transparent mb-2">
                🎉 Your Perfect {itinerary.destination} Adventure!
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {itinerary.duration} personalized itinerary
              </p>
              <Button onClick={() => { setItinerary(null); setShowTripDetailsForm(false); }} variant="outline">
                ← Back to Suggestions
              </Button>
            </div>

            {/* Trip Details Form */}
            {showTripDetailsForm && (
              <Card className="border-primary/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-primary" />
                    Complete Your Trip Details
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Help us customize your journey
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Trip Type */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      What type of trip are you planning?
                    </Label>
                    <RadioGroup value={tripType} onValueChange={setTripType}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="leisure" id="leisure" />
                          <Label htmlFor="leisure" className="cursor-pointer flex-1">Leisure</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="adventure" id="adventure" />
                          <Label htmlFor="adventure" className="cursor-pointer flex-1">Adventure</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="cultural" id="cultural" />
                          <Label htmlFor="cultural" className="cursor-pointer flex-1">Cultural</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="business" id="business" />
                          <Label htmlFor="business" className="cursor-pointer flex-1">Business</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Group Type */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Are you traveling solo or with others?
                    </Label>
                    <RadioGroup value={groupType} onValueChange={setGroupType}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="solo" id="solo" />
                          <Label htmlFor="solo" className="cursor-pointer flex-1 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Solo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="couple" id="couple" />
                          <Label htmlFor="couple" className="cursor-pointer flex-1 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Couple
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="family" id="family" />
                          <Label htmlFor="family" className="cursor-pointer flex-1 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Family
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="friends" id="friends" />
                          <Label htmlFor="friends" className="cursor-pointer flex-1 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Friends
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Travel Dates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departDate" className="text-base font-semibold mb-2 block">
                        Departure Date
                      </Label>
                      <Input
                        id="departDate"
                        type="date"
                        value={departDate}
                        onChange={(e) => setDepartDate(e.target.value)}
                        className="text-lg p-4"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnDate" className="text-base font-semibold mb-2 block">
                        Return Date
                      </Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="text-lg p-4"
                        min={departDate}
                        required
                      />
                    </div>
                  </div>

                  {/* Accommodation Preference */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      What type of accommodation do you prefer?
                    </Label>
                    <RadioGroup value={stayType} onValueChange={setStayType}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="hotel" id="hotel" />
                          <Label htmlFor="hotel" className="cursor-pointer flex-1 flex items-center">
                            <Hotel className="w-4 h-4 mr-2" />
                            Hotel
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="resort" id="resort" />
                          <Label htmlFor="resort" className="cursor-pointer flex-1 flex items-center">
                            <Hotel className="w-4 h-4 mr-2" />
                            Resort
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="hostel" id="hostel" />
                          <Label htmlFor="hostel" className="cursor-pointer flex-1 flex items-center">
                            <Backpack className="w-4 h-4 mr-2" />
                            Hostel
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary cursor-pointer">
                          <RadioGroupItem value="villa" id="villa" />
                          <Label htmlFor="villa" className="cursor-pointer flex-1 flex items-center">
                            <Hotel className="w-4 h-4 mr-2" />
                            Villa/Airbnb
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Flight Booking */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="needsFlights" 
                        checked={needsFlights}
                        onCheckedChange={(checked) => setNeedsFlights(checked === true)}
                      />
                      <Label htmlFor="needsFlights" className="text-base font-semibold cursor-pointer flex items-center">
                        <Plane className="w-4 h-4 mr-2" />
                        I need help with flight booking
                      </Label>
                    </div>
                    
                    {needsFlights && (
                      <>
                        <div>
                          <Label htmlFor="sourceLocation" className="text-sm font-medium mb-2 block">
                            Where are you flying from?
                          </Label>
                          <Input
                            id="sourceLocation"
                            placeholder="e.g., Delhi, Mumbai, Bangalore"
                            value={sourceLocation}
                            onChange={(e) => setSourceLocation(e.target.value)}
                            className="text-lg p-4"
                          />
                        </div>
                        <div>
                          <Label htmlFor="returnLocation" className="text-sm font-medium mb-2 block">
                            Where would you like to return to? (Optional)
                          </Label>
                          <Input
                            id="returnLocation"
                            placeholder="Leave blank to return to departure city"
                            value={returnLocation}
                            onChange={(e) => setReturnLocation(e.target.value)}
                            className="text-lg p-4"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={handleTripDetailsSubmit}
                    disabled={isLoadingFlights}
                    className="w-full bg-gradient-adventure text-white text-lg py-6"
                    size="lg"
                  >
                    {isLoadingFlights ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading flights and hotels...
                      </>
                    ) : (
                      'Continue to Hotel & Flight Selection'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Flight Selection */}
            {!showTripDetailsForm && needsFlights && (itinerary?.outboundFlights || itinerary?.flightOptions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <Plane className="w-6 h-6 mr-2 text-primary" />
                    Select Your Flights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Outbound Flights */}
                  <div>
                    <h4 className="font-semibold mb-4 text-lg">
                      {sourceLocation} → {likedDestination}
                    </h4>
                    <div className="grid gap-4">
                      {(itinerary.outboundFlights || itinerary.flightOptions || []).map((flight: any, index: number) => (
                        <div
                          key={index}
                          onClick={() => setSelectedOutboundFlight(index)}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all",
                            selectedOutboundFlight === index
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-semibold">{flight.airline}</h5>
                              <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">{flight.price}</p>
                              <p className="text-xs text-muted-foreground">per person</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium">{flight.departure}</p>
                              <p className="text-xs text-muted-foreground">{flight.departureTime}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">{flight.duration}</p>
                              <div className="w-full h-px bg-border my-1"></div>
                              <p className="text-xs text-muted-foreground">{flight.stops}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{flight.arrival}</p>
                              <p className="text-xs text-muted-foreground">{flight.arrivalTime}</p>
                            </div>
                          </div>
                          
                          {selectedOutboundFlight === index && (
                            <div className="mt-3 flex items-center justify-center text-primary">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="font-medium">Selected</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return Flights */}
                  {itinerary.returnFlights && itinerary.returnFlights.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4 text-lg">
                        {likedDestination} → {returnLocation || sourceLocation}
                      </h4>
                      <div className="grid gap-4">
                        {itinerary.returnFlights.map((flight: any, index: number) => (
                          <div
                            key={index}
                            onClick={() => setSelectedReturnFlight(index)}
                            className={cn(
                              "p-4 border-2 rounded-lg cursor-pointer transition-all",
                              selectedReturnFlight === index
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold">{flight.airline}</h5>
                                <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{flight.price}</p>
                                <p className="text-xs text-muted-foreground">per person</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm font-medium">{flight.departure}</p>
                                <p className="text-xs text-muted-foreground">{flight.departureTime}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">{flight.duration}</p>
                                <div className="w-full h-px bg-border my-1"></div>
                                <p className="text-xs text-muted-foreground">{flight.stops}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{flight.arrival}</p>
                                <p className="text-xs text-muted-foreground">{flight.arrivalTime}</p>
                              </div>
                            </div>
                            
                            {selectedReturnFlight === index && (
                              <div className="mt-3 flex items-center justify-center text-primary">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                <span className="font-medium">Selected</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Overview and Itinerary - Only show after form is submitted */}
            {!showTripDetailsForm && (
              <>
                {/* Overview */}
                <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-adventure" />
                  Trip Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-muted-foreground mb-4">{itinerary.overview}</p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">Best Time: {itinerary.bestTimeToVisit}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Budget: {itinerary.budgetBreakdown.total}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Budget Breakdown</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Accommodation:</span>
                          <span>{itinerary.budgetBreakdown.accommodation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Food:</span>
                          <span>{itinerary.budgetBreakdown.food}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Activities:</span>
                          <span>{itinerary.budgetBreakdown.activities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transport:</span>
                          <span>{itinerary.budgetBreakdown.transport}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Itinerary */}
            <div className="space-y-6">
              {/* Same Hotel Checkbox */}
              {itinerary.itinerary && itinerary.itinerary.length > 0 && itinerary.itinerary[0].hotels && (
                <Card className="border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sameHotel" 
                        checked={sameHotelForAllDays}
                        onCheckedChange={(checked) => {
                          setSameHotelForAllDays(checked === true);
                          if (!checked) {
                            setGlobalHotelSelection(null);
                          } else if (globalHotelSelection !== null) {
                            const newSelections: {[key: number]: number} = {};
                            itinerary.itinerary?.forEach((_: any, idx: number) => {
                              newSelections[idx] = globalHotelSelection;
                            });
                            setSelectedHotels(newSelections);
                          }
                        }}
                      />
                      <Label htmlFor="sameHotel" className="text-sm font-medium cursor-pointer">
                        Use the same hotel for all days
                      </Label>
                    </div>
                    {sameHotelForAllDays && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Select a hotel below and it will be applied to all days of your trip
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {itinerary.itinerary.map((day, dayIndex) => (
                <Card key={day.day}>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Day {day.day}: {day.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex items-start space-x-4 p-4 bg-accent/20 rounded-lg">
                          <div className="text-sm font-medium text-primary min-w-[80px]">
                            {activity.time}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{activity.activity}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {activity.location}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {activity.duration}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.cost}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hotel Selection */}
                    {day.hotels && day.hotels.length > 0 && (!sameHotelForAllDays || dayIndex === 0) && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-4 flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          {sameHotelForAllDays ? 'Select Your Stay for All Days' : `Select Your Stay for Day ${day.day}`}
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          {day.hotels.map((hotel: any, hotelIndex: number) => (
                            <div
                              key={hotelIndex}
                              onClick={() => handleHotelSelection(dayIndex, hotelIndex)}
                              className={cn(
                                "p-3 border-2 rounded-lg cursor-pointer transition-all",
                                selectedHotels[dayIndex] === hotelIndex
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              {hotel.imageUrl && (
                                <img
                                  src={hotel.imageUrl}
                                  alt={hotel.name}
                                  className="w-full h-32 object-cover rounded-md mb-3"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <h5 className="font-semibold text-sm mb-1">{hotel.name}</h5>
                              {hotel.rating && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">{hotel.rating}</span>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mb-2">{hotel.location}</p>
                              {hotel.amenities && hotel.amenities.length > 0 && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {hotel.amenities.slice(0, 3).join(' • ')}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">{hotel.category}</Badge>
                                <span className="text-xs font-semibold">{hotel.pricePerNight}/night</span>
                              </div>
                              {selectedHotels[dayIndex] === hotelIndex && (
                                <div className="mt-2 flex items-center justify-center text-primary text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Selected
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Hotel className="w-5 h-5 mr-2" />
                    Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Type: {itinerary.accommodation.type}
                  </p>
                  <p className="text-sm font-medium mb-2">
                    Price Range: {itinerary.accommodation.priceRange}
                  </p>
                  <div className="space-y-1">
                    {itinerary.accommodation.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Utensils className="w-5 h-5 mr-2" />
                    Food Experiences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itinerary.foodExperiences.map((food, index) => (
                    <div key={index}>
                      <p className="font-medium text-sm">{food.type} - {food.avgCost}</p>
                      <div className="space-y-1">
                        {food.recommendations.map((rec, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    Transportation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm">How to Reach:</p>
                      <p className="text-sm text-muted-foreground">{itinerary.transportation.howToReach}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Local Transport:</p>
                      <p className="text-sm text-muted-foreground">{itinerary.transportation.localTransport}</p>
                    </div>
                    <p className="text-sm font-medium">
                      Estimated Cost: {itinerary.transportation.estimatedCost}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Important Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-sm mb-2">Safety Tips:</p>
                      <div className="space-y-1">
                        {itinerary.safetyTips.map((tip, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center">
                        <Backpack className="w-4 h-4 mr-1" />
                        Packing Tips:
                      </p>
                      <div className="space-y-1">
                        {itinerary.packingTips.map((tip, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Proceed to Payment Button */}
            {allHotelsSelected() && allFlightsSelected() && (
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardContent className="text-center py-6">
                  <Button 
                    onClick={() => {
                      // Calculate actual costs
                      let flightCost = 0;
                      const outboundFlights = itinerary.outboundFlights || itinerary.flightOptions || [];
                      const returnFlights = itinerary.returnFlights || [];
                      
                      if (selectedOutboundFlight !== null && outboundFlights[selectedOutboundFlight]) {
                        const priceStr = outboundFlights[selectedOutboundFlight].price.replace(/[₹,]/g, '');
                        flightCost += parseInt(priceStr) || 0;
                      }
                      if (selectedReturnFlight !== null && returnFlights[selectedReturnFlight]) {
                        const priceStr = returnFlights[selectedReturnFlight].price.replace(/[₹,]/g, '');
                        flightCost += parseInt(priceStr) || 0;
                      }
                      
                      // Calculate hotel costs
                      let hotelCost = 0;
                      itinerary.itinerary?.forEach((day: any, dayIndex: number) => {
                        const selectedHotelIndex = selectedHotels[dayIndex];
                        if (selectedHotelIndex !== undefined && day.hotels?.[selectedHotelIndex]) {
                          const selectedHotel = day.hotels[selectedHotelIndex];
                          if (selectedHotel.pricePerNight) {
                            const priceStr = selectedHotel.pricePerNight.replace(/[₹,]/g, '').replace(/\/night/g, '').trim();
                            const priceValue = parseInt(priceStr) || 0;
                            hotelCost += priceValue;
                          }
                        }
                      });
                      
                      // Get activities and food cost from budget breakdown
                      const activitiesCost = parseInt(itinerary.budgetBreakdown.activities?.replace(/[₹,]/g, '') || '0');
                      const foodCost = parseInt(itinerary.budgetBreakdown.food?.replace(/[₹,]/g, '') || '0');
                      const transportCost = parseInt(itinerary.budgetBreakdown.transport?.replace(/[₹,]/g, '') || '0');
                      
                      const totalActivitiesCost = activitiesCost + foodCost + transportCost;
                      
                      // Navigate with query parameters (not state)
                      const params = new URLSearchParams({
                        destination: itinerary.destination,
                        flightCost: flightCost.toString(),
                        hotelCost: hotelCost.toString(),
                        activitiesCost: totalActivitiesCost.toString()
                      });
                      
                      navigate(`/payment?${params.toString()}`);
                    }}
                    className="bg-gradient-adventure text-white text-lg py-6 px-12"
                    size="lg"
                  >
                    <IndianRupee className="w-5 h-5 mr-2" />
                    Proceed to Payment
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Review your selections and proceed to secure payment
                  </p>
                </CardContent>
              </Card>
            )}
            
            {(!allHotelsSelected() || !allFlightsSelected()) && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <CardContent className="text-center py-6">
                  <p className="text-orange-700 dark:text-orange-300 font-medium mb-2">
                    Please complete your selections to proceed
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {!allHotelsSelected() && "Select hotels for all days"}
                    {!allHotelsSelected() && !allFlightsSelected() && " • "}
                    {!allFlightsSelected() && "Select your flights"}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurpriseView;