import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, DollarSign, Users, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PollQuestion {
  id: string;
  question_text: string;
  question_type: string;
  category: string;
  options: any;
}

interface Poll {
  id: string;
  destination: string;
  depart_date: string;
  return_date: string;
  budget: string;
  organizer_email: string;
}

const PollResponse = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [questions, setQuestions] = useState<PollQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [responderEmail, setResponderEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pollId) {
      fetchPollData();
    }
  }, [pollId]);

  const fetchPollData = async () => {
    try {
      // Fetch poll details
      const { data: pollData, error: pollError } = await supabase
        .from('group_polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (pollError) throw pollError;

      // Fetch poll questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('poll_questions')
        .select('*')
        .eq('poll_id', pollId)
        .order('category');

      if (questionsError) throw questionsError;

      setPoll(pollData);
      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error('Error fetching poll data:', error);
      toast({
        title: "Error",
        description: "Failed to load poll data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!responderEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(responses).length !== questions.length) {
      toast({
        title: "Incomplete Response",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit all responses
      const responsePromises = Object.entries(responses).map(([questionId, value]) => 
        supabase.from('poll_responses').insert({
          poll_id: pollId,
          question_id: questionId,
          response_value: value,
          responder_email: responderEmail.toLowerCase().trim()
        })
      );

      await Promise.all(responsePromises);

      // Update member response status
      const { error: memberError } = await supabase
        .from('poll_members')
        .update({ 
          has_responded: true, 
          responded_at: new Date().toISOString() 
        })
        .eq('poll_id', pollId)
        .eq('email', responderEmail.toLowerCase().trim());

      if (memberError) {
        console.error('Error updating member status:', memberError);
      }

      toast({
        title: "Response Submitted!",
        description: "Thank you for participating in the group trip poll.",
      });

      // Redirect to a thank you page or close
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: PollQuestion) => {
    const options = question.options || [];
    
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={responses[question.id]?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentResponse = responses[question.id] || "";
                    const currentOptions = currentResponse ? currentResponse.split(",") : [];
                    
                    if (checked) {
                      const newOptions = [...currentOptions, option];
                      handleResponseChange(question.id, newOptions.join(","));
                    } else {
                      const newOptions = currentOptions.filter(opt => opt !== option);
                      handleResponseChange(question.id, newOptions.join(","));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <Textarea
            placeholder="Enter your response..."
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="min-h-[100px]"
          />
        );
      
      default:
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading poll...</span>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Poll Not Found</h2>
            <p className="text-muted-foreground">This poll may have expired or been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Poll Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Group Trip Poll: {poll.destination}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{poll.depart_date} - {poll.return_date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{poll.budget}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Organized by {poll.organizer_email}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="email">Your Email Address *</Label>
              <input
                id="email"
                type="email"
                value={responderEmail}
                onChange={(e) => setResponderEmail(e.target.value)}
                className="w-full p-2 border rounded-md mt-1"
                placeholder="Enter your email address"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {index + 1}. {question.question_text}
                  </CardTitle>
                  <Badge variant="secondary">{question.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !responderEmail.trim() || Object.keys(responses).length !== questions.length}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Response...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit My Response
                </>
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center mt-3">
              Your responses will help create the perfect group itinerary that everyone will enjoy!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PollResponse;