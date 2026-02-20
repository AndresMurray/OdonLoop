import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getTodosSeguimientosPaciente } from '../api/seguimientoService';

/**
 * Exportar a PDF: Odontograma + Todos los seguimientos de un paciente
 */
export const exportarHistorialPacientePDF = async (pacienteId, pacienteNombre, odontogramaRef) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // ============================================
  // PORTADA / ENCABEZADO
  // ============================================
  pdf.setFillColor(30, 58, 138); // azul oscuro
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Seguimiento Odontológico', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Paciente: ${pacienteNombre}`, pageWidth / 2, 32, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, 40, { align: 'center' });

  yPos = 55;

  // ============================================
  // ODONTOGRAMA (captura del componente)
  // ============================================
  if (odontogramaRef?.current) {
    pdf.setTextColor(30, 58, 138);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Odontograma', margin, yPos);
    yPos += 3;

    // Línea separadora
    pdf.setDrawColor(30, 58, 138);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    try {
      const element = odontogramaRef.current;
      // El modal está visible y centrado, html2canvas puede capturarlo sin problemas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: 1200,
        windowWidth: 1200,
      });
      if (!canvas) {
        console.error('html2canvas no devolvió un canvas');
      } else {
        console.log('Canvas odontograma generado:', canvas.width, canvas.height);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        // Si la imagen es muy grande, ajustar
        const maxImgHeight = pageHeight - yPos - margin - 10;
        const finalHeight = Math.min(imgHeight, maxImgHeight);
        const finalWidth = (imgHeight > maxImgHeight) 
          ? (canvas.width * finalHeight) / canvas.height 
          : imgWidth;
        pdf.addImage(imgData, 'PNG', margin, yPos, finalWidth, finalHeight);
        yPos += finalHeight + 10;
        console.log('Imagen odontograma agregada al PDF');
      }
    } catch (err) {
      console.error('Error al capturar odontograma:', err);
      pdf.setTextColor(200, 0, 0);
      pdf.setFontSize(10);
      pdf.text('No se pudo capturar el odontograma', margin, yPos);
      yPos += 10;
    }
  }

  // ============================================
  // SEGUIMIENTOS
  // ============================================
  let seguimientos = [];
  try {
    seguimientos = await getTodosSeguimientosPaciente(pacienteId);
    // La respuesta puede ser un array directamente o un objeto con results
    if (!Array.isArray(seguimientos)) {
      seguimientos = seguimientos.results || [];
    }
  } catch (err) {
    console.error('Error al obtener seguimientos:', err);
  }

  if (seguimientos.length > 0) {
    // Nueva página para seguimientos
    pdf.addPage();
    yPos = margin;

    // Encabezado de seguimientos
    pdf.setFillColor(30, 58, 138);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Historial de Seguimientos', pageWidth / 2, 18, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total: ${seguimientos.length} seguimiento(s)`, pageWidth / 2, 26, { align: 'center' });

    yPos = 38;

    for (let i = 0; i < seguimientos.length; i++) {
      const seg = seguimientos[i];
      
      // Verificar si hay espacio suficiente (mínimo 50mm)
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      // Número de seguimiento
      pdf.setFillColor(240, 245, 255);
      pdf.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      const fechaFormateada = formatearFecha(seg.fecha_atencion);
      pdf.text(`Seguimiento #${i + 1} — ${fechaFormateada}`, margin + 3, yPos + 5);
      yPos += 14;

      // Odontólogo
      if (seg.odontologo_nombre) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Atendido por: ${seg.odontologo_nombre}`, margin + 3, yPos);
        yPos += 6;
      }

      // Descripción
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const descripcion = seg.descripcion || 'Sin descripción';
      const lineasDescripcion = pdf.splitTextToSize(descripcion, contentWidth - 6);
      
      for (const linea of lineasDescripcion) {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(linea, margin + 3, yPos);
        yPos += 5;
      }
      yPos += 3;

      // Archivos/Imágenes
      const archivos = seg.archivos || [];
      const tieneImagenLegacy = seg.imagen_url && archivos.length === 0;

      if (archivos.length > 0 || tieneImagenLegacy) {
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Archivos adjuntos:', margin + 3, yPos);
        yPos += 5;

        // Intentar cargar imágenes en el PDF
        const imagenesParaCargar = [];

        if (tieneImagenLegacy) {
          imagenesParaCargar.push({
            url: seg.imagen_url,
            nombre: 'Imagen del seguimiento',
            tipo: 'imagen'
          });
        }

        for (const archivo of archivos) {
          imagenesParaCargar.push({
            url: archivo.url,
            nombre: archivo.nombre_original || 'Archivo',
            tipo: archivo.tipo
          });
        }

        for (const img of imagenesParaCargar) {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }

          const esImagen = img.tipo === 'imagen' && 
            !img.nombre?.toLowerCase().endsWith('.pdf');

          if (esImagen) {
            try {
              const imgData = await cargarImagenBase64(img.url);
              if (imgData) {
                const maxW = contentWidth * 0.7;
                const maxH = 80;
                const dims = calcularDimensiones(imgData, maxW, maxH);
                
                if (yPos + dims.height > pageHeight - margin) {
                  pdf.addPage();
                  yPos = margin;
                }

                pdf.addImage(imgData, 'JPEG', margin + 3, yPos, dims.width, dims.height);
                yPos += dims.height + 3;
                
                // Nombre del archivo debajo de la imagen
                pdf.setTextColor(120, 120, 120);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'italic');
                pdf.text(img.nombre, margin + 3, yPos);
                yPos += 6;
              } else {
                // No se pudo cargar, solo texto
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`📎 ${img.nombre} (imagen)`, margin + 6, yPos);
                yPos += 5;
              }
            } catch {
              pdf.setTextColor(100, 100, 100);
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`📎 ${img.nombre} (imagen)`, margin + 6, yPos);
              yPos += 5;
            }
          } else {
            // Documento (PDF, DOC, etc.)
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            const ext = img.nombre?.split('.').pop()?.toUpperCase() || 'FILE';
            pdf.text(`📄 ${img.nombre} [${ext}]`, margin + 6, yPos);
            yPos += 5;
          }
        }
      }

      // Línea separadora entre seguimientos
      yPos += 3;
      if (i < seguimientos.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
        yPos += 8;
      }
    }
  } else {
    // Sin seguimientos
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = margin;
    }
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text('No hay seguimientos registrados para este paciente.', margin, yPos);
  }

  // ============================================
  // PIE DE PAGINA EN TODAS LAS PAGINAS
  // ============================================
  const totalPages = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Página ${p} de ${totalPages} — Generado el ${new Date().toLocaleString('es-AR')}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // Guardar
  const nombreArchivo = `historia_clinica_${pacienteNombre.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(nombreArchivo);
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const [year, month, day] = fecha.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Cargar imagen remotamente y convertir a base64
 */
function cargarImagenBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    // Timeout de 10 segundos
    setTimeout(() => resolve(null), 10000);
    img.src = url;
  });
}

/**
 * Calcular dimensiones manteniendo aspecto
 */
function calcularDimensiones(imgDataUrl, maxWidth, maxHeight) {
  const img = new Image();
  img.src = imgDataUrl;
  
  let width = img.naturalWidth || 200;
  let height = img.naturalHeight || 150;
  
  // Escalar
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: width * ratio,
    height: height * ratio
  };
}
