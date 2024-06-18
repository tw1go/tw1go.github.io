import React, { useEffect, useRef } from "react";
import havingHand from '../assets/waving-hand.png';
import waves from '../assets/waves.png';
import boat from '../assets/boat.png';
import island from '../assets/island.png';
import coconut from '../assets/coconut-1.png';
import coconut2 from '../assets/coconut-2.png';

export default function Introduction() {
  const waveRowRefs = useRef([null, null, null]); // Initialize an array of refs
  
  useEffect(() => {
    const waveImages = waveRowRefs.current
      .map(ref => ref?.querySelectorAll('img') || [])
      .flat();

    waveImages.forEach((element) => {
      if (element) {
        element.forEach((img, i) => {
          img.style.transform = 'translateX(' + (img.offsetWidth * i) + 'px)';
        })
      }
    });

    const speed = 75; // Pixels per second

    waveImages.forEach(element => {
      if (element) {
        element.forEach(img => {
          let lastTime = performance.now();
          let initialLeft = img.getBoundingClientRect().left;
          let width = img.getBoundingClientRect().width;
          let position = initialLeft;

          const animation = (timestamp) => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;  // Calculate elapsed time in seconds

            position -= speed * deltaTime;  // Update position based on speed and elapsed time

            // If the element has moved out of view, reset its position to the right side
            if (position + width < 0) {
              position = window.innerWidth;
            }

            img.style.transform = 'translateX(' + position + 'px)';  // Apply transformation

            lastTime = currentTime;  // Update lastTime for the next frame
            requestAnimationFrame(animation);
          };

          requestAnimationFrame(animation);
        });
      }
    });
  }, []); // Empty dependency array ensures this effect runs only once

  return (
    <section className="introduction">
      <div className="introduction__wrapper">
        <div className='introduction__text'>
          <div className='introduction__waving'>
            <img src={havingHand} alt='Waving hand' />
          </div>
          <h2 className="introduction__title">
            Hi! I'm <span className="introduction__title--highlight">Earl Gerald</span>, a web developer.
          </h2>
          <p className="introduction__description">
            Passionate about creating websites that are not only visually appealing but also functional and user-friendly. 
            Always eager to learn new technologies and improve skills to provide the best solutions for my clients.
          </p>
        </div>
      </div>
      <div className='introduction__waves'>
        <div className='introduction__wave-row' ref={el => waveRowRefs.current[0] = el}>
          <img src={waves} alt='Waves' />
          <img src={waves} alt='Waves' />
        </div>
        <div className='introduction__wave-row' ref={el => waveRowRefs.current[1] = el}>
          <img src={waves} alt='Waves' />
          <img src={waves} alt='Waves' />
        </div>
        <div className='introduction__wave-row' ref={el => waveRowRefs.current[2] = el}>
          <img src={waves} alt='Waves' />
          <img src={waves} alt='Waves' />
        </div>
      </div>
      <div className='introduction__island'>
        <img src={island} alt='Island' className='sand' />
        <img src={coconut} alt='Coconut' className='coconut' />
        <img src={coconut2} alt='Coconut' className='coconut' />
      </div>
      <div className='introduction__boat'>
        <img src={boat} alt='Boat' />
      </div>
    </section>
  );
}