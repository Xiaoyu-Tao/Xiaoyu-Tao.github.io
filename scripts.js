// Global variables
let allPublications = [];
let allProjects = [];
let showingSelectedPublications = true;
let showingSelectedProjects = true;

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
    toggleHeader.textContent = showingSelectedPublications 
      ? 'Selected Publications'
      : 'All Publications';
  }
  
  if (projectsToggleHeader) {
    projectsToggleHeader.textContent = showingSelectedProjects 
      ? 'Selected Projects and Competitions'
      : 'All Projects and Competitions';
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
      renderPublications(true);
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
  
  pubsToShow.forEach(publication => {
    const pubElement = createPublicationElement(publication);
    publicationsContainer.appendChild(pubElement);
  });
}

// Create HTML element for a publication
function createPublicationElement(publication) {
  const pubItem = document.createElement('div');
  pubItem.className = 'publication-item';
  
  // Create thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'pub-thumbnail';
  thumbnail.onclick = () => openModal(publication.thumbnail);
  
  const thumbnailImg = document.createElement('img');
  thumbnailImg.src = publication.thumbnail;
  thumbnailImg.alt = `${publication.title} thumbnail`;
  thumbnail.appendChild(thumbnailImg);
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'pub-content';
  
  // Add title as link
  const title = document.createElement('div');
  title.className = 'pub-title';
  if (publication.links && publication.links.pdf) {
    const titleLink = document.createElement('a');
    titleLink.href = publication.links.pdf;
    titleLink.textContent = publication.title;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    title.appendChild(titleLink);
  } else {
    title.textContent = publication.title;
  }
  content.appendChild(title);
  
  // Add authors with highlight
  const authors = document.createElement('div');
  authors.className = 'pub-authors';
  
  // Format authors with highlighting
  let authorsHTML = '';
  publication.authors.forEach((author, index) => {
    const displayName = getAuthorName(author);
    if (author.includes('Xiaoyu Tao')) {
      authorsHTML += `<span class="highlight-name">${displayName}</span>`;
    } else if (author.includes('Qi Liu') || author.includes('Mingyue Cheng')) {
      authorsHTML += `<span class="highlight-advisor">${displayName}</span>`;
    } else {
      authorsHTML += displayName;
    }
    
    if (index < publication.authors.length - 1) {
      authorsHTML += ', ';
    }
  });
  
  authors.innerHTML = authorsHTML;
  content.appendChild(authors);
  
  // Add venue with award if present
  const venueContainer = document.createElement('div');
  venueContainer.className = 'pub-venue-container';
  
  const venue = document.createElement('div');
  venue.className = 'pub-venue';
  venue.textContent = publication.venue;
  venueContainer.appendChild(venue);
  
  // Add award if it exists
  if (publication.award && publication.award.length > 0) {
    const award = document.createElement('div');
    award.className = 'pub-award';
    award.textContent = publication.award;
    venueContainer.appendChild(award);
  }
  
  content.appendChild(venueContainer);
  
  // Add links if they exist
  if (publication.links) {
    const links = document.createElement('div');
    links.className = 'pub-links';
    
    if (publication.links.pdf) {
      const pdfLink = document.createElement('a');
      pdfLink.href = publication.links.pdf;
      pdfLink.textContent = '[Paper]';
      links.appendChild(pdfLink);
    }
    
    if (publication.links.code) {
      const codeLink = document.createElement('a');
      codeLink.href = publication.links.code;
      codeLink.textContent = '[Code]';
      links.appendChild(codeLink);
    }
    
    if (publication.links.project) {
      const projectLink = document.createElement('a');
      projectLink.href = publication.links.project;
      projectLink.textContent = '[Project Page]';
      links.appendChild(projectLink);
    }
    
    content.appendChild(links);
  }
  
  // Assemble the publication item
  pubItem.appendChild(thumbnail);
  pubItem.appendChild(content);
  
  return pubItem;
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
      renderProjects(true);
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
  
  projectsToShow.forEach(project => {
    const projectElement = createProjectElement(project);
    projectsContainer.appendChild(projectElement);
  });
}

// Create HTML element for a project (similar to publication)
function createProjectElement(project) {
  const projectItem = document.createElement('div');
  projectItem.className = 'publication-item'; // Reuse publication styles
  
  // Create thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'pub-thumbnail';
  thumbnail.onclick = () => openModal(project.thumbnail);
  
  const thumbnailImg = document.createElement('img');
  thumbnailImg.src = project.thumbnail;
  thumbnailImg.alt = `${project.title} thumbnail`;
  thumbnail.appendChild(thumbnailImg);
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'pub-content';
  
  // Add title as link
  const title = document.createElement('div');
  title.className = 'pub-title';
  if (project.links && (project.links.pdf || project.links.code || project.links.project)) {
    const titleLink = document.createElement('a');
    // Prefer PDF, then project page, then code
    titleLink.href = project.links.pdf || project.links.project || project.links.code;
    titleLink.textContent = project.title;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    title.appendChild(titleLink);
  } else {
    title.textContent = project.title;
  }
  content.appendChild(title);
  
  // Add authors with highlight
  const authors = document.createElement('div');
  authors.className = 'pub-authors';
  
  // Format authors with highlighting
  let authorsHTML = '';
  project.authors.forEach((author, index) => {
    const displayName = getAuthorName(author);
    if (author.includes('Xiaoyu Tao')) {
      authorsHTML += `<span class="highlight-name">${displayName}</span>`;
    } else if (author.includes('Qi Liu') || author.includes('Mingyue Cheng')) {
      authorsHTML += `<span class="highlight-advisor">${displayName}</span>`;
    } else {
      authorsHTML += displayName;
    }
    
    if (index < project.authors.length - 1) {
      authorsHTML += ', ';
    }
  });
  
  authors.innerHTML = authorsHTML;
  content.appendChild(authors);
  
  // Add venue with award if present
  const venueContainer = document.createElement('div');
  venueContainer.className = 'pub-venue-container';
  
  const venue = document.createElement('div');
  venue.className = 'pub-venue';
  venue.textContent = project.venue;
  venueContainer.appendChild(venue);
  
  // Add award if it exists
  if (project.award && project.award.length > 0) {
    const award = document.createElement('div');
    award.className = 'pub-award';
    award.textContent = project.award;
    venueContainer.appendChild(award);
  }
  
  content.appendChild(venueContainer);
  
  // Add links if they exist
  if (project.links && Object.keys(project.links).length > 0) {
    const links = document.createElement('div');
    links.className = 'pub-links';
    
    if (project.links.pdf) {
      const pdfLink = document.createElement('a');
      pdfLink.href = project.links.pdf;
      pdfLink.textContent = '[Paper]';
      links.appendChild(pdfLink);
    }
    
    if (project.links.code) {
      const codeLink = document.createElement('a');
      codeLink.href = project.links.code;
      codeLink.textContent = '[Code]';
      links.appendChild(codeLink);
    }
    
    content.appendChild(links);
  }
  
  // Assemble the project item
  projectItem.appendChild(thumbnail);
  projectItem.appendChild(content);
  
  return projectItem;
}
