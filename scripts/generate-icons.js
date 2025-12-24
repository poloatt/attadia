const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamaños de iconos requeridos según manifest.json
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Configuración de apps
const apps = [
  {
    name: 'pulso',
    svgPath: 'apps/pulso/public/pulso-icon.svg',
    iconsDir: 'apps/pulso/public/icons'
  },
  {
    name: 'foco',
    svgPath: 'apps/foco/public/foco-icon.svg',
    iconsDir: 'apps/foco/public/icons'
  },
  {
    name: 'atta',
    svgPath: 'apps/atta/public/atta-icon.svg',
    iconsDir: 'apps/atta/public/icons'
  }
];

async function generateIcons() {
  console.log('🎨 Generando iconos PNG desde SVG...\n');

  for (const app of apps) {
    const svgFullPath = path.join(process.cwd(), app.svgPath);
    const iconsFullDir = path.join(process.cwd(), app.iconsDir);

    // Verificar que existe el SVG
    if (!fs.existsSync(svgFullPath)) {
      console.error(`❌ No se encontró el SVG: ${app.svgPath}`);
      continue;
    }

    // Crear directorio de iconos si no existe
    if (!fs.existsSync(iconsFullDir)) {
      fs.mkdirSync(iconsFullDir, { recursive: true });
    }

    console.log(`📱 Generando iconos para ${app.name}...`);

    // Generar cada tamaño
    for (const size of iconSizes) {
      const outputPath = path.join(iconsFullDir, `icon-${size}x${size}.png`);
      
      try {
        await sharp(svgFullPath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
        
        console.log(`  ✓ Generado: icon-${size}x${size}.png`);
      } catch (error) {
        console.error(`  ✗ Error generando icon-${size}x${size}.png:`, error.message);
      }
    }

    console.log(`✅ Iconos de ${app.name} generados correctamente\n`);
  }

  console.log('🎉 ¡Todos los iconos han sido generados!');
}

// Ejecutar
generateIcons().catch(error => {
  console.error('❌ Error al generar iconos:', error);
  process.exit(1);
});

