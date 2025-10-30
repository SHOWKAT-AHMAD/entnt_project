import './Spinner.css'

export default function Spinner({ overlay }) {
  if (overlay) {
    return (
      <div className="spinner-overlay">
        <div className="spinner" />
      </div>
    )
  }
  
  return <div className="spinner" />
}