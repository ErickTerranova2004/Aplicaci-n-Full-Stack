// Consultas de reportería con el framework de agregación de MongoDB.
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Favorito = require('../models/Favorito');

const redondear = (n) => Math.round(n * 100) / 100;

// Resumen general del sistema (para el panel del administrador).
async function resumen() {
  const [usuarios, admins, productos, favoritos, porCategoria, masFavoritos] = await Promise.all([
    Usuario.countDocuments(),
    Usuario.countDocuments({ rol: 'admin' }),
    Producto.countDocuments(),
    Favorito.countDocuments(),

    // Productos agrupados por categoría con estadísticas de precio.
    Producto.aggregate([
      {
        $group: {
          _id: '$categoria',
          productos: { $sum: 1 },
          precioPromedio: { $avg: '$precio' },
          precioMinimo: { $min: '$precio' },
          precioMaximo: { $max: '$precio' },
          valorTotal: { $sum: '$precio' },
        },
      },
      { $sort: { productos: -1, _id: 1 } },
    ]),

    // Top 5 productos que más usuarios tienen en favoritos.
    Favorito.aggregate([
      { $group: { _id: '$producto', veces: { $sum: 1 } } },
      { $sort: { veces: -1, _id: 1 } },
      { $limit: 5 },
      { $lookup: { from: 'productos', localField: '_id', foreignField: '_id', as: 'producto' } },
      { $unwind: '$producto' },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          nombre: '$producto.nombre',
          categoria: '$producto.categoria',
          precio: '$producto.precio',
          veces: 1,
        },
      },
    ]),
  ]);

  return {
    totales: { usuarios, administradores: admins, productos, favoritos },
    porCategoria: porCategoria.map((c) => ({
      categoria: c._id,
      productos: c.productos,
      precioPromedio: redondear(c.precioPromedio),
      precioMinimo: c.precioMinimo,
      precioMaximo: c.precioMaximo,
      valorTotal: redondear(c.valorTotal),
    })),
    masFavoritos,
    generadoEn: new Date().toISOString(),
  };
}

// Catálogo completo con la cantidad de veces que cada producto fue marcado como favorito.
async function productosConFavoritos() {
  return Producto.aggregate([
    { $lookup: { from: 'favoritos', localField: '_id', foreignField: 'producto', as: 'favs' } },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        nombre: 1,
        categoria: 1,
        precio: 1,
        favoritos: { $size: '$favs' },
        creado_en: 1,
      },
    },
    { $sort: { categoria: 1, nombre: 1 } },
  ]);
}

module.exports = { resumen, productosConFavoritos };
