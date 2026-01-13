-- Adicionar coluna directorId na tabela Team
ALTER TABLE Team ADD COLUMN directorId VARCHAR(191);

-- Criar índice para a nova coluna
CREATE INDEX Team_directorId_fkey ON Team(directorId); 