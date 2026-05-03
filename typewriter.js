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


// INTRO HIGHLIGHT TYPEWRITER
const introSection = document.querySelector(".intro-highlight-section");
const introBefore = document.getElementById("intro-before");
const introNumber = document.getElementById("intro-number");
const introAfter = document.getElementById("intro-after");
const introCursor = document.getElementById("intro-cursor");

const introParts = [
    { element: introBefore, text: "Having worked with " },
    { element: introNumber, text: "3+ clients" },
    { element: introAfter, text: " as a Social Media Manager..." }
];

let introPartIndex = 0;
let introCharIndex = 0;
let introStarted = false;

function typeIntro() {
    if (!introBefore || !introNumber || !introAfter || !introCursor) return;

    const currentPart = introParts[introPartIndex];

    if (introCharIndex < currentPart.text.length) {
        currentPart.element.textContent += currentPart.text[introCharIndex];
        introCharIndex++;
        setTimeout(typeIntro, 55);
    } else if (introPartIndex < introParts.length - 1) {
        introPartIndex++;
        introCharIndex = 0;
        setTimeout(typeIntro, 55);
    }
}

function startIntroTyping() {
    if (introStarted) return;

    introStarted = true;
    introBefore.textContent = "";
    introNumber.textContent = "";
    introAfter.textContent = "";
    typeIntro();
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


// START BOTH TYPEWRITERS
document.addEventListener("DOMContentLoaded", () => {
    type();
    initServicesCarousel();

    if (!introSection || !introBefore || !introNumber || !introAfter || !introCursor) return;

    if (!("IntersectionObserver" in window)) {
        startIntroTyping();
        return;
    }

    const introObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startIntroTyping();
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.45
    });

    introObserver.observe(introSection);
});
