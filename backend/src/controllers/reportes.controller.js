// Controlador de reportería (solo administradores).
const reportesRepo = require('../repositories/reportes.repository');
const { enviar } = require('../utils/respuesta');

// GET /api/reportes/resumen  -> totales, productos por categoría y más favoritos
async function resumen(req, res) {
  enviar(res, 200, await reportesRepo.resumen());
}

// Escapa un valor para CSV (comillas dobles y separadores).
function celdaCsv(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",;\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// GET /api/reportes/productos.csv  -> descarga del catálogo con conteo de favoritos
async function productosCsv(req, res) {
  const filas = await reportesRepo.productosConFavoritos();
  const encabezado = ['id', 'nombre', 'categoria', 'precio', 'favoritos', 'creado_en'];
  const lineas = [
    encabezado.join(','),
    ...filas.map((f) => [
      f.id, f.nombre, f.categoria, f.precio.toFixed(2), f.favoritos,
      f.creado_en ? new Date(f.creado_en).toISOString() : '',
    ].map(celdaCsv).join(',')),
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-productos.csv"');
  // BOM para que Excel muestre bien las tildes.
  res.status(200).send('﻿' + lineas.join('\r\n'));
}

module.exports = { resumen, productosCsv };
