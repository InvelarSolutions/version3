"use client";

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
      text: "Hello! I'm Invelar's AI assistant. I'm here to help you learn about our intelligent automation solutions. How can I assist you today?",
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
    
    // Services related responses
    if (lowerMessage.includes('service') || lowerMessage.includes('what do you do') || lowerMessage.includes('automation')) {
      return "Invelar offers comprehensive AI automation services including:\n\n• Workflow Automation - Transform manual processes into intelligent workflows\n• AI Agents & Assistants - Deploy autonomous AI systems\n• AI Chatbot Implementation - Revolutionize customer service\n• Website Creation & Optimization - Build high-converting, AI-powered sites\n• Automated Email Systems - Intelligent email campaigns\n• AI Calling Systems - Voice AI for lead qualification\n\nWould you like to know more about any specific service?";
    }
    
    // Pricing related responses
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      return "Our pricing is customized based on your specific automation needs and business requirements. We offer:\n\n• Free initial consultation (30 minutes)\n• Custom proposals with clear ROI projections\n• Flexible implementation timelines\n• Average 6-month payback period\n\nI'd recommend scheduling a consultation to discuss your specific needs and get a tailored quote. Would you like me to help you get started?";
    }
    
    // Contact related responses
    if (lowerMessage.includes('contact') || lowerMessage.includes('reach') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return "You can reach Invelar through:\n\n📧 Email: invelarsolutions@gmail.com\n📞 Phone: +352 691 100 088\n\nOr you can click the 'Get Started' button on our website to schedule a free consultation. Our team typically responds within 24 hours. How would you prefer to connect?";
    }
    
    // Benefits related responses
    if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage') || lowerMessage.includes('why') || lowerMessage.includes('roi')) {
      return "Invelar's AI automation delivers measurable results:\n\n📈 30% average cost reduction\n⏰ 50+ hours saved weekly\n🚀 300% productivity increase\n✅ 95% reduction in human error\n⚡ 6-month average payback period\n\nOur solutions work 24/7, continuously optimize themselves, and scale with your business. Plus, we provide comprehensive analytics to track your ROI. What specific challenges are you looking to solve?";
    }
    
    // Getting started responses
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('how') || lowerMessage.includes('process')) {
      return "Getting started with Invelar is simple:\n\n1️⃣ **Initial Consultation** - Free 30-minute call to understand your needs\n2️⃣ **Custom Proposal** - Tailored automation strategy with ROI projections\n3️⃣ **Implementation** - Our expert team builds your solution with regular updates\n\nThe process typically takes 2-8 weeks depending on complexity. Ready to transform your business? Click 'Get Started' on our website or contact us directly!";
    }
    
    // Company information
    if (lowerMessage.includes('about') || lowerMessage.includes('company') || lowerMessage.includes('invelar')) {
      return "Invelar is a leading AI automation company dedicated to democratizing enterprise-grade automation for businesses of all sizes. We:\n\n🎯 **Mission**: Make cutting-edge AI automation accessible to every business\n🔮 **Vision**: Create a world where businesses operate with unprecedented efficiency\n🏆 **Track Record**: 500+ successful implementations across diverse industries\n⚡ **Expertise**: AI specialists, automation engineers, and industry veterans\n\nWe're not just service providers—we're strategic partners in your digital transformation journey.";
    }
    
    // Technology related responses
    if (lowerMessage.includes('technology') || lowerMessage.includes('ai') || lowerMessage.includes('tech') || lowerMessage.includes('how it works')) {
      return "Invelar leverages cutting-edge technology:\n\n🤖 **Large Language Models** - Advanced AI for intelligent decision making\n🔗 **API Integrations** - Connect any software or database\n🛡️ **Enterprise Security** - Bank-level security protocols\n📊 **Real-time Analytics** - Comprehensive performance tracking\n🔄 **Self-optimizing Systems** - Continuously improve performance\n\nOur solutions integrate seamlessly with your existing tech stack. What systems are you currently using?";
    }
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Great to meet you! I'm here to help you discover how Invelar can transform your business with AI automation. Whether you're looking to:\n\n• Reduce operational costs\n• Increase productivity\n• Automate repetitive tasks\n• Improve customer service\n• Scale your operations\n\nI'm here to guide you. What would you like to know about Invelar's solutions?";
    }
    
    // Default response
    return "That's a great question! I'd be happy to help you learn more about Invelar's AI automation solutions. Here are some topics I can assist with:\n\n• Our automation services and capabilities\n• Pricing and ROI information\n• Getting started process\n• Technology and integrations\n• Contact information\n• Company background\n\nWhat specific aspect of Invelar would you like to explore? Or feel free to ask me anything else about AI automation!";
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
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Container */}
      <Card className="relative w-96 h-[600px] bg-[#2a2a2a] border-gray-700 shadow-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Invelar AI Assistant</h3>
              <p className="text-gray-400 text-sm">Always here to help</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-white text-black'
                    : 'bg-[#1a1a1a] text-white border border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'bot' && (
                    <Bot className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  {message.sender === 'user' && (
                    <User className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {message.text}
                    </p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-gray-400" />
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
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Invelar's AI automation..."
              className="flex-1 bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI responses are for informational purposes. Contact us directly for detailed assistance.
          </p>
        </div>
      </Card>
    </div>
  );
}