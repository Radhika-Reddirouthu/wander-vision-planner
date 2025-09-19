import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, Vote, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PollingViewProps {
  pollId: string;
  onBackToPlanning: () => void;
  onProceedToItinerary: (pollResults: any) => void;
}

const PollingView: React.FC<PollingViewProps> = ({
  pollId,
  onBackToPlanning,
  onProceedToItinerary
}) => {
  const [pollResults, setPollResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);

  const fetchPollResults = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-poll-results', {
        body: { pollId }
      });

      if (error) throw error;
      setPollResults(data);
    } catch (error) {
      console.error('Error fetching poll results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPollResults();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchPollResults, 30000);
    return () => clearInterval(interval);
  }, [pollId]);

  const handleGenerateItinerary = async () => {
    setIsGeneratingItinerary(true);
    try {
      // Pass poll results to parent component for itinerary generation
      onProceedToItinerary(pollResults);
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Loading poll status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pollResults) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="text-center py-20">
              <p className="text-lg text-muted-foreground">Poll not found</p>
              <Button onClick={onBackToPlanning} className="mt-4">
                Back to Planning
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { poll, pollStatus, resultsByCategory, preferences } = pollResults;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <Button 
          onClick={onBackToPlanning}
          variant="outline" 
          className="mb-8"
        >
          ← Back to Planning
        </Button>

        <div className="space-y-8">
          {/* Poll Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center bg-gradient-ocean bg-clip-text text-transparent">
                🗳️ Group Poll: {poll.destination}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{poll.destination}</div>
                  <div className="text-sm text-muted-foreground">Destination</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-adventure">{pollStatus.totalMembers}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-nature">{pollStatus.respondedMembers}</div>
                  <div className="text-sm text-muted-foreground">Responded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ocean">{pollStatus.responseRate}%</div>
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Poll Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {pollStatus.respondedMembers}/{pollStatus.totalMembers} responses
                    </span>
                  </div>
                  <Progress value={pollStatus.responseRate} className="h-3" />
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <Badge variant={pollStatus.isComplete ? "default" : "secondary"} className="flex items-center space-x-1">
                    {pollStatus.isComplete ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span>{pollStatus.isComplete ? "Ready for Itinerary" : "Waiting for Responses"}</span>
                  </Badge>
                  <Button
                    onClick={fetchPollResults}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poll Results */}
          {pollStatus.responseRate > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Vote className="w-6 h-6" />
                  <span>Current Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(resultsByCategory).map(([category, data]: [string, any]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="font-semibold text-lg capitalize">{category}</h3>
                      {data.questions.map((question: any, index: number) => (
                        <div key={index} className="p-4 bg-accent/20 rounded-lg">
                          <h4 className="font-medium mb-2">{question.question}</h4>
                          <div className="space-y-1">
                            {Object.entries(question.responses)
                              .sort(([,a], [,b]) => (b as number) - (a as number))
                              .slice(0, 3)
                              .map(([option, count]: [string, any]) => (
                              <div key={option} className="flex justify-between items-center">
                                <span className="text-sm">{option}</span>
                                <Badge variant={option === question.majorityChoice ? "default" : "secondary"}>
                                  {count} vote{count !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="text-center py-8">
              {pollStatus.isComplete ? (
                <div className="space-y-4">
                  <div className="text-green-600 font-medium">
                    ✅ Enough responses collected! Ready to generate your customized itinerary.
                  </div>
                  <Button
                    onClick={handleGenerateItinerary}
                    disabled={isGeneratingItinerary}
                    className="bg-gradient-ocean text-white text-lg py-6 px-8 hover:scale-105 transition-all duration-300"
                  >
                    {isGeneratingItinerary ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating Personalized Itinerary...
                      </>
                    ) : (
                      "Generate Group Itinerary Based on Poll Results ✨"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-muted-foreground">
                    Waiting for more group members to respond. We recommend having at least 50% response rate for best results.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Poll link has been sent to all group members. You can also generate the itinerary with current responses.
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={handleGenerateItinerary}
                      disabled={isGeneratingItinerary || pollStatus.responseRate === 0}
                      variant="outline"
                    >
                      Generate with Current Responses
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PollingView;