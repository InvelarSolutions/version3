import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Invelar's AI assistant. I'm here to help you learn about our automation services and answer any questions you might have. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to Invelar. I'm excited to help you discover how AI automation can transform your business. What specific area would you like to know more about?";
    }
    
    // Services related
    if (lowerMessage.includes('service') || lowerMessage.includes('what do you do')) {
      return "Invelar specializes in AI-powered automation solutions including:\n\n• Workflow Automation\n• AI Agents & Assistants\n• Chatbot Implementation\n• Website Creation & Optimization\n• Automated Email Systems\n• AI Calling Systems\n\nWhich of these interests you most?";
    }
    
    // Pricing related
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
      return "Our pricing is customized based on your specific needs and project scope. We offer flexible packages starting from enterprise-level solutions. The average ROI for our clients is achieved within 6 months. Would you like to schedule a free consultation to discuss your specific requirements?";
    }
    
    // Timeline related
    if (lowerMessage.includes('time') || lowerMessage.includes('how long') || lowerMessage.includes('duration')) {
      return "Implementation timelines vary by project complexity, but we pride ourselves on rapid deployment. Most projects are completed in 2-8 weeks, compared to traditional 3-6 month timelines. We'll provide a detailed timeline during your consultation.";
    }
    
    // ROI related
    if (lowerMessage.includes('roi') || lowerMessage.includes('return') || lowerMessage.includes('benefit')) {
      return "Our clients typically see:\n\n• 30% cost reduction\n• 50+ hours saved weekly\n• 300% productivity increase\n• 95% reduction in human error\n• Average 6-month payback period\n\nWould you like to see how these benefits could apply to your specific business?";
    }
    
    // Getting started
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('get started')) {
      return "Great! Getting started is easy:\n\n1. Schedule a free 30-minute consultation\n2. We'll analyze your current processes\n3. Receive a custom automation proposal\n4. Begin implementation with our expert team\n\nWould you like me to direct you to our contact form to schedule your consultation?";
    }
    
    // Contact related
    if (lowerMessage.includes('contact') || lowerMessage.includes('talk') || lowerMessage.includes('speak')) {
      return "I'd be happy to connect you with our team! You can:\n\n• Fill out our contact form for a detailed consultation\n• Email us at invelarsolutions@gmail.com\n• Call us at +352 691 100 088\n\nOur team typically responds within 24 hours. Would you like me to guide you to our contact page?";
    }
    
    // Industry specific
    if (lowerMessage.includes('industry') || lowerMessage.includes('sector')) {
      return "We work across multiple industries including:\n\n• Technology & Software\n• Healthcare\n• Finance & Banking\n• Retail & E-commerce\n• Manufacturing\n• Education\n• Real Estate\n• Consulting\n\nEach solution is tailored to industry-specific needs and compliance requirements. What industry are you in?";
    }
    
    // AI/Automation specific
    if (lowerMessage.includes('ai') || lowerMessage.includes('automation') || lowerMessage.includes('artificial intelligence')) {
      return "Our AI automation solutions leverage cutting-edge technologies including:\n\n• Large Language Models (LLMs)\n• Natural Language Processing\n• Machine Learning algorithms\n• Predictive analytics\n• Intelligent process automation\n\nWe focus on practical, business-ready AI that delivers immediate value. What processes are you looking to automate?";
    }
    
    // Default response
    return "That's a great question! I'd love to provide you with detailed information about that. For the most comprehensive answer, I'd recommend speaking with one of our automation specialists who can give you specific insights tailored to your needs. Would you like me to help you schedule a consultation?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <Card className="w-full max-w-md h-[600px] bg-[#2a2a2a] border-gray-700 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Invelar Assistant</h3>
              <p className="text-xs text-gray-400">AI Automation Expert</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex flex-col h-[500px] p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`rounded-full p-2 ${message.sender === 'user' ? 'bg-white' : 'bg-gray-600'}`}>
                    {message.sender === 'user' ? (
                      <User className="h-3 w-3 text-black" />
                    ) : (
                      <Bot className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-white text-black'
                        : 'bg-[#1a1a1a] text-white border border-gray-600'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="rounded-full p-2 bg-gray-600">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-lg p-3 bg-[#1a1a1a] border border-gray-600">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about AI automation..."
                className="bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-white text-black hover:bg-gray-100"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}