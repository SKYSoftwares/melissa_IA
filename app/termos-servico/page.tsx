"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Shield,
  Globe,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function TermosServicoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
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
                  Termos de Serviço
                </h1>
                <p className="text-gray-600 text-sm">Dr. Zeus Capital - CRM</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
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
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Termos de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Estes Termos de Serviço ("Termos") regem o uso do sistema CRM
                  da Dr. Zeus Capital ("Serviço", "Plataforma", "Sistema"). Ao
                  utilizar nosso serviço, você concorda com estes termos.
                </p>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-purple-800">
                      Última atualização:{" "}
                      {new Date().toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Estes termos são efetivos a partir da data mencionada acima.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aceitação dos Termos */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Aceitação dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Ao acessar e utilizar nosso sistema CRM, você declara que:
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Leu, compreendeu e concorda com estes Termos de Serviço
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Possui capacidade legal para celebrar este acordo
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Utilizará o serviço em conformidade com a legislação
                        aplicável
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        É responsável por todas as atividades realizadas em sua
                        conta
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrição do Serviço */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Descrição do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Nosso sistema CRM oferece as seguintes funcionalidades:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Gestão de Leads
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Cadastro e organização de contatos</li>
                        <li>• Acompanhamento de oportunidades</li>
                        <li>• Histórico de interações</li>
                        <li>• Segmentação e tags</li>
                      </ul>
                    </div>

                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                      <h4 className="font-semibold text-teal-900 mb-2">
                        Comunicação
                      </h4>
                      <ul className="text-sm text-teal-700 space-y-1">
                        <li>• Integração com WhatsApp</li>
                        <li>• Agendamento de reuniões</li>
                        <li>• Notificações automáticas</li>
                        <li>• Templates de mensagens</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Propostas e Vendas
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Criação de propostas</li>
                        <li>• Simuladores financeiros</li>
                        <li>• Acompanhamento de vendas</li>
                        <li>• Relatórios de performance</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        Colaboração
                      </h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Gestão de equipe</li>
                        <li>• Compartilhamento de dados</li>
                        <li>• Controle de permissões</li>
                        <li>• Treinamento e suporte</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsabilidades do Usuário */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Responsabilidades do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Como usuário do sistema, você se compromete a:
                </p>

                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      Uso Adequado
                    </h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>
                        • Utilizar o sistema apenas para fins legítimos de
                        negócio
                      </li>
                      <li>• Não compartilhar credenciais de acesso</li>
                      <li>• Manter informações atualizadas e precisas</li>
                      <li>• Respeitar a privacidade de terceiros</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Proibições
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Não utilizar o sistema para atividades ilegais</li>
                      <li>
                        • Não tentar acessar dados de outros usuários sem
                        autorização
                      </li>
                      <li>• Não interferir no funcionamento do sistema</li>
                      <li>• Não fazer engenharia reversa do software</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitações e Disclaimers */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Limitações e Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Disponibilidade do Serviço
                  </h4>
                  <p className="text-sm text-gray-700">
                    Embora nos esforcemos para manter o serviço disponível 24/7,
                    não garantimos disponibilidade ininterrupta. Podemos
                    realizar manutenções programadas ou enfrentar interrupções
                    técnicas.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Limitação de Responsabilidade
                  </h4>
                  <p className="text-sm text-slate-700">
                    Nossa responsabilidade é limitada ao valor pago pelo
                    serviço. Não nos responsabilizamos por danos indiretos,
                    lucros cessantes ou perda de dados decorrentes do uso do
                    sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modificações */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Modificações dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Reservamo-nos o direito de modificar estes Termos a qualquer
                  momento. As alterações entrarão em vigor imediatamente após a
                  publicação.
                </p>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">
                    Notificação de Mudanças
                  </h4>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>
                      • Notificaremos sobre mudanças significativas por e-mail
                    </li>
                    <li>• Publicaremos atualizações nesta página</li>
                    <li>
                      • O uso continuado constitui aceitação dos novos termos
                    </li>
                    <li>
                      • Você pode rescindir o serviço se não concordar com as
                      mudanças
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Contato e Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Para dúvidas sobre estes Termos de Serviço ou suporte técnico:
                </p>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    Informações de Contato
                  </h4>
                  <div className="space-y-2 text-sm text-purple-700">
                    <p>
                      <strong>E-mail:</strong> contato@drzeuscapital.com.br
                    </p>
                    <p>
                      <strong>Telefone:</strong> +55 (41) 99934-4641
                    </p>
                    <p>
                      <strong>Horário:</strong> Segunda a Sexta, 9h às 18h
                    </p>
                    <p>
                      <strong>Endereço:</strong> Curitiba, PR - Brasil
                    </p>
                  </div>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="text-sm text-pink-700">
                    <strong>Importante:</strong> Estes termos são regidos pelas
                    leis brasileiras. Qualquer disputa será resolvida nos
                    tribunais competentes de Curitiba, PR.
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
