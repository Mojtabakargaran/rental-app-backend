-- Initialize databases for all microservices
CREATE DATABASE auth_db;        -- Auth service database
CREATE DATABASE user_db;        -- User service database
CREATE DATABASE tenant_db;      -- Tenant service database
CREATE DATABASE audit_db;       -- Audit service database
CREATE DATABASE equipment_db;   -- Equipment service database

-- Grant privileges to postgres user (default user)
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE user_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE tenant_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE audit_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE equipment_db TO postgres;
