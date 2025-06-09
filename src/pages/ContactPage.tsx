import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contactService } from '@/lib/supabase';
import type { Database as DatabaseType } from '@/lib/types/database';
import { INDUSTRY_OPTIONS } from '@/lib/types/database';

type ContactSubmissionInsert = DatabaseType['public']['Tables']['contact_submissions']['Insert'];

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactSubmissionInsert>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: null,
    industry: null,
    additional_notes: null,
    newsletter_subscription: false
  });
  const [countryCode, setCountryCode] = useState('US'); // Default to US
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim() === '' ? null : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      newsletter_subscription: checked
    }));
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    // Get the selected country's dial code
    const countries = [
      { code: "US", dialCode: "+1" },
      { code: "GB", dialCode: "+44" },
      { code: "CA", dialCode: "+1" },
      { code: "AU", dialCode: "+61" },
      { code: "DE", dialCode: "+49" },
      { code: "FR", dialCode: "+33" },
      { code: "IT", dialCode: "+39" },
      { code: "ES", dialCode: "+34" },
      { code: "NL", dialCode: "+31" },
      { code: "BE", dialCode: "+32" },
      { code: "CH", dialCode: "+41" },
      { code: "AT", dialCode: "+43" },
      { code: "SE", dialCode: "+46" },
      { code: "NO", dialCode: "+47" },
      { code: "DK", dialCode: "+45" },
      { code: "FI", dialCode: "+358" },
      { code: "IE", dialCode: "+353" },
      { code: "PT", dialCode: "+351" },
      { code: "LU", dialCode: "+352" },
      { code: "JP", dialCode: "+81" },
      { code: "KR", dialCode: "+82" },
      { code: "CN", dialCode: "+86" },
      { code: "IN", dialCode: "+91" },
      { code: "SG", dialCode: "+65" },
      { code: "HK", dialCode: "+852" },
      { code: "MY", dialCode: "+60" },
      { code: "TH", dialCode: "+66" },
      { code: "PH", dialCode: "+63" },
      { code: "ID", dialCode: "+62" },
      { code: "VN", dialCode: "+84" },
      { code: "BR", dialCode: "+55" },
      { code: "MX", dialCode: "+52" },
      { code: "AR", dialCode: "+54" },
      { code: "CL", dialCode: "+56" },
      { code: "CO", dialCode: "+57" },
      { code: "PE", dialCode: "+51" },
      { code: "ZA", dialCode: "+27" },
      { code: "EG", dialCode: "+20" },
      { code: "NG", dialCode: "+234" },
      { code: "KE", dialCode: "+254" },
      { code: "MA", dialCode: "+212" },
      { code: "IL", dialCode: "+972" },
      { code: "AE", dialCode: "+971" },
      { code: "SA", dialCode: "+966" },
      { code: "TR", dialCode: "+90" },
      { code: "RU", dialCode: "+7" },
      { code: "UA", dialCode: "+380" },
      { code: "PL", dialCode: "+48" },
      { code: "CZ", dialCode: "+420" },
      { code: "HU", dialCode: "+36" },
      { code: "RO", dialCode: "+40" },
      { code: "BG", dialCode: "+359" },
      { code: "HR", dialCode: "+385" },
      { code: "SI", dialCode: "+386" },
      { code: "SK", dialCode: "+421" },
      { code: "LT", dialCode: "+370" },
      { code: "LV", dialCode: "+371" },
      { code: "EE", dialCode: "+372" },
      { code: "GR", dialCode: "+30" },
      { code: "CY", dialCode: "+357" },
      { code: "MT", dialCode: "+356" },
      { code: "IS", dialCode: "+354" },
      { code: "NZ", dialCode: "+64" }
    ];
    
    const selectedCountry = countries.find(country => country.code === countryCode);
    const dialCode = selectedCountry?.dialCode || '+1';
    
    // Combine dial code with phone number for storage
    const fullPhoneNumber = value ? `${dialCode} ${value}` : '';
    setFormData(prev => ({
      ...prev,
      phone: fullPhoneNumber
    }));
  };

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    // Update the phone number with new country code if there's a number
    if (phoneNumber) {
      handlePhoneChange(phoneNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('📝 Starting form submission...');
      
      // Prepare the data for submission
      const submissionData: ContactSubmissionInsert = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company_name: formData.company_name?.trim() || null,
        industry: formData.industry || null,
        additional_notes: formData.additional_notes?.trim() || null,
        newsletter_subscription: formData.newsletter_subscription || false
      };

      console.log('📤 Submitting data:', submissionData);

      // Submit using the contact service
      const result = await contactService.createContactSubmission(submissionData);
      
      console.log('✅ Submission successful:', result);
      setIsSubmitted(true);
    } catch (err) {
      console.error('❌ Error submitting contact form:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_name: null,
      industry: null,
      additional_notes: null,
      newsletter_subscription: false
    });
    setCountryCode('US');
    setPhoneNumber('');
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-[#2a2a2a] rounded-2xl p-12 border border-gray-700">
            <div className="bg-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We've received your information and will be in touch within 24 hours to discuss how Invelar can transform your business operations.
            </p>
            <button 
              onClick={resetForm}
              className="w-full text-gray-600 font-semibold transition-all duration-300 hover:text-gray-500 mb-4"
            >
              Submit Another Response
            </button>
            <Link to="/">
              <Button 
                variant="outline" 
                className="w-full border-gray-600 text-black hover:bg-gray-800 hover:text-white transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Glass Morphism Header Background */}
      <div className="header-background"></div>

      {/* Fixed Logo */}
      <div className="logo">
        <Link to="/" className="flex items-center">
          <img
            src="/Invelar Logo.png"
            alt="Invelar Logo"
            className="h-16 w-auto"
          />
        </Link>
      </div>

      {/* Fixed Navigation Button */}
      <div className="nav-buttons">
        <Link to="/">
          <Button 
            variant="outline" 
            className="border-gray-600 text-black hover:bg-gray-800 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Main Content - Adjusted padding to account for fixed header */}
      <main className="py-20 px-4 pt-32">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Get Started Today</h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Ready to transform your business with AI automation? Share your details below and our team will reach out to discuss your specific needs and create a customized solution.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-medium">Submission Failed</p>
                <p className="text-red-300 text-sm">{error}</p>
                <p className="text-red-300 text-xs mt-1">
                  Please try again later.
                </p>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-white font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 transition-all duration-300"
                      placeholder="Enter your first name"
                      required
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-white font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 transition-all duration-300"
                      placeholder="Enter your last name"
                      required
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 transition-all duration-300"
                    placeholder="Enter your email address"
                    required
                    disabled={isSubmitting}
                    maxLength={255}
                  />
                </div>

                {/* Phone Field with International Selector */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">
                    Phone Number *
                  </Label>
                  <PhoneInput
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    countryCode={countryCode}
                    onCountryChange={handleCountryChange}
                    disabled={isSubmitting}
                    className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400"
                    error="Please enter a valid phone number"
                  />
                </div>

                {/* Company Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-white font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    type="text"
                    value={formData.company_name || ''}
                    onChange={handleInputChange}
                    className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 transition-all duration-300"
                    placeholder="Enter your company name"
                    disabled={isSubmitting}
                    maxLength={200}
                  />
                </div>

                {/* Industry Selector */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">
                    Industry
                  </Label>
                  <Select
                    value={formData.industry || ''}
                    onValueChange={(value) => handleSelectChange('industry', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white focus:border-gray-400 transition-all duration-300">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-gray-600 max-h-60">
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-white hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:text-white"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Notes Field */}
                <div className="space-y-2">
                  <Label htmlFor="additional_notes" className="text-white font-medium">
                    Additional Notes <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="additional_notes"
                    name="additional_notes"
                    value={formData.additional_notes || ''}
                    onChange={handleInputChange}
                    className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 transition-all duration-300 min-h-[100px] resize-y"
                    placeholder="Tell us more about your automation needs, specific challenges, or any questions you have..."
                    disabled={isSubmitting}
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Share any specific requirements, goals, or questions you have about AI automation.
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.additional_notes?.length || 0}/2000
                    </p>
                  </div>
                </div>

                {/* Newsletter Checkbox */}
                <div className="flex items-start space-x-3 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <Checkbox
                    id="newsletter_subscription"
                    checked={formData.newsletter_subscription}
                    onCheckedChange={handleCheckboxChange}
                    className="mt-1 border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
                    disabled={isSubmitting}
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor="newsletter_subscription" 
                      className="text-white font-medium cursor-pointer"
                    >
                      Stay Updated
                    </Label>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      I would like to receive news, updates, and promotional content from Invelar via email. You can unsubscribe at any time.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold text-lg py-6 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Get Started
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-center text-gray-400 text-sm leading-relaxed">
                  By submitting this form, you agree to our privacy policy and terms of service. 
                  We respect your privacy and will never share your information with third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-8">What Happens Next?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="bg-[#2a2a2a] rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold">Initial Consultation</h3>
                <p className="text-gray-400 text-sm">We'll schedule a free 30-minute call to understand your business needs and automation goals.</p>
              </div>
              <div className="space-y-3">
                <div className="bg-[#2a2a2a] rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold">Custom Proposal</h3>
                <p className="text-gray-400 text-sm">Receive a tailored automation strategy with clear ROI projections and implementation timeline.</p>
              </div>
              <div className="space-y-3">
                <div className="bg-[#2a2a2a] rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold">Implementation</h3>
                <p className="text-gray-400 text-sm">Our expert team begins building your custom AI automation solution with regular progress updates.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}