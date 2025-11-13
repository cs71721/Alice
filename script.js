// Invisible Thoughts - Minimal JavaScript
// ONLY smooth scrolling for internal anchor links
// No animations, no fade-ins, no engagement features

document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for any internal anchor links
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
