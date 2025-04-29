// ui.js - Interface de usuário
const UI = {
  showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
  },

  hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  updateSummary() {
    // Garante valores numéricos válidos
    this.sanitizeNumericInputs();
    
    // Sell Out
    const sellOutItems = document.querySelectorAll('#items-container-sell-out .item-row');
    let sellOutTotal = 0;
    sellOutItems.forEach(item => {
      const verba = parseFloat(item.querySelector('.item-verba').value) || 0;
      sellOutTotal += verba;
    });
    
    // Sell In
    const sellInItems = document.querySelectorAll('#items-container-sell-in .item-row');
    let sellInTotal = 0;
    sellInItems.forEach(item => {
      const verba = parseFloat(item.querySelector('.item-verba').value) || 0;
      sellInTotal += verba;
    });
    
    // Merchandising
    const merchItems = document.querySelectorAll('#merch-items-container .merch-item-row');
    let merchTotal = 0;
    merchItems.forEach(item => {
      const verba = parseFloat(item.querySelector('.merch-item-verba').value) || 0;
      merchTotal += verba;
    });

    // Atualiza UI
    document.getElementById('sell-out-count').textContent = sellOutItems.length;
    document.getElementById('sell-out-total').textContent = sellOutTotal.toFixed(2);
    document.getElementById('sell-in-count').textContent = sellInItems.length;
    document.getElementById('sell-in-total').textContent = sellInTotal.toFixed(2);
    document.getElementById('merch-count').textContent = merchItems.length;
    document.getElementById('merch-total').textContent = merchTotal.toFixed(2);
  },

  sanitizeNumericInputs() {
    document.querySelectorAll('.item-verba, .merch-item-verba').forEach(input => {
      if (input.value === '' || isNaN(input.value)) {
        input.value = '0.00';
      }
    });
  },

  showFilePreview(input, previewContainer) {
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainer.appendChild(img);
          };
          reader.readAsDataURL(file);
        } else {
          const div = document.createElement('div');
          div.textContent = file.name;
          div.className = 'file-preview-text';
          previewContainer.appendChild(div);
        }
      });
    }
  },

  confirmRemove(callback) {
    if (confirm('Tem certeza que deseja remover este item?')) {
      callback();
      this.updateSummary();
    }
  }
};