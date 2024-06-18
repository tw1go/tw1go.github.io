import bannerWaves from '../assets/banner-waves.mp4';

export default function Banner() {
  return (
    <section className="banner">
      <div className="banner__background">
        <video autoPlay muted loop playsInline className='banner__background-video'>
          <source src={bannerWaves} type="video/mp4" />
        </video>
      </div>
      <div className='banner__headline'>
        <h1 className='banner__headline-text'>Riding the <span>waves</span> of innovation.</h1>
      </div>
    </section>
  )
}