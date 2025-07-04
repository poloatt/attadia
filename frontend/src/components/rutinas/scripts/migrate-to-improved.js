#!/usr/bin/env node

/**
 * Script de migración automatizada
 * Migra de InlineItemConfig a InlineItemConfigImproved
 * 
 * Uso: node migrate-to-improved.js [archivo.jsx]
 * 
 * El script:
 * 1. Busca imports de InlineItemConfig
 * 2. Los reemplaza por InlineItemConfigImproved
 * 3. Actualiza las props según la nueva API
 * 4. Crea backup del archivo original
 */

const fs = require('fs');
const path = require('path');

// Configuración de migración
const MIGRATION_CONFIG = {
  oldImport: /import\s+(\w+)\s+from\s+['"]\.*\/InlineItemConfig['"]/g,
  newImport: "import $1 from './InlineItemConfigImproved'",
  oldComponentPattern: /<InlineItemConfig\s+([\s\S]*?)\/>/g,
  propMappings: {
    'section': 'sectionId',
    'onChange': 'onConfigChange'
  }
};

/**
 * Crea backup del archivo original
 */
function createBackup(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ Backup creado: ${backupPath}`);
  return backupPath;
}

/**
 * Migra las props del componente
 */
function migrateProps(propsString) {
  let newProps = propsString;
  
  // Mapear props según configuración
  Object.entries(MIGRATION_CONFIG.propMappings).forEach(([oldProp, newProp]) => {
    const propRegex = new RegExp(`\\b${oldProp}=`, 'g');
    newProps = newProps.replace(propRegex, `${newProp}=`);
  });
  
  // Agregar props requeridas si no existen
  if (!newProps.includes('itemId=')) {
    newProps += '\n                  itemId={itemId}';
  }
  
  if (!newProps.includes('sectionId=') && !newProps.includes('section=')) {
    newProps += '\n                  sectionId={section}';
  }
  
  return newProps;
}

/**
 * Migra el contenido del archivo
 */
function migrateFileContent(content) {
  let newContent = content;
  
  // 1. Migrar imports
  newContent = newContent.replace(
    MIGRATION_CONFIG.oldImport,
    MIGRATION_CONFIG.newImport
  );
  
  // 2. Migrar componentes
  newContent = newContent.replace(
    MIGRATION_CONFIG.oldComponentPattern,
    (match, props) => {
      const migratedProps = migrateProps(props);
      return `<InlineItemConfigImproved ${migratedProps}/>`;
    }
  );
  
  // 3. Actualizar referencias al nombre del componente
  newContent = newContent.replace(
    /(?<!import\s+\w+\s+from\s+['"]\.*\/)InlineItemConfig(?!\w)/g,
    'InlineItemConfigImproved'
  );
  
  return newContent;
}

/**
 * Valida que el archivo es elegible para migración
 */
function validateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    throw new Error('Solo se pueden migrar archivos .jsx o .js');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('InlineItemConfig')) {
    console.log(`⚠️  El archivo ${filePath} no contiene referencias a InlineItemConfig`);
    return false;
  }
  
  if (content.includes('InlineItemConfigImproved')) {
    console.log(`⚠️  El archivo ${filePath} ya parece estar migrado`);
    return false;
  }
  
  return true;
}

/**
 * Ejecuta la migración en un archivo
 */
function migrateFile(filePath) {
  try {
    console.log(`🔄 Migrando: ${filePath}`);
    
    // Validar archivo
    if (!validateFile(filePath)) {
      return false;
    }
    
    // Crear backup
    const backupPath = createBackup(filePath);
    
    // Leer contenido original
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Migrar contenido
    const migratedContent = migrateFileContent(originalContent);
    
    // Escribir nuevo contenido
    fs.writeFileSync(filePath, migratedContent, 'utf8');
    
    console.log(`✅ Migración completada: ${filePath}`);
    console.log(`📁 Backup disponible en: ${backupPath}`);
    
    // Mostrar diferencias principales
    const originalLines = originalContent.split('\n').length;
    const migratedLines = migratedContent.split('\n').length;
    
    console.log(`📊 Estadísticas:`);
    console.log(`   - Líneas originales: ${originalLines}`);
    console.log(`   - Líneas migradas: ${migratedLines}`);
    console.log(`   - Diferencia: ${migratedLines - originalLines}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error migrando ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Busca archivos que requieren migración en un directorio
 */
function findFilesToMigrate(directory = '.') {
  const files = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('InlineItemConfig') && !content.includes('InlineItemConfigImproved')) {
            files.push(fullPath);
          }
        } catch (error) {
          // Ignorar archivos que no se pueden leer
        }
      }
    });
  }
  
  scanDirectory(directory);
  return files;
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  
  console.log('🚀 Script de Migración: InlineItemConfig → InlineItemConfigImproved');
  console.log('=' * 60);
  
  if (args.length === 0) {
    // Modo automático: buscar archivos
    console.log('📂 Buscando archivos que requieren migración...');
    const filesToMigrate = findFilesToMigrate();
    
    if (filesToMigrate.length === 0) {
      console.log('✅ No se encontraron archivos que requieran migración');
      return;
    }
    
    console.log(`📋 Archivos encontrados: ${filesToMigrate.length}`);
    filesToMigrate.forEach(file => console.log(`   - ${file}`));
    
    console.log('\n🔄 Iniciando migración automática...');
    
    let successCount = 0;
    filesToMigrate.forEach(file => {
      if (migrateFile(file)) {
        successCount++;
      }
    });
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Archivos procesados: ${filesToMigrate.length}`);
    console.log(`   - Migraciones exitosas: ${successCount}`);
    console.log(`   - Errores: ${filesToMigrate.length - successCount}`);
    
  } else {
    // Modo manual: archivos específicos
    let successCount = 0;
    
    args.forEach(filePath => {
      if (migrateFile(filePath)) {
        successCount++;
      }
    });
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Archivos procesados: ${args.length}`);
    console.log(`   - Migraciones exitosas: ${successCount}`);
    console.log(`   - Errores: ${args.length - successCount}`);
  }
  
  console.log('\n🎉 Migración completada!');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Revisar los archivos migrados');
  console.log('   2. Ejecutar tests para validar funcionalidad');
  console.log('   3. Eliminar archivos de backup si todo funciona');
  console.log('   4. Actualizar documentación del equipo');
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  migrateFile,
  migrateFileContent,
  findFilesToMigrate
}; 