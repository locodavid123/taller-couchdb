import mysql from 'mysql2/promise';
import connectCouchDB from './couchdb.js';
import { exec } from 'child_process';
import { promisify } from 'util';

async function migrar() {
let mysqlConn; // Define the connection variable in the outer scope
try {
    // 🔹 Conexión a MySQL
    mysqlConn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'negocio'   // <-- tu base MySQL
    });

    // 🔹 Conexión a CouchDB
    const db = await connectCouchDB();

    // 🔹 Leer los datos desde MySQL
    const [rows] = await mysqlConn.execute('SELECT * FROM producto');

    // 🔹 Transformar cada fila a documento JSON
    const docs = rows.map(row => ({
        ...row,
        _id: row.IdProducto ? String(row.IdProducto) : undefined
    }));

    // 🔹 Insertar todos los documentos en CouchDB
    const result = await db.bulk({ docs });

    const successes = result.filter(r => r.ok).length;
    const conflicts = result.filter(r => r.error === 'conflict').length;
    const failures = result.length - successes - conflicts;

    console.log('✅ Migración completada.');
    console.log(`  - ${successes} documentos insertados/actualizados.`);
    if (conflicts > 0) console.log(`  - ${conflicts} documentos omitidos (conflicto, ya existían).`);
    if (failures > 0) console.log(`  - ❌ ${failures} documentos fallaron.`);

    // Después de migrar, ejecutar los scripts para crear índices y vistas
    console.log('\n🔄 Ejecutando scripts de configuración de la base de datos...');
    const execPromise = promisify(exec);
    await execPromise('node crearVistas.js');
    console.log('✅ Scripts de configuración finalizados.');


} catch (err) {
    console.error('❌ Error en la migración:', err);
} finally {
    // 🔹 Cerrar la conexión a MySQL
    if (mysqlConn) {
        await mysqlConn.end();
    }
}
}

migrar();