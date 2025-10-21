import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connectCouchDB from './couchdb.js';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Conectar a CouchDB una vez al iniciar el servidor
let db;
connectCouchDB()
  .then(couchDbInstance => {
    db = couchDbInstance;
    console.log('CouchDB listo para consultas.');
  })
  .catch(error => {
    console.error('Error al iniciar el servidor: No se pudo conectar a CouchDB:', error);
    process.exit(1); // Salir si no se puede conectar a la base de datos
  });

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta API para buscar productos
app.get('/api/productos', async (req, res) => {
  const { query } = req.query; // Obtener el parámetro 'query' de la URL

  try {
    // Si no hay query, devolver todos los documentos (limitado para evitar sobrecarga)
    // O puedes implementar una paginación más robusta
    const result = await db.find({
      selector: {
        $or: [
          { nombre: { $regex: `(?i)${query || ''}` } }, // Búsqueda insensible a mayúsculas/minúsculas
          { proveedor: { $regex: `(?i)${query || ''}` } }
        ]
      },
      limit: 10 // Limitar resultados para el ejemplo
    });
    res.json(result.docs);
  } catch (error) {
    console.error('Error al buscar productos en CouchDB:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor web escuchando en http://localhost:${PORT}`);
});