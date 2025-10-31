import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const Payment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const destination = searchParams.get('destination') || '';
  const budget = searchParams.get('budget') || '';

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on payment method
    if (paymentMethod === 'credit-card' || paymentMethod === 'debit-card') {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        toast({
          title: "Missing Information",
          description: "Please fill in all card details",
          variant: "destructive"
        });
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (selectedUpiApp === 'other' && !upiId) {
        toast({
          title: "Missing Information",
          description: "Please enter your UPI ID",
          variant: "destructive"
        });
        return;
      }
      if (!selectedUpiApp) {
        toast({
          title: "Missing Information",
          description: "Please select a UPI payment option",
          variant: "destructive"
        });
        return;
      }
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Successful!",
        description: "Your itinerary has been confirmed. Check your email for details.",
      });
      
      // Navigate back to home after successful payment
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Itinerary
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span className="font-semibold">{destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold text-xl text-primary">{budget}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  What's Included:
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Confirmed hotel bookings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Complete day-by-day itinerary</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>24/7 travel support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Instant confirmation via email</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lock className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Secure Payment</p>
                    <p className="text-xs">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <CreditCard className="w-6 h-6 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="credit-card">Credit Card</TabsTrigger>
                  <TabsTrigger value="debit-card">Debit Card</TabsTrigger>
                  <TabsTrigger value="upi">UPI</TabsTrigger>
                </TabsList>

                <form onSubmit={handlePayment} className="space-y-6">
                  <TabsContent value="credit-card" className="space-y-4 mt-0">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setExpiryDate(value);
                          }}
                          maxLength={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          maxLength={3}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="debit-card" className="space-y-4 mt-0">
                    <div>
                      <Label htmlFor="debitCardNumber">Card Number</Label>
                      <Input
                        id="debitCardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="debitCardName">Cardholder Name</Label>
                      <Input
                        id="debitCardName"
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="debitExpiryDate">Expiry Date</Label>
                        <Input
                          id="debitExpiryDate"
                          type="text"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setExpiryDate(value);
                          }}
                          maxLength={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="debitCvv">CVV</Label>
                        <Input
                          id="debitCvv"
                          type="text"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          maxLength={3}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upi" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <Label>Select UPI Payment Method</Label>
                      <RadioGroup value={selectedUpiApp} onValueChange={setSelectedUpiApp}>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="gpay" id="gpay" />
                          <Label htmlFor="gpay" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <span>Google Pay (GPay)</span>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="phonepe" id="phonepe" />
                          <Label htmlFor="phonepe" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <span>PhonePe</span>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="paytm" id="paytm" />
                          <Label htmlFor="paytm" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <span>Paytm</span>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <span>Other UPI ID</span>
                          </Label>
                        </div>
                      </RadioGroup>

                      {selectedUpiApp === 'other' && (
                        <div>
                          <Label htmlFor="upiId">Enter UPI ID</Label>
                          <Input
                            id="upiId"
                            type="text"
                            placeholder="yourname@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-ocean text-white py-6 text-lg hover:scale-105 transition-all duration-300"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
