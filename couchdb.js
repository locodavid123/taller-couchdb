// Importar nano
import nano from 'nano';

// URL de conexión a CouchDB
// Si usas localhost, por defecto CouchDB corre en el puerto 5984
const couch = nano('http://admin:123456@localhost:5984');

// Nombre de la base de datos
const dbName = 'producto';

// Crear o usar la base de datos
async function connectCouchDB() {
  try {
    // Verificar si la base existe
    const dbList = await couch.db.list();

    if (!dbList.includes(dbName)) {
      await couch.db.create(dbName);
      console.log(`🆕 Base de datos '${dbName}' creada`);
    }

    const db = couch.use(dbName);
    console.log(`✅ Conectado a CouchDB -> ${dbName}`);

    return db;
  } catch (error) {
    console.error('❌ Error al conectar con CouchDB:', error);
    throw error; // Relanzar el error para detener la ejecución
  }
}

export default connectCouchDB;
