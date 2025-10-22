import connectCouchDB from './couchdb.js';
import { exec } from 'child_process';
import { promisify } from 'util';

async function crearIndices() {
  try {
    const db = await connectCouchDB();

    // Índice para la búsqueda por nombre y proveedor
    const searchIndex = {
      index: {
        fields: ['nombre', 'proveedor']
      },
      name: 'search-index',
      type: 'json'
    };

    await db.createIndex(searchIndex);
    console.log('✅ Índice de búsqueda "search-index" creado o ya existente.');

    // Adicionalmente, nos aseguramos de que las vistas también se creen/actualicen.
    console.log('🔄 Ejecutando script para crear/actualizar vistas...');
    const execPromise = promisify(exec);
    await execPromise('node crearVistas.js');
    console.log('✅ Script de vistas finalizado.');

  } catch (error) {
    console.error('❌ Error al crear el índice de búsqueda:', error);
  }
}

crearIndices();