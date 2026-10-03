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


// Use CSS viewport height: percentage IntersectionObserver margins resolve against width.
function readingZoneOptions() {
    const navHeight = Math.ceil(document.querySelector("nav").getBoundingClientRect().bottom);
    const bottomInset = Math.round(window.innerHeight * .16);
    return { threshold: 0, rootMargin: `-${navHeight}px 0px -${bottomInset}px 0px` };
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
    let checkFrame;
    const initialScrollY = window.scrollY;
    const scrollTolerance = 3;
    let hasPageProgressed = initialScrollY > scrollTolerance;
    const items = Array.from(section.querySelectorAll(".career-highlights > li"));
    const duration = 1800;

    counters.forEach(({ element }) => { element.textContent = "0"; });

    function revealHighlights() {
        entranceElements.forEach(element => element.classList.add("aos-animate"));
        section.classList.remove("career-highlights--waiting");
    }

    function startCounters() {
        if (started) return;
        started = true;
        stopMonitoring();
        revealHighlights();
        section.classList.add("career-highlights--drawing");
        const startTime = performance.now();

        function updateCounters(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            counters.forEach(({ element, target }) => {
                // A target of one has no intermediate integers; resolve it at 800ms.
                const countProgress = target === 1 ? Math.min((now - startTime) / 800, 1) : progress;
                element.textContent = String(Math.floor(countProgress * target));
            });
            if (progress < 1) frameId = requestAnimationFrame(updateCounters);
        }

        frameId = requestAnimationFrame(updateCounters);
    }

    function stopMonitoring() {
        if (observer) observer.disconnect();
        window.removeEventListener("scroll", queueCareerCheck);
        window.removeEventListener("resize", observeHighlights);
        cancelAnimationFrame(checkFrame);
        checkFrame = null;
    }

    function observeHighlights() {
        if (started) return;
        if (observer) observer.disconnect();
        observer = new IntersectionObserver(entries => {
            if (hasPageProgressed && entries.some(entry => entry.isIntersecting)) startCounters();
        }, readingZoneOptions());
        // Individual items can enter the reading zone even in a short mobile viewport.
        items.forEach(item => observer.observe(item));
        queueCareerCheck();
    }

    function evaluateCareerHighlights() {
        if (started) return;
        if (Math.abs(window.scrollY - initialScrollY) > scrollTolerance) hasPageProgressed = true;
        if (!hasPageProgressed) return;

        // Match readingZoneOptions(), including the rendered navbar and bottom inset.
        const navBottom = Math.ceil(document.querySelector("nav").getBoundingClientRect().bottom);
        const readingBottom = window.innerHeight - Math.round(window.innerHeight * .16);
        const alreadyPassed = section.getBoundingClientRect().bottom <= navBottom;
        const inReadingZone = readingBottom > navBottom && items.some(item => {
            const rect = item.getBoundingClientRect();
            return rect.bottom > navBottom && rect.top < readingBottom;
        });
        // Catch jumps that skip every intersecting frame, as well as normal entry.
        if (alreadyPassed || inReadingZone) startCounters();
    }

    function queueCareerCheck() {
        if (checkFrame != null || started) return;
        checkFrame = requestAnimationFrame(() => {
            checkFrame = null;
            evaluateCareerHighlights();
        });
    }

    // Monitor immediately; untouched Home still waits for actual page movement.
    window.addEventListener("scroll", queueCareerCheck, { passive: true });
    window.addEventListener("resize", observeHighlights);
    observeHighlights();

    // Also honor a preference change while waiting or counting, without restarting.
    motionQuery.addEventListener("change", event => {
        if (!event.matches) return;
        started = true;
        stopMonitoring();
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
    let visibilityFrame;
    let nextLetter = 0;
    let titleStarted = false;
    const container = text.closest(".about-container");
    const services = document.getElementById("services");

    function removeListeners() {
        window.removeEventListener("scroll", queueVisibilityCheck, true);
        window.removeEventListener("resize", queueVisibilityCheck);
        window.removeEventListener("load", queueVisibilityCheck);
        container.removeEventListener("transitionend", queueVisibilityCheck);
        clearTimeout(visibilityTimer);
        cancelAnimationFrame(visibilityFrame);
    }

    function finish() {
        started = true;
        titleStarted = true;
        removeListeners();
        cancelAnimationFrame(frame);
        letters.forEach(({ element }) => element.classList.remove("about-type-pending"));
        text.classList.remove("about-text--typing", "about-text--title-animated");
    }

    function isInReadingPosition() {
        const rect = text.getBoundingClientRect();
        const navBottom = document.querySelector("nav").getBoundingClientRect().bottom + 16;
        const viewportBottom = window.innerHeight - 16;
        const readingLine = navBottom + Math.max(0, viewportBottom - navBottom) * .65;
        // The beginning of the text has reached the reading area below the navbar.
        // Neither the portrait nor a whole paragraph needs to fit on screen.
        return rect.top <= readingLine && rect.bottom > navBottom;
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
        if (!started && (text.getBoundingClientRect().bottom <= navBottom + 16 ||
            (services && services.getBoundingClientRect().top <= navBottom + 16))) startTyping();
        if (!isInReadingPosition()) return;
        // Preserve fade-up before typing, even if AOS missed its scroll threshold.
        container.classList.add("aos-animate");
        // Let scrolling settle so a brief pass through the section does not trigger it.
        visibilityTimer = setTimeout(() => {
            if (!isInReadingPosition()) return;
            startTyping();
            // Save the title's one-time hop for when About Me is actually in view.
            titleStarted = true;
            text.classList.add("about-text--title-animated");
            removeListeners();
        }, 180);
    }

    function queueVisibilityCheck() {
        if (visibilityFrame != null || (started && titleStarted)) return;
        visibilityFrame = requestAnimationFrame(() => {
            visibilityFrame = null;
            checkVisibility();
        });
    }

    window.addEventListener("scroll", queueVisibilityCheck, { passive: true, capture: true });
    window.addEventListener("resize", queueVisibilityCheck);
    window.addEventListener("load", queueVisibilityCheck, { once: true });
    container.addEventListener("transitionend", queueVisibilityCheck);
    motion.addEventListener("change", event => { if (event.matches) finish(); });
    checkVisibility();
}

function finishScrollReveal(element) {
    element.classList.remove("reveal-pending", "reveal-entering");
    element.classList.add("reveal-complete");
}

// Reveal within the area below the navbar and above the bottom 16% of the viewport.
// Observe the resting boxes: CSS translate does not move them until the reveal starts.
function initSectionReveals() {
    const elements = Array.from(document.querySelectorAll("[data-scroll-reveal]"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll(".service-box, .skill-box").forEach(card => card.classList.add("hover-ready"));
    if (motion.matches || !("IntersectionObserver" in window) || !CSS.supports("animation-name", "section-reveal")) return;

    const timers = new Map();
    let observer;
    let resizeFrame;
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
        observer = new IntersectionObserver(entries => {
            const staggers = new Map();
            entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top ||
                a.boundingClientRect.left - b.boundingClientRect.left).forEach(entry => {
                const element = entry.target;
                if (element.classList.contains("reveal-complete") || element.classList.contains("reveal-entering")) {
                    observer.unobserve(element);
                    return;
                }
                if (!entry.isIntersecting) {
                    clearTimeout(timers.get(element));
                    timers.delete(element);
                    return;
                }
                if (timers.has(element)) return;
                const group = element.closest(".work-category, section");
                const stagger = staggers.get(group) || 0;
                staggers.set(group, stagger + 1);
                const delay = 120 + Math.min(stagger, 3) * 70;
                timers.set(element, setTimeout(() => {
                    timers.delete(element);
                    observer.unobserve(element);
                    if (!element.classList.contains("reveal-complete")) element.classList.add("reveal-entering");
                }, delay));
            });
        }, readingZoneOptions());
        elements.filter(element => !element.classList.contains("reveal-complete") && !element.classList.contains("reveal-entering"))
            .forEach(element => observer.observe(element));
    }

    function queueObserve() {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(observe);
    }

    observe();
    window.addEventListener("resize", queueObserve);
    const navObserver = "ResizeObserver" in window ? new ResizeObserver(queueObserve) : null;
    navObserver?.observe(document.querySelector("nav"));
    motion.addEventListener("change", event => {
        if (!event.matches) return;
        observer.disconnect();
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
        cancelAnimationFrame(resizeFrame);
        navObserver?.disconnect();
        window.removeEventListener("resize", queueObserve);
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


// One stable navbar button owns the mobile disclosure and its accessibility state.
function initMobileNavigation() {
    const nav = document.querySelector("nav");
    const button = nav.querySelector(".hamburg");
    const dropdown = document.getElementById("mobile-navigation");
    const icon = button.querySelector("i");
    const mobile = window.matchMedia("(max-width: 1024px)");
    let open = false;

    function setOpen(value) {
        open = value && mobile.matches;
        if (!open && dropdown.contains(document.activeElement)) {
            const href = document.activeElement.getAttribute("href");
            const desktopLink = Array.from(nav.querySelectorAll(".links a"))
                .find(link => link.getAttribute("href") === href);
            (mobile.matches ? button : desktopLink)?.focus({ preventScroll: true });
        }
        nav.classList.toggle("nav--open", open);
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", `${open ? "Close" : "Open"} navigation menu`);
        icon.className = `fa-solid ${open ? "fa-xmark" : "fa-bars"}`;
        dropdown.inert = !open;
        dropdown.setAttribute("aria-hidden", String(!open));
    }

    button.addEventListener("click", () => setOpen(!open));
    dropdown.addEventListener("click", event => {
        if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        setOpen(false);
        button.focus({ preventScroll: true });
    });
    document.addEventListener("pointerdown", event => {
        if (open && !nav.contains(event.target)) setOpen(false);
    });
    mobile.addEventListener("change", () => setOpen(false));
    setOpen(false);
}

// Shared positioning for navbar links, the hero CTA, and native URL fragments.
function initInternalNavigation() {
    const nav = document.querySelector("nav");
    const sections = Array.from(document.querySelectorAll(".portfolio-section[id]"));
    const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const mobile = window.matchMedia("(max-width: 1024px)");
    const presentationViewport = window.matchMedia("(min-width: 1101px) and (max-height: 1150px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const gap = 24;
    const initialHash = window.location.hash;
    let initialPending = Boolean(resolveSection(initialHash));
    let resizeFrame;
    let activeFrame;
    let activeHash;
    let navigationIntent;
    // A direct fragment load should start at its destination, not animate from Home.
    if (initialPending) document.documentElement.style.scrollBehavior = "auto";

    function resolveSection(hash) {
        if (!hash || hash === "#") return null;
        try {
            const section = document.getElementById(decodeURIComponent(hash.slice(1)));
            return sections.includes(section) ? section : null;
        } catch { return null; }
    }

    function visualAnchor(section) {
        // The existing mobile About layout stacks the portrait above the text.
        return (mobile.matches && section.querySelector("[data-scroll-anchor-mobile]")) ||
            section.querySelector("[data-scroll-anchor]") || section;
    }

    function layoutTop(element) {
        // Resting layout coordinates ignore AOS transforms and reveal translations.
        // Measuring an animated bounding rect would overshoot on a first/repeated click.
        let top = 0;
        for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
        // Native fragment navigation can also scroll the existing overflow:auto body.
        // Account for ancestor scrolling, just as rect.top + window.scrollY would.
        for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
            top -= parent.scrollTop;
        }
        return top;
    }

    function manualReadingDepth(navHeight) {
        return Math.min(280, Math.max(120, (window.innerHeight - navHeight) * .22));
    }

    function destinationOffset(section) {
        const navHeight = nav.getBoundingClientRect().height;
        let landingGap = gap;
        if (presentationViewport.matches && (section.id === "about" || section.id === "my-works" || section.id === "services")) {
            const extraGap = Math.min(80, Math.max(40, (window.innerHeight - navHeight) * .08));
            // Leave the anchor above the unchanged reading line when intent releases.
            landingGap = Math.min(gap + extraGap, manualReadingDepth(navHeight) - 16);
        }
        return navHeight + landingGap;
    }

    function destination(section) {
        return Math.max(0, layoutTop(visualAnchor(section)) - destinationOffset(section));
    }

    function refreshNativeOffsets() {
        sections.forEach(section => {
            const offset = destinationOffset(section);
            const inset = layoutTop(visualAnchor(section)) - layoutTop(section);
            section.style.scrollMarginTop = `${offset - inset}px`;
        });
    }

    function setActiveSection(hash) {
        if (hash === activeHash) return;
        activeHash = hash;
        navLinks.forEach(link => {
            const active = link.getAttribute("href") === hash;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
        });
    }

    function reachableDestination(section) {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        return Math.min(section ? destination(section) : 0, maxScroll);
    }

    function updateCurrentSection() {
        activeFrame = null;
        if (navigationIntent) {
            const top = reachableDestination(navigationIntent.section);
            // Keep the existing alignment if a resize or late layout shift moves it.
            if (Math.abs(top - navigationIntent.top) > 1) {
                navigationIntent.top = top;
                window.scrollTo({ top, behavior: motion.matches ? "instant" : "smooth" });
            }
            if (Math.abs(window.scrollY - top) > 2) {
                queueCurrentSection();
                return; // The clicked destination owns the indicator until arrival.
            }
            navigationIntent = null;
        }
        const navHeight = nav.getBoundingClientRect().height;
        const readingDepth = manualReadingDepth(navHeight);
        const probe = window.scrollY + navHeight + readingDepth;
        let hash = "#"; // Hero and Career Highlights both belong to Home.
        sections.forEach(section => {
            // Allow only subpixel scroll rounding at the same anchor used by clicks.
            if (layoutTop(visualAnchor(section)) <= probe + 1) hash = `#${section.id}`;
        });
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0 && window.scrollY >= maxScroll - 2) hash = "#contact-me";
        setActiveSection(hash);
    }

    function queueCurrentSection() {
        if (activeFrame == null) activeFrame = requestAnimationFrame(updateCurrentSection);
    }
    window.addEventListener("scroll", event => {
        if (event.target === document || event.target === document.body) queueCurrentSection();
    }, { passive: true, capture: true });

    function interruptNavigation(event) {
        if (!navigationIntent || event.defaultPrevented) return;
        if (event.type === "keydown") {
            if (event.ctrlKey || event.metaKey || event.altKey ||
                !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) return;
            const target = event.target;
            if (target.isContentEditable || target.closest("input, textarea, select, video, audio") ||
                (event.key === " " && target.closest("button, [role='button']"))) return;
        }
        navigationIntent = null;
        // Stop the native animation so it cannot carry on after the user's gesture.
        window.scrollTo({ top: window.scrollY, behavior: "instant" });
        queueCurrentSection();
    }
    ["wheel", "touchstart", "touchmove"].forEach(type => {
        window.addEventListener(type, interruptNavigation, { passive: true });
    });
    window.addEventListener("keydown", interruptNavigation);

    document.addEventListener("click", event => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
            event.shiftKey || event.altKey || link.hasAttribute("download") ||
            (link.target && link.target !== "_self")) return;
        const hash = link.getAttribute("href");
        const section = resolveSection(hash);
        if (hash !== "#" && !section) return;
        event.preventDefault();
        initialPending = false;
        refreshNativeOffsets();
        const nextHash = hash === "#" ? "" : hash;
        if (window.location.hash !== nextHash) {
            // pushState preserves real fragment URLs without a second native jump.
            history.pushState(null, "", nextHash || window.location.pathname + window.location.search);
        }
        if (!section) document.body.scrollTop = 0;
        navigationIntent = navLinks.includes(link) ? { section, top: reachableDestination(section) } : null;
        if (navigationIntent) setActiveSection(section ? `#${section.id}` : "#");
        window.scrollTo({ top: section ? destination(section) : 0, behavior: motion.matches ? "instant" : "smooth" });
        queueCurrentSection();
    });

    window.addEventListener("hashchange", () => {
        const section = resolveSection(window.location.hash);
        if (window.location.hash && !section) return;
        initialPending = false;
        navigationIntent = null;
        refreshNativeOffsets();
        // Back/Forward may restore an old page offset after native body scrolling.
        // Correct in the same event, before paint; clicks use pushState and skip this.
        if (!section) document.body.scrollTop = 0;
        window.scrollTo({ top: section ? destination(section) : 0, behavior: "instant" });
        queueCurrentSection();
    });

    function queueOffsets() {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            refreshNativeOffsets();
            queueCurrentSection();
        });
    }
    window.addEventListener("resize", queueOffsets);
    window.addEventListener("orientationchange", queueOffsets);
    window.addEventListener("pageshow", event => {
        if (event.persisted) navigationIntent = null;
        queueOffsets();
    });
    mobile.addEventListener("change", queueOffsets);
    // Images, fonts, responsive content and the Calendly embed can move anchors.
    document.addEventListener("load", queueOffsets, true);
    if (document.fonts) {
        document.fonts.ready.then(queueOffsets);
        document.fonts.addEventListener("loadingdone", queueOffsets);
    }
    if ("ResizeObserver" in window) {
        const layoutObserver = new ResizeObserver(queueOffsets);
        [nav, document.body, ...document.querySelectorAll("section, [data-scroll-anchor], [data-scroll-anchor-mobile]")]
            .forEach(element => layoutObserver.observe(element));
    }

    // Run before the browser's initial fragment positioning. Native hash changes
    // and history traversal can then use the same measured, animation-free inset.
    refreshNativeOffsets();
    updateCurrentSection();
    const cancelInitial = () => { initialPending = false; };
    const intentEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
    intentEvents.forEach(type => window.addEventListener(type, cancelInitial, { once: true, passive: true }));
    window.addEventListener("load", async () => {
        if (document.fonts) await document.fonts.ready;
        refreshNativeOffsets();
        const section = resolveSection(initialHash);
        if (initialPending && section && window.location.hash === initialHash) {
            // Correct only a real late layout shift; never replay a smooth scroll on load.
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const top = Math.min(destination(section), maxScroll);
            if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" });
        }
        document.documentElement.style.removeProperty("scroll-behavior");
        intentEvents.forEach(type => window.removeEventListener(type, cancelInitial));
        updateCurrentSection();
    }, { once: true });
}

