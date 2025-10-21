import connectCouchDB from './couchdb.js';

async function main() {
  const db = await connectCouchDB();

  // Insertar un documento de ejemplo
  const producto = {
    nombre: 'Café de Colombia',
    proveedor: 'Exotic Beans',
    precio: 25000
  };

  const response = await db.insert(producto);
  console.log('📝 Documento insertado con ID:', response.id);
}

main();