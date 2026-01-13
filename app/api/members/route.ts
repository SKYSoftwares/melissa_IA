import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// Evitar múltiplas instâncias do PrismaClient em dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Função para criar permissões baseadas no cargo
async function createPermissionsForMember(teamId: string, role: string) {
    let permissions = {};

    if (role === 'Diretor') {
        // Diretor tem todas as permissões, incluindo configurações
        permissions = {
            teamId,
            role: 'diretor',
            dashboard: true,
            whatsapp: true,
            propostas: true,
            simuladores: true,
            relatorios: true,
            campanhas: true,
            equipe: true,
            configuracoes: true,
        };
    } else if (role === 'Gerente') {
        // Gerente tem todas as permissões, exceto configurações
        permissions = {
            teamId,
            role: 'gerente',
            dashboard: true,
            whatsapp: true,
            propostas: true,
            simuladores: true,
            relatorios: true,
            campanhas: true,
            equipe: true,
            configuracoes: false, // Única permissão negada para gerentes
        };
    } else if (role === 'Consultor') {
        // Consultor tem permissões básicas
        permissions = {
            teamId,
            role: 'usuario',
            dashboard: true,
            whatsapp: true,
            propostas: true,
            simuladores: true,
            relatorios: false,
            campanhas: false,
            equipe: false,
            configuracoes: false,
        };
    }

    // Criar as permissões no banco
    await prisma.teamPermission.create({
        data: permissions as any,
    });
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('id');
        const role = searchParams.get('role');

        if (memberId) {
            // Buscar permissões de um membro específico
            const permissions = await prisma.teamPermission.findFirst({
                where: { teamId: memberId },
                include: {
                    team: true,
                },
            });
            return NextResponse.json(permissions);
        }

        // Se foi solicitado filtro por role
        if (role) {
            let whereClause: any = {};

            if (role === 'diretor') {
                // Buscar diretores (equipes que são diretores)
                const directors = await prisma.team.findMany({
                    where: {
                        permissions: {
                            some: {
                                role: 'diretor',
                            },
                        },
                    },
                    orderBy: { name: 'asc' },
                    include: {
                        permissions: true,
                        managedTeams: {
                            include: {
                                members: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        position: true,
                                    },
                                },
                            },
                        },
                    },
                });

                // Para cada diretor, buscar os gerentes que ele gerencia e seus consultores
                const directorsWithHierarchy = await Promise.all(
                    directors.map(async (director) => {
                        // Buscar gerentes que têm este diretor como directorId
                        const managedManagers = await prisma.team.findMany({
                            where: {
                                directorId: director.id,
                                permissions: {
                                    some: {
                                        role: 'gerente',
                                    },
                                },
                            },
                            include: {
                                managedTeams: {
                                    include: {
                                        members: {
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true,
                                                position: true,
                                            },
                                        },
                                    },
                                },
                            },
                        });

                        // Calcular estatísticas
                        const totalManagers = managedManagers.length;
                        const totalConsultants = managedManagers.reduce(
                            (total, manager) => {
                                return (
                                    total +
                                    manager.managedTeams.reduce(
                                        (teamTotal, team) => {
                                            return (
                                                teamTotal +
                                                team.members.filter(
                                                    (member: any) =>
                                                        member.position ===
                                                        'consultor'
                                                ).length
                                            );
                                        },
                                        0
                                    )
                                );
                            },
                            0
                        );

                        return {
                            ...director,
                            managedManagers,
                            totalManagers,
                            totalConsultants,
                            totalMembers: totalManagers + totalConsultants,
                        };
                    })
                );

                return NextResponse.json(directorsWithHierarchy);
            } else if (role === 'gerente') {
                // Buscar gerentes
                const managers = await prisma.team.findMany({
                    where: {
                        permissions: {
                            some: {
                                role: 'gerente',
                            },
                        },
                    },
                    orderBy: { name: 'asc' },
                    include: {
                        permissions: true,
                        managedTeams: {
                            include: {
                                members: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        position: true,
                                    },
                                },
                            },
                        },
                    },
                });
                return NextResponse.json(managers);
            }
        }

        // Buscar todos os membros com suas permissões
        const members = await prisma.team.findMany({
            orderBy: { name: 'asc' },
            include: {
                permissions: true,
            },
        });
        return NextResponse.json(members);
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao buscar membros', details: String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const {
            name,
            email,
            role,
            password,
            cpf,
            phone,
            birthDate,
            cnpj,
            address,
        } = await req.json();

        if (!name || !email || !role || !password || !cpf || !phone) {
            return NextResponse.json(
                {
                    error: 'Preencha nome, e-mail, cargo, senha, CPF e telefone.',
                },
                { status: 400 }
            );
        }
        // console.log(req.json());
        const onlyDigits = (s: string) => String(s || '').replace(/\D/g, '');
        const cpfDigits = onlyDigits(cpf);
        const phoneDigits = onlyDigits(phone);

        if (cpfDigits.length !== 11) {
            return NextResponse.json(
                { error: 'CPF inválido.' },
                { status: 400 }
            );
        }
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            return NextResponse.json(
                { error: 'Telefone inválido.' },
                { status: 400 }
            );
        }

        // já existe e-mail?
        const exists = await prisma.team.findUnique({ where: { email } });
        if (exists) {
            return NextResponse.json(
                { error: 'Já existe um membro com este e-mail.' },
                { status: 409 }
            );
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const createdMember = await prisma.team.create({
            data: {
                name,
                email,
                position: role,
                password: hashedPassword,
                cpf: cpfDigits,
                phone: phoneDigits,
                birthDate: birthDate || null,
                cnpj: cnpj || null,
                address: address || null,
                accessStatus: 'approved',
            },
        });

        if (createdMember) {
            await createPermissionsForMember(createdMember.id, role);

            // Se é diretor, criar equipe automaticamente
            if (role === 'Diretor') {
                await prisma.teamGroup.create({
                    data: {
                        name: `Equipe ${name}`,
                        managerId: createdMember.id,
                    },
                });
            }
        }

        return NextResponse.json(createdMember, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao adicionar membro', details: String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const {
            id,
            name,
            email,
            role,
            password,
            cpf,
            phone,
            birthDate,
            cnpj,
            address,
        } = await req.json();

        if (!id || !name || !email || !role || !cpf || !phone) {
            return NextResponse.json(
                { error: 'Preencha id, nome, e-mail, cargo, CPF e telefone.' },
                { status: 400 }
            );
        }

        const onlyDigits = (s: string) => String(s || '').replace(/\D/g, '');
        const cpfDigits = onlyDigits(cpf);
        const phoneDigits = onlyDigits(phone);

        if (cpfDigits.length !== 11) {
            return NextResponse.json(
                { error: 'CPF inválido.' },
                { status: 400 }
            );
        }
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            return NextResponse.json(
                { error: 'Telefone inválido.' },
                { status: 400 }
            );
        }

        const exists = await prisma.team.findFirst({
            where: { email, NOT: { id } },
        });
        if (exists) {
            return NextResponse.json(
                { error: 'Já existe um membro com este e-mail.' },
                { status: 409 }
            );
        }

        const currentMember = await prisma.team.findUnique({ where: { id } });

        const updateData: any = {
            name,
            email,
            position: role,
            cpf: cpfDigits,
            phone: phoneDigits,
            birthDate: birthDate || null,
            cnpj: cnpj || null,
            address: address || null,
        };

        if (password) {
            const saltRounds = 12;
            updateData.password = await bcrypt.hash(password, saltRounds);
        }

        const updated = await prisma.team.update({
            where: { id },
            data: updateData,
        });

        if (currentMember && currentMember.position !== role) {
            await prisma.teamPermission.deleteMany({ where: { teamId: id } });
            await createPermissionsForMember(id, role);

            // Se mudou para diretor, criar equipe automaticamente
            if (role === 'Diretor') {
                // Verificar se já existe uma equipe para este diretor
                const existingTeam = await prisma.teamGroup.findFirst({
                    where: { managerId: id },
                });

                if (!existingTeam) {
                    await prisma.teamGroup.create({
                        data: {
                            name: `Equipe ${name}`,
                            managerId: id,
                        },
                    });
                }
            }
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao atualizar membro', details: String(error) },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json(
                { error: 'ID não informado.' },
                { status: 400 }
            );
        }
        await prisma.team.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao excluir membro', details: String(error) },
            { status: 500 }
        );
    }
}