// This script is at the end of body: the anchors already exist, before fragment scrolling.
initInternalNavigation();

// CONTACT: independent one-time reveals and a lazy, public Calendly inline embed.
function initContactSection() {
    const section = document.getElementById("contact-me");
    if (!section || section.dataset.contactInitialized) return;
    section.dataset.contactInitialized = "true";

    function initContactEmailCopy() {
        const button = section.querySelector("[data-copy-email]");
        const stage = button.closest(".contact-email-stage");
        const popover = stage.querySelector(".contact-copy-popover");
        const status = stage.querySelector(".contact-copy-status");
        let resetTimer;
        let copyRequest = 0;

        function copyWithSelection(value) {
            const previousFocus = document.activeElement;
            const field = document.createElement("textarea");
            field.value = value;
            field.readOnly = true;
            field.tabIndex = -1;
            field.setAttribute("aria-hidden", "true");
            field.style.cssText = "position:fixed;top:0;left:-9999px;width:1px;height:1px;padding:0;border:0;font-size:16px;";
            section.append(field);
            try {
                field.focus({ preventScroll: true });
                field.select();
                field.setSelectionRange(0, value.length);
                return document.execCommand("copy");
            } finally {
                field.remove();
                previousFocus?.focus({ preventScroll: true });
            }
        }

        button.addEventListener("click", async () => {
            const request = ++copyRequest;
            const value = button.dataset.copyEmail;
            clearTimeout(resetTimer);
            status.textContent = "";
            let copied = false;
            try {
                if (typeof navigator.clipboard?.writeText !== "function") throw new Error("Clipboard unavailable");
                await navigator.clipboard.writeText(value);
                copied = true;
            } catch {
                // A late rejection must not overwrite a newer copy result or steal focus.
                if (request !== copyRequest) return;
                try { copied = copyWithSelection(value); } catch { /* Show the inline failure message below. */ }
            }
            if (request !== copyRequest) return;
            stage.dataset.copyState = copied ? "success" : "error";
            const message = copied ? "Copied to clipboard" : "Couldn't copy";
            popover.textContent = message;
            status.textContent = message;
            resetTimer = setTimeout(() => {
                stage.dataset.copyState = "idle";
                popover.textContent = "Copy to clipboard";
                status.textContent = "";
            }, 1800);
        });
        // Without scripting the address stays readable, with no nonfunctional copy hint.
        button.disabled = false;
    }
    initContactEmailCopy();

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const groups = Array.from(section.querySelectorAll("[data-contact-reveal]"));
    const pending = new Set(groups);
    let revealObserver;

    function stopReveals() {
        revealObserver?.disconnect();
        window.removeEventListener("resize", observeReveals);
    }

    function revealGroup(group, immediate = false) {
        group.classList.add("is-revealed");
        if (immediate) group.classList.add("is-settled");
        pending.delete(group);
        revealObserver?.unobserve(group);
        if (!pending.size) stopReveals();
    }

    function observeReveals() {
        revealObserver?.disconnect();
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) revealGroup(entry.target);
            });
        }, readingZoneOptions());
        pending.forEach(group => revealObserver.observe(group));
    }

    if (!motion.matches && "IntersectionObserver" in window) {
        observeReveals();
        section.classList.add("contact-reveal-ready");
        window.addEventListener("resize", observeReveals);
        section.addEventListener("focusin", event => {
            const group = event.target.closest("[data-contact-reveal]");
            if (group) revealGroup(group, true);
        });
        motion.addEventListener("change", event => {
            if (!event.matches) return;
            stopReveals();
            pending.clear();
            // Removing the gate also finishes any sequence currently in progress.
            section.classList.remove("contact-reveal-ready");
        });
    }

    const host = section.querySelector("#contact-calendly");
    const card = section.querySelector(".contact-scheduler-card");
    const status = section.querySelector(".contact-scheduler-status");
    const schedulingLink = section.querySelector(".contact-scheduler-link");
    const scriptURL = "https://assets.calendly.com/assets/external/widget.js";
    let scriptPromise;
    let embedPromise;

    // Reserve the scheduler's resting dimensions before it approaches the viewport.
    host.hidden = false;
    status.hidden = false;
    status.textContent = "Loading scheduler…";
    card.dataset.state = "loading";

    function loadCalendlyScript() {
        if (typeof window.Calendly?.initInlineWidget === "function") return Promise.resolve(window.Calendly);
        if (scriptPromise) return scriptPromise;
        scriptPromise = new Promise((resolve, reject) => {
            const existing = Array.from(document.scripts).find(script => script.src === scriptURL);
            const script = existing || document.createElement("script");
            let timeout;

            function finish(error) {
                clearTimeout(timeout);
                script.removeEventListener("load", onLoad);
                script.removeEventListener("error", onError);
                if (error) reject(error);
                else resolve(window.Calendly);
            }
            function onLoad() {
                finish(typeof window.Calendly?.initInlineWidget === "function"
                    ? null : new Error("Calendly widget unavailable"));
            }
            function onError() { finish(new Error("Calendly script could not load")); }

            script.addEventListener("load", onLoad, { once: true });
            script.addEventListener("error", onError, { once: true });
            timeout = setTimeout(onError, 15000);
            if (!existing) {
                script.src = scriptURL;
                script.async = true;
                document.head.append(script);
            }
        });
        return scriptPromise;
    }

    function initCalendlyEmbed() {
        if (embedPromise) return embedPromise;
        embedPromise = loadCalendlyScript().then(calendly => {
            // A custom host avoids Calendly's automatic initialization scanner.
            if (!host.querySelector("iframe")) {
                calendly.initInlineWidget({
                    url: schedulingLink.href,
                    parentElement: host
                });
            }
            const iframe = host.querySelector("iframe");
            if (!iframe) throw new Error("Calendly embed unavailable");
            iframe.title = "Schedule a 30-minute meeting with Apple Balbarino";
            // Calendly supplies its own loading UI from here. This is not a booking confirmation.
            status.hidden = true;
            card.dataset.state = "ready";
        }).catch(() => {
            host.hidden = true;
            status.hidden = false;
            status.textContent = "The scheduler couldn't load. You can still choose a time on Calendly below.";
            card.dataset.state = "failed";
        });
        return embedPromise;
    }

    if ("IntersectionObserver" in window) {
        const preloadObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            preloadObserver.disconnect();
            initCalendlyEmbed();
        }, { rootMargin: "600px 0px", threshold: 0 });
        preloadObserver.observe(card);
    } else {
        initCalendlyEmbed();
    }
}

