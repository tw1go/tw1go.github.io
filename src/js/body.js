import React, { useEffect } from "react";

const Body = () => {

  useEffect(() => {
    const sections = document.querySelectorAll('section');

    const throttle = (func, delay) => {
      let timeoutId;
      let lastExecuted = 0;

      return function() {
        const context = this;
        const args = arguments;
        const now = Date.now();

        if (now - lastExecuted >= delay) {
          func.apply(context, args);
          lastExecuted = now;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            func.apply(context, args);
            lastExecuted = now;
          }, delay - (now - lastExecuted));
        }
      };
    };

    const init = () => {
      window.addEventListener('wheel', throttle(handleScroll, 1000)); // Pass handleScroll without invoking it
    };

    const currentSection = () => {
      const scrollPosition = window.scrollY;

      for (const section of sections) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          return section;
        }
      }

      // If no section is found, return null or handle accordingly
      return null;
    };

    const handleScroll = (e) => {
      if (e.deltaY > 0) {
        if(currentSection().nextElementSibling) {
          window.scrollTo({
            top: currentSection().nextElementSibling.offsetTop,
            behavior: 'smooth'
          });

          if(!currentSection().nextElementSibling.classList.contains('loaded')) {
            currentSection().nextElementSibling.classList.add('loaded');
          }
        }
      } else {
        if(currentSection().previousElementSibling) {
          window.scrollTo({
            top: currentSection().previousElementSibling.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    }

    init();

    // Cleanup function to remove event listener when component unmounts
    return () => {
      window.removeEventListener('wheel', throttle(handleScroll, 1000));
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return <></>; // Empty fragment since this component doesn't render any UI

};

export default Body;