import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Smartphone, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import QRCode from 'qrcode';

const Payment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const destination = searchParams.get('destination') || '';
  const flightCost = searchParams.get('flightCost') || '0';
  const hotelCost = searchParams.get('hotelCost') || '0';
  const activitiesCost = searchParams.get('activitiesCost') || '0';

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showPaymentDoneButton, setShowPaymentDoneButton] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate total cost
  const totalCost = parseInt(flightCost) + parseInt(hotelCost) + parseInt(activitiesCost);
  const formattedTotal = `₹${totalCost.toLocaleString('en-IN')}`;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Generate QR code for UPI
  useEffect(() => {
    if (paymentMethod === 'upi' && selectedUpiApp && canvasRef.current) {
      const upiString = selectedUpiApp === 'other' && upiId 
        ? `upi://pay?pa=${upiId}&pn=Travel&am=${totalCost}&cu=INR`
        : `upi://pay?pa=merchant@upi&pn=Travel&am=${totalCost}&cu=INR`;
      
      QRCode.toCanvas(canvasRef.current, upiString, { width: 200 }, (error) => {
        if (error) console.error('QR Code generation error:', error);
        else setShowPaymentDoneButton(true);
      });
    }
  }, [paymentMethod, selectedUpiApp, upiId, totalCost]);

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
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentCompleted(true);
    }, 2000);
  };

  const handlePaymentDone = () => {
    setPaymentCompleted(true);
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

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full text-center">
          <CardContent className="pt-12 pb-12">
            <PartyPopper className="w-20 h-20 mx-auto mb-6 text-green-600" />
            <h1 className="text-4xl font-bold mb-4 text-green-600">Transaction Completed!</h1>
            <p className="text-2xl mb-8">Get Ready for Your Trip to {destination}!</p>
            <div className="bg-green-50 dark:bg-green-950/30 p-6 rounded-lg mb-8">
              <p className="text-lg mb-2">Confirmation details have been sent to your email</p>
              <p className="text-muted-foreground">Check your inbox for your complete itinerary and booking information</p>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-ocean text-white px-8 py-6 text-lg"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
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
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Flights:</span>
                    <span>₹{parseInt(flightCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hotels:</span>
                    <span>₹{parseInt(hotelCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Activities & Food:</span>
                    <span>₹{parseInt(activitiesCost).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="text-muted-foreground font-semibold">Total Amount:</span>
                  <span className="font-bold text-2xl text-primary">{formattedTotal}</span>
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

                      {selectedUpiApp && (
                        <>
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

                          <div className="flex flex-col items-center space-y-4 border rounded-lg p-6 bg-muted/30">
                            <p className="text-sm text-muted-foreground">Scan QR code to pay {formattedTotal}</p>
                            <canvas ref={canvasRef} className="border-4 border-white rounded-lg shadow-lg" />
                            <p className="text-xs text-muted-foreground">Or open your UPI app and scan this code</p>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {paymentMethod === 'upi' && showPaymentDoneButton ? (
                    <Button
                      type="button"
                      onClick={handlePaymentDone}
                      disabled={!selectedUpiApp}
                      className="w-full bg-gradient-ocean text-white py-6 text-lg hover:scale-105 transition-all duration-300"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Payment Done
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isProcessing || (paymentMethod === 'upi' && !selectedUpiApp)}
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
                  )}
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
