import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Users, 
  User, 
  Camera, 
  Sparkles, 
  CalendarIcon,
  Plane,
  Mountain,
  Briefcase,
  Upload,
  Mail,
  IndianRupee,
  Clock,
  Star,
  MapPin as LocationPin,
  Utensils,
  Calendar as CalendarDays,
  Thermometer,
  Info,
  Plus,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import heroImage from "@/assets/hero-travel.jpg";
import ChatBot from "./ChatBot";
import PollingView from "./PollingView";
import SurpriseView from "./SurpriseView";
import PlaceIdentifier from "./PlaceIdentifier";
import PollSuccess from "./PollSuccess";
import { useAuth } from "@/hooks/useAuth";

const TravelInterface = () => {
  const { user } = useAuth();
  const [tripType, setTripType] = useState("");
  const [groupType, setGroupType] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [currentView, setCurrentView] = useState<'main' | 'plan' | 'chat' | 'itinerary' | 'polling' | 'poll-success' | 'surprise' | 'identify'>('main');
  const [emails, setEmails] = useState([""]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [departDate, setDepartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [budget, setBudget] = useState("");
  const [needsFlights, setNeedsFlights] = useState(false);
  const [destination, setDestination] = useState("");
  const [destinationInfo, setDestinationInfo] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any>(null);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [isLoadingImageAnalysis, setIsLoadingImageAnalysis] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [enableGroupPolling, setEnableGroupPolling] = useState(false);
  const [pollId, setPollId] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<any>(null);
  const [pollData, setPollData] = useState<any>(null); // Store poll creation response
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [sourceLocation, setSourceLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [flightSuggestions, setFlightSuggestions] = useState<any>(null);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [stayType, setStayType] = useState("");
  const [customStay, setCustomStay] = useState("");
  const [specificPlaces, setSpecificPlaces] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<{[key: number]: number}>({});
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<number | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<number | null>(null);

  // Load user's saved trip data and check for active polls on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setIsLoadingUserData(true);
      try {
        // Load user profile with saved data
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('draft_trip_data, active_poll_id, last_planning_step')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading user data:', error);
          return;
        }

        // Restore saved trip planning data
        if (profile?.draft_trip_data) {
          const savedData = profile.draft_trip_data as any;
          setTripType(savedData.tripType || "");
          setGroupType(savedData.groupType || "");
          setGroupSize(savedData.groupSize || "");
          setDestination(savedData.destination || "");
          setBudget(savedData.budget || "");
          setNeedsFlights(savedData.needsFlights || false);
          setSourceLocation(savedData.sourceLocation || "");
          setReturnLocation(savedData.returnLocation || "");
          setEnableGroupPolling(savedData.enableGroupPolling || false);
          setEmails(savedData.emails || [""]);
          setStayType(savedData.stayType || "");
          setCustomStay(savedData.customStay || "");
          setSpecificPlaces(savedData.specificPlaces || "");
          
          // Restore dates
          if (savedData.departDate) setDepartDate(new Date(savedData.departDate));
          if (savedData.returnDate) setReturnDate(new Date(savedData.returnDate));
          
          // Set current view based on last step (ensure it matches the union type)
          // Don't restore 'itinerary' view if there's no itinerary data
          if (profile.last_planning_step && 
              profile.last_planning_step !== 'itinerary' &&
              ['main', 'plan', 'chat', 'itinerary', 'polling', 'poll-success', 'surprise', 'identify'].includes(profile.last_planning_step)) {
            setCurrentView(profile.last_planning_step as 'main' | 'plan' | 'chat' | 'itinerary' | 'polling' | 'poll-success' | 'surprise' | 'identify');
          } else if (savedData.tripType) {
            setCurrentView("plan");
          }
        }

        // Check for active poll
        if (profile?.active_poll_id) {
          setPollId(profile.active_poll_id);
          setCurrentView("polling");
        }

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadUserData();
  }, [user]);

  // Save trip data automatically when form values change
  useEffect(() => {
    const saveTripData = async () => {
      if (!user || isLoadingUserData) return;

      const tripData = {
        tripType,
        groupType,
        groupSize,
        destination,
        departDate: departDate?.toISOString(),
        returnDate: returnDate?.toISOString(),
        budget,
        needsFlights,
        sourceLocation,
        enableGroupPolling,
        emails,
        stayType,
        specificPlaces
      };

      // Only save if there's meaningful data
      if (tripType || destination || budget) {
        try {
          await supabase
            .from('user_profiles')
            .update({ 
              draft_trip_data: tripData,
              last_planning_step: currentView === "main" ? "plan" : currentView
            })
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Error saving trip data:', error);
        }
      }
    };

    const timeoutId = setTimeout(saveTripData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [user, tripType, groupType, groupSize, destination, departDate, returnDate, budget, needsFlights, sourceLocation, enableGroupPolling, emails, currentView, isLoadingUserData, stayType, specificPlaces]);

  // Clear flight data when key inputs change
  useEffect(() => {
    if (itinerary) {
      console.log('Clearing flight data due to input changes');
      setItinerary((prev: any) => {
        if (!prev) return prev;
        const { outboundFlights, returnFlights, flightOptions, sourceAirport, destinationAirport, ...rest } = prev;
        return rest;
      });
      setSelectedOutboundFlight(null);
      setSelectedReturnFlight(null);
    }
  }, [sourceLocation, destination, departDate, returnDate]);

  // Fetch flight suggestions immediately when itinerary loads
  useEffect(() => {
    const fetchFlightsIfNeeded = async () => {
      // Check if we need flights and don't have them yet
      if (!itinerary || (itinerary.outboundFlights || itinerary.flightOptions) || !needsFlights || !sourceLocation || !destination || !departDate || !returnDate) return;
      
      console.log('Fetching flight suggestions before showing itinerary...');
      setIsLoadingFlights(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-flight-suggestions', {
          body: {
            sourceLocation,
            destination,
            departDate: format(departDate, 'yyyy-MM-dd'),
            returnDate: format(returnDate, 'yyyy-MM-dd'),
            budget,
            groupSize: (groupType === "family" || groupType === "friends") ? groupSize : "1"
          }
        });
        if (error) throw error;
        
        if (data?.outboundFlights || data?.flightOptions) {
          setItinerary((prev: any) => ({
            ...(prev || {}),
            outboundFlights: data.outboundFlights,
            returnFlights: data.returnFlights,
            flightOptions: data.flightOptions,
            sourceAirport: data.sourceAirport,
            destinationAirport: data.destinationAirport,
            bookingTips: data.bookingTips,
            bestTimeToBook: data.bestTimeToBook,
            priceComparison: data.priceComparison
          }));
        }
      } catch (e) {
        console.error('Client flight fetch failed:', e);
      } finally {
        setIsLoadingFlights(false);
      }
    };
    fetchFlightsIfNeeded();
  }, [itinerary, needsFlights, sourceLocation, destination, departDate, returnDate, budget, groupType, groupSize]);

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const onProceedToItinerary = async (pollResults: any) => {
    if (!pollResults || !user) return;
    
    setPollResults(pollResults);
    setIsLoadingItinerary(true);
    
    try {
      // Generate itinerary with poll results
      const { data, error } = await supabase.functions.invoke('create-itinerary', {
        body: {
          destination,
          tripType,
          groupType,
          groupSize: (groupType === "family" || groupType === "friends") ? groupSize : "1",
          departDate: departDate ? format(departDate, 'yyyy-MM-dd') : '',
          returnDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : '',
          budget,
          needsFlights,
          sourceLocation: needsFlights ? sourceLocation : "",
          returnLocation: needsFlights ? returnLocation : "",
          pollResults: pollResults,
          stayType,
          customStay,
          specificPlaces
        }
      });
      
      if (error) throw error;
      
      // Clear active poll ID and update last step
      await supabase
        .from('user_profiles')
        .update({ 
          active_poll_id: null,
          last_planning_step: "itinerary"
        })
        .eq('user_id', user.id);
      
      setItinerary(data);
      setCurrentView('itinerary');
    } catch (error) {
      console.error('Error creating itinerary:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Error creating itinerary. Please try again.';
      const errorString = error.message || JSON.stringify(error);
      
      if (errorString.includes('quota') || errorString.includes('rate limit')) {
        errorMessage = 'API quota exceeded. Please try again later or contact support to upgrade your plan.';
      } else if (errorString.includes('network') || errorString.includes('timeout')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorString.includes('invalid') || errorString.includes('validation')) {
        errorMessage = 'Please check your travel details and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoadingItinerary(false);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target?.result as string;
        setUploadedImage(imageBase64);
        
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

  // Fetch destination info - REMOVED for simplified interface

  const clearTripData = async () => {
    if (!user) return;
    
    // Reset all form state
    setTripType("");
    setGroupType("");
    setGroupSize("");
    setDestination("");
    setDepartDate(undefined);
    setReturnDate(undefined);
    setBudget("");
    setNeedsFlights(false);
    setSourceLocation("");
    setReturnLocation("");
    setFlightSuggestions(null);
    setEnableGroupPolling(false);
    setEmails([""]);
    setDestinationInfo(null);
    setItinerary(null);
    setPollId(null);
    setPollResults(null);
    setStayType("");
    setCustomStay("");
    setSpecificPlaces("");
    setSelectedHotels({});
    setSelectedOutboundFlight(null);
    setSelectedReturnFlight(null);
    // Stay in planning view instead of going to main
    // setCurrentView("main"); - removed this line

    // Clear saved data from database
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          draft_trip_data: null,
          active_poll_id: null,
          last_planning_step: "plan"
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error clearing trip data:', error);
    }
  };

  const handleCreateItinerary = async () => {
    if (!destination || !tripType || !groupType || !departDate || !returnDate || !budget) {
      alert('Please fill in all required fields');
      return;
    }

    if ((groupType === "family" || groupType === "friends") && !groupSize) {
      alert('Please specify the number of people in your group');
      return;
    }

    setIsLoadingItinerary(true);
    try {
      // If group polling is enabled, create a poll first
      if ((groupType === "family" || groupType === "friends") && enableGroupPolling) {
        const validEmails = emails.filter(email => email.trim() !== "");
        if (validEmails.length === 0) {
          alert("Please provide at least one group member email for polling");
          setIsLoadingItinerary(false);
          return;
        }

        if (!user?.email) {
          alert("You must be logged in to create a group poll");
          setIsLoadingItinerary(false);
          return;
        }

        const { data: pollData, error: pollError } = await supabase.functions.invoke('create-group-poll', {
          body: {
            destination,
            tripType,
            groupType,
            groupSize,
            departDate: format(departDate, 'yyyy-MM-dd'),
            returnDate: format(returnDate, 'yyyy-MM-dd'),
            budget,
            needsFlights,
            organizerEmail: user.email,
            memberEmails: validEmails
          }
        });

        if (pollError) throw pollError;
        
        // Store poll data for the success screen
        setPollData(pollData);
        
        // Save active poll ID to user profile
        await supabase
          .from('user_profiles')
          .update({ 
            active_poll_id: pollData.pollId,
            last_planning_step: "polling"
          })
          .eq('user_id', user.id);
        
        setPollId(pollData.pollId);
        setCurrentView("polling");
        return;
      }

      // Regular itinerary creation
      const { data, error } = await supabase.functions.invoke('create-itinerary', {
        body: {
          destination,
          tripType,
          groupType,
          groupSize: (groupType === "family" || groupType === "friends") ? groupSize : "1",
          departDate: format(departDate, 'yyyy-MM-dd'),
          returnDate: format(returnDate, 'yyyy-MM-dd'),
          budget: budget || "₹50,000", // Provide default budget if empty
          needsFlights,
          sourceLocation: needsFlights ? sourceLocation : "",
          returnLocation: needsFlights ? returnLocation : "",
          pollResults: pollResults, // Include poll results if available
          stayType,
          customStay,
          specificPlaces
        }
      });
      
      if (error) throw error;
      
      // Clear active poll ID and update last step
      await supabase
        .from('user_profiles')
        .update({ 
          active_poll_id: null,
          last_planning_step: "itinerary"
        })
        .eq('user_id', user.id);
      
      setItinerary(data);
      setCurrentView('itinerary');
    } catch (error) {
      console.error('Error creating itinerary:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Error creating itinerary. Please try again.';
      const errorString = error.message || JSON.stringify(error);
      
      if (errorString.includes('quota') || errorString.includes('rate limit')) {
        errorMessage = 'API quota exceeded. Please try again later or contact support to upgrade your plan.';
      } else if (errorString.includes('network') || errorString.includes('timeout')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorString.includes('invalid') || errorString.includes('validation')) {
        errorMessage = 'Please check your travel details and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoadingItinerary(false);
    }
  };

  const handleHotelSelection = (dayIndex: number, hotelIndex: number) => {
    setSelectedHotels(prev => ({
      ...prev,
      [dayIndex]: hotelIndex
    }));
  };

  const allHotelsSelected = () => {
    if (!itinerary?.itinerary) return false;
    const numberOfDays = itinerary.itinerary.length;
    return Object.keys(selectedHotels).length === numberOfDays;
  };

  // Show loading state while user data is loading
  if (isLoadingUserData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your travel data...</p>
        </div>
      </div>
    );
  }

  // Main view
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
              Discover Your Perfect Journey
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-white/90">
              AI-powered travel planning with real-time weather insights and perfect timing recommendations
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
                <h3 className="text-2xl font-bold mb-4 text-foreground">Smart Trip Planner</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Get AI-powered itineraries with real-time weather analysis, safety checks, and perfect timing recommendations for your chosen destination
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
                <h3 className="text-2xl font-bold mb-4 text-foreground">Seasonal Surprises</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Let AI discover amazing destinations based on current weather patterns, seasonal events, and your budget preferences
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
                <h3 className="text-2xl font-bold mb-4 text-foreground">AI Place Detective</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Upload any photo and instantly get detailed travel insights, safety updates, and perfect timing advice for that location
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

  // Plan Your Trip view
  if (currentView === "plan") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <Button 
              onClick={() => setCurrentView("main")}
              variant="outline" 
            >
              ← Back to Home
            </Button>
            <Button 
              onClick={clearTripData}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🗑️ Start Fresh
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center bg-gradient-ocean bg-clip-text text-transparent">
                Create Your Dream Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Trip Type Selection */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">What type of trip are you planning?</Label>
                <RadioGroup value={tripType} onValueChange={setTripType}>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="leisure" id="leisure" />
                      <Label htmlFor="leisure" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Plane className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium">Leisure</div>
                          <div className="text-sm text-muted-foreground">Relaxation & sightseeing</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="explore" id="explore" />
                      <Label htmlFor="explore" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Mountain className="w-5 h-5 text-adventure" />
                        <div>
                          <div className="font-medium">Explore</div>
                          <div className="text-sm text-muted-foreground">Adventure & discovery</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="workation" id="workation" />
                      <Label htmlFor="workation" className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Briefcase className="w-5 h-5 text-nature" />
                        <div>
                          <div className="font-medium">Workation</div>
                          <div className="text-sm text-muted-foreground">Work & travel balance</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {tripType && (
                <>
                  {/* Group Type Selection */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Are you traveling solo or with others?</Label>
                    <RadioGroup value={groupType} onValueChange={setGroupType}>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="solo" id="solo" />
                          <Label htmlFor="solo" className="flex items-center space-x-2 cursor-pointer flex-1">
                            <User className="w-5 h-5 text-primary" />
                            <div>
                              <div className="font-medium">Solo</div>
                              <div className="text-sm text-muted-foreground">Travel independently</div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="family" id="family" />
                          <Label htmlFor="family" className="flex items-center space-x-2 cursor-pointer flex-1">
                            <Users className="w-5 h-5 text-adventure" />
                            <div>
                              <div className="font-medium">With Family</div>
                              <div className="text-sm text-muted-foreground">Family vacation</div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="friends" id="friends" />
                          <Label htmlFor="friends" className="flex items-center space-x-2 cursor-pointer flex-1">
                            <Users className="w-5 h-5 text-nature" />
                            <div>
                              <div className="font-medium">With Friends</div>
                              <div className="text-sm text-muted-foreground">Friends trip</div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Group Size Input - only show when family or friends is selected */}
                  {(groupType === "family" || groupType === "friends") && (
                    <div>
                      <Label htmlFor="groupSize" className="text-lg font-semibold mb-4 block">
                        How many people in your group?
                      </Label>
                      <Input 
                        id="groupSize" 
                        type="number"
                        min="2"
                        max="20"
                        placeholder="Enter number of people..." 
                        value={groupSize}
                        onChange={(e) => setGroupSize(e.target.value)}
                        className="text-lg p-4"
                      />
                    </div>
                  )}

                  {/* Destination Input */}
                  <div>
                    <Label htmlFor="destination" className="text-lg font-semibold mb-4 block">
                      Where would you like to go?
                    </Label>
                    <Input 
                      id="destination" 
                      placeholder="Enter your desired destination..." 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="text-lg p-4"
                    />
                     
                     {destination.length > 2 && !departDate && !returnDate && (
                        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center space-x-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">Select travel dates to continue</span>
                        </div>
                      )}
                   </div>

                  {/* Travel Dates */}
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Travel Dates</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="depart-date" className="text-sm font-medium mb-2 block">Departure Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal p-4",
                                !departDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {departDate ? format(departDate, "PPP") : "Select departure date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={departDate}
                              onSelect={setDepartDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="return-date" className="text-sm font-medium mb-2 block">Return Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal p-4",
                                !returnDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {returnDate ? format(returnDate, "PPP") : "Select return date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={returnDate}
                              onSelect={setReturnDate}
                              disabled={(date) => date < new Date() || (departDate && date < departDate)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                   </div>
                 </div>

                   {/* Stay Type Selection */}
                   <div>
                     <Label htmlFor="stayType" className="text-lg font-semibold mb-4 block">
                       What type of accommodation do you prefer?
                     </Label>
                     <RadioGroup value={stayType} onValueChange={setStayType}>
                       <div className="grid md:grid-cols-3 gap-4">
                         <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                           <RadioGroupItem value="hostel" id="hostel" />
                           <Label htmlFor="hostel" className="flex items-center space-x-2 cursor-pointer flex-1">
                             <div>
                               <div className="font-medium">Hostel</div>
                               <div className="text-sm text-muted-foreground">Budget-friendly</div>
                             </div>
                           </Label>
                         </div>
                         <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                           <RadioGroupItem value="3-star" id="3-star" />
                           <Label htmlFor="3-star" className="flex items-center space-x-2 cursor-pointer flex-1">
                             <div>
                               <div className="font-medium">3 Star Hotel</div>
                               <div className="text-sm text-muted-foreground">Comfortable stay</div>
                             </div>
                           </Label>
                         </div>
                         <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                           <RadioGroupItem value="5-star" id="5-star" />
                           <Label htmlFor="5-star" className="flex items-center space-x-2 cursor-pointer flex-1">
                             <div>
                               <div className="font-medium">5 Star Hotel</div>
                               <div className="text-sm text-muted-foreground">Luxury experience</div>
                             </div>
                           </Label>
                         </div>
                       </div>
                     </RadioGroup>
                     
                     {/* Custom Stay Input */}
                     <div className="mt-4">
                       <Label htmlFor="customStay" className="text-sm font-medium mb-2 block">
                         Do you have any specific stay in mind?
                       </Label>
                       <Input
                         id="customStay"
                         placeholder="e.g., Taj Hotel, specific Airbnb location..."
                         value={customStay}
                         onChange={(e) => setCustomStay(e.target.value)}
                         className="text-lg p-4"
                       />
                     </div>
                   </div>

                   {/* Specific Places to Visit */}
                   <div>
                     <Label htmlFor="specificPlaces" className="text-lg font-semibold mb-4 block">
                       Any specific places you want to visit?
                     </Label>
                     <Textarea
                       id="specificPlaces"
                       placeholder="e.g., Eiffel Tower, Louvre Museum, specific restaurants..."
                       value={specificPlaces}
                       onChange={(e) => setSpecificPlaces(e.target.value)}
                       className="text-lg p-4 min-h-[100px]"
                     />
                   </div>

                   {/* Budget */}
                  <div>
                    <Label htmlFor="budget" className="text-lg font-semibold mb-4 block">
                      What's your budget?
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="budget"
                        placeholder="e.g., ₹50,000 - ₹2,00,000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="text-lg p-4 pl-10"
                      />
                    </div>
                  </div>

                   {/* Flight Booking */}
                   <div>
                     <div className="flex items-center space-x-2 mb-4">
                       <Checkbox 
                         id="flights" 
                         checked={needsFlights}
                         onCheckedChange={(checked) => {
                           setNeedsFlights(checked === true);
                           if (!checked) {
                             setSourceLocation("");
                             setReturnLocation("");
                             setFlightSuggestions(null);
                           }
                         }}
                       />
                       <Label htmlFor="flights" className="text-lg font-semibold flex items-center space-x-2">
                         <Plane className="w-5 h-5" />
                         <span>I need help with flight booking</span>
                       </Label>
                     </div>
                      {needsFlights && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sourceLocation" className="text-sm font-medium mb-2 block">
                              Where are you flying from?
                            </Label>
                            <Input 
                              id="sourceLocation" 
                              placeholder="Enter your departure city..." 
                              value={sourceLocation}
                              onChange={(e) => setSourceLocation(e.target.value)}
                              className="text-lg p-4"
                            />
                          </div>
                          <div>
                            <Label htmlFor="returnLocation" className="text-sm font-medium mb-2 block">
                              Where will you return to after the trip?
                            </Label>
                            <Input 
                              id="returnLocation" 
                              placeholder="Enter your return city (usually same as departure)..." 
                              value={returnLocation}
                              onChange={(e) => setReturnLocation(e.target.value)}
                              className="text-lg p-4"
                            />
                          </div>
                        </div>
                      )}
                    </div>


                   <Button 
                     onClick={handleCreateItinerary}
                     disabled={!destination || !tripType || !groupType || !departDate || !returnDate || !budget || isLoadingItinerary}
                     className="w-full bg-gradient-ocean text-white text-lg py-6 hover:scale-105 transition-all duration-300"
                   >
                     {isLoadingItinerary ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin mr-2" />
                         Crafting your perfect adventure...
                       </>
                     ) : (
                       <>
                         🚀 Create My Perfect Itinerary
                       </>
                     )}
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

  // Loading state while fetching flights for itinerary
  if (currentView === "itinerary" && isLoadingFlights && needsFlights && !itinerary?.outboundFlights && !itinerary?.flightOptions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading flight options...</p>
        </div>
      </div>
    );
  }

  // Itinerary Display View
  if (currentView === "itinerary" && itinerary) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <Button 
            onClick={() => setCurrentView("plan")}
            variant="outline" 
            className="mb-8"
          >
            ← Back to Planning
          </Button>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Itinerary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Selection - Show at the top */}
              {((itinerary.outboundFlights && itinerary.returnFlights) || itinerary.flightOptions) && needsFlights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center space-x-2">
                      <Plane className="w-6 h-6" />
                      <span>Select Your Flights</span>
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Choose the best flight options for your round trip
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Outbound Flights */}
                    {(itinerary.outboundFlights || itinerary.flightOptions) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Plane className="w-5 h-5 mr-2 text-primary" />
                          Outbound Flights {itinerary.sourceAirport && itinerary.destinationAirport && 
                            `(${itinerary.sourceAirport.code} → ${itinerary.destinationAirport.code})`}
                        </h3>
                        <div className="space-y-4">
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
                                  <h4 className="font-semibold text-lg">{flight.airline}</h4>
                                  <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">{flight.price}</p>
                                  <Badge variant="outline" className="mt-1">{flight.class}</Badge>
                                </div>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm font-medium">Route</p>
                                  <p className="text-sm text-muted-foreground">{flight.route}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Duration</p>
                                  <p className="text-sm text-muted-foreground">{flight.duration}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Departure</p>
                                  <p className="text-sm text-muted-foreground">{flight.departureTime}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Arrival</p>
                                  <p className="text-sm text-muted-foreground">{flight.arrivalTime}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-3 border-t">
                                <Badge variant="secondary">{flight.stops}</Badge>
                                <Badge 
                                  variant={flight.availability === "good" ? "default" : flight.availability === "limited" ? "secondary" : "outline"}
                                >
                                  {flight.availability}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-3">{flight.bookingRecommendation}</p>
                              
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
                    )}

                    {/* Return Flights */}
                    {itinerary.returnFlights && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Plane className="w-5 h-5 mr-2 text-primary rotate-180" />
                          Return Flights {itinerary.destinationAirport && itinerary.sourceAirport && 
                            `(${itinerary.destinationAirport.code} → ${itinerary.sourceAirport.code})`}
                        </h3>
                        <div className="space-y-4">
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
                                  <h4 className="font-semibold text-lg">{flight.airline}</h4>
                                  <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">{flight.price}</p>
                                  <Badge variant="outline" className="mt-1">{flight.class}</Badge>
                                </div>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm font-medium">Route</p>
                                  <p className="text-sm text-muted-foreground">{flight.route}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Duration</p>
                                  <p className="text-sm text-muted-foreground">{flight.duration}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Departure</p>
                                  <p className="text-sm text-muted-foreground">{flight.departureTime}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Arrival</p>
                                  <p className="text-sm text-muted-foreground">{flight.arrivalTime}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-3 border-t">
                                <Badge variant="secondary">{flight.stops}</Badge>
                                <Badge 
                                  variant={flight.availability === "good" ? "default" : flight.availability === "limited" ? "secondary" : "outline"}
                                >
                                  {flight.availability}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-3">{flight.bookingRecommendation}</p>
                              
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
                    
                    {itinerary.bookingTips && (
                      <div className="mt-6 p-4 bg-accent/20 rounded-lg">
                        <h4 className="font-semibold mb-2">💡 Booking Tips</h4>
                        <ul className="space-y-1">
                          {itinerary.bookingTips.map((tip: string, index: number) => (
                            <li key={index} className="text-sm flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-ocean bg-clip-text text-transparent">
                    Your {itinerary.tripType} Journey to {itinerary.destination}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {itinerary.duration} • Estimated Budget: {itinerary.estimatedBudget?.total}
                  </p>
                  
                  {/* Timing Analysis */}
                  {itinerary.timingAnalysis && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      itinerary.timingAnalysis.isOptimalTime 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                        : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                    }`}>
                      <h4 className={`font-semibold mb-2 flex items-center ${
                        itinerary.timingAnalysis.isOptimalTime 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-orange-700 dark:text-orange-300'
                      }`}>
                        {itinerary.timingAnalysis.isOptimalTime ? (
                          <><CheckCircle className="w-4 h-4 mr-2" />Perfect Timing!</>
                        ) : (
                          <><AlertTriangle className="w-4 h-4 mr-2" />Timing Considerations</>
                        )}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Weather:</strong> {itinerary.timingAnalysis.weatherConditions}
                        </div>
                        <div>
                          <strong>Safety Status:</strong> {itinerary.timingAnalysis.safetyStatus}
                        </div>
                      </div>
                      <p className={`text-sm mt-2 ${
                        itinerary.timingAnalysis.isOptimalTime 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-orange-700 dark:text-orange-300'
                      }`}>
                        <strong>Our Recommendation:</strong> {itinerary.timingAnalysis.recommendations}
                      </p>
                    </div>
                  )}
                  
                  {/* Weather Alerts */}
                  {itinerary.weatherAlerts && itinerary.weatherAlerts.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold mb-2 flex items-center text-red-700 dark:text-red-300">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Weather Alerts
                      </h4>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {itinerary.weatherAlerts.map((alert: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">⚠️</span>
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Daily Itinerary */}
              <div className="space-y-4">
                {itinerary.itinerary?.map((day: any, dayIndex: number) => (
                  <Card key={day.day}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <CalendarIcon className="w-5 h-5" />
                        <span>Day {day.day}: {day.title}</span>
                      </CardTitle>
                      {day.weatherNote && (
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Thermometer className="w-4 h-4 mr-1" />
                          {day.weatherNote}
                        </p>
                      )}
                    </CardHeader>
                     <CardContent>
                       <div className="space-y-3">
                         {day.activities?.map((activity: any, activityIndex: number) => (
                           <div key={activityIndex} className="flex items-start space-x-3 p-3 border rounded-lg">
                             <div className="flex-1">
                               <div className="flex items-center space-x-2 mb-1">
                                 <Clock className="w-4 h-4 text-muted-foreground" />
                                 <span className="text-sm font-medium">{activity.time}</span>
                                 <Badge variant="outline" className="text-xs">{activity.duration}</Badge>
                               </div>
                               <h4 className="font-semibold">{activity.activity}</h4>
                               <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                               <div className="flex items-center space-x-2">
                                 <LocationPin className="w-4 h-4 text-muted-foreground" />
                                 <span className="text-sm">{activity.location}</span>
                                 <Badge variant="secondary" className="text-xs">{activity.estimatedCost}</Badge>
                                 {activity.weatherSuitability && (
                                   <Badge 
                                     variant="outline" 
                                     className={`text-xs ${
                                       activity.weatherSuitability === 'outdoor' 
                                         ? 'border-green-500 text-green-600' 
                                         : activity.weatherSuitability === 'indoor'
                                         ? 'border-blue-500 text-blue-600'
                                         : 'border-orange-500 text-orange-600'
                                     }`}
                                   >
                                     {activity.weatherSuitability}
                                   </Badge>
                                 )}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Hotel Selection for this day */}
                       {day.hotels && day.hotels.length > 0 && (
                         <div className="mt-6 pt-6 border-t">
                           <h4 className="font-semibold mb-4 flex items-center">
                             <Star className="w-4 h-4 mr-2" />
                             Select Your Stay for Day {day.day}
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
                                   />
                                 )}
                                 <h5 className="font-semibold text-sm mb-1">{hotel.name}</h5>
                                 <p className="text-xs text-muted-foreground mb-2">{hotel.location}</p>
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
            </div>

            {/* Sidebar with Hotels, Cuisine, etc. */}
            <div className="space-y-6">
              {/* Budget Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <IndianRupee className="w-5 h-5" />
                    <span>Budget Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(itinerary.estimatedBudget?.breakdown || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key}:</span>
                        <span className="font-medium">{value as string}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{itinerary.estimatedBudget?.total}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fix Itinerary Button */}
              {allHotelsSelected() && (
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
                        itinerary.itinerary?.forEach((day: any) => {
                          const selectedHotel = day.hotels?.find((h: any) => h.selected);
                          if (selectedHotel && selectedHotel.pricePerNight) {
                            const priceStr = selectedHotel.pricePerNight.replace(/[₹,]/g, '');
                            hotelCost += parseInt(priceStr) || 0;
                          }
                        });
                        
                        // Calculate activities cost
                        let activitiesCost = 0;
                        itinerary.itinerary?.forEach((day: any) => {
                          day.activities?.forEach((activity: any) => {
                            if (activity.estimatedCost) {
                              const priceStr = activity.estimatedCost.replace(/[₹,]/g, '');
                              activitiesCost += parseInt(priceStr) || 0;
                            }
                          });
                        });
                        
                        // Add food costs
                        itinerary.localCuisine?.forEach((dish: any) => {
                          if (dish.estimatedCost) {
                            const priceStr = dish.estimatedCost.replace(/[₹,]/g, '');
                            activitiesCost += parseInt(priceStr) || 0;
                          }
                        });
                        
                        // Navigate to payment with calculated costs
                        window.location.href = `/payment?destination=${encodeURIComponent(itinerary.destination)}&flightCost=${flightCost}&hotelCost=${hotelCost}&activitiesCost=${activitiesCost}`;
                      }}
                      className="bg-gradient-ocean text-white text-lg py-6 px-12 hover:scale-105 transition-all duration-300"
                    >
                      Fix Itinerary & Proceed to Payment
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Local Cuisine */}
              {itinerary.localCuisine && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Utensils className="w-5 h-5" />
                      <span>Local Cuisine</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {itinerary.localCuisine.map((dish: any, index: number) => (
                        <div key={index} className="p-3 bg-accent/20 rounded-lg">
                          <h4 className="font-semibold text-sm">{dish.dish}</h4>
                          <p className="text-xs text-muted-foreground mb-1">{dish.description}</p>
                          <p className="text-xs text-primary">{dish.whereToFind}</p>
                          <Badge variant="outline" className="text-xs mt-1">{dish.estimatedCost}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Flight Recommendations */}
              {itinerary.flightRecommendations && needsFlights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Plane className="w-5 h-5" />
                      <span>Flight Options</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {itinerary.flightRecommendations.map((flight: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-semibold text-sm">{flight.airline}</h4>
                          <p className="text-sm text-muted-foreground">{flight.route}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{flight.estimatedPrice}</Badge>
                            <Badge variant="outline" className="text-xs">{flight.duration}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{flight.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Important Tips */}
              {itinerary.importantTips && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💡 Important Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {itinerary.importantTips.map((tip: string, index: number) => (
                        <li key={index} className="text-sm flex items-start space-x-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        <ChatBot />
      </div>
    );
  }

  // Image Identification View
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
                Upload an image and let AI discover everything about that place
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Upload Your Photo</p>
                  <p className="text-muted-foreground">Drag and drop or click to select an image</p>
                </label>
              </div>

              {uploadedImage && (
                <div className="text-center">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}

              {isLoadingImageAnalysis && (
                <div className="text-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg">Analyzing your image with AI...</p>
                  <p className="text-muted-foreground">This may take a few moments</p>
                </div>
              )}

              {imageAnalysis && !imageAnalysis.error && (
                <div className="space-y-6">
                  <Card className="p-6 bg-gradient-to-r from-nature/10 to-adventure/10">
                    <h3 className="text-2xl font-bold mb-4 text-center">
                      📍 {imageAnalysis.identifiedPlace}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p><strong>Country:</strong> {imageAnalysis.country}</p>
                        <p><strong>City:</strong> {imageAnalysis.city}</p>
                        {imageAnalysis.state && <p><strong>State:</strong> {imageAnalysis.state}</p>}
                      </div>
                      <div>
                        <p><strong>Confidence:</strong> 
                          <Badge className={`ml-2 ${
                            imageAnalysis.confidence === 'high' ? 'bg-green-100 text-green-700' :
                            imageAnalysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {imageAnalysis.confidence}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{imageAnalysis.description}</p>
                  </Card>

                  {imageAnalysis.estimatedBudget && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <IndianRupee className="w-5 h-5" />
                          <span>Estimated Budget</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-semibold mb-4">{imageAnalysis.estimatedBudget.budget}</p>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(imageAnalysis.estimatedBudget.breakdown || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between p-2 bg-accent/20 rounded">
                              <span className="capitalize">{key}:</span>
                              <span className="font-medium">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {imageAnalysis.nearbyAttractions && (
                      <Card>
                        <CardHeader>
                          <CardTitle>🎯 Nearby Attractions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {imageAnalysis.nearbyAttractions.map((attraction: any, index: number) => (
                              <div key={index} className="p-3 bg-accent/20 rounded-lg">
                                <h4 className="font-semibold text-sm">{attraction.name}</h4>
                                <p className="text-xs text-muted-foreground">{attraction.description}</p>
                                <Badge variant="outline" className="text-xs mt-1">{attraction.distance}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {imageAnalysis.bestTimeToVisit && (
                      <Card>
                        <CardHeader>
                          <CardTitle>⏰ Best Time to Visit</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-semibold">{imageAnalysis.bestTimeToVisit.months?.join(', ')}</p>
                          <p className="text-sm text-muted-foreground mt-2">{imageAnalysis.bestTimeToVisit.reason}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {imageAnalysis.suggestedItinerary && (
                    <Card>
                      <CardHeader>
                        <CardTitle>🗓️ Suggested Itinerary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {imageAnalysis.suggestedItinerary.map((day: any, index: number) => (
                            <div key={index} className="border-l-4 border-primary pl-4">
                              <h4 className="font-semibold mb-2">Day {day.day}</h4>
                              <div className="space-y-2">
                                {day.activities?.map((activity: any, actIndex: number) => (
                                  <div key={actIndex} className="p-2 bg-accent/10 rounded">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">{activity.activity}</span>
                                      <div className="flex space-x-2">
                                        <Badge variant="outline" className="text-xs">{activity.duration}</Badge>
                                        <Badge variant="secondary" className="text-xs">{activity.cost}</Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid md:grid-cols-3 gap-4">
                    {imageAnalysis.localCuisine && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">🍽️ Local Cuisine</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {imageAnalysis.localCuisine.map((dish: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs block text-center py-1">
                                {dish}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {imageAnalysis.transportationOptions && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">🚗 Transportation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {imageAnalysis.transportationOptions.map((option: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs block text-center py-1">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {imageAnalysis.importantTips && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">💡 Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {imageAnalysis.importantTips.slice(0, 3).map((tip: string, index: number) => (
                              <li key={index} className="text-xs flex items-start">
                                <span className="text-primary mr-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="text-center pt-6">
                    <Button 
                      onClick={() => {
                        setDestination(imageAnalysis.identifiedPlace);
                        setCurrentView('plan');
                      }}
                      className="bg-gradient-nature text-white px-8 py-3 text-lg hover:scale-105 transition-all duration-300"
                    >
                      Plan My Trip to {imageAnalysis.identifiedPlace} 🚀
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <ChatBot />
      </div>
    );
  }

  // Surprise Me View
  if (currentView === "surprise") {
    return <SurpriseView onBackToMain={() => setCurrentView("main")} />;
  }

  // Polling View
  if (currentView === "polling" && pollId) {
    return (
      <PollingView
        pollId={pollId}
        onBackToPlanning={() => setCurrentView("plan")}
        onProceedToItinerary={(itineraryData: any) => {
          setItinerary(itineraryData);
          setCurrentView("itinerary");
        }}
      />
    );
  }

  // Poll Success View
  if (currentView === "poll-success") {
    if (!pollData) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading poll details...</p>
          </div>
        </div>
      );
    }

    return (
      <PollSuccess
        pollId={pollData.pollId}
        pollUrl={pollData.pollUrl}
        destination={destination}
        organizerEmail={user?.email || ""}
        memberEmails={emails.filter(email => email.trim() !== "")}
        memberCount={emails.filter(email => email.trim() !== "").length}
        onBackToPlanning={() => {
          setCurrentView("plan");
        }}
        onViewPollResults={() => {
          setCurrentView("polling");
        }}
      />
    );
  }

  // Handle creating itinerary with poll results
  const handleCreateItineraryWithPollResults = async (pollResults: any) => {
    if (!destination || !departDate || !returnDate || !budget) return;
    
    setIsLoadingItinerary(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-itinerary', {
        body: {
          destination,
          tripType,
          groupType,
          departDate: format(departDate, 'yyyy-MM-dd'),
          returnDate: format(returnDate, 'yyyy-MM-dd'),
          budget,
          needsFlights,
          pollResults: pollResults // Include poll results for customization
        }
      });
      
      if (error) throw error;
      setItinerary(data);
    } catch (error) {
      console.error('Error creating itinerary with poll results:', error);
      alert('Error creating itinerary. Please try again.');
    } finally {
      setIsLoadingItinerary(false);
    }
  };

  return null;
};

export default TravelInterface;