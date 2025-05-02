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
  
  // Função auxiliar para converter texto para caixa alta
  toUpperCase(text) {
    return text ? String(text).toUpperCase() : '';
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
      this.addHeader(doc, 'DOSSIÊ DE VERBA', y); // Já em caixa alta
      y += 16;
      
      // Adicionar caixa de informações com valores em caixa alta
      y = this.addInfoBox(doc, {
        rede: this.toUpperCase(formData.rede),
        mercado: this.toUpperCase(formData.mercado),
        cidade_uf: this.toUpperCase(`${formData.cidade} - ${formData.uf}`),
        vendedor: this.toUpperCase(formData.vendedor),
        contrato: this.toUpperCase(formData.contrato),
        data: new Date().toLocaleDateString('pt-BR')
      }, y);
      
      y += 10;
      
      // SELL OUT com estilo aprimorado e valores em caixa alta
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
            fontSize: 9, // Reduzido de 10 para 9
            cellPadding: 3 // Reduzido de 4 para 3
          },
          bodyStyles: {
            fontSize: 8, // Reduzido de 9 para 8
            cellPadding: 3 // Reduzido de 4 para 3
          },
          margin: { left: 15, right: 15 }, // Reduz de margin (20) para 15
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'auto', // Mudado de 'wrap' para 'auto'
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
            // Aumentar largura das colunas específicas
            if (data.column.index === 1) { // Coluna de produto
              data.cell.styles.cellWidth = 40;
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // SELL IN com estilo aprimorado e valores em caixa alta
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
            fontSize: 9, // Reduzido de 10 para 9
            cellPadding: 3 // Reduzido de 4 para 3
          },
          bodyStyles: {
            fontSize: 8, // Reduzido de 9 para 8
            cellPadding: 3 // Reduzido de 4 para 3
          },
          margin: { left: 15, right: 15 }, // Reduz de margin (20) para 15
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'auto', // Mudado de 'wrap' para 'auto'
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
      
      // MERCHANDISING com layout aprimorado e valores em caixa alta
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
            cellPadding: 4, // Reduzido de 6 para 4
            fontSize: 8 // Reduzido de 9 para 8
          },
          columnStyles: { 
            2: { cellWidth: 25 }, // Reduzido de 30 para 25
            1: { cellWidth: 65 } // Reduzido de 70 para 65
          },
          headStyles: { 
            fillColor: this.styles.colors.accent, 
            textColor: 0, 
            fontStyle: 'bold',
            fontSize: 9 // Reduzido de 10 para 9
          },
          margin: { left: 15, right: 15 }, // Reduz de margin (20) para 15
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          didDrawCell: data => {
            if (data.section === 'body' && data.column.index === 2) {
              const imgObj = merchPhotosData[data.row.index];
              if (!imgObj) return;
              const mode = imgObj.type.includes('png') ? 'PNG' : 'JPEG';
              
              // Centralizar e dimensionar melhor a miniatura
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
      // Se não houver, adicionar uma nova página
      const spaceNeededForSignatures = 60; // Ajuste esse valor conforme necessário
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
      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

      // Formatação do nome do arquivo seguindo o padrão solicitado
      const nomeArquivo = `${formData.rede || 'sem-rede'}-${formData.vendedor || 'sem-vendedor'}-${formData.contrato || 'sem-contrato'}-${formData.uf || 'sem-estado'}-${dataHoje}.pdf`;

      // Substitui caracteres problemáticos para nomes de arquivo
      const nomeArquivoSeguro = nomeArquivo.replace(/[\\/:*?"<>|]/g, '_');

      // Enviar dados para o Google Sheets antes do download
      await this.enviarParaGoogleSheets(formData, {
        sellOutRows,
        sellInRows, 
        merchRows,
        totalSellOut,
        totalSellIn,
        totalMerch,
        totalGeral
      });

      // Inicia o download com o novo nome de arquivo
      // Verifica se a função download existe no escopo global
      if (typeof download === 'function') {
        download(finalBytes, nomeArquivoSeguro, 'application/pdf');
      } else {
        // Alternativa caso a função download não esteja disponível
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
      UI.showToast('Dossiê gerado com sucesso!', 'success');
      document.getElementById('btn-docusign').style.display = 'block';
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      UI.hideLoading();
      UI.showToast('Erro ao gerar o dossiê. Tente novamente.', 'error');
      return false;
    }
  },
  
  // Método para integração com Google Sheets
  async enviarParaGoogleSheets(formData, dados) {
    try {
      // URL do seu Google Apps Script Web App
      const scriptURL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_WEB_APP_AQUI';
      
      // Data formatada
      const dataFormatada = new Date().toLocaleDateString('pt-BR');
      
      // Preparar os dados para o Google Sheets
      const dadosPrincipais = {
        data: dataFormatada,
        rede: this.toUpperCase(formData.rede),
        mercado: this.toUpperCase(formData.mercado),
        cidade: this.toUpperCase(formData.cidade),
        uf: this.toUpperCase(formData.uf),
        vendedor: this.toUpperCase(formData.vendedor),
        contrato: this.toUpperCase(formData.contrato),
        totalSellOut: dados.totalSellOut,
        totalSellIn: dados.totalSellIn,
        totalMerch: dados.totalMerch,
        totalGeral: dados.totalGeral
      };
      
      // Preparar itens do Sell Out
      const itensSellOut = dados.sellOutRows.map(row => ({
        tipo: 'SELL OUT',
        familia: this.toUpperCase(row[0]),
        produto: this.toUpperCase(row[1]),
        unidades: row[2],
        bonificacao: row[3],
        verba: row[4],
        ttc: row[5],
        ttv: row[6]
      }));
      
      // Preparar itens do Sell In
      const itensSellIn = dados.sellInRows.map(row => ({
        tipo: 'SELL IN',
        familia: this.toUpperCase(row[0]),
        produto: this.toUpperCase(row[1]),
        unidades: row[2],
        bonificacao: row[3],
        verba: row[4],
        ttc: row[5],
        ttv: row[6]
      }));
      
      // Preparar itens de Merchandising
      const itensMerch = dados.merchRows.map(row => ({
        tipo: 'MERCHANDISING',
        verba: row[0],
        opcao: this.toUpperCase(row[1])
      }));
      
      // Dados completos para envio
      const dadosParaEnvio = {
        principal: dadosPrincipais,
        itens: [...itensSellOut, ...itensSellIn, ...itensMerch]
      };
      
      // Enviar para o Google Sheets via fetch
      const response = await fetch(scriptURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnvio)
      });
      
      if (response.ok) {
        console.log('Dados enviados com sucesso para o Google Sheets');
        return true;
      } else {
        console.error('Erro ao enviar dados para o Google Sheets');
        return false;
      }
    } catch (error) {
      console.error('Erro na integração com Google Sheets:', error);
      return false;
    }
  },
  
  // Adiciona cabeçalho elegante
  addHeader(doc, title, y) {
    const pageWidth = doc.internal.pageSize.width;
    
    // Desenhar retângulo de cabeçalho
    doc.setFillColor(...this.styles.colors.dark);
    doc.rect(0, 0, pageWidth, y + 15, 'F');
    
    // Adicionar título
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(24);
    doc.text(title, pageWidth / 2, y + 10, { align: 'center' });
    
    // Restaurar cor de texto
    doc.setTextColor(0);
    doc.setFont(this.styles.fonts.body, 'normal');
  },
  
  // Adiciona título de seção com barra colorida
  addSectionTitle(doc, title, y, color) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Desenhar barra colorida
    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 2, pageWidth - (margin * 2), 10, 2, 2, 'F');
    
    // Texto do título
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.text(title, pageWidth / 2, y + 4, { align: 'center' });
    
    // Restaurar cor de texto
    doc.setTextColor(0);
    doc.setFont(this.styles.fonts.body, 'normal');
  },
  
  // Adiciona caixa de informações
  addInfoBox(doc, info, y) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const boxWidth = pageWidth - (margin * 2);
    
    // Altura dinâmica baseada no conteúdo
    const lineHeight = 7;
    const padding = 6;
    let boxHeight = Object.keys(info).length * lineHeight + (padding * 2);
    if (info.contrato) boxHeight += lineHeight;
    
    // Desenhar caixa de fundo
    doc.setFillColor(248, 250, 252); // Cor de fundo suave
    doc.setDrawColor(...this.styles.colors.primary);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    
    // Estilos para o texto
    doc.setFontSize(10);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.setTextColor(0);
    
    // Adicionar informações
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
    
    // Altura dinâmica
    const lineHeight = 7;
    const padding = 8;
    const boxHeight = 5 * lineHeight + (padding * 2);
    
    // Desenhar caixa de fundo
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...this.styles.colors.dark);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    
    // Título da caixa
    doc.setFillColor(...this.styles.colors.dark);
    doc.roundedRect(margin, y, boxWidth, 10, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.text('RESUMO FINANCEIRO', pageWidth / 2, y + 7, { align: 'center' });
    
    // Adicionar valores
    let textY = y + padding + 14;
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    // Função para formatar valores monetários
    const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    
    // Valores parciais
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
    
    // Linha separadora
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + padding, textY - 1, margin + boxWidth - padding, textY - 1);
    
    // Total geral com destaque
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
    const lineY = 20;
    
    // Título da seção
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.styles.colors.dark);
    doc.text('ASSINATURAS', margin, y + 10);
    
    // Linha decorativa abaixo do título
    doc.setDrawColor(...this.styles.colors.dark);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 12, margin + 40, y + 12);
    
    // Calcular posições X para centralizar
    let startX;
    if (includeExtra) {
      // Três assinaturas
      startX = (pageWidth - (3 * signWidth + 2 * signMargin)) / 2;
    } else {
      // Duas assinaturas
      startX = (pageWidth - (2 * signWidth + signMargin)) / 2;
    }
    
    // Desenhar linhas de assinatura
    y += 30;
    doc.setLineWidth(0.5);
    
    // Primeira assinatura
    doc.line(startX, y, startX + signWidth, y);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.setFontSize(10);
    doc.text('RAFAEL SPERB', startX + signWidth/2, y + 5, { align: 'center' });
    
    // Segunda assinatura
    let secondX = startX + signWidth + signMargin;
    doc.line(secondX, y, secondX + signWidth, y);
    doc.text('WELLINGTON MARTINS', secondX + signWidth/2, y + 5, { align: 'center' });
    
    // Terceira assinatura (condicional)
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

      // Adicionar os anexos
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
  
  //
