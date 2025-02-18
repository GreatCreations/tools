// Load and save data from localStorage
let sortableGrid;
let currentGridSize = 6;
let groups = [];

function loadSites() {
  try {
    const sites = localStorage.getItem('sites');
    const order = localStorage.getItem('sitesOrder');
    const savedGroups = localStorage.getItem('groups');
    
    let sitesList = sites ? JSON.parse(sites) : [
      { url: 'https://google.com', title: 'Google' },
      { url: 'https://github.com', title: 'GitHub' },
      { url: 'https://reddit.com', title: 'Reddit' },
      { url: 'https://youtube.com', title: 'YouTube' },
      { url: 'https://twitter.com', title: 'X' },
      { url: 'https://wikipedia.org', title: 'Wikipedia' }
    ];

    groups = savedGroups ? JSON.parse(savedGroups) : [
      { id: 'default', name: 'Main Sites', sites: sitesList.map(site => site.url) }
    ];

    // If we have a saved order, use it to sort the sites
    if (order) {
      const orderArray = JSON.parse(order);
      const sitesMap = new Map(sitesList.map(site => [site.url, site]));
      sitesList = orderArray
        .map(url => sitesMap.get(url))
        .filter(site => site)
        .concat(sitesList.filter(site => !orderArray.includes(site.url)));
    }

    return sitesList;
  } catch (error) {
    console.error('Error loading sites:', error);
    return [
      { url: 'https://google.com', title: 'Google' },
      { url: 'https://github.com', title: 'GitHub' },
      { url: 'https://reddit.com', title: 'Reddit' },
      { url: 'https://youtube.com', title: 'YouTube' },
      { url: 'https://twitter.com', title: 'X' },
      { url: 'https://wikipedia.org', title: 'Wikipedia' }
    ];
  }
}

function saveSites(sites) {
  try {
    localStorage.setItem('sites', JSON.stringify(sites));
  } catch (error) {
    console.error('Error saving sites:', error);
  }
}

function saveOrder() {
  try {
    const cards = document.querySelectorAll('.card');
    const order = Array.from(cards).map(card => card.dataset.url);
    localStorage.setItem('sitesOrder', JSON.stringify(order));
  } catch (error) {
    console.error('Error saving order:', error);
  }
}

function saveGroups() {
  try {
    localStorage.setItem('groups', JSON.stringify(groups));
  } catch (error) {
    console.error('Error saving groups:', error);
  }
}

let sites = loadSites();

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==';
  }
}

async function fetchSiteMetadata(url) {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Safely access nested properties
    return {
      title: data?.data?.title || new URL(url).hostname,
      description: data?.data?.description || '',
      image: data?.data?.image?.url || getFaviconUrl(url)
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    // Return fallback data
    try {
      return {
        title: new URL(url).hostname,
        description: '',
        image: getFaviconUrl(url)
      };
    } catch (e) {
      return {
        title: url,
        description: '',
        image: getFaviconUrl('https://example.com') // Fallback icon
      };
    }
  }
}

function createCard(data) {
  if (!data) {
    console.error('No data provided for card creation');
    return null;
  }

  try {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.url = data.url;
    card.dataset.groupId = data.groupId;
    
    const domain = data.url ? new URL(data.url).hostname : 'Unknown';
    
    // Create the card structure with separate elements
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';
    actionsDiv.innerHTML = `
      <button class="action-button edit" aria-label="Edit site">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
        </svg>
      </button>
      <button class="action-button delete" aria-label="Delete site">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
        </svg>
      </button>
    `;

    const img = document.createElement('img');
    img.src = data.image || getFaviconUrl(data.url);
    img.className = 'card-icon';
    img.alt = 'Site icon';
    img.onerror = function() {
      this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==';
    };

    const titleLink = document.createElement('a');
    titleLink.href = data.url;
    titleLink.className = 'card-title';
    titleLink.textContent = data.title || 'Untitled';
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';

    const urlLink = document.createElement('a');
    urlLink.href = data.url;
    urlLink.className = 'card-url';
    urlLink.textContent = domain;
    urlLink.target = '_blank';
    urlLink.rel = 'noopener noreferrer';

    // Add elements to card in correct order
    card.appendChild(actionsDiv);
    card.appendChild(img);
    card.appendChild(titleLink);
    card.appendChild(urlLink);

    // Add event listeners
    const editBtn = actionsDiv.querySelector('.edit');
    const deleteBtn = actionsDiv.querySelector('.delete');

    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(data);
    });

    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this site?')) {
        sites = sites.filter(site => site.url !== data.url);
        saveSites(sites);
        refreshGrid();
      }
    });

    // Make card draggable
    card.draggable = true;

    return card;
  } catch (error) {
    console.error('Error creating card:', error);
    return null;
  }
}

function createGroupSeparator(group) {
  const separator = document.createElement('div');
  separator.className = 'group-separator';
  separator.dataset.groupId = group.id;
  
  separator.innerHTML = `
    <input type="text" class="group-title" value="${group.name}" />
    <div class="group-actions">
      <button class="group-add-button add-site" title="Add site to group">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
        </svg>
      </button>
      <button class="group-add-button delete-group" title="Delete group">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  `;

  // Add event listeners
  const titleInput = separator.querySelector('.group-title');
  titleInput.addEventListener('change', (e) => {
    group.name = e.target.value;
    saveGroups();
  });

  const addButton = separator.querySelector('.add-site');
  addButton.addEventListener('click', () => {
    openModal(null, group.id);
  });

  const deleteButton = separator.querySelector('.delete-group');
  deleteButton.addEventListener('click', () => {
    if (confirm('Delete this group and all its sites?')) {
      sites = sites.filter(site => !group.sites.includes(site.url));
      groups = groups.filter(g => g.id !== group.id);
      saveSites(sites);
      saveGroups();
      refreshGrid();
    }
  });

  return separator;
}

async function refreshGrid() {
  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  grid.innerHTML = '';
  updateGridSize(currentGridSize);
  
  try {
    // First, show sites that are in groups
    for (const group of groups) {
      grid.appendChild(createGroupSeparator(group));
      
      for (const siteUrl of group.sites) {
        const site = sites.find(s => s.url === siteUrl);
        if (!site) continue;
        
        try {
          const metadata = await fetchSiteMetadata(site.url);
          const card = createCard({
            url: site.url,
            title: metadata?.title || site.title,
            image: metadata?.image,
            groupId: group.id
          });
          
          if (card) {
            grid.appendChild(card);
          }
        } catch (error) {
          console.error(`Error processing item ${site.url}:`, error);
          // Show card even if metadata fetch fails
          const card = createCard({
            url: site.url,
            title: site.title,
            image: getFaviconUrl(site.url),
            groupId: group.id
          });
          if (card) {
            grid.appendChild(card);
          }
        }
      }
    }

    // Then, show sites that aren't in any group
    const sitesInGroups = new Set(groups.flatMap(g => g.sites));
    const ungroupedSites = sites.filter(site => !sitesInGroups.has(site.url));
    
    if (ungroupedSites.length > 0) {
      // Create an "Ungrouped" section
      const ungroupedGroup = {
        id: 'ungrouped',
        name: 'Ungrouped Sites',
        sites: ungroupedSites.map(s => s.url)
      };
      grid.appendChild(createGroupSeparator(ungroupedGroup));

      // Show all ungrouped sites
      for (const site of ungroupedSites) {
        try {
          const metadata = await fetchSiteMetadata(site.url);
          const card = createCard({
            url: site.url,
            title: metadata?.title || site.title,
            image: metadata?.image,
            groupId: 'ungrouped'
          });
          
          if (card) {
            grid.appendChild(card);
          }
        } catch (error) {
          console.error(`Error processing item ${site.url}:`, error);
          // Show card even if metadata fetch fails
          const card = createCard({
            url: site.url,
            title: site.title,
            image: getFaviconUrl(site.url),
            groupId: 'ungrouped'
          });
          if (card) {
            grid.appendChild(card);
          }
        }
      }
    }

    // Initialize Sortable
    if (sortableGrid) {
      sortableGrid.destroy();
    }
    
    sortableGrid = new Sortable(grid, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.card, .group-separator',
      onEnd: function(evt) {
        updateGroupsOrder();
      }
    });
  } catch (error) {
    console.error('Error refreshing grid:', error);
  }
}

function updateGroupsOrder() {
  const grid = document.getElementById('cardGrid');
  const elements = Array.from(grid.children);
  
  let currentGroup = null;
  const newGroups = [];
  
  elements.forEach(element => {
    if (element.classList.contains('group-separator')) {
      const groupId = element.dataset.groupId;
      currentGroup = {
        id: groupId,
        name: element.querySelector('.group-title').value,
        sites: []
      };
      newGroups.push(currentGroup);
    } else if (element.classList.contains('card') && currentGroup) {
      currentGroup.sites.push(element.dataset.url);
    }
  });
  
  groups = newGroups;
  saveGroups();
  saveOrder();
}

function updateGridSize(size) {
  const grid = document.getElementById('cardGrid');
  // Remove any existing grid-* classes
  grid.className = grid.className.replace(/\bgrid-\d+\b/g, '');
  // Add new grid class
  grid.classList.add(`grid-${size}`);
  // Save preference
  localStorage.setItem('gridSize', size);
  currentGridSize = size;
}

// Modal handling
const modal = document.getElementById('siteModal');
const form = document.getElementById('siteForm');
const addButton = document.getElementById('addSiteBtn');
const cancelButton = document.getElementById('cancelBtn');
let editingUrl = null;

function openModal(data = null, groupId = null) {
  const urlInput = document.getElementById('siteUrl');
  const titleInput = document.getElementById('siteTitle');
  const modalTitle = document.querySelector('#modalTitle');
  
  if (data) {
    modalTitle.textContent = 'Edit Site';
    urlInput.value = data.url;
    titleInput.value = data.title;
    editingUrl = data.url;
  } else {
    modalTitle.textContent = 'Add Site';
    urlInput.value = '';
    titleInput.value = '';
    editingUrl = null;
  }

  form.dataset.groupId = groupId;
  modal.classList.add('active');
  urlInput.focus();
}

function closeModal() {
  modal.classList.remove('active');
  form.reset();
  editingUrl = null;
}

addButton.addEventListener('click', () => openModal());
cancelButton.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const url = document.getElementById('siteUrl').value;
  const title = document.getElementById('siteTitle').value;
  const groupId = form.dataset.groupId;

  if (editingUrl) {
    // Update existing site
    sites = sites.map(site => 
      site.url === editingUrl ? { url, title } : site
    );
  } else {
    // Add new site
    sites.push({ url, title });
    
    // Add to group
    const group = groups.find(g => g.id === groupId) || groups[0];
    group.sites.push(url);
  }

  saveSites(sites);
  saveGroups();
  closeModal();
  refreshGrid();
});

function initSearch() {
  const searchInput = document.querySelector('.search-input');
  const clearButton = document.getElementById('clearSearch');
  
  if (!searchInput || !clearButton) {
    console.error('Search elements not found');
    return;
  }

  searchInput.addEventListener('input', (e) => {
    try {
      const searchTerm = (e.target.value || '').toLowerCase();
      const cards = document.querySelectorAll('.card');
      const groups = document.querySelectorAll('.group-separator');
      
      // Track which groups have visible cards
      const groupVisibility = new Map();
      
      cards.forEach(card => {
        const text = (card.innerText || '').toLowerCase();
        const isVisible = text.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
        
        // Track group visibility
        const groupId = card.dataset.groupId;
        if (isVisible) {
          groupVisibility.set(groupId, true);
        }
      });
      
      // Show/hide groups based on whether they have visible cards
      groups.forEach(group => {
        const groupId = group.dataset.groupId;
        group.style.display = groupVisibility.get(groupId) ? 'flex' : 'none';
      });
      
      // Show/hide clear button based on search input
      clearButton.style.display = searchInput.value ? 'flex' : 'none';
    } catch (error) {
      console.error('Error during search:', error);
    }
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    clearButton.style.display = 'none';
  });
  
  // Initialize clear button visibility
  clearButton.style.display = 'none';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStorageInfo() {
  try {
    const sitesJson = localStorage.getItem('sites');
    const orderJson = localStorage.getItem('sitesOrder');
    const storageUsed = new Blob([sitesJson, orderJson]).size;
    const storageLimit = 5 * 1024 * 1024; // 5MB typical localStorage limit
    
    return {
      used: formatBytes(storageUsed),
      total: formatBytes(storageLimit),
      percentage: ((storageUsed / storageLimit) * 100).toFixed(1),
      currentData: `Sites: ${sitesJson}\nOrder: ${orderJson}`
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      used: '0 Bytes',
      total: '5 MB',
      percentage: 0,
      currentData: '[]'
    };
  }
}

function openSettingsModal() {
  const storageInfo = getStorageInfo();
  const settingsModal = document.getElementById('settingsModal');
  const storageDetails = document.getElementById('storageDetails');
  const storageSize = document.getElementById('storageSize');
  
  // Format the data for better readability
  const formattedData = JSON.stringify({
    sites: sites,
    groups: groups
  }, null, 2);
  
  storageDetails.value = formattedData;
  storageSize.innerHTML = `
    <span>Storage Used: ${storageInfo.used}</span>
    <span>Available: ${storageInfo.total}</span>
  `;
  
  settingsModal.classList.add('active');
}

// Theme handling
let currentTheme = localStorage.getItem('theme') || 'default';

function setTheme(theme) {
  // Remove previous theme
  document.body.classList.remove('default-theme', 'bright-theme', 'comic-theme', 'cyber-theme');
  // Add new theme
  document.body.classList.add(`${theme}-theme`);
  document.body.setAttribute('data-theme', theme);
  // Save preference
  localStorage.setItem('theme', theme);
  currentTheme = theme;
  
  // Update active state in theme cards
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === theme);
  });
}

// Initialize theme
setTheme(currentTheme);

window.addEventListener('DOMContentLoaded', () => {
  try {
    // Load saved grid size preference
    const savedGridSize = localStorage.getItem('gridSize');
    if (savedGridSize) {
      currentGridSize = parseInt(savedGridSize);
      document.getElementById('gridSize').value = currentGridSize;
    }
    updateGridSize(currentGridSize);
    
    // Add grid size change listener
    document.getElementById('gridSize').addEventListener('change', (e) => {
      updateGridSize(parseInt(e.target.value));
    });

    refreshGrid();
    initSearch();
    
    // Add settings button click handler
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const purgeDataBtn = document.getElementById('purgeDataBtn');
    const backupDataBtn = document.getElementById('backupDataBtn');
    const restoreDataBtn = document.getElementById('restoreDataBtn');
    const appendDataBtn = document.getElementById('appendDataBtn');
    const restoreFileInput = document.getElementById('restoreFileInput');
    const appendFileInput = document.getElementById('appendFileInput');
    
    settingsBtn.addEventListener('click', openSettingsModal);
    
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('active');
    });
    
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
      }
    });

    // Save data changes
    saveDataBtn.addEventListener('click', () => {
      try {
        const storageDetails = document.getElementById('storageDetails');
        const data = JSON.parse(storageDetails.value);
        
        if (data.sites && Array.isArray(data.sites) && 
            data.groups && Array.isArray(data.groups)) {
          sites = data.sites;
          groups = data.groups;
          saveSites(sites);
          saveGroups();
          refreshGrid();
          alert('Data saved successfully!');
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please check the format and try again.');
      }
    });

    // Backup data to file
    backupDataBtn.addEventListener('click', () => {
      const data = {
        sites: sites,
        groups: groups
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homepage-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Restore data from file
    restoreDataBtn.addEventListener('click', () => {
      restoreFileInput.click();
    });

    restoreFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.sites && Array.isArray(data.sites) && 
                data.groups && Array.isArray(data.groups)) {
              if (confirm('This will replace all current data. Are you sure?')) {
                sites = data.sites;
                groups = data.groups;
                saveSites(sites);
                saveGroups();
                refreshGrid();
                openSettingsModal();
                alert('Data restored successfully!');
              }
            } else {
              throw new Error('Invalid backup file format');
            }
          } catch (error) {
            console.error('Error restoring data:', error);
            alert('Error restoring data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
      e.target.value = ''; // Reset file input
    });

    // Append data from file
    appendDataBtn.addEventListener('click', () => {
      appendFileInput.click();
    });

    appendFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.sites && Array.isArray(data.sites) && 
                data.groups && Array.isArray(data.groups)) {
              
              // Add new sites to the sites array (avoid duplicates)
              const existingUrls = new Set(sites.map(s => s.url));
              const newSites = data.sites.filter(s => !existingUrls.has(s.url));
              sites = [...sites, ...newSites];

              // Handle groups
              data.groups.forEach(importedGroup => {
                // Find if group exists by name
                const existingGroup = groups.find(g => g.name === importedGroup.name);
                
                if (existingGroup) {
                  // Add new sites to existing group
                  const groupSites = new Set(existingGroup.sites);
                  importedGroup.sites.forEach(site => {
                    if (sites.some(s => s.url === site)) { // Only add if site exists
                      groupSites.add(site);
                    }
                  });
                  existingGroup.sites = Array.from(groupSites);
                } else {
                  // Create new group with valid sites
                  const validSites = importedGroup.sites.filter(site => 
                    sites.some(s => s.url === site)
                  );
                  groups.push({
                    id: `group_${Date.now()}`,
                    name: importedGroup.name,
                    sites: validSites
                  });
                }
              });

              saveSites(sites);
              saveGroups();
              refreshGrid();
              openSettingsModal();
              alert(`Appended ${newSites.length} sites and updated groups!`);
            } else {
              throw new Error('Invalid backup file format');
            }
          } catch (error) {
            console.error('Error appending data:', error);
            alert('Error appending data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
      e.target.value = ''; // Reset file input
    });

    // Purge all data
    purgeDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to purge all data? This cannot be undone!')) {
        localStorage.clear();
        sites = [];
        groups = [];
        refreshGrid();
        openSettingsModal();
        alert('All data has been purged.');
      }
    });
    
    // Add new group button
    const searchBar = document.querySelector('.search-bar');
    const newGroupBtn = document.createElement('button');
    newGroupBtn.className = 'add-button';
    newGroupBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>
      </svg>
    `;
    newGroupBtn.addEventListener('click', () => {
      const newGroup = {
        id: 'group_' + Date.now(),
        name: 'New Group',
        sites: []
      };
      groups.push(newGroup);
      saveGroups();
      refreshGrid();
    });
    searchBar.appendChild(newGroupBtn);

    // Theme handling
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        setTheme(card.dataset.theme);
      });
    });

    // Tab handling in settings
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
        
        // Update modal title
        const modalTitle = document.getElementById('settingsModalTitle');
        modalTitle.textContent = button.dataset.tab === 'storage' ? 'Storage Settings' : 'Theme Settings';
      });
    });
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});