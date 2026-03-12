// Global variables
let allPublications = [];
let allProjects = [];
let showingSelectedPublications = false;
let showingSelectedProjects = false;

// Get author name
function getAuthorName(author) {
  return author;
}


// Update toggle button texts
function updateToggleButtonTexts() {
  const togglePublicationsButton = document.getElementById('toggle-publications');
  const toggleProjectsButton = document.getElementById('toggle-projects');
  const toggleHeader = document.getElementById('toggle-header');
  const projectsToggleHeader = document.getElementById('projects-toggle-header');
  
  if (togglePublicationsButton) {
    togglePublicationsButton.textContent = showingSelectedPublications 
      ? 'Show All'
      : 'Show Selected';
  }
  
  if (toggleProjectsButton) {
    toggleProjectsButton.textContent = showingSelectedProjects 
      ? 'Show All'
      : 'Show Selected';
  }
  
  if (toggleHeader) {
    // Always display "All Publications"
    toggleHeader.textContent = 'All Publications';
  }
  
  if (projectsToggleHeader) {
    // Always display "All Projects and Competitions"
    projectsToggleHeader.textContent = 'All Projects and Competitions';
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Load publications and projects data
  loadPublications();
  loadProjects();
  
  // Load Google Scholar citations
  loadScholarCitations();
  
  // Initialize animation delays for sections
  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    section.style.animationDelay = `${index * 0.1}s`;
  });
  
  // Add event listener for toggle buttons
  const togglePublicationsButton = document.getElementById('toggle-publications');
  if (togglePublicationsButton) {
    togglePublicationsButton.addEventListener('click', togglePublications);
  }
  
  const toggleProjectsButton = document.getElementById('toggle-projects');
  if (toggleProjectsButton) {
    toggleProjectsButton.addEventListener('click', toggleProjects);
  }
  
  // Initialize toggle button texts
  updateToggleButtonTexts();
});

// Load Google Scholar citations
function loadScholarCitations() {
  const scholarId = 'iTO8ExcAAAAJ';
  const citationsElement = document.getElementById('scholar-citations');
  
  if (!citationsElement) return;
  
  // Try multiple methods to get citation count
  // Method 1: Use CORS proxy to fetch Google Scholar page
  const scholarUrl = `https://scholar.google.com/citations?hl=en&user=${scholarId}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(scholarUrl)}`;
  
  fetch(proxyUrl)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      try {
        const htmlContent = data.contents;
        // Parse HTML to find total citation count
        // Google Scholar shows total citations in format: "Cited by X" or in a table
        let citations = null;
        
        // Try to find citation count in various formats
        const patterns = [
          /<td[^>]*>Cited by<\/td>\s*<td[^>]*>(\d+)<\/td>/i,
          /Cited by\s+(\d+)/i,
          /Citations[^0-9]*(\d+)/i,
          /gsc_rsb_st">(\d+)</i,
          /"gsc_rsb_std">(\d+)</i
        ];
        
        for (const pattern of patterns) {
          const match = htmlContent.match(pattern);
          if (match && match[1]) {
            citations = parseInt(match[1]);
            break;
          }
        }
        
        if (citations !== null && citations > 0) {
          citationsElement.textContent = `Citations: ${citations.toLocaleString()}`;
          // Store in localStorage for caching
          localStorage.setItem('scholar_citations', JSON.stringify({
            count: citations,
            timestamp: Date.now()
          }));
        } else {
          // Try to load from cache
          const cached = localStorage.getItem('scholar_citations');
          if (cached) {
            const cachedData = JSON.parse(cached);
            // Use cache if less than 24 hours old
            if (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
              citationsElement.textContent = `Citations: ${cachedData.count.toLocaleString()} (cached)`;
              return;
            }
          }
          citationsElement.textContent = 'Citations: N/A';
        }
      } catch (error) {
        console.error('Error parsing Scholar data:', error);
        // Try to load from cache
        const cached = localStorage.getItem('scholar_citations');
        if (cached) {
          const cachedData = JSON.parse(cached);
          citationsElement.textContent = `Citations: ${cachedData.count.toLocaleString()} (cached)`;
        } else {
          citationsElement.textContent = 'Citations: Error';
        }
      }
    })
    .catch(error => {
      console.error('Error fetching Scholar citations:', error);
      // Try to load from cache
      const cached = localStorage.getItem('scholar_citations');
      if (cached) {
        const cachedData = JSON.parse(cached);
        citationsElement.textContent = `Citations: ${cachedData.count.toLocaleString()} (cached)`;
      } else {
        citationsElement.textContent = 'Citations: Unavailable';
      }
    });
}

// Load publications from JSON file
function loadPublications() {
  fetch('publications.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Publications loaded successfully:", data);
      allPublications = data.publications;
      // Always show all publications
      renderPublications(false);
    })
    .catch(error => {
      console.error('Error loading publications:', error);
      // Create fallback publications display if JSON loading fails
      displayFallbackPublications();
    });
}

// Fallback if JSON loading fails
function displayFallbackPublications() {
  const container = document.getElementById('publications-container');
  container.innerHTML = `Error loading publications.`;
}

// Toggle between showing all or selected publications
function togglePublications() {
  showingSelectedPublications = !showingSelectedPublications;
  renderPublications(showingSelectedPublications);
  updateToggleButtonTexts();
}

// Render publications based on selection state
function renderPublications(selectedOnly) {
  const publicationsContainer = document.getElementById('publications-container');
  publicationsContainer.innerHTML = '';

  const pubsToShow = selectedOnly ?
    allPublications.filter(pub => pub.selected === 1) :
    allPublications;

  // Group by year
  const byYear = {};
  pubsToShow.forEach(pub => {
    let year = null;
    const venue = pub.venue;

    // Extract year from venue
    const yearMatch = venue.match(/(\d{4})/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
    }

    if (!year) {
      year = 'Other';
    }

    if (!byYear[year]) {
      byYear[year] = [];
    }
    byYear[year].push(pub);
  });

  // Sort years in descending order
  const sortedYears = Object.keys(byYear).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return b - a;
  });

  // Render each year group
  sortedYears.forEach(year => {
    // Create year heading
    const yearHeading = document.createElement('h4');
    yearHeading.style.marginTop = '1.5rem';
    yearHeading.style.marginBottom = '0.5rem';
    yearHeading.textContent = year;
    publicationsContainer.appendChild(yearHeading);

    // Create ordered list for this year
    const ol = document.createElement('ol');
    ol.style.fontSize = '12pt';

    byYear[year].forEach(publication => {
      const pubElement = createPublicationElement(publication);
      ol.appendChild(pubElement);
    });

    publicationsContainer.appendChild(ol);
  });
}

// Create HTML element for a publication
function createPublicationElement(publication) {
  const listItem = document.createElement('li');

  // Format authors with highlighting
  let authorsHTML = '';
  publication.authors.forEach((author, index) => {
    let displayName = getAuthorName(author);
    let isCorresponding = false;
    let isEqual = false;

    // Check markers for corresponding author (*) and equal contribution (+)
    if (displayName.includes('*')) {
      isCorresponding = true;
      displayName = displayName.replace('*', '');
    }

    if (displayName.includes('+')) {
      isEqual = true;
      displayName = displayName.replace('+', '');
    }

    if (author.includes('Xiaoyu Tao')) {
      authorsHTML += `<strong>${displayName}</strong>`;
    } else {
      authorsHTML += displayName;
    }

    if (isCorresponding) {
      authorsHTML += '<sup>*</sup>';
    }

    if (isEqual) {
      authorsHTML += '<sup>+</sup>';
    }

    if (index < publication.authors.length - 1) {
      authorsHTML += ', ';
    }
  });

  // Build the list item content
  let content = authorsHTML + ', ';

  // Add title as plain text (no hyperlink)
  content += publication.title;

  // Add venue/status
  content += `. (${publication.venue})`;

  // Add links (wrapped for styling)
  const links = [];
  if (publication.links && publication.links.pdf) {
    links.push(`<a href="${publication.links.pdf}" target="_blank" rel="noopener noreferrer">[PDF]</a>`);
  }
  if (publication.links && publication.links.code) {
    links.push(`<a href="${publication.links.code}" target="_blank" rel="noopener noreferrer">[Code]</a>`);
  }
  if (publication.links && publication.links.project) {
    links.push(`<a href="${publication.links.project}" target="_blank" rel="noopener noreferrer">[Project]</a>`);
  }

  if (links.length > 0) {
    content += ' <span class="pub-links">' + links.join(' ') + '</span>';
  }

  listItem.innerHTML = content;
  return listItem;
}

