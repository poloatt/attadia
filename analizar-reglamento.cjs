const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function analizarReglamento() {
    try {
        // Ruta al archivo PDF
        const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'reglamentodecopropiedad.pdf');
        
        // Verificar si el archivo existe
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ No se encontró el archivo PDF en:', pdfPath);
            console.log('Por favor, asegúrate de que el archivo esté en tu carpeta de Descargas');
            return;
        }

        console.log('📄 Extrayendo texto del PDF...');
        
        // Leer y extraer texto del PDF
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        
        console.log(`✅ Texto extraído. Total de páginas: ${data.numpages}`);
        console.log(`📝 Caracteres extraídos: ${data.text.length}`);
        
        // Crear archivo de texto con el contenido extraído
        const textFilePath = 'reglamento_extraido.txt';
        fs.writeFileSync(textFilePath, data.text);
        console.log(`💾 Texto guardado en: ${textFilePath}`);
        
        // Buscar menciones específicas
        console.log('\n🔍 === ANÁLISIS DEL REGLAMENTO ===\n');
        
        // Términos de búsqueda
        const terminosCorregimiento = [
            'corregimiento',
            'corregimiento de',
            'corregidor',
            'corregidores'
        ];
        
        const terminosAdministracion = [
            'administración',
            'administrador',
            'administradora',
            'sindico',
            'síndico',
            'síndica',
            'personería',
            'personero',
            'personera',
            'gestión',
            'gestor'
        ];
        
        const terminosConsorcio = [
            'consorcio',
            'consorcios',
            'copropietarios',
            'agrupación',
            'agrupaciones',
            'consejo',
            'asamblea',
            'propietarios'
        ];

        // Función para buscar términos y mostrar contexto
        function buscarTerminos(terminos, categoria) {
            console.log(`\n📋 === ${categoria.toUpperCase()} ===`);
            const texto = data.text.toLowerCase();
            
            terminos.forEach(termino => {
                const regex = new RegExp(`.{0,50}\\b${termino.toLowerCase()}\\b.{0,50}`, 'gi');
                const matches = data.text.match(regex);
                
                if (matches && matches.length > 0) {
                    console.log(`\n🔸 Palabra clave: "${termino}"`);
                    console.log(`📊 Aparece ${matches.length} vez(es)`);
                    console.log(`📖 Contextos encontrados:`);
                    
                    matches.slice(0, 5).forEach((match, index) => {
                        console.log(`   ${index + 1}. ${match.trim()}`);
                    });
                    
                    if (matches.length > 5) {
                        console.log(`   ... y ${matches.length - 5} menciones más`);
                    }
                } else {
                    console.log(`❌ "${termino}" - No se encontraron menciones`);
                }
            });
        }
        
        // Buscar cada categoría
        buscarTerminos(terminosCorregimiento, 'Referencias a Corregimiento/Corregidores');
        buscarTerminos(terminosAdministracion, 'Referencias a Administración');
        buscarTerminos(terminosConsorcio, 'Referencias a Consorcios/Copropietarios');
        
        // Análisis adicional
        console.log('\n📈 === ESTADÍSTICAS GENERALES ===');
        console.log(`📄 Total de páginas: ${data.numpages}`);
        console.log(`📝 Total de caracteres: ${data.text.length.toLocaleString()}`);
        console.log(`📊 Total de palabras: ${data.text.split(/\s+/).length.toLocaleString()}`);
        
        // Buscar secciones comunes en reglamentos
        console.log('\n📚 === ESTRUCTURA DEL DOCUMENTO ===');
        const seccionesComunes = [
            'CÁPITULO',
            'ARTÍCULO',
            'TÍTULO',
            'SECCIÓN',
            'CONSIDERANDOS',
            'CLAUSULA',
            'CLÁUSULA'
        ];
        
        seccionesComunes.forEach(titulo => {
            const regex = new RegExp(`\\b${titulo}\\s+\\d+`, 'gi');
            const matches = data.text.match(regex);
            if (matches) {
                console.log(`📄 ${titulo}: ${matches.length} encontrados`);
                console.log(`   Ejemplos: ${matches.slice(0, 3).join(', ')}`);
            }
        });
        
        console.log('\n✅ Análisis completado!');
        console.log(`📁 Puedes revisar el texto completo en el archivo: ${textFilePath}`);
        
    } catch (error) {
        console.error('❌ Error al procesar el PDF:', error.message);
        
        if (error.message.includes('Invalid PDF')) {
            console.log('💡 Posibles soluciones:');
            console.log('   - Verifica que el archivo PDF no esté corrupto');
            console.log('   - Asegúrate de que el PDF contenga texto seleccionable');
            console.log('   - Intenta convertir el PDF a una versión más nueva');
        }
    }
}

// Ejecutar el análisis
analizarReglamento();
