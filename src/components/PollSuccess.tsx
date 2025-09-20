import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users } from "lucide-react";
import SharePollLinks from "./SharePollLinks";

interface PollSuccessProps {
  pollId: string;
  pollUrl: string;
  destination: string;
  organizerEmail: string;
  memberEmails: string[];
  memberCount: number;
  onBackToPlanning: () => void;
  onViewPollResults: () => void;
}

const PollSuccess: React.FC<PollSuccessProps> = ({
  pollId,
  pollUrl,
  destination,
  organizerEmail,
  memberEmails,
  memberCount,
  onBackToPlanning,
  onViewPollResults
}) => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8">
          {/* Success Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center bg-gradient-ocean bg-clip-text text-transparent flex items-center justify-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span>Poll Created Successfully!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-lg text-muted-foreground">
                Your group poll for <strong>{destination}</strong> is ready!
              </div>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{memberCount} group members</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <SharePollLinks
            pollId={pollId}
            pollUrl={pollUrl}
            destination={destination}
            organizerEmail={organizerEmail}
            memberEmails={memberEmails}
          />

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-accent/20 rounded-lg">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <div className="font-medium">Share the Poll</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Send the poll link to all group members
                  </div>
                </div>
                <div className="text-center p-4 bg-accent/20 rounded-lg">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <div className="font-medium">Collect Responses</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Wait for members to fill out their preferences
                  </div>
                </div>
                <div className="text-center p-4 bg-accent/20 rounded-lg">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <div className="font-medium">Generate Itinerary</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Create a personalized trip based on group preferences
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={onViewPollResults}
              className="bg-gradient-ocean text-white"
            >
              View Poll Results
            </Button>
            <Button
              onClick={onBackToPlanning}
              variant="outline"
            >
              Back to Planning
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollSuccess;