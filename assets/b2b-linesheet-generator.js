/**
 * Linesheet Generator for Shopify B2B
 * 
 * This script handles the UI and data collection for the linesheet generator section.
 * It fetches catalog data from the server and prepares it for excel generation.
 */

class LinesheetGenerator {
  constructor() {
    // DOM elements
    this.catalogListElement = document.getElementById('catalogList');
    this.selectAllBtn = document.getElementById('selectAll');
    this.deselectAllBtn = document.getElementById('deselectAll');
    this.downloadCombinedBtn = document.getElementById('downloadCombined');
    this.downloadSeparateBtn = document.getElementById('downloadSeparate');
    this.statusMessageElement = document.getElementById('statusMessage');
    
    // Data storage
    this.companyData = null;
    this.catalogsData = null;
    
    // Server API URL - Change in production
    this.serverUrl = 'https://b2b-linesheet-generator-service.vercel.app';
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the app
   */
  init() {
    // Store original button text
    if (this.downloadCombinedBtn) {
      this.downloadCombinedBtn.setAttribute('data-original-text', this.downloadCombinedBtn.textContent.trim());
    }
    
    if (this.downloadSeparateBtn) {
      this.downloadSeparateBtn.setAttribute('data-original-text', this.downloadSeparateBtn.textContent.trim());
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load data
    this.loadData();
  }
  
  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Select/Deselect All functionality
    this.selectAllBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.catalog-checkbox');
      checkboxes.forEach(checkbox => checkbox.checked = true);
      this.updateDownloadButtonState();
    });
    