// Modal functionality for viewing original images
function openModal(imageSrc) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  modal.style.display = "block";
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  modalImg.src = imageSrc;
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Close modal when clicking outside the image
window.onclick = function(event) {
  const modal = document.getElementById('imageModal');
  if (event.target == modal) {
    closeModal();
  }
}

// Load projects from JSON file
function loadProjects() {
  fetch('projects.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Projects loaded successfully:", data);
      allProjects = data.projects;
      // Always show all projects
      renderProjects(false);
    })
    .catch(error => {
      console.error('Error loading projects:', error);
      displayFallbackProjects();
    });
}

// Fallback if projects JSON loading fails
function displayFallbackProjects() {
  const container = document.getElementById('projects-container');
  container.innerHTML = `Error loading projects.`;
}

// Toggle between showing all or selected projects
function toggleProjects() {
  showingSelectedProjects = !showingSelectedProjects;
  renderProjects(showingSelectedProjects);
  updateToggleButtonTexts();
}

// Render projects based on selection state
function renderProjects(selectedOnly) {
  const projectsContainer = document.getElementById('projects-container');
  projectsContainer.innerHTML = '';

  const projectsToShow = selectedOnly ?
    allProjects.filter(proj => proj.selected === 1) :
    allProjects;

  // Create ordered list
  const ol = document.createElement('ol');
  ol.style.fontSize = '12pt';

  projectsToShow.forEach(project => {
    const projectElement = createProjectElement(project);
    ol.appendChild(projectElement);
  });

  projectsContainer.appendChild(ol);
}

// Create HTML element for a project (similar to publication)
function createProjectElement(project) {
  const listItem = document.createElement('li');

  // Format authors with highlighting
  let authorsHTML = '';
  project.authors.forEach((author, index) => {
    let displayName = getAuthorName(author);
    let isCorresponding = false;

    // Check if author has * for corresponding author
    if (displayName.includes('*')) {
      isCorresponding = true;
      displayName = displayName.replace('*', '');
    }

    if (author.includes('Xiaoyu Tao')) {
      authorsHTML += `<strong>${displayName}</strong>`;
    } else {
      authorsHTML += displayName;
    }

    if (isCorresponding) {
      authorsHTML += '<sup>*</sup>';
    }

    if (index < project.authors.length - 1) {
      authorsHTML += ', ';
    }
  });

  // Build the list item content
  let content = authorsHTML + ', ';

  // Add title as link if link exists
  if (project.links && (project.links.pdf || project.links.code || project.links.project)) {
    const href = project.links.pdf || project.links.project || project.links.code;
    content += `<a href="${href}" target="_blank" rel="noopener noreferrer">${project.title}</a>`;
  } else {
    content += project.title;
  }

  // Add venue/status
  content += `. (${project.venue})`;

  // Add award if it exists
  if (project.award && project.award.length > 0) {
    content += ` ${project.award}`;
  }

  // Add links
  const links = [];
  if (project.links && project.links.pdf) {
    links.push(`<a href="${project.links.pdf}" target="_blank" rel="noopener noreferrer">[PDF]</a>`);
  }
  if (project.links && project.links.code) {
    links.push(`<a href="${project.links.code}" target="_blank" rel="noopener noreferrer">[Code]</a>`);
  }
  if (project.links && project.links.project) {
    links.push(`<a href="${project.links.project}" target="_blank" rel="noopener noreferrer">[Project]</a>`);
  }

  if (links.length > 0) {
    content += ' ' + links.join(' ');
  }

  listItem.innerHTML = content;
  return listItem;
}
