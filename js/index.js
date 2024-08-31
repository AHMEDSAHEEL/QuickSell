

document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('#hero button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            alert(`Button clicked: ${this.textContent}`);
        });
    });

    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('open');
    });

    // Intersection Observer for Hero Section
    const hero = document.querySelector('#hero');
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                hero.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });
    heroObserver.observe(hero);

    // Intersection Observer for How It Works Section
    const steps = document.querySelectorAll('.step');
    const stepsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });
    steps.forEach(step => {
        stepsObserver.observe(step);
    });

    // Intersection Observer for Products Section
    const products = document.querySelector('#products');
    const productsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                products.classList.add('animate');
                // Animate product cards individually
                const productCards = document.querySelectorAll('.product-card');
                productCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('animate');
                    }, index * 100); // Stagger animation by 100ms
                });
            }
        });
    }, { threshold: 0.1 });
    productsObserver.observe(products);
});
