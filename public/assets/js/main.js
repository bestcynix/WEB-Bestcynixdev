document.addEventListener('DOMContentLoaded', function () {

            const toggleBtn = document.getElementById('toggleDarkMode');
            if (toggleBtn) {
                toggleBtn.classList.add('your-class');
            }

            const element = document.getElementById('myElement');
            if (element) {
                element.style.display = "none";
            }


            const el = document.getElementById('someElement');
            if (el) {
                el.classList.add('your-class');
            }

            const target = document.getElementById('popupBox');
            if (target) {
                target.style.display = "block";
            }




            // Mobile menu toggle
            const hamburger = document.getElementById('hamburger-menu');
            const closeMenu = document.getElementById('close-menu');
            const mobileMenu = document.getElementById('mobile-menu');

            hamburger.addEventListener('click', function () {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            closeMenu.addEventListener('click', function () {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });

            // Site structure toggle
            const structureButton = document.getElementById('structure-button');
            const closeStructure = document.getElementById('close-structure');
            const siteStructure = document.getElementById('site-structure');

            structureButton.addEventListener('click', function () {
                siteStructure.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            closeStructure.addEventListener('click', function () {
                siteStructure.classList.remove('active');
                document.body.style.overflow = '';
            });

            // Nested menu toggles
            const menuToggles = document.querySelectorAll('.menu-toggle');

            menuToggles.forEach(toggle => {
                toggle.addEventListener('click', function () {
                    const targetId = this.getAttribute('data-target');
                    const targetMenu = document.getElementById(targetId);

                    if (targetMenu.classList.contains('active')) {
                        targetMenu.classList.remove('active');
                        this.querySelector('i').classList.remove('fa-chevron-up');
                        this.querySelector('i').classList.add('fa-chevron-down');
                    } else {
                        targetMenu.classList.add('active');
                        this.querySelector('i').classList.remove('fa-chevron-down');
                        this.querySelector('i').classList.add('fa-chevron-up');
                    }
                });
            });

            // Close mobile menu when clicking a link
            window.closeMenu = function () {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            };

            // Back to top button
            const backToTop = document.getElementById('back-to-top');

            window.addEventListener('scroll', function () {
                if (window.pageYOffset > 300) {
                    backToTop.classList.remove('opacity-0', 'invisible');
                    backToTop.classList.add('opacity-100', 'visible');
                } else {
                    backToTop.classList.add('opacity-0', 'invisible');
                    backToTop.classList.remove('opacity-100', 'visible');
                }

                // Update active section in navigation
                const sections = document.querySelectorAll('section');
                const navLinks = document.querySelectorAll('.section-indicator');

                let currentSection = '';

                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.clientHeight;

                    if (window.pageYOffset >= sectionTop - 200) {
                        currentSection = section.getAttribute('id');
                    }
                });

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSection}`) {
                        link.classList.add('active');
                    }
                });
            });

            backToTop.addEventListener('click', function () {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            // Structure search functionality
            const structureSearch = document.getElementById('structure-search');

            structureSearch.addEventListener('input', function () {
                const searchTerm = this.value.toLowerCase();
                const menuItems = document.querySelectorAll('#site-structure a');

                menuItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    const parent = item.closest('li');

                    if (text.includes(searchTerm)) {
                        parent.style.display = '';

                        // If it's in a nested menu, show the parent menu too
                        const nestedMenu = item.closest('.nested-menu');
                        if (nestedMenu) {
                            nestedMenu.classList.add('active');

                            // Update the toggle icon
                            const toggleId = nestedMenu.getAttribute('id');
                            const toggle = document.querySelector(`[data-target="${toggleId}"]`);
                            if (toggle) {
                                toggle.querySelector('i').classList.remove('fa-chevron-down');
                                toggle.querySelector('i').classList.add('fa-chevron-up');
                            }
                        }
                    } else {
                        // Don't hide if it's a parent with children that match
                        const hasMatchingChildren = Array.from(parent.querySelectorAll('a')).some(child =>
                            child.textContent.toLowerCase().includes(searchTerm)
                        );

                        if (!hasMatchingChildren) {
                            parent.style.display = 'none';
                        }
                    }
                });
            });

            // Close menus when clicking outside
            document.addEventListener('click', function (event) {
                if (!mobileMenu.contains(event.target) && !hamburger.contains(event.target)) {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }

                if (!siteStructure.contains(event.target) && !structureButton.contains(event.target)) {
                    siteStructure.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            // Prevent event propagation from menus
            mobileMenu.addEventListener('click', function (event) {
                event.stopPropagation();
            });

            siteStructure.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        });



        document.addEventListener('DOMContentLoaded', function () {
            // Initialize AOS
            AOS.init({
                duration: 800,
                once: true
            });

            /*
            
            // Page transition
            const pageTransition = document.querySelector('.page-transition');
            
            // Show transition when leaving page
            document.querySelectorAll('a[href]:not([target="_blank"])').forEach(link => {
                link.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    if (href !== '#' && !href.startsWith('javascript') && !href.startsWith('#')) {
                        e.preventDefault();
                        pageTransition.classList.add('active');
                        
                        setTimeout(() => {
                            window.location.href = href;
                        }, 500);
                    }
                });
            });
            
            // Hide transition when page loads
            window.addEventListener('pageshow', function() {
                pageTransition.classList.remove('active');
            }); 
            
            */

            // Scroll indicator
            const scrollIndicator = document.querySelector('.scroll-indicator');

            window.addEventListener('scroll', function () {
                const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = (winScroll / height) * 100;

                scrollIndicator.style.width = scrolled + '%';

                // Back to top button
                const backToTop = document.getElementById('back-to-top');
                if (winScroll > 300) {
                    backToTop.classList.remove('opacity-0', 'invisible');
                    backToTop.classList.add('opacity-100', 'visible');
                } else {
                    backToTop.classList.add('opacity-0', 'invisible');
                    backToTop.classList.remove('opacity-100', 'visible');
                }
            });

            // Back to top button click
            document.getElementById('back-to-top').addEventListener('click', function () {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            // Counter animation
            const counterElements = document.querySelectorAll('.counter-value');

            const animateCounter = (el) => {
                const target = parseInt(el.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const step = target / (duration / 16); // 16ms per frame (approx 60fps)
                let current = 0;

                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        el.textContent = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        el.textContent = target;
                    }
                };

                updateCounter();
            };

            // Intersection Observer for counters
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            counterElements.forEach(counter => {
                counterObserver.observe(counter);
            });

            // Skill bars animation
            const skillBars = document.querySelectorAll('.skill-progress');

            const skillObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const width = entry.target.getAttribute('data-width');
                        entry.target.style.width = width;
                        skillObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            skillBars.forEach(bar => {
                skillObserver.observe(bar);
            });

            // Smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;

                    e.preventDefault();

                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Mobile menu toggle
            const hamburgerMenu = document.getElementById('hamburger-menu');
            const closeMenu = document.getElementById('close-menu');
            const mobileMenu = document.getElementById('mobile-menu');

            hamburgerMenu.addEventListener('click', function () {
                mobileMenu.classList.add('active');
            });

            closeMenu.addEventListener('click', function () {
                mobileMenu.classList.remove('active');
            });

            // Close mobile menu when clicking a link
            window.closeMenu = function () {
                mobileMenu.classList.remove('active');
            };
        });

        // Page transition effect
        document.addEventListener("DOMContentLoaded", () => {
            const pageTransition = document.getElementById('pageTransition');

            // ✅ ลิงก์ทั้งหมดที่ไม่ใช่ anchor หรือ JS
            document.querySelectorAll('a[href]:not([target="_blank"])').forEach(link => {
                link.addEventListener('click', function (e) {
                    const href = this.getAttribute('href');
                    if (
                        href !== '#' &&
                        !href.startsWith('javascript') &&
                        !href.startsWith('#')
                    ) {
                        e.preventDefault();

                        // ✅ เพิ่ม class เพื่อเริ่ม transition
                        if (pageTransition) {
                            pageTransition.classList.add('active');
                        }

                        setTimeout(() => {
                            window.location.href = href;
                        }, 500);
                    }
                });
            });

            // ✅ ซ่อน transition เมื่อโหลดหน้าใหม่
            window.addEventListener('pageshow', function () {
                if (pageTransition) {
                    pageTransition.classList.remove('active');
                }
            });
        });





        // ข้อมูลสไลด์
        document.addEventListener('DOMContentLoaded', () => {
            // ข้อมูลสไลด์
            const slides = {
                detail1: Array.from({ length: 13 }, (_, i) => `assets/img/portfolio/Portfolio-1/${i + 1}.png`),
                detail2: Array.from({ length: 12 }, (_, i) => `assets/img/niceshopallforme-shop/${i + 1}.jpg`),
                detail3: Array.from({ length: 2 }, (_, i) => `assets/img/qr/${i + 1}.jpg`),
                detail4: Array.from({ length: 10 }, (_, i) => `assets/img/lifecraftedpath/${i + 1}.jpg`)
            };

            const slideIndex = { detail1: 0, detail2: 0, detail3: 0, detail4: 0 };

            let scrollTop = 0;

            // ล็อก scroll ของพื้นหลังโดยไม่กระทบสี/รูป
            function lockScroll() {
                scrollTop = window.scrollY || document.documentElement.scrollTop;
                if (document.body) document.body.style.overflow = 'hidden';
                if (document.documentElement) document.documentElement.style.overflow = 'hidden';
            }

            // ปลดล็อก scroll ของพื้นหลัง
            function unlockScroll() {
                if (document.body) document.body.style.overflow = '';
                if (document.documentElement) document.documentElement.style.overflow = '';
                window.scrollTo(0, scrollTop);
            }

            // เปิด Modal
            window.openDetail = function (id) {
                const modal = document.getElementById(id);
                if (!modal) return;
                modal.classList.remove('hidden');
                modal.classList.add('flex');

                lockScroll();
                slideIndex[id] = 0;
                updateSlide(id);
            }

            // ปิด Modal
            window.closeDetail = function (id) {
                const modal = document.getElementById(id);
                if (!modal) return;
                modal.classList.add('hidden');
                modal.classList.remove('flex');

                unlockScroll();
            }

            // เลื่อนสไลด์ไปถัดไป
            window.nextSlide = function (id) {
                if (!slides[id]) return;
                slideIndex[id] = (slideIndex[id] + 1) % slides[id].length;
                updateSlide(id);
            }

            // เลื่อนสไลด์ไปก่อนหน้า
            window.prevSlide = function (id) {
                if (!slides[id]) return;
                slideIndex[id] = (slideIndex[id] - 1 + slides[id].length) % slides[id].length;
                updateSlide(id);
            }

            // อัปเดตรูปใน modal
            function updateSlide(id) {
                const img = document.getElementById('slide-' + id);
                if (img && slides[id]) img.src = slides[id][slideIndex[id]];
            }

            // อัปเดตปีอัตโนมัติ
            const yearEl = document.getElementById('currentYear');
            if (yearEl) yearEl.textContent = new Date().getFullYear();
        });