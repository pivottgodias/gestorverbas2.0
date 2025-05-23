// pdfGenerator.js - Geração de PDF Aprimorado Visualmente
const PDFGenerator = {
  // Configuração de cores e estilos
  styles: {
    colors: {
      primary: [41, 128, 185],      // Azul principal
      secondary: [46, 204, 113],    // Verde
      accent: [241, 196, 15],       // Amarelo
      dark: [52, 73, 94],           // Cinza escuro
      light: [236, 240, 241]        // Cinza claro
    },
    fonts: {
      header: 'helvetica',
      body: 'helvetica'
    }
  },
  
  async generateDossie(formData) {
    try {
      UI.showLoading();
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true
      });
      
      // Configuração de margens mais confortáveis
      const margin = 20;      // Margem padrão em mm
      const pageWidth = 210;  // Largura A4 em mm
      const pageHeight = 297; // Altura A4 em mm
      const contentWidth = pageWidth - (margin * 2);
      
      // Variável para controle de posição vertical
      let y = margin;
      
      // Pré-carrega fotos merch → DataURLs
      const merchInputs = Array.from(document.querySelectorAll('input[name="merch_item_photo[]"]'));
      const merchFiles = merchInputs.flatMap(i => Array.from(i.files));
      const merchPhotosData = await Promise.all(
        merchFiles.map(file => this.readFileAsDataURL(file))
      );
      
      // Adicionar cabeçalho com destaque visual
      this.addHeader(doc, 'DOSSIÊ DE VERBA', y);
      y += 16;
      
      // Adicionar caixa de informações
      y = this.addInfoBox(doc, {
        rede: formData.rede.toUpperCase(),
        mercado: formData.mercado.toUpperCase(),
        cidade_uf: `${formData.cidade.toUpperCase()} - ${formData.uf.toUpperCase()}`,
        vendedor: formData.vendedor.toUpperCase(),
        contrato: formData.contrato.toUpperCase(),
        data: new Date().toLocaleDateString('pt-BR').toUpperCase()
      }, y);
      
      y += 10;
      
      // SELL OUT com estilo aprimorado
      const sellOutRows = this.collectRows('items-container-sell-out');
      if (sellOutRows.length) {
        this.addSectionTitle(doc, 'SELL OUT', y, this.styles.colors.primary);
        y += 8;
        
        doc.autoTable({ 
          startY: y,
          head: [['FAMÍLIA', 'PRODUTO', 'UND', 'BON. (R$)', 'VERBA (R$)', 'TTC (R$)', 'TTV (R$)']],
          body: sellOutRows,
          theme: 'grid',
          headStyles: { 
            fillColor: this.styles.colors.primary, 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 3
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3
          },
          margin: { left: 15, right: 15 },
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'auto',
            halign: 'center',
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { fontStyle: 'bold' }
          },
          didParseCell: (data) => {
            if (data.column.index === 1) {
              data.cell.styles.cellWidth = 40;
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // SELL IN com estilo aprimorado
      const sellInRows = this.collectRows('items-container-sell-in', true);
      if (sellInRows.length) {
        this.addSectionTitle(doc, 'SELL IN', y, this.styles.colors.secondary);
        y += 8;
        
        doc.autoTable({ 
          startY: y,
          head: [['FAMÍLIA', 'PRODUTO', 'UND', 'BON. (R$)', 'VERBA (R$)', 'TTC (R$)', 'TTV (R$)']],
          body: sellInRows, 
          theme: 'grid',
          headStyles: { 
            fillColor: this.styles.colors.secondary, 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 3
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3
          },
          margin: { left: 15, right: 15 },
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'auto',
            halign: 'center',
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { fontStyle: 'bold' }
          },
          didParseCell: (data) => {
            if (data.column.index === 1) {
              data.cell.styles.cellWidth = 40;
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // Verifica se precisa de nova página para o merchandising
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }
      
      // MERCHANDISING com layout aprimorado
      const merchRows = this.collectMerchRows();
      if (merchRows.length) {
        this.addSectionTitle(doc, 'MERCHANDISING', y, this.styles.colors.accent);
        y += 8;
        
        doc.autoTable({
          startY: y,
          head: [['VERBA (R$)', 'OPÇÃO', 'FOTO']],
          body: merchRows.map((r, i) => [r[0], r[1], '']),
          theme: 'grid',
          styles: { 
            cellPadding: 4,
            fontSize: 8
          },
          columnStyles: { 
            2: { cellWidth: 25 },
            1: { cellWidth: 65 }
          },
          headStyles: { 
            fillColor: this.styles.colors.accent, 
            textColor: 0, 
            fontStyle: 'bold',
            fontSize: 9
          },
          margin: { left: 15, right: 15 },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          didDrawCell: data => {
            if (data.section === 'body' && data.column.index === 2) {
              const imgObj = merchPhotosData[data.row.index];
              if (!imgObj) return;
              const mode = imgObj.type.includes('png') ? 'PNG' : 'JPEG';
              
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;
              const imgSize = Math.min(cellWidth - 8, cellHeight - 8);
              
              doc.addImage(
                imgObj.dataUrl, 
                mode, 
                data.cell.x + (cellWidth - imgSize) / 2, 
                data.cell.y + (cellHeight - imgSize) / 2, 
                imgSize, 
                imgSize
              );
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // Verificar se precisa de nova página para os totais
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }
      
      // Totais com visual melhorado
      let totalSellOut = 0, totalSellIn = 0, totalMerch = 0;
      sellOutRows.forEach(r => totalSellOut += parseFloat(r[4]) || 0);
      sellInRows.forEach(r => totalSellIn += parseFloat(r[4]) || 0);
      merchRows.forEach(r => totalMerch += parseFloat(r[0]) || 0);
      const totalGeral = totalSellOut + totalSellIn + totalMerch;

      // Verifica tamanho da página
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }
      
      // Adicionar resumo financeiro em formato de caixa destacada
      y = this.addTotalsBox(doc, {
        sellOut: totalSellOut,
        sellIn: totalSellIn,
        merch: totalMerch,
        total: totalGeral
      }, y);
      
      y += 15;

      // Verificar se há espaço suficiente para as assinaturas
      const spaceNeededForSignatures = 60;
      if (y + spaceNeededForSignatures > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      // Assinaturas com layout melhorado
      this.addSignatureSection(doc, y, totalGeral >= 15000);
      
      // Mescla jsPDF + anexos gerais
      const jsPdfBytes = doc.output('arraybuffer');
      const pdfDoc = await PDFLib.PDFDocument.load(jsPdfBytes);
      
      // Adiciona anexos com página de separação
      await this.addAttachmentsWithSeparator(pdfDoc, formData.dossie_files);
      
      // Páginas com fotos de merchandising ampliadas com melhor layout
      await this.addEnhancedMerchandisingPhotos(pdfDoc, merchPhotosData);
      
      const finalBytes = await pdfDoc.save();
      
      // Formatação da data no padrão DD-MM-YYYY para usar no nome do arquivo
      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-').toUpperCase();

      // Formatação do nome do arquivo seguindo o padrão solicitado
      const nomeArquivo = `${formData.rede.toUpperCase() || 'SEM-REDE'}-${formData.vendedor.toUpperCase() || 'SEM-VENDEDOR'}-${formData.contrato.toUpperCase() || 'SEM-CONTRATO'}-${formData.uf.toUpperCase() || 'SEM-ESTADO'}-${dataHoje}.pdf`;

      // Substitui caracteres problemáticos para nomes de arquivo
      const nomeArquivoSeguro = nomeArquivo.replace(/[\\/:*?"<>|]/g, '_');

      // Inicia o download com o novo nome de arquivo
      if (typeof download === 'function') {
        download(finalBytes, nomeArquivoSeguro, 'application/pdf');
      } else {
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivoSeguro;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      UI.hideLoading();
      UI.showToast('DOSSIÊ GERADO COM SUCESSO!', 'success');
      document.getElementById('btn-docusign').style.display = 'block';
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      UI.hideLoading();
      UI.showToast('ERRO AO GERAR O DOSSIÊ. TENTE NOVAMENTE.', 'error');
      return false;
    }
  },
  
  // Adiciona cabeçalho elegante
  addHeader(doc, title, y) {
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFillColor(...this.styles.colors.dark);
    doc.rect(0, 0, pageWidth, y + 15, 'F');
    
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(24);
    doc.text(title, pageWidth / 2, y + 10, { align: 'center' });
    
    doc.setTextColor(0);
    doc.setFont(this.styles.fonts.body, 'normal');
  },
  
  // Adiciona título de seção com barra colorida
  addSectionTitle(doc, title, y, color) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 2, pageWidth - (margin * 2), 10, 2, 2, 'F');
    
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.text(title, pageWidth / 2, y + 4, { align: 'center' });
    
    doc.setTextColor(0);
    doc.setFont(this.styles.fonts.body, 'normal');
  },
  
  // Adiciona caixa de informações
  addInfoBox(doc, info, y) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const boxWidth = pageWidth - (margin * 2);
    
    const lineHeight = 7;
    const padding = 6;
    let boxHeight = Object.keys(info).length * lineHeight + (padding * 2);
    if (info.contrato) boxHeight += lineHeight;
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...this.styles.colors.primary);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    let textY = y + padding + 4;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('REDE:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.rede, margin + 40, textY);
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('MERCADO:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.mercado, margin + 40, textY);
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('CIDADE/UF:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.cidade_uf, margin + 40, textY);
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('VENDEDOR:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.vendedor, margin + 40, textY);
    textY += lineHeight;
    
    if (info.contrato) {
      doc.setFont(this.styles.fonts.body, 'bold');
      doc.text('CONTRATO:', margin + padding, textY);
      doc.setFont(this.styles.fonts.body, 'normal');
      doc.text(info.contrato, margin + 40, textY);
      textY += lineHeight;
    }
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('DATA:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.data, margin + 40, textY);
    
    return y + boxHeight;
  },
  
  // Adiciona caixa de totais estilizada
  addTotalsBox(doc, totals, y) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const boxWidth = pageWidth - (margin * 2);
    
    const lineHeight = 7;
    const padding = 8;
    const boxHeight = 5 * lineHeight + (padding * 2);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...this.styles.colors.dark);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    
    doc.setFillColor(...this.styles.colors.dark);
    doc.roundedRect(margin, y, boxWidth, 10, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.text('RESUMO FINANCEIRO', pageWidth / 2, y + 7, { align: 'center' });
    
    let textY = y + padding + 14;
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('TOTAL SELL OUT:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(formatCurrency(totals.sellOut), margin + boxWidth - padding - 50, textY, { align: 'right' });
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('TOTAL SELL IN:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(formatCurrency(totals.sellIn), margin + boxWidth - padding - 50, textY, { align: 'right' });
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('TOTAL MERCHANDISING:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(formatCurrency(totals.merch), margin + boxWidth - padding - 50, textY, { align: 'right' });
    textY += lineHeight;
    
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + padding, textY - 1, margin + boxWidth - padding, textY - 1);
    
    textY += 4;
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.styles.colors.dark);
    doc.text('TOTAL GERAL:', margin + padding, textY);
    doc.text(formatCurrency(totals.total), margin + boxWidth - padding - 50, textY, { align: 'right' });
    
    return y + boxHeight;
  },
  
  // Adiciona seção de assinaturas estilizada
  addSignatureSection(doc, y, includeExtra) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const signWidth = 70;
    const signMargin = 10;
    
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.styles.colors.dark);
    doc.text('ASSINATURAS', margin, y + 10);
    
    doc.setDrawColor(...this.styles.colors.dark);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 12, margin + 40, y + 12);
    
    let startX;
    if (includeExtra) {
      startX = (pageWidth - (3 * signWidth + 2 * signMargin)) / 2;
    } else {
      startX = (pageWidth - (2 * signWidth + signMargin)) / 2;
    }
    
    y += 30;
    doc.setLineWidth(0.5);
    
    doc.line(startX, y, startX + signWidth, y);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.setFontSize(10);
    doc.text('RAFAEL SPERB', startX + signWidth/2, y + 5, { align: 'center' });
    
    let secondX = startX + signWidth + signMargin;
    doc.line(secondX, y, secondX + signWidth, y);
    doc.text('WELLINGTON MARTINS', secondX + signWidth/2, y + 5, { align: 'center' });
    
    if (includeExtra) {
      let thirdX = secondX + signWidth + signMargin;
      doc.line(thirdX, y, thirdX + signWidth, y);
      doc.text('MARCIO MENDES', thirdX + signWidth/2, y + 5, { align: 'center' });
    }
  },
  
  // Adiciona anexos com página separadora
  async addAttachmentsWithSeparator(pdfDoc, fileList) {
    if (fileList && fileList.length > 0) {
      /* Comentado a página separadora
      const separatorPage = pdfDoc.addPage([595, 841]);
      const { width, height } = separatorPage.getSize();
      
      separatorPage.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: PDFLib.rgb(0.2, 0.3, 0.4)
      });
      
      const helveticaBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      separatorPage.drawText('ANEXOS', {
        x: width / 2 - 60,
        y: height - 60,
        size: 36,
        font: helveticaBold,
        color: PDFLib.rgb(1, 1, 1)
      });
      */

      for (const file of fileList) {
        const buf = await file.arrayBuffer();
        if (file.type === 'application/pdf') {
          const src = await PDFLib.PDFDocument.load(buf);
          const pages = await pdfDoc.copyPages(src, src.getPageIndices());
          pages.forEach(p => pdfDoc.addPage(p));
        } else if (file.type.includes('image')) {
          const img = file.type.includes('png')
            ? await pdfDoc.embedPng(buf)
            : await pdfDoc.embedJpg(buf);
          
          const margin = 50;
          const maxWidth = 595 - (margin * 2);
          const maxHeight = 841 - (margin * 2);
          
          const { width, height } = img.scaleToFit(maxWidth, maxHeight);
          
          const pg = pdfDoc.addPage([595, 841]);
          
          pg.drawImage(img, {
            x: (595 - width) / 2,
            y: (841 - height) / 2,
            width,
            height
          });
        }
      }
    }
  },
  
  // Adiciona fotos de merchandising com layout melhorado
  async addEnhancedMerchandisingPhotos(pdfDoc, merchPhotosData) {
    const helvB = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    
    if (merchPhotosData.length > 0) {
      /* Comentado a página separadora
      const separatorPage = pdfDoc.addPage([595, 841]);
      separatorPage.drawRectangle({
        x: 0,
        y: 741,
        width: 595,
        height: 100,
        color: PDFLib.rgb(0.95, 0.77, 0.06)
      });
      
      separatorPage.drawText('FOTOS DE MERCHANDISING', {
        x: 595 / 2 - 150,
        y: 791,
        size: 28,
        font: helvB,
        color: PDFLib.rgb(0.2, 0.2, 0.2)
      });
      */
    }
    
    for (let i = 0; i < merchPhotosData.length; i++) {
      if (!merchPhotosData[i]) continue;
      
      const { dataUrl, type } = merchPhotosData[i];
      if (!dataUrl) continue;
      
      const img = type.includes('png')
        ? await pdfDoc.embedPng(dataUrl)
        : await pdfDoc.embedJpg(dataUrl);
        
      const pg = pdfDoc.addPage([595, 841]);
      
      pg.drawRectangle({
        x: 0,
        y: 791,
        width: 595,
        height: 50,
        color: PDFLib.rgb(0.95, 0.77, 0.06)
      });
      
      pg.drawText(`FOTO DE MERCHANDISING ${i + 1}`, {
        x: 20,
        y: 816,
        size: 18,
        font: helvB,
        color: PDFLib.rgb(0.2, 0.2, 0.2)
      });
      
      const margin = 50;
      const maxWidth = 595 - (margin * 2);
      const maxHeight = 700;
      
      const { width, height } = img.scaleToFit(maxWidth, maxHeight);
      
      pg.drawRectangle({
        x: (595 - width - 10) / 2,
        y: (791 - height - 10) / 2 - 30,
        width: width + 10,
        height: height + 10,
        borderColor: PDFLib.rgb(0.95, 0.77, 0.06),
        borderWidth: 3,
        color: PDFLib.rgb(1, 1, 1)
      });
      
      pg.drawImage(img, {
        x: (595 - width) / 2,
        y: (791 - height) / 2 - 30,
        width,
        height
      });
      
      pg.drawText(`PÁGINA ${i + 1} DE ${merchPhotosData.filter(p => p).length}`, {
        x: 295,
        y: 30,
        size: 10,
        font: helv,
        color: PDFLib.rgb(0.5, 0.5, 0.5),
        align: 'center'
      });
    }
  },
  
  // Métodos auxiliares
  readFileAsDataURL(file) {
    return new Promise(resolve => {
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, type: file.type });
      reader.readAsDataURL(file);
    });
  },
  
  collectRows(containerId, isSellIn = false) {
    const prefix = isSellIn ? '_in' : '';
    return Array.from(document.getElementById(containerId).querySelectorAll('.item-row'))
      .map(r => [
        (r.querySelector(`[name^="item_familia${prefix}"]`).value || '').toUpperCase(),
        (r.querySelector(`[name^="item_produto${prefix}"]`).value || '').toUpperCase(),
        (r.querySelector(`[name^="item_unidades${prefix}"]`).value || '').toUpperCase(),
        (r.querySelector(`[name^="item_bonificacao${prefix}"]`).value || '').toUpperCase(),
        (r.querySelector(`[name^="item_verba${prefix}"]`).value || '').toUpperCase(),
        (r.querySelector(`[name^="item_ttc${prefix}"]`).value || '').toUpperCase(),
        (r.querySelector(`[name^="item_ttv${prefix}"]`).value || '').toUpperCase()
      ])
      .filter(r => r.some(c => c !== ''))
      .filter(r => {
        const verba = parseFloat(r[4]) || 0;
        return verba > 0;
      });
  },

  collectMerchRows() {
    return Array.from(document.querySelectorAll('.merch-item-row'))
      .map(r => {
        const opcao = r.querySelector('[name="merch_item_opcao[]"]').value.toUpperCase();
        const custom = r.querySelector('[name="merch_item_custom[]"]')?.value.toUpperCase() || '';
        
        return [
          (r.querySelector('[name="merch_item_verba[]"]').value || '').toUpperCase(),
          opcao === 'OUTRO' && custom ? custom : opcao
        ];
      })
      .filter(r => r.some(c => c !== ''))
      .filter(r => {
        const verba = parseFloat(r[0]) || 0;
        return verba > 0;
      });
  }
};
