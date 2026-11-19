// Colección "usuarios".
const { Schema, model } = require('mongoose');
const { formatoJSON } = require('./formato');

const usuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    // unique crea un índice único: dos usuarios no pueden tener el mismo correo.
    correo: { type: String, required: true, trim: true, lowercase: true, maxlength: 255, unique: true },
    // select:false -> el hash NUNCA se devuelve en las consultas salvo que se pida explícitamente.
    passwordHash: { type: String, required: true, select: false },
    rol: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
  },
  {
    collection: 'usuarios',
    timestamps: { createdAt: 'creado_en', updatedAt: false },
    toJSON: formatoJSON,
  }
);

module.exports = model('Usuario', usuarioSchema);
