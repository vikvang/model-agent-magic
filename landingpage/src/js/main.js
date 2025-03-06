// Gregify Landing Page JavaScript

document.addEventListener("DOMContentLoaded", () => {
  // Initialize any interactive elements
  initializeNavigation();
  initializeAnimations();
});

function initializeNavigation() {
  // Mobile navigation toggle (to be implemented)
  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", () => {
      document.querySelector("nav ul").classList.toggle("show");
    });
  }
}

function initializeAnimations() {
  // Simple scroll animations
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    animatedElements.forEach((element) => {
      element.classList.add("animated");
    });
  }
}
