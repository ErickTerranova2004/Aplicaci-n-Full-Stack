// Colección "productos".
const { Schema, model } = require('mongoose');
const { formatoJSON } = require('./formato');

const productoSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    descripcion: { type: String, required: true, trim: true },
    // Se guarda en minúsculas para que el filtro no distinga mayúsculas.
    categoria: { type: String, required: true, trim: true, lowercase: true, maxlength: 60, index: true },
    // Regla de negocio también en la BD: el precio debe ser mayor que cero.
    precio: {
      type: Number,
      required: true,
      validate: { validator: (v) => v > 0, message: 'El precio debe ser mayor que cero' },
    },
  },
  {
    collection: 'productos',
    timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' },
    toJSON: formatoJSON,
  }
);

module.exports = model('Producto', productoSchema);
