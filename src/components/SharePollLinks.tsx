import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Mail, 
  MessageCircle, 
  QrCode, 
  Share2, 
  Send,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as QRCode from 'qrcode';
import emailjs from '@emailjs/browser';

interface SharePollLinksProps {
  pollId: string;
  pollUrl: string;
  destination: string;
  organizerEmail: string;
  memberEmails?: string[];
  onEmailsSent?: (success: boolean) => void;
}

const SharePollLinks: React.FC<SharePollLinksProps> = ({
  pollId,
  pollUrl,
  destination,
  organizerEmail,
  memberEmails = [],
  onEmailsSent
}) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [pollUrl]);

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(pollUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Hi! Please help us plan our group trip to ${destination} by filling out this quick poll: ${pollUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaTelegram = () => {
    const message = `Hi! Please help us plan our group trip to ${destination} by filling out this quick poll: ${pollUrl}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pollUrl)}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const sendEmailsViaEmailJS = async () => {
    if (memberEmails.length === 0) return;

    setIsSendingEmails(true);
    try {
      // Initialize EmailJS (you'll need to set these up in your EmailJS account)
      emailjs.init("YOUR_PUBLIC_KEY"); // Replace with actual EmailJS public key

      const templateParams = {
        destination,
        poll_url: pollUrl,
        organizer_email: organizerEmail,
        to_emails: memberEmails.join(','),
      };

      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
      
      setEmailsSent(true);
      toast({
        title: "Emails Sent!",
        description: `Poll invitations sent to ${memberEmails.length} members`,
      });
      onEmailsSent?.(true);
    } catch (error) {
      console.error('Error sending emails:', error);
      toast({
        title: "Email Error",
        description: "Failed to send emails. Please share the link manually.",
        variant: "destructive",
      });
      onEmailsSent?.(false);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const generateShareMessage = () => {
    return `🌍 Group Trip Planning Poll for ${destination}

Hi! We're planning an amazing group trip to ${destination} and need your input to make it perfect for everyone!

Please take 2 minutes to fill out this quick poll about your preferences:
${pollUrl}

Your responses will help us create the ideal itinerary for our group. Thanks! ✈️`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share2 className="w-5 h-5" />
          <span>Share Poll with Group Members</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Poll URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Poll Link</label>
          <div className="flex space-x-2">
            <Input 
              value={pollUrl} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button
              onClick={() => copyToClipboard(pollUrl, "Poll link")}
              variant="outline"
              size="icon"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => window.open(pollUrl, '_blank')}
              variant="outline"
              size="icon"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Quick Share Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quick Share</label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={shareViaWhatsApp}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>
            <Button
              onClick={shareViaTelegram}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </Button>
            <Button
              onClick={() => copyToClipboard(generateShareMessage(), "Share message")}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Message</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Email Sending */}
        {memberEmails.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Email Invitations</label>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {memberEmails.length} member{memberEmails.length !== 1 ? 's' : ''}
              </Badge>
              {emailsSent ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Sent</span>
                </Badge>
              ) : (
                <Button
                  onClick={sendEmailsViaEmailJS}
                  disabled={isSendingEmails}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSendingEmails ? "Sending..." : "Send Email Invites"}</span>
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Emails will be sent to: {memberEmails.join(', ')}
            </div>
          </div>
        )}

        <Separator />

        {/* QR Code */}
        <div className="space-y-3">
          <label className="text-sm font-medium">QR Code</label>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {isGeneratingQR ? (
                <div className="w-32 h-32 bg-muted animate-pulse rounded-lg" />
              ) : qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Poll QR Code" 
                  className="w-32 h-32 border rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              Share this QR code for easy mobile access. Group members can scan it with their phone camera to quickly access the poll.
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-accent/20 rounded-lg">
          <h4 className="font-medium mb-2">📋 How to share:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Copy the poll link and share it in your group chat</li>
            <li>• Use the quick share buttons for instant messaging</li>
            <li>• Send email invitations if you have member emails</li>
            <li>• Show the QR code for in-person sharing</li>
            <li>• Each member needs to fill out the poll once</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SharePollLinks;