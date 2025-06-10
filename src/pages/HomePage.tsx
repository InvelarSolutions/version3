import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Workflow, 
  Bot, 
  Settings, 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  MessageCircle,
  Globe,
  PhoneCall,
  Send,
  Shield,
  Zap,
  Target,
  Users,
  Award,
  Lightbulb,
  BarChart3,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EnhancedChatbot } from '@/components/ui/enhanced-chatbot';

// Custom hook for intersection observer with scroll-based fade
const useScrollFadeAnimation = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollFade, setScrollFade] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;
        
        // Calculate fade based on element position relative to viewport
        let fadeValue = 1;
        
        // Fade out when element is moving out of view at the top
        if (elementTop < 0) {
          const fadeStart = -elementHeight * 0.2; // Start fading when 20% is out of view
          const fadeEnd = -elementHeight * 0.8; // Complete fade when 80% is out of view
          
          if (elementTop > fadeStart) {
            fadeValue = 1;
          } else if (elementTop < fadeEnd) {
            fadeValue = 0.1; // Minimum opacity
          } else {
            const progress = (elementTop - fadeStart) / (fadeEnd - fadeStart);
            fadeValue = Math.max(0.1, progress);
          }
        }
        
        // Fade in when element is entering from bottom
        if (elementTop > windowHeight) {
          const fadeStart = windowHeight + elementHeight * 0.2;
          const fadeEnd = windowHeight - elementHeight * 0.2;
          
          if (elementTop < fadeStart && elementTop > fadeEnd) {
            const progress = (fadeStart - elementTop) / (fadeStart - fadeEnd);
            fadeValue = Math.min(1, Math.max(0.1, progress));
          } else if (elementTop >= fadeStart) {
            fadeValue = 0.1;
          }
        }
        
        setScrollFade(fadeValue);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  return [ref, isVisible, scrollFade] as const;
};

