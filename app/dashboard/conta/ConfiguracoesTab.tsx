'use client';

import { AvatarUploader } from '@/components/account/AvatarUploader';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Loader2, Save, User } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

export function ConfiguracoesTab({ user }: { user: any }) {
    // Estados para dados pessoais
    const [personalData, setPersonalData] = React.useState({
        name: '',
        email: '',
        position: '',
        phone: '',
        cpf: '',
        birthDate: '',
        address: '',
    });

    // Estados para dados da clínica
    const [companyData, setCompanyData] = React.useState({
        companyName: '',
        companyCnpj: '',
        companyPhone: '',
        companyEmail: '',
        companyAddress: '',
        companyWebsite: '',
        companyDescription: '',
        companyLogo: '',
        companySize: '',
        companySector: '',
        companyFounded: '',
        companyRevenue: '',
        companyEmployees: '',
    });

    const [loading, setLoading] = React.useState(false);
    const [initialLoading, setInitialLoading] = React.useState(true);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState('');
    const [userData, setUserData] = React.useState<any>(null);

    React.useEffect(() => {
        fetchUserData();
    }, []);

    async function fetchUserData() {
        try {
            setInitialLoading(true);
            const res = await fetch('/api/account/edit');
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    const userData = data.user;
                    setUserData(userData);

                    setPersonalData({
                        name: userData.name || '',
                        email: userData.email || '',
                        position: userData.position || '',
                        phone: userData.phone || '',
                        cpf: userData.cpf || '',
                        birthDate: userData.birthDate || '',
                        address: userData.address || '',
                    });

                    setCompanyData({
                        companyName: userData.companyName || '',
                        companyCnpj: userData.companyCnpj || '',
                        companyPhone: userData.companyPhone || '',
                        companyEmail: userData.companyEmail || '',
                        companyAddress: userData.companyAddress || '',
                        companyWebsite: userData.companyWebsite || '',
                        companyDescription: userData.companyDescription || '',
                        companyLogo: userData.companyLogo || '',
                        companySize: userData.companySize || '',
                        companySector: userData.companySector || '',
                        companyFounded: userData.companyFounded || '',
                        companyRevenue: userData.companyRevenue || '',
                        companyEmployees: userData.companyEmployees || '',
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            toast.error('Erro ao carregar dados do profissional');
        } finally {
            setInitialLoading(false);
        }
    }

    async function saveUserData() {
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/account/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...personalData,
                    ...companyData,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                toast.success('Configurações salvas com sucesso!');
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const errorData = await res.json();
                const msg = errorData.error || 'Erro ao salvar dados';
                setError(msg);
                toast.error(msg);
            }
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            setError('Erro ao salvar dados');
            toast.error('Erro ao salvar dados');
        } finally {
            setLoading(false);
        }
    }

    if (initialLoading) {
        return (
            <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center justify-center py-16">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
                        <span className="text-sm text-muted-foreground">
                            Carregando informações da sua conta profissional...
                        </span>
                    </div>
                </div>
            </TabsContent>
        );
    }

    return (
        <TabsContent
            value="settings"
            className="space-y-4 relative sky/40 rounded-xl p-4 md:p-6"
        >
            <div className="space-y-6">
                {/* Dados Pessoais */}
                <Card className="border-sky-100 shadow-sm">
                    <CardHeader className="border-b sky/60">
                        <CardTitle className="flex items-center space-x-2 text-sky-900">
                            <User className="w-5 h-5 text-sky-700" />
                            <span>Dados Pessoais</span>
                        </CardTitle>
                        <CardDescription className="text-sm text-sky-800/70">
                            Configure suas informações como profissional de
                            saúde. Esses dados podem aparecer em prontuários,
                            prescrições e comunicações com pacientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name" className="text-sky-900">
                                    Nome Completo
                                </Label>
                                <Input
                                    id="name"
                                    value={personalData.name}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Dr(a). Nome completo"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email" className="text-sky-900">
                                    Email profissional
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={personalData.email}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="contato@suaclinica.com"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="position"
                                    className="text-sky-900"
                                >
                                    Cargo / Especialidade
                                </Label>
                                <Input
                                    id="position"
                                    value={personalData.position}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            position: e.target.value,
                                        })
                                    }
                                    placeholder="Ex.: Cardiologista, Recepção, Gestão..."
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone" className="text-sky-900">
                                    Telefone / WhatsApp
                                </Label>
                                <Input
                                    id="phone"
                                    value={personalData.phone}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            phone: e.target.value,
                                        })
                                    }
                                    placeholder="(11) 99999-9999"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label htmlFor="cpf" className="text-sky-900">
                                    CPF
                                </Label>
                                <Input
                                    id="cpf"
                                    value={personalData.cpf}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            cpf: e.target.value,
                                        })
                                    }
                                    placeholder="000.000.000-00"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="birthDate"
                                    className="text-sky-900"
                                >
                                    Data de Nascimento
                                </Label>
                                <Input
                                    id="birthDate"
                                    type="date"
                                    value={personalData.birthDate}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            birthDate: e.target.value,
                                        })
                                    }
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label
                                    htmlFor="address"
                                    className="text-sky-900"
                                >
                                    Endereço residencial (opcional)
                                </Label>
                                <Input
                                    id="address"
                                    value={personalData.address}
                                    onChange={(e) =>
                                        setPersonalData({
                                            ...personalData,
                                            address: e.target.value,
                                        })
                                    }
                                    placeholder="Rua, número, bairro, cidade"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label className="text-sky-900">
                                    Foto de Perfil
                                </Label>
                                <p className="text-xs text-sky-800/70 mb-2">
                                    Essa foto será usada em prontuários,
                                    receitas e na identificação interna da
                                    equipe. Formatos: JPG, PNG ou WEBP. Máx.
                                    5MB.
                                </p>
                                <AvatarUploader
                                    initialUrl={
                                        userData?.avatarUrl ||
                                        user?.avatarUrl ||
                                        user?.image
                                    }
                                    name={
                                        personalData.name ||
                                        userData?.name ||
                                        user?.name
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dados da Clínica */}
                <Card className="border-sky-100 shadow-sm">
                    <CardHeader className="border-b sky/60">
                        <CardTitle className="flex items-center space-x-2 text-sky-900">
                            <Building2 className="w-5 h-5 text-sky-700" />
                            <span>Dados da Clínica</span>
                        </CardTitle>
                        <CardDescription className="text-sm text-sky-800/70">
                            Configure as informações institucionais da sua
                            clínica. Esses dados podem aparecer em documentos,
                            comunicações com pacientes e relatórios.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label
                                    htmlFor="companyName"
                                    className="text-sky-900"
                                >
                                    Nome da Clínica
                                </Label>
                                <Input
                                    id="companyName"
                                    value={companyData.companyName}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyName: e.target.value,
                                        })
                                    }
                                    placeholder="Nome fantasia da clínica"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyCnpj"
                                    className="text-sky-900"
                                >
                                    CNPJ da Clínica
                                </Label>
                                <Input
                                    id="companyCnpj"
                                    value={companyData.companyCnpj}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyCnpj: e.target.value,
                                        })
                                    }
                                    placeholder="00.000.000/0000-00"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyPhone"
                                    className="text-sky-900"
                                >
                                    Telefone da Clínica
                                </Label>
                                <Input
                                    id="companyPhone"
                                    value={companyData.companyPhone}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyPhone: e.target.value,
                                        })
                                    }
                                    placeholder="(11) 3333-4444"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyEmail"
                                    className="text-sky-900"
                                >
                                    Email da Clínica
                                </Label>
                                <Input
                                    id="companyEmail"
                                    type="email"
                                    value={companyData.companyEmail}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyEmail: e.target.value,
                                        })
                                    }
                                    placeholder="contato@suaclinica.com"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label
                                    htmlFor="companyAddress"
                                    className="text-sky-900"
                                >
                                    Endereço da Clínica
                                </Label>
                                <Input
                                    id="companyAddress"
                                    value={companyData.companyAddress}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyAddress: e.target.value,
                                        })
                                    }
                                    placeholder="Endereço completo da unidade"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyWebsite"
                                    className="text-sky-900"
                                >
                                    Website (opcional)
                                </Label>
                                <Input
                                    id="companyWebsite"
                                    value={companyData.companyWebsite}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyWebsite: e.target.value,
                                        })
                                    }
                                    placeholder="https://www.suaclinica.com"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyLogo"
                                    className="text-sky-900"
                                >
                                    Logo da Clínica (URL)
                                </Label>
                                <Input
                                    id="companyLogo"
                                    value={companyData.companyLogo}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyLogo: e.target.value,
                                        })
                                    }
                                    placeholder="https://exemplo.com/logo.png"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companySize"
                                    className="text-sky-900"
                                >
                                    Porte da Clínica
                                </Label>
                                <Select
                                    value={companyData.companySize}
                                    onValueChange={(value) =>
                                        setCompanyData({
                                            ...companyData,
                                            companySize: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="bg-white border-sky-100 focus:ring-sky-500">
                                        <SelectValue placeholder="Selecione o porte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="micro">
                                            Pequeno consultório
                                        </SelectItem>
                                        <SelectItem value="pequena">
                                            Clínica de pequeno porte
                                        </SelectItem>
                                        <SelectItem value="media">
                                            Clínica de médio porte
                                        </SelectItem>
                                        <SelectItem value="grande">
                                            Hospital / grande estrutura
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="companySector"
                                    className="text-sky-900"
                                >
                                    Especialidade principal
                                </Label>
                                <Select
                                    value={companyData.companySector}
                                    onValueChange={(value) =>
                                        setCompanyData({
                                            ...companyData,
                                            companySector: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="bg-white border-sky-100 focus:ring-sky-500">
                                        <SelectValue placeholder="Selecione a especialidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="clinica-geral">
                                            Clínica geral
                                        </SelectItem>
                                        <SelectItem value="cardiologia">
                                            Cardiologia
                                        </SelectItem>
                                        <SelectItem value="pediatria">
                                            Pediatria
                                        </SelectItem>
                                        <SelectItem value="odontologia">
                                            Odontologia
                                        </SelectItem>
                                        <SelectItem value="dermatologia">
                                            Dermatologia
                                        </SelectItem>
                                        <SelectItem value="veterinaria">
                                            Medicina veterinária
                                        </SelectItem>
                                        <SelectItem value="outros">
                                            Outras especialidades
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyFounded"
                                    className="text-sky-900"
                                >
                                    Ano de Fundação
                                </Label>
                                <Input
                                    id="companyFounded"
                                    value={companyData.companyFounded}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyFounded: e.target.value,
                                        })
                                    }
                                    placeholder="Ex.: 2015"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyRevenue"
                                    className="text-sky-900"
                                >
                                    Faturamento anual (opcional)
                                </Label>
                                <Input
                                    id="companyRevenue"
                                    value={companyData.companyRevenue}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyRevenue: e.target.value,
                                        })
                                    }
                                    placeholder="R$ 1.000.000,00"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="companyEmployees"
                                    className="text-sky-900"
                                >
                                    Número de colaboradores
                                </Label>
                                <Input
                                    id="companyEmployees"
                                    value={companyData.companyEmployees}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyEmployees: e.target.value,
                                        })
                                    }
                                    placeholder="Ex.: 12"
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label
                                    htmlFor="companyDescription"
                                    className="text-sky-900"
                                >
                                    Descrição da Clínica
                                </Label>
                                <Textarea
                                    id="companyDescription"
                                    value={companyData.companyDescription}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            companyDescription: e.target.value,
                                        })
                                    }
                                    placeholder="Descreva brevemente a clínica, especialidades atendidas e o perfil dos seus pacientes."
                                    rows={3}
                                    className="bg-white border-sky-100 focus-visible:ring-sky-500"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Botão de Salvar */}
                <Card className="border-sky-100 shadow-sm">
                    <CardContent className="pt-6">
                        <Button
                            onClick={saveUserData}
                            disabled={loading}
                            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-medium tracking-wide"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Todas as Configurações
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {success && (
                    <div className="p-4 sky border border-sky-200 rounded-lg">
                        <p className="text-sky-900 text-sm">
                            ✓ Configurações da clínica atualizadas com sucesso.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">❌ {error}</p>
                    </div>
                )}
            </div>

            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl px-6 py-5 shadow-xl flex flex-col items-center gap-3 max-w-sm text-center border border-sky-100">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-700" />
                        <p className="text-sm font-medium text-sky-900">
                            Salvando as informações da sua clínica...
                        </p>
                        <p className="text-xs text-sky-800/70">
                            Isso pode levar alguns segundos. Não feche esta
                            página para evitar perda de dados.
                        </p>
                    </div>
                </div>
            )}
        </TabsContent>
    );
}
