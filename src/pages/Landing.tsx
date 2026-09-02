import { useNavigate } from 'react-router-dom'
import dishuWhite from '../assets/logos/dishu-white.svg'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing-content">
        <img src={dishuWhite} alt="Dishu" className="landing-wordmark" />
        <p className="landing-subtitle">Tech Support Training Platform</p>
        <button className="landing-cta" onClick={() => navigate('/logs')}>
          View Support Logs
        </button>
      </div>
    </div>
  )
}