// Simple intersection observer for basic fade-in animations
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible] as const;
};

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmailBubble, setShowEmailBubble] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showPhoneBubble, setShowPhoneBubble] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isVoiceflowChatOpen, setIsVoiceflowChatOpen] = useState(false);
  const [voiceflowLoaded, setVoiceflowLoaded] = useState(false);
  const [voiceflowError, setVoiceflowError] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: 1920, height: 1080 }); // Default server-safe values
  
  const emailBubbleRef = useRef<HTMLDivElement>(null);
  const mailButtonRef = useRef<HTMLButtonElement>(null);
  const phoneBubbleRef = useRef<HTMLDivElement>(null);
  const phoneButtonRef = useRef<HTMLButtonElement>(null);
  const voiceflowWidget = useRef<any>(null);
  const voiceflowContainer = useRef<HTMLDivElement>(null);

  // Set screen dimensions after component mounts on client side
  useEffect(() => {
    const updateScreenDimensions = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateScreenDimensions(); // Initial calculation
    window.addEventListener('resize', updateScreenDimensions);
    
    return () => window.removeEventListener('resize', updateScreenDimensions);
  }, []);

  // Initialize Voiceflow chat widget with error handling
  useEffect(() => {
    // Create a separate container for Voiceflow outside of React's control
    const voiceflowDiv = document.createElement('div');
    voiceflowDiv.id = 'voiceflow-chat-root';
    voiceflowDiv.style.cssText = `
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 50;
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
      transition: all 0.3s ease-in-out;
      opacity: 0;
      transform: translateY(1rem);
      pointer-events: none;
    `;
    
    document.body.appendChild(voiceflowDiv);
    voiceflowContainer.current = voiceflowDiv;

    // Load Voiceflow script with error handling
    const script = document.createElement('script');
    script.type = 'text/javascript';
    
    script.onload = function() {
      try {
        if (window.voiceflow) {
          // Add timeout to prevent hanging
          const loadTimeout = setTimeout(() => {
            console.warn('Voiceflow widget load timeout');
            setVoiceflowError(true);
          }, 10000); // 10 second timeout

          voiceflowWidget.current = window.voiceflow.chat.load({
            verify: { projectID: '6846c5cea6a8e2a7db8c1327' },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: {
              url: "https://runtime-api.voiceflow.com"
            },
            render: {
              mode: 'embedded',
              target: voiceflowDiv
            }
          }).then(() => {
            clearTimeout(loadTimeout);
            setVoiceflowLoaded(true);
            setVoiceflowError(false);
          }).catch((error: any) => {
            clearTimeout(loadTimeout);
            console.error('Voiceflow widget failed to load:', error);
            setVoiceflowError(true);
            setVoiceflowLoaded(false);
          });
        } else {
          setVoiceflowError(true);
        }
      } catch (error) {
        console.error('Error initializing Voiceflow widget:', error);
        setVoiceflowError(true);
      }
    };

    script.onerror = function() {
      console.error('Failed to load Voiceflow script');
      setVoiceflowError(true);
    };

    script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script and container on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (voiceflowContainer.current && document.body.contains(voiceflowContainer.current)) {
        document.body.removeChild(voiceflowContainer.current);
      }
    };
  }, []);

  // Control Voiceflow chat visibility
  useEffect(() => {
    if (voiceflowContainer.current && voiceflowLoaded && !voiceflowError) {
      if (isVoiceflowChatOpen) {
        voiceflowContainer.current.style.opacity = '1';
        voiceflowContainer.current.style.transform = 'translateY(0)';
        voiceflowContainer.current.style.pointerEvents = 'auto';
      } else {
        voiceflowContainer.current.style.opacity = '0';
        voiceflowContainer.current.style.transform = 'translateY(1rem)';
        voiceflowContainer.current.style.pointerEvents = 'none';
      }
    }
  }, [isVoiceflowChatOpen, voiceflowLoaded, voiceflowError]);

  // Handle clicking outside email bubble
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmailBubble &&
        emailBubbleRef.current &&
        mailButtonRef.current &&
        !emailBubbleRef.current.contains(event.target as Node) &&
        !mailButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmailBubble(false);
        setEmailCopied(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmailBubble]);

  // Handle clicking outside phone bubble
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPhoneBubble &&
        phoneBubbleRef.current &&
        phoneButtonRef.current &&
        !phoneBubbleRef.current.contains(event.target as Node) &&
        !phoneButtonRef.current.contains(event.target as Node)
      ) {
        setShowPhoneBubble(false);
        setPhoneCopied(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhoneBubble]);

  // Add fade animations to specified sections
  const [aboutRef, aboutVisible] = useIntersectionObserver();
  const [servicesRef, servicesVisible] = useIntersectionObserver();
  const [powerRef, powerVisible, powerScrollFade] = useScrollFadeAnimation();
  const [testimonialsRef, testimonialsVisible, testimonialsScrollFade] = useScrollFadeAnimation();
  const [ctaRef, ctaVisible, ctaScrollFade] = useScrollFadeAnimation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleChatClick = () => {
    setIsChatbotOpen(true);
  };

  const handleVoiceflowChatClick = () => {
    // If Voiceflow failed to load, fall back to the enhanced chatbot
    if (voiceflowError || !voiceflowLoaded) {
      setIsChatbotOpen(true);
    } else {
      setIsVoiceflowChatOpen(!isVoiceflowChatOpen);
    }
  };

  const handleMailClick = () => {
    setShowEmailBubble(!showEmailBubble);
    setEmailCopied(false);
    // Close phone bubble if open
    setShowPhoneBubble(false);
    setPhoneCopied(false);
  };

  const handlePhoneClick = () => {
    setShowPhoneBubble(!showPhoneBubble);
    setPhoneCopied(false);
    // Close email bubble if open
    setShowEmailBubble(false);
    setEmailCopied(false);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('invelarsolutions@gmail.com');
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText('+352 691 100 088');
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy phone:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Global Ring Pattern - Behind everything but over backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        {/* Calculate maximum ring size needed to fill screen */}
        {Array.from({ length: 30 }, (_, i) => {
          const size = 120 + (i * 100); // Start at 120px, increase by 100px each ring
          const maxScreenDimension = Math.max(screenDimensions.width, screenDimensions.height);
          
          // Only render rings that are needed to fill the screen
          if (size > maxScreenDimension * 1.8) return null;
          
          const baseOpacity = Math.max(0.03, 0.25 - (i * 0.008)); // Reduced base opacity
          
          // Calculate fade based on distance from center and scroll position
          const heroHeight = screenDimensions.height * 0.8;
          const aboutSectionStart = heroHeight;
          const aboutSectionHeight = screenDimensions.height * 1.2; // Approximate about section height
          
          // Get current scroll position
          const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
          
          // Calculate ring position relative to viewport - MOVED LOWER
          const ringCenterY = (screenDimensions.height * 0.4) - scrollY; // Changed from 0.35 to 0.4 (moved down)
          const ringRadius = size / 2;
          
          // Fade calculation for rings extending into about section
          let fadeMultiplier = 1;
          
          // If ring extends into about section area
          if (ringCenterY + ringRadius > aboutSectionStart) {
            const extensionIntoAbout = (ringCenterY + ringRadius) - aboutSectionStart;
            const maxExtension = aboutSectionHeight * 0.6; // Allow rings to extend 60% into about section
            
            if (extensionIntoAbout > maxExtension) {
              fadeMultiplier = 0.05; // Very faded but still visible
            } else {
              // Gradual fade as rings extend into about section
              fadeMultiplier = 1 - (extensionIntoAbout / maxExtension) * 0.8;
            }
          }
          
          const finalOpacity = baseOpacity * fadeMultiplier;
          
          return (
            <div
              key={i}
              className="absolute rounded-full border border-gray-600"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderColor: `rgba(107, 114, 128, ${finalOpacity})`,
                left: '50%',
                top: '40%', // Changed from 35% to 40% (moved down)
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}
        
        {/* Additional ultra-large rings to ensure full screen coverage */}
        {Array.from({ length: 20 }, (_, i) => {
          const size = 3000 + (i * 300); // Very large outer rings
          const maxScreenDimension = Math.max(screenDimensions.width, screenDimensions.height);
          
          // Only render if needed for screen coverage
          if (size > maxScreenDimension * 2.5) return null;
          
          const baseOpacity = Math.max(0.01, 0.08 - (i * 0.004)); // Very subtle outer rings
          
          // Similar fade calculation for ultra-large rings
          const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
          const ringCenterY = (screenDimensions.height * 0.4) - scrollY; // Changed from 0.35 to 0.4
          const heroHeight = screenDimensions.height * 0.8;
          const aboutSectionStart = heroHeight;
          const aboutSectionHeight = screenDimensions.height * 1.2;
          
          let fadeMultiplier = 1;
          const ringRadius = size / 2;
          
          if (ringCenterY + ringRadius > aboutSectionStart) {
            const extensionIntoAbout = (ringCenterY + ringRadius) - aboutSectionStart;
            const maxExtension = aboutSectionHeight * 0.8; // Allow more extension for ultra-large rings
            
            if (extensionIntoAbout > maxExtension) {
              fadeMultiplier = 0.02;
            } else {
              fadeMultiplier = 1 - (extensionIntoAbout / maxExtension) * 0.9;
            }
          }
          
          const finalOpacity = baseOpacity * fadeMultiplier;
          
          return (
            <div
              key={`ultra-${i}`}
              className="absolute rounded-full border border-gray-600"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderColor: `rgba(107, 114, 128, ${finalOpacity})`,
                left: '50%',
                top: '40%', // Changed from 35% to 40% (moved down)
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}
      </div>

      {/* Glass Morphism Header Background */}
      <div className="header-background"></div>

      {/* Fixed Logo */}
      <div className="logo">
        <img
          src="/Invelar Logo.png"
          alt="Invelar Logo"
          className="h-16 w-auto"
        />
      </div>

      {/* Fixed Navigation Buttons */}
      <div className="nav-buttons">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => scrollToSection('about')}
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('services')}
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            Services
          </button>
          <button 
            onClick={() => scrollToSection('testimonials')}
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            Testimonials
          </button>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            Contact
          </button>
          <Button 
            id="chat-button"
            onClick={handleVoiceflowChatClick}
            variant="outline"
            size="sm"
            className="border-gray-600 text-black hover:bg-gray-800 hover:text-white transition-all duration-300 p-2"
            title="AI Chat Assistant"
          >
            <MessageCircle className="h-4 w-4 text-black" />
          </Button>
          <Link to="/contact">
            <Button className="bg-white text-black hover:bg-gray-100 font-semibold transition-all duration-300 transform hover:scale-105">
              Get Started
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden transition-transform duration-300 hover:scale-110"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Mobile Navigation with Glass Effect */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 right-0 mobile-menu-glass rounded-lg p-4 animate-in slide-in-from-top duration-300 min-w-[200px]">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-300 hover:text-white transition-colors duration-300 text-left"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-300 hover:text-white transition-colors duration-300 text-left"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-300 hover:text-white transition-colors duration-300 text-left"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-300 hover:text-white transition-colors duration-300 text-left"
              >
                Contact
              </button>
              <Button 
                onClick={handleVoiceflowChatClick}
                variant="outline"
                size="sm"
                className="border-gray-600 text-black hover:bg-gray-800 hover:text-white transition-all duration-300 w-fit"
              >
                <MessageCircle className="h-4 w-4 mr-2 text-black" />
                AI Chat
              </Button>
              <Link to="/contact">
                <Button className="bg-white text-black hover:bg-gray-100 font-semibold w-fit transition-all duration-300 transform hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Hero Section - Adjusted padding to account for fixed header */}
      <section className="relative px-4 pt-32 pb-32 overflow-hidden min-h-screen">
        {/* Background Gradient - Behind rings */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#151515] z-0" />

        {/* Content - In front of rings - MOVED EVEN HIGHER */}
        <div className="relative max-w-6xl mx-auto text-center z-20 flex flex-col justify-center min-h-[calc(100vh-20rem)]">
          <div className="mb-6">
            <img
              src="/Invelar Logo.png"
              alt="Invelar"
              className="mx-auto h-32 md:h-48 w-auto"
            />
          </div>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
            Empowering every business with intelligent AI automation for an efficient future.
          </p>
          <Link to="/contact">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* About Invelar - WITH FADE ANIMATIONS */}
      <section id="about" className="py-32 px-4 bg-[#151515] relative z-20">
        <div className="max-w-7xl mx-auto">
          <div 
            ref={aboutRef}
            className={`transition-all duration-1000 ease-out ${
              aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {/* Main About Header */}
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">About Invelar</h2>
            </div>

            {/* Mission & Vision Grid */}
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              <Card className="bg-[#2a2a2a] border-gray-700 hover:border-gray-500 transition-all duration-500 group">
                <CardContent className="p-10">
                  <div className="flex items-center mb-6">
                    <Target className="h-12 w-12 text-blue-400 mr-4" />
                    <h3 className="text-2xl font-bold text-blue-400">Our Mission</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    To democratize enterprise-grade AI automation, making cutting-edge technology accessible to businesses 
                    of all sizes. We believe every company deserves the competitive edge that comes from intelligent, 
                    self-optimizing systems that work tirelessly to drive growth and efficiency.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-gray-700 hover:border-gray-500 transition-all duration-500 group">
                <CardContent className="p-10">
                  <div className="flex items-center mb-6">
                    <Lightbulb className="h-12 w-12 text-yellow-400 mr-4" />
                    <h3 className="text-2xl font-bold text-yellow-400">Our Vision</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    To create a world where businesses operate with unprecedented efficiency through AI-powered automation. 
                    We envision organizations that adapt, learn, and evolve autonomously, freeing human talent to focus on 
                    innovation, creativity, and strategic growth initiatives.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* What Sets Us Apart */}
            <div className="mb-20">
              <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">What Sets Invelar Apart</h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Lightning-Fast Implementation",
                    description: "Our proprietary automation frameworks enable rapid deployment of complex AI systems. What traditionally takes months, we deliver in weeks, getting you to ROI faster than ever before.",
                    color: "text-yellow-400",
                    titleColor: "text-yellow-400"
                  },
                  {
                    icon: Shield,
                    title: "Enterprise-Grade Security",
                    description: "Built with security-first architecture, our solutions meet the highest industry standards. Your data remains protected while our AI systems work seamlessly within your existing security protocols.",
                    color: "text-green-400",
                    titleColor: "text-green-400"
                  },
                  {
                    icon: BarChart3,
                    title: "Measurable Results",
                    description: "Every automation we deploy comes with comprehensive analytics and KPI tracking. We don't just promise efficiency—we prove it with real-time data and transparent reporting.",
                    color: "text-blue-400",
                    titleColor: "text-blue-400"
                  }
                ].map((feature, index) => (
                  <Card key={index} className="bg-[#2a2a2a] border-gray-700 hover:border-gray-500 transition-all duration-500 group transform hover:scale-105">
                    <CardContent className="p-8 text-center">
                      <feature.icon className={`h-16 w-16 ${feature.color} mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`} />
                      <h4 className={`text-xl font-bold mb-4 ${feature.titleColor}`}>{feature.title}</h4>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Why Choose Invelar */}
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-12">Why Leading Companies Choose Invelar</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {[
                  {
                    icon: Award,
                    title: "Proven Track Record",
                    description: "500+ successful implementations across diverse industries"
                  },
                  {
                    icon: Users,
                    title: "Expert Team",
                    description: "AI specialists, automation engineers, and industry veterans"
                  },
                  {
                    icon: Zap,
                    title: "Rapid ROI",
                    description: "Average 6-month payback period on automation investments"
                  },
                  {
                    icon: Shield,
                    title: "24/7 Support",
                    description: "Continuous monitoring and optimization of your AI systems"
                  }
                ].map((reason, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-[#2a2a2a] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:shadow-lg hover:scale-110">
                      <reason.icon className="h-10 w-10 text-white" />
                    </div>
                    <h4 className="font-bold mb-2">{reason.title}</h4>
                    <p className="text-gray-400 text-sm">{reason.description}</p>
                  </div>
                ))}
              </div>

              <div className="max-w-4xl mx-auto">
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                  At Invelar, we're not just service providers—we're strategic partners in your digital transformation journey. 
                  Our team of AI specialists, automation engineers, and industry experts work collaboratively to understand your 
                  unique challenges and craft bespoke solutions that deliver measurable results. We combine cutting-edge technology 
                  with deep business acumen to create automation systems that don't just work—they excel, adapt, and continuously 
                  improve to keep you ahead of the competition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Power of Automation - WITH DARKER BACKGROUND AND FADE ANIMATIONS */}
      <section className="py-20 px-4 relative">
        {/* Darker background that covers rings */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] z-10" />
        
        <div className="max-w-6xl mx-auto relative z-20">
          <div 
            ref={powerRef}
            className="transition-all duration-1000 ease-out"
            style={{ 
              opacity: powerVisible ? powerScrollFade : 0,
              transform: `translateY(${powerVisible ? 0 : 48}px) scale(${0.95 + (powerScrollFade * 0.05)})`
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">The Power of Automation</h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: DollarSign,
                  value: "30%",
                  label: "Cost Reduction",
                  color: "text-green-400"
                },
                {
                  icon: Clock,
                  value: "50+",
                  label: "Hours Saved Weekly",
                  color: "text-blue-400"
                },
                {
                  icon: TrendingUp,
                  value: "300%",
                  label: "Productivity Increase",
                  color: "text-purple-400"
                }
              ].map((stat, index) => (
                <div key={index} className="text-center transition-all duration-700 ease-out transform hover:scale-105">
                  <div className="bg-[#2a2a2a] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:shadow-lg">
                    <stat.icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                  <h3 className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</h3>
                  <p className="text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                Invelar leverages cutting-edge large language models and API integrations to create 
                sophisticated automation pipelines. Our solutions don't just replace manual tasks—they 
                intelligently optimize processes, predict bottlenecks, and continuously improve performance 
                to scale your operations exponentially.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services - WITH FADE ANIMATIONS */}
      <section id="services" className="py-20 px-4 bg-[#151515] relative z-20">
        <div className="max-w-7xl mx-auto">
          <div 
            ref={servicesRef}
            className={`transition-all duration-1000 ease-out ${
              servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Our Services</h2>
            <p className="text-lg text-gray-400 text-center mb-16 max-w-3xl mx-auto">
              From intelligent automation to custom AI solutions, we provide comprehensive services 
              to transform your business operations and drive unprecedented growth.
            </p>
            
            {/* Core Services Grid */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
              {[
                {
                  icon: Workflow,
                  title: "Workflow Automation",
                  description: "We transform repetitive manual processes into intelligent, self-executing workflows. Our automation solutions reduce human error by 95% while freeing your team to focus on strategic initiatives that drive revenue growth.",
                  features: ["Process mapping & optimization", "Multi-platform integrations", "Real-time monitoring & alerts", "Scalable automation pipelines"]
                },
                {
                  icon: Bot,
                  title: "AI Agents & Assistants",
                  description: "We deploy sophisticated AI agents that learn from your business patterns and make autonomous decisions. These intelligent systems work 24/7 to optimize operations, predict bottlenecks, and continuously improve performance.",
                  features: ["Custom AI model training", "Natural language processing", "Predictive analytics", "Autonomous decision making"]
                },
                {
                  icon: MessageCircle,
                  title: "AI Chatbot Implementation",
                  description: "We revolutionize customer service with intelligent chatbots that understand context, handle complex queries, and provide personalized responses. Reduce response times by 90% while improving customer satisfaction.",
                  features: ["Multi-language support", "CRM integration", "Lead qualification", "24/7 customer support"]
                },
                {
                  icon: Globe,
                  title: "Website Creation & Optimization",
                  description: "We build high-converting, AI-powered websites that adapt to user behavior and optimize themselves for maximum engagement. Our sites integrate seamlessly with your automation ecosystem.",
                  features: ["Responsive design", "SEO optimization", "Analytics integration", "Conversion optimization"]
                },
                {
                  icon: Send,
                  title: "Automated Email Systems",
                  description: "We create intelligent email campaigns that personalize content, optimize send times, and nurture leads automatically. Increase open rates by 40% and conversions by 60% with AI-driven email automation.",
                  features: ["Behavioral triggers", "A/B testing automation", "Personalization at scale", "Advanced segmentation"]
                },
                {
                  icon: PhoneCall,
                  title: "AI Calling Systems",
                  description: "We deploy AI-powered calling systems for lead qualification, appointment setting, and customer follow-ups. Our voice AI handles thousands of calls simultaneously with human-like conversation quality.",
                  features: ["Natural voice synthesis", "Call scheduling", "Lead scoring", "CRM synchronization"]
                }
              ].map((service, index) => (
                <Card key={index} className="bg-[#2a2a2a] border-gray-700 hover:border-gray-500 transition-all duration-500 group transform hover:scale-105 hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <service.icon className="h-12 w-12 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white">{service.title}</h3>
                    <p className="text-gray-400 leading-relaxed mb-6">
                      {service.description}
                    </p>
                    <div className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 bg-white rounded-full mr-3 flex-shrink-0"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom Integrations Section */}
            <div className="bg-[#2a2a2a] rounded-2xl p-8 md:p-12 border border-gray-700">
              <div className="text-center mb-8">
                <Settings className="h-16 w-16 mx-auto text-white mb-4" />
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Custom Integrations & Solutions</h3>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                  Every business is unique. We create bespoke automation solutions that integrate seamlessly 
                  with your existing technology stack, ensuring minimal disruption while maximizing efficiency gains.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h4 className="font-semibold mb-3 text-white">API Integrations</h4>
                  <p className="text-gray-400 text-sm">We connect any software, database, or service with intelligent automation bridges</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold mb-3 text-white">Legacy System Modernization</h4>
                  <p className="text-gray-400 text-sm">We breathe new life into old systems with AI-powered automation layers</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold mb-3 text-white">Scalable Architecture</h4>
                  <p className="text-gray-400 text-sm">We provide future-proof solutions that grow with your business needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - WITH BACKGROUND AND FADE ANIMATIONS */}
      <section id="testimonials" className="py-20 px-4 relative">
        {/* Background that covers rings */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#151515] z-10" />
        
        <div className="max-w-6xl mx-auto relative z-20">
          <div 
            ref={testimonialsRef}
            className="transition-all duration-1000 ease-out"
            style={{ 
              opacity: testimonialsVisible ? testimonialsScrollFade : 0,
              transform: `translateY(${testimonialsVisible ? 0 : 48}px) scale(${0.95 + (testimonialsScrollFade * 0.05)})`
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What Our Clients Say</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  text: "Invelar transformed our customer service operations completely. What used to take our team 40 hours a week now runs automatically, and our response times improved by 85%. The ROI was evident within the first month.",
                  author: "Sarah Chen"
                },
                {
                  text: "The AI agents Invelar deployed have revolutionized our data processing workflows. We're now handling 10x the volume with the same team size, and accuracy has improved dramatically. It's like having a team that never sleeps.",
                  author: "Marcus Rodriguez"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="bg-[#2a2a2a] border-gray-700 transition-all duration-700 ease-out transform hover:scale-105 hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="border-t border-gray-600 pt-4">
                      <p className="font-semibold text-white">{testimonial.author}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - WITH FADE ANIMATIONS */}
      <section id="contact" className="py-20 px-4 bg-[#151515] relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            ref={ctaRef}
            className="transition-all duration-1000 ease-out"
            style={{ 
              opacity: ctaVisible ? ctaScrollFade : 0,
              transform: `translateY(${ctaVisible ? 0 : 48}px) scale(${0.95 + (ctaScrollFade * 0.05)})`
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Transform Your Operations?</h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Join hundreds of companies already using Invelar to automate their way to success. 
              Schedule your free consultation today and discover how AI can revolutionize your business.
            </p>
            
            <Link to="/contact">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - WITH BACKGROUND */}
      <footer className="py-12 px-4 border-t border-gray-800 relative">
        {/* Background that covers rings */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#151515] z-10" />
        
        <div className="max-w-6xl mx-auto relative z-20">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <img
                  src="/Invelar Logo.png"
                  alt="Invelar Logo"
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-4">
                Intelligent automation for the modern enterprise. Transform your business with AI.
              </p>
              <div className="flex space-x-4 relative">
                {/* Mail Button with Email Bubble */}
                <div className="relative">
                  <button
                    ref={mailButtonRef}
                    onClick={handleMailClick}
                    className="h-5 w-5 text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    <Mail className="h-5 w-5" />
                  </button>
                  
                  {/* Email Bubble */}
                  {showEmailBubble && (
                    <div
                      ref={emailBubbleRef}
                      className="absolute bottom-8 left-0 bg-[#2a2a2a] border border-gray-600 rounded-lg p-4 shadow-lg z-50 min-w-[280px] animate-in fade-in-0 zoom-in-95 duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">Contact Email</h4>
                        <button
                          onClick={handleCopyEmail}
                          className="text-gray-400 hover:text-white transition-colors duration-200"
                          title="Copy email"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-300 text-sm font-mono">invelarsolutions@gmail.com</p>
                      </div>
                      {emailCopied && (
                        <p className="text-green-400 text-xs mt-2 animate-in fade-in-0 duration-200">
                          ✓ Email copied to clipboard
                        </p>
                      )}
                      {/* Arrow pointing down to the mail icon */}
                      <div className="absolute -bottom-1 left-2 w-2 h-2 bg-[#2a2a2a] border-r border-b border-gray-600 transform rotate-45"></div>
                    </div>
                  )}
                </div>
                
                {/* Phone Button with Phone Bubble */}
                <div className="relative">
                  <button
                    ref={phoneButtonRef}
                    onClick={handlePhoneClick}
                    className="h-5 w-5 text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    <Phone className="h-5 w-5" />
                  </button>
                  
                  {/* Phone Bubble */}
                  {showPhoneBubble && (
                    <div
                      ref={phoneBubbleRef}
                      className="absolute bottom-8 left-0 bg-[#2a2a2a] border border-gray-600 rounded-lg p-4 shadow-lg z-50 min-w-[280px] animate-in fade-in-0 zoom-in-95 duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">Phone Number</h4>
                        <button
                          onClick={handleCopyPhone}
                          className="text-gray-400 hover:text-white transition-colors duration-200"
                          title="Copy phone number"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-300 text-sm font-mono">+352 691 100 088</p>
                      </div>
                      {phoneCopied && (
                        <p className="text-green-400 text-xs mt-2 animate-in fade-in-0 duration-200">
                          ✓ Phone number copied to clipboard
                        </p>
                      )}
                      {/* Arrow pointing down to the phone icon */}
                      <div className="absolute -bottom-1 left-2 w-2 h-2 bg-[#2a2a2a] border-r border-b border-gray-600 transform rotate-45"></div>
                    </div>
                  )}
                </div>
                
                <MapPin className="h-5 w-5 text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors duration-300">About</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors duration-300">Services</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors duration-300">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Invelar. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Enhanced Chatbot Component */}
      <EnhancedChatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </div>
  );
}