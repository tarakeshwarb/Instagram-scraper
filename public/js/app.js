// app.js - Frontend JavaScript for Instagram Leaderboard

// DOM Elements
const profilesTable = document.getElementById('profilesTable');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortSelect = document.getElementById('sortSelect');
const refreshBtn = document.getElementById('refreshBtn');
const followersChart = document.getElementById('followersChart');
const postsChart = document.getElementById('postsChart');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const applyDateFilterBtn = document.getElementById('applyDateFilter');
const resetFiltersBtn = document.getElementById('resetFilters');

// State
let profiles = [];
let filteredProfiles = [];
let followersChartInstance = null;
let postsChartInstance = null;

// Fetch profiles from API
async function fetchProfiles() {
  try {
    const response = await fetch('/api/profiles/leaderboard');
    const data = await response.json();
    
    if (data.success) {
      profiles = data.profiles;
      filteredProfiles = [...profiles];
      renderProfiles();
      renderCharts(data.topFollowers, data.topPosts, data.stats);
    } else {
      showError('Failed to load profiles');
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
    showError('Failed to connect to the server');
  }
}

// Run Instagram scraper
async function runScraper() {
  try {
    // Show loading notification
    Swal.fire({
      title: 'Running Instagram Scraper',
      html: 'This may take several minutes. Please wait...',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Call scraper endpoint
    const response = await fetch('/api/run-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Close loading notification
    Swal.close();
    
    if (data.success) {
      // Show success notification
      Swal.fire({
        title: 'Scraper Completed',
        text: 'Instagram profiles have been updated successfully!',
        icon: 'success',
        confirmButtonText: 'Refresh Data'
      }).then((result) => {
        if (result.isConfirmed) {
          fetchProfiles();
        }
      });
    } else {
      // Show error notification
      Swal.fire({
        title: 'Scraper Failed',
        text: data.error || 'Failed to run Instagram scraper',
        icon: 'error'
      });
    }
  } catch (error) {
    console.error('Error running scraper:', error);
    Swal.fire({
      title: 'Error',
      text: 'Failed to connect to the server',
      icon: 'error'
    });
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Get chart colors
function getChartColors() {
  return {
    gridColor: 'rgba(0, 0, 0, 0.1)',
    textColor: '#666',
    regularBarColor: 'rgba(108, 117, 125, 0.5)',
    regularBarBorder: 'rgba(108, 117, 125, 1)',
    postsBarColor: 'rgba(23, 162, 184, 0.7)',
    postsBarBorder: 'rgb(23, 162, 184)',
    goldColor: 'rgba(255, 215, 0, 0.8)',
    goldBorder: 'rgb(255, 215, 0)',
    silverColor: 'rgba(192, 192, 192, 0.8)',
    silverBorder: 'rgb(192, 192, 192)',
    bronzeColor: 'rgba(205, 127, 50, 0.8)',
    bronzeBorder: 'rgb(205, 127, 50)'
  };
}

// Render profiles to table
function renderProfiles() {
  if (filteredProfiles.length === 0) {
    profilesTable.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-3">No profiles found</td>
      </tr>
    `;
    return;
  }
  
  const html = filteredProfiles.map((profile, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <a href="https://instagram.com/${profile.username}" target="_blank" class="text-decoration-none">
          @${profile.username}
        </a>
      </td>
      <td>${formatNumber(profile.followers)}</td>
      <td>${formatNumber(profile.following)}</td>
      <td>${formatNumber(profile.posts_count)}</td>
      <td>${formatDate(profile.last_updated)}</td>
    </tr>
  `).join('');
  
  profilesTable.innerHTML = html;
}

// Render the podium with top 3 profiles
function renderPodium(top3Profiles) {
  const podiumContainer = document.getElementById('profilePodium');
  if (!podiumContainer || !top3Profiles || top3Profiles.length < 3) return;
  
  // Create HTML structure for the podium
  const podiumHTML = `
    <div class="podium">
      <!-- Second Place (Left) -->
      <div class="podium-block second-place">
        <div class="medal silver">2</div>
        <div class="profile-avatar">
          <img src="https://ui-avatars.com/api/?name=${top3Profiles[1].username}&background=random" alt="${top3Profiles[1].username}" />
        </div>
        <div class="profile-info">
          <div class="username">@${top3Profiles[1].username}</div>
          <div class="followers">${formatNumber(top3Profiles[1].followers)}</div>
        </div>
      </div>
      
      <!-- First Place (Center) -->
      <div class="podium-block first-place">
        <div class="medal gold">1</div>
        <div class="profile-avatar">
          <img src="https://ui-avatars.com/api/?name=${top3Profiles[0].username}&background=random" alt="${top3Profiles[0].username}" />
        </div>
        <div class="profile-info">
          <div class="username">@${top3Profiles[0].username}</div>
          <div class="followers">${formatNumber(top3Profiles[0].followers)}</div>
        </div>
      </div>
      
      <!-- Third Place (Right) -->
      <div class="podium-block third-place">
        <div class="medal bronze">3</div>
        <div class="profile-avatar">
          <img src="https://ui-avatars.com/api/?name=${top3Profiles[2].username}&background=random" alt="${top3Profiles[2].username}" />
        </div>
        <div class="profile-info">
          <div class="username">@${top3Profiles[2].username}</div>
          <div class="followers">${formatNumber(top3Profiles[2].followers)}</div>
        </div>
      </div>
    </div>
  `;
  
  podiumContainer.innerHTML = podiumHTML;
}

// Filter profiles by search term and date range
function filterProfiles() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
  
  // If end date is provided, set it to end of day
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }
  
  filteredProfiles = profiles.filter(profile => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      profile.username.toLowerCase().includes(searchTerm);
    
    // Date range filter
    let matchesDateRange = true;
    if (startDate || endDate) {
      const profileDate = profile.last_updated ? new Date(profile.last_updated) : null;
      
      if (profileDate) {
        if (startDate && endDate) {
          matchesDateRange = profileDate >= startDate && profileDate <= endDate;
        } else if (startDate) {
          matchesDateRange = profileDate >= startDate;
        } else if (endDate) {
          matchesDateRange = profileDate <= endDate;
        }
      } else {
        // If profile has no date and date filter is active, exclude it
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesDateRange;
  });
  
  sortProfiles();
}

// Sort profiles
function sortProfiles() {
  const sortBy = sortSelect.value;
  
  filteredProfiles.sort((a, b) => b[sortBy] - a[sortBy]);
  renderProfiles();
}

// Render charts
function renderCharts(topFollowers = null, topPosts = null, stats = null) {
  // Sort all profiles by followers
  const sortedProfiles = [...profiles].sort((a, b) => b.followers - a.followers);
  
  // Get top 3 profiles
  const top3Profiles = sortedProfiles.slice(0, 3);
  
  // Get other profiles (limited to next 12 for readability)
  const otherProfiles = sortedProfiles.slice(3, 15);
  
  // Render podium with top 3 profiles
  renderPodium(top3Profiles);
  
  // Get data for posts chart
  const topByPosts = topPosts || [...profiles]
    .sort((a, b) => b.posts_count - a.posts_count)
    .slice(0, 5);
  
  // Followers chart
  if (followersChartInstance) {
    followersChartInstance.destroy();
  }
  
  // Create arrays for the chart - all profiles in descending order by followers
  // Combine top3 and other profiles and sort all by followers
  const allProfilesForChart = [...top3Profiles, ...otherProfiles]
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 15); // Limit to 15 profiles for readability
    
  const labels = allProfilesForChart.map(p => '@' + p.username);
  const data = allProfilesForChart.map(p => p.followers);
  
  // Get colors for the chart based on current theme
  const chartColors = getChartColors();
  
  // Create background colors array with special colors for top 3
  const backgroundColors = allProfilesForChart.map((profile, index) => {
    // Special colors for top 3
    if (index === 0) return chartColors.goldColor;   // Gold for 1st
    if (index === 1) return chartColors.silverColor; // Silver for 2nd
    if (index === 2) return chartColors.bronzeColor; // Bronze for 3rd
    // Regular color for others
    return chartColors.regularBarColor;
  });
  
  // Create border colors
  const borderColors = allProfilesForChart.map((profile, index) => {
    // Special colors for top 3
    if (index === 0) return chartColors.goldBorder;   // Gold for 1st
    if (index === 1) return chartColors.silverBorder; // Silver for 2nd
    if (index === 2) return chartColors.bronzeBorder; // Bronze for 3rd
    // Regular color for others
    return chartColors.regularBarBorder;
  });
  
  followersChartInstance = new Chart(followersChart, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Followers',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              // Check if this is one of the top 3 profiles
              const index = context.dataIndex;
              
              let label = formatNumber(context.raw) + ' followers';
              
              // Add ranking for top 3
              if (index === 0) {
                label = '� 1st Place: ' + label;
              } else if (index === 1) {
                label = '� 2nd Place: ' + label;
              } else if (index === 2) {
                label = '� 3rd Place: ' + label;
              }
              
              return label;
            },
            title: function(context) {
              return context[0].label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.gridColor
          },
          ticks: {
            color: chartColors.textColor,
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
              }
              return value;
            }
          }
        },
        x: {
          grid: {
            color: chartColors.gridColor
          },
          ticks: {
            color: chartColors.textColor,
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
  
  // Clear the top profiles legend if it exists
  const topProfilesLegend = document.getElementById('topProfilesLegend');
  if (topProfilesLegend) {
    topProfilesLegend.innerHTML = '';
  }
  
  // Posts chart
  if (postsChartInstance) {
    postsChartInstance.destroy();
  }
  
  postsChartInstance = new Chart(postsChart, {
    type: 'bar',
    data: {
      labels: topByPosts.map(p => '@' + p.username),
      datasets: [{
        label: 'Posts',
        data: topByPosts.map(p => p.posts_count),
        backgroundColor: chartColors.postsBarColor,
        borderColor: chartColors.postsBarBorder,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatNumber(context.raw) + ' posts';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.gridColor
          },
          ticks: {
            color: chartColors.textColor,
            callback: function(value) {
              if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
              }
              return value;
            }
          }
        },
        x: {
          grid: {
            color: chartColors.gridColor
          },
          ticks: {
            color: chartColors.textColor
          }
        }
      }
    }
  });
}

// Show error message
function showError(message) {
  profilesTable.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-3 text-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
      </td>
    </tr>
  `;
}

// Get and display next scheduled scrape time
async function getScheduleInfo() {
  try {
    const response = await fetch('/api/scraper/schedule');
    const data = await response.json();
    
    if (data.success) {
      // Format the next run date
      let scheduleMessage = '';
      if (data.nextScheduledRun) {
        const nextRun = new Date(data.nextScheduledRun);
        const options = { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        scheduleMessage = `Next scheduled scrape: ${nextRun.toLocaleDateString(undefined, options)}`;
      } else {
        scheduleMessage = 'Scheduled daily at midnight (00:00)';
      }
      
      // Display the schedule info in a tooltip
      const scrapeBtn = document.getElementById('scrapeBtn');
      if (scrapeBtn) {
        scrapeBtn.setAttribute('title', scheduleMessage);
        scrapeBtn.setAttribute('data-bs-toggle', 'tooltip');
        scrapeBtn.setAttribute('data-bs-placement', 'bottom');
        
        // Initialize tooltip
        new bootstrap.Tooltip(scrapeBtn);
      }
    }
  } catch (error) {
    console.error('Error fetching schedule info:', error);
  }
}

// Reset all filters
function resetFilters() {
  // Clear search and date inputs
  searchInput.value = '';
  startDateInput.value = '';
  endDateInput.value = '';
  
  // Reset to default sort
  sortSelect.value = sortSelect.options[0].value;
  
  // Reset filtered profiles to all profiles
  filteredProfiles = [...profiles];
  
  // Re-render with default sort
  sortProfiles();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchProfiles();
  getScheduleInfo();
  
  // Search button
  searchBtn.addEventListener('click', () => {
    filterProfiles();
  });
  
  // Search input (Enter key)
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      filterProfiles();
    }
  });
  
  // Sort dropdown
  sortSelect.addEventListener('change', () => {
    sortProfiles();
  });
  
  // Date filter apply button
  applyDateFilterBtn.addEventListener('click', () => {
    filterProfiles();
  });
  
  // Reset filters button
  resetFiltersBtn.addEventListener('click', () => {
    resetFilters();
  });
  
  // Refresh data button
  refreshBtn.addEventListener('click', () => {
    fetchProfiles();
  });
  
  // Scrape Instagram data button (requires authentication)
  const scrapeBtn = document.getElementById('scrapeBtn');
  if (scrapeBtn) {
    scrapeBtn.addEventListener('click', () => {
      // Check if user is logged in (assuming auth.js sets a flag or token)
      if (window.isLoggedIn || localStorage.getItem('authToken')) {
        runScraper();
      } else {
        Swal.fire({
          title: 'Authentication Required',
          text: 'You must be logged in to run the Instagram scraper',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Login',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/login.html';
          }
        });
      }
    });
  }
});