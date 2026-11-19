// Formato común al convertir documentos a JSON:
// "_id" pasa a ser "id" (texto) y se eliminan "__v" y cualquier hash de contraseña.
const formatoJSON = {
  virtuals: false,
  versionKey: false,
  transform(doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    // Se coloca "id" primero para que las respuestas sean más legibles.
    return { id: ret.id, ...ret };
  },
};

module.exports = { formatoJSON };
