import connectCouchDB from './couchdb.js';

async function crearVistas() {
  try {
    const db = await connectCouchDB();

    const designDoc = {
      _id: '_design/consultas',
      views: {
        // Vista para contar productos por proveedor
        'cantidad-por-proveedor': {
          map: function (doc) {
            if (doc.proveedor) {
              emit(doc.proveedor, 1);
            }
          }.toString(),
          reduce: '_sum' // Usamos el reductor nativo para sumar
        },
        // Vista para encontrar el producto más caro por proveedor
        'mas-caro-por-proveedor': {
          map: function (doc) {
            if (doc.proveedor && doc.precio) {
              // Emitimos el proveedor como clave y un objeto con los detalles del producto como valor
              emit(doc.proveedor, { nombre: doc.nombre, precio: doc.precio });
            }
          }.toString(),
          reduce: function (keys, values, rereduce) {
            // Este reductor personalizado encontrará el producto con el precio máximo
            let max_product = { precio: -1 };
            for (let i = 0; i < values.length; i++) {
              if (values[i].precio > max_product.precio) {
                max_product = values[i];
              }
            }
            return max_product;
          }.toString()
        },
        // Vista para obtener la lista de proveedores únicos (para contar en el cliente)
        'proveedores-unicos': {
          map: function (doc) {
            if (doc.proveedor) {
              emit(doc.proveedor, null); // Emitimos el proveedor como clave
            }
          }.toString()
          // No necesitamos un reductor si solo queremos las claves únicas
        }
      },
      language: 'javascript'
    };

    // Intentar obtener el documento de diseño existente para actualizarlo
    try {
      const existingDoc = await db.get('_design/consultas');
      designDoc._rev = existingDoc._rev; // Adjuntar la revisión para poder actualizar
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error; // Lanzar error si no es 'not_found'
      }
      // Si no existe, no hacemos nada, se creará uno nuevo
    }

    await db.insert(designDoc);
    console.log('✅ Documento de diseño "consultas" creado/actualizado exitosamente.');

  } catch (error) {
    console.error('❌ Error al crear/actualizar el documento de diseño:', error);
  }
}

crearVistas();