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
    let scrollIntent = false;
    const pageScrollY = () => window.scrollY;
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
        window.removeEventListener("resize", observeHighlights);
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

    function observeHighlights() {
        if (started) return;
        if (observer) observer.disconnect();
        observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) startCounters();
        }, readingZoneOptions());
        // Individual items can enter the reading zone even in a short mobile viewport.
        section.querySelectorAll(".career-highlights > li").forEach(item => observer.observe(item));
    }

    function observeAfterScroll(event) {
        if (event.target !== document && event.target !== document.body) return;
        const currentScrollY = pageScrollY();
        const movedDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;
        if (!scrollIntent || !movedDown) return;

        removeScrollListeners();
        observeHighlights();
        window.addEventListener("resize", observeHighlights);
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
        window.removeEventListener("resize", observeHighlights);
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

// Reveal within the area below the navbar and above the bottom 16% of the viewport.
// Observe the resting boxes: CSS translate does not move them until the reveal starts.
function initSectionReveals() {
    const elements = Array.from(document.querySelectorAll("[data-scroll-reveal]"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll(".service-box, .skill-box").forEach(card => card.classList.add("hover-ready"));
    if (motion.matches || !("IntersectionObserver" in window)) return;

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
    const mobile = window.matchMedia("(max-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const gap = 24;
    const initialHash = window.location.hash;
    let initialPending = Boolean(resolveSection(initialHash));
    let resizeFrame;
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

    function destination(section) {
        return Math.max(0, layoutTop(visualAnchor(section)) - nav.getBoundingClientRect().height - gap);
    }

    function refreshNativeOffsets() {
        const offset = nav.getBoundingClientRect().height + gap;
        sections.forEach(section => {
            const inset = layoutTop(visualAnchor(section)) - layoutTop(section);
            section.style.scrollMarginTop = `${offset - inset}px`;
        });
    }

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
        window.scrollTo({ top: section ? destination(section) : 0, behavior: motion.matches ? "instant" : "smooth" });
    });

    window.addEventListener("hashchange", () => {
        const section = resolveSection(window.location.hash);
        if (window.location.hash && !section) return;
        initialPending = false;
        refreshNativeOffsets();
        // Back/Forward may restore an old page offset after native body scrolling.
        // Correct in the same event, before paint; clicks use pushState and skip this.
        if (!section) document.body.scrollTop = 0;
        window.scrollTo({ top: section ? destination(section) : 0, behavior: "instant" });
    });

    function queueOffsets() {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(refreshNativeOffsets);
    }
    window.addEventListener("resize", queueOffsets);
    if ("ResizeObserver" in window) new ResizeObserver(queueOffsets).observe(nav);

    // Run before the browser's initial fragment positioning. Native hash changes
    // and history traversal can then use the same measured, animation-free inset.
    refreshNativeOffsets();
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

// INITIALIZE PAGE INTERACTIONS
document.addEventListener("DOMContentLoaded", () => {
    initMobileNavigation();
    type();
    initServicesCarousel();
    initCareerHighlights();
    initAboutAnimation();
    initSectionReveals();
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
    const lightboxContent = dialog.querySelector(".work-lightbox-content");
    const expanded = dialog.querySelector(".work-lightbox-image");
    const viewport = dialog.querySelector(".work-lightbox-viewport");
    const zoom = dialog.querySelector(".work-lightbox-zoom");
    let opener;
    let previousOverflow;
    function updateFitInset() {
        if (!dialog.open) return;
        let inset = 0;
        if (!viewport.classList.contains("work-lightbox-viewport--zoomed") && expanded.naturalWidth && expanded.naturalHeight) {
            // object-fit centers the visible pixels inside the height-capped image box.
            const box = expanded.getBoundingClientRect();
            const visibleWidth = Math.min(box.width, box.height * expanded.naturalWidth / expanded.naturalHeight);
            inset = Math.max(0, (box.width - visibleWidth) / 2);
        }
        lightboxContent.style.setProperty("--work-lightbox-fit-inset", `${inset}px`);
    }
    expanded.addEventListener("load", updateFitInset);
    const fitObserver = new ResizeObserver(updateFitInset);
    fitObserver.observe(expanded);
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
            updateFitInset();
            refreshAll();
        });
    });
    zoom.addEventListener("click", () => {
        const zoomed = viewport.classList.toggle("work-lightbox-viewport--zoomed");
        zoom.textContent = zoomed ? "Fit image" : "Zoom in";
        zoom.setAttribute("aria-pressed", String(zoomed));
        viewport.scrollTo(0, 0);
        updateFitInset();
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
