-- Ejecuta esto en PostgreSQL como usuario postgres

-- Crear usuario
CREATE USER sistema_user WITH PASSWORD 'sistema_password_2024';

-- Crear base de datos
CREATE DATABASE sistema_it OWNER sistema_user;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE sistema_it TO sistema_user;

-- Conectar a la base de datos y dar permisos en el schema public
\c sistema_it
GRANT ALL ON SCHEMA public TO sistema_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sistema_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sistema_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sistema_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sistema_user;
