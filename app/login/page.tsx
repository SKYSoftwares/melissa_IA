'use client';

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
import { useToast } from '@/hooks/use-toast';
import {
    Activity,
    Building2,
    Eye,
    EyeOff,
    Home,
    IdCard,
    Lock,
    Mail,
    Phone,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

// utilitários e máscaras
const onlyDigits = (s: string) => s.replace(/\D/g, '');

const maskCPF = (v: string) => {
    const d = onlyDigits(v).slice(0, 11);
    return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskPhone = (v: string) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) {
        return d
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return d
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

const maskCNPJ = (v: string) => {
    const d = onlyDigits(v).slice(0, 14);
    return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

function cpfIsValid(v: string) {
    const s = onlyDigits(v);
    if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(s[i]) * (10 - i);
    let d1 = 11 - (sum % 11);
    if (d1 >= 10) d1 = 0;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(s[i]) * (11 - i);
    let d2 = 11 - (sum % 11);
    if (d2 >= 10) d2 = 0;
    return s[9] === String(d1) && s[10] === String(d2);
}

export default function LoginPage() {
    // login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // solicitar acesso
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [nameReq, setNameReq] = useState('');
    const [cpfReq, setCpfReq] = useState('');
    const [phoneReq, setPhoneReq] = useState('');
    const [birthDateReq, setBirthDateReq] = useState(''); // YYYY-MM-DD (opcional)
    const [cnpjReq, setCnpjReq] = useState(''); // opcional
    const [addressReq, setAddressReq] = useState(''); // opcional
    const [confirmReq, setConfirmReq] = useState(''); // confirmação de senha
    const [isRequesting, setIsRequesting] = useState(false);

    const { toast } = useToast();
    const { data: session, status } = useSession();
    const router = useRouter();

    React.useEffect(() => {
        if (session) {
            router.push('/dashboard');
        }
    }, [session, router]);

    if (status === 'loading' || session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-100 w-full relative overflow-hidden">
                {/* formas de fundo */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-200/60 blur-3xl" />
                    <div className="absolute right-[-80px] top-1/3 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
                    <div className="absolute bottom-[-96px] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-100/70 blur-3xl" />
                </div>

                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                    <p className="text-sky-900/80">Carregando...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!email || !password) {
                toast({
                    title: 'Erro',
                    description: 'Por favor, preencha todos os campos',
                    variant: 'destructive',
                });
                return;
            }

            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error === 'PENDING_REVIEW') {
                    toast({
                        title: 'Em análise',
                        description:
                            'Sua solicitação de acesso ainda não foi aprovada. Aguarde a liberação do administrador.',
                    });
                } else {
                    toast({
                        title: 'Erro',
                        description: 'Credenciais inválidas. Tente novamente.',
                        variant: 'destructive',
                    });
                }
                return;
            }

            toast({
                title: 'Sucesso',
                description: 'Login realizado com sucesso!',
            });
            router.push('/dashboard');
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao fazer login. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const openAccessModal = () => {
        setShowAccessModal(true);
    };

    const handleRequestAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRequesting(true);
        try {
            if (!nameReq || !email || !password || !cpfReq || !phoneReq) {
                toast({
                    title: 'Erro',
                    description:
                        'Preencha nome, e-mail, senha, CPF e telefone.',
                    variant: 'destructive',
                });
                return;
            }

            if (password !== confirmReq) {
                toast({
                    title: 'Atenção',
                    description: 'A confirmação de senha não confere.',
                    variant: 'destructive',
                });
                return;
            }

            if (!cpfIsValid(cpfReq)) {
                toast({
                    title: 'Atenção',
                    description: 'Informe um CPF válido.',
                    variant: 'destructive',
                });
                return;
            }

            const res = await fetch('/api/access-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameReq,
                    email,
                    password,
                    cpf: onlyDigits(cpfReq),
                    phone: onlyDigits(phoneReq),
                    birthDate: birthDateReq || undefined,
                    cnpj: onlyDigits(cnpjReq) || undefined,
                    address: addressReq || undefined,
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Solicitação enviada',
                    description:
                        'Recebemos sua solicitação. Assim que for aprovada, você poderá acessar o sistema.',
                });
                setShowAccessModal(false);
            } else {
                const { error } = await res.json();
                toast({
                    title: 'Não foi possível solicitar',
                    description: error || 'Tente novamente mais tarde.',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao enviar solicitação. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-100 relative overflow-hidden">
            {/* formas de fundo que remetem a clínica, bem suaves */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-200/60 blur-3xl" />
                <div className="absolute right-[-80px] top-1/3 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
                <div className="absolute bottom-[-96px] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-100/70 blur-3xl" />
            </div>

            <div className="w-full max-w-md mx-auto p-6 sm:p-8">
                {/* Logo e Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 shadow-lg">
                            <Activity className="h-9 w-9 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-semibold text-sky-900 mb-1">
                        Odonto Clinic
                    </h1>
                    <p className="text-sky-700 text-base">
                        Sistema de Gestão Odontológica
                    </p>
                </div>

                {/* Card de Login */}
                <Card className="shadow-xl border border-sky-100 bg-white/90 backdrop-blur-md">
                    <CardHeader className="text-center pb-5">
                        <CardTitle className="text-xl font-semibold text-sky-900">
                            Acesse sua conta
                        </CardTitle>
                        <CardDescription className="text-sky-600">
                            Entre com suas credenciais para acessar a clínica
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-medium text-sky-900"
                                >
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="pl-10 h-11 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70 transition-colors bg-white/80"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium text-sky-900"
                                >
                                    Senha
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder="Digite sua senha"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="pl-10 pr-10 h-11 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70 transition-colors bg-white/80"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-[10px] h-4 w-4 text-sky-300 hover:text-sky-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-sky-200 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-sm text-sky-800/80">
                                        Lembrar de mim
                                    </span>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-medium text-base shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Entrando...</span>
                                    </div>
                                ) : (
                                    'Entrar'
                                )}
                            </Button>
                        </form>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-sky-800/80">
                                Não tem uma conta?{' '}
                                <button
                                    onClick={openAccessModal}
                                    className="text-sky-700 hover:text-sky-900 font-medium transition-colors underline-offset-4 hover:underline"
                                >
                                    Solicite acesso
                                </button>
                            </p>

                            <p className="text-sm text-sky-800/80">
                                Esqueceu sua senha?{' '}
                                <a
                                    href="/esqueci-senha"
                                    className="text-sky-600 hover:text-sky-800 font-medium transition-colors underline-offset-4 hover:underline"
                                >
                                    Redefinir senha
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-slate-400">
                        © 2024 Odonto Clinic. Todos os direitos reservados.
                    </p>
                </div>
            </div>

            {/* Modal Solicitar Acesso (com todos os campos) */}
            {showAccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-sky-900/40 backdrop-blur-[2px]"
                        onClick={() => setShowAccessModal(false)}
                    />
                    <div className="relative bg-white/95 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-6 border border-sky-100">
                        <h3 className="text-lg font-semibold text-sky-900">
                            Solicitar acesso
                        </h3>
                        <p className="text-sm text-sky-700 mt-1 mb-4">
                            Preencha seus dados para analisarmos seu cadastro na
                            clínica.
                        </p>

                        <form
                            onSubmit={handleRequestAccess}
                            className="grid gap-4"
                        >
                            <div>
                                <Label className="text-sky-900">
                                    Nome completo
                                </Label>
                                <Input
                                    value={nameReq}
                                    onChange={(e) => setNameReq(e.target.value)}
                                    placeholder="Seu nome"
                                    required
                                    className="border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                />
                            </div>

                            <div>
                                <Label className="text-sky-900">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="pl-10 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sky-900">CPF</Label>
                                <div className="relative">
                                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        value={cpfReq}
                                        onChange={(e) =>
                                            setCpfReq(maskCPF(e.target.value))
                                        }
                                        className="pl-10 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                        inputMode="numeric"
                                        maxLength={14}
                                        placeholder="000.000.000-00"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sky-900">Telefone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        value={phoneReq}
                                        onChange={(e) =>
                                            setPhoneReq(
                                                maskPhone(e.target.value)
                                            )
                                        }
                                        className="pl-10 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                        inputMode="numeric"
                                        maxLength={16}
                                        placeholder="(11) 9 9999-9999"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sky-900">
                                    Data de Nascimento (opcional)
                                </Label>
                                <Input
                                    type="date"
                                    value={birthDateReq}
                                    onChange={(e) =>
                                        setBirthDateReq(e.target.value)
                                    }
                                    className="border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                />
                            </div>

                            <div>
                                <Label className="text-sky-900">
                                    CNPJ (opcional)
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        value={cnpjReq}
                                        onChange={(e) =>
                                            setCnpjReq(maskCNPJ(e.target.value))
                                        }
                                        className="pl-10 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                        inputMode="numeric"
                                        maxLength={18}
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sky-900">
                                    Endereço (opcional)
                                </Label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-3 h-4 w-4 text-sky-300" />
                                    <Input
                                        value={addressReq}
                                        onChange={(e) =>
                                            setAddressReq(e.target.value)
                                        }
                                        className="pl-10 border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                        placeholder="Rua, número, bairro, cidade/UF"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sky-900">
                                        Senha
                                    </Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Crie uma senha"
                                        required
                                        className="border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sky-900">
                                        Confirmar senha
                                    </Label>
                                    <Input
                                        type="password"
                                        value={confirmReq}
                                        onChange={(e) =>
                                            setConfirmReq(e.target.value)
                                        }
                                        placeholder="Repita a senha"
                                        required
                                        className="border-sky-100 focus:border-sky-500 focus:ring-sky-500/70"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAccessModal(false)}
                                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isRequesting}
                                    className="bg-sky-600 hover:bg-sky-700 text-white"
                                >
                                    {isRequesting
                                        ? 'Enviando...'
                                        : 'Enviar solicitação'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