// One native screenshot viewer for both Content Management and Results.
// Binding is optional: every trigger remains a working original-image link.
function createScreenshotViewer(dialog, onOpenChange) {
    if (!dialog || typeof dialog.showModal !== "function") return null;
    const content = dialog.querySelector(".work-lightbox-content");
    const expanded = dialog.querySelector(".work-lightbox-image");
    const viewport = dialog.querySelector(".work-lightbox-viewport");
    const zoom = dialog.querySelector(".work-lightbox-zoom");
    const title = dialog.querySelector("h3");
    const description = dialog.querySelector("#work-lightbox-description");
    let opener, previousOverflow;

    function updateFit() {
        if (!dialog.open) return;
        const zoomed = viewport.classList.contains("work-lightbox-viewport--zoomed");
        let inset = 0;
        if (!zoomed && !dialog.classList.contains("work-lightbox--portrait") && expanded.naturalWidth && expanded.naturalHeight) {
            const box = expanded.getBoundingClientRect();
            inset = Math.max(0, (box.width - Math.min(box.width, box.height * expanded.naturalWidth / expanded.naturalHeight)) / 2);
        }
        content.style.setProperty("--work-lightbox-fit-inset", `${inset}px`);
        const style = getComputedStyle(dialog);
        const available = dialog.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) -
            dialog.querySelector(".work-lightbox-toolbar").offsetHeight - description.offsetHeight - parseFloat(getComputedStyle(content).gap) * 2;
        content.style.setProperty("--work-lightbox-fit-height", `${Math.max(80, available)}px`);
        content.style.setProperty("--work-lightbox-natural-width", `${expanded.naturalWidth || 1010}px`);
    }
    expanded.addEventListener("load", updateFit);
    const resize = window.ResizeObserver ? new ResizeObserver(updateFit) : null;
    window.addEventListener("resize", updateFit, { passive: true });
    zoom.addEventListener("click", () => {
        const zoomed = viewport.classList.toggle("work-lightbox-viewport--zoomed");
        zoom.textContent = zoomed ? "Fit image" : "Zoom in";
        zoom.setAttribute("aria-pressed", String(zoomed));
        viewport.scrollTo(0, 0);
        updateFit();
        if (zoomed) viewport.focus({ preventScroll: true });
    });
    dialog.querySelector(".work-lightbox-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
        resize?.disconnect();
        if (previousOverflow) {
            document.documentElement.style.overflow = previousOverflow[0];
            document.body.style.overflow = previousOverflow[1];
        }
        viewport.classList.remove("work-lightbox-viewport--zoomed");
        zoom.textContent = "Zoom in";
        zoom.setAttribute("aria-pressed", "false");
        viewport.scrollTo(0, 0);
        // Resizing can switch between the desktop story and the complete pairs.
        let target = opener;
        if (target && !target.getClientRects().length) {
            target = Array.from(document.querySelectorAll(".results-phone-link")).find(link => link.href === opener.href && link.getClientRects().length);
        }
        target?.focus({ preventScroll: true });
        expanded.removeAttribute("src");
        onOpenChange(false);
    });
    return {
        bind(link, evidence) {
            link.setAttribute("aria-haspopup", "dialog");
            link.setAttribute("role", "button");
            link.addEventListener("keydown", event => {
                if (event.key === " ") { event.preventDefault(); if (!event.repeat) link.click(); }
            });
            link.addEventListener("click", event => {
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
                const item = evidence();
                expanded.src = item.src;
                expanded.alt = item.alt;
                expanded.width = item.portrait ? 1010 : 2560;
                expanded.height = item.portrait ? 2000 : 1440;
                title.textContent = item.title;
                description.textContent = item.alt;
                dialog.classList.toggle("work-lightbox--portrait", Boolean(item.portrait));
                // Only suppress native navigation after the modal has actually opened.
                try { dialog.showModal(); } catch { return; }
                event.preventDefault();
                opener = link;
                previousOverflow = [document.documentElement.style.overflow, document.body.style.overflow];
                document.documentElement.style.overflow = "hidden";
                document.body.style.overflow = "hidden";
                onOpenChange(true);
                updateFit();
                resize?.observe(dialog);
                resize?.observe(expanded);
            });
        }
    };
}

