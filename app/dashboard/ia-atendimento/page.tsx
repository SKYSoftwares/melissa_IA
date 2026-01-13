"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Lightbulb, 
  MessageCircle,
  Sparkles,
  Settings,
  BookOpen,
  HelpCircle,
  Shield,
  Users,
  Building
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'document' | 'suggestion';
}

interface AIDocumentation {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: Date;
}

export default function IAAttendancePage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `🏠 **Oi! Sou a IA de atendimento da Dr. Zeus Capital! 😄**

Sou especialista em **Home Equity** e estou aqui pra te ajudar com qualquer dúvida sobre nossos produtos!

**Posso te explicar sobre:**
💡 Como funciona o Home Equity
💡 Quem pode contratar
💡 Quais imóveis são aceitos
💡 Benefícios e vantagens
💡 Condições e valores
💡 Segurança e proteções
💡 Documentação necessária
💡 Como funciona o processo
💡 Perfis de cliente
💡 Sobre nossa empresa

**Me conta:** qual é a dúvida do seu cliente? Assim posso te dar uma resposta direta e útil! 🎯

(PS: Sou bem mais conversacional que outras IAs, prometo! 😉)`,
      role: 'assistant',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [showDocumentation, setShowDocumentation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Categorias de documentação
  const categories = [
    { id: 'todas', label: 'Todas', icon: BookOpen },
    { id: 'produtos', label: 'Produtos', icon: FileText },
    { id: 'politicas', label: 'Políticas', icon: HelpCircle },
    { id: 'procedimentos', label: 'Procedimentos', icon: Lightbulb },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'perfis', label: 'Perfis', icon: Users },
    { id: 'empresa', label: 'Empresa', icon: Building }
  ];

  // Documentação da API
  const [documentation, setDocumentation] = useState<AIDocumentation[]>([]);
  const [documentationLoading, setDocumentationLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Carregar documentação da API
  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const response = await fetch('/api/ai-documentation', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setDocumentation(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar documentação:', error);
      } finally {
        setDocumentationLoading(false);
      }
    };

    fetchDocumentation();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simular resposta da IA baseada na documentação
      const aiResponse = await generateAIResponse(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userQuestion: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userQuestion }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro na API');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Erro ao comunicar com a IA:', error);
      return 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredDocumentation = selectedCategory === 'todas' 
    ? documentation 
    : documentation.filter(doc => doc.category === selectedCategory);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar da Documentação */}
      <div className={`w-80 bg-white border-r border-gray-200 transition-all duration-300 ${showDocumentation ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Documentação Home Equity</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDocumentation(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          
          {/* Filtros por categoria */}
          <div className="space-y-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="w-full justify-start"
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-3">
            {documentationLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : filteredDocumentation.length > 0 ? (
              filteredDocumentation.map((doc) => (
                <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-800 mb-1">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {doc.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(doc.lastUpdated).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma documentação encontrada</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  IA de Atendimento - Home Equity
                </h1>
                <p className="text-sm text-gray-600">
                  Assistente especializado em Home Equity da Dr. Zeus Capital
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentation(!showDocumentation)}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {showDocumentation ? 'Ocultar' : 'Documentação Home Equity'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
            </div>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`p-2 rounded-full ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-line">{message.content}</div>
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">IA está digitando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input de Mensagem */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta sobre Home Equity..."
                  className="min-h-[44px] resize-none"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Pressione Enter para enviar</span>
                    <span>•</span>
                    <span>Shift+Enter para nova linha</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA Ativa
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 h-[44px] bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 