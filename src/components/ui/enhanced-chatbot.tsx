import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isMarkdown?: boolean;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationContext {
  topics: string[];
  userPreferences: Record<string, any>;
  previousQuestions: string[];
  conversationFlow: string;
}

export function EnhancedChatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Invelar's AI assistant. I'm here to help you learn about our intelligent automation solutions and answer any questions you might have. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      isMarkdown: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    topics: [],
    userPreferences: {},
    previousQuestions: [],
    conversationFlow: 'initial'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced AI response generation with context awareness
  const generateAIResponse = (userMessage: string, context: ConversationContext): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Update conversation context
    const newTopics = [...context.topics];
    const newQuestions = [...context.previousQuestions, userMessage];
    
    // Detect topics and intent
    const detectedTopics = detectTopics(lowerMessage);
    detectedTopics.forEach(topic => {
      if (!newTopics.includes(topic)) {
        newTopics.push(topic);
      }
    });

    // Update context for next interaction
    setConversationContext({
      ...context,
      topics: newTopics,
      previousQuestions: newQuestions.slice(-5), // Keep last 5 questions
      conversationFlow: determineConversationFlow(lowerMessage, context)
    });

    // Generate contextual response
    return generateContextualResponse(lowerMessage, {
      ...context,
      topics: newTopics,
      previousQuestions: newQuestions
    });
  };

  const detectTopics = (message: string): string[] => {
    const topics = [];
    
    if (message.includes('price') || message.includes('cost') || message.includes('budget') || message.includes('pricing')) {
      topics.push('pricing');
    }
    if (message.includes('service') || message.includes('automation') || message.includes('ai')) {
      topics.push('services');
    }
    if (message.includes('time') || message.includes('duration') || message.includes('how long')) {
      topics.push('timeline');
    }
    if (message.includes('contact') || message.includes('reach') || message.includes('talk')) {
      topics.push('contact');
    }
    if (message.includes('industry') || message.includes('sector') || message.includes('business')) {
      topics.push('industry');
    }
    if (message.includes('roi') || message.includes('return') || message.includes('benefit')) {
      topics.push('benefits');
    }
    if (message.includes('start') || message.includes('begin') || message.includes('get started')) {
      topics.push('getting_started');
    }
    
    return topics;
  };

  const determineConversationFlow = (message: string, context: ConversationContext): string => {
    if (context.conversationFlow === 'initial' && context.topics.length > 0) {
      return 'engaged';
    }
    if (context.topics.includes('pricing') && context.topics.includes('services')) {
      return 'qualified_lead';
    }
    if (context.topics.includes('getting_started') || context.topics.includes('contact')) {
      return 'ready_to_convert';
    }
    return context.conversationFlow;
  };

  const generateContextualResponse = (message: string, context: ConversationContext): string => {
    const lowerMessage = message.toLowerCase();
    
    // Context-aware greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      if (context.conversationFlow === 'initial') {
        return "Hello! Welcome to Invelar. I'm excited to help you discover how AI automation can transform your business. What specific area would you like to know more about?\n\n**Popular topics:**\n• Automation Services\n• Pricing & ROI\n• Implementation Timeline\n• Industry Solutions";
      } else {
        return "Hello again! I see we've been discussing some interesting topics. Is there anything specific you'd like to dive deeper into, or do you have new questions about Invelar's automation solutions?";
      }
    }
    
    // Services with context awareness
    if (lowerMessage.includes('service') || lowerMessage.includes('what do you do') || lowerMessage.includes('automation')) {
      let response = "Invelar specializes in **AI-powered automation solutions** including:\n\n";
      response += "🔄 **Workflow Automation** - Transform manual processes into intelligent workflows\n";
      response += "🤖 **AI Agents & Assistants** - Deploy autonomous AI systems\n";
      response += "💬 **AI Chatbot Implementation** - Revolutionize customer service\n";
      response += "🌐 **Website Creation & Optimization** - Build high-converting, AI-powered sites\n";
      response += "📧 **Automated Email Systems** - Intelligent email campaigns\n";
      response += "📞 **AI Calling Systems** - Voice AI for lead qualification\n\n";
      
      if (context.topics.includes('pricing')) {
        response += "Since you've asked about pricing before, I can tell you that our solutions typically pay for themselves within **6 months** through efficiency gains.";
      } else if (context.topics.includes('industry')) {
        response += "We customize these solutions for your specific industry needs and compliance requirements.";
      } else {
        response += "Which of these services interests you most? I can provide detailed information about implementation and benefits.";
      }
      
      return response;
    }
    
    // Pricing with context and personalization
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing') || lowerMessage.includes('budget')) {
      let response = "Our pricing is **customized** based on your specific needs and project scope. Here's what you can expect:\n\n";
      response += "💰 **Investment Range:** Enterprise-level solutions with flexible packages\n";
      response += "📈 **ROI Timeline:** Average 6-month payback period\n";
      response += "🎯 **Value Delivered:** 30% cost reduction, 300% productivity increase\n";
      response += "🆓 **Free Consultation:** 30-minute strategy session\n\n";
      
      if (context.topics.includes('services')) {
        response += "Based on our previous discussion about services, I'd recommend scheduling a consultation to get a tailored quote for the specific automation solutions you're interested in.";
      } else if (context.conversationFlow === 'qualified_lead') {
        response += "Since you're exploring multiple aspects of our solutions, you'd be a perfect candidate for our **free consultation** where we can provide specific ROI projections for your business.";
      } else {
        response += "Would you like me to help you schedule a **free consultation** to discuss your specific requirements and get a tailored quote?";
      }
      
      return response;
    }
    
    // Timeline with context
    if (lowerMessage.includes('time') || lowerMessage.includes('how long') || lowerMessage.includes('duration') || lowerMessage.includes('timeline')) {
      let response = "**Implementation timelines** vary by project complexity, but we pride ourselves on rapid deployment:\n\n";
      response += "⚡ **Typical Range:** 2-8 weeks (vs. traditional 3-6 months)\n";
      response += "🚀 **Simple Automations:** 1-2 weeks\n";
      response += "🏗️ **Complex Integrations:** 4-8 weeks\n";
      response += "📊 **Enterprise Solutions:** 6-12 weeks\n\n";
      
      if (context.topics.includes('services')) {
        response += "The specific timeline depends on which services you're implementing. For example, chatbot deployment is typically faster than full workflow automation.";
      } else if (context.topics.includes('pricing')) {
        response += "Remember, faster implementation means you start seeing ROI sooner - typically within the first month of deployment.";
      } else {
        response += "We'll provide a **detailed timeline** during your consultation based on your specific automation needs.";
      }
      
      return response;
    }
    
    // ROI and benefits with enhanced detail
    if (lowerMessage.includes('roi') || lowerMessage.includes('return') || lowerMessage.includes('benefit') || lowerMessage.includes('value')) {
      let response = "Our clients consistently see **measurable results**:\n\n";
      response += "📉 **30% average cost reduction**\n";
      response += "⏰ **50+ hours saved weekly**\n";
      response += "🚀 **300% productivity increase**\n";
      response += "✅ **95% reduction in human error**\n";
      response += "💰 **6-month average payback period**\n";
      response += "🔄 **24/7 automated operations**\n\n";
      
      if (context.topics.includes('industry')) {
        response += "These benefits are consistent across industries, though the specific impact varies. In your industry, we typically see even stronger results in areas like process optimization and compliance automation.";
      } else if (context.conversationFlow === 'qualified_lead') {
        response += "**Ready to see these results in your business?** Our free consultation includes a custom ROI projection based on your current processes.";
      } else {
        response += "What specific challenges are you looking to solve? I can explain how our automation addresses those pain points.";
      }
      
      return response;
    }
    
    // Getting started with progressive engagement
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('get started') || lowerMessage.includes('next steps')) {
      let response = "**Getting started** with Invelar is simple and risk-free:\n\n";
      response += "1️⃣ **Free Consultation** (30 minutes)\n   • Understand your current processes\n   • Identify automation opportunities\n   • Discuss your goals and challenges\n\n";
      response += "2️⃣ **Custom Proposal**\n   • Tailored automation strategy\n   • Clear ROI projections\n   • Detailed implementation plan\n\n";
      response += "3️⃣ **Implementation**\n   • Expert team builds your solution\n   • Regular progress updates\n   • Comprehensive testing and training\n\n";
      
      if (context.conversationFlow === 'ready_to_convert') {
        response += "🎯 **You seem ready to move forward!** Would you like me to direct you to our contact form to schedule your consultation right now?";
      } else if (context.topics.length > 2) {
        response += "Based on our conversation, you'd be perfect for our consultation. **Ready to take the next step?**";
      } else {
        response += "**No commitment required** for the consultation - it's completely free and provides valuable insights even if you decide not to proceed.";
      }
      
      return response;
    }
    
    // Contact with smart routing
    if (lowerMessage.includes('contact') || lowerMessage.includes('talk') || lowerMessage.includes('speak') || lowerMessage.includes('call')) {
      let response = "I'd be happy to connect you with our team! **Multiple ways to reach us:**\n\n";
      response += "📧 **Email:** invelarsolutions@gmail.com\n";
      response += "📞 **Phone:** +352 691 100 088\n";
      response += "📝 **Contact Form:** Detailed consultation request\n";
      response += "⚡ **Response Time:** Within 24 hours\n\n";
      
      if (context.conversationFlow === 'qualified_lead' || context.topics.length > 2) {
        response += "**Recommended:** Use our contact form for the fastest response. Based on our conversation, you're ready for a detailed consultation, and the form helps our team prepare specifically for your needs.";
      } else {
        response += "**Tip:** The contact form is best for detailed inquiries, while email/phone work great for quick questions.";
      }
      
      response += "\n\nWould you like me to guide you to our contact page?";
      return response;
    }
    
    // Industry-specific responses
    if (lowerMessage.includes('industry') || lowerMessage.includes('sector') || lowerMessage.includes('vertical')) {
      let response = "We work across **multiple industries**, each with tailored solutions:\n\n";
      response += "🏥 **Healthcare** - HIPAA compliance, patient workflow automation\n";
      response += "🏦 **Finance** - Regulatory compliance, risk management automation\n";
      response += "🛒 **Retail** - Inventory management, customer service automation\n";
      response += "🏭 **Manufacturing** - Supply chain optimization, quality control\n";
      response += "💼 **Professional Services** - Client onboarding, project management\n";
      response += "🎓 **Education** - Student management, administrative automation\n\n";
      
      if (context.topics.includes('services')) {
        response += "Each solution is customized for industry-specific needs and compliance requirements. What industry are you in? I can share specific examples relevant to your sector.";
      } else {
        response += "**What industry are you in?** I can provide specific examples of how we've helped similar businesses and what results they've achieved.";
      }
      
      return response;
    }
    
    // Technology and AI-specific questions
    if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence') || lowerMessage.includes('technology') || lowerMessage.includes('how it works')) {
      let response = "Invelar leverages **cutting-edge AI technology**:\n\n";
      response += "🧠 **Large Language Models** - Advanced AI for intelligent decision making\n";
      response += "🔗 **API Integrations** - Connect any software or database seamlessly\n";
      response += "🛡️ **Enterprise Security** - Bank-level security protocols\n";
      response += "📊 **Real-time Analytics** - Comprehensive performance tracking\n";
      response += "🔄 **Self-optimizing Systems** - Continuously improve performance\n";
      response += "☁️ **Cloud-native Architecture** - Scalable and reliable infrastructure\n\n";
      
      if (context.topics.includes('services')) {
        response += "These technologies power all our automation services, ensuring they're not just automated, but truly intelligent and adaptive.";
      } else {
        response += "**What systems are you currently using?** Our solutions integrate seamlessly with existing tech stacks.";
      }
      
      return response;
    }
    
    // Follow-up and clarification responses
    if (lowerMessage.includes('tell me more') || lowerMessage.includes('explain') || lowerMessage.includes('details')) {
      if (context.topics.length > 0) {
        const lastTopic = context.topics[context.topics.length - 1];
        return `I'd be happy to provide more details! Based on our conversation, you seem most interested in **${lastTopic}**. What specific aspect would you like me to elaborate on?\n\nOr feel free to ask about anything else - I'm here to help!`;
      }
    }
    
    // Intelligent default response with context
    if (context.conversationFlow === 'ready_to_convert') {
      return "That's a great question! Since you seem ready to move forward, I'd recommend speaking with one of our automation specialists who can give you detailed, personalized answers.\n\n**Would you like me to help you schedule a consultation?** They can address your specific questions and provide tailored solutions for your business.";
    } else if (context.topics.length > 0) {
      return `Excellent question! I can help with that. Based on our conversation about **${context.topics.join(', ')}**, here are some related topics I can assist with:\n\n• Detailed implementation processes\n• ROI calculations and projections\n• Integration with existing systems\n• Industry-specific solutions\n• Next steps and consultation scheduling\n\n**What would you like to explore further?**`;
    } else {
      return "That's a great question! I'd be happy to help you learn more about Invelar's AI automation solutions. Here are some topics I can assist with:\n\n• **Our automation services** and capabilities\n• **Pricing and ROI** information\n• **Getting started** process\n• **Technology and integrations**\n• **Contact information**\n• **Company background**\n\n**What specific aspect of Invelar would you like to explore?** Or feel free to ask me anything else about AI automation!";
    }
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

    // Simulate realistic typing delay based on response complexity
    const baseDelay = 1000;
    const complexityDelay = Math.min(inputValue.length * 50, 2000);
    const totalDelay = baseDelay + complexityDelay + (Math.random() * 1000);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputValue, conversationContext),
        sender: 'bot',
        timestamp: new Date(),
        isMarkdown: true
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, totalDelay);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatMessage = (text: string): JSX.Element => {
    // Simple markdown-like formatting
    const formatText = (str: string) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded text-sm">$1</code>')
        .replace(/\n/g, '<br>');
    };

    return (
      <div 
        className="whitespace-pre-line leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatText(text) }}
      />
    );
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
              <p className="text-gray-400 text-sm">
                {isTyping ? 'Thinking...' : 'Always here to help'}
              </p>
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
                className={`max-w-[85%] rounded-lg p-3 group relative ${
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
                    {message.isMarkdown ? (
                      formatMessage(message.text)
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.text}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        message.sender === 'user' ? 'text-gray-600' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {message.sender === 'bot' && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(message.text)}
                            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                            title="Copy message"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-green-400 transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-red-400 transition-colors"
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Enhanced Typing Indicator */}
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
                  <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Enhanced Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Invelar's AI automation..."
              className="flex-1 bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-400 focus:border-gray-400"
              disabled={isTyping}
              maxLength={500}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Enhanced AI • Context-aware responses
            </p>
            <p className="text-xs text-gray-500">
              {inputValue.length}/500
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}