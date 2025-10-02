/**
 * UI Enhancements for Instagram Dashboard
 * Adds animations, visual effects and interactive elements
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI enhancement features
  initUIEnhancements();
  
  // Set up chart interaction behaviors
  setupChartInteractions();
  
  // Set up podium ranking options
  setupPodiumOptions();
});

/**
 * Initializes UI enhancement features
 */
function initUIEnhancements() {
  // Enable all tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Add scroll animations to cards
  const cards = document.querySelectorAll('.card');
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate__animated', 'animate__fadeIn');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    
    cards.forEach(card => {
      if (!card.classList.contains('animate__animated')) {
        observer.observe(card);
      }
    });
  }
  
  // Add hover effects to profile rows
  const profileRows = document.querySelectorAll('#profilesTable tr');
  profileRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'rgba(0,0,0,0.02)';
      row.style.transform = 'translateY(-2px)';
      row.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)';
      row.style.transition = 'all 0.3s ease';
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = '';
      row.style.transform = '';
      row.style.boxShadow = '';
    });
  });
}

/**
 * Sets up interactive behaviors for charts
 */
function setupChartInteractions() {
  // Toggle follower chart labels
  const toggleFollowerLabelsBtn = document.getElementById('toggleFollowerLabels');
  if (toggleFollowerLabelsBtn) {
    toggleFollowerLabelsBtn.addEventListener('click', () => {
      if (window.followersChart) {
        const showLabels = !window.followersChart.options.plugins.datalabels.display;
        window.followersChart.options.plugins.datalabels.display = showLabels;
        window.followersChart.update();
        
        // Show notification
        showToast(showLabels ? 'Chart labels enabled' : 'Chart labels disabled');
      }
    });
  }
  
  // Sort followers chart
  const sortFollowersBtn = document.getElementById('sortFollowers');
  if (sortFollowersBtn) {
    sortFollowersBtn.addEventListener('click', () => {
      if (window.followersChart && window.followersChart.data) {
        // Sort data by value
        const labels = [...window.followersChart.data.labels];
        const data = [...window.followersChart.data.datasets[0].data];
        const backgroundColors = [...window.followersChart.data.datasets[0].backgroundColor];
        
        // Create array of objects for sorting
        const combined = labels.map((label, i) => ({
          label,
          value: data[i],
          color: backgroundColors[i]
        }));
        
        // Sort by value (descending)
        combined.sort((a, b) => b.value - a.value);
        
        // Update chart with sorted data
        window.followersChart.data.labels = combined.map(item => item.label);
        window.followersChart.data.datasets[0].data = combined.map(item => item.value);
        window.followersChart.data.datasets[0].backgroundColor = combined.map(item => item.color);
        window.followersChart.update();
        
        // Show notification
        showToast('Chart sorted by follower count');
      }
    });
  }
  
  // Download followers chart as image
  const downloadFollowerChartBtn = document.getElementById('downloadFollowerChart');
  if (downloadFollowerChartBtn) {
    downloadFollowerChartBtn.addEventListener('click', () => {
      if (window.followersChart) {
        const canvas = document.getElementById('followersChart');
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'instagram_followers_chart.png';
        link.click();
        
        // Show notification
        showToast('Chart downloaded successfully');
      }
    });
  }
  
  // Similar functions for the posts chart
  const sortPostsBtn = document.getElementById('sortPosts');
  if (sortPostsBtn) {
    sortPostsBtn.addEventListener('click', () => {
      if (window.postsChart && window.postsChart.data) {
        const labels = [...window.postsChart.data.labels];
        const data = [...window.postsChart.data.datasets[0].data];
        const backgroundColors = [...window.postsChart.data.datasets[0].backgroundColor];
        
        const combined = labels.map((label, i) => ({
          label,
          value: data[i],
          color: backgroundColors[i]
        }));
        
        combined.sort((a, b) => b.value - a.value);
        
        window.postsChart.data.labels = combined.map(item => item.label);
        window.postsChart.data.datasets[0].data = combined.map(item => item.value);
        window.postsChart.data.datasets[0].backgroundColor = combined.map(item => item.color);
        window.postsChart.update();
        
        showToast('Chart sorted by post count');
      }
    });
  }
}

/**
 * Sets up podium ranking options
 */
function setupPodiumOptions() {
  const rankByFollowersBtn = document.getElementById('rankByFollowers');
  const rankByEngagementBtn = document.getElementById('rankByEngagement');
  const rankByPostsBtn = document.getElementById('rankByPosts');
  
  if (rankByFollowersBtn) {
    rankByFollowersBtn.addEventListener('click', () => {
      if (window.profiles) {
        const sorted = [...window.profiles].sort((a, b) => b.followers - a.followers);
        renderPodium(sorted.slice(0, 3), 'followers');
        showToast('Podium ranked by followers');
      }
    });
  }
  
  if (rankByEngagementBtn) {
    rankByEngagementBtn.addEventListener('click', () => {
      if (window.profiles) {
        const sorted = [...window.profiles].sort((a, b) => {
          const engA = (a.likes_avg || 0) / (a.followers || 1) * 100;
          const engB = (b.likes_avg || 0) / (b.followers || 1) * 100;
          return engB - engA;
        });
        renderPodium(sorted.slice(0, 3), 'engagement');
        showToast('Podium ranked by engagement rate');
      }
    });
  }
  
  if (rankByPostsBtn) {
    rankByPostsBtn.addEventListener('click', () => {
      if (window.profiles) {
        const sorted = [...window.profiles].sort((a, b) => b.posts - a.posts);
        renderPodium(sorted.slice(0, 3), 'posts');
        showToast('Podium ranked by post count');
      }
    });
  }
}

/**
 * Display a toast notification
 * @param {string} message - The message to display
 */
function showToast(message) {
  Swal.fire({
    toast: true,
    icon: 'success',
    title: message,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
}