// RESULTS: complete native pairs enhanced only when the whole sticky composition fits.
// Input-scheduled transitions share one selection controller; navigation stays with My Works.
function initResultsEvidence() {
    const section = document.getElementById("results-in-numbers");
    if (!section) return;
    const baseline = section.querySelector(".results-pairs");
    const intro = section.querySelector(".results-intro");
    const pairs = Array.from(baseline.children);
    const status = section.querySelector(".results-status");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    // Native pairs remain available if any essential enhancement primitive is absent.
    if (!Element.prototype.animate || !window.ResizeObserver || !window.IntersectionObserver ||
        !CSS.supports("overflow-x", "clip") || !CSS.supports("clip-path", "url(#results-screen-clip)") ||
        !("inert" in HTMLElement.prototype)) return;

    const number = index => String(index + 1).padStart(2, "0");
    const data = pairs.map(pair => ({
        card: pair.querySelector(".results-card"),
        title: pair.querySelector(".results-card-title").textContent,
        metric: pair.querySelector(".results-card-metric").textContent,
        unit: pair.querySelector(".results-card-unit")?.textContent || "",
        caption: pair.querySelector("[data-results-caption]").textContent,
        image: pair.querySelector("img"),
        link: pair.querySelector("a")
    }));
    const total = String(data.length).padStart(2, "0");
    const story = document.createElement("div");
    story.className = "results-story";
    story.hidden = true;
    story.innerHTML = `
      <div class="results-stage" role="region" aria-label="Performance results" aria-roledescription="carousel">
       <div class="results-composition">
        <div class="results-entrance" aria-hidden="true"><div class="results-hover">
          <div class="results-stack">
            <div class="results-back results-back--far" aria-hidden="true"></div>
            <div class="results-back results-back--near" aria-hidden="true"></div>
            <div class="results-deck"></div>
          </div>
          <div class="results-next" aria-hidden="true"></div>
        </div></div>
        <figure class="results-feature">
          <a class="results-phone-link results-phone-stage is-unavailable" href="phone1.webp">
            <img class="results-frame" width="1010" height="2000" alt="" aria-hidden="true">
            <img class="results-screen" width="1010" height="2000" alt="" aria-hidden="true">
            <img class="results-screen" width="1010" height="2000" alt="" aria-hidden="true">
            <span class="results-loading" hidden></span>
            <span class="results-zoom-cue" aria-hidden="true">View full screenshot</span>
          </a>
          <div class="results-error" hidden><p>Evidence unavailable. Open the original or try again.</p><a data-results-error-original>View full screenshot</a><button type="button">Retry screenshot</button></div>
          <figcaption class="results-caption">
            <div class="results-controls">
              <button type="button" data-results-previous aria-label="Previous result" aria-controls="results-active-deck"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>
              <div class="results-caption-copy"></div>
              <button type="button" data-results-next aria-label="Next result" aria-controls="results-active-deck"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
            </div>
          </figcaption>
        </figure>
       </div>
      </div>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;pointer-events:none">
        <defs><clipPath id="results-screen-clip" clipPathUnits="objectBoundingBox">
          <path d="M .151485 .03 H .255446 V .0385 C .255446 .05258 .278497 .064 .307 .064 H .69505 C .723484 .064 .746535 .05258 .746535 .0385 V .03 H .848515 C .893354 .03 .929703 .048356 .929703 .071 V .93 C .929703 .952644 .893354 .971 .848515 .971 H .151485 C .106646 .971 .070297 .952644 .070297 .93 V .071 C .070297 .048356 .106646 .03 .151485 .03 Z" />
        </clipPath></defs>
      </svg>`;
    baseline.before(story);
    const stage = story.querySelector(".results-stage");
    const composition = story.querySelector(".results-composition");
    const deck = story.querySelector(".results-deck");
    deck.id = "results-active-deck";
    const entrance = story.querySelector(".results-entrance");
    const feature = story.querySelector(".results-feature");
    const phone = story.querySelector(".results-phone-stage");
    const frame = story.querySelector(".results-frame");
    const screens = Array.from(story.querySelectorAll(".results-screen"));
    const far = story.querySelector(".results-back--far");
    const near = story.querySelector(".results-back--near");
    const summary = story.querySelector(".results-next");
    const captions = story.querySelector(".results-caption-copy");
    const original = phone;
    const previous = story.querySelector("[data-results-previous]");
    const next = story.querySelector("[data-results-next]");
    const loading = story.querySelector(".results-loading");
    const error = story.querySelector(".results-error");
    // Keep retry outside the native image link, in the reserved phone footprint.
    phone.after(error);
    const cards = data.map((item, index) => {
        const card = item.card.cloneNode(true);
        card.removeAttribute("data-results-card");
        card.querySelector("h3").id = `results-active-title-${index + 1}`;
        card.setAttribute("role", "group");
        card.setAttribute("aria-roledescription", "slide");
        card.setAttribute("aria-label", `Result ${index + 1} of ${data.length}`);
        card.setAttribute("aria-hidden", "true");
        card.inert = true;
        deck.append(card);
        const caption = document.createElement("span");
        const count = document.createElement("span");
        count.dataset.resultsCount = "";
        count.textContent = `${number(index)} / ${total}`;
        const captionTitle = document.createElement("span");
        captionTitle.textContent = item.caption;
        caption.append(count, captionTitle);
        caption.setAttribute("aria-hidden", "true");
        captions.append(caption);
        const row = document.createElement("div");
        row.className = "results-next-row";
        const label = document.createElement("span");
        label.textContent = `${number(index)} · ${item.title}`;
        const value = document.createElement("span");
        value.textContent = `${item.metric}${item.unit ? " " + item.unit : ""}`;
        row.append(label, value);
        summary.append(row);
        return card;
    });
    let enhanced = false, committed = -1, desired = -1, front = 0, unavailable = false;
    let revision = 0, animations = [], screenAnimations = [], entranceAnimations = [], revealed = false;
    let displayed = -1;
    let loadingTimer = 0, loadingHoldTimer = 0, loadingShownAt = null, releaseLoading = null;
    let headingStartedAt = null, waitingForHeading = false;
    let navigation = null, navigationTimer = 0;
    let geometry = null, scrollFrame = 0, fitFrame = 0, wasVisible = false;
    let pairedLayout = null, readingSnapshot = null;
    let restoring = performance.getEntriesByType("navigation")[0]?.type !== "navigate";
    let baseAvailable = true;
    const restoreKey = "apple-results-reading-position";
    let checkpoint = null;
    try {
        const saved = JSON.parse(sessionStorage.getItem(restoreKey));
        if (restoring && saved?.url === location.href && Number.isFinite(saved.progress) && saved.progress >= 0 && saved.progress <= data.length && saved.width === innerWidth && saved.height === innerHeight &&
            (!location.hash || location.hash === "#results-in-numbers")) checkpoint = saved;
    } catch { /* Storage is optional; current native position remains authoritative. */ }
    if (restoring) document.documentElement.classList.add("results-restoring");
    const cache = new Map();
    const ease = "cubic-bezier(.22,.61,.36,1)";
    const headingLead = 350;
    const headingFallbackDelay = 2000;
    const pointerHover = matchMedia("(hover: hover) and (pointer: fine)");

    function suppressPointerHover() {
        if (!pointerHover.matches || phone.classList.contains("results-hover-suppressed")) return;
        phone.classList.add("results-hover-suppressed");
        phone.addEventListener("pointermove", restorePointerHover, { passive: true });
    }
    function restorePointerHover(event) {
        // Scrolling can synthesize boundary events under a stationary pointer.
        // Only actual mouse/pen movement after the exchange restores pointer intent.
        if (event.pointerType === "touch" || !(event.movementX || event.movementY) ||
            section.classList.contains("results-swapping")) return;
        phone.classList.remove("results-hover-suppressed");
        phone.removeEventListener("pointermove", restorePointerHover);
    }

    intro.addEventListener("animationstart", event => {
        if (event.target !== intro || event.animationName !== "section-reveal") return;
        headingStartedAt = performance.now() - event.elapsedTime * 1000;
        if (!waitingForHeading) return;
        waitingForHeading = false;
        // A missing heading event must never strand the content or cause a late replay.
        if (entranceAnimations[0]?.currentTime >= headingFallbackDelay) return;
        try {
            entranceAnimations.forEach((animation, index) => {
                animation.effect.updateTiming({ delay: headingLead + index * 100 });
                animation.startTime = document.timeline.currentTime;
            });
        } catch { stopEntrance(); }
    });

    function ready(index) {
        if (!cache.has(index)) {
            const image = new Image();
            image.src = data[index].image.getAttribute("src");
            const promise = typeof image.decode === "function" ? image.decode() : new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });
            cache.set(index, promise.catch(reason => { cache.delete(index); throw reason; }));
        }
        return cache.get(index);
    }
    function stopEntrance() {
        waitingForHeading = false;
        entranceAnimations.forEach(animation => animation.cancel());
        entranceAnimations = [];
    }
    function settleCards() {
        animations.forEach(animation => animation.cancel());
        animations = [];
        section.classList.remove("results-swapping");
        cards.forEach((card, index) => {
            card.style.visibility = index === committed ? "visible" : "hidden";
            card.style.opacity = index === committed ? "1" : "0";
            card.style.zIndex = index === committed ? "3" : "2";
            card.style.willChange = "";
            card.inert = true;
        });
        near.style.visibility = committed > 0 ? "visible" : "hidden";
        far.style.visibility = committed > 1 ? "visible" : "hidden";
    }
    function settleScreens() {
        screenAnimations.forEach(animation => animation.cancel());
        screenAnimations = [];
        screens.forEach((screen, index) => {
            screen.style.opacity = index === front && !unavailable && displayed >= 0 ? "1" : "0";
            screen.style.zIndex = index === front ? "2" : "1";
            screen.style.willChange = "";
        });
    }
    function clearLoading() {
        clearTimeout(loadingTimer);
        clearTimeout(loadingHoldTimer);
        loadingTimer = loadingHoldTimer = 0;
        loadingShownAt = null;
        loading.hidden = true;
        // Release an obsolete minimum-duration wait as well as cancelling its timer.
        releaseLoading?.();
        releaseLoading = null;
    }
    function cancel(preserve = false) {
        revision++;
        if (!preserve) { settleCards(); settleScreens(); }
        clearLoading();
        feature.setAttribute("aria-busy", "false");
    }
    function labels(index, failed, evidenceReady = true) {
        near.textContent = index > 0 ? `${number(index - 1)} · ${data[index - 1].title}` : "";
        far.textContent = index > 1 ? `${number(index - 2)} · ${data[index - 2].title}` : "";
        Array.from(summary.children).forEach((row, i) => row.classList.toggle("is-active", i === index + 1));
        Array.from(captions.children).forEach((caption, i) => {
            caption.classList.toggle("is-active", i === index);
            caption.setAttribute("aria-hidden", String(i !== index));
        });
        previous.setAttribute("aria-disabled", String(index === 0));
        next.setAttribute("aria-disabled", String(index === data.length - 1));
        original.href = data[index].link.href;
        error.querySelector("a").href = original.href;
        original.setAttribute("aria-label", data[index].link.getAttribute("aria-label"));
        phone.dataset.screenshotTitle = `${number(index)} / ${total} · ${data[index].title}`;
        phone.dataset.screenshotDescription = data[index].image.alt;
        if (evidenceReady) {
            phone.classList.toggle("is-unavailable", failed);
            error.hidden = !failed;
        }
        section.dataset.resultsIndex = String(index);
    }
    function animate(element, frames, options, group = animations) {
        const animation = element.animate(frames, options);
        group.push(animation);
        animation.finished.catch(() => {});
        return animation;
    }
    async function select(index, { direct = false, explicit = false, force = false } = {}) {
        if (!enhanced || document.hidden) return;
        if (index === desired && !force && !direct) return;
        desired = index;
        suppressPointerHover();
        // Leave the current exchange on screen during decode. A newer request replaces
        // it from its sampled visual position, instead of snapping to a resting card.
        cancel(!direct);
        const ticket = revision;
        if (index === committed && index === displayed && !force) {
            Promise.allSettled([...animations, ...screenAnimations].map(animation => animation.finished)).then(() => {
                if (ticket === revision) { settleCards(); settleScreens(); }
            });
            return;
        }
        loading.textContent = `Loading result ${number(index)}…`;
        feature.setAttribute("aria-busy", "true");
        loadingTimer = setTimeout(() => {
            loadingTimer = 0;
            if (ticket !== revision || !enhanced || document.hidden) return;
            loadingShownAt = performance.now();
            loading.hidden = false;
        }, 1300);
        let failed = false;
        try { await Promise.all([ready(index), frame.decode()]); } catch { failed = true; }
        if (ticket !== revision || !enhanced || document.hidden) return;
        if (failed) clearLoading();
        // A cached reload may restore scroll between decoding and the first scroll frame.
        if (restoring && geometry && scrollY >= geometry.start && scrollY <= geometry.end) {
            const restoredIndex = resolveIndex(scrollY, false);
            revealed = true;
            if (restoredIndex !== index) return select(restoredIndex, { direct: true });
            direct = true;
        }
        const old = committed;
        const direction = index > old ? 1 : -1;
        const moving = !direct && old >= 0 && old !== index && wasVisible;
        if (old !== index || direct) {
            // Batch the only pose reads at a milestone, before cancelling any effects.
            const pose = element => {
                const style = getComputedStyle(element);
                return { opacity: style.visibility === "hidden" ? 0 : Number(style.opacity), transform: style.transform };
            };
            const visual = moving ? cards.map(pose) : [];
            const edges = moving ? [near, far].map(pose) : [];
            const order = moving ? cards.map(card => Number(card.style.zIndex) || 2) : [];
            settleCards();
            if (moving) {
                suppressPointerHover();
                section.classList.add("results-swapping");
                cards.forEach((card, i) => {
                    if (i !== index && visual[i].opacity <= 0) return;
                    card.style.visibility = "visible";
                    card.style.willChange = "transform, opacity";
                    // Keep the existing overlap order when reversing visible cards.
                    card.style.zIndex = visual[i].opacity > 0 ? order[i] : Math.max(...order) + 1;
                    animate(card, [
                        visual[i].opacity > 0 ? visual[i] : { opacity: 0, transform: `translateY(${26 * direction}px) scale(.99)` },
                        { opacity: i === index ? 1 : 0, transform: i === index ? "translateY(0) scale(1)" : `translateY(${-26 * direction}px) scale(.99)` }
                    ], { duration: 400, easing: ease, fill: "both" });
                });
                [[near, 6, .99], [far, 3, .995]].forEach(([edge, travel, scale], i) => {
                    const opacity = index > i ? 1 : 0;
                    if (!opacity && !edges[i].opacity) return;
                    edge.style.visibility = "visible";
                    animate(edge, [
                        edges[i],
                        { transform: `translateY(${-travel * direction}px) scale(${scale})`, offset: .42 },
                        { opacity, transform: "translateY(0) scale(1)" }
                    ], { duration: 400, easing: ease, fill: "both" });
                });
            }
        }
        committed = index;
        labels(index, failed, false);
        // Cards retarget immediately; the two screen buffers can finish their short
        // dissolve safely without holding up a reversal or a newer milestone.
        const exchange = Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
            if (ticket === revision) settleCards();
        });
        await Promise.allSettled(screenAnimations.map(animation => animation.finished));
        if (ticket !== revision || !enhanced || document.hidden) return;
        settleScreens();
        const destination = 1 - front;
        if (!failed) {
            screens[destination].src = data[index].image.src;
            try { await screens[destination].decode(); } catch { failed = true; cache.delete(index); }
        }
        if (ticket !== revision || !enhanced || document.hidden) return;
        clearTimeout(loadingTimer);
        loadingTimer = 0;
        // Fast evidence never waits. Only a pill that was shown gets a brief hold;
        // errors bypass it, and cancellation releases the wait with an obsolete ticket.
        if (!failed && loadingShownAt !== null) {
            const remaining = 280 - (performance.now() - loadingShownAt);
            if (remaining > 0) {
                await new Promise(resolve => {
                    releaseLoading = resolve;
                    loadingHoldTimer = setTimeout(resolve, remaining);
                });
                if (ticket !== revision || !enhanced || document.hidden) return;
            }
        }
        clearLoading();
        unavailable = failed;
        if (!failed) {
            const dissolve = !direct && displayed >= 0 && displayed !== index && wasVisible && !phone.classList.contains("is-unavailable");
            displayed = index;
            front = destination;
            screens[front].style.opacity = "1";
            screens[front].style.zIndex = "2";
            screens[1 - front].style.zIndex = "1";
            if (dissolve) {
                screens[front].style.willChange = "opacity";
                // The previous screen stays opaque; the physical frame never swaps.
                screens[1 - front].style.opacity = "1";
                animate(screens[front], [{ opacity: 0 }, { opacity: 1 }],
                    { duration: 190, easing: "ease-out", fill: "both" }, screenAnimations);
            }
        }
        labels(index, failed);
        if (!failed && error.contains(document.activeElement)) original.focus({ preventScroll: true });
        feature.setAttribute("aria-busy", "false");
        if (failed) status.textContent = `Result ${index + 1}: ${data[index].title}. Evidence unavailable. Retry or use the full screenshot link.`;
        else if (explicit) status.textContent = `Result ${index + 1} of ${data.length}: ${data[index].title}. ${data[index].metric}${data[index].unit ? " " + data[index].unit : ""}.`;
        await Promise.allSettled(screenAnimations.map(animation => animation.finished));
        if (ticket === revision) settleScreens();
        await exchange;
        if (ticket !== revision) return;
        if (!restoring) document.documentElement.classList.remove("results-restoring");
        if (wasVisible && !failed) {
            const adjacent = index + direction;
            if (data[adjacent]) ready(adjacent).catch(() => {});
        }
    }
    function resolveIndex(y, tolerance = true) {
        const position = y - geometry.start;
        const raw = Math.max(0, Math.min(data.length - 1, Math.floor(position / geometry.interval)));
        if (!tolerance || desired < 0 || Math.abs(raw - desired) > 1) return raw;
        const tolerancePx = Math.min(28, geometry.interval * .07);
        if (raw > desired && position < (desired + 1) * geometry.interval + tolerancePx) return desired;
        if (raw < desired && position > desired * geometry.interval - tolerancePx) return desired;
        return raw;
    }
    function reveal() {
        if (revealed || motion.matches || restoring || committed > 0 || document.activeElement && story.contains(document.activeElement)) { revealed = true; return; }
        revealed = true;
        const headingPending = intro.classList.contains("reveal-pending");
        waitingForHeading = headingPending && headingStartedAt === null;
        const lead = waitingForHeading ? headingFallbackDelay :
            headingPending ? Math.max(0, headingLead - (performance.now() - headingStartedAt)) : 0;
        // Opacity lives on the outer layers, independently of card, screen and hover
        // transforms. Default CSS stays visible, including when animation creation fails.
        // Backwards fill holds both layers until the heading leads. The finite native
        // delay also reveals them if the heading's animationstart event never arrives.
        try {
            [[entrance, 0], [feature, 100]].forEach(([element, delay]) => {
                const animation = element.animate([{ opacity: 0 }, { opacity: 1 }],
                    { duration: 560, delay: lead + delay, easing: "ease-out", fill: "backwards" });
                entranceAnimations.push(animation);
                animation.finished.catch(() => {});
            });
        } catch { stopEntrance(); }
    }
    function onScroll() {
        scrollFrame = 0;
        if (!enhanced || !geometry || document.hidden) return;
        const y = window.scrollY;
        const visible = y + innerHeight > geometry.start + geometry.top && y < geometry.end + geometry.height;
        if (!visible) {
            if (wasVisible) { cancel(); stopEntrance(); desired = -1; }
            wasVisible = false;
            return;
        }
        const entering = !wasVisible;
        wasVisible = true;
        const index = navigation ? navigation.index : resolveIndex(y, !entering && !restoring);
        if (navigation) {
            clearTimeout(navigationTimer);
            navigationTimer = setTimeout(finishNavigation, 140);
        }
        select(index, { direct: entering || restoring }).then(() => {
            if (enhanced && wasVisible && !revealed && scrollY >= geometry.revealStart) reveal();
        });
    }
    function scheduleScroll() {
        rememberReading();
        if (!enhanced || scrollFrame || document.hidden) return;
        // Outside the section this is just a cached numeric range check, with no frame/layout work.
        if (!wasVisible && geometry && (scrollY + innerHeight < geometry.start + geometry.top || scrollY > geometry.end + geometry.height)) return;
        suppressPointerHover();
        scrollFrame = requestAnimationFrame(onScroll);
    }
    function navigate(direction) {
        const index = Math.max(0, Math.min(data.length - 1, (desired >= 0 ? desired : committed) + direction));
        if (index === desired) return;
        navigation = { index, top: geometry.start + (index + .5) * geometry.interval };
        // Native smooth scroll only; the explicit destination owns selection until
        // scrollend (or quiet-scroll fallback). User input immediately releases it.
        window.scrollTo({ top: navigation.top, behavior: motion.matches ? "instant" : "smooth" });
        clearTimeout(navigationTimer);
        navigationTimer = setTimeout(finishNavigation, 1000);
        wasVisible = true;
        select(index, { explicit: true });
    }
    function finishNavigation() {
        if (!navigation) return;
        navigation = null;
        clearTimeout(navigationTimer);
        scheduleScroll();
    }
    function interruptNavigation(event) {
        if (!navigation || event.type === "keydown" && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Tab", "Escape"].includes(event.key)) return;
        if (event.type === "pointerdown" && event.target.closest?.(".results-controls")) return;
        window.scrollTo({ top: scrollY, behavior: "instant" });
        finishNavigation();
    }
    window.addEventListener("scrollend", () => {
        if (navigation && Math.abs(scrollY - navigation.top) < 2) finishNavigation();
    });
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(type => window.addEventListener(type, interruptNavigation, { passive: true }));
    previous.addEventListener("click", () => navigate(-1));
    next.addEventListener("click", () => navigate(1));
    error.querySelector("button").addEventListener("click", () => {
        cache.delete(committed);
        select(committed, { explicit: true, direct: true, force: true });
    });
    story.addEventListener("focusin", stopEntrance);
    frame.addEventListener("error", () => { baseAvailable = false; measure(); });
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(type => {
        window.addEventListener(type, () => {
            if (!restoring && !checkpoint) return;
            checkpoint = null;
            restoring = false;
            document.documentElement.classList.remove("results-restoring");
        }, { passive: true });
    });
    window.addEventListener("pagehide", () => {
        finishNavigation();
        try {
            if (enhanced && geometry && scrollY >= geometry.start && scrollY <= geometry.end) {
                sessionStorage.setItem(restoreKey, JSON.stringify({ url: location.href, width: innerWidth, height: innerHeight,
                    progress: (scrollY - geometry.start) / geometry.interval }));
            } else sessionStorage.removeItem(restoreKey);
        } catch { /* Private or storage-disabled browsing still uses native restoration. */ }
        cancel();
        stopEntrance();
    });
    function restoreReading() {
        if (!checkpoint || !enhanced || !geometry) return;
        const top = geometry.start + checkpoint.progress * geometry.interval;
        if (Math.abs(scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" });
        revealed = true;
    }

    function rememberReading() {
        const layout = enhanced ? geometry : pairedLayout;
        // Resize events arrive after reflow; retain the reading position from before reflow.
        if (!layout || layout.width !== innerWidth || layout.viewportHeight !== innerHeight) return;
        const line = scrollY + layout.top;
        const index = enhanced ? resolveIndex(scrollY, false) : pairedLayout.positions.reduce((current, position, i) => position.top <= line + 2 ? i : current, 0);
        const inside = enhanced ? scrollY >= geometry.start - geometry.height * .5 && scrollY <= geometry.end + geometry.height * .5 :
            line >= pairedLayout.positions[0].top - innerHeight * .5 && line <= pairedLayout.positions.at(-1).bottom;
        readingSnapshot = { index, inside, width: innerWidth, height: innerHeight };
    }

    function measure() {
        fitFrame = 0;
        if (document.hidden) return;
        const navHeight = document.querySelector("nav").getBoundingClientRect().height;
        const usable = innerHeight - navHeight - 48;
        const sectionRect = section.getBoundingClientRect();
        const resizedReading = readingSnapshot?.inside && (readingSnapshot.width !== innerWidth || readingSnapshot.height !== innerHeight);
        const reading = resizedReading || sectionRect.top < navHeight + usable * .65 && sectionRect.bottom > navHeight + usable * .35;
        let nearest = enhanced && geometry ? resolveIndex(scrollY, false) : 0;
        if (!enhanced && reading) {
            nearest = pairs.reduce((best, pair, i) => Math.abs(pair.getBoundingClientRect().top - navHeight - 24) < Math.abs(pairs[best].getBoundingClientRect().top - navHeight - 24) ? i : best, 0);
        }
        if (resizedReading) nearest = readingSnapshot.index;
        const hadFocus = story.contains(document.activeElement);
        const focusedPair = pairs.findIndex(pair => pair.contains(document.activeElement));
        if (focusedPair >= 0) nearest = focusedPair;
        const oldMode = enhanced;
        if (navigation && geometry && (geometry.width !== innerWidth || geometry.viewportHeight !== innerHeight || motion.matches)) {
            window.scrollTo({ top: scrollY, behavior: "instant" });
            finishNavigation();
        }
        let fits = baseAvailable && innerWidth >= 1100 && usable >= 520 && !motion.matches;
        if (fits) {
            story.hidden = false;
            story.classList.toggle("results-fit-probe", !enhanced);
            if (!enhanced) story.inert = true;
            section.classList.toggle("results-compact", usable < 680);
            if (intro.parentElement !== stage) stage.prepend(intro);
            story.style.setProperty("--results-top", `${navHeight + 24}px`);
            story.style.setProperty("--results-stage-height", `${usable}px`);
            const headingHeight = intro.getBoundingClientRect().height + parseFloat(getComputedStyle(stage).gap);
            const captionHeight = story.querySelector(".results-caption").getBoundingClientRect().height + 18;
            story.style.setProperty("--results-phone-width", `${Math.min(340, (usable - headingHeight - captionHeight - 16) * .505)}px`);
            const cardHeight = entrance.getBoundingClientRect().height;
            const phoneHeight = feature.getBoundingClientRect().height;
            const margin = enhanced ? 4 : 12;
            fits = Math.max(cardHeight, phoneHeight) + headingHeight + margin <= usable &&
                cards.every(card => card.scrollWidth <= card.clientWidth + 1) &&
                captions.scrollWidth <= captions.clientWidth + 1;
        }
        if (!fits) {
            if (enhanced) { cancel(); stopEntrance(); }
            enhanced = false;
            story.hidden = true;
            story.inert = true;
            story.classList.remove("results-fit-probe");
            baseline.hidden = false;
            pairs.forEach(pair => { pair.querySelector(".results-feature").hidden = false; });
            if (intro.parentElement === stage) story.before(intro);
            section.classList.remove("results-enhanced", "results-compact");
            document.documentElement.classList.remove("results-scroll-layout");
            geometry = null;
            wasVisible = false;
            if (oldMode && reading) window.scrollTo({ top: pairs[nearest].getBoundingClientRect().top + scrollY - navHeight - 24, behavior: "instant" });
            else if (resizedReading) window.scrollTo({ top: pairs[nearest].getBoundingClientRect().top + scrollY - navHeight - 24, behavior: "instant" });
            if (hadFocus) data[nearest].link.focus({ preventScroll: true });
            pairedLayout = { width: innerWidth, viewportHeight: innerHeight, top: navHeight + 24,
                positions: pairs.map(pair => { const rect = pair.getBoundingClientRect(); return { top: rect.top + scrollY, bottom: rect.bottom + scrollY }; }) };
            rememberReading();
            return;
        }
        enhanced = true;
        story.inert = false;
        story.classList.remove("results-fit-probe");
        baseline.hidden = false;
        pairs.forEach(pair => { pair.querySelector(".results-feature").hidden = true; });
        section.classList.add("results-enhanced");
        document.documentElement.classList.add("results-scroll-layout");
        const interval = Math.min(440, Math.max(300, usable * .48));
        story.style.height = `${usable + interval * data.length}px`;
        const start = story.getBoundingClientRect().top + scrollY - navHeight - 24;
        const changed = !geometry || geometry.height !== usable || geometry.interval !== interval || geometry.width !== innerWidth;
        geometry = { start, end: start + interval * data.length, interval, height: usable, viewportHeight: innerHeight, top: navHeight + 24, width: innerWidth };
        // Start when the composition reaches the viewport, rather than while only
        // the heading is entering. Cache this with the other measured geometry.
        geometry.revealStart = start + geometry.top + composition.offsetTop - innerHeight;
        if (reading && changed && (oldMode || pairedLayout || !restoring)) {
            window.scrollTo({ top: start + (nearest + .5) * interval, behavior: "instant" });
            revealed = true;
        }
        if (!frame.src) frame.src = "phone4.webp";
        restoreReading();
        if (!oldMode || changed) {
            cancel();
            desired = -1;
            select(resolveIndex(scrollY, false), { direct: true });
        }
        rememberReading();
        if (!oldMode && focusedPair >= 0) original.focus({ preventScroll: true });
        scheduleScroll();
    }
    function scheduleFit() { if (!fitFrame && !document.hidden) fitFrame = requestAnimationFrame(measure); }
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("resize", scheduleFit, { passive: true });
    motion.addEventListener("change", () => { cancel(); stopEntrance(); measure(); });
    const resize = new ResizeObserver(scheduleFit);
    resize.observe(document.querySelector("nav"));
    resize.observe(document.body);
    resize.observe(deck);
    resize.observe(captions);
    document.fonts?.ready.then(scheduleFit);
    document.fonts?.addEventListener("loadingdone", scheduleFit);
    window.addEventListener("pageshow", event => {
        if (event.persisted) { restoring = true; revealed = true; desired = -1; document.documentElement.classList.add("results-restoring"); }
        scheduleFit();
        scheduleScroll();
        requestAnimationFrame(() => requestAnimationFrame(() => {
            restoreReading();
            if (enhanced && restoring) onScroll();
            if (checkpoint || event.persisted) { checkpoint = null; restoring = false; }
            if (!restoring) document.documentElement.classList.remove("results-restoring");
        }));
    });
    window.addEventListener("popstate", () => { finishNavigation(); restoring = true; revealed = true; desired = -1; scheduleFit(); scheduleScroll(); });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            finishNavigation();
            cancel(); stopEntrance(); desired = -1;
            cancelAnimationFrame(scrollFrame); scrollFrame = 0;
            cancelAnimationFrame(fitFrame); fitFrame = 0;
        } else {
            restoring = true;
            scheduleFit();
            scheduleScroll();
            requestAnimationFrame(() => {
                if (enhanced) onScroll();
                if (!checkpoint) restoring = false;
            });
        }
    });
    measure();
}


