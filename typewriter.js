// HERO TYPEWRITER
const words = [" Social Media Manager.", " Real Estate VA.", " Graphic Designer."];
const typed = document.getElementById("typed");

let wordIndex = 0;
let charIndex = 0;

function type() {
    if (!typed) return;

    if (charIndex < words[wordIndex].length) {
        typed.textContent += words[wordIndex][charIndex];
        charIndex++;
        setTimeout(type, 100);
    } else {
        setTimeout(erase, 1500);
    }
}

function erase() {
    if (!typed) return;

    if (charIndex > 0) {
        typed.textContent = words[wordIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, 50);
    } else {
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 500);
    }
}


// CAREER HIGHLIGHTS: one shared clock keeps all three counters in sync.
function initCareerHighlights() {
    const section = document.querySelector(".career-highlights-section");
    if (!section) return;

    const counters = Array.from(section.querySelectorAll("[data-count]"), element => ({
        element,
        target: Number(element.dataset.count)
    }));
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // The HTML already contains the final, accessible values.
    if (motionQuery.matches || !("IntersectionObserver" in window)) return;

    const entranceElements = Array.from(section.querySelectorAll("[data-aos]"));
    // AOS can initialize its elements after this handler on a cached reload.
    // Gate as soon as the library is available; keep content visible if it failed to load.
    if (window.AOS) {
        section.classList.add("career-highlights--waiting");
    }

    let started = false;
    let frameId;
    let observer;
    let scrollIntent = false;
    // The existing large-screen body zoom can make the body scroll before the document.
    const pageScrollY = () => window.scrollY + document.body.scrollTop;
    let lastScrollY = pageScrollY();
    const duration = 1800;

    counters.forEach(({ element }) => { element.textContent = "0"; });

    function revealHighlights() {
        entranceElements.forEach(element => element.classList.add("aos-animate"));
        section.classList.remove("career-highlights--waiting");
    }

    function startCounters() {
        if (started) return;
        started = true;
        observer.disconnect();
        revealHighlights();
        const startTime = performance.now();

        function updateCounters(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            counters.forEach(({ element, target }) => {
                element.textContent = String(Math.floor(progress * target));
            });
            if (progress < 1) frameId = requestAnimationFrame(updateCounters);
        }

        frameId = requestAnimationFrame(updateCounters);
    }

    function noteScrollIntent(event) {
        if (event.type === "keydown") {
            const target = event.target;
            if (target.isContentEditable || target.matches("input, textarea, select")) return;
            if (!["ArrowDown", "PageDown", "End", " "].includes(event.key)) return;
        }
        scrollIntent = true;
    }

    function removeScrollListeners() {
        window.removeEventListener("wheel", noteScrollIntent);
        window.removeEventListener("touchmove", noteScrollIntent);
        window.removeEventListener("keydown", noteScrollIntent);
        window.removeEventListener("scroll", observeAfterScroll, true);
    }

    function observeAfterScroll(event) {
        if (event.target !== document && event.target !== document.body) return;
        const currentScrollY = pageScrollY();
        const movedDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;
        if (!scrollIntent || !movedDown) return;

        removeScrollListeners();
        observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) {
                startCounters();
            }
        }, { threshold: 0.35 });

        // Observe individual items so even a short mobile viewport can trigger all counters.
        section.querySelectorAll(".career-highlights > li").forEach(item => observer.observe(item));
    }

    // A tall viewport or restored scroll position must not start counting on refresh.
    // Wait for intentional downward scrolling, then let visibility trigger the animation.
    window.addEventListener("wheel", noteScrollIntent, { passive: true });
    window.addEventListener("touchmove", noteScrollIntent, { passive: true });
    window.addEventListener("keydown", noteScrollIntent);
    window.addEventListener("scroll", observeAfterScroll, { passive: true, capture: true });

    // Also honor a preference change while waiting or counting, without restarting.
    motionQuery.addEventListener("change", event => {
        if (!event.matches) return;
        started = true;
        removeScrollListeners();
        if (observer) observer.disconnect();
        cancelAnimationFrame(frameId);
        revealHighlights();
        counters.forEach(({ element, target }) => {
            element.textContent = String(target);
        });
    });
}


// SERVICES CAROUSEL
const servicesGrid = document.getElementById("services-grid");
const servicesNextButton = document.getElementById("services-carousel-next");
const serviceCards = Array.from(document.querySelectorAll("[data-service-card]"));
const servicesDesktopQuery = window.matchMedia("(min-width: 1101px)");
const servicesVisibleCount = 3;

