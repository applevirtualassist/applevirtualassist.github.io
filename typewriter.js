// HERO TYPEWRITER
const words = [" Real Estate VA.", " Social Media Manager.", " Graphic Designer."];
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
    { element: introNumber, text: "5+ clients" },
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


// START BOTH TYPEWRITERS
document.addEventListener("DOMContentLoaded", () => {
    type();

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
