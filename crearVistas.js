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
            if (doc.Proveedor) {
              emit(doc.Proveedor, 1);
            }
          }.toString(),
          reduce: '_sum' // Usamos el reductor nativo para sumar
        },
        // Vista para encontrar el producto más caro por proveedor
        'mas-caro-por-proveedor': {
          map: function (doc) {
            if (doc.Proveedor && doc.PrecioUnidad) {
              // Emitimos el proveedor como clave y un objeto con los detalles del producto como valor
              emit(doc.Proveedor, { nombre: doc.NombreProducto, precio: doc.PrecioUnidad });
            }
          }.toString(),
          reduce: function (keys, values, rereduce) {
            if (rereduce) {
              // rereduce = true: estamos combinando resultados de reducciones anteriores
              return values.reduce(function(a, b) {
                return a.precio > b.precio ? a : b;
              });
            } else {
              // rereduce = false: estamos reduciendo los valores del map
              let max_product = { precio: -1 };
              for (let i = 0; i < values.length; i++) {
                if (values[i].precio > max_product.precio) {
                  max_product = values[i];
                }
              }
              return max_product;
            }
          }.toString()
        },
        // Vista para obtener la lista de proveedores únicos (para contar en el cliente)
        'proveedores-unicos': {
          map: function (doc) {
            if (doc.Proveedor) {
              emit(doc.Proveedor, null); // Emitimos el proveedor como clave
            }
          }.toString()
          // No necesitamos un reductor si solo queremos las claves únicas
        }
      },
      language: 'javascript'
    };

    // Para actualizar un documento de diseño, CouchDB requiere la última revisión (_rev).
    // Intentamos obtener el documento existente para conseguir esa revisión.
    try {
      const existingDoc = await db.get('_design/consultas');
      designDoc._rev = existingDoc._rev; // Adjuntar la revisión para poder actualizar
    } catch (error) {
      if (error.statusCode !== 404) {
        // Si el error es diferente a "no encontrado", algo más está mal.
        console.error('Error inesperado al obtener el documento de diseño:', error);
        throw error;
      }
      // Si el error es 404, significa que el documento no existe, lo cual está bien.
      // Se creará uno nuevo en el siguiente paso.
    }

    await db.insert(designDoc);
    console.log('✅ Documento de diseño "consultas" creado/actualizado exitosamente.');

  } catch (error) {
    console.error('❌ Error al crear/actualizar el documento de diseño:', error);
  }
}

crearVistas();