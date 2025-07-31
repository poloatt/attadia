#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del manifest.json...\n');

// Verificar que el archivo manifest.json existe
const manifestPath = path.join(__dirname, 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  console.log('✅ manifest.json encontrado en public/');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ manifest.json es un JSON válido');
    console.log('📋 Contenido del manifest:');
    console.log(`   - Nombre: ${manifest.name}`);
    console.log(`   - Descripción: ${manifest.description}`);
    console.log(`   - Iconos: ${manifest.icons?.length || 0} iconos`);
  } catch (error) {
    console.log('❌ Error al parsear manifest.json:', error.message);
  }
} else {
  console.log('❌ manifest.json no encontrado en public/');
}

// Verificar que el index.html tiene la referencia al manifest
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.includes('manifest.json')) {
    console.log('✅ index.html incluye referencia a manifest.json');
  } else {
    console.log('❌ index.html no incluye referencia a manifest.json');
  }
} else {
  console.log('❌ index.html no encontrado');
}

// Verificar configuración de nginx
const nginxPath = path.join(__dirname, 'nginx.conf');
if (fs.existsSync(nginxPath)) {
  const nginxContent = fs.readFileSync(nginxPath, 'utf8');
  if (nginxContent.includes('manifest.json')) {
    console.log('✅ nginx.conf incluye configuración para manifest.json');
  } else {
    console.log('❌ nginx.conf no incluye configuración para manifest.json');
  }
  
  if (nginxContent.includes('admin.attadia.com')) {
    console.log('✅ nginx.conf configurado para admin.attadia.com');
  } else {
    console.log('❌ nginx.conf no configurado para admin.attadia.com');
  }
} else {
  console.log('❌ nginx.conf no encontrado');
}

// Verificar configuración de Vercel
const vercelPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelPath)) {
  const vercelContent = fs.readFileSync(vercelPath, 'utf8');
  if (vercelContent.includes('manifest.json')) {
    console.log('✅ vercel.json incluye configuración para manifest.json');
  } else {
    console.log('❌ vercel.json no incluye configuración para manifest.json');
  }
} else {
  console.log('❌ vercel.json no encontrado');
}

console.log('\n🎯 Resumen de la configuración:');
console.log('   - El manifest.json debe estar disponible en: https://admin.attadia.com/manifest.json');
console.log('   - El navegador debería poder acceder al archivo sin errores 404');
console.log('   - La aplicación debería funcionar correctamente en admin.attadia.com'); 