// Colección "favoritos": relación muchos a muchos entre usuarios y productos.
// Se modela como colección propia (y no como arreglo dentro del usuario) para:
//  - impedir duplicados con un índice único (usuario + producto),
//  - poder generar reportes (productos más agregados a favoritos) con agregaciones.
const { Schema, model } = require('mongoose');

const favoritoSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    producto: { type: Schema.Types.ObjectId, ref: 'Producto', required: true, index: true },
  },
  {
    collection: 'favoritos',
    timestamps: { createdAt: 'agregado_en', updatedAt: false },
    versionKey: false,
  }
);

// Índice único compuesto: el mismo usuario no puede agregar dos veces el mismo producto.
favoritoSchema.index({ usuario: 1, producto: 1 }, { unique: true });

module.exports = model('Favorito', favoritoSchema);
