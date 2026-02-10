# Equipment Service

Equipment management service for the rental platform.

## Features
- Equipment category management (hierarchical, max 3 levels)
- Equipment item management (future)
- Maintenance scheduling (future)

## Ports
- gRPC: 50056
- HTTP: 3006

## Database
- Name: equipment_db
- Tables: equipment_categories

## Development

```bash
# Install dependencies
npm install

# Run migrations
npm run migration:run

# Start development
npm run start:dev
```
