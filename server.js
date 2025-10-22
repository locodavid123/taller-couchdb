import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connectCouchDB from './couchdb.js';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

async function startServer() {
  try {
    // 1. Conectar a CouchDB y esperar a que la conexión esté lista
    const db = await connectCouchDB();
    console.log('CouchDB listo para consultas.');

    // 2. Definir las rutas API (ahora pueden usar 'db' de forma segura)
    // Ruta API para buscar productos
    app.get('/api/productos', async (req, res) => {
      const { query } = req.query; // Obtener el parámetro 'query' de la URL

      // Escapamos caracteres especiales para la expresión regular
      const escapedQuery = (query || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      try {
        const result = await db.find({
          selector: {
            $or: [
              { NombreProducto: { $regex: `(?i)${escapedQuery}` } }, // Búsqueda insensible a mayúsculas/minúsculas
              { Proveedor: { $regex: `(?i)${escapedQuery}` } }
            ]
          },
          limit: 20 // Aumentamos el límite para mostrar más resultados
        });
        res.json(result.docs);
      } catch (error) {
        console.error('Error al buscar productos en CouchDB:', error);
        res.status(500).json({ error: 'Error al buscar productos' });
      }
    });

    // Ruta API para obtener la cantidad de productos por proveedor
    app.get('/api/stats/cantidad-por-proveedor', async (req, res) => {
      try {
        const result = await db.view('consultas', 'cantidad-por-proveedor', { group: true });
        res.json(result.rows);
      } catch (error) {
        console.error('Error en /api/stats/cantidad-por-proveedor:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
      }
    });

    // Ruta API para obtener el producto más caro por proveedor
    app.get('/api/stats/mas-caro-por-proveedor', async (req, res) => {
      try {
        const result = await db.view('consultas', 'mas-caro-por-proveedor', { group: true });
        res.json(result.rows);
      } catch (error) {
        console.error('Error en /api/stats/mas-caro-por-proveedor:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
      }
    });

    // Ruta API para obtener el número de proveedores únicos
    app.get('/api/stats/numero-proveedores', async (req, res) => {
      try {
        const result = await db.view('consultas', 'proveedores-unicos', { group: true });
        res.json({ count: result.rows.length });
      } catch (error) {
        console.error('Error en /api/stats/numero-proveedores:', error);
        res.status(500).json({ error: 'Error al obtener el número de proveedores' });
      }
    });

    // 3. Servir archivos estáticos (debe ir DESPUÉS de las rutas API)
    app.use(express.static(path.join(__dirname, '.')));

    // Redirección para cualquier otra ruta al index.html (útil para Single Page Apps)
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // 4. Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor web escuchando en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor: No se pudo conectar a CouchDB.', error);
    process.exit(1); // Salir si no se puede conectar a la base de datos
  }
}

startServer();