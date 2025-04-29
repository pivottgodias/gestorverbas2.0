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
      this.addHeader(doc, 'Dossiê de Verba', y);
      y += 16;

      // Adicionar caixa de informações
      y = this.addInfoBox(doc, {
        rede: formData.rede,
        mercado: formData.mercado,
        cidade_uf: `${formData.cidade} - ${formData.uf}`,
        vendedor: formData.vendedor,
        contrato: formData.contrato,
        data: new Date().toLocaleDateString('pt-BR')
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
      const nomeArquivo = `<span class="math-inline">\{formData\.rede \|\| 'sem\-rede'\}\-</span>{formData.vendedor || 'sem-vendedor'}-<span class="math-inline">\{formData\.contrato \|\| 'sem\-contrato'\}\-</span>{formData.uf || 'sem-estado'}-${dataHoje}.pdf`;

      // Substitui caracteres problemáticos para nomes de arquivo
      const nomeArquivoSeguro = nomeArquivo.replace(/[\\/:*?"<>|]/g, '_');

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
    doc.text('Rede:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.rede, margin + 40, textY);
    textY += lineHeight;

    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Mercado:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.mercado, margin + 40, textY);
    textY += lineHeight;

    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Cidade/UF:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.cidade_uf, margin + 40, textY);
    textY += lineHeight;

    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Vendedor:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.vendedor, margin + 40, textY);
    textY += lineHeight;

    if (info.contrato) {
      doc.setFont(this.styles.fonts.body, 'bold');
      doc.text('Contrato:', margin + padding, text
        y + 40, textY);
      textY += lineHeight;
    }

    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Data:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.data, margin + 40, textY);

    return y + boxHeight + 10;
  },

  // Adiciona caixa de totais
  addTotalsBox(doc, totals, y) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const boxWidth = pageWidth - (margin * 2);
    const boxHeight = 40;

    // Desenhar caixa de fundo
    doc.setFillColor(...this.styles.colors.light);
    doc.setDrawColor(...this.styles.colors.primary);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');

    // Estilos para o texto
    doc.setFontSize(12);
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.setTextColor(this.styles.colors.dark);

    // Adicionar títulos
    doc.text('TOTAL SELL OUT:', margin + 10, y + 15);
    doc.text('TOTAL SELL IN:', margin + 10, y + 25);
    doc.text('TOTAL MERCHANDISING:', margin + 10, y + 35);

    // Alinhar valores à direita
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(`R$ ${totals.sellOut.toFixed(2)}`, pageWidth - margin - 10, y + 15, { align: 'right' });
    doc.text(`R$ ${totals.sellIn.toFixed(2)}`, pageWidth - margin - 10, y + 25, { align: 'right' });
    doc.text(`R$ ${totals.merch.toFixed(2)}`, pageWidth - margin - 10, y + 35, { align: 'right' });

    // Adicionar linha divisória e total geral
    doc.setDrawColor(...this.styles.colors.primary);
    doc.setLineWidth(0.3);
    doc.line(margin, y + boxHeight, pageWidth - margin, y + boxHeight);

    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text(`TOTAL GERAL: R$ ${totals.total.toFixed(2)}`, margin + 10, y + boxHeight + 10);

    return y + boxHeight + 20;
  },

  // Adiciona seção de assinaturas com layout melhorado
  addSignatureSection(doc, y, precisaGerente = false) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const signatureWidth = (pageWidth - (margin * 2)) / (precisaGerente ? 3 : 2);
    const signatureHeight = 50;

    doc.setFontSize(10);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.setTextColor(0);

    // Desenhar linhas de assinatura
    const lineY = y + signatureHeight - 10;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);

    let currentX = margin;
    doc.line(currentX, lineY, currentX + signatureWidth, lineY);
    doc.text('Vendedor', currentX, lineY + 5, { align: 'center', baseline: 'top' });

    currentX += signatureWidth;
    doc.line(currentX, lineY, currentX + signatureWidth, lineY);
    doc.text('Cliente', currentX, lineY + 5, { align: 'center', baseline: 'top' });

    if (precisaGerente) {
      currentX += signatureWidth;
      doc.line(currentX, lineY, currentX + signatureWidth, lineY);
      doc.text('Gerente', currentX, lineY + 5, { align: 'center', baseline: 'top' });
    }
  },

  // Adiciona anexos com página de separação e formatação
  async addAttachmentsWithSeparator(pdfDoc, files) {
    if (!files || files.length === 0) return;

    const { rgb } = PDFLib;

    // Adicionar nova página para a seção de anexos
    const separadorPage = pdfDoc.addPage();
    const pageWidth = separadorPage.getWidth();
    const pageHeight = separadorPage.getHeight();

    // Cor de fundo
    separadorPage.setFillColor(rgb(0.95, 0.95, 0.95)); // Cinza bem claro
    separadorPage.rect(0, 0, pageWidth, pageHeight, 'F');

    // Título centralizado e estilizado
    separadorPage.setFont(await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold));
    separadorPage.setFontSize(28);
    separadorPage.setTextColor(rgb(0.1, 0.1, 0.1)); // Cinza escuro
    separadorPage.drawText('Anexos', {
      x: pageWidth / 2,
      y: pageHeight / 2 + 10,
      align: 'center',
      valign: 'middle',
    });

    // Subtítulo
    separadorPage.setFont(await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica));
    separadorPage.setFontSize(14);
    separadorPage.drawText('Documentos adicionais', {
      x: pageWidth / 2,
      y: pageHeight / 2 - 20,
      align: 'center',
      valign: 'middle',
    });

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        await pdfDoc.attach(file.name, arrayBuffer);
      } catch (error) {
        console.error('Erro ao adicionar anexo:', error);
      }
    }
  },

  // Adiciona páginas com fotos de merchandising ampliadas e layout melhorado
  async addEnhancedMerchandisingPhotos(pdfDoc, merchPhotosData) {
    if (!merchPhotosData || merchPhotosData.length === 0) return;

    const { rgb } = PDFLib;

    for (let i = 0; i < merchPhotosData.length; i++) {
      const imgObj = merchPhotosData[i];
      if (!imgObj) continue;

      try {
        const image = await pdfDoc.embedFile(imgObj.dataUrl, { mimeType: imgObj.type });
        const newPage = pdfDoc.addPage();
        const { width, height } = newPage.getSize();

        // Calcular dimensões da imagem para caber na página
        const imgWidth = Math.min(width - 40, image.width);
        const imgHeight = (image.height * imgWidth) / image.width;

        // Centralizar a imagem
        const x = (width - imgWidth) / 2;
        const y = (height - imgHeight) / 2;

        // Adicionar a imagem
        newPage.drawImage(image, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
        });

        // Adicionar legenda
        newPage.setFont(await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica));
        newPage.setFontSize(12);
        newPage.setTextColor(rgb(0.3, 0.3, 0.3));
        newPage.drawText(`Foto Merchandising ${i + 1}`, {
          x: width / 2,
          y: y - 15,
          align: 'center',
        });

      } catch (error) {
        console.error('Erro ao adicionar foto ampliada:', error);
      }
    }
  },

  // Converte arquivo para DataURL
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
      .map(r => {
        const verba = parseFloat(r.querySelector(`[name^="item_verba${prefix}"]`).value) || 0;
        return {
          familia: r.querySelector(`[name^="item_familia${prefix}"]`).value || '',
          produto: r.querySelector(`[name^="item_produto${prefix}"]`).value || '',
          unidades: r.querySelector(`[name^="item_unidades${prefix}"]`).value || '',
          bonificacao: r.querySelector(`[name^="item_bonificacao${prefix}"]`).value || '',
          verba: verba.toFixed(2), // Garante formatação com 2 casas decimais
          ttc: r.querySelector(`[name^="item_ttc${prefix}"]`).value || '',
          ttv: r.querySelector(`[name^="item_ttv${prefix}"]`).value || ''
        };
      })
      .filter(item => parseFloat(item.verba) > 0) // Filtra itens com verba maior que zero
      .map(item => Object.values(item)); // Converte de volta para array para autoTable
  },

  collectMerchRows() {
    return Array.from(document.querySelectorAll('.merch-item-row'))
      .map(r => {
        const verba = parseFloat(r.querySelector('[name="merch_item_verba[]"]').value) || 0;
        return {
          verba: verba.toFixed(2), // Garante formatação com 2 casas decimais
          opcao: r.querySelector('[name="merch_item_opcao[]"]').value,
          custom: r.querySelector('[name="merch_item_custom[]"]').value || ''
        };
      })
      .filter(item => parseFloat(item.verba) > 0) // Filtra itens com verba maior que zero
      .map(item => Object.values(item)); // Converte de volta para array para autoTable
  },
};
