const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Google Sheets API',
      version: '1.0.0',
      description: 'Backend para escribir en celdas específicas de Google Sheets',
    },
    paths: {
      '/escribir-celda': {
        post: {
          summary: 'Escribe un texto en una celda específica (ej. A1)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    celda: { 
                      type: 'string', 
                      example: 'A1',
                      description: 'Coordenada de la celda' 
                    },
                    texto: { 
                      type: 'string', 
                      example: 'Hola desde Node.js',
                      description: 'Texto a insertar' 
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Celda actualizada con éxito' },
            400: { description: 'Faltan datos en la petición' },
            500: { description: 'Error en el servidor' }
          }
        }
      }
    }
  },
  apis: [], 
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = process.env.SPREADSHEET_ID;

app.post('/escribir-celda', async (req, res) => {
  const { celda, texto } = req.body;

  if (!celda || texto === undefined) {
    return res.status(400).send({ 
      success: false, 
      error: 'Debes enviar la "celda" (ej. "A1") y el "texto".' 
    });
  }

  try {
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client });

    await googleSheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${process.env.SHEET_NAME}!${celda}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[texto]],
      },
    });

    res.status(200).send({ 
      success: true, 
      message: `Dato guardado correctamente en la celda ${celda}` 
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor funcionando`);
  console.log(`📝 Documentación: http://localhost:${PORT}/api-docs\n`);
});