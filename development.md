# Development Documentation - AxafoneCRM

## Project Overview

AxafoneCRM is a commercial form management API deployed on Vercel. This project handles form submissions for Axafone's commercial operations, including user management and form data processing.

## Repository Information

- **Location**: `/home/gacel/Documentos/AxafoneCRM`
- **Type**: Git repository
- **Deployment**: Vercel
- **API Base**: Commercial forms API

## Database Configuration

### Connection Details
- **Host**: 195.248.230.153
- **Port**: 10000
- **User**: comercial_user
- **Password**: comercial_pass_2024
- **Database**: comercial_form_db

### Environment Variables
```
DB_HOST=195.248.230.153
DB_PORT=10000
DB_USER=comercial_user
DB_PASSWORD=comercial_pass_2024
DB_NAME=comercial_form_db
```

## Project Structure

The project is structured as a Node.js API with the following main components:

### API Endpoints
- Form management endpoints
- User authentication and management
- Commercial team hierarchy management
- Reporting functionality

### Database Schema

#### Users Table
- User management with roles (COMERCIAL, JEFE_EQUIPO)
- Team hierarchy with boss_id relationships
- User types: FIDELIZACIÓN and CAPTACIÓN
- Authentication and authorization

#### Form Submissions Table
- Client information storage
- Contact details and business data
- Location tracking (latitude, longitude)
- Service-specific fields for different commercial types
- Audit trail with timestamps

## Team Structure

### Team Leaders (JEFE_EQUIPO)
Multiple team leaders manage different commercial teams:
- Jorge Campos Postigo
- Antonio Asensio García de la Rosa
- Francisco Javier Castro Palacios
- David Martín Contento
- Juan Antonio Prieto Lancha
- Antonio Sánchez Jiménez

### Commercial Users (COMERCIAL)
Two main types of commercial users:
- **FIDELIZACIÓN**: Customer retention specialists
- **CAPTACIÓN**: New customer acquisition specialists

## Key Features

### Form Management
- Client data collection and storage
- Location tracking capabilities
- Service-specific data fields
- Form validation and processing

### User Management
- Role-based access control
- Team hierarchy management
- Password change functionality
- User authentication

### Reporting System
- Team-based reporting
- Client data analysis
- Form submission tracking
- Export capabilities

### Search Functionality
- Client search by CIF and company name
- Partial matching capabilities
- Quick client lookup

## Development Environment

### Prerequisites
- Node.js runtime
- MySQL database access
- Vercel CLI (for deployment)

### Local Development
1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Connect to remote database
5. Start development server

### Database Access
The project connects to a remote MySQL database. Use the provided credentials for database operations and testing.

## Deployment

The project is deployed on Vercel with automatic deployments from the git repository. Environment variables are configured in the Vercel dashboard.

## Security Notes

- Database credentials are stored as environment variables
- User authentication is implemented
- Role-based access control is enforced
- All database queries use parameterized statements

## API Documentation

The API provides endpoints for:
- User authentication (`/api/login`)
- Form submissions (`/api/forms`)
- User management (`/api/users`)
- Reporting (`/api/reports`)
- Client search functionality

Each endpoint includes proper error handling and response formatting for integration with frontend applications.