    this.deselectAllBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.catalog-checkbox');
      checkboxes.forEach(checkbox => checkbox.checked = false);
      this.updateDownloadButtonState();
    });
    
    // Download buttons
    this.downloadCombinedBtn.addEventListener('click', () => {
      this.handleDownloadCombined();
    });
    
    this.downloadSeparateBtn.addEventListener('click', () => {
      this.handleDownloadSeparate();
    });
  }
  
  /**
   * Load company and catalog data
   */
  async loadData() {
    this.showLoadingState('Loading your catalog data...');
    
    try {
      // Update the catalog list element to show a proper loading indicator
      this.catalogListElement.innerHTML = `
        <div class="catalog-list--loading">
          <div class="loading-spinner" aria-hidden="true"></div>
          <span>Loading your catalog data...</span>
        </div>
      `;
      
      // Fetch company and catalog data
      const data = await this.fetchData();
      this.companyData = data.company;
      this.catalogsData = data.catalogs;
      
      // Render catalog list
      this.renderCatalogList();
      
      this.hideLoadingState();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showStatusMessage('Error loading catalog data. Please try again.', 'error');
      this.hideLoadingState();
    }
  }
  
  /**
   * Render the catalog list
   */
  renderCatalogList() {
    if (!this.catalogsData || this.catalogsData.length === 0) {
      this.catalogListElement.innerHTML = '<p>No catalogs are currently assigned to your company.</p>';
      return;
    }
    
    let html = '';
    
    this.catalogsData.forEach(catalog => {
      html += `
        <div class="catalog-item">
          <label>
            <input type="checkbox" class="catalog-checkbox" data-catalog-id="${catalog.id}" checked>
            <div class="catalog-details">
              <div class="catalog-title">${catalog.name}</div>
              <div class="catalog-meta">
                 ${catalog.seasonYear || ''} • ${catalog.products ? catalog.products.length : 0} products
              </div>
            </div>
          </label>
        </div>
      `;
    });
    
    this.catalogListElement.innerHTML = html;
    
    // Add change event listeners to checkboxes
    document.querySelectorAll('.catalog-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateDownloadButtonState());
    });
    
    // Update button states
    this.updateDownloadButtonState();
  }
  
  /**
   * Update download button states based on selections
   */
  updateDownloadButtonState() {
    const selectedCount = this.getSelectedCatalogIds().length;
    this.downloadCombinedBtn.disabled = selectedCount === 0;
    this.downloadSeparateBtn.disabled = selectedCount === 0;
  }
  
  /**
   * Get selected catalog IDs
   */
  getSelectedCatalogIds() {
    return Array.from(document.querySelectorAll('.catalog-checkbox:checked'))
      .map(checkbox => checkbox.dataset.catalogId);
  }
  
  /**
   * Handle combined download button click
   */
  async handleDownloadCombined() {
    const selectedCatalogIds = this.getSelectedCatalogIds();
    
    if (selectedCatalogIds.length === 0) {
      this.showStatusMessage('Please select at least one catalog', 'error');
      return;
    }
    
    this.showLoadingState('Generating your linesheet...');
    
    try {
      // Get the selected catalogs data
      const selectedCatalogs = this.catalogsData.filter(catalog => 
        selectedCatalogIds.includes(catalog.id));
      
      // Prepare data for server request
      const requestData = {
        company: this.companyData,
        catalogIds: selectedCatalogIds,
        catalogs: selectedCatalogs,
        outputType: 'combined'
      };
      
      // For demonstration, log the data
      console.log('Data prepared for server request:', requestData);
      
      // Call the server
      await this.generateLinesheetOnServer(
        requestData, 
        `${this.companyData.name.replace(/\s+/g, '_')}_Linesheet.xlsx`
      );
      
    } catch (error) {
      console.error('Error generating linesheet:', error);
      this.showStatusMessage('Error generating linesheet. Please try again.', 'error');
      this.hideLoadingState();
    }
  }
  
  /**
   * Handle separate download button click
   */
  async handleDownloadSeparate() {
    const selectedCatalogIds = this.getSelectedCatalogIds();
    
    if (selectedCatalogIds.length === 0) {
      this.showStatusMessage('Please select at least one catalog', 'error');
      return;
    }
    
    this.showLoadingState('Generating your linesheets...');
    
    try {
      // Get the selected catalogs data
      const selectedCatalogs = this.catalogsData.filter(catalog => 
        selectedCatalogIds.includes(catalog.id));
      
      // Prepare data for server request
      const requestData = {
        company: this.companyData,
        catalogIds: selectedCatalogIds,
        catalogs: selectedCatalogs,
        outputType: 'separate'
      };
      
      // For demonstration, log the data
      console.log('Data prepared for server request:', requestData);
      
      // In production, uncomment this to call the server
      await this.generateLinesheetOnServer(
        requestData,
        `${this.companyData.name.replace(/\s+/g, '_')}_Linesheets.xlsx`
      );
      
    } catch (error) {
      console.error('Error generating linesheets:', error);
      this.showStatusMessage('Error generating linesheets. Please try again.', 'error');
      this.hideLoadingState();
    }
  }
  
  /**
   * Generate linesheet on server - Updated to ensure correct file extensions
   */
  async generateLinesheetOnServer(data, filename) {
    // Show loading indicator
    this.showLoadingState(data.outputType === 'separate' && data.catalogs.length > 1 ? 
      'Generating your separate linesheets...' : 
      'Generating your linesheet...');

    try {
      // Call the server to generate Excel
      const response = await fetch(`${this.serverUrl}/api/generate-linesheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Server error generating linesheet: ${response.status} ${response.statusText}`);
      }
      
      // Check content type to determine if it's a ZIP file or Excel file
      const contentType = response.headers.get('Content-Type');
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      
      // Extract actual filename from Content-Disposition if available
      let actualFilename = filename;
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch && filenameMatch[1]) {
        actualFilename = filenameMatch[1];
      }
      
      // Force .zip extension for multiple files (separate output type with multiple catalogs)
      if (contentType === 'application/zip' || 
          (data.outputType === 'separate' && data.catalogs.length > 1)) {
        // Ensure filename ends with .zip
        if (!actualFilename.toLowerCase().endsWith('.zip')) {
          actualFilename = actualFilename.replace(/\.[^/.]+$/, "") + '.zip';
        }
      }
      
      console.log(`Downloading file as: ${actualFilename} with content type: ${contentType}`);
      
      // Handle file download
      const blob = await response.blob();
      
      // Create a new blob with the correct type if needed
      const downloadBlob = contentType === 'application/zip' ? 
        new Blob([blob], { type: 'application/zip' }) : blob;
      
      const url = window.URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = actualFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      // Show appropriate success message
      if (contentType === 'application/zip' || (data.outputType === 'separate' && data.catalogs.length > 1)) {
        this.showStatusMessage('Your linesheets have been generated and downloaded as a ZIP file!', 'success');
      } else {
        this.showStatusMessage('Your linesheet has been generated!', 'success');
      }
    } catch (error) {
      console.error('Error generating linesheet:', error);
      this.showStatusMessage(`Error generating linesheet: ${error.message}`, 'error');
    } finally {
      this.hideLoadingState();
    }
  }
  
  /**
   * Show loading state
   */
  showLoadingState(message = 'Loading...') {
    // Store original button content if not already stored
    if (!this.downloadCombinedBtn.hasAttribute('data-original-text')) {
      this.downloadCombinedBtn.setAttribute('data-original-text', this.downloadCombinedBtn.textContent.trim());
      this.downloadSeparateBtn.setAttribute('data-original-text', this.downloadSeparateBtn.textContent.trim());
    }
    
    this.downloadCombinedBtn.innerHTML = `<span class="loading-spinner"></span> Generating...`;
    this.downloadCombinedBtn.disabled = true;
    this.downloadSeparateBtn.innerHTML = `<span class="loading-spinner"></span> Generating...`;
    this.downloadSeparateBtn.disabled = true;
    
    this.showStatusMessage(message, 'loading');
  }
  
  /**
   * Hide loading state
   */
  hideLoadingState() {
    // Store original button text when initializing
    if (!this.downloadCombinedBtn.hasAttribute('data-original-text')) {
      this.downloadCombinedBtn.setAttribute('data-original-text', this.downloadCombinedBtn.textContent.trim());
      this.downloadSeparateBtn.setAttribute('data-original-text', this.downloadSeparateBtn.textContent.trim());
    }
    
    // Reset download button text and icon
    this.downloadCombinedBtn.innerHTML = `<span class="icon">${this.getDownloadIconSVG()}</span> ${this.downloadCombinedBtn.getAttribute('data-original-text')}`;
    this.downloadCombinedBtn.disabled = false;
    
    this.downloadSeparateBtn.innerHTML = `<span class="icon">${this.getDownloadIconSVG()}</span> ${this.downloadSeparateBtn.getAttribute('data-original-text')}`;
    this.downloadSeparateBtn.disabled = false;
  }
  
  /**
   * Get download icon SVG
   * This ensures we always have the icon even if the snippet fails to load
   */
  getDownloadIconSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-download" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21H19.44a2 2 0 0 0 1.94-1.515L22 17"></path>
    </svg>`;
  }
  
  /**
   * Display status messages
   */
  showStatusMessage(message, type) {
    this.statusMessageElement.textContent = message;
    this.statusMessageElement.className = 'status-message ' + type;
    this.statusMessageElement.style.display = 'block';
    
    // Auto-hide success and loading messages after 5 seconds
    if (type === 'success' || type === 'loading') {
      setTimeout(() => {
        this.statusMessageElement.style.display = 'none';
      }, 5000);
    }
  }
  
  /**
   * Fetch data from server
   * This implementation works with the location ID that's already included in shopifyCustomerData
   */
  async fetchData() {
    console.log('Fetching data from server...');
    
    try {
      // Get the customer data and location ID from the Liquid-injected object
      const customerData = window.shopifyCustomerData || {};
      
      // Get location ID - this is crucial for B2B functionality
      const locationId = customerData.locationId;
      
      if (!locationId) {
        console.error('No location ID found in Shopify customer data');
        throw new Error('No location ID available. Please ensure you have selected a company location.');
      }
      
      console.log('Using location ID:', locationId);
      
      // Fetch B2B data from the server using the location ID
      const response = await fetch(`${this.serverUrl}/api/location/${locationId}/b2b-data`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Parse the response data
      const data = await response.json();
      
      // Prepare company data from both sources
      const company = {
        // Use data from the API response for company info
        id: data.company.id || customerData.companyId,
        name: data.company.name || customerData.companyName,
        externalId: data.company.externalId,
        
        // For contact info, try API first, then Liquid data
        email: (data.company.contact && data.company.contact.email) || customerData.email,
        phone: (data.company.contact && data.company.contact.phone) || customerData.phone,
        
        // For address, use location address if available
        address: data.location && data.location.address ? data.location.address : {
          address1: customerData.address1 || '',
          address2: customerData.address2 || '',
          city: customerData.city || '',
          zip: customerData.zip || '',
          country: customerData.country || ''
        }
      };
      
      return { 
        company, 
        catalogs: data.catalogs || []
      };
    } catch (error) {
      console.error('Error fetching data from server:', error);
      throw new Error('Failed to load data from server: ' + error.message);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.linesheet-generator')) {
    new LinesheetGenerator();
  }
});