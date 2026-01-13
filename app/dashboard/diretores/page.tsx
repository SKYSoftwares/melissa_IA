"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  TrendingUp,
  Target,
  Award
} from "lucide-react";

interface Director {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  createdAt: string;
  managedManagers: {
    id: string;
    name: string;
    email: string;
    position: string;
    managedTeams: {
      id: string;
      name: string;
      members: {
        id: string;
        name: string;
        email: string;
        position: string;
      }[];
    }[];
  }[];
  totalManagers: number;
  totalConsultants: number;
  totalMembers: number;
}

export default function DiretoresPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      setError("Você precisa estar logado para acessar esta página.");
      return;
    }
    
    if (session) {
      fetchDirectors();
    }
  }, [session, status]);

  async function fetchDirectors() {
    try {
      setLoading(true);
      console.log("🔍 Buscando diretores...");
      
      const response = await fetch("/api/members?role=diretor", {
        credentials: "include"
      });

      console.log("📊 Status da resposta:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Dados recebidos:", data);
        setDirectors(data);
      } else {
        const errorText = await response.text();
        console.error("❌ Erro na resposta:", errorText);
        
        if (response.status === 401) {
          setError("Erro de autenticação. Por favor, faça login novamente.");
        } else if (response.status === 403) {
          setError("Acesso negado. Você não tem permissão para acessar esta página.");
        } else {
          setError(`Erro ao carregar diretores: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("❌ Erro ao buscar diretores:", error);
      setError("Erro ao carregar diretores");
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  function getTotalConsultants(director: Director) {
    return director.totalConsultants;
  }

  function getTotalManagers(director: Director) {
    return director.totalManagers;
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === "loading" ? "Carregando sessão..." : "Carregando diretores..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={fetchDirectors} variant="outline" className="mr-2">
              Tentar Novamente
            </Button>
            {error.includes("autenticação") && (
              <Button 
                onClick={() => {
                  signOut({ callbackUrl: "/login" });
                }} 
                variant="destructive"
              >
                Fazer Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Diretores</h1>
        <p className="text-gray-600">
          Visualize todos os diretores do sistema, seus gerentes e consultores
        </p>
      </div>

      {directors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum diretor encontrado
            </h3>
            <p className="text-gray-600">
              Não há diretores cadastrados no sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {directors.map((director) => (
            <Card key={director.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-lg font-semibold">
                        {getInitials(director.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        {director.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Award className="h-3 w-3 mr-1" />
                          Diretor
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Desde {formatDate(director.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getTotalManagers(director)}
                      </div>
                      <div className="text-xs text-gray-600">Gerentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {getTotalConsultants(director)}
                      </div>
                      <div className="text-xs text-gray-600">Consultores</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Informações Pessoais */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                      Informações Pessoais
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{director.email}</span>
                      </div>
                      
                      {director.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{director.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{director.position}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Estatísticas
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {getTotalManagers(director)}
                        </div>
                        <div className="text-sm text-blue-700">Gerentes</div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {getTotalConsultants(director)}
                        </div>
                        <div className="text-sm text-green-700">Consultores</div>
                      </div>
                      
                                             <div className="bg-purple-50 p-3 rounded-lg">
                         <div className="text-2xl font-bold text-purple-600">
                           {director.totalMembers}
                         </div>
                         <div className="text-sm text-purple-700">Total de Membros</div>
                       </div>
                       
                       <div className="bg-orange-50 p-3 rounded-lg">
                         <div className="text-2xl font-bold text-orange-600">
                           {director.managedManagers.length}
                         </div>
                         <div className="text-sm text-orange-700">Equipes</div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Gerentes Gerenciados */}
                {director.managedManagers.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      Gerentes Gerenciados
                    </h3>
                    
                    <div className="grid gap-4">
                      {director.managedManagers.map((manager) => (
                        <div key={manager.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-sm">
                                  {getInitials(manager.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-gray-900">{manager.name}</h4>
                                <div className="text-sm text-gray-600">{manager.email}</div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Gerente
                            </Badge>
                          </div>
                          
                          {/* Equipes do Gerente */}
                          {manager.managedTeams.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Equipes:</h5>
                              <div className="grid gap-2">
                                {manager.managedTeams.map((team) => (
                                  <div key={team.id} className="bg-white rounded border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">{team.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {team.members.length} consultores
                                      </Badge>
                                    </div>
                                    
                                    {team.members.length > 0 && (
                                      <div className="grid gap-1">
                                        {team.members.map((member) => (
                                          <div key={member.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-sm">
                                            <div className="flex items-center space-x-2">
                                              <Avatar className="h-6 w-6">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="text-xs">
                                                  {getInitials(member.name)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <div className="font-medium text-gray-900 text-xs">
                                                  {member.name}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                  {member.email}
                                                </div>
                                              </div>
                                            </div>
                                            <Badge 
                                              variant="secondary"
                                              className="bg-green-100 text-green-800 text-xs"
                                            >
                                              Consultor
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 