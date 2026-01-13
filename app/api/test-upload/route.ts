import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // console.log('Teste de upload iniciado...')

        const formData = await request.formData();
        const file = formData.get('file') as File;

        // console.log('Arquivo recebido:', file?.name, file?.size, file?.type);

        if (!file) {
            return NextResponse.json(
                { error: 'Nenhum arquivo enviado' },
                { status: 400 }
            );
        }

        // Converter arquivo para buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        console.log('Buffer criado, tamanho:', fileBuffer.length);

        // Verificar extensão
        const fileExtension = file.name
            .toLowerCase()
            .substring(file.name.lastIndexOf('.'));
        console.log('Extensão do arquivo:', fileExtension);

        if (fileExtension === '.csv') {
            console.log('Processando CSV...');

            // Processar CSV de forma simples
            const csvContent = fileBuffer.toString('utf-8');
            // console.log('Conteúdo CSV:', csvContent.substring(0, 200) + '...');

            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            // console.log('Headers:', headers);

            const contacts = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const contact = {
                        nome: values[0] || '',
                        telefone: values[1] || '',
                        empresa: values[2] || '',
                        email: values[3] || '',
                        link: values[4] || '',
                    };
                    contacts.push(contact);
                    console.log('Contato processado:', contact);
                }
            }

            return NextResponse.json({
                success: true,
                contacts,
                total: contacts.length,
            });
        } else {
            return NextResponse.json(
                { error: 'Apenas CSV suportado no teste' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Erro no teste:', error);
        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                details:
                    error instanceof Error
                        ? error.message
                        : 'Erro desconhecido',
            },
            { status: 500 }
        );
    }
}
