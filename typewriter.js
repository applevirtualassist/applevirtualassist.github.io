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
    section.classList.add("career-highlights--ink-ready");

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
        section.classList.add("career-highlights--drawing");
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
        section.classList.remove("career-highlights--ink-ready", "career-highlights--drawing");
        counters.forEach(({ element, target }) => {
            element.textContent = String(target);
        });
    });
}


// ABOUT: preserve the full layout and accessible copy while revealing visual letters.
function initAboutAnimation() {
    const text = document.querySelector(".about-text");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!text || motion.matches) return;

    const paragraphs = Array.from(text.querySelectorAll("p"));
    const letters = [];
    let elapsed = 0;
    const letterDelay = 7;

    paragraphs.forEach(paragraph => {
        const visual = document.createElement("span");
        visual.setAttribute("aria-hidden", "true");
        visual.innerHTML = paragraph.innerHTML;
        const accessible = document.createElement("span");
        accessible.className = "highlight-accessible";
        accessible.textContent = paragraph.textContent;
        const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach(node => {
            if (node.parentElement.closest("[data-type-pause]")) elapsed += 260;
            const fragment = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).filter(Boolean).forEach(part => {
                const word = document.createElement("span");
                if (!/^\s+$/.test(part)) word.className = "about-type-word";
                for (const character of part) {
                    const letter = document.createElement("span");
                    letter.className = "about-type-pending";
                    letter.textContent = character;
                    word.append(letter);
                    letters.push({ element: letter, time: elapsed });
                    elapsed += letterDelay;
                }
                fragment.append(word);
            });
            node.replaceWith(fragment);
        });
        paragraph.replaceChildren(accessible, visual);
        elapsed += 110;
    });

    let started = false;
    let frame;
    let visibilityTimer;
    let nextLetter = 0;
    let titleStarted = false;
    const container = text.closest(".about-container");
    const services = document.getElementById("services");

    function removeListeners() {
        window.removeEventListener("scroll", checkVisibility, true);
        window.removeEventListener("resize", checkVisibility);
        container.removeEventListener("transitionend", checkVisibility);
        clearTimeout(visibilityTimer);
    }

    function finish() {
        started = true;
        titleStarted = true;
        removeListeners();
        cancelAnimationFrame(frame);
        letters.forEach(({ element }) => element.classList.remove("about-type-pending"));
        text.classList.remove("about-text--typing", "about-text--title-animated");
    }

    function isFullyInView() {
        const rect = text.getBoundingClientRect();
        const sectionRect = container.getBoundingClientRect();
        const navBottom = document.querySelector("nav").getBoundingClientRect().bottom + 16;
        const viewportBottom = window.innerHeight - 16;
        const availableHeight = viewportBottom - navBottom;
        if (window.AOS && !container.classList.contains("aos-animate")) return false;
        if (sectionRect.height <= availableHeight) {
            return sectionRect.top >= navBottom && sectionRect.bottom <= viewportBottom;
        }
        // On stacked mobile layouts the section is taller than the screen.
        // Require the title and opening paragraph to be fully in the reading area.
        const bottom = rect.height <= availableHeight
            ? rect.bottom : paragraphs[0].getBoundingClientRect().bottom;
        return rect.top >= navBottom && bottom <= viewportBottom;
    }

    function startTyping() {
        if (started) return;
        started = true;
        text.classList.add("about-text--typing");
        const start = performance.now();
        function reveal(now) {
            while (nextLetter < letters.length && letters[nextLetter].time <= now - start) {
                letters[nextLetter++].element.classList.remove("about-type-pending");
            }
            if (nextLetter < letters.length) frame = requestAnimationFrame(reveal);
        }
        frame = requestAnimationFrame(reveal);
    }

    function checkVisibility() {
        clearTimeout(visibilityTimer);
        if (started && titleStarted) return;
        const navBottom = document.querySelector("nav").getBoundingClientRect().bottom;
        // Anchor jumps to Services, Skills or Contact also start the copy offscreen.
        if (!started && services && services.getBoundingClientRect().top <= navBottom + 16) startTyping();
        // Very short windows cannot fit even the opening paragraph. Keep the copy readable.
        const openingHeight = paragraphs[0].getBoundingClientRect().bottom - text.getBoundingClientRect().top;
        const readingHeight = window.innerHeight - document.querySelector("nav").getBoundingClientRect().bottom - 32;
        if (openingHeight > readingHeight) { finish(); return; }
        if (!isFullyInView()) return;
        // Let scrolling settle so a brief pass through the section does not trigger it.
        visibilityTimer = setTimeout(() => {
            if (!isFullyInView()) return;
            startTyping();
            // Save the title's one-time hop for when About Me is actually in view.
            titleStarted = true;
            text.classList.add("about-text--title-animated");
            removeListeners();
        }, 180);
    }

    window.addEventListener("scroll", checkVisibility, { passive: true, capture: true });
    window.addEventListener("resize", checkVisibility);
    container.addEventListener("transitionend", checkVisibility);
    motion.addEventListener("change", event => { if (event.matches) finish(); });
    checkVisibility();
}

function finishScrollReveal(element) {
    element.classList.remove("reveal-pending", "reveal-entering");
    element.classList.add("reveal-complete");
}

// Services and tools reveal when 30% of each item is in the reading area.
// Observe the resting boxes: CSS translate does not move them until the reveal starts.
function initSectionReveals() {
    const elements = Array.from(document.querySelectorAll("[data-scroll-reveal]"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll(".service-box, .skill-box").forEach(card => card.classList.add("hover-ready"));
    if (motion.matches || !("IntersectionObserver" in window)) return;

    const timers = new Map();
    let observer;
    elements.forEach(element => {
        element.classList.add("reveal-pending");
        element.addEventListener("animationend", event => {
            if (event.target === element && event.animationName === "section-reveal") finishScrollReveal(element);
        });
    });

    function observe() {
        if (observer) observer.disconnect();
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
        const navHeight = Math.ceil(document.querySelector("nav").getBoundingClientRect().bottom);
        observer = new IntersectionObserver(entries => {
            let stagger = 0;
            entries.forEach(entry => {
                const element = entry.target;
                if (element.classList.contains("reveal-complete") || element.classList.contains("reveal-entering")) {
                    observer.unobserve(element);
                    return;
                }
                if (!entry.isIntersecting || entry.intersectionRatio < 0.3) {
                    clearTimeout(timers.get(element));
                    timers.delete(element);
                    return;
                }
                if (timers.has(element)) return;
                const delay = 120 + Math.min(stagger++, 3) * 70;
                timers.set(element, setTimeout(() => {
                    timers.delete(element);
                    observer.unobserve(element);
                    if (!element.classList.contains("reveal-complete")) element.classList.add("reveal-entering");
                }, delay));
            });
        }, { threshold: [0, 0.3], rootMargin: `-${navHeight}px 0px 0px 0px` });
        elements.filter(element => !element.classList.contains("reveal-complete") && !element.classList.contains("reveal-entering"))
            .forEach(element => observer.observe(element));
    }

    observe();
    window.addEventListener("resize", observe);
    motion.addEventListener("change", event => {
        if (!event.matches) return;
        observer.disconnect();
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
        window.removeEventListener("resize", observe);
        elements.forEach(finishScrollReveal);
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

function setVisibleServices(forceRevealDone = false) {
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

        if (forceRevealDone && isVisible) {
            // The carousel supplies its own slide animation for newly selected cards.
            finishScrollReveal(card);
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
        card.classList.add("is-visible");
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
    initAboutAnimation();
    initSectionReveals();
});
