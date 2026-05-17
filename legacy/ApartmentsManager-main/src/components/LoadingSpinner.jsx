import ScaleLoader from 'react-spinners/ScaleLoader'

const LoadingSpinner = () =>{
  return (
    <div className="container loader__container"> 
        <ScaleLoader color={"var(--primary-color)"} />
    </div>
  )
}

export default LoadingSpinner