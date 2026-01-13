"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, FileText, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Site
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Política de Privacidade
                </h1>
                <p className="text-gray-600 text-sm">Dr. Zeus Capital - CRM</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Legal
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Introdução */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Política de Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Esta Política de Privacidade descreve como o Dr. Zeus Capital
                  ("nós", "nosso" ou "empresa") coleta, usa e protege suas
                  informações quando você utiliza nosso sistema CRM.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Última atualização:{" "}
                      {new Date().toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Esta política é efetiva a partir da data mencionada acima.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Coletadas */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações que Coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Informações Pessoais
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Nome completo e dados de contato</li>
                    <li>Endereço de e-mail</li>
                    <li>Número de telefone</li>
                    <li>Informações de perfil profissional</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Dados de Uso
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Logs de acesso ao sistema</li>
                    <li>Atividades realizadas na plataforma</li>
                    <li>Preferências de configuração</li>
                    <li>Dados de navegação e interação</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Como Usamos */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Como Utilizamos suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      Operações do Sistema
                    </h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Gerenciamento de leads e contatos</li>
                      <li>• Agendamento de reuniões</li>
                      <li>• Comunicação via WhatsApp</li>
                      <li>• Geração de propostas</li>
                    </ul>
                  </div>

                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <h4 className="font-semibold text-pink-900 mb-2">
                      Melhorias do Serviço
                    </h4>
                    <ul className="text-sm text-pink-700 space-y-1">
                      <li>• Análise de uso da plataforma</li>
                      <li>• Desenvolvimento de novas funcionalidades</li>
                      <li>• Otimização da experiência do usuário</li>
                      <li>• Suporte técnico</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compartilhamento de Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Não vendemos, alugamos ou compartilhamos suas informações
                  pessoais com terceiros, exceto nas seguintes situações:
                </p>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Exceções Legais
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Quando exigido por lei ou ordem judicial</li>
                    <li>• Para proteger nossos direitos legais</li>
                    <li>• Com seu consentimento explícito</li>
                    <li>
                      • Para prestadores de serviços confiáveis (sob acordos de
                      confidencialidade)
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Implementamos medidas de segurança técnicas e organizacionais
                  para proteger suas informações:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Criptografia SSL/TLS
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Controle de acesso
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Backup seguro
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Monitoramento 24/7
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Atualizações de segurança
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Treinamento da equipe
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contato e Direitos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Você tem o direito de acessar, corrigir, atualizar ou excluir
                  suas informações pessoais. Para exercer esses direitos ou
                  esclarecer dúvidas sobre esta política:
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Informações de Contato
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>E-mail:</strong> contato@drzeuscapital.com.br
                    </p>
                    <p>
                      <strong>Telefone:</strong> +55 (41) 99934-4641
                    </p>
                    <p>
                      <strong>Endereço:</strong> Curitiba, PR - Brasil
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Importante:</strong> Esta política pode ser
                    atualizada periodicamente. Recomendamos que você revise esta
                    página regularmente para se manter informado sobre como
                    protegemos suas informações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Dr. Zeus Capital</h3>
              <p className="text-gray-400 text-sm">Sistema CRM</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/termos-servico"
                className="text-gray-400 hover:text-white text-sm"
              >
                Termos de Serviço
              </Link>
              <Link
                href="/politica-privacidade"
                className="text-gray-400 hover:text-white text-sm"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