// INITIALIZE PAGE INTERACTIONS
document.addEventListener("DOMContentLoaded", () => {
    initMobileNavigation();
    type();
    initServicesCarousel();
    initCareerHighlights();
    initAboutAnimation();
    initSectionReveals();
    initResultsEvidence();
    initContactSection();
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
        const rotation = button(`Autoplay ${name} carousel`, "Autoplay", "work-control--rotation");
        rotation.setAttribute("role", "switch");
        const switchTrack = document.createElement("span");
        switchTrack.className = "work-autoplay-track";
        switchTrack.setAttribute("aria-hidden", "true");
        rotation.append(switchTrack);
        const position = document.createElement("span");
        position.className = "work-position";
        position.setAttribute("aria-live", "off");
        position.setAttribute("aria-atomic", "true");
        const navigation = document.createElement("div");
        navigation.className = "work-navigation";
        navigation.append(previous, position, next);
        controls.append(navigation, rotation);
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
                // Visibility/focus updates must not repeatedly mutate media attributes
                // or issue redundant pause requests to already-idle decoders.
                if (video.autoplay !== play) video.autoplay = play;
                if (visible && Math.abs(slots[index]) <= 1 && video.preload === "none") video.preload = "metadata";
                if (!play) {
                    if (!video.paused) video.pause();
                    return;
                }
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
            if (motion.matches) return;
            userPaused = !userPaused;
            rotation.setAttribute("aria-checked", String(!userPaused));
            if (!userPaused) idleUntil = 0; // A fresh full dwell, even after manual navigation.
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
            rotation.disabled = motion.matches;
            rotation.setAttribute("aria-checked", String(!userPaused && !motion.matches));
            if (motion.matches) finishMove();
            syncVideos();
            schedule();
        }
        paint();
        carousel.classList.add("work-carousel--ready");
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(entries => {
                const inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .1;
                if (visible === inView) return;
                visible = inView;
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

    const viewer = createScreenshotViewer(dialog, open => { modalOpen = open; refreshAll(); });
    if (!viewer) return;
    section.querySelectorAll(".work-expand").forEach(link => viewer.bind(link, () => ({
        src: link.href, alt: link.querySelector("img").alt, title: "Content Management"
    })));
    document.querySelectorAll(".results-phone-link").forEach(link => viewer.bind(link, () => {
        const pair = link.closest(".results-pair");
        const index = pair ? Array.from(pair.parentElement.children).indexOf(pair) + 1 : null;
        return {
            src: link.href,
            alt: pair ? link.querySelector("img").alt : link.dataset.screenshotDescription,
            title: pair ? String(index).padStart(2, "0") + " / " + String(pair.parentElement.children.length).padStart(2, "0") + " · " + pair.querySelector("h3").textContent : link.dataset.screenshotTitle,
            portrait: true
        };
    }));
});
