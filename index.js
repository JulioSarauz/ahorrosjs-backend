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
      version: '1.0.0'
    },
    paths: {
      '/ping': {
        get: {
          summary: 'Ruta para mantener el servidor despierto',
          responses: {
            200: { description: 'Servidor activo' }
          }
        }
      },
      '/escribir-celda': {
        post: {
          summary: 'Escribe un texto en una celda',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    celda: { type: 'string', example: 'A1' },
                    texto: { type: 'string', example: '150' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OK' },
            400: { description: 'Bad Request' },
            500: { description: 'Error' }
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

app.get('/ping', (req, res) => {
  res.status(200).send('Servidor activo');
});

app.post('/escribir-celda', async (req, res) => {
  const { celda, texto } = req.body;

  if (!celda || texto === undefined) {
    return res.status(400).send({ 
      success: false, 
      error: 'Debes enviar celda y texto' 
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

    res.status(200).send({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});