let servicesStartIndex = 0;
let servicesAnimating = false;

function setVisibleServices(forceAosDone = false) {
    if (!servicesGrid || serviceCards.length === 0) return;

    const visibleCount = Math.min(servicesVisibleCount, serviceCards.length);
    const visibleIndexes = Array.from(
        { length: visibleCount },
        (_, offset) => (servicesStartIndex + offset) % serviceCards.length
    );

    serviceCards.forEach((card, index) => {
        const visiblePosition = visibleIndexes.indexOf(index);
        const isVisible = visiblePosition !== -1;

        card.classList.toggle("is-visible", isVisible);
        card.classList.toggle("is-hidden", !isVisible);
        card.style.order = isVisible ? visiblePosition + 1 : serviceCards.length + index;

        if (forceAosDone && isVisible) {
            card.classList.add("aos-animate");
        }
    });
}

function getVisibleServiceCards() {
    return serviceCards.filter(card => card.classList.contains("is-visible"));
}

function showAllServicesStatic() {
    if (!servicesGrid || serviceCards.length === 0) return;

    servicesAnimating = false;
    servicesStartIndex = 0;
    servicesGrid.classList.remove("services-grid--animating");

    serviceCards.forEach((card, index) => {
        card.classList.remove("is-hidden");
        card.classList.add("is-visible", "aos-animate");
        card.style.order = index + 1;
        card.style.transition = "";
        card.style.transform = "";
        card.style.opacity = "";
    });
}

function getServicesGridGap() {
    if (!servicesGrid) return 0;

    const gridStyles = window.getComputedStyle(servicesGrid);
    return parseFloat(gridStyles.columnGap || gridStyles.gap) || 0;
}

function animateServicesToNext() {
    if (!servicesDesktopQuery.matches || servicesAnimating) return;

    servicesAnimating = true;
    servicesGrid.classList.add("services-grid--animating");

    const previousVisibleCards = getVisibleServiceCards();
    const previousRects = new Map(
        previousVisibleCards.map(card => [card, card.getBoundingClientRect()])
    );
    const previousLastCard = previousVisibleCards[previousVisibleCards.length - 1];
    const previousLastRect = previousRects.get(previousLastCard);
    const desktopSlideInDistance = previousLastRect
        ? previousLastRect.width + getServicesGridGap()
        : 0;

    servicesStartIndex = (servicesStartIndex + 1) % serviceCards.length;
    setVisibleServices(true);

    getVisibleServiceCards().forEach(card => {
        const previousRect = previousRects.get(card);
        const currentRect = card.getBoundingClientRect();

        card.style.transition = "none";

        if (previousRect) {
            const deltaX = previousRect.left - currentRect.left;
            const deltaY = previousRect.top - currentRect.top;
            card.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
            card.style.opacity = "1";
        } else {
            card.style.transform = `translate3d(${desktopSlideInDistance || currentRect.width}px, 0, 0)`;
            card.style.opacity = "1";
        }
    });

    servicesGrid.offsetHeight;

    getVisibleServiceCards().forEach(card => {
        card.style.transition = "transform .96s cubic-bezier(.22, 1, .36, 1), box-shadow .18s ease";
        card.style.transform = "";
        card.style.opacity = "";
    });

    window.setTimeout(() => {
        getVisibleServiceCards().forEach(card => {
            card.style.transition = "";
            card.style.transform = "";
            card.style.opacity = "";
        });

        servicesGrid.classList.remove("services-grid--animating");
        servicesAnimating = false;
    }, 1040);
}

function initServicesCarousel() {
    if (!servicesGrid || !servicesNextButton || serviceCards.length <= servicesVisibleCount) return;

    if (servicesDesktopQuery.matches) {
        setVisibleServices();
    } else {
        showAllServicesStatic();
    }

    servicesNextButton.addEventListener("click", animateServicesToNext);

    const handleServicesLayoutChange = () => {
        if (servicesDesktopQuery.matches) {
            setVisibleServices();
        } else {
            showAllServicesStatic();
        }
    };

    if (servicesDesktopQuery.addEventListener) {
        servicesDesktopQuery.addEventListener("change", handleServicesLayoutChange);
    } else {
        servicesDesktopQuery.addListener(handleServicesLayoutChange);
    }
}


// INITIALIZE PAGE INTERACTIONS
document.addEventListener("DOMContentLoaded", () => {
    type();
    initServicesCarousel();
    initCareerHighlights();
});
