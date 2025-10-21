import connectCouchDB from './couchdb.js';

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

  } catch (error) {
    console.error('❌ Error al crear el índice de búsqueda:', error);
  }
}

crearIndices();