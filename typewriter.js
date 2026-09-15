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

// MY WORKS: independent state for each gallery; no Services carousel globals.
document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("my-works");
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const dialog = section.querySelector(".work-lightbox");
    const controllers = [];
    const dwell = 4500;
    const duration = 850;
    let modalOpen = false;

    // Draw the shared Career Highlights motif when this heading's existing reveal starts.
    const heading = section.querySelector(".my-works-heading");
    if (!motion.matches && heading.classList.contains("reveal-pending")) {
        heading.classList.add("my-works-heading--ink-ready");
        const drawFlourish = event => {
            if (event.target !== heading || event.animationName !== "section-reveal") return;
            heading.classList.add("my-works-heading--drawing");
            heading.removeEventListener("animationstart", drawFlourish);
        };
        heading.addEventListener("animationstart", drawFlourish);
        motion.addEventListener("change", event => {
            if (!event.matches) return;
            heading.classList.remove("my-works-heading--ink-ready", "my-works-heading--drawing");
            heading.removeEventListener("animationstart", drawFlourish);
        });
    }

    section.querySelectorAll(".work-carousel").forEach(carousel => {
        const track = carousel.querySelector(".work-track");
        const slides = Array.from(track.children);
        const name = document.getElementById(carousel.getAttribute("aria-labelledby")).textContent;
        const controls = document.createElement("div");
        controls.className = "work-controls";
        function button(label, text, extraClass = "") {
            const element = document.createElement("button");
            element.type = "button";
            element.className = `work-control ${extraClass}`.trim();
            element.setAttribute("aria-label", label);
            element.textContent = text;
            return element;
        }
        const previous = button(`Previous ${name} item`, "\u2190");
        const next = button(`Next ${name} item`, "\u2192");
        const rotation = button(`Pause ${name} automatic sliding`, "Pause", "work-control--rotation");
        const position = document.createElement("span");
        position.className = "work-position";
        position.setAttribute("aria-live", "off");
        position.setAttribute("aria-atomic", "true");
        controls.append(previous, position, next, rotation);
        carousel.append(controls);
        carousel.setAttribute("aria-roledescription", "carousel");
        track.setAttribute("aria-label", `${name}: use left and right arrow keys or swipe to explore`);

        let active = 0;
        let visible = false;
        let hovering = false;
        let userPaused = false;
        let animating = false;
        let timer;
        let settleTimer;
        let idleUntil = 0;
        let pointer = null;
        let suppressClickUntil = 0;
        const pausedVideos = new WeakSet();
        const requestedVideos = new WeakSet();
        const pendingVideos = new WeakSet();
        const videos = slides.map(slide => slide.querySelector("video"));
        const slots = slides.map((_, index) => relative(index, active));

        function relative(index, center) {
            const offset = (index - center + slides.length) % slides.length;
            return offset > slides.length / 2 ? offset - slides.length : offset;
        }
        function schedule(delay = dwell) {
            clearTimeout(timer);
            const keyboardFocus = carousel.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
            if (!visible || document.hidden || modalOpen || motion.matches || userPaused || hovering || pointer || animating || keyboardFocus) return;
            timer = setTimeout(() => move(1), Math.max(delay, idleUntil - performance.now()));
        }
        function canPlay(video, index) {
            return visible && !document.hidden && !modalOpen && Math.abs(slots[index]) <= 1 &&
                !pausedVideos.has(video) && (!motion.matches || (index === active && requestedVideos.has(video)));
        }
        function syncVideos() {
            videos.forEach((video, index) => {
                if (!video) return;
                const play = canPlay(video, index);
                // preload=none keeps all reels untouched until this row enters view.
                video.autoplay = play;
                if (visible && Math.abs(slots[index]) <= 1) video.preload = "metadata";
                if (!play) { video.pause(); return; }
                if (!video.paused || pendingVideos.has(video)) return;
                pendingVideos.add(video);
                video.play().then(() => {
                    if (!canPlay(video, index)) video.pause();
                }).catch(() => {
                    // Autoplay restrictions leave the explicit Play reel control available.
                }).finally(() => pendingVideos.delete(video));
            });
        }
        function paint() {
            slides.forEach((slide, index) => {
                slide.style.setProperty("--work-slot", slots[index]);
                slide.classList.toggle("work-slide--active", index === active);
                slide.classList.toggle("work-slide--side", Math.abs(slots[index]) === 1);
                slide.setAttribute("aria-hidden", String(index !== active));
                slide.inert = index !== active;
            });
            position.textContent = `${String(active + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
        }
        function finishMove() {
            if (!animating) return;
            clearTimeout(settleTimer);
            // Recycle only fully hidden cards. No cloned media and no visible loop reset.
            slides.forEach((slide, index) => {
                if (Math.abs(slots[index]) <= 1) return;
                slide.classList.add("work-slide--reset");
                slots[index] = relative(index, active);
                slide.style.setProperty("--work-slot", slots[index]);
            });
            track.offsetHeight;
            slides.forEach(slide => slide.classList.remove("work-slide--reset"));
            animating = false;
            hovering = hover.matches && slides[active].matches(":hover");
            syncVideos();
            schedule();
        }
        function move(direction, manual = false) {
            if (animating || modalOpen) return;
            clearTimeout(timer);
            if (manual) idleUntil = performance.now() + 7000;
            position.setAttribute("aria-live", manual ? "polite" : "off");
            // Keep keyboard focus on a stable element before making the old slide inert.
            if (slides[active].contains(document.activeElement)) track.focus({ preventScroll: true });
            const destination = (active + direction + slides.length) % slides.length;
            slides.forEach((slide, index) => {
                const targetSlot = relative(index, destination);
                if (Math.abs(slots[index]) > 1 && Math.abs(targetSlot) <= 1) {
                    slide.classList.add("work-slide--reset");
                    slots[index] = targetSlot + direction;
                    slide.style.setProperty("--work-slot", slots[index]);
                }
            });
            track.offsetHeight;
            slides.forEach(slide => slide.classList.remove("work-slide--reset"));
            active = destination;
            slots.forEach((slot, index) => { slots[index] = slot - direction; });
            animating = true;
            hovering = false;
            paint();
            syncVideos();
            if (motion.matches) finishMove();
            else settleTimer = setTimeout(finishMove, duration + 50);
        }

        slides.forEach((slide, index) => {
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute("aria-label", `${index + 1} of ${slides.length}`);
            slide.addEventListener("pointerenter", event => {
                if (!hover.matches || event.pointerType !== "mouse" || index !== active) return;
                hovering = true;
                clearTimeout(timer); // The reel itself keeps playing during hover.
            });
            slide.addEventListener("pointerleave", () => {
                if (index !== active || !hovering) return;
                hovering = false;
                schedule(1000);
            });
            const video = videos[index];
            if (!video) return;
            video.controls = false;
            video.muted = true;
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "work-video-toggle";
            const icon = document.createElement("i");
            icon.setAttribute("aria-hidden", "true");
            toggle.append(icon);
            function updateToggle() {
                icon.className = `fa-solid ${video.paused ? "fa-play" : "fa-pause"}`;
                toggle.setAttribute("aria-label", `${video.paused ? "Play" : "Pause"} short-form video ${index + 1}`);
            }
            toggle.addEventListener("click", () => {
                if (video.paused) {
                    pausedVideos.delete(video);
                    requestedVideos.add(video);
                } else {
                    pausedVideos.add(video);
                    requestedVideos.delete(video);
                }
                idleUntil = performance.now() + 7000;
                syncVideos();
                schedule();
            });
            video.addEventListener("play", updateToggle);
            video.addEventListener("pause", updateToggle);
            updateToggle();
            slide.append(toggle);
        });
        previous.addEventListener("click", () => move(-1, true));
        next.addEventListener("click", () => move(1, true));
        rotation.addEventListener("click", () => {
            userPaused = !userPaused;
            rotation.textContent = userPaused ? "Resume" : "Pause";
            rotation.setAttribute("aria-label", `${userPaused ? "Resume" : "Pause"} ${name} automatic sliding`);
            schedule();
        });
        carousel.addEventListener("focusin", () => schedule());
        carousel.addEventListener("focusout", () => queueMicrotask(() => schedule()));
        carousel.addEventListener("keydown", event => {
            if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault();
            move(event.key === "ArrowRight" ? 1 : -1, true);
        });
        track.addEventListener("transitionend", event => {
            if (event.target === slides[active] && event.propertyName === "transform") finishMove();
        });
        track.addEventListener("dragstart", event => event.preventDefault());
        track.addEventListener("pointerdown", event => {
            if (!event.isPrimary || event.button !== 0 || event.target.closest("button")) return;
            pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
            clearTimeout(timer);
        });
        track.addEventListener("pointermove", event => {
            if (!pointer || pointer.id !== event.pointerId) return;
            const dx = event.clientX - pointer.x;
            const dy = event.clientY - pointer.y;
            if (!pointer.horizontal && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                pointer.horizontal = true;
                track.setPointerCapture(event.pointerId);
            }
        });
        function releasePointer(event) {
            if (!pointer || pointer.id !== event.pointerId) return;
            const gesture = pointer;
            pointer = null;
            if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
            idleUntil = performance.now() + 7000;
            if (gesture.horizontal) {
                suppressClickUntil = performance.now() + 400;
                const dx = event.clientX - gesture.x;
                if (event.type === "pointerup" && Math.abs(dx) > Math.min(60, track.clientWidth * .14)) move(dx < 0 ? 1 : -1, true);
            }
            schedule();
        }
        track.addEventListener("pointerup", releasePointer);
        track.addEventListener("pointercancel", releasePointer);
        track.addEventListener("lostpointercapture", event => {
            // Touch starts with implicit capture on the image/video. Its bubbled
            // release during handoff to the track must not end the swipe early.
            if (event.target === track) releasePointer(event);
        });
        track.addEventListener("pointerleave", event => {
            if (pointer && !pointer.horizontal) releasePointer(event);
        });
        track.addEventListener("click", event => {
            if (performance.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);

        function refresh() {
            rotation.hidden = motion.matches;
            if (motion.matches) finishMove();
            syncVideos();
            schedule();
        }
        paint();
        carousel.classList.add("work-carousel--ready");
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .1;
                refresh();
            }, { threshold: [0, .1] });
            observer.observe(track);
        } else {
            const checkVisibility = () => {
                const rect = track.getBoundingClientRect();
                visible = rect.bottom > 0 && rect.top < window.innerHeight;
                refresh();
            };
            window.addEventListener("scroll", checkVisibility, { passive: true, capture: true });
            window.addEventListener("resize", checkVisibility);
            checkVisibility();
        }
        controllers.push(refresh);
        refresh();
    });

    const refreshAll = () => controllers.forEach(refresh => refresh());
    document.addEventListener("visibilitychange", refreshAll);
    motion.addEventListener("change", refreshAll);

    // Native dialog supplies Escape, modal focus containment, and inert background.
    // The original image links remain useful if dialog support or scripting is absent.
    if (!dialog || typeof dialog.showModal !== "function") return;
    const expanded = dialog.querySelector(".work-lightbox-image");
    const viewport = dialog.querySelector(".work-lightbox-viewport");
    const zoom = dialog.querySelector(".work-lightbox-zoom");
    let opener;
    let previousOverflow;
    section.querySelectorAll(".work-expand").forEach(link => {
        link.setAttribute("aria-haspopup", "dialog");
        link.addEventListener("click", event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            const original = link.querySelector("img");
            expanded.src = original.src;
            expanded.alt = original.alt;
            dialog.querySelector("#work-lightbox-description").textContent = original.alt;
            opener = link;
            previousOverflow = [document.documentElement.style.overflow, document.body.style.overflow];
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
            modalOpen = true;
            dialog.showModal();
            refreshAll();
        });
    });
    zoom.addEventListener("click", () => {
        const zoomed = viewport.classList.toggle("work-lightbox-viewport--zoomed");
        zoom.textContent = zoomed ? "Fit image" : "Zoom in";
        zoom.setAttribute("aria-pressed", String(zoomed));
        viewport.scrollTo(0, 0);
        if (zoomed) viewport.focus({ preventScroll: true });
    });
    dialog.querySelector(".work-lightbox-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
        document.documentElement.style.overflow = previousOverflow[0];
        document.body.style.overflow = previousOverflow[1];
        modalOpen = false;
        viewport.classList.remove("work-lightbox-viewport--zoomed");
        zoom.textContent = "Zoom in";
        zoom.setAttribute("aria-pressed", "false");
        viewport.scrollTo(0, 0);
        if (opener) opener.focus({ preventScroll: true });
        refreshAll();
    });
});
